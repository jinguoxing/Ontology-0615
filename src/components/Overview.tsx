/**
 * 模型总览（Batch 2 重写）。
 *
 * 同一个 ViewReference（versionId 或 changeSetId+revision）驱动三路读取：
 * - GET /models/:id（模型头，由布局渲染）
 * - GET /models/:id/view（统计口径：31 类型 = 21 本地 + 10 外部引用、39 关系、
 *   2 约束、25 行动契约、28 实现绑定、6 流程引用 —— 全部来自 document 计数）
 * - GET /models/:id/graph（节点/边与视图 contentHash 一致）
 * 另读 GET /models/:id/versions（发布记录）与 /audit-events（最近事件）。
 * 不展示实例数量、健康分等合同之外或伪造的指标。
 */
import {useMemo} from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  FileClock,
  GitBranch,
  History,
  Loader2,
  RefreshCw,
  ScrollText,
  ShieldCheck,
  Workflow,
  Zap,
} from 'lucide-react';
import type {Graph as GraphData} from '../api/ontology-v1/types.generated';
import {
  apiErrorMessage,
  useActorScope,
  useAuditEvents,
  useGraph,
  useVersions,
} from '../ontology/queries';
import {useModelContext} from '../ontology/ModelContext';
import type {OntologyTab} from '../api/ontology-v1/routeContext';

