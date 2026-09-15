/**
 * Batch 4 冒烟脚本：校验 / 影响分析 / 版本发布的真实 HTTP 全流程。
 * 用法（每次运行都要全新库，脚本会真实写库推进草稿并发布 v1.4.0）：
 *   lsof -ti :4314 | xargs kill 2>/dev/null; rm -f /tmp/ontology-smoke-batch4.json
 *   MOCK_DB_PATH=/tmp/ontology-smoke-batch4.json MOCK_JOB_DELAY_MS=600 PORT=4314 node ontology-delivery/mock-server/server.mjs &
 *   ONTOLOGY_API_BASE=http://127.0.0.1:4314 npx tsx scripts/smoke-batch4.ts
 *
 * 覆盖：202+Location/Retry-After、任务轮询三态、ERROR 阻断发布、REPORT_NOT_READY、
 * REPORT_STALE（修订推进后旧报告失效）、412（旧修订启动/发布）、IMPACT_ACK_REQUIRED、
 * 幂等发布（Idempotent-Replayed）、发布成功新版本生效、旧版本保留、
 * workflowStarted=false、consumerPinsUpdated=false、BASE_VERSION_ADVANCED、
 * VERSION_EXISTS、viewer 403、审计事件。
 */
import {DEMO_WORKSPACE_ID, ontologyV1} from '../src/api/ontology-v1/client';
import {OntologyApiError, newIdempotencyKey} from '../src/api/ontology-v1/ontologyClient';
import {useDemoIdentity} from '../src/ontology/identity';

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) { console.error(`FAIL: ${msg}`); process.exit(1); }
  console.log(`ok - ${msg}`);
}

async function expectApiError(fn: () => Promise<unknown>): Promise<OntologyApiError | null> {
  try { await fn(); return null; } catch (e) { return e instanceof OntologyApiError ? e : null; }
}

/** 轮询 GET /jobs/:id 直到终态（RUNNING→SUCCEEDED/FAILED），超时 8s。 */
async function waitForJob(jobId: string) {
  for (let i = 0; i < 80; i++) {
    const j = (await ontologyV1.getJob('drkn-core', jobId)).data;
    if (j.status !== 'RUNNING') return j;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`job ${jobId} 未在 8s 内完成`);
}

const BASE = process.env.ONTOLOGY_API_BASE ?? '';
const RAW_HEADERS = {
  Authorization: 'Bearer demo-maintainer',
  'X-Workspace-Id': DEMO_WORKSPACE_ID,
  'Content-Type': 'application/json',
};
const PUBLISH_PATH = '/api/v1/ontology/models/drkn-core/changesets/cs-drkn-demo/publications';

// ---------- 一、种子状态与 r12 diff ----------

const cs0 = (await ontologyV1.getChangeSet('drkn-core', 'cs-drkn-demo')).data;
assert(cs0.status === 'OPEN' && cs0.revision === 12 && cs0.baseVersionId === 'v1.3.0' && cs0.targetVersionId === 'v1.4.0',
  `种子草稿 cs-drkn-demo：OPEN r12，基线 v1.3.0 → 目标 v1.4.0`);

const view12 = await ontologyV1.getView('drkn-core', {changeSetId: 'cs-drkn-demo', revision: 12});
assert(view12.data.readOnly === false && view12.etag === '"cs-drkn-demo:r12"',
  `r12 视图可写，ETag=${view12.etag}`);
assert(view12.data.document.dependencies.find((d) => d.packageId === 'runtime')?.versionId == null,
  '种子缺陷就位：runtime 依赖版本未锁定（versionId=null）');

const diff12 = await ontologyV1.diff('drkn-core', 'cs-drkn-demo', 12);
assert(diff12.data.contentHash === view12.data.contentHash, 'diff 与视图在 r12 下 contentHash 一致');
const depDiff = diff12.data.items.find((d) => d.collection === 'dependencies' && d.id === 'runtime');
assert(depDiff?.change === 'MODIFY'
  && (depDiff.before as {versionId: string | null}).versionId === 'v1.0.0'
  && (depDiff.after as {versionId: string | null}).versionId === null,
  'diff 显示外部依赖变化：runtime v1.0.0 → 未锁定（发布页按 collection 分组呈现）');
assert(diff12.data.items.some((d) => d.collection === 'objectTypes' && d.id === 'SemanticAssertion'),
  'diff 同时显示模型结构变化（SemanticAssertion 定义更新）');

// ---------- 二、校验：202 + Location/Retry-After + 轮询 + 阻断结果 ----------

