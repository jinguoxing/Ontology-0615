/**
 * Batch 3 冒烟脚本：关系与约束 / 行动契约 / 实现绑定 / 流程关联的真实 HTTP 流程。
 * 用法（每次运行都要全新库，脚本会真实写库推进草稿修订）：
 *   lsof -ti :4312 | xargs kill 2>/dev/null; rm -f /tmp/ontology-smoke-batch3.json
 *   MOCK_DB_PATH=/tmp/ontology-smoke-batch3.json PORT=4312 node ontology-delivery/mock-server/server.mjs &
 *   ONTOLOGY_API_BASE=http://127.0.0.1:4312 npx tsx scripts/smoke-batch3.ts
 */
import {DEMO_WORKSPACE_ID, ontologyV1} from '../src/api/ontology-v1/client';
import {ontologyKeys} from '../src/api/ontology-v1/queryKeys';
import {OntologyApiError, newIdempotencyKey, viewQuery} from '../src/api/ontology-v1/ontologyClient';
import type {
  ConstraintDefinition,
  ImplementationBinding,
  RelationDefinition,
} from '../src/api/ontology-v1/types.generated';
import {useDemoIdentity} from '../src/ontology/identity';
import {resolveBinding, workflowCompatibility} from '../src/ontology/compatibility';

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) { console.error(`FAIL: ${msg}`); process.exit(1); }
  console.log(`ok - ${msg}`);
}

async function expectApiError(fn: () => Promise<unknown>): Promise<OntologyApiError | null> {
  try { await fn(); return null; } catch (e) { return e instanceof OntologyApiError ? e : null; }
}

const V130 = {versionId: 'v1.3.0'} as const;

// ---------- 一、五个集合端点的真实读取（同一 ViewReference） ----------

const versionView = await ontologyV1.getView('drkn-core', V130);
const doc = versionView.data.document;
assert(versionView.dataMode === 'MOCK', 'meta.dataMode=MOCK（演示数据，未连接生产服务）');

const relPage = await ontologyV1.relations('drkn-core', V130, {limit: 200});
const conPage = await ontologyV1.constraints('drkn-core', V130, {limit: 200});
const actPage = await ontologyV1.actions('drkn-core', V130, {limit: 200});
const bindPage = await ontologyV1.implementationBindings('drkn-core', V130, {limit: 200});
const wfPage = await ontologyV1.workflowRefs('drkn-core', V130, {limit: 200});

assert(relPage.data.total === 39 && relPage.data.items.length === 39, `GET /relations → 39（实际 ${relPage.data.total}）`);
assert(conPage.data.total === 2 && conPage.data.items.length === 2, `GET /constraints → 2（实际 ${conPage.data.total}）`);
assert(actPage.data.total === 25 && actPage.data.items.length === 25, `GET /actions → 25（实际 ${actPage.data.total}）`);
assert(bindPage.data.total === 28 && bindPage.data.items.length === 28, `GET /implementation-bindings → 28（实际 ${bindPage.data.total}）`);
assert(wfPage.data.total === 6 && wfPage.data.items.length === 6, `GET /workflow-refs → 6（实际 ${wfPage.data.total}）`);

const sameIds = (a: Array<{id: string}>, b: Array<{id: string}>) => {
  const ka = a.map((x) => x.id).sort().join(',');
  const kb = b.map((x) => x.id).sort().join(',');
  return ka === kb;
};
assert(sameIds(relPage.data.items, doc.relations), 'relations 集合端点与视图 document 同一份数据（id 集合一致）');
assert(sameIds(actPage.data.items, doc.actions), 'actions 集合端点与视图 document 同一份数据');
assert(sameIds(bindPage.data.items, doc.implementationBindings), 'implementationBindings 集合端点与视图 document 同一份数据');
assert(sameIds(wfPage.data.items, doc.workflowRefs), 'workflowRefs 集合端点与视图 document 同一份数据');

const graph = await ontologyV1.getGraph('drkn-core', V130);
assert(graph.data.contentHash === versionView.data.contentHash,
  'graph 与 view 在同一 ViewReference 下 contentHash 一致');

