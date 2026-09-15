/**
 * 行动契约页（Batch 3 · 05）。
 *
 * - 读取：GET /models/:id/actions（同一 ViewReference）；默认选中
 *   confirmAssertion（URL selected 参数，可深链接复现）。
 * - 展示：输入 / 输出类型、IO Contract 引用、确认模式、前置条件、副作用、
 *   Owner Service 与定义——全部来自 HTTP 返回，不在组件内硬编码种子。
 * - 验证：GET /api/v1/ontology/action-fixtures + POST /models/:id/action-tests。
 *   结果明确标识 MOCK（realExecution=false、modelChanged=false），不改变模型
 *   revision，也不宣称连接了生产 Runtime。
 * - 本页没有“执行治理实例”入口：Action Contract 按钮不得直接执行治理动作；
 *   没有 Fixture 的行动不显示任何测试成功状态。
 */
import {useEffect, useMemo, useState} from 'react';
import {
  AlertTriangle,
  Ban,
  CircleDot,
  FlaskConical,
  Loader2,
  Play,
  Search,
  ShieldCheck,
} from 'lucide-react';
import type {ActionContract, ActionFixture, ActionTestResult, ObjectTypeDefinition} from '../api/ontology-v1/types.generated';
import {useActionFixtures, useActions, useActorScope, useTestAction} from '../ontology/queries';
import {useModelContext} from '../ontology/ModelContext';

const DEFAULT_ACTION_ID = 'confirmAssertion';

