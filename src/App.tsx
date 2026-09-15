import {useEffect} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import { useUiStore } from './store/uiStore';
import { useRouteSync } from './hooks/useRouteSync';

// Importing page components
import OntologyModelsList from './components/OntologyModelsList';
import OntologyLayout from './ontology/OntologyLayout';
import DknOverview from './components/DknOverview';
import DknObjectModel from './components/DknObjectModel';
import KnowledgeNetworkOverview from './components/KnowledgeNetworkOverview';
import KnowledgeNetworkAssets from './components/KnowledgeNetworkAssets';
import KnowledgeNetworkExplorer from './components/KnowledgeNetworkExplorer';

// 规范本体路径（Batch 2）：/business-semantics/ontologies/...
import {isOntologyUrl, ONTOLOGY_LIST_PATH} from './api/ontology-v1/routeContext';

// Semovix 产品外壳（Batch 3.5 建立，Batch 3.6 对齐 IA）：
// 本体列表 / 详情不再是独立子应用，未实现模块走规划路由的诚实占位。
import {SemovixShell, SEMOVIX_TOP_NAV, SEMOVIX_NAV_BY_ID, SEMANTICS_SUB_BY_ID, type SemovixTopNav} from './ontology/SemovixShell';
import {OutOfScopePage} from './ontology/OutOfScope';

/**
 * 旧路由 → 规范本体路径。本体域入口统一为“业务语义 → 业务本体”
 * （/business-semantics/ontologies）。带 ?id= 的三个详情路由把 id 折叠为
 * selected 参数。仅做重定向，不渲染遗留本体页面。应用根路径进入演示
 * 聚焦的业务本体列表。
 */
const LEGACY_ONTOLOGY_REDIRECTS: Record<string, string> = {
  '/': ONTOLOGY_LIST_PATH,
  '/ontology': ONTOLOGY_LIST_PATH,
  '/ontology/drkn': ONTOLOGY_LIST_PATH,
  '/ontology/dkn': ONTOLOGY_LIST_PATH,
  '/create-model': ONTOLOGY_LIST_PATH,
  '/overview': '/business-semantics/ontologies/drkn-core/overview',
  '/object-model': '/business-semantics/ontologies/drkn-core/object-types',
  '/relation-model': '/business-semantics/ontologies/drkn-core/relations',
  '/capability-binding': '/business-semantics/ontologies/drkn-core/implementations',
  '/action-model': '/business-semantics/ontologies/drkn-core/actions',
  '/workflow': '/business-semantics/ontologies/drkn-core/workflows',
  '/change-release': '/business-semantics/ontologies/drkn-core/release',
};

/** store 视图 id → 规范本体路径（知识网络页跳转时直接进入本体空间）。 */
const ONTOLOGY_VIEW_TARGETS: Record<string, string> = {
  ...LEGACY_ONTOLOGY_REDIRECTS,
  workflow_orchestration: '/business-semantics/ontologies/drkn-core/workflows',
  change_release: '/business-semantics/ontologies/drkn-core/release',
};

/**
 * 一级模块的规划路由（无子菜单的模块）→ 一级菜单 id。
 * 这些模块当前仓库未实现：呈现“当前演示范围外”，不切换到遗留页面。
 */
const MODULE_PAGE_BY_PATH: Record<string, SemovixTopNav> = Object.fromEntries(
  SEMOVIX_TOP_NAV
    .filter((item) => !item.sub)
    .map((item) => [item.path, item.id]),
);

/** 已在仓库实现的业务语义子能力（左侧子菜单可真实进入）。 */
const IMPLEMENTED_SEMANTICS_SUBS = new Set(['ontology_models', 'knowledge_network']);

