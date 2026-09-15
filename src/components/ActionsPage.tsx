/**
 * 行动契约页（Batch 3 · 05；Batch 3.5 三栏结构对齐）。
 *
 * - 读取：GET /models/:id/actions（同一 ViewReference）；默认选中
 *   confirmAssertion（URL selected 参数，可深链接复现）。
 * - 三栏：左 = 行动列表；中 = 行动定义、状态变化、前置条件、成功结果、
 *   副作用；右 = 输入 / 输出合同、实现边界与安全边界。
 * - 实现边界读取 GET /models/:id/implementation-bindings + GET /registry，
 *   用 resolveBinding 对照（与实现绑定页 / 冒烟脚本同一实现）。
 * - 验证（次级入口）：GET /api/v1/ontology/action-fixtures + POST
 *   /models/:id/action-tests 在抽屉中运行。结果明确标识 MOCK
 *   （realExecution=false、modelChanged=false），不改变模型 revision，
 *   也不宣称连接了生产 Runtime。
 * - 边界：行动契约不直接执行治理实例，不发布本体，不启动流程。
 *   没有 Fixture 的行动不显示任何测试成功状态。
 */
import {useEffect, useMemo, useState, type ReactNode} from 'react';
import {
  AlertTriangle,
  Ban,
  CircleDot,
  FlaskConical,
  Loader2,
  Lock,
  Play,
  Search,
  ShieldCheck,
} from 'lucide-react';
import type {ActionContract, ActionFixture, ActionTestResult, ObjectTypeDefinition} from '../api/ontology-v1/types.generated';
import {
  useActionFixtures,
  useActions,
  useActorScope,
  useImplementationBindings,
  useRegistry,
  useTestAction,
} from '../ontology/queries';
import {resolveBinding} from '../ontology/compatibility';
import {useModelContext} from '../ontology/ModelContext';
import {Drawer} from '../ontology/draftWrite';

const DEFAULT_ACTION_ID = 'confirmAssertion';

const SIDE_EFFECT_LABEL: Record<string, string> = {
  NONE: '无副作用',
  SOURCE_READ: '读取数据源',
  GOVERNANCE_STATE: '治理状态写入',
  EXTERNAL_JOB: '外部作业',
  SOURCE_WRITE: '写入数据源',
};

/** 治理视角的副作用分级（用于安全边界说明，不改契约值）。 */
const GOVERNED_SIDE_EFFECTS = new Set(['GOVERNANCE_STATE', 'SOURCE_WRITE', 'EXTERNAL_JOB']);

const CONFIRMATION_LABEL: Record<ActionContract['confirmationMode'], string> = {
  NONE: '无需确认',
  EXPLICIT: '显式确认',
};

