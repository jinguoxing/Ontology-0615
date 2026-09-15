/**
 * Batch 1 冒烟脚本：通过 src/api/ontology.ts 适配器访问契约 Mock 服务。
 * 用法：ONTOLOGY_API_BASE=http://127.0.0.1:4311 npx tsx scripts/smoke-adapter.ts
 * 需要以独立端口 + 临时 MOCK_DB_PATH 启动服务，避免污染默认演示数据。
 */
import {
  fetchObjectTypes, fetchLinkTypes, fetchCapabilities, fetchWorkflows,
  fetchChangeSets, addObjectType, updateObjectType, replaceLinkTypes,
} from '../src/api/ontology';

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) { console.error(`FAIL: ${msg}`); process.exit(1); }
  console.log(`ok - ${msg}`);
}

const types = await fetchObjectTypes();
assert(types.length > 0, `fetchObjectTypes 返回 ${types.length} 个类型(服务端数据)`);
assert(types.every((t) => t.instanceCount === 0), 'instanceCount 全部为 0(不编造实例数)');
assert(types.some((t) => t.id === 'Field'), '包含 Field 稳定 ID');

const links = await fetchLinkTypes();
assert(links.length > 0, `fetchLinkTypes 返回 ${links.length} 条关系`);
assert(links.some((l) => l.id === 'has_assertion' && l.sourceObjId === 'Field'), 'Field→has_assertion→SemanticAssertion 在列');

const caps = await fetchCapabilities();
assert(caps.length > 0, `fetchCapabilities 返回 ${caps.length} 项(行动+函数绑定)`);
assert(caps.some((c) => c.id === 'confirmAssertion'), 'confirmAssertion 契约在列');

const flows = await fetchWorkflows();
assert(flows.length === 6, `fetchWorkflows 返回 ${flows.length} 个流程引用`);

const css = await fetchChangeSets();
assert(css.some((c) => c.id === 'cs-drkn-demo' && c.status === 'editing'), '草稿 cs-drkn-demo 状态 editing(OPEN)');

const created = await addObjectType({
  id: 'SmokeTestType', nameCn: '冒烟测试类型', description: 'Batch 1 冒烟写入',
  group: '核心数据对象', instanceCount: 0, properties: [
    {name: 'smoke_field', dataType: 'string', semanticType: 'UNKNOWN', confidence: 0,
     owner: 'platform-team', status: 'Draft', description: '冒烟字段'},
  ],
  lifecycle: [], status: 'Draft', owner: 'platform-team',
});
assert(created.id === 'SmokeTestType', `addObjectType 经 HTTP UPSERT 创建 ${created.id}`);

const afterAdd = await fetchObjectTypes();
assert(afterAdd.some((t) => t.id === 'SmokeTestType'), '新类型真实出现在服务端读取结果中');

const updated = await updateObjectType({
  ...afterAdd.find((t) => t.id === 'SmokeTestType')!,
  description: 'Batch 1 冒烟写入-已更新',
});
assert(updated.id === 'SmokeTestType', 'updateObjectType 合并保存成功');

let linkWriteRejected = false;
try { await replaceLinkTypes([]); } catch (e) {
  linkWriteRejected = e instanceof Error && e.message.includes('Batch 3');
}
assert(linkWriteRejected, 'replaceLinkTypes 显式抛错(Batch 3 前只读,不伪造保存)');

console.log('\nSMOKE PASS — 适配器读写均经真实 HTTP 完成');
