import {useEffect, useState} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {useObjectTypes} from './hooks/useOntology';
import { useApp } from './context/AppContext';
import { useUiStore } from './store/uiStore';
import { useRouteSync } from './hooks/useRouteSync';
import { Badge } from './components/ui/Badge';

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

// Icons
import {
  Search,
  Compass, HelpCircle, User, Cpu, ChevronDown, Lock, Sparkles,
  Settings, GitBranch, Network, ClipboardList, CircleDot
} from 'lucide-react';

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

/** store 视图 id → 规范本体路径（侧边栏 / 搜索 / 知识网络页跳转时直接进入本体空间）。 */
const ONTOLOGY_VIEW_TARGETS: Record<string, string> = {
  ...LEGACY_ONTOLOGY_REDIRECTS,
  workflow_orchestration: '/business-semantics/ontologies/drkn-core/workflows',
  change_release: '/business-semantics/ontologies/drkn-core/release',
};

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

  // 本体空间（列表 + 模型页）由独立布局渲染，不复用遗留外壳。
  if (isOntologyUrl(location.pathname)) {
    return location.pathname === ONTOLOGY_LIST_PATH
      ? <OntologyModelsList/>
      : <OntologyLayout/>;
  }

  return <LegacyWorkbench/>;
}

/**
 * 遗留工作台（知识网络 / 数据助手 / DKN 页面）。
 * 本体域（列表、总览、对象类型等）已迁移至 /business-semantics 空间，
 * 这里不再渲染任何本体页面。
 */