// 202 与异步头用原生 fetch 断言（客户端封装不回传响应头）。
const startRes = await fetch(`${BASE}/api/v1/ontology/models/drkn-core/changesets/cs-drkn-demo/validation-runs`, {
  method: 'POST', headers: {...RAW_HEADERS, 'If-Match': view12.etag!, 'Idempotency-Key': 'smoke-b4-validation-r12'},
  body: JSON.stringify({revision: 12}),
});
assert(startRes.status === 202, `POST validation-runs → 202（实际 ${startRes.status}）`);
const location = startRes.headers.get('location') ?? '';
assert(/^\/api\/v1\/ontology\/models\/drkn-core\/jobs\/job-/.test(location) && startRes.headers.get('retry-after') === '1',
  `202 携带 Location（${location}）与 Retry-After: 1`);
const startBody = await startRes.json() as {data: {id: string; status: string; kind: string}};
assert(startBody.data.status === 'RUNNING' && startBody.data.kind === 'VALIDATION',
  '202 响应体即任务实体（RUNNING / VALIDATION），Location 指向同一 jobId');
const vJob12Id = startBody.data.id;

const vJob12 = await waitForJob(vJob12Id);
assert(vJob12.status === 'SUCCEEDED' && vJob12.isCurrent === true && vJob12.completedAt !== null,
  `校验任务 ${vJob12Id} 轮询至 SUCCEEDED，completedAt 有值，对 r12 有效`);
assert(vJob12.revision === 12 && vJob12.contentHash === view12.data.contentHash,
  '报告绑定 revision=12 与 contentHash（与视图一致）');
const v12Result = vJob12.result as {passed: boolean; issues: Array<{code: string; severity: string; path: string; targetId: string}>; evaluatedChecks: string[]; notExecuted: string[]};
const blocking = v12Result.issues.filter((i) => i.severity === 'ERROR');
assert(v12Result.passed === false && blocking.length === 1
  && blocking[0].code === 'DEPENDENCY_VERSION_REQUIRED' && blocking[0].targetId === 'runtime' && blocking[0].path === 'dependencies/runtime',
  'r12 校验：passed=false，阻断项 DEPENDENCY_VERSION_REQUIRED（runtime 未锁定版本；Run/GovernanceTask 两处命中按 code+target 去重为 1 项）');
assert(v12Result.evaluatedChecks.length === 8,
  `已执行检查 8 项（${v12Result.evaluatedChecks.join(',')}）`);
assert(v12Result.notExecuted.length === 4,
  `未执行检查 4 项独立返回（结果未知，不代表通过；页面单独呈现）`);

// ---------- 三、影响分析：202 + 轮询 + PARTIAL ----------

const iJob12Start = await ontologyV1.analyzeImpact('drkn-core', 'cs-drkn-demo', 12, view12.etag!, newIdempotencyKey());
assert(iJob12Start.data.status === 'RUNNING' && iJob12Start.data.kind === 'IMPACT',
  'POST impact-analyses → 202 任务实体（IMPACT / RUNNING）');

// 报告未完成即发布 → REPORT_NOT_READY（服务端裁决，趁 600ms 计算窗口内提交）。
const notReady = await expectApiError(() => ontologyV1.publish(
  'drkn-core', 'cs-drkn-demo',
  {revision: 12, validationRunId: vJob12Id, impactAnalysisId: iJob12Start.data.id,
    releaseNotes: '不应发布：影响分析尚未完成', acknowledgePartialCoverage: true},
  view12.etag!, newIdempotencyKey(),
));
assert(notReady?.status === 409 && notReady.code === 'REPORT_NOT_READY',
  '影响报告 RUNNING 时发布 → 409 REPORT_NOT_READY');

const iJob12 = await waitForJob(iJob12Start.data.id);
assert(iJob12.status === 'SUCCEEDED' && iJob12.isCurrent === true, '影响任务轮询至 SUCCEEDED');
const i12Result = iJob12.result as {items: Array<{kind: string; path: string[]}>; inventoryCompleteness: string; limitations: string[]; consumerPinUpdates: number};
assert(i12Result.inventoryCompleteness === 'PARTIAL' && i12Result.consumerPinUpdates === 0,
  '影响结果 PARTIAL（依赖登记不完整），consumerPinUpdates=0（不自动升级）');
assert(i12Result.limitations.length === 2, 'limitations 如实返回 2 条（未登记依赖影响未知）');
const kinds = new Set(i12Result.items.map((it) => it.kind));
assert(['TYPE', 'RELATION', 'ACTION', 'IMPLEMENTATION', 'WORKFLOW', 'CONSUMER'].every((k) => kinds.has(k)),
  `影响覆盖六类构件（实际 ${[...kinds].join(',')}），每项含依赖路径`);

