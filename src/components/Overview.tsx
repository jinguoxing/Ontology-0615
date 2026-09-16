/**
 * 模型总览（Batch 2 重写；Batch 4.5 第四节收口；Batch 4.6 草稿基线修正）。
 *
 * 同一个 ViewReference（versionId 或 changeSetId+revision）驱动读取：
 * - GET /models/:id（模型头，由布局渲染）
 * - GET /models/:id/view（统计口径：类型 / 关系 / 约束 / 行动契约 /
 *   实现绑定 / 流程引用 —— 全部来自 document 计数，紧凑摘要条呈现）
 * 另读 GET /models/:id/versions（发布记录）与 /audit-events（最近事件）。
 *
 * Batch 4.5：删除六张大 KPI 统计卡（改为 ModelSummaryStrip）与默认全量
 * 节点交叉图（31 节点 / 39 关系，改为 SemanticRegionMap 区域聚合视图）；
 * 完整节点级关系图保留在「关系与约束」页的结构视图中。不展示实例数量、
 * 健康分等合同之外或伪造的指标。
 *
 * Batch 4.6：草稿基线来源修正——草稿视图的 ResolvedView.versionId 恒为
 * null，真实基线是 ChangeSet.baseVersionId（GET /changesets/:id），
 * 「初始草稿」只在无基线版本时出现；最近事件走 auditPresentation
 * 产品语言（原始 eventType / actorId 不出现在产品层）。
 */