assert(viewQuery({versionId: 'v1.3.0'}) === 'versionId=v1.3.0'
  && viewQuery({changeSetId: 'cs-drkn-demo', revision: 12}) === 'changeSetId=cs-drkn-demo&revision=12',
  'ViewReference 的查询串编码稳定（页面与冒烟走同一 viewQuery）');

// 七类关系类别全部出现（语义/包含/质量/证据/溯源/数据落位/归属）。
const categories = new Set(relPage.data.items.map((r) => r.category));
assert(categories.size === 7, `关系覆盖 7 个类别（实际 ${categories.size}：${[...categories].join(',')}）`);

// 两条约束均为治理记录（GOVERNANCE_RECORD），页面只宣称规则定义有效。
assert(conPage.data.items.every((c) => c.scope === 'GOVERNANCE_RECORD'),
  '2 条约束均为 GOVERNANCE_RECORD（Mock 环境仅规则定义有效，不宣称实例已验证）');

// 默认选中的行动契约存在。
assert(actPage.data.items.some((a) => a.id === 'confirmAssertion'),
  '行动契约包含 confirmAssertion（页面默认选中项真实存在）');

// FUNCTION / ACTION 区分：25 + 3。
const actionBindings = bindPage.data.items.filter((b) => b.kind === 'ACTION');
const functionBindings = bindPage.data.items.filter((b) => b.kind === 'FUNCTION');
assert(actionBindings.length === 25 && functionBindings.length === 3,
  `实现绑定 25 ACTION + 3 FUNCTION（实际 ${actionBindings.length} + ${functionBindings.length}）`);

// 外部类型只读但可作为关系端点（种子 generated_by: SemanticAssertion → Run）。
const typeOrigin = new Map(doc.objectTypes.map((t) => [t.id, t.origin]));
const extEndpointRel = relPage.data.items.find(
  (r) => typeOrigin.get(r.sourceTypeId) === 'EXTERNAL' || typeOrigin.get(r.targetTypeId) === 'EXTERNAL',
);
assert(extEndpointRel !== undefined,
  `EXTERNAL 类型可作为关系端点（${extEndpointRel?.id}: ${extEndpointRel?.sourceTypeId} → ${extEndpointRel?.targetTypeId}）`);

// Registry 与验证用例（页面消费的辅助端点）。
const registry = await ontologyV1.registry();
assert(registry.data.implementations.length === 28
  && registry.data.implementations.every((i) => i.liveEndpointVerified === false),
  'Registry 登记 28 个实现，liveEndpointVerified 全部为 false（未验证生产端点）');
assert(registry.data.workflows.length === 6 && registry.data.workflows.every((w) => w.executable === false),
  'Registry 登记 6 个流程且 executable 全部为 false（演示环境未连接实际 Runtime）');
const fixtures = await ontologyV1.actionFixtures();
assert(fixtures.data.items.length === 6
  && fixtures.data.items.some((f) => f.actionId === 'confirmAssertion'),
  'GET /action-fixtures → 6 个用例，confirmAssertion 有可用用例');

// 种子绑定与 Registry 全部可解析（页面“已解决/未解决”判定函数与冒烟共用）。
const unresolvedSeeds = bindPage.data.items.filter((b) => resolveBinding(b, registry.data).issues.length > 0);
assert(unresolvedSeeds.length === 0,
  `28 个种子绑定经 resolveBinding 全部已解决（未解决 ${unresolvedSeeds.length}）`);

// ---------- 二、草稿写入链路（cs-drkn-demo） ----------

const csBefore = await ontologyV1.getChangeSet('drkn-core', 'cs-drkn-demo');
assert(csBefore.data.status === 'OPEN', 'cs-drkn-demo 为 OPEN 草稿');
const rev0 = csBefore.data.revision;

const draftView = await ontologyV1.getView('drkn-core', {changeSetId: 'cs-drkn-demo', revision: rev0});
assert(draftView.data.readOnly === false, `草稿视图 r${rev0} 可写`);
const etag0 = draftView.etag!;

