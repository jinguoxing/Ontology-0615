/**
 * Batch 2 冒烟脚本：模型上下文路由解析 + 本体列表 / 总览 / 对象类型的真实 HTTP 流程。
 * 用法：
 *   MOCK_DB_PATH=/tmp/ontology-smoke-batch2.json PORT=4312 ENABLE_DEMO_RESET=true \
 *     node ontology-delivery/mock-server/server.mjs &
 *   ONTOLOGY_API_BASE=http://127.0.0.1:4312 npx tsx scripts/smoke-batch2.ts
 * 使用独立端口 + 临时 MOCK_DB_PATH，避免污染默认演示数据（写操作真实落库）。
 */
import {
  parseOntologyRoute, parseOntologyPath, ontologyLocation, isOntologyUrl, ONTOLOGY_LIST_PATH,
} from '../src/api/ontology-v1/routeContext';
import {ontologyV1} from '../src/api/ontology-v1/client';
import {OntologyApiError, newIdempotencyKey} from '../src/api/ontology-v1/ontologyClient';
import {useDemoIdentity} from '../src/ontology/identity';

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) { console.error(`FAIL: ${msg}`); process.exit(1); }
  console.log(`ok - ${msg}`);
}

/** 抓取 OntologyApiError 并返回，避免把契约错误当断言失败。 */
async function expectApiError(fn: () => Promise<unknown>): Promise<OntologyApiError | null> {
  try { await fn(); return null; } catch (e) { return e instanceof OntologyApiError ? e : null; }
}

// ---------- 一、routeContext：URL 是领域上下文唯一 Source of Truth ----------

const BASE = '/business-semantics/ontologies';

/** ViewReference 是互斥联合，断言前先收窄到草稿成员。 */
type DraftView = {changeSetId: string; revision: number};
function asDraft(r: ReturnType<typeof parseOntologyRoute>): DraftView | null {
  return r && 'changeSetId' in r.view ? r.view as DraftView : null;
}

const versionRoute = parseOntologyRoute(`${BASE}/drkn-core/object-types`, '?versionId=v1.3.0');
assert(versionRoute && 'versionId' in versionRoute.view && versionRoute.view.versionId === 'v1.3.0',
  '正式版本深链接：versionId 视图可解析');

const draftRoute = asDraft(parseOntologyRoute(`${BASE}/drkn-core/object-types`, '?changeSetId=cs-drkn-demo&revision=12'));
assert(draftRoute?.changeSetId === 'cs-drkn-demo' && draftRoute?.revision === 12,
  '草稿深链接：changeSetId+revision 视图可解析');

assert(parseOntologyRoute(`${BASE}/drkn-core/object-types`, '?versionId=v1.3.0&changeSetId=cs-drkn-demo') === null,
  'versionId 与 changeSetId 互斥：同时携带返回 null');
assert(parseOntologyRoute(`${BASE}/drkn-core/object-types`, '?versionId=v1.3.0&revision=12') === null,
  '正式版本不允许携带 revision：返回 null');
assert(parseOntologyRoute(`${BASE}/drkn-core/object-types`, '?changeSetId=cs-drkn-demo') === null,
  '草稿缺 revision：返回 null');
assert(parseOntologyRoute(`${BASE}/drkn-core/object-types`, '?changeSetId=cs-drkn-demo&revision=abc') === null,
  'revision 非整数：返回 null');

const barePath = parseOntologyPath(`${BASE}/drkn-core/overview`, '');
assert(parseOntologyRoute(`${BASE}/drkn-core/overview`, '') === null && barePath?.modelId === 'drkn-core' && barePath.tab === 'overview',
  '无视图参数：route 为 null 但路径可解析（由 ModelContext 读 ModelSummary 后 replace 补齐）');

const selectedRoute = parseOntologyRoute(`${BASE}/drkn-core/object-types`, '?versionId=v1.3.0&selected=Field');
assert(selectedRoute?.selectedId === 'Field', 'selectedId 走 URL selected 参数');

assert(parseOntologyRoute(`${BASE}/drkn-core/no-such-tab`, '?versionId=v1.3.0') === null,
  '非法 tab 返回 null');
assert(isOntologyUrl(ONTOLOGY_LIST_PATH) && isOntologyUrl(`${BASE}/drkn-core/overview`) && !isOntologyUrl('/overview'),
  'isOntologyUrl 区分本体空间与遗留路由');

const loc = ontologyLocation({
  modelId: 'drkn-core', tab: 'relations',
  view: {changeSetId: 'cs-drkn-demo', revision: 12}, selectedId: 'Field',
});
const [locPath, locQuery] = loc.split('?');
const roundTrip = asDraft(parseOntologyRoute(locPath, `?${locQuery ?? ''}`));
assert(roundTrip?.changeSetId === 'cs-drkn-demo' && roundTrip?.revision === 12
  && parseOntologyRoute(locPath, `?${locQuery ?? ''}`)?.selectedId === 'Field',
  'ontologyLocation → parseOntologyRoute 往返一致');

