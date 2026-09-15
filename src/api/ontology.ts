/**
 * Data access layer for DRKN ontology domain entities — Batch 1 adapter.
 *
 * 读取不再来自模块级 mock 数组，而是通过 ontology-v1 类型化 HTTP Client 访问
 * 契约 Mock 服务（ontology-delivery/mock-server，meta.dataMode=MOCK，未连接生产服务）。
 * 组件继续消费旧版 ObjectType/LinkType/... 形状；它们是服务端
 * ObjectTypeDefinition/RelationDefinition 的只读投影，分阶段迁移（Batch 2/3）。
 *
 * 写入：对象类型的更新/新增已走真实 ChangeSet operations（If-Match + 幂等键，
 * 修订号由服务端递增）。关系与能力的整组替换尚未迁移（Batch 3），显式抛错而非
 * 本地数组伪造成功。校验项仍为静态遗留数据（Batch 4 由真实校验任务取代）。
 */

import {
  INITIAL_VALIDATION_ITEMS,
} from '../data';
import type {
  ObjectType,
  LinkType,
  Capability,
  DRKNWorkflow,
  ChangeSet,
  ValidationItem,
} from '../types';
import {ontologyV1} from './ontology-v1/client';
import {newIdempotencyKey} from './ontology-v1/ontologyClient';
import type {
  ActionContract,
  ChangeSet as V1ChangeSet,
  DiffItem,
  EditOperation,
  ImplementationBinding,
  ModelDocument,
  ObjectTypeDefinition,
  PropertyDefinition,
  Registry,
  RelationDefinition,
  ViewReference,
} from './ontology-v1/types.generated';

/**
 * 旧应用只有一个隐式 DRKN 模型。Batch 2 引入 ModelContext 后，
 * modelId/视图由 URL 提供，此常量将被移除。
 */
const LEGACY_MODEL_ID = 'drkn-core';

// ---- 服务端视图解析 ----

interface ResolvedDraft {
  view: ViewReference;
  document: ModelDocument;
}

/**
 * 旧 UI 没有 URL 视图参数，这里解析为：优先 OPEN 草稿的最新修订，
 * 否则回退当前正式版本（只读）。不隐式编造草稿。
 */
async function resolveDefaultDocument(): Promise<ResolvedDraft> {
  const model = (await ontologyV1.getModel(LEGACY_MODEL_ID)).data;
  if (model.activeChangeSetId) {
    const cs = (await ontologyV1.getChangeSet(LEGACY_MODEL_ID, model.activeChangeSetId)).data;
    const view: ViewReference = {changeSetId: cs.id, revision: cs.revision};
    return {view, document: (await ontologyV1.getView(LEGACY_MODEL_ID, view)).data.document};
  }
  if (model.currentVersionId) {
    const view: ViewReference = {versionId: model.currentVersionId};
    return {view, document: (await ontologyV1.getView(LEGACY_MODEL_ID, view)).data.document};
  }
  throw new Error('模型既无草稿也无正式版本，无法读取');
}

async function requireOpenDraft(): Promise<V1ChangeSet> {
  const model = (await ontologyV1.getModel(LEGACY_MODEL_ID)).data;
  if (!model.activeChangeSetId) {
    throw new Error('当前没有进行中的草稿；已发布的正式版本不可直接编辑，请先创建新草稿');
  }
  return (await ontologyV1.getChangeSet(LEGACY_MODEL_ID, model.activeChangeSetId)).data;
}

/** 整批 operations 原子提交到当前 OPEN 草稿，返回服务端递增后的 ChangeSet。 */
async function submitOperations(operations: EditOperation[]): Promise<V1ChangeSet> {
  const cs = await requireOpenDraft();
  const result = await ontologyV1.applyOperations(
    LEGACY_MODEL_ID, cs.id, {operations}, cs.etag, newIdempotencyKey(),
  );
  return result.data;
}

// ---- generated → legacy 投影 ----

/** 服务端分组到旧页面四分组的粗粒度归并；Batch 2 按服务端分组直出。 */
const GROUP_BY_SERVER_GROUP: Record<string, ObjectType['group']> = {
  '来源与结构': '核心数据对象',
  '画像与观测': '质量治理对象',
  '数据质量': '质量治理对象',
  '数据语义': '语义治理对象',
  '证据与责任': '语义治理对象',
  '外部契约引用': '运行治理对象',
};

function propertyStatus(view: ViewReference): 'Published' | 'Draft' {
  return 'versionId' in view ? 'Published' : 'Draft';
}