// ERROR 阻断发布（两份报告都 SUCCEEDED，但校验存在阻断项）。
const blocked = await expectApiError(() => ontologyV1.publish(
  'drkn-core', 'cs-drkn-demo',
  {revision: 12, validationRunId: vJob12Id, impactAnalysisId: iJob12.id,
    releaseNotes: '不应发布：存在阻断项', acknowledgePartialCoverage: true},
  view12.etag!, newIdempotencyKey(),
));
assert(blocked?.status === 409 && blocked.code === 'VALIDATION_BLOCKED'
  && Array.isArray(blocked.details.issues) && (blocked.details.issues as unknown[]).length === 1,
  '校验存在阻断项时发布 → 409 VALIDATION_BLOCKED（details 带回阻断问题）');

// viewer：启动校验 / 发布全部 403（服务端裁决，非仅前端禁用按钮）。
useDemoIdentity.getState().setActor('demo-viewer');
try {
  const vDeny = await expectApiError(() => ontologyV1.validate('drkn-core', 'cs-drkn-demo', 12, view12.etag!, newIdempotencyKey()));
  assert(vDeny?.status === 403 && vDeny.code === 'ACTION_DENIED', 'viewer 启动校验 → 403 ACTION_DENIED');
  const pDeny = await expectApiError(() => ontologyV1.publish(
    'drkn-core', 'cs-drkn-demo',
    {revision: 12, validationRunId: vJob12Id, impactAnalysisId: iJob12.id,
      releaseNotes: 'viewer 不得发布', acknowledgePartialCoverage: true},
    view12.etag!, newIdempotencyKey(),
  ));
  assert(pDeny?.status === 403 && pDeny.code === 'ACTION_DENIED', 'viewer 发布 → 403 ACTION_DENIED');
  const jobAsViewer = await ontologyV1.getJob('drkn-core', vJob12Id);
  assert(jobAsViewer.data.id === vJob12Id, 'viewer 可读任务报告（读接口不受限）');
} finally {
  useDemoIdentity.getState().setActor('demo-maintainer');
}

// ---------- 四、修复 runtime → r13，旧报告失效 ----------

const fixRev = (await ontologyV1.applyOperations(
  'drkn-core', 'cs-drkn-demo',
  {operations: [{op: 'UPSERT', collection: 'dependencies', id: 'runtime', value: {id: 'runtime', packageId: 'runtime', versionId: 'v1.0.0'}}]},
  view12.etag!, newIdempotencyKey(),
)).data;
assert(fixRev.revision === 13 && fixRev.status === 'OPEN',
  `锁定 runtime @ v1.0.0（登记版本）→ 草稿推进 r12 → r${fixRev.revision}`);

const vJob12After = (await ontologyV1.getJob('drkn-core', vJob12Id)).data;
assert(vJob12After.isCurrent === false,
  'r12 报告对新修订 isCurrent=false（已失效，不得用于发布）');

const view13 = await ontologyV1.getView('drkn-core', {changeSetId: 'cs-drkn-demo', revision: 13});
assert(view13.etag === '"cs-drkn-demo:r13"'
  && view13.data.document.dependencies.find((d) => d.packageId === 'runtime')?.versionId === 'v1.0.0',
  'r13 视图 ETag 更新为 r13，runtime 已锁定 v1.0.0');

// 旧 If-Match（r12 ETag 打在 r13 草稿上）→ CAS 守卫 412。
const staleEtag = await expectApiError(() => ontologyV1.validate('drkn-core', 'cs-drkn-demo', 13, view12.etag!, newIdempotencyKey()));
assert(staleEtag?.status === 412 && staleEtag.code === 'REVISION_CONFLICT',
  '携带过期 If-Match（r12 ETag）启动校验 → 412 REVISION_CONFLICT（CAS 守卫）');
// ETag 正确但修订不是活动修订 → 派发层 412。
const staleRevision = await expectApiError(() => ontologyV1.validate('drkn-core', 'cs-drkn-demo', 12, view13.etag!, newIdempotencyKey()));
assert(staleRevision?.status === 412 && staleRevision.code === 'REVISION_CONFLICT',
  '对旧修订（r12）启动校验（If-Match 正确）→ 412 REVISION_CONFLICT');
