/**
 * 本体模型空间布局（Batch 2）。
 *
 * - 面包屑 + 模型头（profile/origin/责任方）+ 视图状态条（正式版本 vs 草稿、
 *   contentHash、只读原因、视图切换），全部来自 URL + HTTP 数据，无硬编码。
 * - 八个 Tab 来自 routeContext 的规范定义；overview / object-types /
 *   relations / actions / implementations / workflows 已完成 HTTP 化
 *   （Batch 2 + Batch 3），validation / release 给出真实统计占位并标注
 *   Batch 4 接入，不伪造编辑界面。
 * - 常驻“演示数据 · Mock API”徽标与演示身份切换（demo-maintainer / demo-viewer）。
 */
import {useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {useQueryClient} from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Database,
  Eye,
  FileClock,
  GitBranch,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import {ONTOLOGY_LIST_PATH, tabs, type OntologyTab} from '../api/ontology-v1/routeContext';
import {ontologyKeys} from '../api/ontology-v1/queryKeys';
import {ontologyV1} from '../api/ontology-v1/client';
import Overview from '../components/Overview';
import ObjectModel from '../components/ObjectModel';
import RelationsPage from '../components/RelationsPage';
import ActionsPage from '../components/ActionsPage';
import ImplementationsPage from '../components/ImplementationsPage';
import WorkflowsPage from '../components/WorkflowsPage';
import {DEMO_ACTORS, useDemoIdentity} from './identity';
import {useActorScope, useInvalidateOnActorChange} from './queries';
import {ModelContextProvider, useModelContext, type ModelContextValue} from './ModelContext';

const TAB_LABELS: Record<OntologyTab, string> = {
  'overview': '模型总览',
  'object-types': '对象类型',
  'relations': '关系与约束',
  'actions': '行动契约',
  'implementations': '实现绑定',
  'workflows': '流程关联',
  'validation': '校验',
  'release': '发布',
};

const PROFILE_LABELS: Record<string, string> = {
  DATA_GOVERNANCE: '数据治理系统模型',
  BUSINESS: '业务本体',
};

const ORIGIN_LABELS: Record<string, string> = {
  SYSTEM: '系统内置',
  TENANT: '租户创建',
};

export default function OntologyLayout() {
  useInvalidateOnActorChange();
  return <ModelContextProvider>{(ctx) => <LayoutShell ctx={ctx}/>}</ModelContextProvider>;
}

function LayoutShell({ctx}: {ctx: ModelContextValue}) {
  const {model, resolvedView, viewLoading, error, retry, tab, navigateToTab, modelId} = ctx;

  if (viewLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500"/>
          <p className="text-sm font-medium">
            正在解析模型视图（{modelId}）…
          </p>
          <p className="text-xs text-slate-400">读取 GET /models/:id 与 GET /models/:id/view</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5"/>
            <span className="font-bold">模型视图加载失败</span>
          </div>
          <p className="text-sm text-slate-600 break-all">{error}</p>
          <div className="flex gap-2">
            <button
              onClick={retry}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <RefreshCw className="h-3.5 w-3.5"/>重试
            </button>
            <Link
              to={ONTOLOGY_LIST_PATH}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
            >
              <ArrowLeft className="h-3.5 w-3.5"/>返回列表
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* 顶栏：面包屑 + 演示标识 + 身份 */}
      <div className="bg-white border-b border-slate-200/70">
        <div className="max-w-[1440px] mx-auto px-6 py-2.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 min-w-0">
            <Link to={ONTOLOGY_LIST_PATH} className="hover:text-blue-600 font-medium shrink-0">业务本体</Link>
            <ChevronRight className="h-3 w-3 shrink-0"/>
            <span className="font-semibold text-slate-800 truncate">{model?.name ?? modelId}</span>
            <span className="text-slate-300">/</span>
            <span>{TAB_LABELS[tab]}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <MockBadge/>
            <IdentitySwitcher/>
          </div>
        </div>
      </div>

      {/* 模型头 */}
      <div className="bg-white border-b border-slate-200/70">
        <div className="max-w-[1440px] mx-auto px-6 py-4 space-y-3">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-lg font-bold text-slate-800 truncate">{model?.name ?? modelId}</h1>
                {model && (
                  <>
                    <span className="text-[11px] font-mono text-slate-400">{model.id}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {PROFILE_LABELS[model.profile] ?? model.profile}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                      {ORIGIN_LABELS[model.origin] ?? model.origin}
                    </span>
                  </>
                )}
              </div>
              {model && (
                <p className="text-xs text-slate-500 mt-1">
                  责任方 <span className="font-mono font-semibold text-slate-600">{model.ownerRef}</span>
                </p>
              )}
            </div>
            <ViewStatusCard ctx={ctx}/>
          </div>

          {/* Tab 导航 */}
          <nav className="flex items-center gap-1 -mb-4 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => navigateToTab(t)}
                className={`px-3.5 py-2 text-[13px] font-semibold rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${
                  t === tab
                    ? 'text-blue-700 border-blue-600 bg-blue-50/60'
                    : 'text-slate-500 border-transparent hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                {TAB_LABELS[t]}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab 内容 */}
      <main className="max-w-[1440px] mx-auto px-6 py-6">
        {tab === 'overview' && <Overview/>}
        {tab === 'object-types' && <ObjectModel/>}
        {tab === 'relations' && <RelationsPage/>}
        {tab === 'actions' && <ActionsPage/>}
        {tab === 'implementations' && <ImplementationsPage/>}
        {tab === 'workflows' && <WorkflowsPage/>}
        {tab === 'validation' && (
          <DeferredTab
            ctx={ctx}
            batch="Batch 4"
            title="校验与影响分析"
            description="校验将走 POST validation-runs → 202 → 轮询 AsyncJob 的真实任务（Batch 4 新增 OntologyValidation 页面）。"
          />
        )}
        {tab === 'release' && (
          <DeferredTab
            ctx={ctx}
            batch="Batch 4"
            title="发布"
            description="发布将基于草稿 diff + 校验/影响任务结果走 POST /publications（Batch 4）；已发布正式版本不可直接编辑。"
          />
        )}
      </main>
    </div>
  );
}

function MockBadge() {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-700 border border-amber-200"
      title="数据来自 ontology-delivery 契约 Mock 服务（meta.dataMode=MOCK），未连接任何生产服务"
    >
      <CircleDot className="h-3 w-3"/>
      演示数据 · Mock API
    </span>
  );
}

function IdentitySwitcher() {
  const actor = useDemoIdentity((s) => s.actor);
  const setActor = useDemoIdentity((s) => s.setActor);
  return (
    <label className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
      演示身份
      <select
        value={actor}
        onChange={(e) => setActor(e.target.value as typeof actor)}
        className="px-2 py-1 text-[11px] font-semibold border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:border-blue-500"
      >
        {DEMO_ACTORS.map((a) => (
          <option key={a.id} value={a.id}>{a.label}</option>
        ))}
      </select>
    </label>
  );
}

/** 视图状态卡：区分正式版本 / 草稿，暴露 contentHash 与只读原因、视图切换。 */
function ViewStatusCard({ctx}: {ctx: ModelContextValue}) {
  const {resolvedView, model, isDraft, route, capabilities, navigateToView} = ctx;
  const queryClient = useQueryClient();
  const actorScope = useActorScope();
  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);

  const versionId = resolvedView?.versionId ?? null;
  const hash = resolvedView?.contentHash;

  const goDraft = async () => {
    const csId = model?.activeChangeSetId;
    if (!csId || !route) return;
    setSwitching(true);
    setSwitchError(null);
    try {
      const cs = await queryClient.fetchQuery({
        queryKey: ontologyKeys.changeSet({...actorScope, modelId: route.modelId}, csId),
        queryFn: () => ontologyV1.getChangeSet(route.modelId, csId),
        staleTime: 15_000,
      });
      navigateToView({changeSetId: cs.data.id, revision: cs.data.revision});
    } catch {
      setSwitchError('读取草稿修订号失败，请重试');
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="text-right space-y-1.5">
      {isDraft ? (
        <div className="inline-flex items-center gap-2 flex-wrap justify-end">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <FileClock className="h-3 w-3"/>
            草稿 <span className="font-mono">{resolvedView?.changeSetId}</span> · r{resolvedView?.revision}
          </span>
          {versionId && <span className="text-[11px] text-slate-400">基于 {versionId}</span>}
          {model?.currentVersionId && (
            <button
              onClick={() => navigateToView({versionId: model.currentVersionId!})}
              className="text-[11px] font-semibold text-blue-600 hover:underline"
            >
              查看当前正式版本 {model.currentVersionId}
            </button>
          )}
        </div>
      ) : (
        <div className="inline-flex items-center gap-2 flex-wrap justify-end">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3"/>
            正式版本 <span className="font-mono">{versionId}</span>
          </span>
          <span className="text-[11px] text-slate-500">只读 · 修改需进入草稿</span>
          {model?.activeChangeSetId && (
            <button
              onClick={() => void goDraft()}
              disabled={switching}
              className="text-[11px] font-semibold text-blue-600 hover:underline disabled:opacity-50"
            >
              {switching ? '读取草稿…' : `继续草稿 ${model.activeChangeSetId}`}
            </button>
          )}
        </div>
      )}
      <div className="flex items-center gap-2 justify-end flex-wrap">
        {hash && (
          <span className="text-[10px] font-mono text-slate-400" title={hash}>
            contentHash {hash.slice(0, 10)}…
          </span>
        )}
        <span className="text-[10px] text-slate-400">
          权限 {capabilities.length > 0 ? capabilities.join(' · ') : '读取中…'}
        </span>
      </div>
      {switchError && <p className="text-[11px] text-red-600">{switchError}</p>}
    </div>
  );
}

/** 未接线 Tab 的诚实占位：展示当前视图真实统计，说明接入批次，不伪造界面。 */
function DeferredTab({ctx, batch, title, description}: {
  ctx: ModelContextValue;
  batch: string;
  title: string;
  description: string;
}) {
  const doc = ctx.resolvedView?.document;
  const stats = useMemo(() => {
    if (!doc) return [];
    return [
      {label: '对象类型', count: doc.objectTypes.length, tab: 'object-types' as OntologyTab},
      {label: '关系', count: doc.relations.length, tab: 'relations' as OntologyTab},
      {label: '约束', count: doc.constraints.length, tab: 'relations' as OntologyTab},
      {label: '行动契约', count: doc.actions.length, tab: 'actions' as OntologyTab},
      {label: '实现绑定', count: doc.implementationBindings.length, tab: 'implementations' as OntologyTab},
      {label: '流程引用', count: doc.workflowRefs.length, tab: 'workflows' as OntologyTab},
    ];
  }, [doc]);

  return (
    <div className="max-w-3xl space-y-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-slate-400"/>
          <h2 className="text-sm font-bold text-slate-800">{title}</h2>
          <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            {batch} 接入
          </span>
        </div>
        <p className="text-[13px] text-slate-600 leading-relaxed">{description}</p>
        <p className="text-[11.5px] text-slate-400">
          当前视图（contentHash {(ctx.resolvedView?.contentHash ?? '').slice(0, 10)}…）中的真实统计：
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
          {stats.map((s) => (
            <div
              key={s.label}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
            >
              <span className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                <Database className="h-3.5 w-3.5 text-slate-400"/>{s.label}
              </span>
              <span className="text-sm font-bold text-slate-800 font-mono">{s.count}</span>
            </div>
          ))}
        </div>
        {ctx.isDraft && (
          <p className="text-[11.5px] text-slate-400">
            当前为草稿视图；这些集合的编辑操作（UPSERT / REMOVE）将在 {batch} 通过
            POST /changesets/{String(ctx.resolvedView?.changeSetId ?? ':id')}/operations 提交。
          </p>
        )}
      </div>
    </div>
  );
}
