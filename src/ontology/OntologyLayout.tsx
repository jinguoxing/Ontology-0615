/**
 * 本体模型空间布局（Batch 2 建立，Batch 3.5 结构对齐）。
 *
 * - 在 Semovix 产品外壳内渲染（一级菜单高亮“业务语义”，左侧子菜单
 *   高亮“业务本体”，见 SemovixShell）。
 * - 统一页面头：主标题为当前功能名称（Tab 名），标题下显示当前模型
 *   （名称 / id / profile / origin / 责任方），不再把模型名当页面标题。
 * - 统一状态带：草稿视图显示草稿 ID、基线版本、目标版本（ChangeSet
 *   登记值）、revision 与“正式版本未受草稿影响”；正式版本显示只读状态。
 * - 工程标识（contentHash、ETag、API Path、capabilities、transport、
 *   Registry 原始值）移入“技术详情”抽屉，不占用主界面。
 * - 八个 Tab 为本体详情内的能力页；validation / release 是 Batch 4 的
 *   诚实占位（真实统计 + 接入说明，不伪造编辑界面）。
 */
import {useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {useQueryClient} from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Database,
  Eye,
  FileClock,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Terminal,
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
import {useActorScope, useChangeSet} from './queries';
import {ModelContextProvider, useModelContext, type ModelContextValue} from './ModelContext';
import {TechnicalDetailsDrawer} from './TechnicalDetails';

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
  return <ModelContextProvider>{(ctx) => <LayoutShell ctx={ctx}/>}</ModelContextProvider>;
}

function LayoutShell({ctx}: {ctx: ModelContextValue}) {
  const {model, viewLoading, error, retry, tab, modelId} = ctx;
  const [techOpen, setTechOpen] = useState(false);

  if (viewLoading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500"/>
          <p className="text-sm font-medium">正在解析模型视图（{modelId}）…</p>
          <p className="text-xs text-slate-400">读取 GET /models/:id 与 GET /models/:id/view</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-16 px-8 flex items-center justify-center">
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
    <div className="min-h-full">
      {/* 统一页面头：主标题 = 当前功能名称；标题下显示当前模型 */}
      <div className="bg-white border-b border-slate-200/70 px-8 pt-5 pb-0 space-y-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <Link to={ONTOLOGY_LIST_PATH} className="hover:text-blue-600 font-medium">业务本体</Link>
              <span className="text-slate-300">/</span>
              <span className="font-semibold text-slate-500">{model?.name ?? modelId}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-800 mt-1">{TAB_LABELS[tab]}</h1>
            {model && (
              <div className="flex items-center gap-2 flex-wrap mt-1.5">
                <span className="text-[12px] font-semibold text-slate-600">{model.name}</span>
                <span className="text-[10.5px] font-mono text-slate-400">{model.id}</span>
                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {PROFILE_LABELS[model.profile] ?? model.profile}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                  {ORIGIN_LABELS[model.origin] ?? model.origin}
                </span>
                <span className="text-[11px] text-slate-400">责任方 <span className="font-mono">{model.ownerRef}</span></span>
              </div>
            )}
          </div>
          <button
            onClick={() => setTechOpen(true)}
            data-testid="technical-details"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:border-slate-300 hover:text-slate-800 shrink-0"
            title="contentHash、ETag、API Path、capabilities、transport 与 Registry 原始值"
          >
            <Terminal className="h-3.5 w-3.5 text-slate-400"/>技术详情
          </button>
        </div>

        {/* 统一状态带 */}
        <StatusBand ctx={ctx}/>

        {/* Tab 导航：本体八项能力只在详情页内呈现 */}
        <nav className="flex items-center gap-1 -mb-px overflow-x-auto" data-testid="ontology-tabs">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => ctx.navigateToTab(t)}
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

      {/* Tab 内容：全宽，不限制为小应用宽度 */}
      <main className="px-8 py-6">
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

      <TechnicalDetailsDrawer open={techOpen} onClose={() => setTechOpen(false)}/>
    </div>
  );
}

/**
 * 统一状态带：产品语义在这里，工程原始值在技术详情抽屉。
 * - 草稿：草稿 ID、基线版本、目标版本（GET /changesets/:id 登记值）、revision、
 *   正式版本未受草稿影响。
 * - 正式版本：只读状态与进入草稿的入口。
 */
function StatusBand({ctx}: {ctx: ModelContextValue}) {
  const {resolvedView, model, isDraft, route, navigateToView, modelId} = ctx;
  const scope = useActorScope();
  const queryClient = useQueryClient();
  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);

  const draftId = isDraft && 'changeSetId' in route.view ? route.view.changeSetId : null;
  const csQuery = useChangeSet(scope, modelId, draftId);

  const goDraft = async () => {
    const csId = model?.activeChangeSetId;
    if (!csId) return;
    setSwitching(true);
    setSwitchError(null);
    try {
      const cs = await queryClient.fetchQuery({
        queryKey: ontologyKeys.changeSet({...scope, modelId}, csId),
        queryFn: () => ontologyV1.getChangeSet(modelId, csId),
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
    <div className="flex items-center gap-2 flex-wrap text-[11.5px]" data-testid="status-band">
      {isDraft ? (
        <>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <FileClock className="h-3 w-3"/>
            草稿 <span className="font-mono">{resolvedView?.changeSetId}</span> · r<span className="font-mono">{resolvedView?.revision}</span>
          </span>
          <BandField label="基线版本" value={csQuery.data?.baseVersionId ?? resolvedView?.versionId ?? '初始草稿（无基线）'}/>
          <BandField label="目标版本" value={csQuery.data?.targetVersionId ?? (csQuery.isLoading ? '…' : '—')} mono/>
          {model?.currentVersionId && (
            <span className="inline-flex items-center gap-1 text-slate-500" title="草稿修改不影响已发布正式版本；发布（Batch 4）才会产生新版本">
              <ShieldCheck className="h-3 w-3 text-emerald-500"/>
              正式版本 <span className="font-mono font-semibold">{model.currentVersionId}</span> 未受草稿影响
            </span>
          )}
          {model?.currentVersionId && (
            <button
              onClick={() => navigateToView({versionId: model.currentVersionId!})}
              className="font-semibold text-blue-600 hover:underline"
            >
              查看正式版本
            </button>
          )}
        </>
      ) : (
        <>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3"/>
            正式版本 <span className="font-mono">{resolvedView?.versionId}</span>
          </span>
          <span className="inline-flex items-center gap-1 text-slate-500">
            <Eye className="h-3 w-3"/>只读 · 正式版本不可直接修改，修改需进入草稿
          </span>
          {model?.activeChangeSetId && (
            <button
              onClick={() => void goDraft()}
              disabled={switching}
              className="font-semibold text-blue-600 hover:underline disabled:opacity-50"
            >
              {switching ? '读取草稿…' : `继续草稿 ${model.activeChangeSetId}`}
            </button>
          )}
        </>
      )}
      {switchError && <span className="text-red-600">{switchError}</span>}
    </div>
  );
}

function BandField({label, value, mono}: {label: string; value: string; mono?: boolean}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-slate-500">
      <span className="text-slate-400">{label}</span>
      <span className={`font-semibold text-slate-600 ${mono ? 'font-mono' : ''}`}>{value}</span>
    </span>
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