function mapObjectType(t: ObjectTypeDefinition, view: ViewReference): ObjectType {
  const status = propertyStatus(view);
  return {
    id: t.id,
    nameCn: t.nameCn,
    description: t.definition,
    group: GROUP_BY_SERVER_GROUP[t.group] ?? '核心数据对象',
    // 实例数不属于模型定义合同（见 IMPLEMENTATION_SPEC §4），禁止编造，显示 0。
    instanceCount: 0,
    properties: t.properties.map((p) => ({
      name: p.code,
      dataType: p.valueType,
      // 语义类型/置信度是断言记录的内容，不在属性定义中；UNKNOWN 表示证据不足的语义值。
      semanticType: 'UNKNOWN',
      confidence: 0,
      owner: t.ownerService,
      status,
      description: p.definition,
    })),
    lifecycle: [],
    status,
    owner: t.ownerService,
  };
}

function mapRelation(r: RelationDefinition): LinkType {
  const targetMulti = r.targetCardinality.max === null || r.targetCardinality.max > 1;
  const sourceMulti = r.sourceCardinality.max === null || r.sourceCardinality.max > 1;
  return {
    id: r.id,
    nameCn: r.nameCn,
    sourceObjId: r.sourceTypeId,
    targetObjId: r.targetTypeId,
    direction: `${r.sourceTypeId} → ${r.targetTypeId}`,
    // 旧页面只有三档粗基数；由双端 target/sourceCardinality 近似归并。Batch 3 直出精确基数。
    cardinality: targetMulti && sourceMulti ? 'N:M' : targetMulti ? '1:N' : '1:1',
    isLineage: r.category === 'PROVENANCE',
    // 旧字段无服务端来源（合同中已移除），Batch 3 删除；先固定为 false，不冒充真实鉴权。
    isAiVisible: false,
    requiresAuth: false,
    description: r.definition,
  };
}

function mapActionToCapability(
  a: ActionContract,
  workflowRefs: ModelDocument['workflowRefs'],
): Capability {
  const workflows = workflowRefs
    .filter((w) => w.requiredActionIds.includes(a.id))
    .map((w) => `${w.workflowId}@${w.workflowVersionId}`);
  return {
    id: a.id,
    name: a.nameCn,
    type: 'action',
    inputObject: a.inputTypeIds.join('、'),
    outputObjectOrStatus: a.outputTypeIds.join('、'),
    isAiEnabled: a.confirmationMode === 'EXPLICIT' ? '可建议' : '否',
    workflows,
    permissions: a.ownerService,
    description: a.definition,
  };
}

function mapFunctionBindingToCapability(
  b: ImplementationBinding,
  registry: Registry,
): Capability {
  const impl = registry.implementations.find(
    (i) => i.id === b.implementationId && i.versionId === b.implementationVersionId,
  );
  return {
    id: b.id,
    name: impl ? impl.nameCn : `${b.implementationId}@${b.implementationVersionId}`,
    type: 'function',
    inputObject: b.inputContractRef,
    outputObjectOrStatus: b.outputContractRef,
    isAiEnabled: '否',
    workflows: [],
    permissions: impl?.ownerService ?? 'unknown',
    description: impl
      ? `注册实现 ${b.implementationId}@${b.implementationVersionId}（transport=${impl.transport}，线上端点${impl.liveEndpointVerified ? '已验证' : '未验证'}）`
      : `注册实现 ${b.implementationId}@${b.implementationVersionId}（Registry 中未找到该版本）`,
  };
}

function mapWorkflowRef(w: ModelDocument['workflowRefs'][number], registry: Registry): DRKNWorkflow {
  const registered = registry.workflows.find(
    (x) => x.id === w.workflowId && x.versionId === w.workflowVersionId,
  );
  return {
    id: w.id,
    name: registered?.nameCn ?? w.workflowId,
    description: registered?.description ?? `流程引用 ${w.workflowId}@${w.workflowVersionId}，责任方 ${w.ownerService}`,
    status: registered?.executable ? 'Active' : 'Draft',
    nodes: [],
    // 运行统计由外部 Runtime 管理，本体只保存引用；不伪造运行数据。
    runCount: 0,
    successRate: 0,
  };
}

const DIFF_ENTRY_TYPE: Record<DiffItem['collection'], ChangeSet['changes'][number]['type']> = {
  objectTypes: 'modify_property',
  relations: 'add_link',
  constraints: 'modify_property',
  actions: 'bind_capability',
  implementationBindings: 'bind_capability',
  workflowRefs: 'modify_workflow',
  dependencies: 'modify_property',
};