// ---------- 二、HTTP 流程（独立 Mock 服务，真实读写） ----------

const session = await ontologyV1.session();
assert(session.dataMode === 'MOCK', '会话 meta.dataMode=MOCK（明确是演示数据）');
assert(session.data.actorId === 'demo-maintainer' && session.data.capabilities.includes('ontology.edit'),
  'maintainer 会话具备 ontology.edit');

const models = await ontologyV1.listModels();
const drkn = models.data.items.find((m) => m.id === 'drkn-core');
const pub = models.data.items.find((m) => m.id === 'public-service');
assert(drkn?.origin === 'SYSTEM', '系统模型 drkn-core 在 GET /models 中（origin=SYSTEM）');
assert(pub?.origin === 'TENANT', '业务本体 public-service 在 GET /models 中（origin=TENANT）');

// 模型总览口径：正式版本 v1.3.0 的 document 计数。
const versionView = await ontologyV1.getView('drkn-core', {versionId: 'v1.3.0'});
const doc = versionView.data.document;
const localCount = doc.objectTypes.filter((t) => t.origin !== 'EXTERNAL').length;
assert(versionView.data.readOnly === true, '正式版本视图 readOnly=true（不可直接编辑）');
assert(doc.objectTypes.length === 31 && localCount === 21,
  `总览统计口径：31 对象类型 = ${localCount} 本地 + ${doc.objectTypes.length - localCount} 外部引用`);
assert(doc.relations.length === 39, `关系 39（实际 ${doc.relations.length}）`);
assert(doc.constraints.length === 2, `约束 2（实际 ${doc.constraints.length}）`);
assert(doc.actions.length === 25, `行动契约 25（实际 ${doc.actions.length}）`);
assert(doc.implementationBindings.length === 28, `实现绑定 28（实际 ${doc.implementationBindings.length}）`);
assert(doc.workflowRefs.length === 6, `流程引用 6（实际 ${doc.workflowRefs.length}）`);

const graph = await ontologyV1.getGraph('drkn-core', {versionId: 'v1.3.0'});
assert(graph.data.contentHash === versionView.data.contentHash && graph.data.nodes.length === 31,
  '图谱与视图同 contentHash，节点数一致');

// 草稿深链接读取 + r(n) → r(n+1) 保存。
const csBefore = await ontologyV1.getChangeSet('drkn-core', 'cs-drkn-demo');
assert(csBefore.data.status === 'OPEN', 'cs-drkn-demo 为 OPEN 草稿');
const revBefore = csBefore.data.revision;
const draftView = await ontologyV1.getView('drkn-core', {changeSetId: 'cs-drkn-demo', revision: revBefore});
assert(draftView.data.readOnly === false && draftView.data.changeSetId === 'cs-drkn-demo',
  `草稿视图 r${revBefore} 可写（readOnly=false）`);

const types = draftView.data.document.objectTypes;
// drkn-core 内置类型 origin=SYSTEM（同样可编辑）；仅 EXTERNAL 不可写。
const target = types.find((t) => t.id === 'Field' && t.origin !== 'EXTERNAL') ?? types.find((t) => t.origin !== 'EXTERNAL')!;
const originalDefinition = versionView.data.document.objectTypes.find((t) => t.id === target.id)!.definition;
const marker = `（Batch 2 冒烟 ${new Date().toISOString()}）`;

const applied = await ontologyV1.applyOperations(
  'drkn-core', 'cs-drkn-demo',
  {operations: [{op: 'UPSERT', collection: 'objectTypes', id: target.id, value: {...target, definition: `${target.definition}${marker}`}}]},
  draftView.etag!, newIdempotencyKey(),
);
assert(applied.data.revision === revBefore + 1,
  `保存草稿 r${revBefore} → r${applied.data.revision}（服务端修订号）`);

const draftAfter = await ontologyV1.getView('drkn-core', {changeSetId: 'cs-drkn-demo', revision: applied.data.revision});
assert(draftAfter.data.document.objectTypes.find((t) => t.id === target.id)!.definition.includes('Batch 2 冒烟'),
  '草稿修订包含刚写入的内容');

const versionAfter = await ontologyV1.getView('drkn-core', {versionId: 'v1.3.0'});
assert(versionAfter.data.document.objectTypes.find((t) => t.id === target.id)!.definition === originalDefinition,
  `v1.3.0 未被草稿修改影响（${target.id} 定义保持原值）`);