// EXTERNAL 类型本体不可写（服务端裁决），但它可以出现在关系端点上。
const extType = draftView.data.document.objectTypes.find((t) => t.origin === 'EXTERNAL')!;
const extErr = await expectApiError(() => ontologyV1.applyOperations(
  'drkn-core', 'cs-drkn-demo',
  {operations: [{op: 'UPSERT', collection: 'objectTypes', id: extType.id, value: {...extType, nameCn: '不应可写'}}]},
  etag0, newIdempotencyKey(),
));
assert(extErr?.code === 'EXTERNAL_READ_ONLY',
  `EXTERNAL 类型写入 → EXTERNAL_READ_ONLY（${extType.id} 只读，但可作为关系端点）`);

// 新增关系（一端为 EXTERNAL 类型）→ 修订 r(n+1)。
const smokeRel: RelationDefinition = {
  id: 'smokeRelBatch3',
  code: 'smokeRelBatch3',
  nameCn: '冒烟临时关系',
  category: 'SEMANTIC',
  sourceTypeId: extType.id,
  targetTypeId: 'Field',
  sourceCardinality: {min: 0, max: null},
  targetCardinality: {min: 1, max: 1},
  definition: 'Batch 3 冒烟：以外部类型为源端的关系',
};
const upsertOp = (value: RelationDefinition) => ({op: 'UPSERT' as const, collection: 'relations' as const, id: value.id, value});
const rev1 = (await ontologyV1.applyOperations('drkn-core', 'cs-drkn-demo', {operations: [upsertOp(smokeRel)]}, etag0, newIdempotencyKey())).data.revision;
assert(rev1 === rev0 + 1, `新增关系 → 草稿修订 r${rev0} → r${rev1}`);

const draftRel1 = await ontologyV1.relations('drkn-core', {changeSetId: 'cs-drkn-demo', revision: rev1}, {limit: 200});
assert(draftRel1.data.items.some((r) => r.id === 'smokeRelBatch3' && r.sourceTypeId === extType.id),
  `集合端点在 r${rev1} 读到新增关系（EXTERNAL 端点合法）`);

// 修改关系 → r(n+2)。
const draftView1 = await ontologyV1.getView('drkn-core', {changeSetId: 'cs-drkn-demo', revision: rev1});
const rev2 = (await ontologyV1.applyOperations(
  'drkn-core', 'cs-drkn-demo',
  {operations: [upsertOp({...smokeRel, nameCn: '冒烟临时关系（改）'})]},
  draftView1.etag!, newIdempotencyKey(),
)).data.revision;
assert(rev2 === rev1 + 1, `修改关系 → r${rev1} → r${rev2}`);
const draftRel2 = await ontologyV1.relations('drkn-core', {changeSetId: 'cs-drkn-demo', revision: rev2}, {limit: 200});
assert(draftRel2.data.items.find((r) => r.id === 'smokeRelBatch3')?.nameCn === '冒烟临时关系（改）', '修改后的名称出现在集合端点');

// 正式版本不受草稿影响。
const versionAfter = await ontologyV1.getView('drkn-core', V130);
const versionRel = await ontologyV1.relations('drkn-core', V130, {limit: 200});
assert(versionAfter.data.contentHash === versionView.data.contentHash
  && versionRel.data.total === 39 && !versionRel.data.items.some((r) => r.id === 'smokeRelBatch3'),
  'v1.3.0 正式版本完全未变（contentHash 与关系数一致）');

// 删除关系 → r(n+3)，且不级联删除约束。
const constraintsBefore = (await ontologyV1.constraints('drkn-core', {changeSetId: 'cs-drkn-demo', revision: rev2}, {limit: 200}))
  .data.items.map((c) => c.id).sort().join(',');
const draftView2 = await ontologyV1.getView('drkn-core', {changeSetId: 'cs-drkn-demo', revision: rev2});
const rev3 = (await ontologyV1.applyOperations(
  'drkn-core', 'cs-drkn-demo',
  {operations: [{op: 'REMOVE', collection: 'relations', id: 'smokeRelBatch3'}]},
  draftView2.etag!, newIdempotencyKey(),
)).data.revision;
assert(rev3 === rev2 + 1, `删除关系（REMOVE）→ r${rev2} → r${rev3}`);
const relRev3 = await ontologyV1.relations('drkn-core', {changeSetId: 'cs-drkn-demo', revision: rev3}, {limit: 200});
const conRev3 = await ontologyV1.constraints('drkn-core', {changeSetId: 'cs-drkn-demo', revision: rev3}, {limit: 200});
assert(!relRev3.data.items.some((r) => r.id === 'smokeRelBatch3') && relRev3.data.total === 39,
  `r${rev3} 中关系已删除且总数回到 39`);