export default function Overview() {
  const ctx = useModelContext();
  const {modelId, route, resolvedView, model, isDraft, navigateToTab, navigateToView} = ctx;
  const actorScope = useActorScope();
  const graphQuery = useGraph(actorScope, modelId, route.view);
  const versionsQuery = useVersions(actorScope, modelId);
  const auditQuery = useAuditEvents(actorScope, modelId);

  const doc = resolvedView?.document;
  const stats = useMemo(() => {
    if (!doc) return [];
    const local = doc.objectTypes.filter((t) => t.origin !== 'EXTERNAL').length;
    const external = doc.objectTypes.length - local;
    return [
      {label: '对象类型', value: doc.objectTypes.length, sub: `${local} 本地 + ${external} 外部引用`, tab: 'object-types' as OntologyTab, icon: Boxes},
      {label: '关系', value: doc.relations.length, sub: 'RelationDefinition', tab: 'relations' as OntologyTab, icon: GitBranch},
      {label: '约束', value: doc.constraints.length, sub: 'ConstraintDefinition', tab: 'relations' as OntologyTab, icon: ShieldCheck},
      {label: '行动契约', value: doc.actions.length, sub: 'ActionContract', tab: 'actions' as OntologyTab, icon: Zap},
      {label: '实现绑定', value: doc.implementationBindings.length, sub: 'ImplementationBinding', tab: 'implementations' as OntologyTab, icon: ScrollText},
      {label: '流程引用', value: doc.workflowRefs.length, sub: 'WorkflowReference', tab: 'workflows' as OntologyTab, icon: Workflow},
    ];
  }, [doc]);

  return (
    <div className="space-y-5">
      {/* 草稿提示 */}
      {isDraft && (
        <div className="flex items-start gap-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-[12.5px] text-blue-800">
          <FileClock className="h-4 w-4 shrink-0 mt-0.5"/>
          <p>
            当前展示<strong>草稿</strong> <span className="font-mono">{resolvedView?.changeSetId}</span> r{resolvedView?.revision}
            （基于 {resolvedView?.versionId ?? '初始草稿'}）的未发布内容；统计与图谱均来自该草稿视图的 contentHash。
            {model?.currentVersionId && (
              <button
                onClick={() => navigateToView({versionId: model.currentVersionId!})}
                className="ml-1 font-bold underline hover:text-blue-900"
              >
                切换到正式版本 {model.currentVersionId}
              </button>
            )}
          </p>
        </div>
      )}

      {/* 统计 */}
      <section className="space-y-2.5">
        <SectionTitle title="模型统计" hint={`来自当前视图 document 计数 · contentHash ${(resolvedView?.contentHash ?? '').slice(0, 10)}…`}/>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {stats.map((s) => (
            <button
              key={s.label}
              onClick={() => navigateToTab(s.tab)}
              className="bg-white border border-slate-200 rounded-2xl p-4 text-left hover:border-blue-300 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11.5px] font-semibold text-slate-500 flex items-center gap-1.5">
                  <s.icon className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-500"/>{s.label}
                </span>
                <ArrowUpRight className="h-3 w-3 text-slate-300 group-hover:text-blue-400"/>
              </div>
              <p className="text-2xl font-extrabold text-slate-800 mt-1.5 font-mono">{s.value}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{s.sub}</p>
            </button>
          ))}
        </div>
      </section>

      {/* 图谱 */}
      <section className="space-y-2.5">
        <SectionTitle
          title="模型图谱"
          hint="GET /models/:id/graph · 与视图同 contentHash · 点击节点进入对象类型"
        />
        <GraphPanel
          graph={graphQuery.data}
          loading={graphQuery.isLoading}
          error={graphQuery.isError ? apiErrorMessage(graphQuery.error) : null}
          onRetry={() => void graphQuery.refetch()}
          onSelect={(id) => navigateToView(route.view, {tab: 'object-types', selectedId: id})}
        />
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* 发布记录 */}
        <section className="space-y-2.5">
          <SectionTitle title="发布记录" hint="GET /models/:id/versions"/>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            {versionsQuery.isLoading && (
              <p className="flex items-center justify-center gap-2 py-8 text-xs text-slate-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin"/>读取版本记录…
              </p>
            )}
            {versionsQuery.isError && (
              <p className="px-4 py-3 text-xs text-red-600">{apiErrorMessage(versionsQuery.error)}</p>
            )}
            {versionsQuery.isSuccess && ((versionsQuery.data?.items ?? []).length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-slate-400">
                尚无正式发布版本（新本体发布后出现在这里，发布流程在 Batch 4 接入）。
              </p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-[10.5px] uppercase tracking-wide">
                    <th className="text-left px-4 py-2 font-bold">版本</th>
                    <th className="text-left px-4 py-2 font-bold">发布时间</th>
                    <th className="text-left px-4 py-2 font-bold">contentHash</th>
                    <th className="text-left px-4 py-2 font-bold">说明</th>
                    <th className="px-4 py-2"/>
                  </tr>
                </thead>
                <tbody>
                  {(versionsQuery.data?.items ?? []).map((v) => (
                    <tr key={v.id} className="border-t border-slate-100">
                      <td className="px-4 py-2.5 font-mono font-bold text-emerald-700">{v.id}</td>
                      <td className="px-4 py-2.5 text-slate-500">{formatTime(v.publishedAt)}</td>
                      <td className="px-4 py-2.5 font-mono text-slate-400" title={v.contentHash}>{v.contentHash.slice(0, 8)}…</td>
                      <td className="px-4 py-2.5 text-slate-600 max-w-[220px] truncate" title={v.releaseNotes}>{v.releaseNotes}</td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          onClick={() => navigateToView({versionId: v.id})}
                          className="text-[11px] font-bold text-blue-600 hover:underline"
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
          <SectionTitle title="最近事件" hint="GET /models/:id/audit-events"/>
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            {auditQuery.isLoading && (
              <p className="flex items-center justify-center gap-2 py-8 text-xs text-slate-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin"/>读取审计事件…
              </p>
            )}
            {auditQuery.isError && (
              <p className="text-xs text-red-600">{apiErrorMessage(auditQuery.error)}</p>
            )}
            {auditQuery.isSuccess && ((auditQuery.data?.items ?? []).length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">
                暂无审计事件。Mock 服务中，草稿写入 / 发布等操作发生后才会产生事件记录。
              </p>
            ) : (
              <ul className="space-y-2.5">
                {(auditQuery.data?.items ?? []).slice(0, 8).map((e) => (
                  <li key={e.id} className="flex items-start gap-2.5 text-xs">
                    <History className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0"/>
                    <div className="min-w-0">
                      <p className="text-slate-700">
                        <span className="font-mono font-bold text-slate-800">{e.eventType}</span>
                        <span className="text-slate-400"> · {e.actorId}</span>
                      </p>
                      <p className="text-slate-500 text-[11px] truncate" title={e.summary}>{e.summary} · {e.targetId}</p>
                      <p className="text-slate-400 text-[10px] font-mono">{formatTime(e.occurredAt)}</p>
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
      <h2 className="text-sm font-bold text-slate-700">{title}</h2>
      {hint && <span className="text-[11px] text-slate-400 font-mono">{hint}</span>}
    </div>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString('zh-CN', {hour12: false});
}

// ---- 图谱面板（真实节点/边，确定性网格布局） ----

const NODE_W = 172;
const NODE_H = 46;
const GAP_X = 20;
const GAP_Y = 14;

const ORIGIN_STYLE: Record<string, {stripe: string; label: string; card: string}> = {
  LOCAL: {stripe: 'bg-blue-500', label: '本地', card: 'border-slate-200'},
  SYSTEM: {stripe: 'bg-slate-500', label: '系统', card: 'border-slate-200'},
  EXTERNAL: {stripe: 'bg-amber-400', label: '外部', card: 'border-dashed border-amber-300'},
};

function GraphPanel({graph, loading, error, onRetry, onSelect}: {
  graph: GraphData | undefined;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onSelect: (id: string) => void;
}) {
  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl flex items-center justify-center gap-2 py-16 text-xs text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin"/>读取图谱（GET /graph）…
      </div>
    );
  }
  if (error) {
    return (
      <div className="bg-white border border-red-200 rounded-2xl px-4 py-5 flex items-center gap-3">
        <AlertTriangle className="h-4 w-4 text-red-500"/>
        <p className="text-xs text-red-600 flex-1">{error}</p>
        <button onClick={onRetry} className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-slate-100 rounded-lg hover:bg-slate-200">
          <RefreshCw className="h-3 w-3"/>重试
        </button>
      </div>
    );
  }
  if (!graph || graph.nodes.length === 0) {
    return (
      <div className="bg-white border border-dashed border-slate-300 rounded-2xl py-14 text-center">
        <p className="text-xs text-slate-400">当前视图暂无对象类型节点（新建本体可先到「对象类型」页添加类型）。</p>
      </div>
    );
  }

  // 确定性布局：本地/系统节点在前、外部引用在后，按 id 排序后网格排布。
  const nodes = [...graph.nodes].sort((a, b) =>
    (a.origin === 'EXTERNAL' ? 1 : 0) - (b.origin === 'EXTERNAL' ? 1 : 0) || a.id.localeCompare(b.id),
  );
  const cols = Math.min(6, Math.ceil(Math.sqrt(nodes.length)) || 1);
  const rows = Math.ceil(nodes.length / cols);
  const pos = new Map<string, {x: number; y: number; col: number; row: number}>();
  nodes.forEach((n, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    pos.set(n.id, {x: col * (NODE_W + GAP_X), y: row * (NODE_H + GAP_Y), col, row});
  });
  const width = cols * (NODE_W + GAP_X);
  const height = rows * (NODE_H + GAP_Y);
  const localCount = nodes.filter((n) => n.origin !== 'EXTERNAL').length;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <p className="text-[11.5px] text-slate-500">
          {nodes.length} 个节点 · {graph.edges.length} 条关系
          <span className="text-slate-400">（{localCount} 本地/系统 + {nodes.length - localCount} 外部引用）</span>
        </p>
        <div className="flex items-center gap-3 text-[10.5px] text-slate-500">
          {Object.entries(ORIGIN_STYLE).map(([origin, style]) => (
            <span key={origin} className="inline-flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-sm ${style.stripe}`}/>{style.label}
            </span>
          ))}
        </div>
      </div>
      <div className="overflow-auto border border-slate-100 rounded-xl" style={{maxHeight: 480}}>
        <div className="relative" style={{width, height}}>
          <svg width={width} height={height} className="absolute inset-0 pointer-events-none">
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="rgb(148 163 184)"/>
              </marker>
            </defs>
            {graph.edges.flatMap((edge) => {
              const s = pos.get(edge.sourceTypeId);
              const t = pos.get(edge.targetTypeId);
              if (!s || !t) return [];
              const x1 = s.x + NODE_W;
              const y1 = s.y + NODE_H / 2;
              const x2 = t.x;
              const y2 = t.y + NODE_H / 2;
              const mx = (x1 + x2) / 2;
              return [(
                <path
                  key={edge.id}
                  d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                  fill="none"
                  stroke="rgb(148 163 184)"
                  strokeWidth={1.2}
                  strokeOpacity={0.55}
                  markerEnd="url(#arrow)"
                >
                  <title>{`${edge.sourceTypeId} —${edge.nameCn}→ ${edge.targetTypeId}`}</title>
                </path>
              )];
            })}
          </svg>
          {nodes.map((n) => {
            const p = pos.get(n.id)!;
            const style = ORIGIN_STYLE[n.origin] ?? ORIGIN_STYLE.LOCAL;
            return (
              <button
                key={n.id}
                onClick={() => onSelect(n.id)}
                title={`${n.id}（${style.label}）`}
                className={`absolute flex items-stretch bg-white border ${style.card} rounded-lg shadow-xs hover:shadow-md hover:border-blue-300 transition-all text-left overflow-hidden`}
                style={{left: p.x, top: p.y, width: NODE_W, height: NODE_H}}
              >
                <span className={`w-1.5 shrink-0 ${style.stripe}`}/>
                <span className="px-2.5 flex flex-col justify-center min-w-0">
                  <span className="text-[12px] font-bold text-slate-700 truncate">{n.nameCn}</span>
                  <span className="text-[9.5px] font-mono text-slate-400 truncate">{n.id}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
