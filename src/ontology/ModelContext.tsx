/**
 * 统一模型上下文（Batch 2 核心机制）。
 *
 * URL 是领域上下文的唯一 Source of Truth：
 * /business-semantics/ontologies/:modelId/:tab 必须显式携带 versionId 或
 * changeSetId+revision（互斥）。若无视图参数，先读 ModelSummary，再 replace 到
 * 明确的 currentVersionId（新模型无正式版本时落到 OPEN 草稿），保证刷新/深链接
 * 始终可复现。selectedId 走 `selected` query param，不进 Zustand。
 */
import {createContext, useContext, useEffect, useRef, useState, type ReactNode} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {useQueryClient} from '@tanstack/react-query';
import {
  ONTOLOGY_LIST_PATH,
  ontologyLocation,
  parseOntologyPath,
  parseOntologyRoute,
  type OntologyRoute,
  type OntologyTab,
} from '../api/ontology-v1/routeContext';
import {ontologyKeys} from '../api/ontology-v1/queryKeys';
import {ontologyV1} from '../api/ontology-v1/client';
import type {ModelSummary, ResolvedView, ViewReference} from '../api/ontology-v1/types.generated';
import {
  apiErrorMessage,
  useActorScope,
  useModelSummary,
  useResolvedView,
  useSession,
} from './queries';

export interface ModelContextValue {
  route: OntologyRoute;
  modelId: string;
  tab: OntologyTab;
  view: ViewReference;
  selectedId: string | undefined;
  isDraft: boolean;
  model: ModelSummary | undefined;
  resolvedView: ResolvedView | undefined;
  /** 服务端契约能力（GET /session），演示身份可切换。 */
  capabilities: string[];
  actorId: string;
  /** 模型数据加载状态。 */
  modelLoading: boolean;
  viewLoading: boolean;
  error: string | null;
  /** 当前视图是否可编辑：视图非只读（草稿）且身份具备 ontology.edit。 */
  canEdit: boolean;
  /** 编辑被禁用的原因（用于界面解释，而不是静默灰掉）。 */
  readOnlyReason: 'published-version' | 'viewer-permission' | null;
  navigateToView: (view: ViewReference, opts?: {tab?: OntologyTab; selectedId?: string; replace?: boolean}) => void;
  navigateToTab: (tab: OntologyTab) => void;
  select: (id: string | undefined) => void;
  retry: () => void;
}

const ModelContext = createContext<ModelContextValue | null>(null);

export function useModelContext(): ModelContextValue {
  const ctx = useContext(ModelContext);
  if (!ctx) throw new Error('useModelContext 必须在 ModelContextProvider 内使用');
  return ctx;
}