import {
  FileClock,
  History,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import {
  apiErrorMessage,
  useActorScope,
  useAuditEvents,
  useChangeSet,
  useVersions,
} from '../ontology/queries';
import {useModelContext} from '../ontology/ModelContext';
import {auditActorLabel, auditEventLabel, auditTargetLabel} from '../ontology/auditPresentation';
import ModelSummaryStrip from './ModelSummaryStrip';
import SemanticRegionMap from './SemanticRegionMap';

export default function Overview() {
  const ctx = useModelContext();
  const {modelId, route, resolvedView, model, isDraft, navigateToTab, navigateToView} = ctx;
  const actorScope = useActorScope();
  const versionsQuery = useVersions(actorScope, modelId);
  const auditQuery = useAuditEvents(actorScope, modelId);
  // 草稿基线的真实来源：ChangeSet.baseVersionId（草稿视图的 versionId 恒为 null）。
  const draftId = isDraft && 'changeSetId' in route.view ? route.view.changeSetId : null;
  const changeSetQuery = useChangeSet(actorScope, modelId, draftId);

  const doc = resolvedView?.document;
  const baseline = isDraft
    ? changeSetQuery.data?.baseVersionId ?? (changeSetQuery.isLoading ? '…' : '初始草稿')
    : null;

  return (
    <div className="space-y-5">
      {/* 草稿提示 */}
      {isDraft && (
        <div className="flex items-start gap-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-[13px] text-blue-800" data-testid="draft-banner">
          <FileClock className="h-4 w-4 shrink-0 mt-0.5"/>
          <div className="space-y-1">
            <p className="font-bold">编辑草稿 · r{resolvedView?.revision}</p>
            <p>基于 {baseline} 的未发布内容；摘要与区域图均来自该草稿视图。</p>
            {model?.currentVersionId ? (
              <p className="flex items-center gap-3 flex-wrap">
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500"/>
                  正式版本 <span className="font-mono font-semibold">{model.currentVersionId}</span> 未受草稿影响
                </span>
                <button
                  onClick={() => navigateToView({versionId: model.currentVersionId!})}
                  className="font-bold underline hover:text-blue-900"
                >
                  切换到正式版本 {model.currentVersionId}
                </button>
              </p>
            ) : (
              <p>尚无正式发布版本；发布首个版本后正式记录出现在下方。</p>
            )}
          </div>
        </div>
      )}

      {/* 紧凑摘要条（取代六张 KPI 卡） */}
      <section className="space-y-2.5">
        <SectionTitle title="模型摘要" hint="按当前视图统计"/>
        <ModelSummaryStrip doc={doc} onGoTab={navigateToTab}/>
      </section>

      {/* 语义区域图（取代默认全量节点交叉图；节点级完整图在关系页） */}
      <section className="space-y-2.5">
        <SectionTitle
          title="语义区域"
          hint="按类型分组聚合 · 点击区域进入对象类型（应用分组过滤）"
        />
        <SemanticRegionMap
          doc={doc}
          onEnterRegion={(group) => navigateToView(route.view, {tab: 'object-types', group})}
          onEnterRelations={() => navigateToTab('relations')}
        />
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* 发布记录 */}
        <section className="space-y-2.5">
          <SectionTitle title="发布记录"/>
          <div className="semovix-card overflow-hidden">
            {versionsQuery.isLoading && (
              <p className="flex items-center justify-center gap-2 py-8 text-[13px] text-slate-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin"/>读取版本记录…
              </p>
            )}
            {versionsQuery.isError && (
              <p className="px-4 py-3 text-[13px] text-red-600">{apiErrorMessage(versionsQuery.error)}</p>
            )}
            {versionsQuery.isSuccess && ((versionsQuery.data?.items ?? []).length === 0 ? (
              <p className="px-4 py-8 text-center text-[13px] text-slate-400">
                尚无正式发布版本。完成校验与影响分析后，可在“版本与发布”发布首个版本。
              </p>
            ) : (
              <table className="semovix-table">
                <thead>
                  <tr>
                    <th>版本</th>
                    <th>发布时间</th>
                    <th>说明</th>
                    <th/>
                  </tr>
                </thead>
                <tbody>
                  {(versionsQuery.data?.items ?? []).map((v) => (
                    <tr key={v.id}>
                      <td className="font-mono font-bold text-emerald-700">{v.id}</td>
                      <td className="text-slate-500">{formatTime(v.publishedAt)}</td>
                      <td className="text-slate-600 max-w-[220px] truncate" title={v.releaseNotes}>{v.releaseNotes}</td>
                      <td className="text-right">
                        <button
                          onClick={() => navigateToView({versionId: v.id})}
                          className="semovix-btn-text"
                        >
                          查看
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ))}
          </div>
        </section>

        {/* 最近事件 */}
        <section className="space-y-2.5">
          <SectionTitle title="最近事件"/>
          <div className="semovix-card p-4">
            {auditQuery.isLoading && (
              <p className="flex items-center justify-center gap-2 py-8 text-[13px] text-slate-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin"/>读取审计事件…
              </p>
            )}
            {auditQuery.isError && (
              <p className="text-[13px] text-red-600">{apiErrorMessage(auditQuery.error)}</p>
            )}
            {auditQuery.isSuccess && ((auditQuery.data?.items ?? []).length === 0 ? (
              <p className="py-8 text-center text-[13px] text-slate-400">
                暂无审计事件。演示服务中，草稿写入 / 发布等操作发生后才会产生事件记录。
              </p>
            ) : (
              <ul className="space-y-2.5">
                {[...(auditQuery.data?.items ?? [])]
                  // 服务端列表按 id 排序不保证时间序；最近事件按发生时间倒序呈现。
                  .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
                  .slice(0, 8)
                  .map((e) => (
                  <li key={e.id} className="flex items-start gap-2.5 text-[13px]">
                    <History className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0"/>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800">{auditActorLabel(e.actorId)}</p>
                      <p className="text-slate-700">
                        {auditEventLabel(e.eventType)}{' '}
                        <span className="font-mono font-semibold">{auditTargetLabel(e.targetId)}</span>
                      </p>
                      <p className="text-slate-500 text-[12px] truncate" title={e.summary}>{e.summary}</p>
                      <p className="text-slate-400 text-[12px]">{formatTime(e.occurredAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function SectionTitle({title, hint}: {title: string; hint?: string}) {
  return (
    <div className="flex items-baseline gap-3 flex-wrap">
      <h2 className="semovix-section-title">{title}</h2>
      {hint && <span className="text-[12px] text-slate-400">{hint}</span>}
    </div>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString('zh-CN', {hour12: false});
}