function LegacyWorkbench() {
  const navigate = useNavigate();
  const { user, aiVersion, aiReady } = useApp();

  // UI state — sourced from the global UI store (no prop drilling).
  const {
    activeView,
    isLocked,
    globalSearch,
    showSearchResults,
    navigate: navigateStore,
    setGlobalSearch,
    setShowSearchResults,
  } = useUiStore();

  // Server/domain data — sourced from React Query (the data layer).
  // Only objectTypes is consumed here (header global search over the DRKN
  // legacy model, via the Batch 1 HTTP adapter). Each page pulls its own data.
  const {data: objectTypes = []} = useObjectTypes();

  // Selected object + edit lock for the DKN views, which still receive these
  // via props (they have not yet been migrated to the hook-based data layer).
  const selectedObjectId = useUiStore((s) => s.selectedObjectId);
  const setSelectedObjectId = useUiStore((s) => s.setSelectedObjectId);

  // Handle routing navigate with optional preselected targets (used by the
  // header search results, the sidebar nav, and the three Knowledge Network
  // pages which still receive onNavigate). 本体域视图直接进入规范路径，
  // 不再切换遗留 store 视图。
  const handleNavigate = (view: string, targetId?: string) => {
    const ontologyTarget = ONTOLOGY_VIEW_TARGETS[view];
    if (ontologyTarget) {
      navigate(targetId ? `${ontologyTarget}?selected=${encodeURIComponent(targetId)}` : ontologyTarget);
      return;
    }
    navigateStore(view, targetId);
  };

  // Global search filtering
  const matchingObjects = objectTypes.filter(obj =>
    obj.id.toLowerCase().includes(globalSearch.toLowerCase()) ||
    obj.nameCn.toLowerCase().includes(globalSearch.toLowerCase()) ||
    obj.description.toLowerCase().includes(globalSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-800" id="drkn-app">

      {/* 1. 全局顶部导航条 / 控制台 */}
      <header className="bg-white border-b border-slate-200/60 h-14 shrink-0 flex items-center justify-between px-6 sticky top-0 z-40 shadow-xs">

        {/* 左侧：系统标识与快照版本 */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-xs shadow-blue-500/10">
              D
            </div>
            <div>
              <span className="text-sm font-bold text-slate-800 font-mono tracking-tight">DRKN ON-DEV CENTER</span>
              <p className="text-[9.5px] text-slate-400 font-semibold uppercase leading-none tracking-wider">语义治理操作建模台</p>
            </div>
          </div>

          <div className="h-5 w-px bg-slate-200"></div>

          {/* 演示数据标识（Mock 服务，非生产连接） */}
          <div className="flex items-center gap-1.5 text-xs">
            <span
              className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 px-2.5 py-1 rounded-full font-bold"
              title="数据来自 ontology-delivery 契约 Mock 服务（meta.dataMode=MOCK），未连接任何生产服务"
            >
              <CircleDot className="h-3 w-3" />
              演示数据 · Mock API
            </span>
          </div>
        </div>

        {/* 中间：全局语义搜索过滤 */}
        <div className="hidden md:flex items-center gap-2 max-w-md w-full relative">
          <Search className="absolute left-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => {
              setGlobalSearch(e.target.value);
              setShowSearchResults(e.target.value.length > 0);
            }}
            placeholder="全系统快速检索 Object Type (如 Field, Evidence...)"
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 text-xs border border-slate-250 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium text-slate-800"
          />

          {/* Search dropdown results */}
          {showSearchResults && (
            <div className="absolute top-10 left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50 space-y-1">
              <p className="text-[10px] text-slate-400 font-semibold px-2 uppercase tracking-tight py-1">Matching DRKN Fields</p>
              {matchingObjects.slice(0, 5).map(o => (
                <div
                  key={o.id}
                  onClick={() => {
                    handleNavigate('object_model', o.id);
                    setGlobalSearch('');
                    setShowSearchResults(false);
                  }}
                  className="p-2 hover:bg-slate-50 rounded-lg text-xs flex items-center justify-between cursor-pointer"
                >
                  <div className="font-semibold text-slate-700 font-mono flex items-center gap-1.5">
                    <Compass className="h-3.5 w-3.5 text-blue-500" />
                    {o.id} ({o.nameCn})
                  </div>
                  <span className="text-[10px] font-medium bg-slate-100 text-slate-500 px-1.5 rounded">{o.group}</span>
                </div>
              ))}
              {matchingObjects.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">无匹配的治理对象</p>
              )}
            </div>
          )}
        </div>

        {/* 右侧：操作人身份与AI平台 */}
        <div className="flex items-center gap-4">
          <Badge variant="subtle" size="md" className="font-medium">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>AI 状态：<b>{aiReady ? '已就绪' : '离线'} ({aiVersion})</b></span>
          </Badge>

          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-600">
              <User className="h-4 w-4" />
            </div>
            <div className="hidden lg:block text-left text-xs leading-none">
              <p className="font-bold text-slate-705">{user.displayName}</p>
              <p className="text-[9px] text-slate-400 font-normal mt-0.5">{user.role}</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>

      </header>

      {/* 2. 主页面结构（左侧导航 + 右侧模块视图） */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* 左侧垂直导航菜单 */}
        <aside className="w-[200px] shrink-0 bg-slate-50 border-r border-slate-200 p-4 space-y-6 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-6">

            {/* Logo */}
            <div className="flex items-center gap-2 pl-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
              </div>
              <span className="font-extrabold text-[18px] text-slate-800 tracking-tight" style={{fontFamily: "'Inter', sans-serif"}}>AI · Insight</span>
            </div>

            {/* Menu */}
            <nav className="space-y-1">
              {[
                { id: 'desktop', label: 'AI工作台', icon: <Cpu className="w-4 h-4" /> },
                { id: 'tasks', label: '任务中心', icon: <ClipboardList className="w-4 h-4" /> },
                {
                  id: 'semantics_group',
                  label: '业务语义',
                  icon: <Network className="w-4 h-4" />,
                  children: [
                    // Batch 2 起本体域入口：业务语义 → 业务本体（规范路径 /business-semantics/ontologies）。
                    { id: 'ontology_models', label: '业务本体' },
                  ],
                },
                {
                  id: 'knowledge_network_group',
                  label: '知识网络',
                  icon: <GitBranch className="w-4 h-4" />,
                  children: [
                    { id: 'knowledge_network', label: '网络总览' },
                    { id: 'knowledge_network_assets', label: '网络资产' },
                  ],
                },
                { id: 'admin', label: '管理中心', icon: <Settings className="w-4 h-4" /> }
              ].map((item) => {
                const isGroupActive = item.id === 'knowledge_network_group'
                  ? ['knowledge_network', 'knowledge_network_assets', 'knowledge_network_explorer'].includes(activeView)
                  : item.id === 'semantics_group';
                const isActive = activeView === item.id || (item.id === 'knowledge_network_group' && isGroupActive);

                return (
                  <div key={item.id} className="space-y-1">
                    <button
                      onClick={() => {
                        if (item.children) {
                          handleNavigate(item.children[0].id);
                        } else {
                          handleNavigate(item.id);
                        }
                      }}
                      className={`w-full px-3 py-3 rounded-xl flex items-center justify-between text-[14px] font-medium transition-all cursor-pointer ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-slate-600 hover:bg-blue-50/50 hover:text-blue-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {item.icon}
                        <span className={isActive ? 'font-bold' : ''}>{item.label}</span>
                      </div>
                      {item.children && (
                        <ChevronDown className={`w-4 h-4 transition-transform ${isGroupActive ? 'rotate-180' : ''}`} />
                      )}
                    </button>

                    {/* Submenu rendering：业务语义组的“业务本体”常驻展示（本体域为独立路由空间） */}
                    {item.children && (item.id === 'semantics_group' || isGroupActive) && (
                      <div className="pl-4 pr-2 pt-1 pb-2 space-y-1">
                        {item.children.map(child => {
                          const isChildActive = activeView === child.id;
                          return (
                            <button
                              key={child.id}
                              onClick={() => handleNavigate(child.id)}
                              className={`w-full px-3 py-2 rounded-lg flex items-center text-[13px] font-medium transition-colors cursor-pointer ${
                                isChildActive
                                  ? 'bg-blue-50 text-blue-700 font-bold'
                                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                              }`}
                            >
                              <div className="w-1.5 h-1.5 rounded-full mr-2.5 opacity-50 bg-current"></div>
                              <span>{child.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Bottom */}
          <div className="space-y-1 pt-4 border-t border-slate-200/60 mt-auto">
            <button className="w-full px-3 py-2.5 flex items-center gap-3 text-[14px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer">
              <HelpCircle className="w-4 h-4" />
              <span>帮助中心</span>
            </button>
            <button className="w-full px-3 py-2.5 flex items-center justify-between text-[14px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shadow-inner">
                  <User className="w-3.5 h-3.5" />
                </div>
                <span>管理员</span>
              </div>
              <ChevronDown className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </aside>

        {/* 右侧核心功能页面主视口（本体域页面已迁移至 /business-semantics 空间） */}
        <main className="flex-1 p-6 overflow-y-auto scrollbar-thin">

          {/* Conditional Router views rendering */}
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

        </main>

      </div>

    </div>
  );
}
