import React, { useState } from 'react';
import {
  Database, Box, Shield, Play, Code, CheckCircle2,
  Search, Settings, Star, Info, Network,
  Zap, GitBranch, User, LayoutGrid, Expand, ArrowRight,
  GitMerge, Edit, Clock, FileCode, CheckCircle, XCircle,
  RefreshCw, Download, ChevronDown
} from 'lucide-react';
import {useUiStore} from '../store/uiStore';
import {PageHeader} from './ui/PageHeader';

export default function WorkflowOrchestrator() {
  const navigate = useUiStore((s) => s.navigate);
  const isEditingActive = !useUiStore((s) => s.isLocked);

  const [searchTerm, setSearchTerm] = useState('');

  const workflows = [
    { id: 'MetadataScanWorkflow', nameCn: '元数据扫描流程', status: '已发布' },
    { id: 'SemanticReviewWorkflow', nameCn: '语义审核流程', status: '已发布' },
    { id: 'DQAssessmentWorkflow', nameCn: '数据质量评估流程', status: '已发布' },
    { id: 'IssueRemediationWorkflow', nameCn: '问题整改流程', status: '编辑中' },
    { id: 'SnapshotPublishWorkflow', nameCn: '快照发布流程', status: '已发布' },
    { id: 'CandidatePromotionWorkflow', nameCn: '候选发布流程', status: '已发布' }
  ];

  const nodes = [
    { id: 1, type: 'Trigger', title: 'Trigger 触发器', desc: 'Field 扫描完成', icon: Zap, color: 'text-slate-600', bg: 'bg-slate-50', outline: 'border-slate-200' },
    { id: 2, type: 'Function', title: 'Function 函数', desc: 'profileField()', icon: Code, color: 'text-blue-600', bg: 'bg-blue-50', outline: 'border-blue-200' },
    { id: 3, type: 'Function', title: 'Function 函数', desc: 'classifyFieldSemantic()', icon: Code, color: 'text-blue-600', bg: 'bg-blue-50', outline: 'border-blue-200' },
    { id: 4, type: 'Function', title: 'Function 函数', desc: 'computeSemanticScore()', icon: Code, color: 'text-blue-600', bg: 'bg-blue-50', outline: 'border-blue-400', active: true },
    { id: 5, type: 'Action', title: 'Action 动作', desc: 'createSemanticAssertion', icon: Play, color: 'text-emerald-600', bg: 'bg-emerald-50', outline: 'border-emerald-200' },
    { id: 6, type: 'Condition', title: 'Condition 条件', desc: '置信度判断', icon: GitBranch, color: 'text-purple-600', bg: 'bg-purple-50', outline: 'border-purple-200', extra: true },
    { id: 7, type: 'HumanReview', title: 'Human Review 人工审核', desc: '人工审核', icon: User, color: 'text-orange-600', bg: 'bg-orange-50', outline: 'border-orange-200' },
    { id: 8, type: 'Action', title: 'Action 动作', desc: 'confirmAssertion / markUnknown / ignoreAssertion', icon: Play, color: 'text-emerald-600', bg: 'bg-emerald-50', outline: 'border-emerald-200' },
    { id: 9, type: 'Action', title: 'Action 动作', desc: '写入 Snapshot Candidate', icon: Play, color: 'text-emerald-600', bg: 'bg-emerald-50', outline: 'border-emerald-200' },
    { id: 10, type: 'Audit', title: 'Audit 审计', desc: '记录审计', icon: Shield, color: 'text-slate-500', bg: 'bg-slate-50', outline: 'border-slate-200' },
  ];

  return (
    <div className="min-h-full font-sans bg-transparent" id="workflow-workspace">
      
      {/* 顶部 Header */}
      <PageHeader
        breadcrumbs={[
          {label: '管理中心', onClick: () => navigate('overview')},
          {label: '本体管理'},
          {label: 'DRKN 本体模型管理'},
          {label: '流程编排'},
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
                className="px-4 py-1.5 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs hover:shadow-blue-500/10 flex items-center gap-1 cursor-pointer transition-all"
              >
                + 创建治理流程 <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        }
      />

      {/* 选项卡 Tabs 区域：100% 遵照设计图排版 */}
      <div className="flex gap-1.5 mb-5 border-b border-slate-200/80 shrink-0">
        {[
          '模型总览', '对象模型', '关系模型', '能力绑定', '动作 (Action)', 
          '流程 (Workflow)', '权限策略', '版本与发布', '变更集'
        ].map((tab) => (
          <div 
            key={tab}
            onClick={() => {
              if (tab === '模型总览') navigate('overview');
              if (tab === '对象模型') navigate('object_model');
              if (tab === '关系模型') navigate('relation_model');
              if (tab === '能力绑定' || tab === '能力 (Function)') navigate('capability_binding');
              if (tab === '动作 (Action)') navigate('action_model');
              if (tab === '流程 (Workflow)') navigate('workflow_orchestration');
              if (tab === '版本与发布' || tab === '变更与发布' || tab === '变更集') navigate('change_release');
            }}
            className={`px-3 pb-2 text-[13px] font-bold cursor-pointer transition-colors relative ${
              tab === '流程 (Workflow)' 
                ? 'text-blue-600 font-black border-b-[2.5px] border-blue-600 -mb-[1px]' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab}
          </div>
        ))}
      </div>

      <div className="flex gap-6 pb-12 items-stretch">
        
        {/* 左栏：Workflow 列表 */}
        <div className="w-80 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col shrink-0 h-[920px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-extrabold text-slate-900">Workflow 列表</h3>
          </div>
          
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="搜索 Workflow"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
            />
          </div>

          <div className="space-y-2 pt-2 flex-col overflow-y-auto pb-4">
            {workflows.filter(w => w.id.toLowerCase().includes(searchTerm.toLowerCase())).map((wf, idx) => {
              const isActive = wf.id === 'SemanticReviewWorkflow'; 
              const isEditing = wf.status === '编辑中';
              return (
                <div 
                  key={idx}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isActive 
                      ? 'bg-blue-50/50 border-blue-200 shadow-sm' 
                      : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                     <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${isActive ? 'bg-blue-100 text-blue-600' : 'bg-blue-50 text-blue-500'}`}>
                       <Network className="w-4 h-4" />
                     </div>
                     <div className="flex-1 min-w-0">
                       <div className={`text-[13px] font-bold font-mono truncate ${isActive ? 'text-blue-800' : 'text-slate-800'}`}>{wf.id}</div>
                       <div className={`text-[11px] font-medium mt-1 truncate ${isActive ? 'text-blue-600/80' : 'text-slate-500'}`}>{wf.nameCn}</div>
                     </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                     {isEditing ? (
                       <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">编辑中</span>
                     ) : (
                       <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">已发布</span>
                     )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-slate-500 text-[13px] font-medium shrink-0">
             <span>共 6 项</span>
             <div className="w-8 h-8 rounded border border-slate-200 flex items-center justify-center hover:bg-slate-50 cursor-pointer transition-colors">
               <Settings className="w-4 h-4" />
             </div>
          </div>
        </div>

        {/* 右侧：主体工作区 */}
        <div className="flex-1 flex flex-col gap-6">
          
          {/* 上半部分：流程图与详情 */}
          <div className="flex gap-6 h-[580px]">
            
            {/* 中间：流程画布 */}
            <div className="flex-[5] bg-white border border-slate-200 rounded-2xl shadow-sm relative overflow-hidden flex flex-col">
              
              {/* 画布 Topbar */}
              <div className="absolute top-5 left-5 z-10 flex items-center gap-3">
                 <h2 className="text-slate-900 font-extrabold text-lg tracking-tight">SemanticReviewWorkflow</h2>
                 <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">已发布</span>
                 <Info className="w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-600 transition-colors" />
              </div>

              <div className="absolute top-5 right-5 z-10 flex items-center gap-1 bg-white border border-slate-200 rounded-lg shadow-sm p-1">
                 <div className="px-2 h-8 flex items-center justify-center rounded hover:bg-slate-50 cursor-pointer text-slate-600 transition-colors"><LayoutGrid className="w-4 h-4" /></div>
                 <div className="px-2 h-8 flex items-center justify-center rounded hover:bg-slate-50 cursor-pointer text-slate-600 transition-colors"><Network className="w-4 h-4" /></div>
                 <div className="w-px h-4 bg-slate-200 mx-1"></div>
                 <div className="px-2 h-8 flex items-center justify-center rounded hover:bg-slate-50 cursor-pointer text-slate-600 transition-colors">—</div>
                 <div className="px-2 h-8 flex items-center justify-center font-medium text-[13px] text-slate-600">100%</div>
                 <div className="px-2 h-8 flex items-center justify-center rounded hover:bg-slate-50 cursor-pointer text-slate-600 transition-colors">+</div>
                 <div className="w-px h-4 bg-slate-200 mx-1"></div>
                 <div className="px-2 h-8 flex items-center justify-center rounded hover:bg-slate-50 cursor-pointer text-slate-600 transition-colors"><Expand className="w-4 h-4" /></div>
              </div>

              {/* 画布主体 */}
              <div className="flex-1 overflow-y-auto bg-slate-50/50 p-10 pt-20 flex justify-center">
                 
                 <div className="relative w-full max-w-[400px]">
                    {/* The core vertical line */}
                    <div className="absolute left-[15px] top-[24px] bottom-[24px] w-[2px] bg-slate-200 z-0"></div>

                    <div className="space-y-0 relative z-10 pb-10">
                      {nodes.map((node, i) => {
                        const Icon = node.icon;
                        return (
                          <div key={node.id} className="relative group">
                            
                            <div className="flex items-center gap-4 py-2">
                               <div className={`w-8 h-8 rounded-full border bg-white flex items-center justify-center font-mono text-[11px] shrink-0 z-10 transition-colors ${node.active ? 'border-blue-400 text-blue-600 shadow-[0_0_0_3px_rgba(59,130,246,0.1)]' : 'border-slate-200 text-slate-400 group-hover:border-slate-300 group-hover:text-slate-500'}`}>
                                 {node.id}
                               </div>
                               <div className={`flex-1 border ${node.outline} bg-white rounded-xl shadow-sm flex items-center p-0 overflow-hidden transition-all ${node.active ? 'shadow-[0_0_0_3px_rgba(59,130,246,0.05)]' : 'hover:border-slate-300'}`}>
                                  {/* Left color bar / icon area */}
                                  <div className={`w-12 self-stretch flex items-center justify-center ${node.bg} ${node.color} border-r border-slate-100 shrink-0`}>
                                     <Icon className="w-5 h-5" />
                                  </div>
                                  <div className="p-3 pl-4">
                                     <div className={`text-[11px] font-extrabold uppercase mb-0.5 flex items-center gap-1.5 ${node.color}`}>
                                        {node.title}
                                     </div>
                                     <div className="text-[13px] font-medium text-slate-800 font-mono">
                                        {node.desc}
                                     </div>
                                  </div>
                               </div>
                            </div>
                            
                            {/* Down Arrow / Connectors gap */}
                            {i < nodes.length - 1 && !node.extra && (
                              <div className="h-6"></div>
                            )}

                            {/* Extra UI for Condition Branches */}
                            {node.extra && (
                              <div className="pl-[3.5rem] pr-4 py-1 flex items-center justify-between relative mt-1 mb-2">
                                 {/* Draw lines exiting condition */}
                                 <div className="absolute -top-3 left-[3.5rem] w-[2px] h-3 bg-slate-200"></div>
                                 <span className="text-[11px] font-bold text-slate-500 bg-white px-2 py-0.5 border border-slate-200 rounded shadow-sm relative -ml-2 z-10">置信度 &ge; 阈值</span>
                                 <span className="text-[11px] font-bold text-slate-500 bg-white px-2 py-0.5 border border-slate-200 rounded shadow-sm relative mr-6 z-10">置信度 &lt; 阈值</span>
                              </div>
                            )}

                             {/* Little arrows on the main line */}
                             {i < nodes.length - 1 && (
                               <div className="absolute left-[9px] -bottom-[4px] text-slate-300 bg-white rounded-full z-10 w-3 h-3 flex items-center justify-center pointer-events-none">
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                               </div>
                             )}

                          </div>
                        );
                      })}
                    </div>
                 </div>

              </div>
            </div>

            {/* 右侧：节点详情 */}
            <div className="flex-[3] bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-base font-extrabold text-slate-900 border-l-4 border-blue-600 pl-2 -ml-2">节点详情</h3>
                 <button className="flex items-center gap-1.5 text-[13px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors cursor-pointer">
                   <Edit className="w-3.5 h-3.5" /> 编辑
                 </button>
              </div>

              <div className="flex items-center justify-between mb-8 pb-4 border-b border-dashed border-slate-200">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                      <div className="italic font-bold text-[18px]">fx</div>
                   </div>
                   <div className="font-mono text-lg font-bold text-slate-900 leading-none">computeSemanticScore()</div>
                </div>
                <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 flex items-center h-6 rounded border border-blue-100 ml-2 whitespace-nowrap">Function Step</span>
              </div>

              <div className="space-y-4 text-[13px] border-b border-slate-100 pb-6 mb-6">
                <div className="flex">
                  <span className="w-28 text-slate-500 shrink-0 font-medium tracking-wide">节点类型</span>
                  <span className="text-slate-800 font-mono">Function Step</span>
                </div>
                <div className="flex">
                  <span className="w-28 text-slate-500 shrink-0 font-medium tracking-wide">用途</span>
                  <span className="text-slate-800 font-medium">计算字段语义置信度得分</span>
                </div>
                <div className="flex">
                  <span className="w-28 text-slate-500 shrink-0 font-medium tracking-wide">输入</span>
                  <span className="text-slate-800 font-mono">Evidence Set</span>
                </div>
                <div className="flex">
                  <span className="w-28 text-slate-500 shrink-0 font-medium tracking-wide">输出</span>
                  <span className="text-slate-800 font-mono">Score <span className="text-slate-400 text-xs ml-1 font-sans">(0 ~ 1)</span></span>
                </div>
                <div className="flex">
                  <span className="w-28 text-slate-500 shrink-0 font-medium tracking-wide">是否改变状态</span>
                  <span className="text-slate-800 font-medium">否 <span className="text-slate-400 text-xs ml-1">(只计算，不修改对象状态)</span></span>
                </div>
                <div className="flex">
                  <span className="w-28 text-slate-500 shrink-0 font-medium tracking-wide">失败处理</span>
                  <span className="text-slate-800 font-medium">进入人工审核</span>
                </div>
                <div className="flex">
                  <span className="w-28 text-slate-500 shrink-0 font-medium tracking-wide">使用权限</span>
                  <span className="text-slate-800 font-medium">系统任务 / 数据治理人员</span>
                </div>
                <div className="flex">
                  <span className="w-28 text-slate-500 shrink-0 font-medium tracking-wide">被哪些流程使用</span>
                  <span className="text-blue-600 font-medium font-mono cursor-pointer hover:underline">SemanticReviewWorkflow</span>
                </div>
                <div className="flex flex-col gap-1.5 pt-2">
                  <span className="text-slate-500 shrink-0 font-medium tracking-wide">描述</span>
                  <span className="text-slate-700 leading-relaxed font-medium">基于证据集合计算字段语义置信度得分，用于后续置信度判断与路由分支。</span>
                </div>
              </div>

              <div className="pt-2">
                <h4 className="text-sm font-extrabold text-slate-900 mb-4 border-l-4 border-slate-300 pl-2 -ml-2">相关信息</h4>
                <div className="space-y-4 text-[13px]">
                   <div className="flex items-start">
                     <span className="w-28 text-slate-500 shrink-0 font-medium tracking-wide flex items-center h-5">调用 Function</span>
                     <span className="text-slate-800 font-medium flex items-center h-5">无</span>
                   </div>
                   <div className="flex items-start">
                     <span className="w-28 text-slate-500 shrink-0 font-medium flex gap-1 items-center h-5 tracking-wide">依赖对象 <Info className="w-3.5 h-3.5 text-slate-300" /></span>
                     <div className="flex gap-1.5 flex-wrap">
                        <span className="bg-slate-100 text-slate-600 px-2 flex py-0.5 rounded text-[11px] font-mono border border-slate-200 shadow-sm">Field</span>
                        <span className="bg-slate-100 text-slate-600 px-2 flex py-0.5 rounded text-[11px] font-mono border border-slate-200 shadow-sm">Evidence</span>
                        <span className="bg-slate-100 text-slate-600 px-2 flex py-0.5 rounded text-[11px] font-mono border border-slate-200 shadow-sm">SemanticAssertion</span>
                     </div>
                   </div>
                   <div className="flex items-start">
                     <span className="w-28 text-slate-500 shrink-0 font-medium tracking-wide flex items-center h-5">产出对象</span>
                     <div className="flex items-center h-5">
                       <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[11px] font-mono border border-slate-200 shadow-sm">Score</span>
                     </div>
                   </div>
                   <div className="flex items-start">
                     <span className="w-28 text-slate-500 shrink-0 font-medium tracking-wide flex items-center h-5">可用环境</span>
                     <span className="text-slate-800 font-medium flex items-center h-5">AI 工作台、Workflow 执行环境</span>
                   </div>
                </div>
              </div>

            </div>
          </div>

          {/* 下半部分：运行记录与影响分析 */}
          <div className="flex gap-6 h-[316px]">
            
            {/* 运行记录 */}
            <div className="flex-[4] bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col overflow-hidden">
               <div className="flex items-center justify-between mb-6 shrink-0">
                  <div className="flex items-baseline gap-2 border-l-4 border-blue-600 pl-2 -ml-2">
                    <h3 className="text-base font-extrabold text-slate-900">运行记录</h3>
                    <span className="text-[12px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 ml-2">(最近 30 天)</span>
                  </div>
               </div>

               <div className="grid grid-cols-4 gap-4 mb-6 shrink-0">
                  <div className="flex items-center gap-3 bg-slate-50/50 p-2 border border-slate-100 rounded-xl">
                     <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100/50">
                        <Play className="w-4 h-4 ml-0.5" />
                     </div>
                     <div>
                        <div className="text-[12px] font-bold text-slate-500 mb-0.5">运行次数</div>
                        <div className="text-2xl font-black text-slate-900 leading-none">128 <span className="text-[13px] font-bold text-slate-500 ml-0.5">次</span></div>
                     </div>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-50/50 p-2 border border-slate-100 rounded-xl">
                     <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100/50">
                        <CheckCircle className="w-4 h-4" />
                     </div>
                     <div>
                        <div className="text-[12px] font-bold text-slate-500 mb-0.5">成功率</div>
                        <div className="text-2xl font-black text-slate-900 leading-none">98.6<span className="text-[18px]">%</span></div>
                     </div>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-50/50 p-2 border border-slate-100 rounded-xl">
                     <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100/50">
                        <Clock className="w-4 h-4" />
                     </div>
                     <div>
                        <div className="text-[12px] font-bold text-slate-500 mb-0.5">平均耗时</div>
                        <div className="text-2xl font-black text-slate-900 leading-none">1.28 <span className="text-[13px] font-bold text-slate-500 ml-0.5">分钟</span></div>
                     </div>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-50/50 p-2 border border-slate-100 rounded-xl">
                     <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 border border-rose-100/50">
                        <XCircle className="w-4 h-4" />
                     </div>
                     <div>
                        <div className="text-[12px] font-bold text-slate-500 mb-0.5">失败次数</div>
                        <div className="text-2xl font-black text-slate-900 leading-none">2 <span className="text-[13px] font-bold text-slate-500 ml-0.5">次</span></div>
                     </div>
                  </div>
               </div>

               <div className="flex-1 overflow-auto -mx-2 px-2 pb-2">
                 <table className="w-full text-left text-[12px]">
                    <thead className="sticky top-0 bg-white z-10 shadow-[0_1px_0_rgba(241,245,249,1)]">
                      <tr className="text-slate-500 font-bold bg-white">
                        <th className="pb-3 px-2 font-medium">运行时间</th>
                        <th className="pb-3 px-2 font-medium">发起人</th>
                        <th className="pb-3 px-2 font-medium">状态</th>
                        <th className="pb-3 px-2 font-medium">耗时</th>
                        <th className="pb-3 px-2 font-medium">结果摘要</th>
                        <th className="pb-3 px-2 text-right font-medium">操作</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-700 font-medium">
                      <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                         <td className="py-2.5 px-2 font-mono text-slate-800">2025-05-24 10:32:21</td>
                         <td className="py-2.5 px-2 font-mono text-slate-500">system</td>
                         <td className="py-2.5 px-2"><span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-100/50">成功</span></td>
                         <td className="py-2.5 px-2">1.16 分钟</td>
                         <td className="py-2.5 px-2 text-slate-500 truncate max-w-[200px]" title="处理 Field 2,842 个，生成 Assertion 1,236 个">处理 Field 2,842 个，生成 Assertion 1,236 个</td>
                         <td className="py-2.5 px-2 text-right"><span className="text-blue-600 hover:underline cursor-pointer font-bold">查看详情</span></td>
                      </tr>
                      <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                         <td className="py-2.5 px-2 font-mono text-slate-800">2025-05-24 09:15:43</td>
                         <td className="py-2.5 px-2 font-mono text-slate-500">system</td>
                         <td className="py-2.5 px-2"><span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-100/50">成功</span></td>
                         <td className="py-2.5 px-2">1.34 分钟</td>
                         <td className="py-2.5 px-2 text-slate-500 truncate max-w-[200px]" title="处理 Field 2,756 个，生成 Assertion 1,112 个">处理 Field 2,756 个，生成 Assertion 1,112 个</td>
                         <td className="py-2.5 px-2 text-right"><span className="text-blue-600 hover:underline cursor-pointer font-bold">查看详情</span></td>
                      </tr>
                      <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                         <td className="py-2.5 px-2 font-mono text-slate-800">2025-05-24 08:02:11</td>
                         <td className="py-2.5 px-2 font-mono text-slate-500">system</td>
                         <td className="py-2.5 px-2"><span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-100/50">成功</span></td>
                         <td className="py-2.5 px-2">1.22 分钟</td>
                         <td className="py-2.5 px-2 text-slate-500 truncate max-w-[200px]" title="处理 Field 2,631 个，生成 Assertion 1,045 个">处理 Field 2,631 个，生成 Assertion 1,045 个</td>
                         <td className="py-2.5 px-2 text-right"><span className="text-blue-600 hover:underline cursor-pointer font-bold">查看详情</span></td>
                      </tr>
                    </tbody>
                 </table>
               </div>
            </div>

            {/* 影响分析 */}
            <div className="flex-[3] bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col">
               <div className="flex items-center justify-between mb-6 shrink-0">
                  <div className="flex items-baseline gap-2 border-l-4 border-purple-600 pl-2 -ml-2">
                    <h3 className="text-base font-extrabold text-slate-900">影响分析</h3>
                    <span className="text-[12px] text-slate-500 font-medium ml-2">(基于当前流程变更)</span>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-4">
                     <div className="text-[12px] font-bold text-slate-500 mb-2">影响对象类型</div>
                     <div className="text-xl font-black text-slate-800 mb-2.5 flex items-center gap-1">4 <span className="text-sm font-medium text-slate-500">个</span> <ArrowRight className="w-3.5 h-3.5 ml-1 text-slate-300 -rotate-45" /></div>
                     <div className="flex gap-1.5 flex-wrap">
                       <span className="text-[10px] font-mono bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 shadow-sm">Field</span>
                       <span className="text-[10px] font-mono bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 shadow-sm">SemanticAssertion</span>
                       <span className="text-[10px] font-mono bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 shadow-sm">Evidence</span>
                       <span className="text-[10px] font-mono bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 shadow-sm">Snapshot</span>
                     </div>
                  </div>
                  <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-4">
                     <div className="text-[12px] font-bold text-slate-500 mb-2">影响实例数 (预估)</div>
                     <div className="text-2xl font-black text-slate-800 mb-2.5 flex items-center gap-1 mt-1">12,842 <ArrowRight className="w-4 h-4 ml-1 text-slate-300 -rotate-45" /></div>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4 mb-5">
                  <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-4">
                     <div className="text-[12px] font-bold text-slate-500 mb-2 flex items-center justify-between">影响 AI 场景 </div>
                     <div className="text-lg font-black text-slate-800 mb-2.5 flex items-center gap-1">1 <span className="text-sm font-medium text-slate-500">个</span> <ArrowRight className="w-3.5 h-3.5 ml-1 text-slate-300 -rotate-45" /></div>
                     <div className="flex gap-1.5 flex-wrap">
                       <span className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-medium shadow-sm">字段语义编织助手</span>
                     </div>
                  </div>
                  <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-4">
                     <div className="text-[12px] font-bold text-slate-500 mb-2 flex items-center justify-between">影响 DKN Mapping </div>
                     <div className="text-lg font-black text-slate-800 mb-2.5 flex items-center gap-1">2 <span className="text-sm font-medium text-slate-500">个</span> <ArrowRight className="w-3.5 h-3.5 ml-1 text-slate-300 -rotate-45" /></div>
                     <div className="flex gap-1.5 flex-wrap">
                       <span className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-medium shadow-sm">字段语义映射</span>
                       <span className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-medium shadow-sm">质量规则映射</span>
                     </div>
                  </div>
               </div>
               
               <div className="mt-auto grid grid-cols-3 gap-4 border-t border-slate-100 pt-5">
                  <div>
                    <div className="text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide">影响级别</div>
                    <div className="text-[13px] font-extrabold text-slate-800 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500"></span> 中</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide">潜在风险</div>
                    <div className="text-[13px] font-extrabold text-slate-800 flex items-center gap-1.5">低 <span className="text-[11px] font-medium text-slate-500 ml-1">(0 错误 / 1 警告)</span></div>
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-500 mb-1.5 tracking-wide">建议操作</div>
                    <div className="text-[11px] font-medium text-slate-600 leading-tight">变更后建议进行模拟运行以验证流程行为</div>
                  </div>
               </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
