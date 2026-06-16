import React, { useState } from 'react';
import { LinkType } from '../types';
import { 
  Database, Box, FileText, Shield, ClipboardCopy, 
  Layers, AlertTriangle, Target, Play, FileCode, CheckCircle2,
  ChevronRight, Search, Settings, Star, GitMerge, Link as LinkIcon, FunctionSquare, Plus, Edit, Download, Check, Map as MapIcon, Menu, ArrowRight, Expand, ZoomIn, ZoomOut, RotateCcw, AlertCircle, Info,
  RefreshCw, ChevronDown
} from 'lucide-react';
import CreateLinkTypeDrawer from './CreateLinkTypeDrawer';

interface RelationModelProps {
  linkTypes: LinkType[];
  onNavigate: (view: string, targetId?: string) => void;
  isEditingActive: boolean;
  onUpdateLinkTypes: (updated: LinkType[]) => void;
}

export default function RelationModel({
  linkTypes,
  onNavigate,
  isEditingActive,
  onUpdateLinkTypes
}: RelationModelProps) {

  // Current active chosen Link Type
  const [activeLinkId, setActiveLinkId] = useState<string>('has_assertion');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDraftSaved, setIsDraftSaved] = useState(false);

  // Fallback to activeLink data if not in props
  const activeLink = linkTypes.find(l => l.id === activeLinkId) || {
    id: 'has_assertion',
    nameCn: '拥有语义断言',
    sourceObjId: 'Field',
    targetObjId: 'SemanticAssertion',
    direction: 'Field → SemanticAssertion',
    cardinality: '1 : N',
    isLineage: true,
    isAiVisible: true,
    requiresAuth: true,
    description: '字段拥有一个或多个语义断言，用于承载语义识别结果。'
  };

  const localLinkTypes = [
    { id: 'contains', nameCn: '', source: 'DataSource', target: 'DataAsset', isLineage: true, isAiVisible: true },
    { id: 'contains', nameCn: '', source: 'DataAsset', target: 'Field', isLineage: true, isAiVisible: true },
    { id: 'has_assertion', nameCn: '', source: 'Field', target: 'SemanticAssertion', isLineage: true, isAiVisible: true },
    { id: 'supported_by', nameCn: '', source: 'SemanticAssertion', target: 'Evidence', isLineage: true, isAiVisible: true },
    { id: 'checked_by', nameCn: '', source: 'Field', target: 'DataQualityRule', isLineage: true, isAiVisible: true },
    { id: 'produces', nameCn: '', source: 'DataQualityRule', target: 'DataIssue', isLineage: true, isAiVisible: true },
    { id: 'assigned_to', nameCn: '', source: 'SemanticAssertion', target: 'GovernanceTask', isLineage: true, isAiVisible: true },
    { id: 'includes', nameCn: '', source: 'Snapshot', target: 'SemanticAssertion', isLineage: false, isAiVisible: true },
    { id: 'generated_by', nameCn: '', source: 'Run', target: 'Sanpshot', isLineage: true, isAiVisible: true }
  ];

  const getObjIcon = (id: string, className = "h-4 w-4") => {
    switch (id) {
      case 'DataSource': return <Database className={`${className} text-blue-500`} />;
      case 'DataAsset': return <Box className={`${className} text-blue-500`} />;
      case 'Field': return <FileText className={`${className} text-blue-500`} />;
      case 'SemanticAssertion': return <Shield className={`${className} text-blue-500`} />;
      case 'Evidence': return <FileCode className={`${className} text-blue-500`} />;
      case 'DataQualityRule': return <CheckCircle2 className={`${className} text-blue-500`} />;
      case 'DataIssue': return <AlertTriangle className={`${className} text-red-500`} />;
      case 'GovernanceTask': return <Target className={`${className} text-blue-500`} />;
      case 'Run': return <Play className={`${className} text-blue-500`} />;
      case 'Snapshot': return <Box className={`${className} text-blue-500`} />;
      case 'Sanpshot': return <Box className={`${className} text-blue-500`} />;
      default: return <Box className={className} />;
    }
  };

  return (
    <div className="min-h-full font-sans bg-transparent" id="relation-workspace">
      
      {/* 顶部 Header：100% 遵照设计图样式 */}
      <div className="mb-5 space-y-1.5 shrink-0">
        
        {/* 第一行：面包屑与常驻右侧的变更沙箱指示 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center text-[12px] text-slate-400 font-semibold tracking-wide">
             <span className="hover:text-blue-600 cursor-pointer transition-colors" onClick={() => onNavigate('overview')}>管理中心</span>
             <span className="mx-2 text-slate-300">/</span>
             <span className="hover:text-blue-600 cursor-pointer transition-colors">本体管理</span>
             <span className="mx-2 text-slate-300">/</span>
             <span className="hover:text-blue-600 cursor-pointer transition-colors">DRKN 本体模型管理</span>
             <span className="mx-2 text-slate-300">/</span>
             <span className="text-slate-800 font-black">关系模型</span>
          </div>

          <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-150 px-3 py-1 rounded-full shadow-2xs">
             <span className="text-[10px] font-bold text-rose-500">当前变更集</span>
             <span className="text-[11px] font-black text-rose-700 font-mono">CS-2026-012</span>
             <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
             <span className="text-[10px] font-extrabold text-[#9a3412] bg-amber-100 px-1 py-0.2 rounded leading-none">Editing</span>
          </div>
        </div>

        {/* 第二行：核心大标题与功能按钮面板 */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
             <div className="flex items-center gap-3">
                <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>DRKN-Core 数据语义治理模型</span>
                </h1>
                <span className="px-2 py-0.5 rounded text-[11px] font-extrabold bg-blue-50 text-blue-600 border border-blue-200 shadow-3xs leading-none">已发布</span>
             </div>
             <div className="flex items-center gap-4 text-[11px] text-slate-450 font-medium">
                <span className="flex items-center gap-1"><span className="font-bold text-slate-650">当前版本:</span> <span className="text-blue-600 font-mono font-black text-[12px]">v1.3.0</span></span>
                <span className="text-slate-200">|</span>
                <span className="flex items-center gap-1"><span className="font-bold text-slate-650">发布于:</span> 2026-08-20 10:30:00</span>
                <span className="text-slate-200">|</span>
                <span className="flex items-center gap-1"><span className="font-bold text-slate-650">发布人:</span> 系统管理员</span>
             </div>
          </div>

          {/* 右侧操作交互栏 */}
          <div className="flex items-center gap-2">
            <button className="px-3.5 py-1.5 text-xs font-black text-slate-650 bg-white border border-slate-250 hover:bg-slate-50 rounded-lg shadow-3xs hover:border-slate-350 transition-all flex items-center gap-1.5 cursor-pointer">
              <RefreshCw className="w-3.5 h-3.5 text-slate-450" /> 版本对比
            </button>
            <button className="px-3.5 py-1.5 text-xs font-black text-slate-650 bg-white border border-slate-250 hover:bg-slate-50 rounded-lg shadow-3xs hover:border-slate-350 transition-all flex items-center gap-1.5 cursor-pointer">
              <Download className="w-3.5 h-3.5 text-slate-450" /> 导出模型
            </button>
            <button className="p-1.5 bg-white border border-slate-250 hover:bg-slate-50 rounded-lg shadow-3xs hover:border-slate-350 transition-all cursor-pointer">
              <Settings className="w-4 h-4 text-slate-550" />
            </button>
            
            <div className="h-6 w-px bg-slate-250 mx-1"></div>
            
            <button 
              onClick={() => setIsDrawerOpen(true)}
              className="px-4 py-1.5 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs hover:shadow-blue-500/10 flex items-center gap-1 cursor-pointer transition-all"
            >
              创建关系类型 <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 选项卡 Tabs 区域：100% 遵照设计图排版 */}
      <div className="flex gap-1.5 mb-5 border-b border-slate-200/80 shrink-0">
        {[
          '模型总览', '对象模型', '关系模型', '能力绑定', '动作 (Action)', 
          '流程 (Workflow)', '权限策略', '版本与发布', '变更集'
        ].map((tab) => (
          <div 
            key={tab}
            onClick={() => {
              if (tab === '模型总览') onNavigate('overview');
              if (tab === '对象模型') onNavigate('object_model');
              if (tab === '关系模型') onNavigate('relation_model');
              if (tab === '能力绑定' || tab === '能力 (Function)') onNavigate('capability_binding');
              if (tab === '动作 (Action)') onNavigate('action_model');
              if (tab === '流程 (Workflow)') onNavigate('workflow_orchestration');
              if (tab === '版本与发布' || tab === '变更与发布' || tab === '变更集') onNavigate('change_release');
            }}
            className={`px-3 pb-2 text-[13px] font-bold cursor-pointer transition-colors relative ${
              tab === '关系模型' 
                ? 'text-blue-600 font-black border-b-[2.5px] border-blue-600 -mb-[1px]' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
        
        {/* 左栏：关系列表 */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col h-[800px]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-extrabold text-slate-900">Link Type 列表</h3>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="搜索关系类型"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 flex items-center justify-between cursor-pointer">
              全部血缘 <ChevronRight className="w-3.5 h-3.5 rotate-90 text-slate-400" />
            </div>
            <div className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 flex items-center justify-between cursor-pointer">
              全部可见性 <ChevronRight className="w-3.5 h-3.5 rotate-90 text-slate-400" />
            </div>
            <div className="w-10 h-[38px] flex items-center justify-center border border-slate-200 rounded-lg text-slate-500 cursor-pointer">
              <Menu className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-2 pt-2 flex-col overflow-y-auto pb-4">
            {localLinkTypes.filter(l => l.id.includes(searchTerm)).map((link, idx) => {
              const isActive = activeLinkId === link.id && idx === 2; // Hardcode has_assertion as active for visual match
              return (
                <div 
                  key={idx}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isActive 
                      ? 'bg-blue-50/80 border-blue-200' 
                      : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                  }`}
                  onClick={() => setActiveLinkId(link.id)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                       <LinkIcon className={`w-4 h-4 ${isActive ? 'text-blue-500' : 'text-slate-400'}`} />
                       <span className={`text-[14px] font-bold ${isActive ? 'text-blue-700' : 'text-slate-700'}`}>{link.id}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {link.isLineage ? (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">血缘</span>
                      ) : (
                         <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">非血缘</span>
                      )}
                      {link.isAiVisible && (
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">AI 可见</span>
                      )}
                    </div>
                  </div>
                  <div className="text-[12px] font-medium text-slate-500 flex items-center gap-1.5 pl-6">
                    {link.source} <span className="text-slate-300">→</span> {link.target}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-slate-500 text-[13px] font-medium shrink-0">
             <span>共 18 条</span>
             <div className="flex items-center gap-1">
               <ChevronRight className="w-4 h-4 rotate-180 cursor-not-allowed text-slate-300" />
               <div className="w-6 h-6 flex items-center justify-center bg-blue-50 text-blue-600 font-bold rounded">1</div>
               <div className="w-6 h-6 flex items-center justify-center hover:bg-slate-50 text-slate-600 font-bold rounded cursor-pointer">2</div>
               <ChevronRight className="w-4 h-4 cursor-pointer hover:text-slate-800" />
             </div>
          </div>
        </div>

        {/* 中栏：关系拓扑图 */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl shadow-sm relative h-[800px] overflow-hidden flex flex-col">
          <div className="absolute top-5 left-5 z-10 flex items-center gap-2 text-slate-900 font-extrabold text-base">
             关系模型图 <Info className="w-4 h-4 text-slate-400" />
          </div>
          
          <div className="absolute top-5 right-5 z-10 flex items-center gap-1 bg-white border border-slate-200 rounded-lg shadow-sm p-1">
             <div className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-50 cursor-pointer text-slate-600"><Expand className="w-4 h-4" /></div>
             <div className="w-px h-4 bg-slate-200 mx-0.5"></div>
             <div className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-50 cursor-pointer text-slate-600"><ZoomIn className="w-4 h-4" /></div>
             <div className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-50 cursor-pointer text-slate-600"><ZoomOut className="w-4 h-4" /></div>
             <div className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-50 cursor-pointer text-slate-600"><RotateCcw className="w-4 h-4" /></div>
          </div>

          {/* Map canvas background */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9IiNFMkU4RjAiLz48L3N2Zz4=')] opacity-[0.3]"></div>

          {/* Handcrafted precise structure matching the design */}
          <div className="flex-1 w-full relative">
            
            {/* SVG lines for connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
              {/* DataSource -> DataAsset (contains) */}
              <line x1="220" y1="120" x2="380" y2="120" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="3 3"/>
              <polygon points="380,120 374,116 374,124" fill="#3b82f6" />
              
              {/* DataAsset -> Field (contains) */}
              <line x1="450" y1="140" x2="450" y2="240" stroke="#3b82f6" strokeWidth="1.5"/>
              <polygon points="450,240 446,234 454,234" fill="#3b82f6" />

              {/* Field -> SemanticAssertion (has_assertion) */}
              <line x1="520" y1="260" x2="680" y2="260" stroke="#8b5cf6" strokeWidth="2"/>
              <polygon points="680,260 672,255 672,265" fill="#8b5cf6" />
              
              {/* Field -> DataQualityRule (checked_by) */}
              <path d="M 450 280 L 450 380" fill="none" stroke="#3b82f6" strokeWidth="1.5"/>
              <polygon points="450,380 446,374 454,374" fill="#3b82f6" />

              {/* DataQualityRule -> DataIssue (produces) */}
              <path d="M 450 420 L 450 520" fill="none" stroke="#3b82f6" strokeWidth="1.5"/>
              <polygon points="450,520 446,514 454,514" fill="#3b82f6" />

              {/* SemanticAssertion -> Evidence (supported_by) */}
              <path d="M 720 280 L 720 380" fill="none" stroke="#3b82f6" strokeWidth="1.5"/>
              <polygon points="720,380 716,374 724,374" fill="#3b82f6" />

                             {/* Snapshot -> SemanticAssertion (includes) */}
              <path d="M 460 620 L 820 620 L 820 260 L 780 260" fill="none" stroke="#3b82f6" strokeWidth="1.5"/>
              <polygon points="780,260 786,256 786,264" fill="#3b82f6" />

              {isDraftSaved && (
                <>
                  {/* Field -> DomainMapping (maps_to) */}
                  <line x1="380" y1="260" x2="250" y2="260" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 4" />
                  <polygon points="250,260 258,255 258,265" fill="#f59e0b" />
                </>
              )}

            </svg>

            {/* Path Labels */}
            <div className="absolute left-[270px] top-[100px] text-blue-500 font-bold text-[11px] bg-white px-1">contains</div>
            <div className="absolute left-[455px] top-[180px] text-blue-500 font-bold text-[11px] bg-white px-1">contains</div>
            <div className="absolute left-[560px] top-[244px] text-purple-600 font-bold text-[12px] bg-white px-2">has_assertion</div>
            <div className="absolute left-[390px] top-[320px] text-blue-500 font-bold text-[11px] bg-white px-1">checked_by</div>
            <div className="absolute left-[455px] top-[460px] text-blue-500 font-bold text-[11px] bg-white px-1">produces</div>
            <div className="absolute left-[725px] top-[320px] text-blue-500 font-bold text-[11px] bg-white px-1">supported_by</div>
            <div className="absolute left-[725px] top-[460px] text-blue-500 font-bold text-[11px] bg-white px-1">assigned_to</div>
            <div className="absolute left-[280px] top-[600px] text-blue-500 font-bold text-[11px] bg-white px-1">generates</div>
            <div className="absolute left-[600px] top-[600px] text-blue-500 font-bold text-[11px] bg-white px-1">includes</div>
            {isDraftSaved && (
              <div className="absolute left-[290px] top-[244px] text-amber-500 font-bold text-[12px] bg-white px-2">maps_to</div>
            )}
            

            {/* Nodes */}
            <div className="absolute left-[60px] top-[100px] w-40 bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex items-center gap-3 z-10">
               <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><Database className="w-5 h-5" /></div>
               <div>
                  <div className="text-[13px] font-bold text-slate-800 leading-tight">DataSource</div>
                  <div className="text-[11px] text-slate-500">数据源</div>
               </div>
            </div>

            <div className="absolute left-[380px] top-[100px] w-40 bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex items-center gap-3 z-10">
               <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><Box className="w-5 h-5" /></div>
               <div>
                  <div className="text-[13px] font-bold text-slate-800 leading-tight">DataAsset</div>
                  <div className="text-[11px] text-slate-500">数据资产</div>
               </div>
            </div>

            <div className="absolute left-[380px] top-[240px] w-36 bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex items-center gap-3 z-10">
               <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><FileText className="w-5 h-5" /></div>
               <div>
                  <div className="text-[13px] font-bold text-slate-800 leading-tight">Field</div>
                  <div className="text-[11px] text-slate-500">字段</div>
               </div>
            </div>

            <div className="absolute left-[630px] top-[240px] w-[150px] bg-purple-50/50 border-2 border-purple-200 rounded-xl p-3 shadow-sm flex items-center gap-3 z-20">
               <div className="p-1.5 bg-purple-100 text-purple-600 rounded-lg"><Shield className="w-5 h-5" /></div>
               <div>
                  <div className="text-[13px] font-bold text-purple-900 leading-tight">SemanticAssertion</div>
                  <div className="text-[10px] text-purple-600">语义断言</div>
               </div>
            </div>

            <div className="absolute left-[370px] top-[380px] w-40 bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex items-center gap-3 z-10">
               <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><CheckCircle2 className="w-5 h-5" /></div>
               <div>
                  <div className="text-[13px] font-bold text-slate-800 leading-tight">DataQualityRule</div>
                  <div className="text-[11px] text-slate-500">质量规则</div>
               </div>
            </div>

            <div className="absolute left-[650px] top-[380px] w-36 bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex items-center gap-3 z-10">
               <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><FileCode className="w-5 h-5" /></div>
               <div>
                  <div className="text-[13px] font-bold text-slate-800 leading-tight">Evidence</div>
                  <div className="text-[11px] text-slate-500">证据</div>
               </div>
            </div>

            <div className="absolute left-[370px] top-[520px] w-40 bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex items-center gap-3 z-10">
               <div className="p-1.5 bg-red-50 text-red-500 rounded-lg"><AlertTriangle className="w-5 h-5" /></div>
               <div>
                  <div className="text-[13px] font-bold text-slate-800 leading-tight">DataIssue</div>
                  <div className="text-[11px] text-slate-500">数据问题</div>
               </div>
            </div>

            <div className="absolute left-[640px] top-[520px] w-40 bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex items-center gap-3 z-10">
               <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><Target className="w-5 h-5" /></div>
               <div>
                  <div className="text-[13px] font-bold text-slate-800 leading-tight">GovernanceTask</div>
                  <div className="text-[11px] text-slate-500">治理任务</div>
               </div>
            </div>

            <div className="absolute left-[60px] top-[600px] w-36 bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex items-center gap-3 z-10">
               <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><Play className="w-5 h-5" /></div>
               <div>
                  <div className="text-[13px] font-bold text-slate-800 leading-tight">Run</div>
                  <div className="text-[11px] text-slate-500">运行记录</div>
               </div>
            </div>

            <div className="absolute left-[380px] top-[600px] w-36 bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex items-center gap-3 z-10">
               <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><Box className="w-5 h-5" /></div>
               <div>
                  <div className="text-[13px] font-bold text-slate-800 leading-tight">Snapshot</div>
                  <div className="text-[11px] text-slate-500">快照</div>
               </div>
            </div>

            {isDraftSaved && (
              <div className="absolute left-[100px] top-[240px] w-36 bg-amber-50/50 border-2 border-amber-200 border-dashed rounded-xl p-3 shadow-sm flex items-center gap-3 z-10">
                 <div className="p-1.5 bg-amber-100 text-amber-600 rounded-lg"><MapIcon className="w-5 h-5" /></div>
                 <div>
                    <div className="text-[13px] font-bold text-amber-900 leading-tight">DomainMapping</div>
                    <div className="text-[10px] text-amber-700 font-medium">领域映射 (未发布)</div>
                 </div>
              </div>
            )}

          </div>

          <div className="absolute bottom-5 right-5 w-32 h-24 bg-white border border-slate-200 shadow-lg rounded-xl overflow-hidden opacity-90 p-1 flex justify-center items-center">
            {/* minimap abstraction */}
            <div className="relative w-full h-full scale-[0.6]">
              <div className="w-4 h-2 absolute top-2 left-2 bg-slate-200 rounded"></div>
              <div className="w-4 h-2 absolute top-2 left-10 bg-slate-200 rounded"></div>
              <div className="w-4 h-2 absolute top-8 left-10 bg-slate-200 rounded"></div>
              <div className="w-6 h-2 absolute top-8 left-18 bg-blue-200 border border-blue-400 rounded"></div>
              <div className="w-4 h-2 absolute top-14 left-8 bg-slate-200 rounded"></div>
              <div className="w-4 h-2 absolute top-14 left-18 bg-slate-200 rounded"></div>
              <div className="w-4 h-2 absolute top-20 left-8 bg-slate-200 rounded"></div>
              <div className="w-4 h-2 absolute top-20 left-18 bg-slate-200 rounded"></div>
              <div className="w-4 h-2 absolute top-26 left-2 bg-slate-200 rounded"></div>
              <div className="w-4 h-2 absolute top-26 left-10 bg-slate-200 rounded"></div>

              <svg className="absolute inset-0 w-full h-full">
                <line x1="8" y1="2" x2="38" y2="2" stroke="#cbd5e1" strokeWidth="1"/>
                <line x1="48" y1="12" x2="48" y2="30" stroke="#cbd5e1" strokeWidth="1"/>
                <line x1="56" y1="36" x2="68" y2="36" stroke="#60a5fa" strokeWidth="1"/>
              </svg>

              <div className="absolute border border-blue-400 border-dashed w-32 h-26 top-0 left-0"></div>
            </div>
          </div>
        </div>

        {/* 右栏：关系详情面板 */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col h-[800px] overflow-y-auto">
          
          <div className="flex items-center justify-between mb-6">
             <h3 className="text-base font-extrabold text-slate-900">关系详情</h3>
             <button className="flex items-center gap-1.5 text-[13px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-100">
               <Edit className="w-3.5 h-3.5" /> 编辑
             </button>
          </div>
          
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex flex-col items-center justify-center text-blue-600 shrink-0">
               <LinkIcon className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-bold text-slate-900">has_assertion</span>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">已发布</span>
            </div>
          </div>

          <div className="space-y-4 text-[13px]">
            <div className="flex">
              <span className="w-24 text-slate-500 shrink-0">中文名</span>
              <span className="font-bold text-slate-800">拥有语义断言</span>
            </div>
            <div className="flex items-center">
              <span className="w-24 text-slate-500 shrink-0">源对象</span>
              <span className="text-[12px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 font-mono">Field</span>
              <span className="text-slate-500 ml-2 text-xs">字段</span>
            </div>
            <div className="flex items-center">
              <span className="w-24 text-slate-500 shrink-0">目标对象</span>
              <span className="text-[12px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100 font-mono">SemanticAssertion</span>
              <span className="text-slate-500 ml-2 text-xs">语义断言</span>
            </div>
            <div className="flex">
              <span className="w-24 text-slate-500 shrink-0">方向</span>
              <span className="font-mono text-slate-700 font-medium">Field → SemanticAssertion</span>
            </div>
            <div className="flex">
              <span className="w-24 text-slate-500 shrink-0">基数</span>
              <span className="font-mono font-bold text-slate-800">1 : N</span>
            </div>
            <div className="flex items-center">
              <span className="w-24 text-slate-500 shrink-0">参与血缘</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-1.5" /> <span className="text-slate-800 font-medium">是</span>
            </div>
            <div className="flex items-center">
              <span className="w-24 text-slate-500 shrink-0">AI 可见</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-1.5" /> <span className="text-slate-800 font-medium">是</span>
            </div>
            <div className="flex items-center">
              <span className="w-24 text-slate-500 shrink-0">权限控制</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-1.5" /> <span className="text-slate-800 font-medium">是</span>
            </div>
            <div className="flex flex-col gap-1.5 pt-2">
              <span className="text-slate-500 shrink-0">描述</span>
              <span className="text-slate-700 leading-relaxed font-medium">字段拥有一个或多个语义断言，用于承载语义识别结果。</span>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <h4 className="text-sm font-extrabold text-slate-900 mb-4">约束配置</h4>
            <div className="space-y-3.5 text-[13px]">
               <div className="flex items-center">
                 <span className="w-24 text-slate-500 shrink-0 flex items-center gap-1">唯一性 <Info className="w-3.5 h-3.5 text-slate-300" /></span>
                 <span className="text-slate-800 font-medium">可重复</span>
               </div>
               <div className="flex items-center">
                 <span className="w-24 text-slate-500 shrink-0 flex items-center gap-1">必填性 <Info className="w-3.5 h-3.5 text-slate-300" /></span>
                 <span className="text-slate-800 font-medium">非必填</span>
               </div>
               <div className="flex items-center">
                 <span className="w-24 text-slate-500 shrink-0 flex items-center gap-1">方向性 <Info className="w-3.5 h-3.5 text-slate-300" /></span>
                 <div className="flex items-center gap-2">
                    <span className="text-slate-800 font-medium">单向</span>
                    <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">Field → SemanticAssertion</span>
                 </div>
               </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <h4 className="text-sm font-extrabold text-slate-900 mb-4">使用位置</h4>
            <div className="space-y-4 text-[13px]">
               <div className="flex items-center justify-between">
                 <span className="text-slate-800 font-extrabold flex items-center gap-1">知识网络 <Info className="w-3.5 h-3.5 text-slate-300" /></span>
                 <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> <span className="text-slate-600 font-medium">已使用</span></div>
               </div>
               <div className="flex items-center justify-between">
                 <span className="text-slate-800 font-extrabold flex items-center gap-1">AI 工作台 <Info className="w-3.5 h-3.5 text-slate-300" /></span>
                 <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> <span className="text-slate-600 font-medium">已使用</span></div>
               </div>
               <div className="flex items-center justify-between">
                 <span className="text-slate-800 font-extrabold">Workflow</span>
                 <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> <span className="text-slate-600 font-medium">已使用</span></div>
               </div>
            </div>
            
            <div className="flex items-center justify-between gap-3 mt-8 pt-4">
              <button className="flex-1 py-2 bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 font-bold text-[13px] rounded-lg transition-colors cursor-pointer text-center">查看关系影响</button>
              <button className="flex-1 py-2 bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 font-bold text-[13px] rounded-lg transition-colors cursor-pointer text-center">查看使用实例</button>
              <button className="flex-1 py-2 bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 font-bold text-[13px] rounded-lg transition-colors cursor-pointer text-center">查看变更历史</button>
            </div>
          </div>
        </div>
      </div>

      {isDrawerOpen && (
        <>
          <div 
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40"
            onClick={() => setIsDrawerOpen(false)}
          ></div>
          <CreateLinkTypeDrawer 
            onClose={() => setIsDrawerOpen(false)} 
            onSave={() => {
              setIsDraftSaved(true);
              setIsDrawerOpen(false);
            }} 
          />
        </>
      )}
    </div>
  );
}
