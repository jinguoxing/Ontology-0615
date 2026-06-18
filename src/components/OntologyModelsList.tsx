import React, { useState } from 'react';
import {
  Database, Search, Plus, Upload, History, Info, ChevronRight, ChevronDown,
  Code, Workflow, BarChart2, CheckCircle,
  AlertTriangle, Filter, RefreshCw, XCircle, FileText, Settings, User, Eye, Sparkles, Cpu,
  PanelRightOpen, PanelRightClose, Share2, Zap
} from 'lucide-react';
import {useUiStore} from '../store/uiStore';

interface ModelItem {
  id: string;
  name: string;
  description: string;
  version: string;
  status: 'published' | 'editing' | 'approved' | 'failed' | 'archived';
  statusLabel: string;
  objectTypeCount: number;
  linkTypeCount: number;
  functionCount: number;
  actionCount: number;
  workflowCount: number;
  errors: number;
  warnings: number;
  aiScenes: number;
  networkViews: number;
  owner: string;
  lastUpdated: string;
}

export default function OntologyModelsList() {
  const navigate = useUiStore((s) => s.navigate);
  const isLocked = useUiStore((s) => s.isLocked);
  const setCreateDrawerOpen = useUiStore((s) => s.setCreateDrawerOpen);

  const onCreateChangeSet = () => setCreateDrawerOpen(true);
  const onRunValidation = () => {
    alert("🔍 开始扫描逻辑一致性... \n一式 10 个 Object Type, 8 个 Link Type, 8 个绑定能力全链节点扫描完成！状态完美正常，检验无破坏。");
  };
  // Preset models conforming exactly to the user specification
  const initialModels: ModelItem[] = [
    {
      id: 'drkn-core',
      name: 'DRKN-Core 数据语义治理模型',
      description: '数据语义治理模型，用于数据源、资产及质量的标准化规则和治理闭环控制。',
      version: 'v1.3.0',
      status: 'published',
      statusLabel: '已发布',
      objectTypeCount: 10,
      linkTypeCount: 18,
      functionCount: 12,
      actionCount: 16,
      workflowCount: 6,
      errors: 0,
      warnings: 2,
      aiScenes: 3,
      networkViews: 5,
      owner: '数据治理团队',
      lastUpdated: '2026-06-14 10:35'
    },
    {
      id: 'crm-semantic',
      name: 'CRM 数据语义模型',
      description: '面向 CRM 主数据与字段语义治理，规范客户画像、商机、线索关联链路。',
      version: 'v0.9.2',
      status: 'editing',
      statusLabel: '编辑中',
      objectTypeCount: 8,
      linkTypeCount: 11,
      functionCount: 6,
      actionCount: 8,
      workflowCount: 3,
      errors: 1,
      warnings: 3,
      aiScenes: 1,
      networkViews: 2,
      owner: 'CRM 治理小组',
      lastUpdated: '2026-06-12 16:18'
    },
    {
      id: 'erp-asset',
      name: 'ERP 数据资产语义模型',
      description: '面向 ERP 数据资产与质量治理，包含供应链及财务领域标准化实体。',
      version: 'v1.1.0',
      status: 'approved',
      statusLabel: '待审核',
      objectTypeCount: 9,
      linkTypeCount: 14,
      functionCount: 9,
      actionCount: 12,
      workflowCount: 4,
      errors: 0,
      warnings: 1,
      aiScenes: 2,
      networkViews: 3,
      owner: 'ERP 数据团队',
      lastUpdated: '2026-06-11 09:42'
    },
    {
      id: 'snapshot-gov',
      name: 'Snapshot 治理模型',
      description: '面向快照与归档治理，对历史冷热数据资产进行快照备份与行为追踪。',
      version: 'v1.0.0',
      status: 'archived',
      statusLabel: '已归档',
      objectTypeCount: 6,
      linkTypeCount: 9,
      functionCount: 4,
      actionCount: 6,
      workflowCount: 2,
      errors: 0,
      warnings: 0,
      aiScenes: 0,
      networkViews: 1,
      owner: '数据治理团队',
      lastUpdated: '2026-06-01 15:20'
    },
    {
      id: 'dq-rules',
      name: 'DQ 规则语义模型',
      description: '面向数据质量规则语义治理，负责字段空值率、正则和外键校验模型。',
      version: 'v0.8.1',
      status: 'failed',
      statusLabel: '发布失败',
      objectTypeCount: 7,
      linkTypeCount: 10,
      functionCount: 5,
      actionCount: 7,
      workflowCount: 3,
      errors: 2,
      warnings: 5,
      aiScenes: 0,
      networkViews: 0,
      owner: 'DQ 小组',
      lastUpdated: '2026-05-30 11:05'
    }
  ];

  // States
  const [models, setModels] = useState<ModelItem[]>(initialModels);
  const [selectedModelId, setSelectedModelId] = useState<string>('drkn-core');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [ownerFilter, setOwnerFilter] = useState<string>('all');
  // 搜索栏默认收起，点击展开
  const [searchExpanded, setSearchExpanded] = useState<boolean>(false);
  // 右侧详情预览面板默认收起，点击展开
  const [detailOpen, setDetailOpen] = useState<boolean>(false);

  const selectedModel = models.find(m => m.id === selectedModelId) || models[0];

  // Handlers
  const handleAddNewModel = () => {
    navigate('create_model');
  };

  const handleImportModel = () => {
    alert("📥 导入本体模型模版：支持导入标准化 DRKN *.json, *.ttl 或 *.owl 元模型结构描述文件。");
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setOwnerFilter('all');
  };

  // Filtered List
  const filteredModels = models.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.owner.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    const matchesOwner = ownerFilter === 'all' || m.owner === ownerFilter;
    return matchesSearch && matchesStatus && matchesOwner;
  });

  // Per-status counts for the status filter tabs (always computed against the
  // full list, ignoring the active status filter so the counts stay stable as
  // the user switches tabs). Search / owner filters ARE respected so the counts
  // reflect what's visible given the current search context.
  const statusTabs = [
    { id: 'all', label: '全部' },
    { id: 'published', label: '已发布' },
    { id: 'editing', label: '编辑中' },
    { id: 'approved', label: '待审核' },
    { id: 'failed', label: '发布失败' },
    { id: 'archived', label: '已归档' }
  ];
  const statusCounts = statusTabs.reduce<Record<string, number>>((acc, tab) => {
    const base = models.filter(m =>
      (m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.owner.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (ownerFilter === 'all' || m.owner === ownerFilter)
    );
    acc[tab.id] = tab.id === 'all' ? base.length : base.filter(m => m.status === tab.id).length;
    return acc;
  }, {});

  // Whether any filter is currently active (used to show the reset affordance)
  const hasActiveFilters = searchQuery.trim() !== '' || statusFilter !== 'all' || ownerFilter !== 'all';
  // 已应用筛选条件的数量（用于收起态的摘要徽章）
  const activeFilterCount = [
    searchQuery.trim() !== '',
    statusFilter !== 'all',
    ownerFilter !== 'all'
  ].filter(Boolean).length;

  return (
    <div className="space-y-6 font-sans text-slate-800" id="ontology-models-list-view">
      
      {/* 1. 顶部面包屑与标题栏 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium select-none">
            <span>管理中心</span>
            <span className="text-slate-300">/</span>
            <span>本体管理</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-500 font-medium">DRKN 本体模型</span>
          </div>
          
          {/* Main Title Block */}
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            DRKN 本体模型
          </h1>
          <p className="text-xs text-slate-500">
            管理数据语义治理层的本体模型，包括数据源、数据资产、字段、语义断言、证据、质量规则、治理任务等对象类型。
          </p>
        </div>

        {/* Header CTA Buttons */}
        <div className="flex items-center gap-2">
          <button 
            onClick={handleAddNewModel}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4" />
            新建 DRKN 本体模型
          </button>
          
          <button 
            onClick={handleImportModel}
            className="px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg shadow-xs text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Upload className="h-4 w-4 text-slate-500" />
            导入模型
          </button>

          <button 
            onClick={() => navigate('change_release')}
            className="px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg shadow-xs text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <History className="h-4 w-4 text-slate-500" />
            查看发布记录
          </button>
        </div>
      </div>

      {/* 2. 顶部多条件高级搜索过滤区（默认收起，点击展开） */}
      <div className="bg-white border border-slate-200 rounded-md shadow-xs overflow-hidden">
        {/* 触发条：始终显示，点击展开/收起 */}
        <button
          onClick={() => setSearchExpanded(v => !v)}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-slate-50/70"
        >
          <div className="flex items-center gap-2.5 text-xs">
            <Filter className={`h-4 w-4 ${hasActiveFilters ? 'text-blue-500' : 'text-slate-400'}`} />
            <span className="font-bold text-slate-700">高级筛选</span>
            {/* 当前筛选摘要 */}
            {hasActiveFilters ? (
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="h-3 w-px bg-slate-200" />
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold leading-none">
                  {activeFilterCount}
                </span>
                <span className="text-slate-400">个条件已应用</span>
              </span>
            ) : (
              <span className="text-slate-400">未设置筛选条件</span>
            )}
          </div>
          <span className={`flex items-center gap-1 text-[11px] font-semibold ${hasActiveFilters ? 'text-blue-600' : 'text-slate-400'}`}>
            {searchExpanded ? '收起' : '展开'}
            <ChevronDown className={`h-4 w-4 transition-transform ${searchExpanded ? 'rotate-180' : ''}`} />
          </span>
        </button>

        {/* 展开内容 */}
        <div
          className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
            searchExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden">
            <div className="border-t border-slate-100 p-4 space-y-3.5">
            {/* 第一行：主搜索框（突出）+ Owner 筛选 + 重置 */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-3">
              {/* 主搜索框 —— 视觉更突出，含实时结果计数与清空按钮 */}
              <div className="relative flex-1 max-w-xl">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索模型名称、说明或 Owner…"
                  className="w-full h-10 pl-10 pr-24 bg-slate-50/80 focus:bg-white text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 font-medium placeholder:text-slate-400"
                />
                {/* 实时结果计数 */}
                {searchQuery.trim() !== '' && (
                  <span className="absolute right-10 top-1/2 -translate-y-1/2 text-[10.5px] text-slate-400 font-medium select-none whitespace-nowrap">
                    {filteredModels.length} 个结果
                  </span>
                )}
                {/* 清空按钮 —— 仅在有输入时出现 */}
                {searchQuery.trim() !== '' && (
                  <button
                    onClick={() => setSearchQuery('')}
                    aria-label="清空搜索"
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded-full bg-slate-200 hover:bg-slate-300 text-slate-500 hover:text-slate-700 cursor-pointer transition-colors"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Owner 筛选 */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400 font-medium shrink-0">Owner</span>
                <select
                  value={ownerFilter}
                  onChange={(e) => setOwnerFilter(e.target.value)}
                  className="h-9 bg-slate-50 border border-slate-200 rounded-lg py-0 px-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-medium text-xs text-slate-700 cursor-pointer transition-all"
                >
                  <option value="all">全部 Owner</option>
                  <option value="数据治理团队">数据治理团队</option>
                  <option value="CRM 治理小组">CRM 治理小组</option>
                  <option value="ERP 数据团队">ERP 数据团队</option>
                  <option value="DQ 小组">DQ 小组</option>
                </select>
              </div>

              {/* 重置筛选 —— 仅在有任意筛选激活时高亮提示 */}
              <button
                onClick={handleResetFilters}
                className={`h-9 px-3.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all shrink-0 ${
                  hasActiveFilters
                    ? 'bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600'
                    : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-500'
                }`}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${hasActiveFilters ? 'text-blue-500' : 'text-slate-400'}`} />
                重置筛选
              </button>
            </div>

            {/* 第二行：状态筛选分段控件（带每状态计数徽章） */}
            <div className="flex items-center gap-1 text-xs bg-slate-100/70 p-1 rounded-lg w-fit max-w-full overflow-x-auto">
              <span className="text-[10px] text-slate-400 font-bold px-2 uppercase shrink-0">状态</span>
              {statusTabs.map((tab) => {
                const count = statusCounts[tab.id] ?? 0;
                const isActive = statusFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md transition-all font-semibold cursor-pointer shrink-0 ${
                      isActive
                        ? 'bg-white text-blue-600 shadow-sm font-bold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {tab.label}
                    <span className={`inline-flex items-center justify-center min-w-[18px] h-[16px] px-1 rounded-full text-[10px] font-bold leading-none ${
                      isActive
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-slate-200 text-slate-500'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. 统计指标看板汇总行 */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        
        {/* Model Count */}
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs flex items-center gap-3">
          <div className="bg-blue-50 text-blue-600 p-2.5 rounded-lg shrink-0">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold mb-0.5 leading-none">DRKN 本体模型</p>
            <p className="text-xl font-extrabold text-slate-900 leading-tight">8</p>
          </div>
        </div>

        {/* Published */}
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs flex items-center gap-3">
          <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-lg shrink-0">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold mb-0.5 leading-none">已发布</p>
            <p className="text-xl font-extrabold text-slate-900 leading-tight">5</p>
          </div>
        </div>

        {/* Editing */}
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs flex items-center gap-3">
          <div className="bg-amber-50 text-amber-600 p-2.5 rounded-lg shrink-0">
            <Settings className="h-5 w-5 animate-spin-slow" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold mb-0.5 leading-none">编辑中</p>
            <p className="text-xl font-extrabold text-slate-900 leading-tight">2</p>
          </div>
        </div>

        {/* Pending Review */}
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs flex items-center gap-3">
          <div className="bg-violet-50 text-violet-600 p-2.5 rounded-lg shrink-0">
            <History className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold mb-0.5 leading-none">待审核</p>
            <p className="text-xl font-extrabold text-slate-900 leading-tight">1</p>
          </div>
        </div>

        {/* Warnings */}
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs flex items-center gap-3">
          <div className="bg-rose-50 text-rose-500 p-2.5 rounded-lg shrink-0">
            <AlertTriangle className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold mb-0.5 leading-none">存在警告</p>
            <p className="text-xl font-extrabold text-slate-950 text-slate-900 leading-tight">3</p>
          </div>
        </div>

        {/* AI Scenes */}
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs flex items-center gap-3">
          <div className="bg-sky-50 text-sky-600 p-2.5 rounded-lg shrink-0">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold mb-0.5 leading-none">被 AI 使用</p>
            <p className="text-xl font-extrabold text-slate-900 leading-tight">4</p>
          </div>
        </div>

      </div>

      {/* 5. 中央分栏布局：列表表格 + 详情右侧侧边抽屉 */}
      <div className="flex flex-col lg:flex-row items-stretch">

        {/* ================= LEFT MAIN TABLE ================= */}
        <div className="flex-1 bg-white border border-slate-200 rounded-md p-5 shadow-sm space-y-4 flex flex-col justify-between overflow-x-auto min-w-0 transition-all duration-500 ease-in-out">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                模型资产概览
                <span className="text-xs text-slate-400 font-normal">({filteredModels.length} 个匹配)</span>
              </h3>
              {/* 展开/收起右侧详情预览 */}
              <button
                onClick={() => setDetailOpen(v => !v)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer transition-all border ${
                  detailOpen
                    ? 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-600'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                {detailOpen ? <PanelRightClose className="h-3.5 w-3.5" /> : <PanelRightOpen className="h-3.5 w-3.5" />}
                {detailOpen ? '收起详情' : '展开详情'}
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {filteredModels.map((item) => {
                const isCurSelected = item.id === selectedModelId;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedModelId(item.id);
                      setDetailOpen(true);
                    }}
                    className={`group relative flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-4 rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden ${
                      isCurSelected
                        ? 'bg-blue-50/40 border-blue-200 shadow-[0_2px_12px_-4px_rgba(37,99,235,0.15)] z-10'
                        : 'bg-white hover:bg-slate-50/80 border-slate-200 hover:border-slate-300 z-0'
                    }`}
                  >
                    {/* Animated left indicator */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 transition-colors duration-300 ${isCurSelected ? 'bg-blue-600' : 'bg-transparent group-hover:bg-slate-200'}`} />

                    {/* Left: Main Identity */}
                    <div className="flex flex-col gap-1.5 min-w-[240px] max-w-[280px] pl-2 transition-transform duration-300 group-hover:translate-x-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-blue-600 text-sm truncate">
                          {item.id === 'drkn-core' ? (
                            <span className="flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                              {item.id.toUpperCase()}
                            </span>
                          ) : item.id.toUpperCase()}
                        </h4>
                        <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md font-medium border border-slate-200">{item.version}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate" title={item.description}>{item.description}</p>
                      <div className="mt-0.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === 'published' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          item.status === 'editing' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          item.status === 'approved' ? 'bg-sky-50 text-sky-700 border border-sky-100' :
                          item.status === 'failed' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                          'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            item.status === 'published' ? 'bg-emerald-500' :
                            item.status === 'editing' ? 'bg-amber-500' :
                            item.status === 'approved' ? 'bg-sky-500' :
                            item.status === 'failed' ? 'bg-rose-500' : 'bg-slate-400'
                          }`}></span>
                          {item.statusLabel}
                        </span>
                      </div>
                    </div>

                    {/* Middle: Metrics Pills */}
                    <div className="flex-1 flex flex-col justify-center min-w-[200px]">
                      <div className="bg-slate-50/80 border border-slate-100 rounded-lg p-2 flex items-center gap-3 w-fit text-[11px] font-mono font-medium text-slate-700">
                        <div className="flex items-center gap-1.5" title="Object Types">
                          <Database className="h-3 w-3 text-slate-400" />
                          <span>{item.objectTypeCount}</span>
                        </div>
                        <div className="w-px h-3 bg-slate-200" />
                        <div className="flex items-center gap-1.5" title="Link Types">
                          <Share2 className="h-3 w-3 text-slate-400" />
                          <span>{item.linkTypeCount}</span>
                        </div>
                        <div className="w-px h-3 bg-slate-200" />
                        <div className="flex items-center gap-1.5" title="Functions">
                          <Code className="h-3 w-3 text-slate-400" />
                          <span>{item.functionCount}</span>
                        </div>
                        <div className="w-px h-3 bg-slate-200" />
                        <div className="flex items-center gap-1.5" title="Actions">
                          <Zap className="h-3 w-3 text-slate-400" />
                          <span>{item.actionCount}</span>
                        </div>
                        <div className="w-px h-3 bg-slate-200" />
                        <div className="flex items-center gap-1.5" title="Workflows">
                          <Workflow className="h-3 w-3 text-slate-400" />
                          <span>{item.workflowCount}</span>
                        </div>
                      </div>
                    </div>

                    {/* Middle-Right: Health & Usage */}
                    <div className="flex flex-col justify-center gap-2 min-w-[140px] text-[11px]">
                      <div 
                        onClick={(e) => { e.stopPropagation(); navigate('change_release'); }}
                        className={`flex items-center gap-1.5 w-fit hover:underline ${item.errors > 0 ? 'text-rose-600' : item.warnings > 0 ? 'text-amber-600' : 'text-emerald-600'}`}
                      >
                        {item.errors > 0 ? <XCircle className="h-3.5 w-3.5 animate-pulse" /> : item.warnings > 0 ? <AlertTriangle className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}
                        <span className="font-semibold">{item.errors} 错 / {item.warnings} 警</span>
                      </div>
                      <div 
                        onClick={(e) => { e.stopPropagation(); navigate('change_release'); }}
                        className="flex items-center gap-1.5 w-fit text-slate-500 hover:text-blue-600 hover:underline"
                      >
                        <Cpu className="h-3.5 w-3.5" />
                        <span className="font-semibold">{item.aiScenes} AI / {item.networkViews} 视图</span>
                      </div>
                    </div>

                    {/* Right: Meta & Actions */}
                    <div className="flex flex-col xl:items-end justify-between gap-2.5 min-w-[150px] transition-transform duration-300 group-hover:-translate-x-1">
                      <div className="flex items-center xl:flex-col xl:items-end gap-2 xl:gap-0">
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {item.owner}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono xl:mt-0.5">{item.lastUpdated}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-auto">
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate('overview'); }}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-100 hover:border-blue-600 rounded-md text-[10.5px] font-bold transition-colors"
                        >
                          查看详情
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onCreateChangeSet(); navigate('change_release'); }}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-md text-[10.5px] font-semibold transition-colors"
                        >
                          发布记录
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

          {/* Table Bottom tips */}
          <div className="border-t border-slate-100 pt-3 mt-4 text-[10.5px] text-slate-400 flex items-center justify-between">
            <span>* 模型资产包含多级知识映射与自动编译校验策略。</span>
            <span>共 {filteredModels.length} 个本体模型被注册并归属治理域</span>
          </div>

        </div>

        {/* ================= RIGHT DETAIL DRAWER（默认收起，点击展开） ================= */}
        <div 
          className={`flex-shrink-0 overflow-hidden transition-all duration-500 ease-in-out ${
            detailOpen 
              ? 'lg:w-[320px] xl:w-[360px] opacity-100 mt-6 lg:mt-0 lg:ml-6 h-auto' 
              : 'w-0 opacity-0 h-0 m-0'
          }`}
        >
          <div className="space-y-6 w-full lg:w-[320px] xl:w-[360px]">

          {/* Main Card */}
          <div className="bg-white border border-slate-200 rounded-md p-5 shadow-sm space-y-5 flex flex-col justify-between min-h-[500px]">
            <div className="space-y-4">

              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  模型展示预览
                </h3>
                <button
                  onClick={() => setDetailOpen(false)}
                  aria-label="收起详情"
                  title="收起详情"
                  className="text-slate-300 hover:text-slate-500 cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
                >
                  <PanelRightClose className="h-4 w-4" />
                </button>
              </div>

              {/* Selected Name Block */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                    {selectedModel.id === 'drkn-core' ? 'DRKN-Core' : selectedModel.name.split(' ')[0]}
                  </h2>
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    selectedModel.status === 'published' 
                      ? 'bg-emerald-50 text-emerald-700' 
                      : selectedModel.status === 'editing'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {selectedModel.statusLabel}
                  </span>
                </div>

                {/* Scope Measures list */}
                <div className="bg-slate-50/70 border border-slate-100 rounded-md p-3 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-[10.5px]">当前版本</span>
                    <span className="font-bold font-mono text-slate-800">{selectedModel.version}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-[10.5px]">最近发布</span>
                    <span className="font-semibold text-slate-800">2 天前</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-[10.5px]">当前风险</span>
                    <span className="inline-flex items-center gap-1 font-bold text-amber-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                      中
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-[10.5px]">下游使用</span>
                    <span className="text-[11px] font-semibold text-slate-705 text-slate-700">
                      {selectedModel.aiScenes} 个 AI 场景、{selectedModel.networkViews} 个视图
                    </span>
                  </div>
                </div>
              </div>

              {/* Narrative Abstract description */}
              <div className="space-y-1.5">
                <h4 className="text-[11px] font-bold text-slate-450 uppercase tracking-wider text-slate-400">模型摘要说明</h4>
                <p className="text-xs text-slate-500 leading-relaxed text-[11.5px]">
                  用于 DRKN 数据语义治理层，覆盖 DataSource、DataAsset、Field、SemanticAssertion、Evidence、DataQualityRule、DataIssue、GovernanceTask、Run、Snapshot 等核心对象类型。
                </p>
              </div>

              {/* Quick Operation Actions */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                {/* 1. View Detail */}
                <button 
                  onClick={() => navigate('overview')}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:-translate-y-0.5"
                >
                  <Eye className="h-3.5 w-3.5" />
                  查看详情
                </button>

                {/* 2. New Changeset */}
                <button 
                  onClick={() => {
                    onCreateChangeSet();
                    navigate('change_release');
                  }}
                  className="w-full py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 rounded-lg shadow-xs text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <Plus className="h-3.5 w-3.5 text-slate-500" />
                  新建变更集
                </button>

                {/* 3. Impact analysis */}
                <button 
                  onClick={() => navigate('change_release')}
                  className="w-full py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 rounded-lg shadow-xs text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <BarChart2 className="h-3.5 w-3.5 text-purple-500" />
                  影响分析（全图谱）
                </button>
              </div>

            </div>

            {/* Health Score Card */}
            <div className="bg-slate-50/80 border border-slate-150 rounded-md p-3.5 mt-2 space-y-2.5">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">健康度明细指标</h4>
              
              <div className="grid grid-cols-4 gap-1.5 text-center">
                <div className="bg-white border border-slate-100 rounded-lg p-1">
                  <p className="text-[9px] text-slate-400 font-bold mb-0.5">校验</p>
                  <p className="text-[10.5px] font-bold text-emerald-600 truncate">{selectedModel.errors} 错/{selectedModel.warnings} 警</p>
                </div>
                <div className="bg-white border border-slate-100 rounded-lg p-1">
                  <p className="text-[9px] text-slate-400 font-bold mb-0.5">Function</p>
                  <p className="text-[11px] font-bold text-slate-800">{selectedModel.functionCount}</p>
                </div>
                <div className="bg-white border border-slate-100 rounded-lg p-1">
                  <p className="text-[9px] text-slate-400 font-bold mb-0.5">Workflow</p>
                  <p className="text-[11px] font-bold text-slate-800">{selectedModel.workflowCount}</p>
                </div>
                <div className="bg-white border border-slate-100 rounded-lg p-1">
                  <p className="text-[9px] text-slate-400 font-bold mb-0.5">AI 使用</p>
                  <p className="text-[11px] font-bold text-sky-600">{selectedModel.aiScenes}</p>
                </div>
              </div>
            </div>

          </div>

          </div>
        </div>

      </div>

      {/* 6. 底部面板：最近发布记录（时间线形式） */}
      <div className="bg-white border border-slate-205 border-slate-200/95 rounded-md p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
            最近发布记录
          </h3>
          <button 
            onClick={() => navigate('change_release')}
            className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-0.5 cursor-pointer"
          >
            查看全部发布记录
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* 3 Horizontal Logs Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-normal">
          {/* Card 1 */}
          <div className="bg-slate-50/50 border border-slate-150 rounded-md p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 text-blue-650 text-blue-650 rounded-lg">
                  <Database className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-[11.5px]">DRKN-Core v1.3.0</h4>
                  <p className="text-[9.5px] text-slate-400">已发布</p>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold px-2 py-0.5 rounded-full">已发布</span>
            </div>
            
            <div className="space-y-1 text-[10.5px] text-slate-500 font-medium">
              <p>发布时间: 2026-06-14 10:35</p>
              <p>发布人: 张三</p>
              <p className="text-slate-400 italic">说明: 发布 DRKN-Core v1.3.0，优化语义断言与质量规则逻辑。</p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-slate-50/50 border border-slate-150 rounded-md p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-50 text-amber-650 rounded-lg">
                  <span className="text-xs font-black font-mono text-amber-600">Ed</span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-[11.5px]">CRM 数据语义模型 v0.9.2</h4>
                  <p className="text-[9.5px] text-slate-400">编辑中</p>
                </div>
              </div>
              <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-100 font-bold px-2 py-0.5 rounded-full">编辑中</span>
            </div>
            
            <div className="space-y-1 text-[10.5px] text-slate-500 font-medium">
              <p>更新时间: 2026-06-12 16:18</p>
              <p>更新人: 李四</p>
              <p className="text-slate-400 italic">说明: 完善 CRM 字段语义及业务属性规则配置。</p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-slate-50/50 border border-slate-150 rounded-md p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-sky-50 text-sky-650 rounded-lg">
                  <Workflow className="h-4 w-4 text-sky-600" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-[11.5px]">ERP 数据资产模型 v1.1.0</h4>
                  <p className="text-[9.5px] text-slate-400">待审核</p>
                </div>
              </div>
              <span className="text-[10px] bg-sky-50 text-sky-600 border border-sky-100 font-bold px-2 py-0.5 rounded-full">待审核</span>
            </div>
            
            <div className="space-y-1 text-[10.5px] text-slate-500 font-medium">
              <p>更新时间: 2026-06-11 09:42</p>
              <p>更新人: 王五</p>
              <p className="text-slate-400 italic">说明: 提交数据治理审查，对接财务指标治理约束模型。</p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