assert(conRev3.data.items.map((c) => c.id).sort().join(',') === constraintsBefore && conRev3.data.total === 2,
  '删除关系不级联删除约束（2 条约束原样保留）');

// 旧 ETag → 412 REVISION_CONFLICT。
const stale = await expectApiError(() => ontologyV1.applyOperations(
  'drkn-core', 'cs-drkn-demo',
  {operations: [{op: 'REMOVE', collection: 'relations', id: 'generated_by'}]},
  etag0, newIdempotencyKey(),
));
assert(stale?.status === 412 && stale.code === 'REVISION_CONFLICT' && stale.details.currentRevision === rev3,
  `过期 If-Match（r${rev0}）→ 412 REVISION_CONFLICT，details.currentRevision=${rev3}`);

// viewer 身份：写接口 403（服务端裁决，非仅前端隐藏）。
const draftView3 = await ontologyV1.getView('drkn-core', {changeSetId: 'cs-drkn-demo', revision: rev3});
useDemoIdentity.getState().setActor('demo-viewer');
try {
  const denied = await expectApiError(() => ontologyV1.applyOperations(
    'drkn-core', 'cs-drkn-demo',
    {operations: [{op: 'UPSERT', collection: 'constraints', id: conRev3.data.items[0].id, value: conRev3.data.items[0]}]},
    draftView3.etag!, newIdempotencyKey(),
  ));
  assert(denied?.status === 403 && denied.code === 'ACTION_DENIED',
    'viewer 写入草稿 → 403 ACTION_DENIED');
} finally {
  useDemoIdentity.getState().setActor('demo-maintainer');
}

// 行动验证用例：只读模拟，不改变模型 revision。
const fixture = fixtures.data.items.find((f) => f.actionId === 'confirmAssertion')!;
const test = await ontologyV1.testAction(
  'drkn-core',
  {view: {changeSetId: 'cs-drkn-demo', revision: rev3}, actionId: 'confirmAssertion', fixtureId: fixture.id},
  newIdempotencyKey(),
);
assert(test.data.decision === 'ALLOW' && test.data.realExecution === false && test.data.modelChanged === false,
  `action-tests → ALLOW（MOCK：realExecution=false、modelChanged=false，用例 ${fixture.id}）`);
const csAfterTest = await ontologyV1.getChangeSet('drkn-core', 'cs-drkn-demo');
assert(csAfterTest.data.revision === rev3,
  `执行验证用例后草稿修订保持 r${rev3}（验证不产生修订）`);

// 流程兼容：删除流程所需行动 → 同一兼容性判定给出“不兼容”。
const wfRef = wfPage.data.items.find((w) => w.requiredActionIds.length > 0)!;
const missingAction = wfRef.requiredActionIds[0];
const actionsRev3 = await ontologyV1.actions('drkn-core', {changeSetId: 'cs-drkn-demo', revision: rev3}, {limit: 200});
assert(actionsRev3.data.items.some((a) => a.id === missingAction),
  `删除前行动 ${missingAction} 存在于草稿视图（${wfRef.workflowId} 所需）`);
assert(workflowCompatibility(wfRef.requiredActionIds, actionsRev3.data.items.map((a) => a.id)).ok,
  '所需行动齐备时兼容性判定为兼容（页面同一实现）');
const rev4 = (await ontologyV1.applyOperations(
  'drkn-core', 'cs-drkn-demo',
  {operations: [{op: 'REMOVE', collection: 'actions', id: missingAction}]},
  draftView3.etag!, newIdempotencyKey(),
)).data.revision;
const actionsRev4 = await ontologyV1.actions('drkn-core', {changeSetId: 'cs-drkn-demo', revision: rev4}, {limit: 200});
const wfRev4 = await ontologyV1.workflowRefs('drkn-core', {changeSetId: 'cs-drkn-demo', revision: rev4}, {limit: 200});
const wfAfter = wfRev4.data.items.find((w) => w.id === wfRef.id)!;
const compat = workflowCompatibility(wfAfter.requiredActionIds, actionsRev4.data.items.map((a) => a.id));
assert(!actionsRev4.data.items.some((a) => a.id === missingAction)
  && !compat.ok && compat.missing.includes(missingAction),
  `删除所需行动 ${missingAction} 后（r${rev4}），流程 ${wfRef.workflowId} 判定为不兼容且 missing 包含该行动`);