const SIDE_EFFECT_LABEL: Record<string, string> = {
  NONE: '无副作用',
  SOURCE_READ: '读取数据源',
  GOVERNANCE_STATE: '治理状态写入',
  EXTERNAL_JOB: '外部作业',
  SOURCE_WRITE: '写入数据源',
};

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
  const testAction = useTestAction(modelId);

  const [filter, setFilter] = useState('');
  const [fixtureId, setFixtureId] = useState<string | null>(null);

  const types = useMemo(() => resolvedView?.document.objectTypes ?? [], [resolvedView]);
  const typeById = useMemo(() => new Map(types.map((t) => [t.id, t])), [types]);
  const actions = actionsQuery.data?.items ?? [];
  const fixtures = fixturesQuery.data?.items ?? [];

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
      {/* 页面边界声明：契约查看 + 用例验证，不是治理执行入口 */}
      <div className="flex items-start gap-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] text-slate-600">
        <Ban className="h-4 w-4 shrink-0 mt-0.5 text-slate-400"/>
        <p>
          本页只展示行动契约（Action Contract）并通过验证用例（Fixture）做<b>只读模拟验证</b>。
          行动契约按钮不直接执行治理实例动作；治理执行需要真实治理运行时（本演示环境未连接）。
        </p>
      </div>

      {actionsQuery.isLoading ? (
        <div className="bg-white border border-slate-200 rounded-2xl py-16 flex flex-col items-center gap-2 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-blue-500"/>
          <p className="text-xs">正在读取 GET /models/{modelId}/actions …</p>
        </div>
      ) : actionsQuery.isError ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 flex items-start gap-2 text-[12.5px] text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5"/>
          <p>{(actionsQuery.error as Error).message}</p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-4 items-start">
          {/* 行动列表 */}
          <aside className="w-full lg:w-80 shrink-0 bg-white border border-slate-200 rounded-2xl p-3 space-y-2">
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
            <div className="max-h-[560px] overflow-y-auto space-y-1 pr-0.5">
              {filtered.map((a) => {
                const active = a.id === selectedId;
                return (
                  <button
                    key={a.id}
                    onClick={() => {select(a.id); setFixtureId(null);}}
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

          {/* Inspector + 验证 */}
          <div className="flex-1 min-w-0 space-y-4">
            {!current ? (
              <div className="bg-white border border-dashed border-slate-300 rounded-2xl py-16 text-center text-xs text-slate-400">
                在左侧选择一个行动契约{selectedId && <>（URL 中的 selected={selectedId} 不存在于当前视图）</>}
              </div>
            ) : (
              <>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <h2 className="text-base font-bold text-slate-800">{current.nameCn}</h2>
                      <p className="text-[11px] font-mono text-slate-400 mt-0.5">{current.id} · code {current.code}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        Owner {current.ownerService}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        current.confirmationMode === 'EXPLICIT' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        确认模式 {CONFIRMATION_LABEL[current.confirmationMode]}
                      </span>
                    </div>
                  </div>
                  <p className="text-[12.5px] text-slate-600 leading-relaxed">{current.definition}</p>

                  <div className="grid sm:grid-cols-2 gap-3 pt-1">
                    <FieldList
                      label={`输入类型 inputTypeIds（${current.inputTypeIds.length}）`}
                      ids={current.inputTypeIds}
                      typeById={typeById}
                      emptyText="无输入类型"
                    />
                    <FieldList
                      label={`输出类型 outputTypeIds（${current.outputTypeIds.length}）`}
                      ids={current.outputTypeIds}
                      typeById={typeById}
                      emptyText="无输出类型"
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <MonoField label="输入 IO Contract" value={current.inputContractRef}/>
                    <MonoField label="输出 IO Contract" value={current.outputContractRef}/>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-bold text-slate-600">副作用 sideEffects</p>
                    <div className="flex flex-wrap gap-1.5">
                      {current.sideEffects.map((s) => (
                        <span key={s} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 font-mono">
                          {s}{SIDE_EFFECT_LABEL[s] ? `（${SIDE_EFFECT_LABEL[s]}）` : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-bold text-slate-600">前置条件 preconditions（{current.preconditions.length}）</p>
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
                  </div>
                </div>

                {/* 验证用例 */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-slate-100 space-y-1">
                    <h3 className="text-[13px] font-bold text-slate-700 flex items-center gap-1.5">
                      <FlaskConical className="h-3.5 w-3.5 text-slate-400"/>
                      验证用例（Action Fixtures）
                      <span className="font-mono text-[10px] font-normal text-slate-400">GET /action-fixtures · POST /action-tests</span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      用例按 actionId 过滤；验证是只读模拟，结果不改变模型 revision。
                    </p>
                  </div>
                  <div className="p-5 space-y-3">
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
                </div>
              </>
            )}
          </div>
        </div>
      )}
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
        {/* MOCK 标识：模拟验证，未连接生产 Runtime */}
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <CircleDot className="h-3 w-3"/>模拟验证（MOCK）
        </span>
      </div>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2 max-w-md">
          <MockFlag ok={result.realExecution === false} label="realExecution=false（未真实执行）"/>
          <MockFlag ok={result.modelChanged === false} label="modelChanged=false（不产生修订）"/>
        </div>
        <div className="space-y-1">
          <p className="text-[11px] font-bold text-slate-600">检查项 checks</p>
          <div className="grid sm:grid-cols-2 gap-1.5">
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
            <p className="text-[11px] font-bold text-slate-600">预期效果 expectedEffects（模拟）</p>
            <div className="flex flex-wrap gap-1.5">
              {result.expectedEffects.map((e) => (
                <span key={e} className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-100 border border-slate-200 text-slate-600">{e}</span>
              ))}
            </div>
          </div>
        )}
        {result.simulatedAfterState !== null && (
          <details>
            <summary className="text-[11px] font-bold text-slate-600 cursor-pointer">模拟后状态 simulatedAfterState</summary>
            <pre className="mt-1.5 p-3 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-mono overflow-x-auto">{JSON.stringify(result.simulatedAfterState, null, 2)}</pre>
          </details>
        )}
        {result.limitations.length > 0 && (
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-amber-700">限制说明 limitations</p>
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
    <div className="space-y-1.5">
      <p className="text-[11px] font-bold text-slate-600">{label}</p>
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
      <p className="text-[11px] font-bold text-slate-600">{label}</p>
      <p className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10.5px] font-mono text-slate-600 break-all">{value}</p>
    </div>
  );
}
