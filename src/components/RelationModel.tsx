import React, { useState, useEffect } from 'react';
import { LinkType } from '../types';
import {
  Database, Box, FileText, Shield, ClipboardCopy,
  Layers, AlertTriangle, Target, Play, FileCode, CheckCircle2,
  ChevronRight, Search, Settings, Star, GitMerge, Link as LinkIcon, FunctionSquare, Plus, Edit, Download, Check, Map as MapIcon, Menu, ArrowRight, Expand, ZoomIn, ZoomOut, RotateCcw, AlertCircle, Info,
  RefreshCw, ChevronDown, X
} from 'lucide-react';
import CreateLinkTypeDrawer from './CreateLinkTypeDrawer';
import {useLinkTypes, useReplaceLinkTypes} from '../hooks/useOntology';
import {useUiStore} from '../store/uiStore';
import {PageHeader} from './ui/PageHeader';
import {DknPageHeader} from './ui/DknPageHeader';

/**
 * Batch 2 只读声明：关系与约束的编辑保存将在 Batch 3 接入 ChangeSet
 * operations（服务端持有精确双端基数/分类，旧 LinkType 形状无法无损往返）。
 * 在此之前所有写入口（编辑 / 保存 / 新建）禁用，不产生任何写入。
 */
const BATCH3_READONLY_NOTE = '关系编辑将在 Batch 3 接入 ChangeSet operations，当前只读';