// 旧 ETag 发布同样被 CAS 守卫拦截。
const staleEtagPublish = await expectApiError(() => ontologyV1.publish(
  'drkn-core', 'cs-drkn-demo',
  {revision: 13, validationRunId: vJob12Id, impactAnalysisId: iJob12.id,
    releaseNotes: '旧 ETag 不得发布', acknowledgePartialCoverage: true},
  view12.etag!, newIdempotencyKey(),
));
assert(staleEtagPublish?.status === 412 && staleEtagPublish.code === 'REVISION_CONFLICT',
  '携带过期 If-Match 发布 → 412 REVISION_CONFLICT（先于业务裁决）');

// ETag / 修订均正确，但报告绑定 r12 → REPORT_STALE。
const staleReport = await expectApiError(() => ontologyV1.publish(
  'drkn-core', 'cs-drkn-demo',
  {revision: 13, validationRunId: vJob12Id, impactAnalysisId: iJob12.id,
    releaseNotes: '失效报告不得发布', acknowledgePartialCoverage: true},
  view13.etag!, newIdempotencyKey(),
));
assert(staleReport?.status === 409 && staleReport.code === 'REPORT_STALE',
  '对 r13 使用 r12 报告发布 → 409 REPORT_STALE');

// ---------- 五、r13 重新校验 + 影响 + 发布闭环 ----------

const vJob13 = await waitForJob((await ontologyV1.validate('drkn-core', 'cs-drkn-demo', 13, view13.etag!, newIdempotencyKey())).data.id);
assert(vJob13.status === 'SUCCEEDED' && vJob13.isCurrent === true,
  'r13 校验任务完成且对当前修订有效');
const v13Result = vJob13.result as {passed: boolean; issues: Array<{severity: string}>};
assert(v13Result.passed === true && v13Result.issues.every((i) => i.severity !== 'ERROR'),
  `r13 校验 passed=true（无阻断项；剩余提醒/信息 ${(v13Result.issues.filter((i) => i.severity !== 'ERROR')).length} 项不阻塞）`);

const iJob13 = await waitForJob((await ontologyV1.analyzeImpact('drkn-core', 'cs-drkn-demo', 13, view13.etag!, newIdempotencyKey())).data.id);
const i13Result = iJob13.result as {inventoryCompleteness: string};
assert(iJob13.status === 'SUCCEEDED' && i13Result.inventoryCompleteness === 'PARTIAL',
  'r13 影响分析完成，仍为 PARTIAL（登记完整性是登记面的事实，与草稿修复无关）');

// PARTIAL 未勾选风险知悉 → IMPACT_ACK_REQUIRED。
const noAck = await expectApiError(() => ontologyV1.publish(
  'drkn-core', 'cs-drkn-demo',
  {revision: 13, validationRunId: vJob13.id, impactAnalysisId: iJob13.id,
    releaseNotes: '未勾选风险知悉不应发布', acknowledgePartialCoverage: false},
  view13.etag!, newIdempotencyKey(),
));
assert(noAck?.status === 409 && noAck.code === 'IMPACT_ACK_REQUIRED',
  'PARTIAL 且未勾选风险知悉 → 409 IMPACT_ACK_REQUIRED');

// 幂等发布：固定 Idempotency-Key，首次 201，重放返回同一发布结果 + Idempotent-Replayed。
const publishBody = {
  revision: 13, validationRunId: vJob13.id, impactAnalysisId: iJob13.id,
  releaseNotes: '锁定 runtime 依赖版本，明确断言生命周期边界。', acknowledgePartialCoverage: true,
};
const pub = (await ontologyV1.publish('drkn-core', 'cs-drkn-demo', publishBody, view13.etag!, 'smoke-b4-publish-once')).data;
assert(pub.versionId === 'v1.4.0' && pub.workflowStarted === false && pub.consumerPinsUpdated === false,
  `发布成功 v1.4.0：workflowStarted=false（未自动启动流程）、consumerPinsUpdated=false（消费方固定版本未自动升级）`);
assert(pub.id.startsWith('pub-') && pub.outboxEventId.startsWith('event-') && pub.publishedAt !== null,
  `发布记录完整（publicationId=${pub.id}，outboxEventId=${pub.outboxEventId}）`);

const replayRes = await fetch(BASE + PUBLISH_PATH, {
  method: 'POST', headers: {...RAW_HEADERS, 'If-Match': view13.etag!, 'Idempotency-Key': 'smoke-b4-publish-once'},
  body: JSON.stringify(publishBody),
});
const replayBody = await replayRes.json() as {data: {id: string}};
assert(replayRes.status === 201 && replayRes.headers.get('idempotent-replayed') === 'true' && replayBody.data.id === pub.id,
  '同一 Idempotency-Key 重放发布 → 同一 publicationId + Idempotent-Replayed: true（不重复出包）');

