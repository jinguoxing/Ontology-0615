/**
 * 08 校验与影响（Batch 4）。
 *
 * - 仅草稿允许启动新的校验 / 影响分析（POST …/validation-runs、…/impact-analyses，
 *   202 + 异步任务，带 If-Match + Idempotency-Key）；正式版本页面只读，
 *   不提供运行入口。
 * - 任务经 GET /models/:id/jobs/:jobId 轮询（202 的 Location / Retry-After 指向
 *   该资源）；终止态后停止请求。RUNNING / SUCCEEDED / FAILED 三态区分呈现。
 * - 报告绑定 revision + contentHash + dependencyDigest（服务端 isCurrent 字段）；
 *   草稿推进后旧报告显示“已失效”，不得用于发布。
 * - 校验问题 severity 以产品文案呈现：ERROR=阻断 / WARNING=提醒 / INFO=信息；
 *   notExecuted 独立展示（未执行 ≠ 通过），禁止混入已通过。
 * - 影响分析覆盖 TYPE / RELATION / ACTION / IMPLEMENTATION / WORKFLOW / CONSUMER，
 *   显示 inventoryCompleteness（PARTIAL=未登记依赖未知）、limitations、
 *   consumerPinUpdates。
 * - 定位修复：DEPENDENCY_VERSION_REQUIRED 可直接锁定登记版本（写当前草稿，
 *   产生新修订）；其余问题跳转到对应能力页并选中构件。
 * - 计算任务为只读模拟：不连接真实治理运行时，不执行源数据检查。
 */
import {useState} from 'react';
import {
  AlertTriangle, Ban, CheckCircle2, CircleSlash, Clock, FileSearch, FlaskConical,
  Info, Loader2, Play, ShieldAlert, ShieldCheck, X,
} from 'lucide-react';
import type {
  AsyncJob, ImpactItem, ValidationIssue,
} from '../api/ontology-v1/types.generated';
import type {OntologyTab} from '../api/ontology-v1/routeContext';
import {useModelContext} from '../ontology/ModelContext';
import {DraftGateNotice, Drawer, useDraftWrite, useEnterDraft, WriteBanners} from '../ontology/draftWrite';
import {
  apiErrorMessage, useActorScope, useChangeSet, useJobPolling, useRegistry,
  useStartImpact, useStartValidation,
} from '../ontology/queries';
import {decodeReportSelection, encodeReportSelection} from '../ontology/reportSelection';
import {shortId} from '../ontology/presentation';

const SEVERITY_LABELS: Record<ValidationIssue['severity'], string> = {
  ERROR: '阻断',
  WARNING: '提醒',
  INFO: '信息',
};

const IMPACT_KIND_LABELS: Record<ImpactItem['kind'], string> = {
  TYPE: '类型',
  RELATION: '关系',
  ACTION: '行动',
  IMPLEMENTATION: '实现绑定',
  WORKFLOW: '流程',
  CONSUMER: '消费方',
};

/** 问题路径首段 → 定位修复的目标能力页。 */
const LOCATE_TABS: Record<string, OntologyTab> = {
  objectTypes: 'object-types',
  relations: 'relations',
  constraints: 'relations',
  actions: 'actions',
  implementationBindings: 'implementations',
  workflowRefs: 'workflows',
};

type IssueFilter = 'all' | 'blocking' | 'structure' | 'contract';

const ISSUE_FILTERS: {id: IssueFilter; label: string}[] = [
  {id: 'all', label: '全部结果'},
  {id: 'blocking', label: '阻断项'},
  {id: 'structure', label: '模型结构'},
  {id: 'contract', label: '契约兼容'},
];

function issueFilterOf(issue: ValidationIssue): IssueFilter {
  if (issue.severity === 'ERROR') return 'blocking';
  const root = issue.path.split('/')[0];
  return ['objectTypes', 'relations', 'constraints', 'dependencies'].includes(root) ? 'structure' : 'contract';
}

const hash8 = (h: string | undefined) => (h ? h.slice(0, 8) + '…' : '—');

