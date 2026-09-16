/**
 * 09 版本与发布（Batch 4）。
 *
 * - 左侧：目标版本 / 当前版本 / 历史版本（GET /versions 真实数据）。
 * - 中间：草稿真实 Diff（GET /changesets/:id/diff?revision=）按 collection 分组；
 *   发布表单：releaseNotes 必填、必须选择当前有效的校验与影响报告
 *   （revision / contentHash / dependencyDigest 与报告一致，服务端 isCurrent 裁决）、
 *   校验存在阻断项禁止发布、影响 PARTIAL 必须勾选风险知悉。
 * - 按钮禁用只是引导，服务端仍是最终裁决方（403 / 409 / 412 全部原样呈现）。
 * - 发布成功：切换到新 versionId 只读视图，显示 publicationId / versionId /
 *   publishedAt 与「未自动启动流程」「消费方固定版本未自动升级」；失败保留
 *   草稿与表单内容。不提供审批流，发布后不自动启动任何 Workflow。
 * - 底部：审计记录（GET /audit-events）。
 */
import {useState} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {
  AlertTriangle, Ban, CheckCircle2, ChevronRight, Clock, FileClock, GitCompare,
  History, Loader2, Lock, Package, Rocket, ShieldAlert, ShieldCheck, X,
} from 'lucide-react';
import type {DiffItem} from '../api/ontology-v1/types.generated';
import {ontologyKeys} from '../api/ontology-v1/queryKeys';
import {useModelContext} from '../ontology/ModelContext';
import {DraftGateNotice, useEnterDraft} from '../ontology/draftWrite';
import {
  apiErrorMessage, useActorScope, useAuditEvents, useChangeSet, useDiff,
  useJobPolling, usePublishVersion, useVersions,
} from '../ontology/queries';
import {decodeReportSelection} from '../ontology/reportSelection';
import {shortId} from '../ontology/presentation';

const COLLECTION_LABELS: Record<DiffItem['collection'], string> = {
  objectTypes: '对象类型',
  relations: '关系',
  constraints: '约束',
  actions: '行动契约',
  implementationBindings: '实现绑定',
  workflowRefs: '流程引用',
  dependencies: '外部依赖',
};

const COLLECTION_ORDER: DiffItem['collection'][] = [
  'objectTypes', 'relations', 'constraints', 'actions', 'implementationBindings', 'workflowRefs', 'dependencies',
];

const CHANGE_LABELS: Record<DiffItem['change'], string> = {ADD: '新增', MODIFY: '修改', REMOVE: '移除'};

/** 服务端发布裁决 → 产品文案。 */
const PUBLISH_ERROR_COPY: Record<string, string> = {
  REVISION_CONFLICT: '草稿已被更新（412）。请载入最新修订后重试；表单内容已保留。',
  REPORT_STALE: '所选报告已失效（修订 / 内容校验值 / 依赖登记已变化）。请在校验与影响页对当前修订重新运行。',
  REPORT_NOT_READY: '所选报告尚未完成（计算中）。请等待任务完成后重试。',
  VALIDATION_BLOCKED: '校验存在阻断项，服务端已拒绝发布。请修复全部阻断项并重新校验。',
  FINAL_VALIDATION_FAILED: '发布事务重检未通过（服务端在发布瞬间重新校验）。请重新运行校验。',
  IMPACT_ACK_REQUIRED: '影响分析为 PARTIAL，必须先勾选风险知悉才能发布。',
  BASE_VERSION_ADVANCED: '当前正式版本已前移，该草稿的基线已过期；需基于新版本重建变更草稿。',
  VERSION_EXISTS: '目标版本号已存在。请调整草稿的目标版本后重试。',
  ACTION_DENIED: '当前演示身份没有发布权限（403，服务端最终裁决）。',
};

/** 只取契约错误码做文案映射；完整错误经 apiErrorMessage 呈现。 */
type OntologyApiErrorLike = {code?: string};