// 412：用过期 etag 再提交。
const stale = await expectApiError(() => ontologyV1.applyOperations(
  'drkn-core', 'cs-drkn-demo',
  {operations: [{op: 'UPSERT', collection: 'objectTypes', id: target.id, value: {...target, definition: `${target.definition}（stale）`}}]},
  draftView.etag!, newIdempotencyKey(),
));
assert(stale?.status === 412 && stale.code === 'REVISION_CONFLICT' && stale.details.currentRevision === applied.data.revision,
  '过期 If-Match → 412 REVISION_CONFLICT，details.currentRevision 指向最新修订');

// 外部引用类型不可写。
const external = draftAfter.data.document.objectTypes.find((t) => t.origin === 'EXTERNAL')!;
const extErr = await expectApiError(() => ontologyV1.applyOperations(
  'drkn-core', 'cs-drkn-demo',
  {operations: [{op: 'UPSERT', collection: 'objectTypes', id: external.id, value: {...external, nameCn: '不应可写'}}]},
  draftAfter.etag!, newIdempotencyKey(),
));
assert(extErr?.code === 'EXTERNAL_READ_ONLY', `EXTERNAL 类型写入被拒绝（${external.id}，EXTERNAL_READ_ONLY）`);

// viewer 身份：写接口 403。
useDemoIdentity.getState().setActor('demo-viewer');
try {
  const viewerSession = await ontologyV1.session();
  assert(viewerSession.data.actorId === 'demo-viewer' && !viewerSession.data.capabilities.includes('ontology.edit'),
    'viewer 会话仅 ontology.read');
  const denied = await expectApiError(() => ontologyV1.applyOperations(
    'drkn-core', 'cs-drkn-demo',
    {operations: [{op: 'UPSERT', collection: 'objectTypes', id: target.id, value: draftAfter.data.document.objectTypes.find((t) => t.id === target.id)!}]},
    draftAfter.etag!, newIdempotencyKey(),
  ));
  assert(denied?.status === 403 && denied.code === 'ACTION_DENIED',
    'viewer 写入草稿 → 403 ACTION_DENIED');
} finally {
  useDemoIdentity.getState().setActor('demo-maintainer');
}

// 新建业务本体：真实 POST /models + 初始草稿回写。
const created = await ontologyV1.createModel(
  {id: 'smoke-biz-model', name: '冒烟业务本体', profile: 'BUSINESS', ownerRef: 'smoke-team'},
  newIdempotencyKey(),
);
assert(created.data.model.origin === 'TENANT' && created.data.changeSet.status === 'OPEN',
  '新建业务本体返回 TENANT 模型 + 初始 OPEN 草稿');

const modelsAfter = await ontologyV1.listModels();
assert(modelsAfter.data.items.some((m) => m.id === 'smoke-biz-model' && !m.currentVersionId),
  '新建本体出现在 GET /models 且尚无正式版本');

const newDraft = await ontologyV1.getView('smoke-biz-model',
  {changeSetId: created.data.changeSet.id, revision: created.data.changeSet.revision});
assert(newDraft.data.document.objectTypes.length === 0 && newDraft.data.readOnly === false,
  '新建本体初始草稿视图为空且可写');

// SYSTEM 模型不可经业务创建接口建立（服务端拒绝，profile 枚举仅 BUSINESS）。
const sysModel = await expectApiError(() => ontologyV1.createModel(
  {id: 'evil-system', name: '试图建系统模型', profile: 'SYSTEM' as never, ownerRef: 'x-team'},
  newIdempotencyKey(),
));
assert(sysModel !== null && sysModel.status === 422,
  'POST /models profile=SYSTEM → 422 服务端拒绝（系统模型不可自建）');

// 每模型仅一个 OPEN 草稿：第二个变更集被 409 拒绝，UI 不会面对多 OPEN 歧义。
const dupCs = await expectApiError(() => ontologyV1.createChangeSet(
  'drkn-core',
  {name: '第二个草稿探针', reason: 'smoke：多 OPEN 草稿拒绝', baseVersionId: 'v1.3.0', targetVersionId: 'v1.4.0'},
  newIdempotencyKey(),
));
assert(dupCs !== null && dupCs.status === 409 && dupCs.code === 'OPEN_CHANGESET_EXISTS',
  '已存在 OPEN 草稿时再建 → 409 OPEN_CHANGESET_EXISTS（无静默多选）');

// 两模型视图互不串数据。
const pubView = await ontologyV1.getView('public-service', {versionId: 'v1.0.0'});
assert(pubView.data.modelId === 'public-service'
  && pubView.data.contentHash !== versionView.data.contentHash
  && pubView.data.contentHash !== draftAfter.data.contentHash,
  'drkn-core / public-service 视图 modelId 与 contentHash 各自独立（缓存按 modelId+view 隔离）');

console.log('\nSMOKE PASS — Batch 2 路由解析与列表/总览/对象类型读写均经真实 HTTP 完成');