const DIFF_CHANGE_CN: Record<DiffItem['change'], string> = {
  ADD: '新增',
  MODIFY: '修改',
  REMOVE: '移除',
};

function mapChangeSet(cs: V1ChangeSet, diffItems: DiffItem[]): ChangeSet {
  return {
    id: cs.id,
    title: cs.name,
    description: cs.reason,
    date: cs.createdAt,
    status: cs.status === 'OPEN' ? 'editing' : 'published',
    changes: diffItems.map((item) => ({
      type: item.collection === 'objectTypes' && item.change === 'ADD'
        ? 'add_object'
        : DIFF_ENTRY_TYPE[item.collection],
      target: item.id,
      description: `${DIFF_CHANGE_CN[item.change]} ${item.collection}/${item.id}`,
    })),
  };
}

// ---- Reads（真实 HTTP）----

export async function fetchObjectTypes(): Promise<ObjectType[]> {
  const {view, document} = await resolveDefaultDocument();
  return document.objectTypes.map((t) => mapObjectType(t, view));
}

export async function fetchLinkTypes(): Promise<LinkType[]> {
  const {document} = await resolveDefaultDocument();
  return document.relations.map(mapRelation);
}

export async function fetchCapabilities(): Promise<Capability[]> {
  const [{document}, registryResult] = await Promise.all([
    resolveDefaultDocument(),
    ontologyV1.registry(),
  ]);
  const registry: Registry = registryResult.data;
  return [
    ...document.actions.map((a) => mapActionToCapability(a, document.workflowRefs)),
    ...document.implementationBindings
      .filter((b) => b.kind === 'FUNCTION')
      .map((b) => mapFunctionBindingToCapability(b, registry)),
  ];
}

export async function fetchWorkflows(): Promise<DRKNWorkflow[]> {
  const [{document}, registryResult] = await Promise.all([
    resolveDefaultDocument(),
    ontologyV1.registry(),
  ]);
  return document.workflowRefs.map((w) => mapWorkflowRef(w, registryResult.data));
}

export async function fetchChangeSets(): Promise<ChangeSet[]> {
  const list = (await ontologyV1.listChangeSets(LEGACY_MODEL_ID)).data;
  const legacy: ChangeSet[] = [];
  for (const cs of list.items) {
    // 旧页面没有“已放弃”状态，ABANDONED 草稿不投影；Batch 4 直出服务端状态。
    if (cs.status === 'ABANDONED') continue;
    const diff = await ontologyV1.diff(LEGACY_MODEL_ID, cs.id, cs.revision);
    legacy.push(mapChangeSet(cs, diff.data.items));
  }
  return legacy;
}

/**
 * @deprecated 静态遗留数据。校验必须由 POST validation-runs → 202 → 轮询 job 的
 * 真实任务产生（Batch 4 新增 OntologyValidation.tsx 时替换）。
 */
export async function fetchValidationItems(): Promise<ValidationItem[]> {
  return INITIAL_VALIDATION_ITEMS;
}

// ---- Writes（对象类型走真实 ChangeSet operations）----

export interface ChangeSetEntry {
  type: 'add_object' | 'modify_property' | 'add_link' | 'modify_workflow' | 'bind_capability';
  target: string;
  description: string;
}

const ID_PATTERN = /^[A-Za-z][A-Za-z0-9_.:-]*$/;

/** 合同要求 ID 形如 ^[A-Za-z][A-Za-z0-9_.:-]*$；非法字符折叠为 _，空结果回退固定名。 */
function sanitizeId(raw: string, fallbackPrefix: string): string {
  const cleaned = raw.replace(/[^A-Za-z0-9_.:-]/g, '_').replace(/^([^A-Za-z])/, 'T$1');
  return cleaned || `${fallbackPrefix}_${Math.random().toString(36).slice(2, 8)}`;
}

const VALUE_TYPE_BY_LEGACY: Record<string, PropertyDefinition['valueType']> = {
  string: 'string', text: 'string', varchar: 'string',
  int: 'integer', integer: 'integer', long: 'integer', bigint: 'integer',
  double: 'number', float: 'number', number: 'number', decimal: 'number',
  boolean: 'boolean', bool: 'boolean',
  datetime: 'datetime', date: 'datetime', timestamp: 'datetime',
  object: 'object', array: 'array', json: 'json',
};

function mapValueType(legacyType: string): PropertyDefinition['valueType'] {
  return VALUE_TYPE_BY_LEGACY[legacyType.toLowerCase()] ?? 'string';
}