export default function ValidationImpactPage() {
  const ctx = useModelContext();
  const scope = useActorScope();
  const registryQuery = useRegistry(scope);

  const isDraft = ctx.isDraft;
  const changeSetId = isDraft && 'changeSetId' in ctx.view ? ctx.view.changeSetId : null;
  const revision = isDraft && 'changeSetId' in ctx.view ? ctx.view.revision : undefined;

  // 草稿登记值：最新修订 / OPEN 状态（启动新任务只对最新修订有效）。
  const csQuery = useChangeSet(scope, ctx.modelId, changeSetId);
  const latestRevision = csQuery.data?.revision;
  const isOpen = csQuery.data?.status === 'OPEN';
  const atLatest = latestRevision !== undefined && revision === latestRevision;

  const selection = decodeReportSelection(ctx.selectedId);
  const vJobQuery = useJobPolling(scope, ctx.modelId, changeSetId ?? undefined, revision, selection.validationJobId);
  const iJobQuery = useJobPolling(scope, ctx.modelId, changeSetId ?? undefined, revision, selection.impactJobId);
  const vJob = vJobQuery.data;
  const iJob = iJobQuery.data;

  const [startError, setStartError] = useState<string | null>(null);
  const startValidation = useStartValidation(scope, ctx.modelId);
  const startImpact = useStartImpact(scope, ctx.modelId);

  // 定位修复（锁定依赖版本）写当前草稿；沿用 Batch 3 写链路与横幅。
  const enter = useEnterDraft({scope, modelId: ctx.modelId, model: ctx.model, resolvedView: ctx.resolvedView, selectedId: ctx.selectedId, navigateToView: ctx.navigateToView});
  const w = useDraftWrite({
    scope, modelId: ctx.modelId, resolvedView: ctx.resolvedView,
    draftId: changeSetId, selectedId: ctx.selectedId, navigateToView: ctx.navigateToView,
  });

  const [inspectIssue, setInspectIssue] = useState<ValidationIssue | null>(null);
  const [inspectImpact, setInspectImpact] = useState<ImpactItem | null>(null);
  const [issueFilter, setIssueFilter] = useState<IssueFilter>('all');
  const [impactKind, setImpactKind] = useState<'all' | ImpactItem['kind']>('all');

  const canStart = isDraft && ctx.canEdit && isOpen && atLatest;

  const selectReport = (next: {validationJobId?: string; impactJobId?: string}) => {
    ctx.select(encodeReportSelection({...selection, ...next}));
  };

  const run = (kind: 'validation' | 'impact') => {
    if (!changeSetId || revision === undefined || !ctx.resolvedView) return;
    setStartError(null);
    const input = {changeSetId, revision, etag: ctx.resolvedView.etag};
    const mutate = kind === 'validation' ? startValidation : startImpact;
    mutate.mutate(input, {
      onSuccess: (job) => selectReport(kind === 'validation' ? {validationJobId: job.data.id} : {impactJobId: job.data.id}),
      onError: (e) => setStartError(apiErrorMessage(e)),
    });
  };

  /** 锁定依赖登记版本（DEPENDENCY_VERSION_REQUIRED 的定位修复）。 */
  const lockDependency = (packageId: string, versionId: string) => {
    w.save(
      [{op: 'UPSERT', collection: 'dependencies', id: packageId, value: {id: packageId, packageId, versionId}}],
      `已锁定外部依赖 ${packageId} 的版本（${versionId}）`,
    );
    setInspectIssue(null);
  };

  const locateIssue = (issue: ValidationIssue) => {
    const tab = LOCATE_TABS[issue.path.split('/')[0]];
    if (!tab) return;
    setInspectIssue(null);
    // 切到对应能力页并选中该构件（tab + selectedId 必须一次导航完成）。
    ctx.navigateToView(ctx.route.view, {tab, selectedId: issue.targetId});
  };

  // ---- 校验结果投影 ----
  const vResult = vJob?.status === 'SUCCEEDED' && vJob.result && 'issues' in vJob.result ? vJob.result : null;
  const issues = vResult?.issues ?? [];
  const counts = {
    ERROR: issues.filter((i) => i.severity === 'ERROR').length,
    WARNING: issues.filter((i) => i.severity === 'WARNING').length,
    INFO: issues.filter((i) => i.severity === 'INFO').length,
  };
  const visibleIssues = issueFilter === 'all' ? issues : issues.filter((i) => issueFilterOf(i) === issueFilter);

  // ---- 影响结果投影 ----
  const iResult = iJob?.status === 'SUCCEEDED' && iJob.result && 'items' in iJob.result ? iJob.result : null;
  const impactItems = iResult?.items ?? [];
  const kindCounts = impactItems.reduce<Record<string, number>>((acc, it) => {
    acc[it.kind] = (acc[it.kind] ?? 0) + 1;
    return acc;
  }, {});
  const visibleImpact = impactKind === 'all' ? impactItems : impactItems.filter((it) => it.kind === impactKind);

  return (
    <div className="space-y-4">
      {/* 页面边界声明 */}
      <div className="flex items-start gap-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] text-slate-600">
        <Ban className="h-4 w-4 shrink-0 mt-0.5 text-slate-400"/>
        <p>
          本页对草稿修订运行<b>只读计算任务</b>：校验检查模型定义与契约兼容，影响分析推导变更影响路径；
          <b>不修改草稿内容、不执行源数据检查、不连接真实治理运行时</b>。报告绑定修订与内容校验值，草稿推进后旧报告自动失效。
        </p>
      </div>

      {/* 只读视图：正式版本 / viewer 身份 */}
      {!isDraft && (
        <DraftGateNotice reason={ctx.readOnlyReason} canEdit={ctx.canEdit} enter={enter}/>
      )}
      {isDraft && ctx.resolvedView && !ctx.capabilities.includes('ontology.edit') && (
        // viewer 读草稿时服务端同样返回 readOnly=true（ctx.readOnlyReason 因此不会
        // 落到 viewer-permission 分支）；权限缺失才是真实原因，按 editPolicy 同序判断。
        <DraftGateNotice reason="viewer-permission" canEdit={ctx.canEdit} enter={enter}/>
      )}
      {isDraft && !atLatest && latestRevision !== undefined && (
        <div className="flex items-start gap-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[12.5px] text-slate-700">
          <Info className="h-4 w-4 shrink-0 mt-0.5 text-slate-400"/>
          <p>
            正在查看历史修订 <strong>r{revision}</strong>（当前最新为 <strong>r{latestRevision}</strong>）。
            新的校验与影响分析只对最新修订启动；历史报告仍可查看，但会标记为已失效。
          </p>
        </div>
      )}

      <WriteBanners w={w}/>

      {/* 运行控制：仅草稿 + 编辑权限 + 最新修订 */}
      {isDraft && (
        <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="text-[13px] text-slate-600">
            <p className="font-bold text-slate-800">对当前草稿修订运行</p>
            <p className="text-slate-500 mt-0.5">
              目标：编辑草稿 · r<span className="font-mono font-semibold">{revision}</span>
              {!isOpen && <span className="ml-2 px-1.5 py-0.5 rounded text-[12px] font-bold bg-slate-100 text-slate-500">草稿已结束（不可再运行）</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => run('validation')}
              disabled={!canStart || startValidation.isPending}
              data-testid="start-validation"
              title={canStart ? '启动校验计算（只读任务，带 If-Match 与幂等键）' : '需草稿视图、编辑权限且处于最新修订'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {startValidation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : <Play className="h-3.5 w-3.5"/>}运行校验
            </button>
            <button
              onClick={() => run('impact')}
              disabled={!canStart || startImpact.isPending}
              data-testid="start-impact"
              title={canStart ? '启动影响分析（只读任务，带 If-Match 与幂等键）' : '需草稿视图、编辑权限且处于最新修订'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {startImpact.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : <FileSearch className="h-3.5 w-3.5"/>}运行影响分析
            </button>
          </div>
        </div>
      )}

      {startError && (
        <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-[12.5px] text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5"/>
          <p className="flex-1">任务启动失败：{startError}</p>
          <button onClick={() => setStartError(null)} className="shrink-0 opacity-60 hover:opacity-100"><X className="h-4 w-4"/></button>
        </div>
      )}

      {/* 两份报告 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
        {/* 校验报告 */}
        <section className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3" data-testid="validation-report">
          <header className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <FlaskConical className="h-4 w-4 text-slate-400"/>校验报告
            </h2>
            {vJob && <JobStatusPill job={vJob} testid="validation-status"/>}
          </header>
          {!vJob && <EmptyReport text="尚未运行校验。运行后在此查看阻断项、提醒与信息。"/>}
          {vJob && (
            <>
              <JobBindingRow job={vJob}/>
              {vJob.status === 'RUNNING' && <RunningNote/>}
              {vJob.status === 'FAILED' && <FailedNote error={vJob.error}/>}
              {vJob.status === 'SUCCEEDED' && !vJob.isCurrent && <StaleBanner job={vJob} latestRevision={latestRevision}/>}
              {vResult && (
                <>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                      vResult.passed ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {vResult.passed ? <ShieldCheck className="h-3 w-3"/> : <ShieldAlert className="h-3 w-3"/>}
                      {vResult.passed ? '未发现阻断项' : `存在 ${counts.ERROR} 个阻断项`}
                    </span>
                    {counts.ERROR > 0 && <CountChip label="阻断" n={counts.ERROR} tone="red"/>}
                    {counts.WARNING > 0 && <CountChip label="提醒" n={counts.WARNING} tone="amber"/>}
                    {counts.INFO > 0 && <CountChip label="信息" n={counts.INFO} tone="sky"/>}
                  </div>
                  <div className="flex items-center gap-1 flex-wrap" data-testid="issue-filters">
                    {ISSUE_FILTERS.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setIssueFilter(f.id)}
                        className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                          issueFilter === f.id ? 'bg-blue-50 text-blue-700 border-blue-200' : 'text-slate-500 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {f.label}
                        {f.id === 'blocking' && counts.ERROR > 0 ? `（${counts.ERROR}）` : ''}
                      </button>
                    ))}
                  </div>
                  <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-72 overflow-y-auto" data-testid="issue-list">
                    {visibleIssues.length === 0 && (
                      <p className="px-3 py-6 text-center text-[12px] text-slate-400">该筛选下没有问题。</p>
                    )}
                    {visibleIssues.map((issue, idx) => (
                      <button
                        key={`${issue.code}-${issue.targetId}-${idx}`}
                        onClick={() => setInspectIssue(issue)}
                        className="w-full text-left px-3 py-2.5 hover:bg-slate-50 flex items-start gap-2"
                      >
                        <span className={`shrink-0 mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          issue.severity === 'ERROR' ? 'bg-red-100 text-red-700'
                            : issue.severity === 'WARNING' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'
                        }`}>{SEVERITY_LABELS[issue.severity]}</span>
                        <span className="min-w-0">
                          <span className="block text-[12.5px] font-semibold text-slate-800 truncate">{issue.message}</span>
                          <span className="block text-[10.5px] font-mono text-slate-400 truncate">{issue.code} · {issue.path}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                  {/* 已执行 / 未执行分开呈现：未执行绝不写成通过 */}
                  <div className="pt-1 space-y-2">
                    <p className="text-[11px] font-bold text-slate-500">已执行的检查（{vResult.evaluatedChecks.length}）</p>
                    <div className="flex flex-wrap gap-1">
                      {vResult.evaluatedChecks.map((c) => (
                        <span key={c} className="px-1.5 py-0.5 rounded border text-[10px] font-mono bg-slate-50 text-slate-500 border-slate-200">{c}</span>
                      ))}
                    </div>
                    <div className="border border-dashed border-slate-300 rounded-xl p-3 bg-slate-50/60" data-testid="not-executed">
                      <p className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                        <CircleSlash className="h-3.5 w-3.5 text-slate-400"/>未执行的检查（{vResult.notExecuted.length}）——结果未知，不代表通过
                      </p>
                      <ul className="mt-1.5 space-y-1">
                        {vResult.notExecuted.map((n) => (
                          <li key={n} className="text-[11.5px] text-slate-500 flex items-start gap-1.5">
                            <span className="mt-1.5 h-1 w-1 rounded-full bg-slate-400 shrink-0"/>{n}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </section>

        {/* 影响分析报告 */}
        <section className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3" data-testid="impact-report">
          <header className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <FileSearch className="h-4 w-4 text-slate-400"/>影响分析报告
            </h2>
            {iJob && <JobStatusPill job={iJob} testid="impact-status"/>}
          </header>
          {!iJob && <EmptyReport text="尚未运行影响分析。运行后在此查看受影响的类型、关系、行动、实现、流程与消费方。"/>}
          {iJob && (
            <>
              <JobBindingRow job={iJob}/>
              {iJob.status === 'RUNNING' && <RunningNote/>}
              {iJob.status === 'FAILED' && <FailedNote error={iJob.error}/>}
              {iJob.status === 'SUCCEEDED' && !iJob.isCurrent && <StaleBanner job={iJob} latestRevision={latestRevision}/>}
              {iResult && (
                <>
                  <div className={`flex items-start gap-2 px-3 py-2.5 rounded-xl border text-[12px] ${
                    iResult.inventoryCompleteness === 'PARTIAL'
                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`} data-testid="impact-completeness">
                    {iResult.inventoryCompleteness === 'PARTIAL'
                      ? <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5"/>
                      : <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5"/>}
                    <p>
                      {iResult.inventoryCompleteness === 'PARTIAL'
                        ? <><b>依赖登记不完整（PARTIAL）</b>：仅覆盖已登记依赖；<b>未登记依赖的影响未知</b>，不能视为“无影响”。</>
                        : <><b>依赖登记完整（COMPLETE）</b>：影响范围覆盖全部已登记依赖。</>}
                    </p>
                  </div>
                  <p className="text-[11.5px] text-slate-500 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-400"/>
                    消费方固定版本未自动升级（本次 {iResult.consumerPinUpdates} 项）——升级由消费方自行决策。
                  </p>
                  {iResult.limitations.length > 0 && (
                    <ul className="space-y-1 border border-slate-200 rounded-xl p-3 bg-slate-50/60">
                      {iResult.limitations.map((l) => (
                        <li key={l} className="text-[11.5px] text-slate-500 flex items-start gap-1.5">
                          <span className="mt-1.5 h-1 w-1 rounded-full bg-slate-400 shrink-0"/>{l}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="flex items-center gap-1 flex-wrap" data-testid="impact-filters">
                    {(['all', 'TYPE', 'RELATION', 'ACTION', 'IMPLEMENTATION', 'WORKFLOW', 'CONSUMER'] as const).map((k) => (
                      <button
                        key={k}
                        onClick={() => setImpactKind(k)}
                        className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                          impactKind === k ? 'bg-blue-50 text-blue-700 border-blue-200' : 'text-slate-500 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {k === 'all' ? '全部' : IMPACT_KIND_LABELS[k]}
                        {k !== 'all' && kindCounts[k] ? `（${kindCounts[k]}）` : ''}
                      </button>
                    ))}
                  </div>
                  <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-72 overflow-y-auto" data-testid="impact-list">
                    {visibleImpact.length === 0 && (
                      <p className="px-3 py-6 text-center text-[12px] text-slate-400">该筛选下没有受影响项。</p>
                    )}
                    {visibleImpact.map((it, idx) => (
                      <button
                        key={`${it.kind}-${it.id}-${idx}`}
                        onClick={() => setInspectImpact(it)}
                        className="w-full text-left px-3 py-2.5 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {IMPACT_KIND_LABELS[it.kind]}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[12.5px] font-semibold text-slate-800 truncate">{it.name}</span>
                          <span className="block text-[10.5px] font-mono text-slate-400 truncate">{it.id}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </section>
      </div>

      {/* 问题 Inspector（右侧抽屉）：仅在选中问题 / 受影响项时渲染 */}
      {(inspectIssue || inspectImpact) && (
        <Drawer
          title={inspectIssue ? '问题详情' : '受影响项详情'}
          subtitle="code、位置、原因、修复建议与依赖路径（技术语义；原始值见「诊断信息」抽屉）。"
          onClose={() => { setInspectIssue(null); setInspectImpact(null); }}
        >
          {inspectIssue && (
          <div className="space-y-4 text-[12.5px]" data-testid="issue-inspector">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                inspectIssue.severity === 'ERROR' ? 'bg-red-50 text-red-700 border border-red-200'
                  : inspectIssue.severity === 'WARNING' ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-sky-50 text-sky-700 border border-sky-200'
              }`}>{SEVERITY_LABELS[inspectIssue.severity]}</span>
              <span className="font-mono text-[11px] text-slate-500">{inspectIssue.code}</span>
            </div>
            <Field label="位置"><span className="font-mono text-[11.5px] text-slate-600 break-all">{inspectIssue.path}</span></Field>
            <Field label="原因"><p className="text-slate-700">{inspectIssue.message}</p></Field>
            <Field label="修复建议"><p className="text-slate-700">{inspectIssue.remediation}</p></Field>
            <Field label="涉及构件"><span className="font-mono text-[11.5px] text-slate-600">{inspectIssue.targetId}</span></Field>

            {/* 定位修复 */}
            <div className="border-t border-slate-100 pt-3 space-y-2">
              <p className="text-[11px] font-bold text-slate-500">定位修复</p>
              {inspectIssue.code === 'DEPENDENCY_VERSION_REQUIRED' ? (
                registryQuery.isLoading ? <p className="text-slate-400">读取登记版本…</p> : (
                  <div className="space-y-2">
                    <p className="text-slate-600">
                      包 <span className="font-mono font-semibold">{inspectIssue.targetId}</span> 尚未锁定版本。
                      从登记版本中锁定后写入当前草稿（产生新修订）：
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(registryQuery.data?.packages.find((p) => p.id === inspectIssue.targetId)?.versions ?? []).map((v) => (
                        <button
                          key={v.versionId}
                          onClick={() => lockDependency(inspectIssue.targetId, v.versionId)}
                          disabled={!ctx.canEdit || w.saving}
                          data-testid="fix-dependency"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          {w.saving ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : <CheckCircle2 className="h-3.5 w-3.5"/>}
                          锁定 {inspectIssue.targetId} @ {v.versionId}
                        </button>
                      ))}
                    </div>
                    {!ctx.canEdit && <p className="text-[11px] text-slate-400">当前身份或视图只读，无法写入草稿。</p>}
                  </div>
                )
              ) : LOCATE_TABS[inspectIssue.path.split('/')[0]] ? (
                <div className="space-y-2">
                  <p className="text-slate-600">跳转到对应能力页并选中该构件进行修改：</p>
                  <button
                    onClick={() => locateIssue(inspectIssue)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
                  >
                    前往「{issueLocateLabel(inspectIssue)}」修改 {inspectIssue.targetId}
                  </button>
                </div>
              ) : (
                <p className="text-slate-500">该问题需按修复建议处理，本页不提供直接修改入口。</p>
              )}
            </div>
          </div>
        )}
        {inspectImpact && (
          <div className="space-y-4 text-[12.5px]" data-testid="impact-inspector">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                {IMPACT_KIND_LABELS[inspectImpact.kind]}
              </span>
              <span className="font-semibold text-slate-800">{inspectImpact.name}</span>
            </div>
            <Field label="标识"><span className="font-mono text-[11.5px] text-slate-600">{inspectImpact.id}</span></Field>
            <Field label="原因"><p className="text-slate-700">{inspectImpact.reason}</p></Field>
            <Field label="依赖路径">
              <ol className="space-y-1">
                {inspectImpact.path.map((seg, i) => {
                  const [prefix, id] = [seg.split(':')[0], seg.split(':').slice(1).join(':')];
                  const kindLabel = {type: '类型', relation: '关系', action: '行动', binding: '实现绑定', workflow: '流程', consumer: '消费方'}[prefix] ?? prefix;
                  return (
                    <li key={`${seg}-${i}`} className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-300 font-mono w-4 text-right">{i + 1}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500">{kindLabel}</span>
                      <span className="font-mono text-[11.5px] text-slate-600">{id}</span>
                    </li>
                  );
                })}
              </ol>
            </Field>
          </div>
        )}
        </Drawer>
      )}
    </div>
  );
}

const LOCATE_TAB_LABELS: Record<OntologyTab, string> = {
  'overview': '模型总览',
  'object-types': '对象类型',
  'relations': '关系与约束',
  'actions': '行动契约',
  'implementations': '实现绑定',
  'workflows': '流程关联',
  'validation': '校验与影响',
  'release': '版本与发布',
};

function issueLocateLabel(issue: ValidationIssue): string {
  const tab = LOCATE_TABS[issue.path.split('/')[0]];
  return tab ? LOCATE_TAB_LABELS[tab] : '对应能力页';
}

function Field({label, children}: {label: string; children: React.ReactNode}) {
  return (
    <div>
      <p className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
      {children}
    </div>
  );
}

function EmptyReport({text}: {text: string}) {
  return <p className="py-8 text-center text-[12px] text-slate-400">{text}</p>;
}

function JobStatusPill({job, testid}: {job: AsyncJob; testid: string}) {
  const map = {
    RUNNING: {label: '计算中', cls: 'bg-blue-50 text-blue-700 border-blue-200', icon: <Loader2 className="h-3 w-3 animate-spin"/>},
    SUCCEEDED: {label: '已完成', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle2 className="h-3 w-3"/>},
    FAILED: {label: '失败', cls: 'bg-red-50 text-red-700 border-red-200', icon: <AlertTriangle className="h-3 w-3"/>},
  }[job.status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${map.cls}`} data-testid={testid}>
      {map.icon}{map.label}
    </span>
  );
}

/** 报告绑定：revision + 内容校验值 + 依赖指纹（任务实体自带，服务端裁决依据）。 */
function JobBindingRow({job}: {job: AsyncJob}) {
  return (
    <div className="flex items-center gap-2 flex-wrap text-[12px] text-slate-400">
      <span>绑定 <span className="font-mono font-semibold text-slate-500">r{job.revision}</span></span>
      <span title="contentHash（内容校验值，完整值见诊断信息）">内容校验值 <span className="font-mono">{hash8(job.contentHash)}</span></span>
      <span title="dependencyDigest（依赖登记指纹，完整值见诊断信息）">依赖指纹 <span className="font-mono">{hash8(job.dependencyDigest)}</span></span>
      <span className="font-mono" title="任务标识（完整值见诊断信息）">{shortId(job.id)}</span>
      <span className={`px-1.5 py-0.5 rounded text-[12px] font-bold ${
        job.isCurrent ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
      }`}>
        {job.isCurrent ? '对当前修订有效' : '已失效'}
      </span>
    </div>
  );
}

function RunningNote() {
  return (
    <div className="flex items-center gap-2 px-3 py-2.5 bg-blue-50/60 border border-blue-100 rounded-xl text-[12px] text-blue-700">
      <Loader2 className="h-4 w-4 animate-spin"/>正在计算…（任务完成后自动更新，无需手动刷新）
    </div>
  );
}

function FailedNote({error}: {error: string | null}) {
  return (
    <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl text-[12px] text-red-700">
      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5"/>
      <p>任务计算失败{error ? `：${error}` : ''}。可重新运行；服务端不会保留失败结果。</p>
    </div>
  );
}

function StaleBanner({job, latestRevision}: {job: AsyncJob; latestRevision: number | undefined}) {
  return (
    <div className="flex items-start gap-2 px-3 py-2.5 bg-orange-50 border border-orange-200 rounded-xl text-[12px] text-orange-800" data-testid="stale-banner">
      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5"/>
      <p>
        <b>报告已失效</b>（草稿修订或依赖登记已变化）：报告绑定 r{job.revision}
        {latestRevision !== undefined && <>，当前草稿为 r{latestRevision}</>}。
        失效报告不能用于发布，请对当前修订重新运行。
      </p>
    </div>
  );
}

function CountChip({label, n, tone}: {label: string; n: number; tone: 'red' | 'amber' | 'sky'}) {
  const cls = {red: 'bg-red-50 text-red-700 border-red-200', amber: 'bg-amber-50 text-amber-700 border-amber-200', sky: 'bg-sky-50 text-sky-700 border-sky-200'}[tone];
  return <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${cls}`}>{label} {n}</span>;
}
