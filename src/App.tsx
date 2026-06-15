import React, { useState } from 'react';
import { 
  INITIAL_OBJECT_TYPES, 
  INITIAL_LINK_TYPES, 
  INITIAL_CAPABILITIES, 
  INITIAL_WORKFLOWS, 
  INITIAL_CHANGE_SETS, 
  INITIAL_VALIDATION_ITEMS 
} from './data';
import { ObjectType, LinkType, Capability, DRKNWorkflow, ChangeSet, ValidationItem } from './types';

// Importing page components
import Overview from './components/Overview';
import ObjectModel from './components/ObjectModel';
import RelationModel from './components/RelationModel';
import CapabilityBinding from './components/CapabilityBinding';
import WorkflowOrchestrator from './components/WorkflowOrchestrator';
import ChangeRelease from './components/ChangeRelease';
import OntologyModelsList from './components/OntologyModelsList';
import CreateChangeSetDrawer from './components/CreateChangeSetDrawer';
import CreateModelWizard from './components/CreateModelWizard';

// Icons
import { 
  LayoutDashboard, Layers, Link2, Code, Workflow, 
  GitPullRequest, Search, CheckCircle, AlertTriangle, 
  Compass, HelpCircle, User, Cpu, ChevronDown, Lock, Unlock, Sparkles, Database
} from 'lucide-react';