// ---------- 六、发布结果：新版本生效、旧版本保留、审计 ----------

const model = (await ontologyV1.getModel('drkn-core')).data;
assert(model.currentVersionId === 'v1.4.0', '模型当前正式版本前移到 v1.4.0');

const csDone = (await ontologyV1.getChangeSet('drkn-core', 'cs-drkn-demo')).data;
assert(csDone.status === 'PUBLISHED', '发布后草稿关闭（status=PUBLISHED）');

const versions = (await ontologyV1.listVersions('drkn-core')).data;
assert(versions.items.length === 2
  && versions.items.some((v) => v.id === 'v1.3.0') && versions.items.some((v) => v.id === 'v1.4.0'),
  '版本列表：v1.4.0 新增，v1.3.0 完整保留');

const v140 = (await ontologyV1.getVersion('drkn-core', 'v1.4.0')).data;
assert(v140.contentHash === view13.data.contentHash
  && v140.releaseNotes === publishBody.releaseNotes && v140.baseVersionId === 'v1.3.0',
  'v1.4.0 内容 = r13 草稿（contentHash 一致），releaseNotes 与基线如实登记');

const v130 = await ontologyV1.getView('drkn-core', {versionId: 'v1.3.0'});
assert(v130.data.document.dependencies.find((d) => d.packageId === 'runtime')?.versionId === 'v1.0.0',
  'v1.3.0 旧版本未被草稿/发布影响（runtime 仍锁定 v1.0.0）');

// 已发布草稿不可再次发布：ensureOpen 守卫先于业务裁决（发布不可重复，草稿已关闭）。
const rePublish = await expectApiError(() => ontologyV1.publish(
  'drkn-core', 'cs-drkn-demo',
  {revision: 13, validationRunId: vJob13.id, impactAnalysisId: iJob13.id,
    releaseNotes: '已发布草稿不得再次发布', acknowledgePartialCoverage: true},
  view13.etag!, newIdempotencyKey(),
));
assert(rePublish?.status === 409 && rePublish.code === 'CHANGESET_NOT_OPEN',
  '对已发布（已关闭）草稿再次发布 → 409 CHANGESET_NOT_OPEN（换新幂等键穿透到服务端裁决）');

// 基线已前移：以旧正式版本为基线创建草稿 → BASE_VERSION_ADVANCED
// （发布时点的 BASE_VERSION_ADVANCED 在单活动草稿约束下不可达：推进 currentVersionId 的
//  发布本身会关闭唯一 OPEN 草稿；创建时点拦截是该错误码在当前合同下的真实路径）。
const advanced = await expectApiError(() => ontologyV1.createChangeSet('drkn-core', {
  name: '不应创建', reason: '基线已过期', baseVersionId: 'v1.3.0', targetVersionId: 'v1.5.0',
}, newIdempotencyKey()));
assert(advanced?.status === 409 && advanced.code === 'BASE_VERSION_ADVANCED',
  '以旧正式版本（v1.3.0）为基线创建草稿 → 409 BASE_VERSION_ADVANCED');

// 目标版本已存在 → 创建草稿即被拒绝（同理，创建时点是该错误码的真实路径）。
const exists = await expectApiError(() => ontologyV1.createChangeSet('drkn-core', {
  name: '不应创建', reason: '目标版本已存在', baseVersionId: 'v1.4.0', targetVersionId: 'v1.4.0',
}, newIdempotencyKey()));
assert(exists?.status === 409 && exists.code === 'VERSION_EXISTS',
  '以已存在版本号（v1.4.0）为目标创建草稿 → 409 VERSION_EXISTS');

const audits = (await ontologyV1.audit('drkn-core')).data.items;
const publishedAudit = audits.find((a) => a.eventType === 'ONTOLOGY_VERSION_PUBLISHED' && a.targetId === 'v1.4.0');
assert(publishedAudit !== undefined && publishedAudit.summary === publishBody.releaseNotes,
  '审计包含 ONTOLOGY_VERSION_PUBLISHED（v1.4.0，summary=releaseNotes）');
assert(audits.some((a) => a.eventType === 'VALIDATION_STARTED') && audits.some((a) => a.eventType === 'IMPACT_STARTED'),
  '审计同时记录校验 / 影响分析任务的启动事件');

console.log('\nSMOKE PASS — Batch 4 校验/影响/发布全链路（含全部服务端裁决错误码）经真实 HTTP 验证');
