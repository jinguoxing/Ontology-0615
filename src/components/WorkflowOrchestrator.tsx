import React, { useState } from 'react';
import {
  Database, Box, Shield, Play, Code, Search, Settings, Star, Info, Network,
  Zap, GitBranch, User, LayoutGrid, Expand, ArrowRight, Clock, CheckCircle,
  XCircle, RefreshCw, Download, ChevronDown, Check, AlertTriangle, HelpCircle,
  ChevronRight, Plus, Eye, Share2, Trash2, ArrowUpRight, Bell
} from 'lucide-react';
import { useUiStore } from '../store/uiStore';

// 节点属性的接口定义
interface NodeDetail {
  name: string;
  type: '事件' | '动作' | '函数' | '条件';
  desc: string;
  inputs?: string;
  outputs?: string;
  timeout: string;
  retry: string;
  upstream: string;
  downstream: string;
}

export default function WorkflowOrchestrator() {
  const navigate = useUiStore((s) => s.navigate);
  const isEditingActive = !useUiStore((s) => s.isLocked);
  const modelType = useUiStore((s) => s.modelType);

  // 状态变量
  const [searchTerm, setSearchTerm] = useState('');
  const [activeWorkflowId, setActiveWorkflowId] = useState('semantic_governance_workflow');
  const [selectedNodeId, setSelectedNodeId] = useState<string>('5');
  const [isWorkflowEnabled, setIsWorkflowEnabled] = useState(true);
  const [adoptedSuggestions, setAdoptedSuggestions] = useState<Record<number, boolean>>({});
  const [collapsedGroups, setCollapsedGroups] = useState({
    events: false,
    actions: false,
    functions: false,
    conditions: false
  });

  // 与设计图相符合的模拟工作流列表
  const workflows = [
    { id: 'source_ingestion_workflow', nameCn: '数据源入库清洗流程', status: '已发布', active: false },
    { id: 'semantic_governance_workflow', nameCn: '语义治理流程', status: '已发布', active: true },
    { id: 'quality_assessment_workflow', nameCn: '质量评估流程', status: '已发布', active: false },
    { id: 'mapping_validation_workflow', nameCn: '映射校验流程', status: '已发布', active: false },
    { id: 'model_publish_workflow', nameCn: '模型发布自动化流程', status: '已发布', active: false }
  ];

  // 节点详细属性数据库
  const nodeDetails: Record<string, NodeDetail> = {
    '1': {
      name: 'field_profile_ready',
      type: '事件',
      desc: '源端字段特征剖析完成事件，包含列元数据、数据类型及分布指标，用作整个治理流程的触发信号。',
      outputs: 'fieldProfile',
      timeout: '-',
      retry: '-',
      upstream: '-',
      downstream: 'infer_field_semantics'
    },
    '2': {
      name: 'infer_field_semantics',
      type: '动作',
      desc: '调用内置轻量级启发式算法，基于字段名、注释及样例数据快速提取前置语义标签与匹配猜测。',
      inputs: 'fieldProfile',
      outputs: 'semanticHint',
      timeout: '15 秒',
      retry: '3 次',
      upstream: 'field_profile_ready',
      downstream: 'field_semantic_classification'
    },
    '3': {
      name: 'field_semantic_classification',
      type: '函数',
      desc: '运行多模态语义分类模型，分析特征并返回标准实体类别及语义标签分类映射。',
      inputs: 'semanticHint',
      outputs: 'semanticClass',
      timeout: '25 秒',
      retry: '2 次',
      upstream: 'infer_field_semantics',
      downstream: 'generate_mapping'
    },
    '4': {
      name: 'generate_mapping',
      type: '动作',
      desc: '比对当前已有的本体实体及关系定义，将分类结果转化为候选语义映射规则。',
      inputs: 'semanticClass',
      outputs: 'mappingCandidate',
      timeout: '20 秒',
      retry: '2 次',
      upstream: 'field_semantic_classification',
      downstream: 'mapping_confidence_compute'
    },
    '5': {
      name: 'mapping_confidence_compute',
      type: '函数',
      desc: '用于字段语义理解、映射生成、断言构建和治理任务生成的标准流程。综合特征分布、字典重合度及大模型判别概率输出量化置信度。',
      inputs: 'mappingCandidate, fieldProfile, evidenceList',
      outputs: 'confidenceScore, confidenceLevel, recommendedAction',
      timeout: '30 秒',
      retry: '2 次',
      upstream: 'generate_mapping',
      downstream: 'confidence > 0.8'
    },
    '6': {
      name: 'confidence > 0.8',
      type: '条件',
      desc: '分流条件节点。如果计算所得置信度分值 confidenceScore 大于 0.8，则流向自动建言发布分支，否则流向人工审核分支。',
      inputs: 'confidenceScore',
      outputs: '布尔值 (是 / 否)',
      timeout: '-',
      retry: '-',
      upstream: 'mapping_confidence_compute',
      downstream: 'create_assertion (是) / mapping_review_required (否)'
    },
    '7A': {
      name: 'create_assertion',
      type: '动作',
      desc: '对于高置信度映射结果，系统在沙箱内自动创建实体对齐与关系对齐语义断言。',
      inputs: 'validatedMapping',
      outputs: 'assertion',
      timeout: '15 秒',
      retry: '2 次',
      upstream: 'confidence > 0.8 (是)',
      downstream: 'create_task'
    },
    '8A': {
      name: 'create_task',
      type: '动作',
      desc: '在任务中心自动创建后台运行的验证性审计任务，并在通过后打上自动确认标签。',
      inputs: 'assertion',
      outputs: 'task',
      timeout: '10 秒',
      retry: '1 次',
      upstream: 'create_assertion',
      downstream: 'publish_model'
    },
    '7B': {
      name: 'mapping_review_required',
      type: '事件',
      desc: '低置信度分值触发的阻塞式事件。将候选映射规则挂起至待办任务列表，由数据治理专员进行人工研判。',
      outputs: 'reviewDecision',
      timeout: '-',
      retry: '-',
      upstream: 'confidence > 0.8 (否)',
      downstream: 'validate_mapping'
    },
    '8B': {
      name: 'validate_mapping',
      type: '动作',
      desc: '接收人工研判的决策参数（同意、修改或驳回），对候选映射进行二次修订与确认，并产出经验证的映射规则。',
      inputs: 'mappingCandidate, reviewDecision',
      outputs: 'validatedMapping',
      timeout: '20 秒',
      retry: '2 次',
      upstream: 'mapping_review_required',
      downstream: 'publish_model'
    },
    '9': {
      name: 'publish_model',
      type: '动作',
      desc: '聚合自动断言任务与人工审核校验，最终将验证后的语义模型映射关系正式部署发布至 DKN 运行态实例中。',
      inputs: 'assertion, task',
      outputs: 'publishStatus',
      timeout: '45 秒',
      retry: '2 次',
      upstream: 'Join 汇总',
      downstream: '-'
    }
  };

  const activeNode = nodeDetails[selectedNodeId] || nodeDetails['5'];

  const toggleGroup = (key: 'events' | 'actions' | 'functions' | 'conditions') => {
    setCollapsedGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAdoptSuggestion = (id: number, text: string) => {
    setAdoptedSuggestions(prev => ({ ...prev, [id]: true }));
    alert(`已成功采纳建议: "${text}"！该节点已追加到编辑缓冲区。`);
  };

  return (
    <div className="min-h-screen font-sans bg-slate-50 flex flex-col -m-6" id="workflow-orchestrator-root">
      
      {/* ================= 顶部导航栏 (Semovix DRKN Studio) ================= */}
      <header className="bg-white border-b border-slate-200/80 h-14 shrink-0 flex items-center justify-between px-6 sticky top-0 z-40">
        
        {/* 左侧 Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
            </svg>
          </div>
          <span className="font-extrabold text-base text-slate-800 tracking-tight">Semovix DRKN Studio</span>
        </div>

        {/* 中间页签导航 */}
        <nav className="flex items-center h-full space-x-1">
          {[
            { label: '总览', view: 'dkn_overview' },
            { label: '模型画布', view: 'dkn_overview' },
            { label: '对象类型', view: 'dkn_object_model' },
            { label: '关系类型', view: 'relation_model' },
            { label: '动作类型', view: 'action_model' },
            { label: '能力绑定 / 函数', view: 'capability_binding' },
            { label: '流程编排', view: 'workflow_orchestration', active: true },
            { label: '版本管理', view: 'change_release' }
          ].map((tab) => (
            <button
              key={tab.label}
              onClick={() => navigate(tab.view)}
              className={`px-4 h-full text-xs font-bold transition-all relative flex items-center cursor-pointer ${
                tab.active 
                  ? 'text-blue-600 font-extrabold' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50/50'
              }`}
            >
              <span>{tab.label}</span>
              {tab.active && (
                <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-blue-600 rounded-t-full"></div>
              )}
            </button>
          ))}
        </nav>

        {/* 右侧全局操作区 */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => alert('💾 成功保存当前的流程编排草案！')}
            className="px-3.5 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200/80 hover:bg-slate-50 rounded-md transition-all shadow-3xs cursor-pointer"
          >
            保存草稿
          </button>
          <button 
            onClick={() => alert('🔍 流程逻辑分析通过，DAG无环且无冗余链路！')}
            className="px-3.5 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200/80 hover:bg-slate-50 rounded-md transition-all shadow-3xs cursor-pointer"
          >
            校验流程
          </button>
          <button 
            onClick={() => alert('🗺️ 生成并加载高清全景运行预览拓扑图成功！')}
            className="px-3.5 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200/80 hover:bg-slate-50 rounded-md transition-all shadow-3xs cursor-pointer"
          >
            预览运行图
          </button>
          <button 
            onClick={() => alert('🚀 正在将当前变更集推入发布队列中...')}
            className="px-4 py-1.5 text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-2xs hover:shadow-blue-500/10 transition-all cursor-pointer"
          >
            发布模型
          </button>

          <div className="h-5 w-px bg-slate-200 mx-1"></div>

          {/* 系统通知和人员管理 */}
          <div className="flex items-center gap-3.5">
            <button className="relative p-1.5 rounded-full hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-800 cursor-pointer">
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full flex items-center justify-center text-[7px] text-white"></span>
            </button>
            <button className="p-1.5 rounded-full hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-800 cursor-pointer">
              <HelpCircle className="w-4.5 h-4.5" />
            </button>
            <div className="flex items-center gap-1.5 pl-1.5">
              <div className="w-6.5 h-6.5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[11px] shadow-sm select-none">
                A
              </div>
              <span className="text-xs font-semibold text-slate-655 font-mono">admin</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>
        </div>

      </header>

      {/* ================= 子标题栏 ================= */}
      <section className="bg-white border-b border-slate-200/60 px-6 py-3 flex items-center justify-between shrink-0 shadow-3xs">
        <div className="flex items-center gap-2">
          <h1 className="text-[17px] font-black text-slate-900 tracking-tight">流程编排控制台 (Workflow Studio)</h1>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>编译 DRKN Ontology 中的动作与函数，形成可执行语义流程</span>
            <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
          </div>
        </div>
        <div>
          <span className="bg-blue-50 text-blue-700 text-[10.5px] font-black px-2.5 py-1 rounded-md border border-blue-150 shadow-3xs">
            DRKN 治理模型 · v1.2.0 草稿
          </span>
        </div>
      </section>

      {/* ================= 核心工作空间 ================= */}
      <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto w-full">
        
        {/* 上半部分：侧边栏、画布及详情面板 */}
        <div className="grid grid-cols-12 gap-6 items-stretch">
          
          {/* 左侧侧边栏 (工作流列表 + 节点资源) */}
          <div className="col-span-12 lg:col-span-3 xl:col-span-2.5 flex flex-col gap-5 shrink-0 min-w-[280px]">
            
            {/* A. 工作流列表 */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col h-[320px]">
              <div className="flex items-center justify-between mb-3 shrink-0">
                <span className="text-[13px] font-extrabold text-slate-800">A. 工作流列表</span>
                <span className="text-[10px] text-slate-400 font-bold">共 {workflows.length} 个</span>
              </div>

              <div className="flex gap-1.5 mb-3 shrink-0">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="搜索工作流"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-2 py-1.5 bg-slate-50 text-[11.5px] border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                  />
                </div>
                <button 
                  onClick={() => alert('新建工作流抽屉加载中...')}
                  className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer shrink-0 shadow-3xs"
                >
                  <Plus className="w-3.5 h-3.5" /> 新建
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
                {workflows
                  .filter(wf => wf.id.toLowerCase().includes(searchTerm.toLowerCase()) || wf.nameCn.includes(searchTerm))
                  .map((wf) => {
                    const isSelected = wf.id === activeWorkflowId;
                    return (
                      <div
                        key={wf.id}
                        onClick={() => {
                          setActiveWorkflowId(wf.id);
                          setSelectedNodeId('5'); // 默认重置为 selectedNode 5
                        }}
                        className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all flex items-center justify-between ${
                          isSelected 
                            ? 'bg-blue-50/60 border-blue-200/80 shadow-3xs' 
                            : 'bg-white border-slate-100 hover:border-slate-250 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-emerald-500' : 'bg-slate-350'}`}></div>
                          <div className="min-w-0">
                            <p className={`text-[12px] font-bold font-mono truncate leading-none ${isSelected ? 'text-blue-800' : 'text-slate-700'}`}>
                              {wf.id}
                            </p>
                            <span className="text-[10px] text-slate-400 font-medium leading-none block mt-1 truncate">
                              {wf.nameCn}
                            </span>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="flex gap-1 shrink-0 ml-1">
                            <span className="w-1.5 h-1.5 bg-slate-350 rounded-full"></span>
                            <span className="w-1.5 h-1.5 bg-slate-350 rounded-full"></span>
                          </div>
                        )}
                      </div>
                    );
                  })
                }
              </div>
            </div>

            {/* B. 可用节点资源 */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col h-[400px]">
              <div className="flex items-center justify-between mb-3 shrink-0 border-b border-slate-100 pb-2">
                <span className="text-[13px] font-extrabold text-slate-800">B. 可用节点资源</span>
                <div className="flex items-center gap-1 text-slate-400">
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-semibold">拖拽到画布</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
                {/* 事件触发器分类 */}
                <div className="border border-slate-100 rounded-lg overflow-hidden">
                  <button 
                    onClick={() => toggleGroup('events')}
                    className="w-full bg-slate-50/80 px-2.5 py-1.5 flex items-center justify-between text-[11px] font-bold text-slate-650 hover:bg-slate-100 transition-colors"
                  >
                    <span className="flex items-center gap-1.5">⚡ 事件触发器 (Events) <span className="text-[9.5px] text-slate-400">(3)</span></span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${collapsedGroups.events ? '-rotate-90' : ''}`} />
                  </button>
                  {!collapsedGroups.events && (
                    <div className="p-1.5 bg-white space-y-1">
                      {['field_profile_ready', 'dataset_scanned', 'mapping_review_required'].map(node => (
                        <div key={node} className="p-1.5 bg-slate-50 border border-slate-100 rounded text-[11px] font-mono font-medium text-slate-600 hover:border-blue-200 hover:bg-blue-50/20 cursor-grab active:cursor-grabbing transition-all flex items-center justify-between">
                          <span>{node}</span>
                          <Plus className="w-3 h-3 text-slate-400" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 动作类型分类 */}
                <div className="border border-slate-100 rounded-lg overflow-hidden">
                  <button 
                    onClick={() => toggleGroup('actions')}
                    className="w-full bg-slate-50/80 px-2.5 py-1.5 flex items-center justify-between text-[11px] font-bold text-slate-650 hover:bg-slate-100 transition-colors"
                  >
                    <span className="flex items-center gap-1.5">🎬 执行动作 (Actions) <span className="text-[9.5px] text-slate-400">(6)</span></span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${collapsedGroups.actions ? '-rotate-90' : ''}`} />
                  </button>
                  {!collapsedGroups.actions && (
                    <div className="p-1.5 bg-white space-y-1">
                      {['infer_field_semantics', 'generate_mapping', 'validate_mapping', 'create_assertion', 'create_task', 'publish_model'].map(node => (
                        <div key={node} className="p-1.5 bg-slate-50 border border-slate-100 rounded text-[11px] font-mono font-medium text-slate-600 hover:border-emerald-250 hover:bg-emerald-50/20 cursor-grab active:cursor-grabbing transition-all flex items-center justify-between">
                          <span>{node}</span>
                          <Plus className="w-3 h-3 text-slate-400" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 逻辑函数分类 */}
                <div className="border border-slate-100 rounded-lg overflow-hidden">
                  <button 
                    onClick={() => toggleGroup('functions')}
                    className="w-full bg-slate-50/80 px-2.5 py-1.5 flex items-center justify-between text-[11px] font-bold text-slate-650 hover:bg-slate-100 transition-colors"
                  >
                    <span className="flex items-center gap-1.5">⚙️ 计算函数 (Functions) <span className="text-[9.5px] text-slate-400">(3)</span></span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${collapsedGroups.functions ? '-rotate-90' : ''}`} />
                  </button>
                  {!collapsedGroups.functions && (
                    <div className="p-1.5 bg-white space-y-1">
                      {['field_semantic_classification', 'mapping_confidence_compute', 'quality_score_compute'].map(node => (
                        <div key={node} className="p-1.5 bg-slate-50 border border-slate-100 rounded text-[11px] font-mono font-medium text-slate-600 hover:border-purple-250 hover:bg-purple-50/20 cursor-grab active:cursor-grabbing transition-all flex items-center justify-between">
                          <span>{node}</span>
                          <Plus className="w-3 h-3 text-slate-400" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 判断条件分类 */}
                <div className="border border-slate-100 rounded-lg overflow-hidden">
                  <button 
                    onClick={() => toggleGroup('conditions')}
                    className="w-full bg-slate-50/80 px-2.5 py-1.5 flex items-center justify-between text-[11px] font-bold text-slate-650 hover:bg-slate-100 transition-colors"
                  >
                    <span className="flex items-center gap-1.5">⚖️ 分流条件 (Conditions) <span className="text-[9.5px] text-slate-400">(2)</span></span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${collapsedGroups.conditions ? '-rotate-90' : ''}`} />
                  </button>
                  {!collapsedGroups.conditions && (
                    <div className="p-1.5 bg-white space-y-1">
                      {['confidence > 0.8', 'score < threshold'].map(node => (
                        <div key={node} className="p-1.5 bg-slate-50 border border-slate-100 rounded text-[11px] font-mono font-medium text-slate-600 hover:border-amber-250 hover:bg-amber-50/20 cursor-grab active:cursor-grabbing transition-all flex items-center justify-between">
                          <span>{node}</span>
                          <Plus className="w-3 h-3 text-slate-400" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>

          </div>

          {/* 中间主画布区 */}
          <div className="col-span-12 lg:col-span-6 xl:col-span-6.5 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col h-[740px] relative overflow-hidden">
            
            {/* 画布顶部控制器 */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 shrink-0 z-10 bg-white">
              <div className="flex items-center gap-3">
                <span className="text-[14px] font-extrabold text-slate-800">流程设计画布 (Workflow Canvas)</span>
                <span className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  已保存 11:02:33
                </span>
              </div>
              <div className="flex items-center gap-1 border border-slate-200/80 rounded-lg p-0.5 shadow-3xs bg-white shrink-0 text-slate-600">
                <button 
                  onClick={() => alert('已自动梳理优化拓扑节点布局')}
                  className="px-2.5 py-1 text-[11px] font-bold hover:bg-slate-50 rounded flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-slate-400" /> 自动布局
                </button>
                <div className="w-px h-3.5 bg-slate-200"></div>
                <button className="p-1 hover:bg-slate-50 rounded cursor-pointer text-slate-400 hover:text-slate-700" title="缩小"><Clock className="w-3.5 h-3.5 rotate-180" /></button>
                <button className="p-1 hover:bg-slate-50 rounded cursor-pointer text-slate-400 hover:text-slate-700" title="放大"><Plus className="w-3.5 h-3.5" /></button>
                <button className="px-2 py-1 text-[11px] font-bold hover:bg-slate-50 rounded cursor-pointer transition-colors text-slate-500 hover:text-slate-800">适配画布</button>
                <div className="w-px h-3.5 bg-slate-200"></div>
                <button className="p-1 hover:bg-slate-50 rounded cursor-pointer text-slate-400 hover:text-slate-700" title="查看路径"><Network className="w-3.5 h-3.5" /></button>
                <button className="p-1 hover:bg-slate-50 rounded cursor-pointer text-slate-400 hover:text-slate-700" title="模拟运行"><Play className="w-3.5 h-3.5" /></button>
              </div>
            </div>

            {/* 点状网格背景画布 */}
            <div className="flex-1 rounded-xl bg-slate-50 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] relative overflow-auto p-4 select-none">
              
              {/* SVG 连接曲线 */}
              <svg className="absolute inset-0 w-[1000px] h-[650px] pointer-events-none" style={{ minWidth: '100%', minHeight: '100%' }}>
                <defs>
                  {/* 连接线箭头 */}
                  <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#cbd5e1" />
                  </marker>
                  <marker id="arrow-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#3b82f6" />
                  </marker>
                  <marker id="arrow-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#10b981" />
                  </marker>
                  <marker id="arrow-orange" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f97316" />
                  </marker>
                </defs>

                {/* 1 -> 2 */}
                <path d="M 195 90 H 250" fill="none" stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#arrow)" />
                {/* 2 -> 3 */}
                <path d="M 415 90 H 470" fill="none" stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#arrow)" />
                {/* 3 -> 4 */}
                <path d="M 635 90 H 690" fill="none" stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#arrow)" />

                {/* 4 -> 5: 弯曲向右下延伸至 Node 5 */}
                <path d="M 855 90 C 930 90, 930 205, 855 205" fill="none" stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#arrow)" />
                
                {/* 5 -> 6 */}
                <path d="M 675 205 H 565" fill="none" stroke="#3b82f6" strokeWidth="2" markerEnd="url(#arrow-blue)" />

                {/* 6 (Condition) 条件分流:
                    "否" 分支流向 7B mapping_review_required (左向直线) */}
                <path d="M 435 205 H 335" fill="none" stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#arrow)" />
                
                {/* "是" 分支流向 7A / 8A (向下折叠曲线) */}
                <path d="M 485 240 v 50 c 0 15, -100 15, -100 30 v 10" fill="none" stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#arrow)" />
                <path d="M 485 240 v 50 c 0 15, 100 15, 100 30 v 10" fill="none" stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#arrow)" />

                {/* 7B -> 8B */}
                <path d="M 250 240 V 330" fill="none" stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#arrow)" />

                {/* 8B -> 汇总 */}
                <path d="M 250 405 v 30 c 0 45, 160 45, 175 45" fill="none" stroke="#cbd5e1" strokeWidth="1.5" />

                {/* 7A -> 汇总 */}
                <path d="M 385 405 v 30 c 0 15, 60 15, 65 30" fill="none" stroke="#cbd5e1" strokeWidth="1.5" />

                {/* 8A -> 汇总 */}
                <path d="M 585 405 v 30 c 0 15, -120 15, -125 30" fill="none" stroke="#cbd5e1" strokeWidth="1.5" />

                {/* 汇总 -> 9 */}
                <path d="M 470 480 H 670" fill="none" stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#arrow)" />
              </svg>

              {/* 动态定位的流程拓扑节点 */}
              <div className="absolute inset-0 w-[1000px] h-[580px] pointer-events-none">
                
                {/* Node 1: 事件 (field_profile_ready) */}
                <div 
                  onClick={() => setSelectedNodeId('1')}
                  style={{ left: '35px', top: '50px' }}
                  className={`absolute w-[160px] bg-white border rounded-lg shadow-3xs p-2.5 flex flex-col cursor-pointer pointer-events-auto transition-all ${
                    selectedNodeId === '1' ? 'border-blue-600 ring-2 ring-blue-100 shadow-sm' : 'border-slate-200/80 hover:border-slate-350'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-4.5 h-4.5 rounded-full bg-blue-600 text-white text-[9.5px] font-bold flex items-center justify-center shrink-0">1</span>
                    <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wide">事件</span>
                  </div>
                  <span className="text-[11.5px] font-bold font-mono text-slate-800 truncate" title="field_profile_ready">field_profile_ready</span>
                  <span className="text-[9.5px] text-slate-400 font-medium mt-1">输出: fieldProfile</span>
                  <div className="absolute bottom-2 right-2 text-blue-500">
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </div>
                </div>

                {/* Node 2: 动作 (infer_field_semantics) */}
                <div 
                  onClick={() => setSelectedNodeId('2')}
                  style={{ left: '255px', top: '50px' }}
                  className={`absolute w-[160px] bg-white border rounded-lg shadow-3xs p-2.5 flex flex-col cursor-pointer pointer-events-auto transition-all ${
                    selectedNodeId === '2' ? 'border-blue-600 ring-2 ring-blue-100 shadow-sm' : 'border-slate-200/80 hover:border-slate-350'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-4.5 h-4.5 rounded-full bg-emerald-500 text-white text-[9.5px] font-bold flex items-center justify-center shrink-0">2</span>
                    <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wide">动作</span>
                  </div>
                  <span className="text-[11.5px] font-bold font-mono text-slate-800 truncate" title="infer_field_semantics">infer_field_semantics</span>
                  <span className="text-[9.5px] text-slate-400 font-medium mt-1">输入: fieldProfile</span>
                </div>

                {/* Node 3: 函数 (field_semantic_classification) */}
                <div 
                  onClick={() => setSelectedNodeId('3')}
                  style={{ left: '475px', top: '50px' }}
                  className={`absolute w-[160px] bg-white border rounded-lg shadow-3xs p-2.5 flex flex-col cursor-pointer pointer-events-auto transition-all ${
                    selectedNodeId === '3' ? 'border-blue-600 ring-2 ring-blue-100 shadow-sm' : 'border-slate-200/80 hover:border-slate-350'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-4.5 h-4.5 rounded-full bg-purple-500 text-white text-[9.5px] font-bold flex items-center justify-center shrink-0">3</span>
                    <span className="text-[10px] font-extrabold text-purple-600 uppercase tracking-wide">函数</span>
                  </div>
                  <span className="text-[11.5px] font-bold font-mono text-slate-800 truncate" title="field_semantic_classification">field_semantic_classification</span>
                  <span className="text-[9.5px] text-slate-400 font-medium mt-1">输入: semanticHint</span>
                </div>

                {/* Node 4: 动作 (generate_mapping) */}
                <div 
                  onClick={() => setSelectedNodeId('4')}
                  style={{ left: '695px', top: '50px' }}
                  className={`absolute w-[160px] bg-white border rounded-lg shadow-3xs p-2.5 flex flex-col cursor-pointer pointer-events-auto transition-all ${
                    selectedNodeId === '4' ? 'border-blue-600 ring-2 ring-blue-100 shadow-sm' : 'border-slate-200/80 hover:border-slate-350'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-4.5 h-4.5 rounded-full bg-emerald-500 text-white text-[9.5px] font-bold flex items-center justify-center shrink-0">4</span>
                    <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wide">动作</span>
                  </div>
                  <span className="text-[11.5px] font-bold font-mono text-slate-800 truncate" title="generate_mapping">generate_mapping</span>
                  <span className="text-[9.5px] text-slate-400 font-medium mt-1">输入: semanticClass</span>
                </div>

                {/* Node 5: 函数 (mapping_confidence_compute) */}
                <div 
                  onClick={() => setSelectedNodeId('5')}
                  style={{ left: '675px', top: '160px', width: '180px' }}
                  className={`absolute bg-white border rounded-lg shadow-md p-2.5 flex flex-col cursor-pointer pointer-events-auto transition-all ${
                    selectedNodeId === '5' 
                      ? 'border-blue-600 ring-4 ring-blue-100 shadow-lg' 
                      : 'border-slate-300 hover:border-slate-400 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-4.5 h-4.5 rounded-full bg-purple-600 text-white text-[9.5px] font-bold flex items-center justify-center shrink-0">5</span>
                      <span className="text-[10px] font-extrabold text-purple-600 uppercase tracking-wide">函数</span>
                    </div>
                    {/* 蓝色勾选徽章 */}
                    <span className="w-4.5 h-4.5 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-3xs">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  </div>
                  <span className="text-[11.5px] font-bold font-mono text-slate-900 truncate" title="mapping_confidence_compute">mapping_confidence_compute</span>
                  <span className="text-[9.5px] text-slate-400 font-medium mt-1">输入: mappingCandidate, fieldProfile</span>
                  <span className="text-[9.5px] text-slate-400 font-medium block mt-0.5">输出: confidenceScore, recommendedAction</span>
                </div>

                {/* Node 6: 条件 (confidence > 0.8) */}
                <div 
                  onClick={() => setSelectedNodeId('6')}
                  style={{ left: '435px', top: '160px' }}
                  className="absolute pointer-events-auto cursor-pointer"
                >
                  {/* 条件菱形节点框架 */}
                  <div className="relative w-[130px] h-[90px] flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 130 90">
                      <polygon 
                        points="65,2 128,45 65,88 2,45" 
                        fill="#fff" 
                        stroke={selectedNodeId === '6' ? '#2563eb' : '#f97316'} 
                        strokeWidth={selectedNodeId === '6' ? '2.5' : '1.5'} 
                        className="filter drop-shadow-3xs"
                      />
                    </svg>
                    
                    {/* 条件内部文本 */}
                    <div className="relative z-10 flex flex-col items-center justify-center text-center p-2 mt-0.5">
                      <div className="flex items-center gap-1">
                        <span className="w-3.5 h-3.5 rounded-full bg-orange-500 text-white text-[8px] font-bold flex items-center justify-center">6</span>
                        <span className="text-[9px] font-extrabold text-orange-600 uppercase tracking-wide leading-none">条件</span>
                      </div>
                      <span className="text-[10px] font-bold font-mono text-slate-800 leading-none mt-1">confidence &gt; 0.8</span>
                      <span className="text-[8px] text-slate-400 font-semibold block mt-0.5">输入: confidenceScore</span>
                    </div>
                  </div>

                  {/* 分流标签 */}
                  {/* 左分支 "否" */}
                  <span className="absolute -left-12 top-7 text-[9.5px] font-bold text-slate-500 bg-white border border-slate-200 px-1 rounded-sm shadow-3xs whitespace-nowrap">
                    否 (≤ 0.8)
                  </span>
                  {/* 下分支 "是" */}
                  <span className="absolute left-[68px] bottom-[-22px] text-[9.5px] font-bold text-slate-500 bg-white border border-slate-200 px-1 rounded-sm shadow-3xs whitespace-nowrap">
                    是 (&gt; 0.8)
                  </span>
                </div>

                {/* Node 7B: 事件/人工研判 (mapping_review_required) */}
                <div 
                  onClick={() => setSelectedNodeId('7B')}
                  style={{ left: '150px', top: '160px', width: '185px' }}
                  className={`absolute bg-white border rounded-lg shadow-3xs p-2.5 flex flex-col cursor-pointer pointer-events-auto transition-all ${
                    selectedNodeId === '7B' ? 'border-blue-600 ring-2 ring-blue-100 shadow-sm' : 'border-slate-200/80 hover:border-slate-350'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-4.5 h-4.5 rounded-full bg-blue-600 text-white text-[9.5px] font-bold flex items-center justify-center shrink-0">7B</span>
                    <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wide">事件</span>
                  </div>
                  <span className="text-[11.5px] font-bold font-mono text-slate-800 truncate" title="mapping_review_required">mapping_review_required</span>
                  <span className="text-[10px] text-slate-500 font-semibold mt-0.5">人工审核</span>
                  <span className="text-[9.5px] text-slate-400 font-medium mt-1">输出: reviewDecision</span>
                  <div className="absolute bottom-2.5 right-2.5 text-slate-400 bg-slate-50 w-6.5 h-6.5 border border-slate-100 rounded-full flex items-center justify-center shadow-3xs">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                </div>

                {/* Node 8B: 动作 (validate_mapping) */}
                <div 
                  onClick={() => setSelectedNodeId('8B')}
                  style={{ left: '150px', top: '330px', width: '185px' }}
                  className={`absolute bg-white border rounded-lg shadow-3xs p-2.5 flex flex-col cursor-pointer pointer-events-auto transition-all ${
                    selectedNodeId === '8B' ? 'border-blue-600 ring-2 ring-blue-100 shadow-sm' : 'border-slate-200/80 hover:border-slate-350'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-4.5 h-4.5 rounded-full bg-emerald-500 text-white text-[9.5px] font-bold flex items-center justify-center shrink-0">8B</span>
                    <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wide">动作</span>
                  </div>
                  <span className="text-[11.5px] font-bold font-mono text-slate-800 truncate" title="validate_mapping">validate_mapping</span>
                  <span className="text-[9.5px] text-slate-400 font-medium mt-1 leading-tight">输入: mappingCandidate,<br />reviewDecision</span>
                  <span className="text-[9.5px] text-slate-400 font-medium mt-0.5">输出: validatedMapping</span>
                </div>

                {/* Node 7A: 动作 (create_assertion) */}
                <div 
                  onClick={() => setSelectedNodeId('7A')}
                  style={{ left: '305px', top: '330px' }}
                  className={`absolute w-[160px] bg-white border rounded-lg shadow-3xs p-2.5 flex flex-col cursor-pointer pointer-events-auto transition-all ${
                    selectedNodeId === '7A' ? 'border-blue-600 ring-2 ring-blue-100 shadow-sm' : 'border-slate-200/80 hover:border-slate-350'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-4.5 h-4.5 rounded-full bg-emerald-500 text-white text-[9.5px] font-bold flex items-center justify-center shrink-0">7A</span>
                    <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wide">动作</span>
                  </div>
                  <span className="text-[11.5px] font-bold font-mono text-slate-800 truncate" title="create_assertion">create_assertion</span>
                  <span className="text-[9.5px] text-slate-400 font-medium mt-1">输入: validatedMapping</span>
                  <span className="text-[9.5px] text-slate-400 font-medium mt-0.5">输出: assertion</span>
                </div>

                {/* Node 8A: 动作 (create_task) */}
                <div 
                  onClick={() => setSelectedNodeId('8A')}
                  style={{ left: '505px', top: '330px' }}
                  className={`absolute w-[160px] bg-white border rounded-lg shadow-3xs p-2.5 flex flex-col cursor-pointer pointer-events-auto transition-all ${
                    selectedNodeId === '8A' ? 'border-blue-600 ring-2 ring-blue-100 shadow-sm' : 'border-slate-200/80 hover:border-slate-350'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-4.5 h-4.5 rounded-full bg-emerald-500 text-white text-[9.5px] font-bold flex items-center justify-center shrink-0">8A</span>
                    <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wide">动作</span>
                  </div>
                  <span className="text-[11.5px] font-bold font-mono text-slate-800 truncate" title="create_task">create_task</span>
                  <span className="text-[9.5px] text-slate-400 font-medium mt-1">输入: assertion</span>
                  <span className="text-[9.5px] text-slate-400 font-medium mt-0.5">输出: task</span>
                </div>

                {/* 汇总节点 */}
                <div 
                  style={{ left: '435px', top: '465px' }}
                  className="absolute w-8 h-8 rounded-full border border-slate-300 bg-white flex flex-col items-center justify-center shadow-3xs select-none"
                >
                  <span className="text-[7.5px] font-black text-slate-400 leading-none">Join</span>
                  <span className="text-[8.5px] font-extrabold text-slate-600 leading-none mt-0.5">汇总</span>
                </div>

                {/* Node 9: 动作 (publish_model) */}
                <div 
                  onClick={() => setSelectedNodeId('9')}
                  style={{ left: '625px', top: '445px' }}
                  className={`absolute w-[160px] bg-white border rounded-lg shadow-3xs p-2.5 flex flex-col cursor-pointer pointer-events-auto transition-all ${
                    selectedNodeId === '9' ? 'border-blue-600 ring-2 ring-blue-100 shadow-sm' : 'border-slate-200/80 hover:border-slate-350'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-4.5 h-4.5 rounded-full bg-emerald-500 text-white text-[9.5px] font-bold flex items-center justify-center shrink-0">9</span>
                    <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wide">动作</span>
                  </div>
                  <span className="text-[11.5px] font-bold font-mono text-slate-800 truncate" title="publish_model">publish_model</span>
                  <span className="text-[9.5px] text-slate-400 font-medium mt-1">输入: assertion, task</span>
                  <span className="text-[9.5px] text-slate-400 font-medium mt-0.5">输出: publishStatus</span>
                  <div className="absolute bottom-2 right-2 text-slate-400">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500 animate-pulse">
                      <path d="M4.5 16.5c-1.5 1.26-2.5 3.19-2.5 5.5h20c0-2.31-1-4.24-2.5-5.5"/>
                      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
                      <path d="m12 8 4 4-4 4"/>
                      <path d="M8 12h8"/>
                    </svg>
                  </div>
                </div>

              </div>

            </div>

            {/* 画布底部统计指标 */}
            <div className="mt-4 border-t border-slate-100 pt-3 flex items-center justify-between text-[11px] text-slate-500 font-semibold shrink-0 z-10 bg-white">
              <div className="flex gap-4">
                <span>触发器 (Trigger): <span className="font-mono text-slate-700 font-bold">field_profile_ready</span></span>
                <span className="text-slate-200">|</span>
                <span>核心治理对象 (Main Object): <span className="text-slate-750 font-bold">Field</span></span>
              </div>
              <div className="flex gap-4">
                <span>动作数: <span className="text-slate-750 font-bold">5</span></span>
                <span>函数数: <span className="text-slate-750 font-bold">2</span></span>
                <span>分支数: <span className="text-slate-750 font-bold">1</span></span>
                <span className="text-slate-200">|</span>
                <span>最后编辑时间: <span className="font-mono text-slate-600 font-bold">2026-06-20 11:02</span></span>
              </div>
            </div>

          </div>

          {/* 右侧侧边栏 (基础信息 + 节点详情 + AI 建议 + 影响分析) */}
          <div className="col-span-12 lg:col-span-3 xl:col-span-3 flex flex-col gap-5 shrink-0 min-w-[280px]">
            
            {/* A. 工作流基础信息 */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col relative">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
                <span className="text-[13px] font-extrabold text-slate-800">A. 工作流基础信息</span>
                <div className="flex gap-1.5 text-slate-400">
                  <Settings className="w-3.5 h-3.5 cursor-pointer hover:text-slate-600" />
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full my-auto"></div>
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full my-auto"></div>
                </div>
              </div>

              <div className="space-y-3 text-[12px] font-medium text-slate-700">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold shrink-0">工作流名称</span>
                  <span className="font-mono text-slate-850 truncate max-w-[170px]" title="semantic_governance_workflow">
                    semantic_governance_workflow
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold">中文名称</span>
                  <span className="text-slate-850">语义治理流程</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold">触发类型</span>
                  <span className="text-slate-850 font-mono">事件 (event)</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-slate-400 font-bold mt-0.5">覆盖范围</span>
                  <div className="flex gap-1 flex-wrap justify-end max-w-[180px]">
                    <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-bold border border-blue-100">字段 (Field)</span>
                    <span className="bg-slate-50 text-slate-500 px-1.5 py-0.5 rounded text-[10px] font-bold border border-slate-100">映射 (Mapping)</span>
                    <span className="bg-slate-50 text-slate-500 px-1.5 py-0.5 rounded text-[10px] font-bold border border-slate-100">断言 (Assertion)</span>
                  </div>
                </div>
                <div className="flex justify-between items-center border-t border-slate-50 pt-2.5">
                  <span className="text-slate-400 font-bold">状态</span>
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => setIsWorkflowEnabled(!isWorkflowEnabled)}
                      className={`relative w-8 h-4.5 rounded-full transition-colors cursor-pointer ${isWorkflowEnabled ? 'bg-blue-600' : 'bg-slate-200'}`}
                    >
                      <div className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-white transition-transform ${isWorkflowEnabled ? 'translate-x-3.5' : ''}`}></div>
                    </button>
                    <span className={`text-[11px] font-bold ${isWorkflowEnabled ? 'text-blue-600' : 'text-slate-400'}`}>
                      {isWorkflowEnabled ? '启用' : '禁用'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 border-t border-slate-50 pt-2.5">
                  <span className="text-slate-400 font-bold">描述</span>
                  <p className="text-slate-600 text-[11px] leading-relaxed font-medium">
                    用于字段语义理解、映射生成、断言构建和治理任务生成的标准流程
                  </p>
                </div>
              </div>
            </div>

            {/* B. 节点详情 */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2 shrink-0">
                <span className="text-[13px] font-extrabold text-slate-800">B. 节点详情 (Step Detail)</span>
                <span className={`px-2 py-0.5 text-[9.5px] font-black rounded ${
                  activeNode.type === '函数' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                  activeNode.type === '动作' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                  activeNode.type === '条件' ? 'bg-orange-50 text-orange-700 border border-orange-100' :
                  'bg-blue-50 text-blue-700 border border-blue-100'
                }`}>
                  {activeNode.type}
                </span>
              </div>

              <div className="space-y-2.5 text-[11.5px] font-medium text-slate-700 flex-1">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold">节点名称</span>
                  <span className="font-mono text-slate-850 font-bold truncate max-w-[180px]" title={activeNode.name}>
                    {activeNode.name}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold">类型</span>
                  <span className="text-slate-850">{activeNode.type}节点</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-400 font-bold">输入参数</span>
                  <span className="font-mono text-slate-750 bg-slate-50 p-1 rounded border border-slate-100 leading-normal overflow-x-auto text-[10px]">
                    {activeNode.inputs || '无'}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-400 font-bold">输出参数</span>
                  <span className="font-mono text-slate-750 bg-slate-50 p-1 rounded border border-slate-100 leading-normal overflow-x-auto text-[10px]">
                    {activeNode.outputs || '无'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 border-t border-slate-50 pt-2.5">
                  <div>
                    <span className="text-slate-400 font-bold block text-[10.5px]">超时时间</span>
                    <span className="text-slate-800 font-bold font-mono">{activeNode.timeout}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block text-[10.5px]">重试策略</span>
                    <span className="text-slate-800 font-bold font-mono">{activeNode.retry}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 border-t border-slate-50 pt-2.5">
                  <div>
                    <span className="text-slate-400 font-bold block text-[10.5px]">上游节点</span>
                    <span className="text-emerald-600 font-bold truncate block" title={activeNode.upstream}>{activeNode.upstream}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block text-[10.5px]">下游节点</span>
                    <span className="text-orange-600 font-bold truncate block" title={activeNode.downstream}>{activeNode.downstream}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2 shrink-0">
                <button 
                  onClick={() => alert(`查看函数 ${activeNode.name} 详情定义...`)}
                  className="flex-1 py-1.5 text-center text-[11px] font-bold text-blue-600 bg-white border border-blue-200/80 hover:bg-blue-50/30 rounded-lg transition-colors cursor-pointer"
                >
                  查看函数详情
                </button>
                <button 
                  onClick={() => alert(`准备替换当前节点 ${activeNode.name}...`)}
                  className="flex-1 py-1.5 text-center text-[11px] font-bold text-slate-655 bg-white border border-slate-200/80 hover:bg-slate-50/50 rounded-lg transition-colors cursor-pointer"
                >
                  替换节点
                </button>
              </div>
            </div>

            {/* C. AI 建议 */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                <span className="text-[13px] font-extrabold text-slate-800 flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-500 fill-current animate-pulse" />
                  C. AI 建议 (AI Suggestions)
                </span>
              </div>

              <div className="space-y-2.5">
                {[
                  { id: 1, text: '建议在置信度分支增加 notify_reviewer 告警推送节点' },
                  { id: 2, text: '建议在 create_task 前置插入 quality_score_compute 节点' },
                  { id: 3, text: '建议为 publish_model 动作添加发布前置依赖校验条件' }
                ].map((sug) => {
                  const isAdopted = adoptedSuggestions[sug.id];
                  return (
                    <div key={sug.id} className="text-[11px] flex items-start gap-2 justify-between bg-amber-50/40 p-2 rounded-lg border border-amber-100/50">
                      <div className="flex items-start gap-1.5 font-medium text-slate-700 leading-normal">
                        <span className="text-amber-500 shrink-0 font-bold">💡</span>
                        <p>{sug.text}</p>
                      </div>
                      <button
                        disabled={isAdopted}
                        onClick={() => handleAdoptSuggestion(sug.id, sug.text)}
                        className={`px-2 py-1 text-[10px] font-black rounded border shrink-0 cursor-pointer transition-all ${
                          isAdopted 
                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' 
                            : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50/50'
                        }`}
                      >
                        {isAdopted ? '已采纳' : '采纳'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* D. 影响分析 */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                <span className="text-[13px] font-extrabold text-slate-800 flex items-center gap-1.5">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500">
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                    <path d="M12 6v6l4 2"/>
                  </svg>
                  D. 影响分析 (Impact Analysis)
                </span>
              </div>

              <div className="space-y-2.5 text-[11px] font-medium text-slate-655">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">影响治理对象</span>
                  <span className="text-slate-800 text-right">字段 (Field) / 映射 (Mapping) / 断言 (Assertion) / 任务 (Task)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">影响动作数</span>
                  <span className="text-slate-800">6 个</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">影响函数数</span>
                  <span className="text-slate-800">2 个</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">影响业务查询</span>
                  <span className="text-slate-800 text-right">字段语义理解、物理证据查看、映射建议推荐</span>
                </div>
                <div className="border-t border-slate-50 pt-2 text-left">
                  <span className="text-slate-455 font-bold block mb-1">风险提示</span>
                  <p className="text-rose-500 font-extrabold leading-normal bg-rose-50/50 p-2 border border-rose-100 rounded">
                    停用该工作流流程将直接中断语义资产自动治理的主链路！
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* 底部指标展示区: 1. 深度校验, 2. 节点版本差异, 3. 拦截错误诊断 */}
        <div className="grid grid-cols-12 gap-6 mt-2">
          
          {/* 1. 深度校验 */}
          <div className="col-span-12 lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col">
            <h4 className="text-[13px] font-extrabold text-slate-800 mb-3.5 border-l-3 border-blue-600 pl-2 -ml-2">1. 流程校验 (Validation)</h4>
            <div className="space-y-2.5 text-[11.5px] font-medium">
              <div className="flex items-start gap-2 text-slate-700">
                <span className="text-emerald-500 font-bold shrink-0">✅</span>
                <p>工作流有向无环图 (DAG) 拓扑检查校验通过</p>
              </div>
              <div className="flex items-start gap-2 text-slate-700">
                <span className="text-emerald-500 font-bold shrink-0">✅</span>
                <p>节点计算能力绑定及数据契约规范校验一致</p>
              </div>
              <div className="flex items-start gap-2 text-amber-600 bg-amber-50/50 border border-amber-100 rounded-lg p-2.5 leading-normal">
                <span className="text-amber-500 shrink-0 font-bold">⚠️</span>
                <p>警告: 低置信度异常流转分支缺失 notify 通知处理节点 (可能导致审批单生成后无法直接推动消息告警)</p>
              </div>
            </div>
          </div>

          {/* 2. 节点差异对比 */}
          <div className="col-span-12 lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col">
            <h4 className="text-[13px] font-extrabold text-slate-800 mb-3.5 border-l-3 border-emerald-500 pl-2 -ml-2">2. 差异对比 (vs v1.1.0)</h4>
            <div className="space-y-2.5 text-[11.5px] font-medium font-mono text-slate-700">
              <div className="flex items-start gap-2">
                <span className="text-emerald-600 bg-emerald-50 px-1 font-bold rounded">+</span>
                <p className="text-slate-800 leading-normal">新增判定分流条件节点 <span className="font-bold text-slate-900">confidence &gt; 0.8</span></p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-600 bg-emerald-50 px-1 font-bold rounded">+</span>
                <p className="text-slate-800 leading-normal">新增 <span className="font-bold text-slate-900">validate_mapping</span> 人工审核异常修正路由</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-rose-600 bg-rose-50 px-1.5 font-bold rounded">-</span>
                <p className="text-slate-655 leading-normal">移除原有直连逻辑 <span className="line-through text-slate-400">direct_assert</span> 生成动作</p>
              </div>
            </div>
          </div>

          {/* 3. 诊断错误分析 */}
          <div className="col-span-12 lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col">
            <h4 className="text-[13px] font-extrabold text-slate-800 mb-3.5 border-l-3 border-indigo-500 pl-2 -ml-2">3. 异常诊断 (Errors)</h4>
            <div className="space-y-2.5 text-[11.5px] font-medium flex-1">
              <div className="flex items-start gap-2 text-slate-700">
                <span className="text-emerald-500 font-bold shrink-0">✅</span>
                <p>未发现阻断部署级逻辑定义错误</p>
              </div>
              <div className="flex items-start gap-2 text-blue-600 bg-blue-50/50 border border-blue-100 rounded-lg p-2.5 leading-normal mt-1.5">
                <span className="text-blue-500 shrink-0 font-bold">ℹ️</span>
                <p>配置建议: 人工审批分支建议添加详细动作注解说明 (辅助作业员快捷了解判定上下文)</p>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