function legacyPropertyToDefinition(
  p: ObjectType['properties'][number], index: number,
): PropertyDefinition {
  const code = sanitizeId(p.name, `property_${index + 1}`);
  return {
    id: code,
    code,
    nameCn: p.name,
    valueType: mapValueType(p.dataType),
    required: false,
    isIdentity: false,
    definition: p.description || p.name,
  };
}

/** 新建本地类型：字段以合同定义为准，旧形状中不属于合同的信息（置信度等）丢弃。 */
function newTypeDefinition(newObj: ObjectType): ObjectTypeDefinition {
  const id = sanitizeId(newObj.id, 'CustomType');
  return {
    id,
    code: id,
    nameCn: newObj.nameCn || newObj.id,
    group: newObj.group,
    ownerService: ID_PATTERN.test(newObj.owner) ? newObj.owner : 'platform-team',
    origin: 'LOCAL',
    definition: newObj.description || `${newObj.nameCn || newObj.id} 的本地类型定义`,
    properties: newObj.properties.map(legacyPropertyToDefinition),
  };
}

/**
 * 基于服务端当前修订合并用户可编辑字段（名称、定义、属性行），
 * 服务端拥有的 group/ownerService/origin 不被旧形状的粗投影回写覆盖。
 */
function mergeServerType(current: ObjectTypeDefinition, updated: ObjectType): ObjectTypeDefinition {
  return {
    ...current,
    nameCn: updated.nameCn || current.nameCn,
    definition: updated.description || current.definition,
    properties: updated.properties.map((p, i) => {
      const existing = current.properties.find(
        (c) => c.code === p.name || c.nameCn === p.name,
      );
      if (!existing) return legacyPropertyToDefinition(p, i);
      return {
        ...existing,
        definition: p.description || existing.definition,
        valueType: mapValueType(p.dataType),
      };
    }),
  };
}

/**
 * 保存单个对象类型：UPSERT 完整 ObjectTypeDefinition 到当前草稿。
 * 成功后修订号 rN 由服务端递增；失败（412 等）抛 OntologyApiError。
 */
export async function updateObjectType(updated: ObjectType): Promise<ObjectType> {
  const {view, document} = await resolveDefaultDocument();
  const current = document.objectTypes.find((t) => t.id === updated.id);
  if (!current) {
    throw new Error(`对象类型 ${updated.id} 不存在于当前修订`);
  }
  if ('versionId' in view) {
    throw new Error('当前读取的是已发布正式版本，不可直接编辑；请先创建/继续草稿');
  }
  await submitOperations([{
    op: 'UPSERT', collection: 'objectTypes', id: current.id,
    value: mergeServerType(current, updated),
  }]);
  return updated;
}

/**
 * 新增对象类型：UPSERT 到当前草稿。返回服务端投影（instanceCount 等不属合同的字段为 0）。
 */
export async function addObjectType(newObj: ObjectType): Promise<ObjectType> {
  const definition = newTypeDefinition(newObj);
  const cs = await submitOperations([{
    op: 'UPSERT', collection: 'objectTypes', id: definition.id, value: definition,
  }]);
  void cs;
  const view: ViewReference = {changeSetId: cs.id, revision: cs.revision};
  return mapObjectType(definition, view);
}

/**
 * @notImplementedYet Batch 3：关系编辑将通过 operations 写当前 ChangeSet
 * （服务端持有精确双端基数/分类，旧 LinkType 无法无损往返）。当前显式失败，
 * 不用本地数组伪造保存。
 */
export async function replaceLinkTypes(_next: LinkType[]): Promise<LinkType[]> {
  void _next;
  throw new Error('关系编辑尚未接入 ChangeSet operations（Batch 3）；当前页面为只读');
}

/**
 * @notImplementedYet Batch 3：实现绑定编辑将通过 operations 写当前草稿。
 */
export async function replaceCapabilities(_next: Capability[]): Promise<Capability[]> {
  void _next;
  throw new Error('实现绑定编辑尚未接入 ChangeSet operations（Batch 3）；当前页面为只读');
}

/**
 * “进入编辑”现在读取真实服务端状态：存在 OPEN 草稿即处于编辑中；
 * 若草稿已发布/放弃，抛错说明需新建草稿（创建入口在 Batch 2 接入）。
 */
export async function activateDraftChangeSet(): Promise<ChangeSet[]> {
  await requireOpenDraft();
  return fetchChangeSets();
}