/** 业务语义左侧子菜单中未实现项的规划路由 → 子菜单项。 */
function semanticsScopeSubOf(pathname: string) {
  if (pathname !== '/business-semantics' && !pathname.startsWith('/business-semantics/')) return undefined;
  const sub = pathname === '/business-semantics'
    ? SEMANTICS_SUB_BY_ID.semantics_overview
    : Object.values(SEMANTICS_SUB_BY_ID).find((s) => s.path === pathname);
  return sub && !IMPLEMENTED_SEMANTICS_SUBS.has(sub.id) ? sub : undefined;
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  // Keep the URL (react-router) in sync with the UI store's active view +
  // selected object, and vice versa (deep links / back / refresh).
  // 对 /business-semantics/* 本体路径，该桥接保持惰性（URL 是唯一事实来源）。
  useRouteSync();

  // 旧本体路由 / 应用根路径重定向到规范路径（保留 ?id= → selected）。
  useEffect(() => {
    const target = LEGACY_ONTOLOGY_REDIRECTS[location.pathname];
    if (!target) return;
    const carriesId = ['/object-model', '/capability-binding', '/action-model'].includes(location.pathname);
    const id = carriesId ? new URLSearchParams(location.search).get('id') : null;
    navigate(id ? `${target}?selected=${encodeURIComponent(id)}` : target, {replace: true});
  }, [location.pathname, location.search, navigate]);

  // 本体空间（列表 + 模型页）在 Semovix 外壳内渲染：
  // 一级菜单高亮“业务语义”，左侧子菜单高亮“业务本体”。
  if (isOntologyUrl(location.pathname)) {
    return (
      <SemovixShell top="semantics" activeSub="ontology_models">
        {location.pathname === ONTOLOGY_LIST_PATH
          ? <OntologyModelsList/>
          : <OntologyLayout/>}
      </SemovixShell>
    );
  }

  // 未实现的一级模块：规划路由 + 诚实占位（不伪造页面，不切换遗留视图）。
  const moduleTop = MODULE_PAGE_BY_PATH[location.pathname];
  if (moduleTop) {
    return (
      <SemovixShell top={moduleTop}>
        <OutOfScopePage moduleLabel={SEMOVIX_NAV_BY_ID[moduleTop].label}/>
      </SemovixShell>
    );
  }

  // 业务语义下未实现的子能力（概览 / 业务域 / 业务术语 / 指标）：
  // 同样走规划路由 + 诚实占位，左侧子菜单保持该项高亮。
  const scopeSub = semanticsScopeSubOf(location.pathname);
  if (scopeSub) {
    return (
      <SemovixShell top="semantics" activeSub={scopeSub.id}>
        <OutOfScopePage moduleLabel={scopeSub.label} groupLabel="业务语义"/>
      </SemovixShell>
    );
  }

  // 其余路径：知识网络（业务语义的内部能力）与遗留 DKN 页面，
  // 同样运行在 Semovix 外壳内（一级“业务语义”高亮）。
  return <LegacyWorkbench/>;
}

/**
 * 遗留工作台（知识网络 / DKN 页面），运行在 Semovix 外壳的业务语义域内。
 * 本体域（列表、总览、对象类型等）已迁移至 /business-semantics 空间，
 * 这里不再渲染任何本体页面，也不再渲染 DRKN ON-DEV CENTER、AI · Insight
 * 或字母 D Logo。
 */
function LegacyWorkbench() {
  const navigate = useNavigate();

  const {
    activeView,
    isLocked,
    navigate: navigateStore,
  } = useUiStore();

  // DKN 视图经 props 接收的选中对象（尚未迁移到 hook 数据层的遗留页面）。
  const selectedObjectId = useUiStore((s) => s.selectedObjectId);
  const setSelectedObjectId = useUiStore((s) => s.setSelectedObjectId);

  // 知识网络页的 onNavigate 回调：本体域视图直接进入规范路径，
  // 其余切换遗留 store 视图。
  const handleNavigate = (view: string, targetId?: string) => {
    const ontologyTarget = ONTOLOGY_VIEW_TARGETS[view];
    if (ontologyTarget) {
      navigate(targetId ? `${ontologyTarget}?selected=${encodeURIComponent(targetId)}` : ontologyTarget);
      return;
    }
    navigateStore(view, targetId);
  };

  // 遗留视图全部归属“业务语义”：知识网络 → 左侧“知识网络”高亮；
  // DKN 页面 → 左侧“业务本体”高亮。
  const legacySub = activeView.startsWith('knowledge_network') ? 'knowledge_network' : 'ontology_models';

  return (
    <SemovixShell top="semantics" activeSub={legacySub}>
      <div className="p-6">

        {activeView === 'knowledge_network' && (
          <KnowledgeNetworkOverview
            onNavigate={handleNavigate}
          />
        )}

        {activeView === 'knowledge_network_assets' && (
           <KnowledgeNetworkAssets
             onNavigate={handleNavigate}
           />
        )}

        {activeView === 'knowledge_network_explorer' && (
           <KnowledgeNetworkExplorer
             onNavigate={handleNavigate}
           />
        )}

        {activeView === 'dkn_overview' && (
          <DknOverview
            onNavigate={handleNavigate}
            modelId={selectedObjectId}
            isLocked={isLocked}
          />
        )}

        {activeView === 'dkn_object_model' && (
          <DknObjectModel
            onNavigate={handleNavigate}
            selectedObjectId={selectedObjectId}
            onSelectObject={setSelectedObjectId}
            isLocked={isLocked}
          />
        )}

      </div>
    </SemovixShell>
  );
}