export default function ActionsPage() {
  const ctx = useModelContext();
  const {resolvedView, selectedId, select, modelId} = ctx;
  const scope = useActorScope();
  const actionsQuery = useActions(scope, modelId, ctx.view);
  const fixturesQuery = useActionFixtures(scope);
  const bindingsQuery = useImplementationBindings(scope, modelId, ctx.view);
  const registryQuery = useRegistry(scope);
  const testAction = useTestAction(modelId);

  const [filter, setFilter] = useState('');
  const [fixtureId, setFixtureId] = useState<string | null>(null);
  const [fixturesOpen, setFixturesOpen] = useState(false);

  const types = useMemo(() => resolvedView?.document.objectTypes ?? [], [resolvedView]);
  const typeById = useMemo(() => new Map(types.map((t) => [t.id, t])), [types]);
  const actions = actionsQuery.data?.items ?? [];
  const fixtures = fixturesQuery.data?.items ?? [];
  const bindings = bindingsQuery.data?.items ?? [];
  const registry = registryQuery.data;

  // 默认选中 confirmAssertion（仅当 URL 未携带 selected 时，replace 不产生历史）。
  useEffect(() => {
    if (!selectedId && actions.length > 0 && actions.some((a) => a.id === DEFAULT_ACTION_ID)) {
      select(DEFAULT_ACTION_ID);
    }
  }, [selectedId, actions, select]);

  const current = selectedId ? actions.find((a) => a.id === selectedId) : undefined;
  const currentFixtures = useMemo(
    () => (current ? fixtures.filter((f) => f.actionId === current.id) : []),
    [fixtures, current],
  );
  // 当前行动的实现绑定（实现边界栏）。
  const currentBindings = useMemo(
    () => (current ? bindings.filter((b) => b.actionId === current.id) : []),
    [bindings, current],
  );

  const q = filter.trim().toLowerCase();
  const filtered = q
    ? actions.filter((a) => a.id.toLowerCase().includes(q) || a.nameCn.includes(filter.trim()) || a.code.toLowerCase().includes(q))
    : actions;

  const runFixture = (f: ActionFixture) => {
    setFixtureId(f.id);
    testAction.mutate({view: ctx.view, actionId: current!.id, fixtureId: f.id});
  };

  return (
    <div className="space-y-4">
      {/* 页面边界声明：契约查看 + 用例验证，不是治理执行 / 发布 / 流程入口 */}
      <div className="flex items-start gap-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] text-slate-600">
        <Ban className="h-4 w-4 shrink-0 mt-0.5 text-slate-400"/>
        <p>
          本页只维护行动契约并通过验证用例做<b>只读模拟验证</b>：行动契约<b>不直接执行治理实例、不发布本体、不启动流程</b>。
          治理执行需要真实治理运行时，发布需走正式发布流程，流程启动属于流程运行时——本演示均未连接。
        </p>
      </div>

      {actionsQuery.isLoading ? (
        <div className="bg-white border border-slate-200 rounded-2xl py-16 flex flex-col items-center gap-2 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-blue-500"/>
          <p className="text-xs">正在读取行动契约…</p>
        </div>
      ) : actionsQuery.isError ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 flex items-start gap-2 text-[12.5px] text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5"/>
          <p>{(actionsQuery.error as Error).message}</p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-4 items-stretch">
          {/* 左栏：行动列表 */}
          <aside className="w-full lg:w-72 shrink-0 bg-white border border-slate-200 rounded-2xl p-3 space-y-2 self-stretch">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400"/>
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="按 ID / code / 名称过滤"
                className="w-full pl-8 pr-2 py-1.5 text-[11.5px] border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <p className="px-1 text-[10.5px] text-slate-400">
              行动契约 <span className="font-mono font-bold text-slate-500">{actions.length}</span> 个 · 默认选中 {DEFAULT_ACTION_ID}
            </p>
            <div className="max-h-[640px] overflow-y-auto space-y-1 pr-0.5">
              {filtered.map((a) => {
                const active = a.id === selectedId;
                return (
                  <button
                    key={a.id}
                    onClick={() => {select(a.id); setFixtureId(null); setFixturesOpen(false);}}
                    className={`w-full text-left px-2.5 py-2 rounded-lg border transition-all ${
                      active ? 'bg-blue-50 border-blue-300' : 'border-transparent hover:bg-slate-50 hover:border-slate-200'
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className={`text-[12px] font-bold truncate ${active ? 'text-blue-800' : 'text-slate-700'}`}>{a.nameCn}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border shrink-0 ${
                        a.confirmationMode === 'EXPLICIT'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>{CONFIRMATION_LABEL[a.confirmationMode]}</span>
                    </span>
                    <span className="block text-[9.5px] font-mono text-slate-400 truncate">{a.id} · {a.ownerService}</span>
                  </button>
                );
              })}
              {filtered.length === 0 && <p className="text-center text-[11.5px] text-slate-400 py-6">无匹配的行动契约</p>}
            </div>
          </aside>

          {/* 中栏 + 右栏 */}
          {!current ? (
            <div className="flex-1 bg-white border border-dashed border-slate-300 rounded-2xl py-16 text-center text-xs text-slate-400">
              在左侧选择一个行动契约{selectedId && <>（所选行动不存在于当前视图）</>}
            </div>
          ) : (
            <>
              {/* 中栏：行动定义 / 状态变化 / 前置条件 / 成功结果 / 副作用 */}
              <div className="flex-1 min-w-0 space-y-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <h2 className="text-base font-bold text-slate-800">{current.nameCn}</h2>
                      <p className="text-[11px] font-mono text-slate-400 mt-0.5">{current.id} · code {current.code}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        责任服务 {current.ownerService}
                      </span>
                      {/* Fixture 次级入口：抽屉，不占据主界面 */}
                      <button
                        onClick={() => setFixturesOpen(true)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10.5px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
                        title="只读模拟验证，不改变草稿修订"
                      >
                        <FlaskConical className="h-3 w-3"/>验证用例（{currentFixtures.length}）
                      </button>
                    </div>
                  </div>

                  {/* 行动定义 */}
                  <Section label="行动定义">
                    <p className="text-[12.5px] text-slate-600 leading-relaxed">{current.definition}</p>
                  </Section>

                  {/* 状态变化：契约用 sideEffects 声明治理状态变化，Mock 环境不执行 */}
                  <Section label="状态变化">
                    {current.sideEffects.filter((s) => s !== 'NONE').length === 0 ? (
                      <p className="text-[11.5px] text-slate-400">契约未声明状态变化（sideEffects 无治理 / 数据写入项）。</p>
                    ) : (
                      <div className="space-y-1.5">
                        {current.sideEffects.filter((s) => s !== 'NONE').map((s) => (
                          <p key={s} className="text-[12px] text-slate-600 flex items-center gap-1.5">
                            <CircleDot className="h-3 w-3 text-slate-400 shrink-0"/>
                            {SIDE_EFFECT_LABEL[s] ?? s}
                          </p>
                        ))}
                        <p className="text-[10.5px] text-slate-400">状态变化来自契约的 sideEffects 声明；本演示环境不执行任何真实状态写入。</p>
                      </div>
                    )}
                  </Section>

                  {/* 前置条件 */}
                  <Section label="前置条件">
                    {current.preconditions.length === 0
                      ? <p className="text-[11.5px] text-slate-400">无前置条件</p>
                      : (
                        <ul className="space-y-1">
                          {current.preconditions.map((p) => (
                            <li key={p} className="text-[11.5px] text-slate-600 font-mono flex gap-1.5">
                              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500 mt-px"/>{p}
                            </li>
                          ))}
                        </ul>
                      )}
                  </Section>

                  {/* 成功结果：成功后产出对象（outputTypeIds），无虚构执行结果 */}
                  <Section label="成功结果">
                    {current.outputTypeIds.length === 0
                      ? <p className="text-[11.5px] text-slate-400">契约未声明成功后产出的对象类型。</p>
                      : (
                        <div className="space-y-1">
                          {current.outputTypeIds.map((id) => (
                            <p key={id} className="text-[11.5px] text-slate-600">
                              {typeById.get(id)?.nameCn ?? id}
                              <span className="ml-1.5 font-mono text-[9.5px] text-slate-400">{id}</span>
                              {typeById.get(id)?.origin === 'EXTERNAL' && <span className="ml-1 text-[9.5px] text-amber-600">外部引用</span>}
                            </p>
                          ))}
                          <p className="text-[10.5px] text-slate-400">成功结果 = 契约声明的产出对象（outputTypeIds）；本页不展示虚构的执行结果。</p>
                        </div>
                      )}
                  </Section>

                  {/* 副作用 */}
                  <Section label="副作用">
                    <div className="flex flex-wrap gap-1.5">
                      {current.sideEffects.map((s) => (
                        <span key={s} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          {SIDE_EFFECT_LABEL[s] ?? s}
                        </span>
                      ))}
                    </div>
                  </Section>
                </div>
              </div>

              {/* 右栏：输入 / 输出合同 · 实现边界 · 安全边界 */}
              <aside className="w-full lg:w-80 shrink-0 space-y-4 self-stretch">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4">
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-bold text-slate-600">输入合同</p>
                    <FieldList
                      label={`输入对象（${current.inputTypeIds.length}）`}
                      ids={current.inputTypeIds}
                      typeById={typeById}
                      emptyText="无输入类型"
                    />
                    <MonoField label="输入 IO Contract" value={current.inputContractRef}/>
                  </div>
                  <div className="space-y-1.5 border-t border-slate-100 pt-3">
                    <p className="text-[11px] font-bold text-slate-600">输出合同</p>
                    <FieldList
                      label={`产出对象（${current.outputTypeIds.length}）`}
                      ids={current.outputTypeIds}
                      typeById={typeById}
                      emptyText="无输出类型"
                    />
                    <MonoField label="输出 IO Contract" value={current.outputContractRef}/>
                  </div>
                </div>

                {/* 实现边界：该行动在当前视图的绑定与 Registry 对照 */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2.5">
                  <p className="text-[11px] font-bold text-slate-600">实现边界</p>
                  {currentBindings.length === 0 ? (
                    <p className="text-[11.5px] text-slate-400">当前视图没有该行动的实现绑定（见「实现绑定」页）。</p>
                  ) : (
                    <div className="space-y-2">
                      {currentBindings.map((b) => {
                        const r = resolveBinding(b, registry);
                        return (
                          <div key={b.id} className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-[10.5px] text-slate-600 truncate">{b.id}</span>
                              {r.issues.length === 0
                                ? <span className="px-1.5 py-0.5 rounded border text-[9.5px] font-bold bg-emerald-50 text-emerald-700 border-emerald-200 shrink-0">已解决</span>
                                : <span className="px-1.5 py-0.5 rounded border text-[9.5px] font-bold bg-amber-50 text-amber-700 border-amber-200 shrink-0">未解决</span>}
                            </div>
                            <p className="font-mono text-[9.5px] text-slate-400">{b.implementationId}@{b.implementationVersionId}</p>
                            {r.implementation && (
                              <p className="text-[10.5px] text-slate-500">
                                {r.implementation.transport === 'MOCK' ? '当前使用演示实现' : `传输方式 ${r.implementation.transport}`}
                                {!r.implementation.liveEndpointVerified && ' · 生产端点尚未验证'}
                              </p>
                            )}
                          </div>
                        );
                      })}
                      <p className="text-[10.5px] text-slate-400">绑定关系的维护在「实现绑定」页（仍经 ChangeSet 写入）。</p>
                    </div>
                  )}
                </div>

                {/* 安全边界 */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2.5">
                  <p className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-slate-400"/>安全边界
                  </p>
                  <div className="space-y-1.5 text-[11.5px] text-slate-600">
                    <p>
                      确认模式：<b className={current.confirmationMode === 'EXPLICIT' ? 'text-amber-700' : ''}>{CONFIRMATION_LABEL[current.confirmationMode]}</b>
                    </p>
                    {current.sideEffects.some((s) => GOVERNED_SIDE_EFFECTS.has(s)) ? (
                      <p className="text-slate-600">
                        该行动声明了治理级副作用（{current.sideEffects.filter((s) => GOVERNED_SIDE_EFFECTS.has(s)).join('、')}），
                        真实执行需治理审批与运行时权限；本演示不提供执行入口。
                      </p>
                    ) : (
                      <p className="text-slate-600">契约未声明治理级副作用（写入 / 外部作业）。</p>
                    )}
                    <p className="text-slate-500">安全边界由契约声明（confirmationMode + sideEffects）表达；运行时强制属于治理运行时职责。</p>
                  </div>
                </div>
              </aside>
            </>
          )}
        </div>
      )}

      {/* 验证用例（次级抽屉入口） */}
      {fixturesOpen && current && (
        <Drawer
          title={`验证用例 · ${current.nameCn}`}
          subtitle="用例按当前行动过滤；验证是只读模拟，结果不改变草稿修订。"
          onClose={() => setFixturesOpen(false)}
        >
          <div className="space-y-3">
            {currentFixtures.length === 0 ? (
              <p className="text-[12px] text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                该行动没有可用的验证用例（Fixture），本环境无法对其验证，也不显示任何测试成功状态。
              </p>
            ) : (
              <div className="space-y-2">
                {currentFixtures.map((f) => (
                  <div key={f.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="min-w-0">
                      <p className="text-[12px] font-bold text-slate-700">{f.nameCn}</p>
                      <p className="font-mono text-[9.5px] text-slate-400 truncate">{f.id}</p>
                    </div>
                    <button
                      onClick={() => runFixture(f)}
                      disabled={testAction.isPending}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-60 shrink-0"
                    >
                      {testAction.isPending && fixtureId === f.id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin"/>
                        : <Play className="h-3.5 w-3.5"/>}
                      运行验证用例
                    </button>
                  </div>
                ))}
              </div>
            )}
            {testAction.isError && (
              <p className="text-[12px] text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                {(testAction.error as Error).message}
              </p>
            )}
            {testAction.data && <TestResultPanel result={testAction.data.data} fixtureName={
              currentFixtures.find((f) => f.id === testAction.data?.data.fixtureId)?.nameCn ?? testAction.data.data.fixtureId
            }/>}
          </div>
        </Drawer>
      )}
    </div>
  );
}

function Section({label, children}: {label: string; children: ReactNode}) {
  return (
    <div className="border-t border-slate-100 pt-3 space-y-1.5 first:border-0 first:pt-0">
      <p className="text-[11px] font-bold text-slate-600">{label}</p>
      {children}
    </div>
  );
}

function TestResultPanel({result, fixtureName}: {result: ActionTestResult; fixtureName: string}) {
  const decisionCls = result.decision === 'ALLOW'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : result.decision === 'DENY'
      ? 'bg-red-50 text-red-700 border-red-200'
      : 'bg-slate-100 text-slate-600 border-slate-200';
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between gap-3 flex-wrap px-4 py-3 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[12px] font-bold text-slate-700">验证结果 · {fixtureName}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border font-mono ${decisionCls}`}>{result.decision}</span>
        </div>
        {/* 模拟验证标识：当前使用演示实现，未连接生产服务 */}
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <CircleDot className="h-3 w-3"/>模拟验证（演示实现）
        </span>
      </div>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2 max-w-md">
          <MockFlag ok={result.realExecution === false} label="未真实执行（模拟）"/>
          <MockFlag ok={result.modelChanged === false} label="不产生修订（只读模拟）"/>
        </div>
        <div className="space-y-1">
          <p className="text-[11px] font-bold text-slate-600">检查项</p>
          <div className="grid grid-cols-1 gap-1.5">
            {result.checks.map((c) => (
              <div key={c.name} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-mono ${
                c.passed ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
              }`}>
                <span className="font-bold">{c.passed ? 'PASS' : 'FAIL'}</span>{c.name}
              </div>
            ))}
          </div>
        </div>
        {result.expectedEffects.length > 0 && (
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-600">预期效果（模拟）</p>
            <div className="flex flex-wrap gap-1.5">
              {result.expectedEffects.map((e) => (
                <span key={e} className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-100 border border-slate-200 text-slate-600">{e}</span>
              ))}
            </div>
          </div>
        )}
        {result.simulatedAfterState !== null && (
          <details>
            <summary className="text-[11px] font-bold text-slate-600 cursor-pointer">模拟后状态</summary>
            <pre className="mt-1.5 p-3 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-mono overflow-x-auto">{JSON.stringify(result.simulatedAfterState, null, 2)}</pre>
          </details>
        )}
        {result.limitations.length > 0 && (
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-amber-700">限制说明</p>
            <ul className="space-y-0.5">
              {result.limitations.map((l) => <li key={l} className="text-[11px] text-amber-700">· {l}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function MockFlag({ok, label}: {ok: boolean; label: string}) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10.5px] font-mono border ${
      ok ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-red-50 border-red-200 text-red-700'
    }`}>
      {ok ? <ShieldCheck className="h-3 w-3"/> : <AlertTriangle className="h-3 w-3"/>}{label}
    </span>
  );
}

function FieldList({label, ids, typeById, emptyText}: {
  label: string;
  ids: string[];
  typeById: Map<string, ObjectTypeDefinition>;
  emptyText: string;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[10.5px] text-slate-400 font-semibold">{label}</p>
      {ids.length === 0
        ? <p className="text-[11.5px] text-slate-400">{emptyText}</p>
        : (
          <div className="space-y-1">
            {ids.map((id) => (
              <p key={id} className="text-[11.5px] text-slate-600">
                {typeById.get(id)?.nameCn ?? id}
                <span className="ml-1.5 font-mono text-[9.5px] text-slate-400">{id}</span>
                {typeById.get(id)?.origin === 'EXTERNAL' && <span className="ml-1 text-[9.5px] text-amber-600">外部引用</span>}
              </p>
            ))}
          </div>
        )}
    </div>
  );
}

function MonoField({label, value}: {label: string; value: string}) {
  return (
    <div className="space-y-1">
      <p className="text-[10.5px] text-slate-400 font-semibold">{label}</p>
      <p className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10.5px] font-mono text-slate-600 break-all">{value}</p>
    </div>
  );
}