export function ModelContextProvider({children}: {children: ReactNode}) {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const actorScope = useActorScope();

  const path = parseOntologyPath(location.pathname, location.search);
  const modelId = path?.modelId;
  const route = parseOntologyRoute(location.pathname, location.search);

  const modelQuery = useModelSummary(actorScope, modelId);
  const sessionQuery = useSession(actorScope);
  const viewQuery = useResolvedView(actorScope, modelId, route?.view);

  const [resolveError, setResolveError] = useState<string | null>(null);
  // 防止默认视图解析在 model 数据每次重取时重复 replace。
  const resolvedFor = useRef<string | null>(null);

  // 无视图参数（或参数非法）→ 读 ModelSummary 后 replace 到明确视图。
  useEffect(() => {
    if (!path || route || modelQuery.isError || !modelQuery.data) return;
    const key = `${modelQuery.data.id}@${modelQuery.data.currentVersionId ?? '-'}@${modelQuery.data.activeChangeSetId ?? '-'}`;
    if (resolvedFor.current === key) return;
    let cancelled = false;
    (async () => {
      const m = modelQuery.data!;
      try {
        let nextView: ViewReference | null = m.currentVersionId
          ? {versionId: m.currentVersionId}
          : null;
        if (!nextView && m.activeChangeSetId) {
          // 新建业务本体：尚无正式版本，落到初始 OPEN 草稿。
          const cs = await queryClient.fetchQuery({
            queryKey: ontologyKeys.changeSet({...actorScope, modelId: m.id}, m.activeChangeSetId),
            queryFn: () => ontologyV1.getChangeSet(m.id, m.activeChangeSetId!),
            staleTime: 30_000,
          });
          nextView = {changeSetId: cs.data.id, revision: cs.data.revision};
        }
        if (cancelled) return;
        if (!nextView) {
          setResolveError('该模型既没有正式版本也没有进行中的草稿，无法解析视图');
          return;
        }
        resolvedFor.current = key;
        navigate(ontologyLocation({modelId: m.id, tab: path.tab, view: nextView, selectedId: path.selectedId}), {replace: true});
      } catch (e) {
        if (!cancelled) setResolveError(apiErrorMessage(e));
      }
    })();
    return () => { cancelled = true; };
  }, [path, route, modelQuery.data, modelQuery.isError, navigate, queryClient, actorScope]);

  if (!path || !modelId) {
    return (
      <div className="p-8 text-sm text-slate-600">
        <p className="font-semibold text-slate-800 mb-2">未知的本体路径</p>
        <p className="mb-4 text-slate-500">路径应为 /business-semantics/ontologies/:modelId/:tab</p>
        <a href={ONTOLOGY_LIST_PATH} className="text-blue-600 underline">返回业务本体列表</a>
      </div>
    );
  }

  const capabilities = sessionQuery.data?.capabilities ?? [];
  const actorId = sessionQuery.data?.actorId ?? actorScope.actorId;
  const hasEditCapability = capabilities.includes('ontology.edit');

  const error = modelQuery.isError
    ? apiErrorMessage(modelQuery.error)
    : route && viewQuery.isError
      ? apiErrorMessage(viewQuery.error)
      : resolveError;

  // 正在把无视图 URL 解析为明确视图（读 ModelSummary 中）。
  const resolvingDefault = !route && !error;

  // 路由尚未解析出视图时给出占位（界面处于 resolvingDefault 加载态，不会消费它发请求）。
  const unresolvedView: ViewReference = {changeSetId: 'unresolved', revision: 0};

  const value: ModelContextValue = {
    route: route ?? {modelId, tab: path.tab, view: unresolvedView, selectedId: path.selectedId},
    modelId,
    tab: path.tab,
    view: route ? route.view : unresolvedView,
    selectedId: path.selectedId,
    isDraft: route ? 'changeSetId' in route.view : false,
    model: modelQuery.data,
    resolvedView: viewQuery.data,
    capabilities,
    actorId,
    modelLoading: modelQuery.isLoading,
    viewLoading: !route || modelQuery.isLoading || viewQuery.isLoading,
    error,
    canEdit: Boolean(route && viewQuery.data && !viewQuery.data.readOnly && hasEditCapability),
    readOnlyReason: route && viewQuery.data?.readOnly === false && !hasEditCapability
      ? 'viewer-permission'
      : route && 'versionId' in route.view ? 'published-version' : null,
    navigateToView: (nextView, opts) => {
      navigate(ontologyLocation({
        modelId,
        tab: opts?.tab ?? path.tab,
        view: nextView,
        selectedId: opts?.selectedId ?? path.selectedId,
      }), {replace: opts?.replace ?? false});
    },
    navigateToTab: (tab) => {
      if (!route) return;
      navigate(ontologyLocation({modelId, tab, view: route.view, selectedId: route.selectedId}));
    },
    select: (id) => {
      if (!route) return;
      // 选择对象只替换 selected 参数，不产生历史记录。
      navigate(ontologyLocation({modelId, tab: route.tab, view: route.view, selectedId: id}), {replace: true});
    },
    retry: () => {
      resolvedFor.current = null;
      setResolveError(null);
      void modelQuery.refetch();
      if (route) void viewQuery.refetch();
    },
  };

  return <ModelContext.Provider value={value}>{children(value)}</ModelContext.Provider>;
}