function publishErrorText(e: unknown): string {
  const code = (e as OntologyApiErrorLike)?.code;
  if (code && PUBLISH_ERROR_COPY[code]) return PUBLISH_ERROR_COPY[code];
  return apiErrorMessage(e);
}

const fmtTime = (iso: string) => new Date(iso).toLocaleString('zh-CN', {hour12: false});

export default function ReleasePage() {
  const ctx = useModelContext();
  const scope = useActorScope();
  const queryClient = useQueryClient();

  const isDraft = ctx.isDraft;
  const changeSetId = isDraft && 'changeSetId' in ctx.view ? ctx.view.changeSetId : null;
  const revision = isDraft && 'changeSetId' in ctx.view ? ctx.view.revision : undefined;

  const csQuery = useChangeSet(scope, ctx.modelId, changeSetId);
  const versionsQuery = useVersions(scope, ctx.modelId);
  const auditQuery = useAuditEvents(scope, ctx.modelId);
  const diffQuery = useDiff(scope, ctx.modelId, changeSetId, revision);

  const latestRevision = csQuery.data?.revision;
  const isOpen = csQuery.data?.status === 'OPEN';
  const atLatest = latestRevision !== undefined && revision === latestRevision;

  // 发布前必须选择当前有效的两份报告（selected 参数与校验页共用）。
  const selection = decodeReportSelection(ctx.selectedId);
  const vJob = useJobPolling(scope, ctx.modelId, changeSetId ?? undefined, revision, selection.validationJobId).data;
  const iJob = useJobPolling(scope, ctx.modelId, changeSetId ?? undefined, revision, selection.impactJobId).data;
  const vResult = vJob?.status === 'SUCCEEDED' && vJob.result && 'issues' in vJob.result ? vJob.result : null;
  const iResult = iJob?.status === 'SUCCEEDED' && iJob.result && 'items' in iJob.result ? iJob.result : null;

  const canPublishCapability = ctx.capabilities.includes('ontology.publish');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [ackPartial, setAckPartial] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const publish = usePublishVersion(scope, ctx.modelId);

  const enter = useEnterDraft({scope, modelId: ctx.modelId, model: ctx.model, resolvedView: ctx.resolvedView, selectedId: ctx.selectedId, navigateToView: ctx.navigateToView});

  // 前置检查（全部满足才允许点击；服务端仍是最终裁决方）。
  const checks = {
    validationReady: Boolean(vJob && vJob.status === 'SUCCEEDED' && vJob.isCurrent),
    impactReady: Boolean(iJob && iJob.status === 'SUCCEEDED' && iJob.isCurrent),
    noBlocking: Boolean(vResult?.passed),
    partialAck: iResult?.inventoryCompleteness !== 'PARTIAL' || ackPartial,
    notes: releaseNotes.trim().length > 0,
  };
  const allReady = Object.values(checks).every(Boolean);
  const canSubmit = isDraft && ctx.canEdit && canPublishCapability && isOpen && atLatest && allReady;

  const submit = () => {
    if (!changeSetId || revision === undefined || !ctx.resolvedView || !selection.validationJobId || !selection.impactJobId) return;
    setErrorText(null);
    publish.mutate(
      {
        changeSetId,
        etag: ctx.resolvedView.etag,
        body: {
          revision,
          validationRunId: selection.validationJobId,
          impactAnalysisId: selection.impactJobId,
          releaseNotes: releaseNotes.trim(),
          acknowledgePartialCoverage: ackPartial,
        },
      },
      {
        onSuccess: (pub) => {
          // 发布结果存入 React Query（服务端与审计是持久事实来源）。
          void queryClient.setQueryData([...ontologyKeys.model({...scope, modelId: ctx.modelId}), 'last-publication'], pub.data);
          ctx.navigateToView({versionId: pub.data.versionId}, {tab: 'release'});
        },
        onError: (e) => setErrorText(publishErrorText(e)),
      },
    );
  };

  // 刚刚发布的版本视图：展示发布结果（publicationId 等只在 POST 响应与审计中存在）。
  const lastPublication = queryClient.getQueryData<{id: string; versionId: string; publishedAt: string} | undefined>(
    [...ontologyKeys.model({...scope, modelId: ctx.modelId}), 'last-publication'],
  );
  const showResult = !isDraft && lastPublication && 'versionId' in ctx.view && ctx.view.versionId === lastPublication.versionId;

  const versions = [...(versionsQuery.data?.items ?? [])].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  const diffItems = diffQuery.data?.items ?? [];
  const grouped = COLLECTION_ORDER
    .map((c) => ({collection: c, items: diffItems.filter((d) => d.collection === c)}))
    .filter((g) => g.items.length > 0);

  const audits = [...(auditQuery.data?.items ?? [])].reverse().slice(0, 8);

  return (
    <div className="space-y-4">
      {/* 页面边界声明 */}
      <div className="flex items-start gap-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] text-slate-600">
        <Ban className="h-4 w-4 shrink-0 mt-0.5 text-slate-400"/>
        <p>
          发布把草稿修订固化为新的<b>正式版本</b>（基于已通过的报告）；<b>未自动启动流程</b>、<b>消费方固定版本未自动升级</b>。
          界面按钮只是引导，<b>服务端是最终裁决方</b>；发布后草稿关闭、正式版本只读。本演示不提供审批流。
        </p>
      </div>

      {!isDraft && <DraftGateNotice reason={ctx.readOnlyReason} canEdit={ctx.canEdit} enter={enter}/>}
      {isDraft && ctx.resolvedView && !ctx.capabilities.includes('ontology.edit') && (
        // 同 ValidationImpactPage：viewer 草稿视图服务端即 readOnly=true，
        // 权限缺失才是真实原因（editPolicy 同序：先 capability 再视图状态）。
        <DraftGateNotice reason="viewer-permission" canEdit={ctx.canEdit} enter={enter}/>
      )}

      {/* 发布结果（刚刚发布的版本视图） */}
      {showResult && lastPublication && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-4 space-y-2" data-testid="publish-result">
          <div className="flex items-center gap-2 text-emerald-800">
            <CheckCircle2 className="h-5 w-5"/>
            <p className="font-bold text-[13.5px]">发布成功：{lastPublication.versionId} 已成为当前正式版本</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap text-[12px] text-emerald-900/80">
            <span>发布记录 <span className="font-mono" title="发布记录标识（完整值见诊断信息）">{shortId(lastPublication.id)}</span></span>
            <span>·</span>
            <span>版本 <span className="font-mono font-bold">{lastPublication.versionId}</span></span>
            <span>·</span>
            <span>发布于 {fmtTime(lastPublication.publishedAt)}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-white/70 text-slate-600 border border-emerald-200">
              <Clock className="h-3 w-3"/>未自动启动流程
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-white/70 text-slate-600 border border-emerald-200">
              <Lock className="h-3 w-3"/>消费方固定版本未自动升级
            </span>
          </div>
          <p className="text-[11px] text-emerald-900/60">发布事件已写入下方审计记录；下游系统按自身节奏消费，本演示未连接任何真实下游。</p>
        </div>
      )}

      <div className="flex gap-4 items-start flex-wrap xl:flex-nowrap">
        {/* 左侧：版本面板 */}
        <aside className="w-full xl:w-64 shrink-0 space-y-3" data-testid="versions-panel">
          {isDraft && (
            <div className="bg-white border border-blue-200 rounded-2xl p-4">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">目标版本</p>
              <p className="mt-1 text-lg font-bold text-blue-700 font-mono">{csQuery.data?.targetVersionId ?? '…'}</p>
              <p className="mt-1 text-[12px] text-slate-500">
                编辑草稿 · r<span className="font-mono font-semibold">{revision}</span>
                {csQuery.data?.baseVersionId && <> · 基线 <span className="font-mono">{csQuery.data.baseVersionId}</span></>}
              </p>
              <p className="mt-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                <FileClock className="h-3 w-3"/>{isOpen ? '开放中' : csQuery.data?.status === 'PUBLISHED' ? '已发布' : '已放弃'}
              </p>
            </div>
          )}
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1"><Package className="h-3.5 w-3.5"/>版本记录</p>
            <p className="mt-1 text-[11.5px] text-slate-500">
              当前正式版本：<span className="font-mono font-bold text-slate-700">{ctx.model?.currentVersionId ?? '尚未发布'}</span>
            </p>
            <div className="mt-2 space-y-1.5">
              {versionsQuery.isLoading && <p className="text-[12px] text-slate-400 flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin"/>读取版本…</p>}
              {versions.map((v) => (
                <button
                  key={v.id}
                  onClick={() => ctx.navigateToView({versionId: v.id}, {tab: 'release'})}
                  className={`w-full text-left px-2.5 py-2 rounded-xl border transition-colors ${
                    !isDraft && 'versionId' in ctx.view && ctx.view.versionId === v.id
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[12.5px] font-bold text-slate-800">{v.id}</span>
                    {ctx.model?.currentVersionId === v.id
                      && <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">当前</span>}
                  </span>
                  <span className="block text-[10.5px] text-slate-400 mt-0.5">{fmtTime(v.publishedAt)}</span>
                  <span className="block text-[10.5px] text-slate-500 truncate mt-0.5">{v.releaseNotes}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* 中间：Diff + 发布 / 审计 */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* 真实 Diff */}
          <section className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3" data-testid="diff-panel">
            <header className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <GitCompare className="h-4 w-4 text-slate-400"/>
                {isDraft ? '草稿变更内容（相对基线）' : '版本对照'}
              </h2>
              {isDraft && diffQuery.data && (
                <span className="text-[11px] text-slate-400 font-mono">r{diffQuery.data.revision} · {diffItems.length} 项变更</span>
              )}
            </header>
            {!isDraft && (
              <p className="text-[12px] text-slate-500">
                正在查看正式版本（只读）。变更对照在草稿视图中呈现；可在左侧切换版本或进入草稿查看待发布内容。
              </p>
            )}
            {isDraft && diffQuery.isLoading && <p className="text-[12px] text-slate-400 flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin"/>读取变更…</p>}
            {isDraft && !diffQuery.isLoading && grouped.length === 0 && (
              <p className="text-[12px] text-slate-400">当前修订与基线没有差异。</p>
            )}
            {grouped.map((g) => (
              <div key={g.collection} className="border border-slate-200 rounded-xl overflow-hidden">
                <p className="px-3 py-2 bg-slate-50 text-[11.5px] font-bold text-slate-600 border-b border-slate-200">
                  {COLLECTION_LABELS[g.collection]}<span className="text-slate-400 font-normal">（{g.items.length}）</span>
                </p>
                <div className="divide-y divide-slate-100">
                  {g.items.map((d) => (
                    <DiffRow key={d.id} item={d}/>
                  ))}
                </div>
              </div>
            ))}
          </section>

          {/* 发布表单（仅草稿） */}
          {isDraft && (
            <section className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3" data-testid="publish-form">
              <header className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Rocket className="h-4 w-4 text-slate-400"/>发布 {csQuery.data?.targetVersionId ?? ''}
                </h2>
                {!canPublishCapability && (
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">当前身份无发布权限</span>
                )}
              </header>

              {/* 报告选择（沿用校验页选中的报告） */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <ReportRow label="校验报告" jobId={selection.validationJobId} state={vJob ? {status: vJob.status, isCurrent: vJob.isCurrent, passed: vResult?.passed ?? null} : null}/>
                <ReportRow label="影响分析报告" jobId={selection.impactJobId} state={iJob ? {status: iJob.status, isCurrent: iJob.isCurrent, passed: iResult ? (iResult.inventoryCompleteness === 'PARTIAL' ? 'PARTIAL' : 'COMPLETE') : null} : null}/>
              </div>
              {(!selection.validationJobId || !selection.impactJobId) && (
                <p className="text-[11.5px] text-slate-500 flex items-center gap-1.5">
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400"/>
                  发布前必须选择当前有效的校验与影响报告：
                  <button onClick={() => ctx.navigateToTab('validation')} className="font-bold text-blue-600 hover:underline">前往「校验与影响」运行</button>
                </p>
              )}

              {/* 前置检查 */}
              <ul className="space-y-1.5 text-[12px]">
                <CheckRow ok={checks.validationReady} text="已选择对当前修订有效的校验报告"/>
                <CheckRow ok={checks.impactReady} text="已选择对当前修订有效的影响分析报告"/>
                <CheckRow ok={checks.noBlocking} text={vResult ? (vResult.passed ? '校验无阻断项' : `校验存在阻断项（${vResult.issues.filter((i) => i.severity === 'ERROR').length} 个），禁止发布`) : '校验报告未就绪'}/>
                <CheckRow ok={checks.notes} text="填写发布说明（必填）"/>
                {iResult?.inventoryCompleteness === 'PARTIAL' && (
                  <li>
                    <label className={`flex items-start gap-2 px-3 py-2 rounded-xl border cursor-pointer ${ackPartial ? 'bg-amber-50/70 border-amber-300' : 'bg-white border-amber-200'}`}>
                      <input
                        type="checkbox"
                        checked={ackPartial}
                        onChange={(e) => setAckPartial(e.target.checked)}
                        data-testid="ack-partial"
                        className="mt-0.5 accent-amber-600"
                      />
                      <span className="text-[12px] text-amber-900">
                        <b>风险知悉（必选）</b>：影响分析为 PARTIAL——依赖登记不完整，<b>未登记依赖的影响未知</b>，不视为“无影响”。我确认知悉此风险并决定继续发布。
                      </span>
                    </label>
                  </li>
                )}
              </ul>

              <label className="block space-y-1">
                <span className="text-[11px] font-bold text-slate-600">发布说明（releaseNotes，必填）</span>
                <textarea
                  value={releaseNotes}
                  onChange={(e) => setReleaseNotes(e.target.value)}
                  rows={3}
                  data-testid="release-notes"
                  placeholder="例如：锁定 runtime 依赖版本，明确断言生命周期边界。"
                  className="w-full px-3 py-2 text-[12px] border border-slate-200 rounded-xl outline-none focus:border-blue-500 resize-y"
                />
              </label>

              {errorText && (
                <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl text-[12px] text-red-700" data-testid="publish-error">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5"/>
                  <p className="flex-1">发布未成功：{errorText}（草稿与表单内容均已保留）</p>
                  <button onClick={() => setErrorText(null)} className="shrink-0 opacity-60 hover:opacity-100"><X className="h-4 w-4"/></button>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-[11px] text-slate-400">
                  提交将携带 If-Match（r{revision}）与幂等键；服务端对报告有效性、阻断项与基线做最终裁决。
                </p>
                <button
                  onClick={submit}
                  disabled={!canSubmit || publish.isPending}
                  data-testid="publish-button"
                  title={canSubmit ? '创建新正式版本' : '需满足全部前置检查（草稿、权限、报告、说明、知悉）'}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-[12.5px] font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  {publish.isPending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Rocket className="h-4 w-4"/>}
                  发布 {csQuery.data?.targetVersionId ?? '新版本'}
                </button>
              </div>
            </section>
          )}

          {/* 审计记录 */}
          <section className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2" data-testid="audit-events">
            <header className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <History className="h-4 w-4 text-slate-400"/>审计记录
              </h2>
              <span className="text-[11px] text-slate-400">最近 {audits.length} 条</span>
            </header>
            {auditQuery.isLoading && <p className="text-[12px] text-slate-400 flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin"/>读取审计…</p>}
            <div className="divide-y divide-slate-100">
              {audits.map((a) => (
                <div key={a.id} className="py-2 flex items-start gap-2.5">
                  <span className="shrink-0 mt-0.5 px-1.5 py-0.5 rounded text-[12px] font-bold font-mono bg-slate-100 text-slate-500 border border-slate-200">{a.eventType}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] text-slate-700">{a.summary}</p>
                    <p className="text-[12px] text-slate-400 mt-0.5">
                      {a.actorId} · {fmtTime(a.occurredAt)} · <span className="font-mono" title="目标标识（完整值见诊断信息）">{shortId(a.targetId)}</span>
                    </p>
                  </div>
                </div>
              ))}
              {audits.length === 0 && !auditQuery.isLoading && <p className="text-[12px] text-slate-400 py-2">暂无审计事件。</p>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function DiffRow({item}: {item: DiffItem}) {
  const name = itemName(item);
  const versionChange = item.collection === 'dependencies'
    ? `${(item.before as {versionId?: string} | null)?.versionId ?? '未锁定'} → ${(item.after as {versionId?: string} | null)?.versionId ?? '未锁定'}`
    : null;
  return (
    <div className="px-3 py-2 flex items-center gap-2.5">
      <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold ${
        item.change === 'ADD' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          : item.change === 'REMOVE' ? 'bg-red-50 text-red-700 border border-red-200'
          : 'bg-amber-50 text-amber-700 border border-amber-200'
      }`}>{CHANGE_LABELS[item.change]}</span>
      <span className="font-mono text-[11.5px] text-slate-500 truncate">{item.id}</span>
      {name && <span className="text-[12px] font-semibold text-slate-700 truncate">{name}</span>}
      {versionChange && <span className="ml-auto text-[11px] font-mono text-slate-500 shrink-0">{versionChange}</span>}
    </div>
  );
}

function itemName(item: DiffItem): string | null {
  const v = (item.after ?? item.before) as {nameCn?: string; workflowId?: string; implementationId?: string; packageId?: string} | null;
  if (!v) return null;
  return v.nameCn ?? v.workflowId ?? v.implementationId ?? v.packageId ?? null;
}

function CheckRow({ok, text}: {ok: boolean; text: string}) {
  return (
    <li className={`flex items-start gap-2 text-[12px] ${ok ? 'text-slate-600' : 'text-slate-400'}`}>
      {ok
        ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500"/>
        : <span className="h-4 w-4 shrink-0 rounded-full border-2 border-slate-300 inline-block"/>}
      <span>{text}</span>
    </li>
  );
}

function ReportRow({label, jobId, state}: {
  label: string;
  jobId: string | undefined;
  state: {status: 'RUNNING' | 'SUCCEEDED' | 'FAILED'; isCurrent: boolean; passed: boolean | string | null} | null;
}) {
  return (
    <div className={`px-3 py-2.5 rounded-xl border ${state && state.status === 'SUCCEEDED' && state.isCurrent ? 'bg-emerald-50/50 border-emerald-200' : 'bg-white border-slate-200'}`}>
      <p className="text-[11px] font-bold text-slate-500">{label}</p>
      {!jobId && <p className="text-[11.5px] text-slate-400 mt-1">未选择（前往「校验与影响」运行并选择）</p>}
      {jobId && (
        <div className="mt-1 flex items-center gap-1.5 flex-wrap">
          {state ? (
            state.status === 'RUNNING' ? <span className="text-[11.5px] font-bold text-blue-700 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin"/>计算中</span>
            : state.status === 'FAILED' ? <span className="text-[11.5px] font-bold text-red-600 flex items-center gap-1"><AlertTriangle className="h-3 w-3"/>失败</span>
            : state.isCurrent
              ? <span className="text-[11.5px] font-bold text-emerald-700 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3"/>{state.passed === false ? '有效（有阻断项）' : '当前有效'}
                </span>
              : <span className="text-[11.5px] font-bold text-orange-600 flex items-center gap-1"><ShieldAlert className="h-3 w-3"/>已失效（需重新运行）</span>
          ) : (
            <span className="text-[11.5px] text-slate-400">读取中…</span>
          )}
          <span className="text-[12px] font-mono text-slate-400 truncate" title="任务标识（完整值见诊断信息）">{shortId(jobId)}</span>
        </div>
      )}
    </div>
  );
}