export default function App() {
  // Navigation active view state
  const [activeView, setActiveView] = useState<string>('ontology_models');
  // Selected Object Type for ObjectModel and Capability views
  const [selectedObjectId, setSelectedObjectId] = useState<string>('Field');

  // Core application states
  const [objectTypes, setObjectTypes] = useState<ObjectType[]>(INITIAL_OBJECT_TYPES);
  const [linkTypes, setLinkTypes] = useState<LinkType[]>(INITIAL_LINK_TYPES);
  const [capabilities, setCapabilities] = useState<Capability[]>(INITIAL_CAPABILITIES);
  const [workflows, setWorkflows] = useState<DRKNWorkflow[]>(INITIAL_WORKFLOWS);
  const [changeSets, setChangeSets] = useState<ChangeSet[]>(INITIAL_CHANGE_SETS);
  const [validationItems, setValidationItems] = useState<ValidationItem[]>(INITIAL_VALIDATION_ITEMS);

  // Changeset Active Editing state lock
  const [isLocked, setIsLocked] = useState<boolean>(true); // initially locked to simulate Palantir transaction edit locking
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState<boolean>(false);

  // Global search query
  const [globalSearch, setGlobalSearch] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Hanlde routing navigate with optional preselected targets
  const handleNavigate = (view: string, targetId?: string) => {
    setActiveView(view);
    if (targetId) {
      setSelectedObjectId(targetId);
    }
  };

  // Turn on editing changeset (Unlock mode)
  const submitCreateChangeSet = () => {
    setIsLocked(false);
    // Find CS-2026-012 (the editing draft) and make it active editing
    const updated = changeSets.map(cs => {
      if (cs.id === 'CS-2026-012') {
        return { ...cs, status: 'editing' as const };
      }
      return cs;
    });
    setChangeSets(updated);
  };

  const openCreateChangeSet = () => {
    setIsCreateDrawerOpen(true);
  };

  // Re-run simulation validations
  const handleRunValidation = () => {
    alert("🔍 开始扫描逻辑一致性... \n一式 10 个 Object Type, 8 个 Link Type, 8 个绑定能力全链节点扫描完成！状态完美正常，检验无破坏。");
  };

  const handleUpdateObjectType = (updatedObj: ObjectType) => {
    const updated = objectTypes.map(o => o.id === updatedObj.id ? updatedObj : o);
    setObjectTypes(updated);
  };

  const handleUpdateLinkTypes = (updatedLinks: LinkType[]) => {
    setLinkTypes(updatedLinks);
    // Append a transaction log draft to changeset automatically
    const updatedCS = changeSets.map(cs => {
      if (cs.id === 'CS-2026-012') {
        return {
          ...cs,
          changes: [
            ...cs.changes,
            { type: 'add_link' as const, target: `Relation Model`, description: `新建或解绑了特定的 Link Type 关系承载。` }
          ]
        };
      }
      return cs;
    });
    setChangeSets(updatedCS);
  };

  const handleUpdateCapabilities = (updatedCaps: Capability[]) => {
    setCapabilities(updatedCaps);
    // Append log draft to changeset
    const updatedCS = changeSets.map(cs => {
      if (cs.id === 'CS-2026-012') {
        return {
          ...cs,
          changes: [
            ...cs.changes,
            { type: 'bind_capability' as const, target: `Capability Binding`, description: `为领域实体多级绑定了特定的 Function / Action 计算或修改决策方法。` }
          ]
        };
      }
      return cs;
    });
    setChangeSets(updatedCS);
  };

  const clearActiveDraftMode = () => {
    setIsLocked(true);
  };

  // Global search filtering
  const matchingObjects = objectTypes.filter(obj => 
    obj.id.toLowerCase().includes(globalSearch.toLowerCase()) || 
    obj.nameCn.toLowerCase().includes(globalSearch.toLowerCase()) ||
    obj.description.toLowerCase().includes(globalSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-800" id="drkn-app">
      
      {/* Conditional Router views rendering */}
      {activeView === 'create_model' && (
        <div className="fixed inset-0 z-50 bg-[#f8fafc]">
          <CreateModelWizard 
            onCancel={() => setActiveView('ontology_models')}
            onComplete={() => setActiveView('overview')}
          />
        </div>
      )}

      {/* 1. 全局顶部导航条 / 控制台 */}
      <header className="bg-white border-b border-slate-150 h-14 shrink-0 flex items-center justify-between px-6 sticky top-0 z-40 shadow-xs">
        
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

          {/* 变更集草案常驻指示器 */}
          <div className="flex items-center gap-1.5 text-xs">
            {isLocked ? (
              <span className="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-200 text-slate-500 px-2.5 py-1 rounded-full font-semibold">
                <Lock className="h-3 w-3" />
                模型锁定 (发布中)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-150 text-blue-700 px-2.5 py-1 rounded-full font-bold animate-none shadow-xs">
                <Unlock className="h-3.5 w-3.5 text-blue-500" />
                编辑沙箱中 | CS-2026-012
              </span>
            )}
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
          <div className="flex items-center gap-1 text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 font-medium">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>AI 状态：<b>已就绪 (v1.3.0)</b></span>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-600">
              <User className="h-4 w-4" />
            </div>
            <div className="hidden lg:block text-left text-xs leading-none">
              <p className="font-bold text-slate-705">linzhang0222</p>
              <p className="text-[9px] text-slate-400 font-normal mt-0.5">超级系统管理员</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>

      </header>

      {/* 2. 主页面结构（左侧导航 + 右侧模块视图） */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* 左侧垂直导航菜单：六个页面菜单规划 */}
        {activeView !== 'create_model' && (
        <aside className="w-60 shrink-0 bg-slate-900 border-r border-slate-800 p-4 space-y-6 flex flex-col justify-between overflow-y-auto">
          
          <div className="space-y-5">
            
            {/* 顶栏类别 */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-2">本体管理</p>
              <nav className="space-y-1">
                {[
                  { id: 'ontology_models', label: 'DRKN 本体模型', icon: <Database className="h-4 w-4" /> },
                  { id: 'overview', label: '模型总览 (Overview)', icon: <LayoutDashboard className="h-4 w-4" /> },
                  { id: 'object_model', label: '对象模型 (Objects)', icon: <Layers className="h-4 w-4" /> },
                  { id: 'relation_model', label: '关系模型 (Links)', icon: <Link2 className="h-4 w-4" /> },
                  { id: 'capability_binding', label: '能力绑定 (Capabilities)', icon: <Code className="h-4 w-4" /> },
                  { id: 'workflow_orchestration', label: '流程编排 (Workflow)', icon: <Workflow className="h-4 w-4" /> },
                  { id: 'change_release', label: '变更发布 (Release)', icon: <GitPullRequest className="h-4 w-4" />, badge: 'CS-012' }
                ].map((item) => {
                  const isActive = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigate(item.id)}
                      className={`w-full p-2.5 rounded-lg flex items-center justify-between text-xs font-medium text-left transition-all duration-200 cursor-pointer ${
                        isActive
                          ? 'bg-blue-600/10 text-blue-400 border-l-4 border-blue-500 shadow-sm'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {item.icon}
                        <span>{item.label}</span>
                      </div>
                      
                      {item.badge && (
                        <span className={`text-[9.5px] px-1.5 py-0.5 rounded-full font-bold ${
                          isActive ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* 快捷校验提示卡 */}
            <div className="p-3.5 bg-slate-800/40 border border-slate-800/80 rounded-xl text-xs space-y-1.5 shadow-inner">
              <div className="flex items-center justify-between font-bold text-slate-200 text-[11px]">
                <span>自动健康校验</span>
                <span className="text-emerald-400 flex items-center gap-1 font-medium">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  正常运行
                </span>
              </div>
              <p className="text-slate-400 leading-normal text-[10.5px]">
                检测到全量 10 个核心 Data Models 中：
              </p>
              <div className="flex items-center justify-between text-[10px] text-slate-350 bg-slate-900/60 border border-slate-800 p-1.5 rounded font-mono">
                <span>0 编译物理死锁</span>
                <span>2 逻辑警告</span>
              </div>
            </div>

          </div>

          {/* 底部信息与版权 */}
          <div className="space-y-3 text-[10.5px]">
            <div className="p-3 bg-slate-800/30 border border-slate-800/50 rounded-xl text-xs space-y-1">
              <p className="font-bold uppercase tracking-wider text-[9px] text-slate-400">操作提示</p>
              <p className="text-slate-400 text-[10px] leading-relaxed">
                在“变更与发布”中点击“一键发布”，模型会升版至 v1.4.0 并重新编撰 DKN 索引与大模型能力，完成完整治理闭环！
              </p>
            </div>
            <p className="text-slate-500 font-medium px-2">&copy; 2026 DRKN Semantic.</p>
          </div>

        </aside>
        )}

        {/* 右侧核心功能页面主视口 */}
        <main className="flex-1 p-6 overflow-y-auto scrollbar-thin">
          
          {/* Conditional Router views rendering */}
          {activeView === 'ontology_models' && (
            <OntologyModelsList
              onNavigate={handleNavigate}
              onCreateChangeSet={openCreateChangeSet}
              onRunValidation={handleRunValidation}
              isLocked={isLocked}
            />
          )}

          {activeView === 'overview' && (
            <Overview
              onNavigate={handleNavigate}
              objectTypes={objectTypes}
              linkTypes={linkTypes}
              changeSets={changeSets}
              validationItems={validationItems}
              onCreateChangeSet={openCreateChangeSet}
              onRunValidation={handleRunValidation}
              isLocked={isLocked}
            />
          )}

          {activeView === 'object_model' && (
            <ObjectModel
              objectTypes={objectTypes}
              selectedObjectId={selectedObjectId}
              onSelectObject={setSelectedObjectId}
              onNavigate={handleNavigate}
              isEditingActive={!isLocked}
              onUpdateObjectType={handleUpdateObjectType}
            />
          )}

          {activeView === 'relation_model' && (
            <RelationModel
              linkTypes={linkTypes}
              onNavigate={handleNavigate}
              isEditingActive={!isLocked}
              onUpdateLinkTypes={handleUpdateLinkTypes}
            />
          )}

          {activeView === 'capability_binding' && (
            <CapabilityBinding
              capabilities={capabilities}
              objectTypes={objectTypes}
              selectedObjectId={selectedObjectId}
              onSelectObject={setSelectedObjectId}
              onNavigate={handleNavigate}
              isEditingActive={!isLocked}
              onUpdateCapabilities={handleUpdateCapabilities}
            />
          )}

          {activeView === 'workflow_orchestration' && (
            <WorkflowOrchestrator
              workflows={workflows}
              onNavigate={handleNavigate}
              isEditingActive={!isLocked}
            />
          )}

          {activeView === 'change_release' && (
            <ChangeRelease
              changeSets={changeSets}
              validationItems={validationItems}
              isLocked={isLocked}
              onNavigate={handleNavigate}
              onUpdateChangeSets={setChangeSets}
              onClearActiveDraft={clearActiveDraftMode}
            />
          )}

        </main>

      </div>

      <CreateChangeSetDrawer 
        isOpen={isCreateDrawerOpen} 
        onClose={() => setIsCreateDrawerOpen(false)} 
        onSubmit={submitCreateChangeSet} 
      />

    </div>
  );
}