export default function RelationModel() {
  const {data: linkTypes = []} = useLinkTypes();
  const replaceLinkTypesMutation = useReplaceLinkTypes();
  const navigate = useUiStore((s) => s.navigate);
  const isEditingActive = !useUiStore((s) => s.isLocked);
  const modelType = useUiStore((s) => s.modelType);

  // Current active chosen Link Type
  const [activeLinkId, setActiveLinkId] = useState<string>('has_assertion');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters dropdown state
  const [lineageFilter, setLineageFilter] = useState<'all' | 'lineage' | 'non-lineage'>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'ai-visible' | 'ai-hidden'>('all');
  const [activeDropdown, setActiveDropdown] = useState<'none' | 'lineage' | 'visibility'>('none');

  // Zoom and fullscreen state
  const [zoomScale, setZoomScale] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Form states for editing relation details
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editNameCn, setEditNameCn] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCardinality, setEditCardinality] = useState<'1:1' | '1:N' | 'N:M'>('1:N');
  const [editIsLineage, setEditIsLineage] = useState(false);
  const [editIsAiVisible, setEditIsAiVisible] = useState(false);
  const [editRequiresAuth, setEditRequiresAuth] = useState(false);

  // Fallback to activeLink data if not in props
  const activeLink = linkTypes.find(l => l.id === activeLinkId) || {
    id: 'has_assertion',
    nameCn: '拥有语义断言',
    sourceObjId: 'Field',
    targetObjId: 'SemanticAssertion',
    direction: 'Field → SemanticAssertion',
    cardinality: '1:N' as const,
    isLineage: true,
    isAiVisible: true,
    requiresAuth: true,
    description: '字段拥有一个或多个语义断言，用于承载语义识别结果。'
  };

  useEffect(() => {
    setIsEditingDetails(false);
  }, [activeLinkId]);

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (activeDropdown !== 'none') {
        const target = e.target as HTMLElement;
        if (!target.closest('.dropdown-container')) {
          setActiveDropdown('none');
        }
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [activeDropdown]);

  // Handle Escape key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const startEditing = () => {
    setEditNameCn(activeLink.nameCn);
    setEditDescription(activeLink.description || '');
    setEditCardinality(activeLink.cardinality);
    setEditIsLineage(activeLink.isLineage);
    setEditIsAiVisible(activeLink.isAiVisible);
    setEditRequiresAuth(activeLink.requiresAuth);
    setIsEditingDetails(true);
  };

  const handleCancelDetails = () => {
    setIsEditingDetails(false);
  };

  const handleSaveDetails = () => {
    if (!editNameCn.trim()) {
      alert('❌ 请输入合法的中文名！');
      return;
    }
    const updatedLink: LinkType = {
      ...activeLink,
      nameCn: editNameCn.trim(),
      description: editDescription.trim(),
      cardinality: editCardinality,
      isLineage: editIsLineage,
      isAiVisible: editIsAiVisible,
      requiresAuth: editRequiresAuth,
    };
    const nextLinkTypes = linkTypes.map(l => l.id === activeLinkId ? updatedLink : l);
    replaceLinkTypesMutation.mutate(nextLinkTypes, {
      onSuccess: () => {
        triggerToast(`✨ 成功更新关系类型「${activeLinkId}」的详细配置！`);
        setIsEditingDetails(false);
      },
      onError: (err) => {
        alert(`❌ 更新失败: ${err instanceof Error ? err.message : String(err)}`);
      }
    });
  };

  const selectLink = (id: string) => {
    setActiveLinkId(id);
    setIsRightSidebarOpen(true);
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

  const filteredLinks = linkTypes.filter(l => {
    const matchesSearch = l.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          l.nameCn.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLineage = lineageFilter === 'all' || 
                           (lineageFilter === 'lineage' && l.isLineage) || 
                           (lineageFilter === 'non-lineage' && !l.isLineage);
    const matchesVisibility = visibilityFilter === 'all' || 
                              (visibilityFilter === 'ai-visible' && l.isAiVisible) || 
                              (visibilityFilter === 'ai-hidden' && !l.isAiVisible);
    return matchesSearch && matchesLineage && matchesVisibility;
  });

  return (
    <div className="min-h-full font-sans bg-transparent" id="relation-workspace">
      
      {/* Dynamic Action Toast Notifications */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-905 border border-slate-700 text-white rounded-md px-5 py-3 shadow-lg flex items-center gap-3 max-w-md animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <div className="text-left flex-1 min-w-0">
            <p className="text-xs font-extrabold text-slate-205 font-sans">系统数据变更成功</p>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5 leading-relaxed truncate font-sans">{toastMessage}</p>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-500 hover:text-slate-300 transition-colors ml-2 shrink-0 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 顶部 Header */}
      {modelType === 'DKN' ? (
        <DknPageHeader />
      ) : (
        <PageHeader
          breadcrumbs={[
            {label: '管理中心', onClick: () => navigate('overview')},
            {label: '本体管理'},
            {label: 'DRKN 本体模型管理'},
            {label: '关系模型'},
          ]}
          topRight={
            <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-150 px-3 py-1 rounded-full shadow-2xs">
               <span className="text-[10px] font-bold text-rose-500">当前变更集</span>
               <span className="text-[11px] font-black text-rose-700 font-mono">CS-2026-012</span>
               <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
               <span className="text-[10px] font-extrabold text-[#9a3412] bg-amber-100 px-1 py-0.2 rounded leading-none">Editing</span>
            </div>
          }
          titleRow={
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                 <div className="flex items-center gap-3">
                    <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                      <span>DRKN-Core 数据语义治理模型</span>
                    </h1>
                    <span className="px-2 py-0.5 rounded text-[11px] font-extrabold bg-blue-50 text-blue-600 border border-blue-200 shadow-3xs leading-none">已发布</span>
                 </div>
                 <div className="flex items-center gap-4 text-[11px] text-slate-450 font-medium">
                    <span className="flex items-center gap-1"><span className="font-bold text-slate-655">当前版本:</span> <span className="text-blue-600 font-mono font-black text-[12px]">v1.3.0</span></span>
                    <span className="text-slate-200">|</span>
                    <span className="flex items-center gap-1"><span className="font-bold text-slate-655">发布于:</span> 2026-08-20 10:30:00</span>
                    <span className="text-slate-200">|</span>
                    <span className="flex items-center gap-1"><span className="font-bold text-slate-655">发布人:</span> 系统管理员</span>
                 </div>
              </div>

              {/* 右侧操作交互栏 */}
              <div className="flex items-center gap-2">
                <button className="px-3.5 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200/50 hover:bg-slate-50/50 hover:text-slate-800 rounded-lg shadow-3xs hover:border-slate-300/80 hover:shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer">
                  <RefreshCw className="w-3.5 h-3.5 text-slate-400" /> 版本对比
                </button>
                <button className="px-3.5 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200/50 hover:bg-slate-50/50 hover:text-slate-800 rounded-lg shadow-3xs hover:border-slate-300/80 hover:shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer">
                  <Download className="w-3.5 h-3.5 text-slate-400" /> 导出模型
                </button>
                <button className="p-1.5 bg-white border border-slate-200/50 hover:bg-slate-50/50 rounded-lg shadow-3xs hover:border-slate-300/80 hover:shadow-2xs transition-all cursor-pointer">
                  <Settings className="w-4 h-4 text-slate-400" />
                </button>

                <div className="h-6 w-px bg-slate-200/60 mx-1"></div>

                <button
                  onClick={() => setIsDrawerOpen(true)}
                  disabled
                  title={BATCH3_READONLY_NOTE}
                  className="px-4 py-1.5 text-xs font-black text-white bg-slate-300 rounded-lg shadow-xs flex items-center gap-1 cursor-not-allowed"
                >
                  创建关系类型（Batch 3 接线） <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          }
        />
      )}

      {/* 选项卡 Tabs 区域：100% 遵照设计图排版 */}
      {modelType === 'DKN' ? (
        <div className="bg-white rounded-lg border border-slate-200 p-1 shadow-3xs flex items-center justify-between flex-wrap gap-1 mb-5 shrink-0">
          <div className="flex items-center space-x-1 overflow-x-auto scrollbar-none py-0.5 px-1 max-w-full">
            {[
              '模型总览', '对象模型', '关系模型', '函数', '动作', '流程', '权限策略', '发布'
            ].map((tab) => {
              const isActive = tab === '关系模型';
              return (
                <button
                  key={tab}
                  onClick={() => {
                    const targetViewMap: Record<string, string> = {
                      '模型总览': 'dkn_overview',
                      '对象模型': 'dkn_object_model',
                      '关系模型': 'relation_model',
                      '函数': 'capability_binding',
                      '动作': 'action_model',
                      '流程': 'workflow_orchestration',
                      '发布': 'change_release',
                    };
                    const view = targetViewMap[tab];
                    if (view) navigate(view);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all whitespace-nowrap ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-2xs' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  {tab === '模型总览' ? '📊 模型总览' : tab}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2 pr-2">
            <button
              onClick={() => setIsDrawerOpen(true)}
              disabled
              title={BATCH3_READONLY_NOTE}
              className="px-4 py-1.5 text-xs font-black text-white bg-slate-300 rounded-lg shadow-xs flex items-center gap-1 cursor-not-allowed"
            >
              创建关系类型（Batch 3 接线） <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-mono font-bold text-slate-400">Sandbox.Active</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between mb-5 border-b border-slate-200/80 shrink-0">
          <div className="flex gap-1.5">
            {[
              '模型总览', '对象模型', '关系模型', '函数（Function）', '动作 (Action)', 
              '流程 (Workflow)', '权限策略', '变更与发布'
            ].map((tab) => (
              <div 
                key={tab}
                onClick={() => {
                  const targetViewMap: Record<string, string> = {
                    '模型总览': 'overview',
                    '对象模型': 'object_model',
                    '关系模型': 'relation_model',
                    '能力绑定': 'capability_binding',
                    '能力 (Function)': 'capability_binding',
                    '函数（Function）': 'capability_binding',
                    '动作 (Action)': 'action_model',
                    '流程 (Workflow)': 'workflow_orchestration',
                    '变更与发布': 'change_release',
                  };
                  const view = targetViewMap[tab];
                  if (view) navigate(view);
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
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
        
        {/* 左栏：关系列表 */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4 flex flex-col h-[800px]">
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

          <div className="flex items-center gap-2 shrink-0 relative dropdown-container">
            {/* lineage filter */}
            <div className="relative flex-1">
              <button 
                onClick={() => setActiveDropdown(activeDropdown === 'lineage' ? 'none' : 'lineage')}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 flex items-center justify-between cursor-pointer focus:outline-none"
              >
                <span>
                  {lineageFilter === 'all' ? '全部血缘' : 
                   lineageFilter === 'lineage' ? '仅血缘关系' : '仅非血缘'}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${activeDropdown === 'lineage' ? 'rotate-180' : 'rotate-0'}`} />
              </button>
              
              {activeDropdown === 'lineage' && (
                <div className="absolute left-0 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg py-1.5 z-50 text-xs">
                  {[
                    { value: 'all', label: '全部血缘' },
                    { value: 'lineage', label: '仅血缘关系' },
                    { value: 'non-lineage', label: '仅非血缘' }
                  ].map(opt => (
                    <div 
                      key={opt.value}
                      onClick={() => {
                        setLineageFilter(opt.value as any);
                        setActiveDropdown('none');
                      }}
                      className={`px-3 py-1.5 hover:bg-slate-50 cursor-pointer font-semibold text-left ${lineageFilter === opt.value ? 'text-blue-600 bg-blue-50/45' : 'text-slate-600'}`}
                    >
                      {opt.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* visibility filter */}
            <div className="relative flex-1">
              <button 
                onClick={() => setActiveDropdown(activeDropdown === 'visibility' ? 'none' : 'visibility')}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 flex items-center justify-between cursor-pointer focus:outline-none"
              >
                <span>
                  {visibilityFilter === 'all' ? '全部可见性' : 
                   visibilityFilter === 'ai-visible' ? '仅 AI 可见' : '仅 AI 隐藏'}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-450 transition-transform duration-200 ${activeDropdown === 'visibility' ? 'rotate-180' : 'rotate-0'}`} />
              </button>

              {activeDropdown === 'visibility' && (
                <div className="absolute right-0 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg py-1.5 z-50 text-xs">
                  {[
                    { value: 'all', label: '全部可见性' },
                    { value: 'ai-visible', label: '仅 AI 可见' },
                    { value: 'ai-hidden', label: '仅 AI 隐藏' }
                  ].map(opt => (
                    <div 
                      key={opt.value}
                      onClick={() => {
                        setVisibilityFilter(opt.value as any);
                        setActiveDropdown('none');
                      }}
                      className={`px-3 py-1.5 hover:bg-slate-50 cursor-pointer font-semibold text-left ${visibilityFilter === opt.value ? 'text-blue-600 bg-blue-50/45' : 'text-slate-600'}`}
                    >
                      {opt.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="w-10 h-[38px] flex items-center justify-center border border-slate-200 rounded-lg text-slate-500 cursor-pointer hover:bg-slate-50 transition-colors">
              <Menu className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-2 pt-2 flex-col overflow-y-auto pb-4">
            {filteredLinks.map((link) => {
              const isActive = activeLinkId === link.id;
              return (
                <div 
                  key={link.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isActive 
                      ? 'bg-blue-50/80 border-blue-200' 
                      : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                  }`}
                  onClick={() => selectLink(link.id)}
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
                    {link.sourceObjId} <span className="text-slate-300">→</span> {link.targetObjId}
                  </div>
                  {link.nameCn && (
                    <div className="text-[11px] text-slate-400 pl-6 mt-0.5 font-medium truncate">
                      {link.nameCn}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-slate-500 text-[13px] font-medium shrink-0">
             <span>共 {filteredLinks.length} 条</span>
             <div className="flex items-center gap-1">
               <ChevronRight className="w-4 h-4 rotate-180 cursor-not-allowed text-slate-300" />
               <div className="w-6 h-6 flex items-center justify-center bg-blue-50 text-blue-600 font-bold rounded">1</div>
               <ChevronRight className="w-4 h-4 cursor-pointer hover:text-slate-800" />
             </div>
          </div>
        </div>

        {/* 中栏：关系拓扑图 */}
        {isFullscreen && (
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 transition-opacity duration-300"
            onClick={() => setIsFullscreen(false)}
          />
        )}
        <div className={isFullscreen 
          ? 'fixed inset-4 z-50 bg-white border border-slate-300 shadow-2xl rounded-xl overflow-hidden flex flex-col animate-fade-in' 
          : `bg-white border border-slate-200 rounded-lg shadow-sm relative h-[800px] overflow-hidden flex flex-col transition-all duration-300 ${isRightSidebarOpen ? 'lg:col-span-6' : 'lg:col-span-9'}`
        }>
          <div className="absolute top-5 left-5 z-10 flex items-center gap-2 text-slate-900 font-extrabold text-base">
             关系模型图 <Info className="w-4 h-4 text-slate-400" />
             {isFullscreen && (
               <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                 全屏模式 ({Math.round(zoomScale * 100)}%)
               </span>
             )}
          </div>
          
          <div className="absolute top-5 right-5 z-10 flex items-center gap-1 bg-white border border-slate-200 rounded-lg shadow-sm p-1">
             {!isFullscreen && (
               <>
                 <button
                   onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
                   className="h-8 px-2.5 flex items-center justify-center rounded hover:bg-slate-50 cursor-pointer text-slate-600 text-[11px] font-bold gap-1 transition-all"
                 >
                   {isRightSidebarOpen ? "收起右栏" : "展开右栏"}
                 </button>
                 <div className="w-px h-4 bg-slate-200 mx-0.5"></div>
               </>
             )}
             <button
               onClick={() => setIsFullscreen(!isFullscreen)}
               className={`h-8 px-2 flex items-center justify-center rounded hover:bg-slate-50 cursor-pointer text-slate-655 text-[11px] font-bold gap-1 transition-all`}
               title={isFullscreen ? "退出全屏" : "全屏查看"}
             >
               <Expand className="w-3.5 h-3.5" />
               {isFullscreen && "退出全屏"}
             </button>
             <div className="w-px h-4 bg-slate-200 mx-0.5"></div>
             <button 
               onClick={() => setZoomScale(s => Math.min(s + 0.1, 1.8))}
               className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-50 cursor-pointer text-slate-600 hover:text-blue-600 transition-colors"
               title="放大"
             >
               <ZoomIn className="w-4 h-4" />
             </button>
             <button 
               onClick={() => setZoomScale(s => Math.max(s - 0.1, 0.6))}
               className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-50 cursor-pointer text-slate-600 hover:text-blue-600 transition-colors"
               title="缩小"
             >
               <ZoomOut className="w-4 h-4" />
             </button>
             <button 
               onClick={() => setZoomScale(1.0)}
               className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-50 cursor-pointer text-slate-600 hover:text-blue-600 transition-colors"
               title="重置缩放"
             >
               <RotateCcw className="w-4 h-4" />
             </button>
          </div>

          {/* Map canvas background */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9IiNFMkU4RjAiLz48L3N2Zz4=')] opacity-[0.3]"></div>

          {/* Handcrafted precise structure matching the design */}
          <div className="flex-1 w-full relative overflow-hidden flex items-center justify-center bg-slate-50/10">
            {/* Zoomable Canvas Content Wrapper */}
            <div 
              className="relative w-[920px] h-[700px] shrink-0 transition-transform duration-200 ease-out origin-center"
              style={{ transform: `scale(${zoomScale})` }}
            >
            
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
            <div 
              onClick={() => selectLink('contains_ds_da')}
              className={`absolute left-[270px] top-[100px] font-bold text-[11px] bg-white px-2 py-0.5 rounded border transition-all cursor-pointer select-none z-30 ${
                activeLinkId === 'contains_ds_da' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm scale-105' 
                  : 'text-blue-500 border-slate-200 hover:border-blue-400 hover:bg-blue-50/50'
              }`}
            >
              contains
            </div>
            <div 
              onClick={() => selectLink('contains_da_fi')}
              className={`absolute left-[455px] top-[180px] font-bold text-[11px] bg-white px-2 py-0.5 rounded border transition-all cursor-pointer select-none z-30 ${
                activeLinkId === 'contains_da_fi' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm scale-105' 
                  : 'text-blue-500 border-slate-200 hover:border-blue-400 hover:bg-blue-50/50'
              }`}
            >
              contains
            </div>
            <div 
              onClick={() => selectLink('has_assertion')}
              className={`absolute left-[560px] top-[244px] font-bold text-[12px] bg-white px-2 py-0.5 rounded border transition-all cursor-pointer select-none z-30 ${
                activeLinkId === 'has_assertion' 
                  ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-sm scale-105' 
                  : 'text-purple-600 border-slate-200 hover:border-purple-400 hover:bg-purple-50/50'
              }`}
            >
              has_assertion
            </div>
            <div 
              onClick={() => selectLink('checked_by')}
              className={`absolute left-[390px] top-[320px] font-bold text-[11px] bg-white px-2 py-0.5 rounded border transition-all cursor-pointer select-none z-30 ${
                activeLinkId === 'checked_by' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm scale-105' 
                  : 'text-blue-500 border-slate-200 hover:border-blue-400 hover:bg-blue-50/50'
              }`}
            >
              checked_by
            </div>
            <div 
              onClick={() => selectLink('produces')}
              className={`absolute left-[455px] top-[460px] font-bold text-[11px] bg-white px-2 py-0.5 rounded border transition-all cursor-pointer select-none z-30 ${
                activeLinkId === 'produces' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm scale-105' 
                  : 'text-blue-500 border-slate-200 hover:border-blue-400 hover:bg-blue-50/50'
              }`}
            >
              produces
            </div>
            <div 
              onClick={() => selectLink('supported_by')}
              className={`absolute left-[725px] top-[320px] font-bold text-[11px] bg-white px-2 py-0.5 rounded border transition-all cursor-pointer select-none z-30 ${
                activeLinkId === 'supported_by' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm scale-105' 
                  : 'text-blue-500 border-slate-200 hover:border-blue-400 hover:bg-blue-50/50'
              }`}
            >
              supported_by
            </div>
            <div 
              onClick={() => selectLink('assigned_to')}
              className={`absolute left-[725px] top-[460px] font-bold text-[11px] bg-white px-2 py-0.5 rounded border transition-all cursor-pointer select-none z-30 ${
                activeLinkId === 'assigned_to' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm scale-105' 
                  : 'text-blue-500 border-slate-200 hover:border-blue-400 hover:bg-blue-50/50'
              }`}
            >
              assigned_to
            </div>
            <div 
              className="absolute left-[280px] top-[600px] text-slate-400 font-bold text-[11px] bg-white px-2 py-0.5 rounded border border-transparent select-none z-30"
              title="暂无对应 Link Type 定义"
            >
              generates
            </div>
            <div 
              onClick={() => selectLink('includes_version')}
              className={`absolute left-[600px] top-[600px] font-bold text-[11px] bg-white px-2 py-0.5 rounded border transition-all cursor-pointer select-none z-30 ${
                activeLinkId === 'includes_version' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm scale-105' 
                  : 'text-blue-500 border-slate-200 hover:border-blue-400 hover:bg-blue-50/50'
              }`}
            >
              includes
            </div>
            {isDraftSaved && (
              <div 
                onClick={() => selectLink('maps_to')}
                className={`absolute left-[290px] top-[244px] text-amber-500 font-bold text-[12px] bg-white px-2 py-0.5 rounded border border-dashed transition-all cursor-pointer select-none z-30 ${
                  activeLinkId === 'maps_to' 
                    ? 'border-amber-500 bg-amber-50 text-amber-800 shadow-sm scale-105' 
                    : 'border-slate-200 hover:border-amber-400 hover:bg-amber-50/50'
                }`}
              >
                maps_to
              </div>
            )}
            

            {/* Nodes */}
            <div className="absolute left-[60px] top-[100px] w-40 bg-white border border-slate-200 rounded-lg p-3 shadow-sm flex items-center gap-3 z-10">
               <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><Database className="w-5 h-5" /></div>
               <div>
                  <div className="text-[13px] font-bold text-slate-800 leading-tight">DataSource</div>
                  <div className="text-[11px] text-slate-500">数据源</div>
               </div>
            </div>

            <div className="absolute left-[380px] top-[100px] w-40 bg-white border border-slate-200 rounded-lg p-3 shadow-sm flex items-center gap-3 z-10">
               <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><Box className="w-5 h-5" /></div>
               <div>
                  <div className="text-[13px] font-bold text-slate-800 leading-tight">DataAsset</div>
                  <div className="text-[11px] text-slate-500">数据资产</div>
               </div>
            </div>

            <div className="absolute left-[380px] top-[240px] w-36 bg-white border border-slate-200 rounded-lg p-3 shadow-sm flex items-center gap-3 z-10">
               <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><FileText className="w-5 h-5" /></div>
               <div>
                  <div className="text-[13px] font-bold text-slate-800 leading-tight">Field</div>
                  <div className="text-[11px] text-slate-500">字段</div>
               </div>
            </div>

            <div className="absolute left-[630px] top-[240px] w-[150px] bg-purple-50/50 border-2 border-purple-200 rounded-lg p-3 shadow-sm flex items-center gap-3 z-20">
               <div className="p-1.5 bg-purple-100 text-purple-600 rounded-lg"><Shield className="w-5 h-5" /></div>
               <div>
                  <div className="text-[13px] font-bold text-purple-900 leading-tight">SemanticAssertion</div>
                  <div className="text-[10px] text-purple-600">语义断言</div>
               </div>
            </div>

            <div className="absolute left-[370px] top-[380px] w-40 bg-white border border-slate-200 rounded-lg p-3 shadow-sm flex items-center gap-3 z-10">
               <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><CheckCircle2 className="w-5 h-5" /></div>
               <div>
                  <div className="text-[13px] font-bold text-slate-800 leading-tight">DataQualityRule</div>
                  <div className="text-[11px] text-slate-500">质量规则</div>
               </div>
            </div>

            <div className="absolute left-[650px] top-[380px] w-36 bg-white border border-slate-200 rounded-lg p-3 shadow-sm flex items-center gap-3 z-10">
               <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><FileCode className="w-5 h-5" /></div>
               <div>
                  <div className="text-[13px] font-bold text-slate-800 leading-tight">Evidence</div>
                  <div className="text-[11px] text-slate-500">证据</div>
               </div>
            </div>

            <div className="absolute left-[370px] top-[520px] w-40 bg-white border border-slate-200 rounded-lg p-3 shadow-sm flex items-center gap-3 z-10">
               <div className="p-1.5 bg-red-50 text-red-500 rounded-lg"><AlertTriangle className="w-5 h-5" /></div>
               <div>
                  <div className="text-[13px] font-bold text-slate-800 leading-tight">DataIssue</div>
                  <div className="text-[11px] text-slate-500">数据问题</div>
               </div>
            </div>

            <div className="absolute left-[640px] top-[520px] w-40 bg-white border border-slate-200 rounded-lg p-3 shadow-sm flex items-center gap-3 z-10">
               <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><Target className="w-5 h-5" /></div>
               <div>
                  <div className="text-[13px] font-bold text-slate-800 leading-tight">GovernanceTask</div>
                  <div className="text-[11px] text-slate-500">治理任务</div>
               </div>
            </div>

            <div className="absolute left-[60px] top-[600px] w-36 bg-white border border-slate-200 rounded-lg p-3 shadow-sm flex items-center gap-3 z-10">
               <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><Play className="w-5 h-5" /></div>
               <div>
                  <div className="text-[13px] font-bold text-slate-800 leading-tight">Run</div>
                  <div className="text-[11px] text-slate-500">运行记录</div>
               </div>
            </div>

            <div className="absolute left-[380px] top-[600px] w-36 bg-white border border-slate-200 rounded-lg p-3 shadow-sm flex items-center gap-3 z-10">
               <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><Box className="w-5 h-5" /></div>
               <div>
                  <div className="text-[13px] font-bold text-slate-800 leading-tight">Snapshot</div>
                  <div className="text-[11px] text-slate-500">快照</div>
               </div>
            </div>

            {isDraftSaved && (
              <div className="absolute left-[100px] top-[240px] w-36 bg-amber-50/50 border-2 border-amber-200 border-dashed rounded-lg p-3 shadow-sm flex items-center gap-3 z-10">
                 <div className="p-1.5 bg-amber-100 text-amber-600 rounded-lg"><MapIcon className="w-5 h-5" /></div>
                 <div>
                    <div className="text-[13px] font-bold text-amber-900 leading-tight">DomainMapping</div>
                    <div className="text-[10px] text-amber-700 font-medium">领域映射 (未发布)</div>
                 </div>
              </div>
            )}

            </div>

            {/* Minimap - kept outside zoom wrapper so it remains constant size */}
            <div className="absolute bottom-5 right-5 w-32 h-24 bg-white border border-slate-200 shadow-lg rounded-lg overflow-hidden opacity-90 p-1 flex justify-center items-center z-30">
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
        </div>

        {/* 右栏：关系详情面板 */}
        {isRightSidebarOpen && (
          <div className="lg:col-span-3 bg-white border border-slate-200 rounded-lg shadow-sm p-6 flex flex-col h-[800px] overflow-y-auto space-y-6 animate-fade-in animate-duration-200 scrollbar-none">
          
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
               <h3 className="text-base font-extrabold text-slate-900">{isEditingDetails ? "编辑关系" : "关系详情"}</h3>
               {!isEditingDetails && (
                 <button
                   onClick={startEditing}
                   disabled
                   title={BATCH3_READONLY_NOTE}
                   className="flex items-center gap-1.5 text-[12px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 cursor-not-allowed"
                 >
                   <Edit className="w-3.5 h-3.5" /> 编辑（Batch 3 接线，当前只读）
                 </button>
               )}
            </div>
            
            <div className="flex items-center gap-3 bg-slate-50/50 border border-slate-100 p-3 rounded-lg">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 border border-blue-100/50 flex flex-col items-center justify-center shrink-0 shadow-3xs">
                 <LinkIcon className="w-4.5 h-4.5" />
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="font-mono text-sm font-black text-slate-805 truncate">{activeLink.id}</span>
                <span className="text-[9.5px] font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100 leading-none w-fit">已发布</span>
              </div>
            </div>

            {isEditingDetails ? (
              <div className="space-y-4 text-[12px]">
                <div className="space-y-1.5">
                  <label className="text-slate-500 font-extrabold block">中文名 *</label>
                  <input
                    type="text"
                    value={editNameCn}
                    onChange={(e) => setEditNameCn(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200/60 hover:border-slate-300/80 rounded-lg text-slate-805 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs shadow-3xs transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-500 font-extrabold block mb-1">源对象 (只读)</label>
                    <input 
                      type="text" 
                      value={activeLink.sourceObjId} 
                      disabled 
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200/60 rounded-lg text-slate-500 font-mono focus:outline-none cursor-not-allowed text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 font-extrabold block mb-1">目标对象 (只读)</label>
                    <input 
                      type="text" 
                      value={activeLink.targetObjId} 
                      disabled 
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200/60 rounded-lg text-slate-500 font-mono focus:outline-none cursor-not-allowed text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-500 font-extrabold block">基数 (Cardinality)</label>
                  <div className="flex bg-slate-50 rounded-lg border border-slate-200/50 p-0.5 shadow-3xs">
                    {(['1:1', '1:N', 'N:M'] as const).map(card => (
                      <button 
                        key={card}
                        type="button"
                        onClick={() => setEditCardinality(card)}
                        className={`flex-1 py-1 font-mono text-[11.5px] font-bold rounded-md transition-all cursor-pointer ${
                          editCardinality === card 
                            ? 'bg-blue-600 text-white shadow-2xs' 
                            : 'text-slate-500 hover:text-slate-850 hover:bg-white/50'
                        }`}
                      >
                        {card}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="text-slate-500 font-extrabold block">属性约束配置</label>
                  <div className="space-y-2">
                    {[
                      { id: 'isLineage', label: '参与血缘', value: editIsLineage, setter: setEditIsLineage, desc: '参与并影响底层数据治理及血缘大图展现' },
                      { id: 'isAiVisible', label: 'AI 可见', value: editIsAiVisible, setter: setEditIsAiVisible, desc: '是否暴露给 AI Studio 工作场景及 Prompt 集' },
                      { id: 'requiresAuth', label: '权限控制', value: editRequiresAuth, setter: setEditRequiresAuth, desc: '读取或写入此关系是否需要对应的角色权限校验' }
                    ].map(item => (
                      <label 
                        key={item.id}
                        className={`p-2.5 rounded-lg border flex items-start gap-2 cursor-pointer text-left transition-all select-none ${
                          item.value 
                            ? 'bg-blue-50/20 border-blue-200 shadow-3xs text-blue-900' 
                            : 'bg-white border-slate-200 hover:bg-slate-50/50 text-slate-650'
                        }`}
                      >
                        <input 
                          type="checkbox"
                          checked={item.value}
                          onChange={(e) => item.setter(e.target.checked)}
                          className="rounded border-slate-350 text-blue-600 focus:ring-blue-500 mt-0.5 shrink-0 cursor-pointer"
                        />
                        <div className="min-w-0">
                          <span className="text-[11px] font-bold block leading-tight">
                            {item.label}: <span className="font-bold underline">{item.value ? '是' : '否'}</span>
                          </span>
                          <span className="text-[9.5px] text-slate-450 block mt-0.5 leading-normal">
                            {item.desc}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-500 font-extrabold block">功能定位与描述说明</label>
                  <textarea 
                    rows={3} 
                    value={editDescription} 
                    onChange={(e) => setEditDescription(e.target.value)} 
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-slate-805 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs leading-normal resize-none font-medium shadow-3xs transition-colors"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button 
                    onClick={handleCancelDetails}
                    className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-md font-bold text-[11.5px] cursor-pointer transition-all shadow-3xs"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSaveDetails}
                    disabled
                    title={BATCH3_READONLY_NOTE}
                    className="px-3.5 py-1.5 bg-slate-300 text-white rounded-md font-bold text-[11.5px] cursor-not-allowed shadow-xs"
                  >
                    保存修改（Batch 3 接线，当前只读）
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-4.5 text-[12px] border-b border-slate-100 pb-5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-semibold shrink-0">中文名</span>
                    <span className="font-bold text-slate-805">{activeLink.nameCn || '（未命名关系）'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-semibold shrink-0">源对象</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 font-mono">{activeLink.sourceObjId}</span>
                      <span className="text-slate-450 font-medium text-xs">
                        {activeLink.sourceObjId === 'DataSource' ? '数据源' : 
                         activeLink.sourceObjId === 'DataAsset' ? '数据资产' : 
                         activeLink.sourceObjId === 'Field' ? '字段' : 
                         activeLink.sourceObjId === 'SemanticAssertion' ? '语义断言' : 
                         activeLink.sourceObjId === 'DataQualityRule' ? '质量规则' : 
                         activeLink.sourceObjId === 'Snapshot' ? '快照' : 
                         activeLink.sourceObjId === 'Run' ? '运行记录' : '对象'}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-semibold shrink-0">目标对象</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100 font-mono">{activeLink.targetObjId}</span>
                      <span className="text-slate-450 font-medium text-xs">
                        {activeLink.targetObjId === 'DataAsset' ? '数据资产' : 
                         activeLink.targetObjId === 'Field' ? '字段' : 
                         activeLink.targetObjId === 'SemanticAssertion' ? '语义断言' : 
                         activeLink.targetObjId === 'Evidence' ? '证据' : 
                         activeLink.targetObjId === 'DataQualityRule' ? '质量规则' : 
                         activeLink.targetObjId === 'DataIssue' ? '数据问题' : 
                         activeLink.targetObjId === 'GovernanceTask' ? '治理任务' : 
                         activeLink.targetObjId === 'Snapshot' ? '快照' : '对象'}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-semibold shrink-0">方向</span>
                    <span className="font-mono text-slate-750 font-bold bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                      {activeLink.direction || `${activeLink.sourceObjId} → ${activeLink.id} → ${activeLink.targetObjId}`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-semibold shrink-0">基数</span>
                    <span className="font-mono font-black text-slate-805 text-[12px] bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{activeLink.cardinality}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-semibold shrink-0">参与血缘</span>
                    <div className="flex items-center gap-1">
                      {activeLink.isLineage ? (
                        <><CheckCircle2 className="w-4 h-4 text-emerald-500" /> <span className="text-slate-705 font-bold">是</span></>
                      ) : (
                        <><AlertCircle className="w-4 h-4 text-slate-400" /> <span className="text-slate-500 font-medium">否</span></>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-semibold shrink-0">AI 可见</span>
                    <div className="flex items-center gap-1">
                      {activeLink.isAiVisible ? (
                        <><CheckCircle2 className="w-4 h-4 text-emerald-500" /> <span className="text-slate-705 font-bold">是</span></>
                      ) : (
                        <><AlertCircle className="w-4 h-4 text-slate-400" /> <span className="text-slate-500 font-medium">否</span></>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-semibold shrink-0">权限控制</span>
                    <div className="flex items-center gap-1">
                      {activeLink.requiresAuth ? (
                        <><CheckCircle2 className="w-4 h-4 text-emerald-500" /> <span className="text-slate-705 font-bold">是</span></>
                      ) : (
                        <><AlertCircle className="w-4 h-4 text-slate-400" /> <span className="text-slate-500 font-medium">否</span></>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 pt-1">
                    <span className="text-slate-400 font-semibold shrink-0">描述</span>
                    <span className="text-slate-650 leading-relaxed font-semibold bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                      {activeLink.description || '暂无描述。'}
                    </span>
                  </div>
                </div>

                <div className="border-b border-slate-100 pb-5">
                  <h4 className="text-[12px] font-black text-slate-900 mb-3.5 uppercase tracking-wide">约束配置</h4>
                  <div className="space-y-4 text-[12px]">
                     <div className="flex justify-between items-center">
                       <span className="text-slate-400 font-semibold shrink-0 flex items-center gap-1">唯一性 <Info className="w-3.5 h-3.5 text-slate-300" /></span>
                       <span className="text-slate-700 font-semibold">可重复</span>
                     </div>
                     <div className="flex justify-between items-center">
                       <span className="text-slate-400 font-semibold shrink-0 flex items-center gap-1">必填性 <Info className="w-3.5 h-3.5 text-slate-300" /></span>
                       <span className="text-slate-700 font-semibold">非必填</span>
                     </div>
                     <div className="flex justify-between items-center">
                       <span className="text-slate-400 font-semibold shrink-0 flex items-center gap-1">方向性 <Info className="w-3.5 h-3.5 text-slate-300" /></span>
                       <div className="flex items-center gap-1.5">
                          <span className="text-slate-700 font-semibold">单向</span>
                          <span className="text-[10px] font-mono bg-slate-50 text-slate-500 px-2 py-0.5 rounded border border-slate-100 font-semibold">
                            {activeLink.sourceObjId} → {activeLink.targetObjId}
                          </span>
                       </div>
                     </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[12px] font-black text-slate-900 mb-3.5 uppercase tracking-wide">使用位置</h4>
                  <div className="space-y-4 text-[12px]">
                     <div className="flex items-center justify-between">
                       <span className="text-slate-400 font-semibold flex items-center gap-1">知识网络 <Info className="w-3.5 h-3.5 text-slate-300" /></span>
                       <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> <span className="text-slate-600 font-semibold">已使用</span></div>
                     </div>
                     <div className="flex items-center justify-between">
                       <span className="text-slate-400 font-semibold flex items-center gap-1">AI 工作台 <Info className="w-3.5 h-3.5 text-slate-300" /></span>
                       <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> <span className="text-slate-600 font-semibold">已使用</span></div>
                     </div>
                     <div className="flex items-center justify-between">
                       <span className="text-slate-400 font-semibold">Workflow</span>
                       <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> <span className="text-slate-600 font-semibold">已使用</span></div>
                     </div>
                  </div>
                  
                  <div className="flex flex-col gap-2.5 mt-6 pt-4 border-t border-slate-100">
                    <button className="w-full py-2 bg-white border border-blue-200 hover:border-blue-500 text-blue-600 hover:bg-blue-50 font-bold text-[12px] rounded-lg transition-colors cursor-pointer text-center shadow-3xs">查看关系影响</button>
                    <button className="w-full py-2 bg-white border border-blue-200 hover:border-blue-500 text-blue-600 hover:bg-blue-50 font-bold text-[12px] rounded-lg transition-colors cursor-pointer text-center shadow-3xs">查看使用实例</button>
                    <button className="w-full py-2 bg-white border border-blue-200 hover:border-blue-500 text-blue-600 hover:bg-blue-50 font-bold text-[12px] rounded-lg transition-colors cursor-pointer text-center shadow-3xs">查看变更历史</button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <CreateLinkTypeDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSave={() => {
          setIsDraftSaved(true);
          setIsDrawerOpen(false);
        }}
      />
    </div>
  );
}
