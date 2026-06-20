import React, { useState } from 'react';
import { 
  Database, Activity, ArrowRight, Play, CheckCircle, HelpCircle, AlertTriangle,
  Sparkles, Plus, Settings, ChevronDown, Check, Send, User, Layers, ShieldCheck,
  Workflow, Cpu, Network, Info, Eye, ArrowUpRight, Code, Shield, Sparkle
} from 'lucide-react';

interface DknOverviewProps {
  onNavigate: (view: string, targetId?: string) => void;
  modelId?: string;
  isLocked?: boolean;
}

export default function DknOverview({ onNavigate, modelId = 'dkn-global-core', isLocked = true }: DknOverviewProps) {
  // Local active tab for top menu
  const [activeSubTab, setActiveSubTab] = useState('模型总览');
  const [publishStatus, setPublishStatus] = useState<'draft' | 'running' | 'success'>('draft');

  // Load different models info
  const getModelDetails = (id: string) => {
    switch(id) {
      case 'dkn-supply-chain':
        return {
          name: 'DKN 供应链资产图谱模型',
          desc: '统一核心供应商、库存和采购行为的跨系统标准化语义映射与行为图谱元模型。',
          domain: '供应链领域',
          version: 'v1.4.1 Draft',
          status: '草稿',
          updated: '2026-06-15 15:42',
          owner: '供应链架构组',
          objCount: 15,
          linkCount: 20,
          actCount: 14,
          funcCount: 10,
          wfCount: 5,
        };
      case 'dkn-finance-ledger':
        return {
          name: 'DKN 财务账目对账概念模型',
          desc: '规范集团内各财务系统总账与明细交易流的领域实体、交易归组和科目对应语义模型。',
          domain: '财务核算领域',
          version: 'v0.9.5 Draft',
          status: '草稿',
          updated: '2026-06-14 18:10',
          owner: '财务系统治理团队',
          objCount: 6,
          linkCount: 10,
          actCount: 8,
          funcCount: 8,
          wfCount: 2,
        };
      case 'dkn-customer-id':
        return {
          name: 'DKN 统一客户核心标识模型',
          desc: '用于多渠道、多源客户注册信息的合并及核心ID语义层映射关系关系模型和对齐。',
          domain: '营销服务领域',
          version: 'v1.0.0 Draft',
          status: '待审核',
          updated: '2026-06-12 09:30',
          owner: '主数据管理委员会',
          objCount: 9,
          linkCount: 15,
          actCount: 12,
          funcCount: 12,
          wfCount: 4,
        };
      case 'dkn-global-core':
      default:
        return {
          name: '销售域语义治理 DKN',
          desc: '统一查看当前 DKN 的对象、关系、动作、函数、流程、权限与发布状态。',
          domain: '销售领域',
          version: 'v2.1.0 Draft',
          status: '草稿',
          updated: '2026-06-20 10:12',
          owner: '主数据管理委员会',
          objCount: 9,
          linkCount: 14,
          actCount: 12,
          funcCount: 8,
          wfCount: 4,
        };
    }
  };

  const modelInfo = getModelDetails(modelId);

  const tabs = [
    '模型总览', '对象模型', '关系模型', '函数', '动作', '流程', '权限策略', '发布'
  ];

  // Object Type Overview list
  const objectTypes = [
    { name: 'DataSource', status: '启用', attrs: 12, actions: 2, functions: 1, desc: '物理存储/数仓源链接实体' },
    { name: 'Dataset', status: '启用', attrs: 18, actions: 3, functions: 2, desc: '登记的数据物理表/视图' },
    { name: 'Field', status: '启用', attrs: 24, actions: 4, functions: 3, isStarred: true, desc: '行级主属性与字段标定' },
    { name: 'DataQuality', status: '启用', attrs: 10, actions: 2, functions: 2, desc: '质量规则定义校验快照' },
    { name: 'Rule', status: '启用', attrs: 16, actions: 2, functions: 1, desc: '主数据语义判断准则' },
    { name: 'Mapping', status: '启用', attrs: 15, actions: 3, functions: 2, isStarred: true, desc: '主数据核心映射网络' },
    { name: 'Assertion', status: '启用', attrs: 9, actions: 1, functions: 1, desc: '属性/实体关系语义声明' },
    { name: 'Evidence', status: '启用', attrs: 11, actions: 1, functions: 1, desc: '探查匹配或血缘论断证据' },
    { name: 'Task', status: '启用', attrs: 8, actions: 2, functions: 1, desc: '闭环质量问题处理流工单' }
  ];

  // Actions list
  const actionTypes = [
    { name: 'scan_data_source', target: 'DataSource', risk: '低', status: '启用' },
    { name: 'analyze_dataset', target: 'Dataset', risk: '低', status: '启用' },
    { name: 'infer_field_semantics', target: 'Field', risk: '中', status: '启用' },
    { name: 'calculate_data_quality', target: 'Field', risk: '中', status: '启用' },
    { name: 'generate_mapping', target: 'Dataset, Field', risk: '中', status: '启用' },
    { name: 'validate_mapping', target: 'Mapping', status: '启用', risk: '高' },
    { name: 'create_assertion', target: 'Rule', risk: '低', status: '启用' },
    { name: 'create_task', target: 'Task', risk: '低', status: '启用' },
    { name: 'publish_model', target: 'DRKN', risk: '高', status: '启用' }
  ];

  // Functions list
  const functionTypes = [
    { name: 'semantic_classification', type: 'classification', params: 3 },
    { name: 'quality_score_compute', type: 'scoring', params: 2 },
    { name: 'mapping_confidence_compute', type: 'scoring', params: 2 },
    { name: 'assertion_confidence_compute', type: 'scoring', params: 2 }
  ];

  // Workflows list
  const workflows = [
    { name: '数据接入流程', steps: 6, status: '启用', deps: 5 },
    { name: '字段语义识别流程', steps: 7, status: '启用', deps: 7 },
    { name: '映射校验流程', steps: 6, status: '启用', deps: 6 },
    { name: '模型发布流程', steps: 5, status: '启用', deps: 5 }
  ];

  // Permissions list
  const permissions = [
    { role: '管理员', scope: '全部权限' },
    { role: '建模人员', scope: '编辑对象/关系/动作/函数' },
    { role: '审核人员', scope: '校验/发布' },
    { role: '只读用户', scope: '查看' }
  ];

  // Interactive functions
  const handleActionClick = (actionName: string) => {
    alert(`⚡ 触发动作操作: ${actionName}。当前模型为锁定只读状态。`);
  };

  const handleRunValidation = () => {
    setPublishStatus('running');
    setTimeout(() => {
      setPublishStatus('success');
      alert('✅ 模型增量深度校验通过！结构契合度：99.2%，未发现阻断型错误配对。');
    }, 1500);
  };

  return (
    <div className="min-h-full font-sans text-slate-800 bg-slate-100/40 p-4 space-y-4" id="dkn-overview-panel">
      
      {/* Top Banner Header: Breadcrumbs + Actions matching Semovix DRKN Studio */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-3xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          {/* Breadcrumb row */}
          <div className="flex items-center text-[11px] text-slate-400 font-bold tracking-wide mb-1">
            <span className="hover:text-blue-600 cursor-pointer transition-colors" onClick={() => onNavigate('drkn_models')}>Ontology Studio</span>
            <span className="mx-1.5 text-slate-300">/</span>
            <span className="hover:text-blue-600 cursor-pointer transition-colors" onClick={() => onNavigate('dkn_models')}>DKN 模型</span>
            <span className="mx-1.5 text-slate-300">/</span>
            <span className="text-slate-700 font-extrabold truncate max-w-[200px]">{modelInfo.name}</span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">{modelInfo.name} 建模详情页</h1>
            <div className="flex items-center gap-1.5">
              <span className="bg-blue-50 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded border border-blue-100">
                {modelInfo.domain} DKN
              </span>
              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded border border-emerald-100 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
                启用
              </span>
              <span className="bg-slate-100 text-slate-600 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                v2.1.0 Draft
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {modelInfo.desc}
          </p>
        </div>

        {/* Global actions row from header */}
        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
          <button 
            onClick={() => alert('💾 已成功在云端保存当前模型草案！')}
            className="px-3.5 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-3xs transition-all cursor-pointer"
          >
            保存草稿
          </button>
          
          <button 
            onClick={handleRunValidation}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg shadow-3xs transition-all flex items-center gap-1.5 cursor-pointer ${
              publishStatus === 'running' 
                ? 'bg-amber-550 text-white bg-amber-500' 
                : 'text-slate-650 bg-white border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {publishStatus === 'running' ? (
              <>
                <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                校验中...
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-slate-450" /> 校验模型
              </>
            )}
          </button>

          <button 
            onClick={() => onNavigate('knowledge_network')}
            className="px-3.5 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-3xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Play className="w-3 h-3 text-emerald-500 fill-emerald-500" />
            预览运行态
          </button>

          <button 
            onClick={() => alert('🚀 正在部署并全网发布该主数据模型快照...')}
            className="px-4 py-1.5 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm hover:shadow-blue-500/10 flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Send className="w-3 h-3" />
            发布模型
          </button>
        </div>
      </div>

      {/* Main 3-Column Bento Board Layout */}
      <div className="grid grid-cols-12 gap-4">
        
        {/* ================= COLUMN 1: LEFT SUB-INFO (Width 2/12) ================= */}
        <div className="col-span-12 lg:col-span-2 space-y-4">
          
          {/* Current Model Stats card */}
          <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-3xs space-y-3">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-500" /> 当前模型
            </h3>
            
            <div className="space-y-2 text-[11.5px]">
              <div>
                <span className="text-slate-400 font-bold block mb-0.5">名称：</span>
                <span className="font-extrabold text-slate-800 leading-tight block">{modelInfo.name}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block mb-0.5">类型：</span>
                <span className="font-mono bg-blue-50/50 text-blue-700 px-1.5 py-0.2 rounded font-bold">DKN 模型</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block mb-0.5">所属域：</span>
                <span className="font-semibold text-slate-750">{modelInfo.domain}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block mb-0.5">状态：</span>
                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-1.5 py-0.2 rounded font-extrabold text-[10.5px]">
                  <span className="w-1 h-1 rounded-full bg-amber-500"></span>
                  草稿
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block mb-0.5">最近更新：</span>
                <span className="font-mono text-slate-500 text-[10.5px]">{modelInfo.updated}</span>
              </div>
            </div>
          </div>

          {/* Model Health score card */}
          <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-3xs space-y-3.5">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-500" /> 模型健康度
            </h3>

            <div className="flex flex-col items-center justify-center py-1">
              <div className="relative w-20 h-20 flex items-center justify-center">
                {/* Embedded SVG circular progress circle */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle 
                    cx="40" 
                    cy="40" 
                    r="34" 
                    stroke="#f1f5f9" 
                    strokeWidth="6.5" 
                    fill="transparent" 
                  />
                  <circle 
                    cx="40" 
                    cy="40" 
                    r="34" 
                    stroke="url(#healthGrad)" 
                    strokeWidth="6.5" 
                    fill="transparent" 
                    strokeDasharray={2 * Math.PI * 34}
                    strokeDashoffset={2 * Math.PI * 34 * (1 - 0.86)}
                    strokeLinecap="round"
                    className="transition-all duration-1000 animate-pulse-slow"
                  />
                  <defs>
                    <linearGradient id="healthGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute text-center">
                  <p className="text-base font-black text-slate-800 leading-none">86%</p>
                  <p className="text-[8px] text-slate-400 font-bold mt-1 scale-90">结构完整</p>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-[11px] border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold">可发布性</span>
                <span className="px-1.5 py-0.2 bg-amber-50 text-amber-700 rounded font-black text-[10px]">
                  中等
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold">治理风险</span>
                <span className="px-1.5 py-0.2 bg-rose-50 text-rose-700 border border-rose-100 rounded font-black text-[10px]">
                  3 项
                </span>
              </div>
            </div>
          </div>

          {/* Quick Access grids */}
          <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-3xs space-y-3">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Network className="w-3.5 h-3.5 text-indigo-500" /> 快速入口
            </h3>
            
            <div className="grid grid-cols-2 gap-1.5">
              <button 
                onClick={() => onNavigate('object_model')}
                className="p-2 border border-slate-150 hover:bg-blue-50/50 hover:border-blue-300 rounded-lg flex flex-col items-center justify-center text-center cursor-pointer transition-all"
              >
                <Database className="w-4 h-4 text-blue-500 mb-1" />
                <span className="text-[10px] font-bold text-slate-650">查看对象</span>
              </button>
              
              <button 
                onClick={() => onNavigate('relation_model')}
                className="p-2 border border-slate-150 hover:bg-blue-50/50 hover:border-blue-300 rounded-lg flex flex-col items-center justify-center text-center cursor-pointer transition-all"
              >
                <Network className="w-4 h-4 text-emerald-500 mb-1" />
                <span className="text-[10px] font-bold text-slate-650">查看关系</span>
              </button>

              <button 
                onClick={() => onNavigate('change_release')}
                className="p-2 border border-slate-150 hover:bg-blue-50/50 hover:border-blue-300 rounded-lg flex flex-col items-center justify-center text-center cursor-pointer transition-all"
              >
                <ShieldCheck className="w-4 h-4 text-amber-500 mb-1" />
                <span className="text-[10px] font-bold text-slate-650">查看发布</span>
              </button>

              <button 
                onClick={() => onNavigate('knowledge_network')}
                className="p-2 border border-slate-150 hover:bg-blue-50/50 hover:border-blue-300 rounded-lg flex flex-col items-center justify-center text-center cursor-pointer transition-all"
              >
                <Eye className="w-4 h-4 text-indigo-500 mb-1" />
                <span className="text-[10px] font-bold text-slate-650">查看运行</span>
              </button>
            </div>
          </div>

        </div>

        {/* ================= COLUMN 2: CENTER WORKSPACE (Width 7/12) ================= */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          
          {/* Main Horizontal Tab Header Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-1 shadow-3xs flex items-center justify-between flex-wrap gap-1">
            <div className="flex items-center space-x-1 overflow-x-auto scrollbar-none py-0.5 px-1 max-w-full">
              {tabs.map((tab) => {
                const isActive = tab === activeSubTab;
                return (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveSubTab(tab);
                      if (tab === '对象模型') onNavigate('object_model');
                      else if (tab === '关系模型') onNavigate('relation_model');
                      else if (tab === '函数') onNavigate('capability_binding');
                      else if (tab === '动作') onNavigate('action_model');
                      else if (tab === '流程') onNavigate('workflow_orchestration');
                      else if (tab === '发布') onNavigate('change_release');
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
            <div className="hidden sm:flex items-center gap-1.5 pr-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-mono font-bold text-slate-400">Sandbox.Active</span>
            </div>
          </div>

          {/* 4 Dynamic KPI Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-3xs flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 text-blue-650 rounded-lg">
                <Database className="w-5 h-5 text-blue-600 animate-pulse-slow" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400">对象类型</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-extrabold text-slate-900 leading-none">9</span>
                  <span className="text-[9px] font-bold text-slate-400 leading-none">类</span>
                </div>
                <p className="text-[9px] text-slate-450 mt-1 truncate">覆盖分类核心业务对象</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-3xs flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-650 rounded-lg">
                <Network className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400">关系类型</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-extrabold text-slate-900 leading-none">14</span>
                  <span className="text-[9px] font-bold text-slate-400 leading-none">项</span>
                </div>
                <p className="text-[9px] text-slate-450 mt-1 truncate">语义级统一关联映射</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-3xs flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-650 rounded-lg">
                <Cpu className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400">动作类型</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-extrabold text-slate-900 leading-none">12</span>
                  <span className="text-[9px] font-bold text-slate-400 leading-none">个</span>
                </div>
                <p className="text-[9px] text-slate-450 mt-1 truncate">驱动质量治理自动化</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-3xs flex items-center gap-3">
              <div className="p-2.5 bg-sky-50 text-sky-650 rounded-lg">
                <Code className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400">函数 / 流程</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-extrabold text-slate-900 leading-none">8</span>
                  <span className="text-[10px] font-bold text-slate-300">/</span>
                  <span className="text-lg font-bold text-slate-650 leading-none">4</span>
                </div>
                <p className="text-[9px] text-slate-450 mt-1 truncate">服务编排与语义研判</p>
              </div>
            </div>

          </div>

          {/* SECTION: Object Model Table + Relationship SVG flowchart side-by-side */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Left box: Object Model Overview Table */}
            <div className="md:col-span-6 bg-white rounded-xl border border-slate-200 shadow-3xs overflow-hidden flex flex-col justify-between">
              
              <div>
                <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-700 p-1 rounded-md">
                      <Database className="w-3.5 h-3.5" />
                    </span>
                    <h3 className="font-extrabold text-slate-850 text-xs">对象模型总览</h3>
                  </div>
                  <button 
                    onClick={() => onNavigate('object_model')}
                    className="text-[10px] font-black text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer"
                  >
                    进入对象模型 <ArrowRight className="w-2.5 h-2.5" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] font-sans">
                    <thead>
                      <tr className="bg-slate-50/50 text-slate-400 font-bold border-b border-slate-100">
                        <th className="py-2.5 px-3">对象名</th>
                        <th className="py-2.5 px-2 text-center">状态</th>
                        <th className="py-2.5 px-2 text-center">属性数</th>
                        <th className="py-2.5 px-2 text-center">动作数</th>
                        <th className="py-2.5 px-2 text-center">函数数</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {objectTypes.map((obj, i) => (
                        <tr 
                          key={obj.name}
                          onClick={() => onNavigate('object_model', obj.name)}
                          className="hover:bg-slate-50/40 transition-colors cursor-pointer group"
                        >
                          <td className="py-2 px-3 font-semibold text-slate-700 flex items-center gap-1.5 max-w-[130px] truncate">
                            {obj.isStarred && (
                              <Sparkle className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                            )}
                            <span className="group-hover:text-blue-600 transition-colors">{obj.name}</span>
                          </td>
                          <td className="py-2 px-2 text-center">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 bg-emerald-50 text-emerald-700 rounded-md text-[9px] font-black leading-none">
                              <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                              {obj.status}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-center font-mono font-bold text-slate-600">{obj.attrs}</td>
                          <td className="py-2 px-2 text-center font-mono text-slate-500">{obj.actions}</td>
                          <td className="py-2 px-2 text-center font-mono text-slate-500">{obj.functions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Right box: Relationship flow canvas (mockup replication via gorgeous SVG nodes) */}
            <div className="md:col-span-6 bg-white rounded-xl border border-slate-200 shadow-3xs flex flex-col justify-between">
              
              <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-100 text-emerald-700 p-1 rounded-md">
                    <Network className="w-3.5 h-3.5" />
                  </span>
                  <h3 className="font-extrabold text-slate-850 text-xs">关系模型总览</h3>
                </div>
                <button 
                  onClick={() => onNavigate('relation_model')}
                  className="text-[10px] font-black text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer"
                >
                  进入关系模型 <ArrowRight className="w-2.5 h-2.5" />
                </button>
              </div>

              {/* Graphical Canvas Mocking the exact structure of the flowchart in the image */}
              <div className="flex-1 relative min-h-[300px] bg-slate-50/25 flex items-center justify-center p-4">
                
                {/* SVG connectors layer */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <marker id="dkn-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#94a3b8" />
                    </marker>
                    <marker id="dkn-arrow-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#3b82f6" />
                    </marker>
                  </defs>

                  {/* Flow 1: DataSource -> Dataset -> Field -> DataQuality */}
                  <line x1="50" y1="50" x2="140" y2="50" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#dkn-arrow)" />
                  <text x="95" y="42" textAnchor="middle" fill="#64748b" className="text-[9px] font-mono font-bold">contains</text>

                  <line x1="180" y1="50" x2="250" y2="50" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#dkn-arrow)" />
                  <text x="215" y="42" textAnchor="middle" fill="#64748b" className="text-[9px] font-mono font-bold">contains</text>

                  <line x1="290" y1="50" x2="350" y2="50" stroke="#3b82f6" strokeWidth="1.5" markerEnd="url(#dkn-arrow-blue)" />
                  <text x="320" y="42" textAnchor="middle" fill="#2563eb" className="text-[9px] font-mono font-semibold">has_quality</text>

                  {/* Flow 2: Dataset -> Rule & Field -> Mapping */}
                  {/* From Field (270, 50) straight down to Mapping (270, 180) */}
                  <line x1="270" y1="75" x2="270" y2="155" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#dkn-arrow)" strokeDasharray="3 3" />
                  <text x="235" y="120" textAnchor="middle" fill="#64748b" className="text-[9px] font-mono font-semibold">mapped_to</text>

                  {/* From Dataset (160, 50) down to Rule (160, 180) */}
                  <line x1="160" y1="75" x2="160" y2="155" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#dkn-arrow)" />
                  <text x="125" y="120" textAnchor="middle" fill="#64748b" className="text-[9px] font-mono font-semibold">governed_by</text>

                  {/* From Evidence (370, 180) left to Mapping (275, 180) */}
                  <line x1="355" y1="180" x2="305" y2="180" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#dkn-arrow)" />
                  <text x="330" y="172" textAnchor="middle" fill="#64748b" className="text-[9px] font-mono font-semibold">supported_by</text>
                </svg>

                {/* Nodes rendering with precise absolute positioning */}
                {/* TOP ROW: DataSource -> Dataset -> Field -> DataQuality */}
                <div 
                  onClick={() => onNavigate('object_model', 'DataSource')}
                  className="absolute top-6 left-4 bg-white border border-slate-200 hover:border-blue-500 rounded-lg p-2 flex flex-col items-center w-20 shadow-4xs cursor-pointer hover:shadow-2xs transition-all"
                >
                  <span className="p-1.5 bg-blue-50 rounded text-blue-600 mb-1">
                    <Database className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-[9px] font-black font-mono tracking-tight text-slate-800">DataSource</span>
                </div>

                <div 
                  onClick={() => onNavigate('object_model', 'Dataset')}
                  className="absolute top-6 left-32 bg-white border border-slate-200 hover:border-emerald-500 rounded-lg p-2 flex flex-col items-center w-20 shadow-4xs cursor-pointer hover:shadow-2xs transition-all"
                >
                  <span className="p-1.5 bg-emerald-50 rounded text-emerald-600 mb-1 col-span-12">
                    <Layers className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-[9px] font-black font-mono tracking-tight text-slate-800">Dataset</span>
                </div>

                <div 
                  onClick={() => onNavigate('object_model', 'Field')}
                  className="absolute top-6 left-60 bg-white border-2 border-blue-600 rounded-lg p-2 flex flex-col items-center w-20 shadow-3xs cursor-pointer hover:shadow-2xs transition-all ring-4 ring-blue-50"
                >
                  <span className="p-1.5 bg-blue-50 rounded text-blue-600 mb-1">
                    <Code className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-[9px] font-black font-mono tracking-tight text-blue-700">Field</span>
                </div>

                <div 
                  onClick={() => onNavigate('object_model', 'DataQuality')}
                  className="absolute top-6 left-84 bg-white border border-slate-200 hover:border-amber-500 rounded-lg p-2 flex flex-col items-center w-20 shadow-4xs cursor-pointer hover:shadow-2xs transition-all"
                >
                  <span className="p-1.5 bg-amber-50 rounded text-amber-600 mb-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-[9px] font-black font-mono tracking-tight text-slate-800">DataQuality</span>
                </div>

                {/* BOTTOM ROW: Rule & Mapping & Evidence */}
                <div 
                  onClick={() => onNavigate('object_model', 'Rule')}
                  className="absolute bottom-6 left-32 bg-white border border-slate-200 hover:border-purple-500 rounded-lg p-2 flex flex-col items-center w-20 shadow-4xs cursor-pointer hover:shadow-2xs transition-all"
                >
                  <span className="p-1.5 bg-purple-50 rounded text-purple-600 mb-1">
                    <Settings className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-[9px] font-black font-mono tracking-tight text-slate-800">Rule</span>
                </div>

                <div 
                  onClick={() => onNavigate('object_model', 'Mapping')}
                  className="absolute bottom-6 left-60 bg-white border-2 border-emerald-500 rounded-lg p-2 flex flex-col items-center w-20 shadow-3xs cursor-pointer hover:shadow-2xs transition-all ring-4 ring-emerald-50"
                >
                  <span className="p-1.5 bg-emerald-50 rounded text-emerald-600 mb-1">
                    <Network className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-[9px] font-black font-mono tracking-tight text-emerald-700">Mapping</span>
                </div>

                <div 
                  onClick={() => onNavigate('object_model', 'Evidence')}
                  className="absolute bottom-6 left-84 bg-white border border-slate-200 hover:border-amber-500 rounded-lg p-2 flex flex-col items-center w-20 shadow-4xs cursor-pointer hover:shadow-2xs transition-all"
                >
                  <span className="p-1.5 bg-amber-50 rounded text-amber-600 mb-1">
                    <Info className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-[9px] font-black font-mono tracking-tight text-slate-800">Evidence</span>
                </div>

              </div>

            </div>

          </div>

          {/* SECTION: Actions & Functions Overview + Workflow & Permissions Overview */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Left box: Actions & Functions Overview (Split Column Layout) */}
            <div className="md:col-span-6 bg-white rounded-xl border border-slate-200 shadow-3xs overflow-hidden flex flex-col justify-between">
              
              <div>
                <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="bg-indigo-100 text-indigo-700 p-1 rounded-md">
                      <Cpu className="w-3.5 h-3.5" />
                    </span>
                    <h3 className="font-extrabold text-slate-850 text-xs">动作与函数概览</h3>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onNavigate('action_model')}
                      className="text-[10px] font-black text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer"
                    >
                      进入动作 <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                    <span className="text-slate-300">|</span>
                    <button 
                      onClick={() => onNavigate('capability_binding')}
                      className="text-[10px] font-black text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer"
                    >
                      进入函数 <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>

                {/* Sub split blocks */}
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                  
                  {/* Sub-table A: 默认动作类型 */}
                  <div className="p-2 space-y-2">
                    <h4 className="text-[10.5px] font-bold text-slate-400 bg-slate-50 p-1 rounded">默认动作类型</h4>
                    <div className="divide-y divide-slate-100 text-[10.5px]">
                      {actionTypes.slice(0, 8).map(act => (
                        <div key={act.name} className="py-1.5 flex items-center justify-between group">
                          <div>
                            <span 
                              onClick={() => handleActionClick(act.name)}
                              className="font-mono font-bold text-slate-700 group-hover:text-blue-600 transition-colors cursor-pointer"
                            >
                              {act.name}
                            </span>
                            <span className="text-[9px] text-slate-400 block">目标: {act.target}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={`px-1 rounded text-[9.5px] font-bold ${
                              act.risk === '高' 
                                ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                                : act.risk === '中'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-slate-105 text-slate-500 bg-slate-50'
                            }`}>
                              {act.risk}
                            </span>
                            <span className="bg-emerald-50 text-emerald-700 font-bold text-[9px] px-1 rounded">启用</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sub-table B: 默认函数 */}
                  <div className="p-2 space-y-2">
                    <h4 className="text-[10.5px] font-bold text-slate-400 bg-slate-50 p-1 rounded">默认函数</h4>
                    <div className="divide-y divide-slate-100 text-[10.5px]">
                      {functionTypes.map(func => (
                        <div key={func.name} className="py-2.5 flex items-center justify-between group">
                          <div>
                            <span className="font-mono font-bold text-slate-700 hover:text-blue-600 cursor-pointer block">{func.name}</span>
                            <span className="text-[9.5px] text-slate-450 block">类型: {func.type}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium font-mono shrink-0">
                            绑定数: <span className="font-bold text-slate-850 font-sans">{func.params}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

            </div>

            {/* Right box: Workflow & Permissions Overview */}
            <div className="md:col-span-6 bg-white rounded-xl border border-slate-200 shadow-3xs overflow-hidden flex flex-col justify-between">
              
              <div>
                <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="bg-sky-100 text-sky-700 p-1 rounded-md">
                      <Workflow className="w-3.5 h-3.5" />
                    </span>
                    <h3 className="font-extrabold text-slate-850 text-xs">流程与权限概览</h3>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onNavigate('workflow_orchestration')}
                      className="text-[10px] font-black text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer"
                    >
                      进入流程 <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                    <span className="text-slate-300">|</span>
                    <button 
                      onClick={() => alert('🔒 管理员已锁定权限，请在IAM中心修改。')}
                      className="text-[10px] font-black text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer"
                    >
                      进入策略 <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                  
                  {/* Default Workflows sub list */}
                  <div className="p-2 space-y-2">
                    <h4 className="text-[10.5px] font-bold text-slate-400 bg-slate-50 p-1 rounded">默认 Workflow</h4>
                    <div className="divide-y divide-slate-100 text-[10.5px]">
                      {workflows.map(wf => (
                        <div key={wf.name} className="py-2 flex items-center justify-between group">
                          <div>
                            <span 
                              onClick={() => onNavigate('workflow_orchestration')}
                              className="font-bold text-slate-700 group-hover:text-blue-600 transition-colors cursor-pointer"
                            >
                              {wf.name}
                            </span>
                            <span className="text-[9px] text-slate-400 block font-sans">依赖对象数: {wf.deps}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[9.5px] shrink-0">
                            <span className="font-mono text-slate-500 font-bold">{wf.steps}步</span>
                            <span className="bg-emerald-50 text-emerald-700 font-black px-1 rounded text-[9.3px]">启用</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Permissions Scope sub list */}
                  <div className="p-2 space-y-2">
                    <h4 className="text-[10.5px] font-bold text-slate-400 bg-slate-50 p-1 rounded">权限策略摘要</h4>
                    <div className="divide-y divide-slate-100 text-[10.5px]">
                      {permissions.map(perm => (
                        <div key={perm.role} className="py-2 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-750 block">{perm.role}</span>
                            <span className="text-[9.5px] text-slate-500 font-medium block leading-none">{perm.scope}</span>
                          </div>
                          <span className="text-[9.5px] text-slate-400 font-mono">IAM映射</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

            </div>

          </div>

          {/* SECTION: Bottom width-wide Release Readiness & Validation Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-3xs overflow-hidden">
            <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="bg-amber-100 text-amber-700 p-1 rounded-md">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </span>
                <h3 className="font-extrabold text-slate-850 text-xs">发布准备与校验摘要</h3>
              </div>
              <button 
                onClick={() => onNavigate('change_release')}
                className="text-[10px] font-black text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer"
              >
                进入发布记录 <ArrowRight className="w-2.5 h-2.5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-150 p-4 gap-4 md:gap-0">
              
              {/* Part 1: Validation Results */}
              <div className="space-y-2.5 pr-2">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">校验结果</h4>
                <div className="space-y-2 text-[11px] font-semibold">
                  <div className="flex items-center gap-2 text-emerald-650">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Object schema 校验通常通过</span>
                  </div>
                  <div className="flex items-center gap-2 text-amber-650">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>发现 2 条关系缺少 cardinality 约束</span>
                  </div>
                  <div className="flex items-center gap-2 text-amber-650">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>1 个函数未完全绑定动作参数</span>
                  </div>
                </div>
              </div>

              {/* Part 2: Recent Changes */}
              <div className="space-y-2.5 md:pl-4 pr-2 pt-4 md:pt-0">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">最近变更摘要</h4>
                <div className="space-y-2 text-[11px] text-slate-600 font-medium">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    <span className="font-bold">新增对象:</span> Evidence
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    <span className="font-bold">新增关系:</span> supported_by
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    <span className="font-bold">更新动作:</span> validate_mapping
                  </div>
                </div>
              </div>

              {/* Part 3: Deploy recommendations */}
              <div className="space-y-2.5 md:pl-4 pt-4 md:pt-0">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">发布建议</h4>
                <div className="space-y-2 text-[11px] text-slate-500 leading-relaxed font-semibold">
                  <div className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">💡</span>
                    <span>建议先补齐 Mapping 相关的完整性校验，规避下游应用抛错风险。</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">💡</span>
                    <span>建议检查 Field 的默认函数绑定，确保语义推荐正确性。</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* ================= COLUMN 3: RIGHT PANEL (Width 2/12) ================= */}
        <div className="col-span-12 lg:col-span-2 space-y-4">
          
          {/* Impact Analysis section */}
          <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-3xs space-y-3">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Network className="w-3.5 h-3.5 text-blue-500" /> 影响分析
            </h3>

            <div className="space-y-2.5 text-[11px] font-medium leading-relaxed">
              <div className="flex items-start gap-2">
                <span className="text-blue-500 font-bold mt-0.5">⏱</span>
                <span>修改对象模型将影响 <b className="text-blue-600">3条</b> 关系规则极其链式传递</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold mt-0.5">⚙</span>
                <span>修改 Action 将影响 <b className="text-emerald-600">2个</b> Workflow 工作流实例</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-slate-400 font-bold mt-0.5">📁</span>
                <span>当前模型已被 <b className="text-slate-700">5个</b> 外部查询模板或看板订阅引用</span>
              </div>
            </div>

            <button 
              onClick={() => alert('🔍 打开全局血缘与下游影响度计算链看板...')}
              className="w-full mt-2 py-1.5 border border-slate-250 hover:bg-slate-50 rounded-lg text-[10.5px] font-bold text-slate-700 cursor-pointer text-center block transition-all"
            >
              查看详细影响 →
            </button>
          </div>

          {/* AI Modeling suggestion panel */}
          <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-3xs space-y-3">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> AI 建模建议
            </h3>

            <div className="space-y-3 text-[11px]">
              <div className="p-2 bg-slate-50 rounded-lg space-y-1 bg-amber-50/20 border border-amber-100/50">
                <p className="font-bold text-slate-755 text-slate-800">建议为 Mapping 增加状态属性</p>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-slate-400">适配多源融合场景</span>
                  <button 
                    onClick={() => {
                      alert('✨ 已采纳！自动在变更集中装载 mapping.status 字段类型。');
                    }}
                    className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[9px] font-bold cursor-pointer transition-all"
                  >
                    采纳
                  </button>
                </div>
              </div>

              <div className="p-2 bg-slate-50 rounded-lg space-y-1">
                <p className="font-semibold text-slate-700">建议为 Rule 补充生效范围字段</p>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-slate-400">细化至表/过滤字段</span>
                  <button 
                    onClick={() => {
                      alert('✨ 已采纳！开启模型域 rule.scope 扩展实体建立。');
                    }}
                    className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[9px] font-bold cursor-pointer transition-all"
                  >
                    采纳
                  </button>
                </div>
              </div>

              <div className="p-2 bg-slate-50 rounded-lg space-y-1">
                <p className="font-semibold text-slate-700">建议将 Assertion 与 Task 建立关联</p>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-slate-400">闭环错误对齐逻辑</span>
                  <button 
                    onClick={() => {
                      alert('✨ 已采纳！配置默认任务回调钩子。');
                    }}
                    className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[9px] font-bold cursor-pointer transition-all"
                  >
                    采纳
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Risk panel */}
          <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-3xs space-y-3">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> 风险提示
            </h3>

            <div className="space-y-2 text-[11px] font-bold leading-relaxed text-slate-700">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                <span>当前模型尚未发布</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                <span>2 条 Link Type 缺少 cardinality 约束</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                <span>1 个 Workflow 缺少异常分支</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* STICKY STATUS TRACKING BAR (At the very bottom of current panel) */}
      <div className="bg-slate-900 text-white rounded-xl p-3.5 shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs tracking-wider">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-emerald-500/20">
            ✓
          </div>
          <div>
            <p className="font-extrabold text-[12px] text-slate-100 flex items-center gap-2">
              Validation 结果
            </p>
            <p className="text-[10px] text-slate-450 text-slate-400">主要校验基本通过，结构完整度较高</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-slate-350 text-slate-300 font-semibold bg-slate-800/60 px-4 py-1.5 rounded-lg border border-slate-800">
          <span className="flex items-center gap-1 text-slate-200"><b className="text-blue-400 font-black">Draft</b> 摘要</span>
          <span className="text-slate-500">|</span>
          <span>对象 <b className="text-white font-mono">9</b></span>
          <span>关系 <b className="text-white font-mono">14</b></span>
          <span>动作 <b className="text-white font-mono">12</b></span>
          <span>函数 <b className="text-white font-mono">8</b></span>
          <span>流程 <b className="text-white font-mono">4</b></span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-purple-500/10 border border-purple-500/30 text-purple-400 px-2.5 py-1 rounded-md font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span>
            Errors / Warnings: 0
          </div>
          <span className="text-slate-400 text-[11px] font-bold">
            3 条处理提醒需处理
          </span>
        </div>
      </div>

    </div>
  );
}