// 未解决绑定允许保存草稿（服务端接受），页面显示“未解决”，阻塞留给 Batch 4。
const unresolved: ImplementationBinding = {
  id: 'smokeUnresolvedBinding',
  kind: 'FUNCTION',
  implementationId: 'no-such-impl',
  implementationVersionId: 'v0.0.0',
  inputContractRef: 'io/none-in',
  outputContractRef: 'io/none-out',
  expectedSideEffects: ['NONE'],
};
const draftView4 = await ontologyV1.getView('drkn-core', {changeSetId: 'cs-drkn-demo', revision: rev4});
const rev5 = (await ontologyV1.applyOperations(
  'drkn-core', 'cs-drkn-demo',
  {operations: [{op: 'UPSERT', collection: 'implementationBindings', id: unresolved.id, value: unresolved}]},
  draftView4.etag!, newIdempotencyKey(),
)).data.revision;
const bindRev5 = await ontologyV1.implementationBindings('drkn-core', {changeSetId: 'cs-drkn-demo', revision: rev5}, {limit: 200});
const savedUnresolved = bindRev5.data.items.find((b) => b.id === unresolved.id);
assert(savedUnresolved !== undefined && resolveBinding(savedUnresolved, registry.data).resolved === false,
  `指向不存在实现的绑定 r${rev5} 被接受进草稿，resolveBinding 判定未解决（等 Batch 4 校验阻塞）`);

// 约束内容编辑（UPSERT constraints）同样走草稿链路。
const constraint: ConstraintDefinition = {...conRev3.data.items[0], definition: `${conRev3.data.items[0].definition}（Batch 3 冒烟）`};
const draftView5 = await ontologyV1.getView('drkn-core', {changeSetId: 'cs-drkn-demo', revision: rev5});
const rev6 = (await ontologyV1.applyOperations(
  'drkn-core', 'cs-drkn-demo',
  {operations: [{op: 'UPSERT', collection: 'constraints', id: constraint.id, value: constraint}]},
  draftView5.etag!, newIdempotencyKey(),
)).data.revision;
const conRev6 = await ontologyV1.constraints('drkn-core', {changeSetId: 'cs-drkn-demo', revision: rev6}, {limit: 200});
assert(rev6 === rev5 + 1 && conRev6.data.items.find((c) => c.id === constraint.id)?.definition.includes('Batch 3 冒烟'),
  `约束 UPSERT → r${rev6} 且新定义可在集合端点读到`);

// ---------- 三、两模型缓存隔离 ----------

const keyOf = (modelId: string) => JSON.stringify(
  ontologyKeys.collection({workspaceId: DEMO_WORKSPACE_ID, actorId: 'demo-maintainer', modelId}, V130, 'relations', {limit: 200}),
);
assert(keyOf('drkn-core') !== keyOf('public-service'),
  '查询键包含 modelId + ViewReference：两模型的 relations 缓存键不同');

const pubView = await ontologyV1.getView('public-service', {versionId: 'v1.0.0'});
const pubRel = await ontologyV1.relations('public-service', {versionId: 'v1.0.0'}, {limit: 200});
assert(pubView.data.modelId === 'public-service'
  && pubView.data.contentHash !== versionView.data.contentHash,
  'public-service 视图独立（modelId 与 contentHash 均不同）');
const drknIds = new Set(relPage.data.items.map((r) => r.id));
assert(pubRel.data.items.every((r) => !drknIds.has(r.id)),
  `两模型关系数据不串（public-service ${pubRel.data.items.length} 条关系，与 drkn-core 无重叠 id）`);

console.log('\nSMOKE PASS — Batch 3 关系/约束/行动/实现绑定/流程关联均经真实 HTTP 验证');
