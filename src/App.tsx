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

// Semovix 产品外壳（Batch 3.5）：本体列表 / 详情不再是独立子应用
import {SemovixShell, type SemovixTopNav} from './ontology/SemovixShell';

/**
 * 旧路由 → 规范本体路径。本体域入口统一为“业务语义 → 业务本体”
 * （/business-semantics/ontologies）。带 ?id= 的三个详情路由把 id 折叠为
 * selected 参数。仅做重定向，不渲染遗留本体页面。
 */
const LEGACY_ONTOLOGY_REDIRECTS: Record<string, string> = {
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

/** 遗留 store 视图 → Semovix 一级菜单。 */
function legacyTopOf(activeView: string): SemovixTopNav {
  if (activeView.startsWith('knowledge_network')) return 'knowledge';
  if (activeView.startsWith('dkn_')) return 'semantics';
  if (activeView === 'tasks') return 'tasks';
  if (activeView === 'admin') return 'admin';
  return 'desktop';
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  // Keep the URL (react-router) in sync with the UI store's active view +
  // selected object, and vice versa (deep links / back / refresh).
  // 对 /business-semantics/* 本体路径，该桥接保持惰性（URL 是唯一事实来源）。
  useRouteSync();

  // 旧本体路由重定向到规范路径（保留 ?id= → selected）。
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

  return <LegacyWorkbench/>;
}

/**
 * 遗留工作台（知识网络 / DKN 页面），同样运行在 Semovix 外壳内。
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

  return (
    <SemovixShell top={legacyTopOf(activeView)} activeSub={activeView}>
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
