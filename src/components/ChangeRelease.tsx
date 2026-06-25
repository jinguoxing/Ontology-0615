import React, { useState } from 'react';
import {
  Database, Box, FileCode, CheckCircle, Search, Settings, Star, Info, Network,
  Zap, GitBranch, User, LayoutGrid, Expand, ArrowRight,
  GitMerge, Edit, Clock, ShieldCheck, Play, Send, RotateCcw, RefreshCw, XCircle, ChevronDown, Check,
  ChevronLeft, ChevronRight, FileText, Link2, Code, Shield, AlertTriangle, Monitor, FilePlus, PenTool, Rocket, FileCheck, Download
} from 'lucide-react';
import {useUiStore} from '../store/uiStore';
import {PageHeader} from './ui/PageHeader';
import { DknPageHeader } from './ui/DknPageHeader';

export default function ChangeRelease() {
  const navigate = useUiStore((s) => s.navigate);
  const modelType = useUiStore((s) => s.modelType);

  const [searchTerm, setSearchTerm] = useState('');

  const changeSets = [
    { id: 'CS-2026-012', name: '语义字段模型优化', author: '张敏', time: '2026-06-14 10:35', count: 12, status: '待审核' },
    { id: 'CS-2026-011', name: '数据质量规则调整', author: '李伟', time: '2026-06-05 14:22', count: 8, status: '已发布' },
    { id: 'CS-2026-010', name: 'Snapshot 发布配置变更', author: '王芳', time: '2026-05-28 09:18', count: 6, status: '已归档' },
    { id: 'CS-2026-009', name: '治理任务调度优化', author: '刘强', time: '2026-05-20 16:40', count: 9, status: '已发布' }
  ];

  const changes = [
    { type: 'Property', icon: <div className="text-blue-600 font-bold italic font-serif">P</div>, title: '修改 Property', desc: '修改 Field.semantic_type 属性说明', detail: '更新字段语义类型的定义描述与取值说明。', tag: '修改', tagColor: 'text-amber-600 bg-amber-50 border-amber-100' },
    { type: 'Link Type', icon: <Link2 className="w-5 h-5 text-blue-600" />, title: '新增 Link Type', desc: '新增 Link Type: Field maps_to DomainMapping', detail: '定义字段映射到领域映射的关系，用于语义对齐。', tag: '新增', tagColor: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
    { type: 'Function', icon: <div className="text-blue-600 font-bold italic font-serif">fx</div>, title: '新增 Function 绑定', desc: '新增 Function 绑定: detectForeignKey()', detail: '绑定 detectForeignKey() 到 Field 对象，用于外键识别。', tag: '新增', tagColor: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
    { type: 'Workflow', icon: <Network className="w-5 h-5 text-blue-600" />, title: '修改 Workflow', desc: '修改 SemanticReviewWorkflow 条件阈值', detail: '将语义置信度阈值由 0.70 调整为 0.75。', tag: '修改', tagColor: 'text-amber-600 bg-amber-50 border-amber-100' }
  ];

  return (
    <div className="min-h-full font-sans bg-transparent" id="change-release-workspace">
      
      {/* 顶部 Header */}
      {modelType === 'DKN' ? (
        <DknPageHeader />
      ) : (
        <PageHeader
          breadcrumbs={[
            {label: '管理中心', onClick: () => navigate('overview')},
            {label: '本体管理'},
            {label: 'DRKN 本体模型管理'},
            {label: '变更与发布'},
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
                  className="px-4 py-1.5 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs hover:shadow-blue-500/10 flex items-center gap-1 cursor-pointer transition-all"
                >
                  提交审核 <ChevronDown className="w-3.5 h-3.5" />
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
              const isActive = tab === '发布';
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
              className="px-4 py-1.5 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs hover:shadow-blue-500/10 flex items-center gap-1 cursor-pointer transition-all"
            >
              提交审核 <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-mono font-bold text-slate-400">Sandbox.Active</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex gap-1.5 mb-5 border-b border-slate-200/80 shrink-0">
          {[
            '模型总览', '对象模型', '关系模型', '函数（Function）', '动作 (Action)', 
            '流程 (Workflow)', '权限策略', '变更与发布'
          ].map((tab) => (
            <div 
              key={tab}
              onClick={() => {
                if (tab === '模型总览') navigate('overview');
                if (tab === '对象模型') navigate('object_model');
                if (tab === '关系模型') navigate('relation_model');
                if (tab === '能力绑定' || tab === '能力 (Function)' || tab === '函数（Function）') navigate('capability_binding');
                if (tab === '动作 (Action)') navigate('action_model');
                if (tab === '流程 (Workflow)') navigate('workflow_orchestration');
                if (tab === '变更与发布') navigate('change_release');
              }}
              className={`px-3 pb-2 text-[13px] font-bold cursor-pointer transition-colors relative ${
                tab === '变更与发布' 
                  ? 'text-blue-600 font-black border-b-[2.5px] border-blue-600 -mb-[1px]' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab}
            </div>
          ))}
        </div>
      )}
      <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr_400px] gap-6 pb-6">
        
        {/* 左栏：变更集列表 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col h-[760px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-extrabold text-slate-900">变更集列表</h3>
          </div>
          
          <div className="flex gap-2 mb-4">
             <div className="relative flex-1">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <input 
                 type="text" 
                 placeholder="搜索变更集"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
               />
             </div>
             <button className="px-3 border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 bg-white shadow-sm flex items-center gap-1 hover:bg-slate-50">
               全部状态 <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
             </button>
          </div>

          <div className="space-y-3 pt-2 flex-col overflow-y-auto pb-4">
            {changeSets.map((cs, idx) => {
              const isActive = cs.id === 'CS-2026-012'; 
              return (
                <div 
                  key={idx}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isActive 
                      ? 'bg-blue-50/50 border-blue-200 shadow-sm' 
                      : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                     <span className={`text-[15px] font-bold font-mono ${isActive ? 'text-blue-800' : 'text-slate-800'}`}>{cs.id}</span>
                     {cs.status === '待审核' && <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">待审核</span>}
                     {cs.status === '已发布' && <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">已发布</span>}
                     {cs.status === '已归档' && <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">已归档</span>}
                  </div>
                  <div className={`text-[13px] font-bold mb-3 truncate ${isActive ? 'text-blue-900' : 'text-slate-800'}`}>{cs.name}</div>
                  <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 mb-2">
                     <div className="flex items-center gap-3">
                       <span>{cs.author}</span>
                       <span>{cs.time}</span>
                     </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                     <FileText className="w-3.5 h-3.5" /> {cs.count} 项变更
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-slate-500 text-[13px] font-medium">
             <span>共 8 条</span>
             <div className="flex items-center gap-1">
               <button className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-slate-700 hover:bg-slate-50"><ChevronLeft className="w-4 h-4" /></button>
               <button className="w-7 h-7 flex items-center justify-center rounded bg-blue-50 text-blue-600 font-bold border border-blue-100">1</button>
               <button className="w-7 h-7 flex items-center justify-center rounded text-slate-600 hover:bg-slate-50 font-bold">2</button>
               <button className="w-7 h-7 flex items-center justify-center rounded text-slate-600 hover:text-slate-700 hover:bg-slate-50"><ChevronRight className="w-4 h-4" /></button>
             </div>
          </div>
        </div>

        {/* 中间：变更内容明细 */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col h-[760px]">
          <div className="flex items-center gap-3 mb-6">
             <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">变更内容明细</h3>
             <span className="text-[13px] text-slate-500 font-mono">(CS-2026-012)</span>
          </div>

          <div className="text-[13px] font-bold text-slate-700 mb-4 pb-3 border-b border-slate-100">
             本次变更共包含 12 项变更
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto mb-6">
             {changes.map((change, i) => (
                <div key={i} className="border border-slate-100 rounded-xl p-4 bg-white hover:border-slate-200 transition-colors shadow-sm flex items-start gap-4">
                   <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100/50">
                      {change.icon}
                   </div>
                   <div className="flex-1">
                      <div className="flex items-center justify-between mb-1.5">
                         <div className="text-[13px] font-bold text-blue-700">{change.title}</div>
                         <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${change.tagColor}`}>{change.tag}</span>
                      </div>
                      <div className="text-[14px] font-bold text-slate-900 mb-1.5">{change.desc}</div>
                      <div className="text-[12px] font-medium text-slate-500">{change.detail}</div>
                   </div>
                </div>
             ))}
          </div>

          {/* 变更摘要 */}
          <div className="bg-slate-50/80 rounded-xl border border-slate-100 p-5 shrink-0">
             <h4 className="text-[13px] font-extrabold text-slate-900 mb-4 tracking-wide">变更摘要</h4>
             <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-[13px]">
                <div className="flex items-center">
                   <span className="text-slate-500 w-20 shrink-0 font-medium tracking-wide">影响对象</span>
                   <div className="flex gap-1.5 flex-wrap">
                      <span className="text-[11px] font-mono bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600 shadow-sm">Field</span>
                      <span className="text-[11px] font-mono bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600 shadow-sm">SemanticAssertion</span>
                   </div>
                </div>
                <div className="flex items-center">
                   <span className="text-slate-500 w-20 shrink-0 font-medium tracking-wide">当前阶段</span>
                   <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">审核中</span>
                </div>
                <div className="flex items-center">
                   <span className="text-slate-500 w-20 shrink-0 font-medium tracking-wide">变更发起人</span>
                   <span className="text-slate-900 font-bold">张敏</span>
                </div>
                <div className="flex items-center">
                   <span className="text-slate-500 w-20 shrink-0 font-medium tracking-wide">变更类型</span>
                   <span className="text-slate-900 font-bold">模型变更</span>
                </div>
                <div className="flex items-center">
                   <span className="text-slate-500 w-20 shrink-0 font-medium tracking-wide">创建时间</span>
                   <span className="text-slate-900 font-mono font-medium">2026-06-14 10:35</span>
                </div>
                <div className="flex items-center">
                   <span className="text-slate-500 w-20 shrink-0 font-medium tracking-wide">预计发布版本</span>
                   <span className="text-slate-900 font-mono font-bold">v1.4.0</span>
                </div>
             </div>
          </div>
        </div>

        {/* 右侧：校验与影响分析 */}
        <div className="flex flex-col gap-6 h-[760px]">
          
          {/* 校验结果 */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col shrink-0">
             <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                   <ShieldCheck className="w-5 h-5 text-emerald-500" />
                   <h3 className="text-[15px] font-extrabold text-slate-900">校验结果</h3>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                   校验时间: 2026-06-14 11:02 <RefreshCw className="w-3.5 h-3.5 ml-0.5 cursor-pointer hover:text-slate-700" />
                </div>
             </div>

             <div className="grid grid-cols-3 gap-0 border-y border-slate-100 py-4 mb-5">
                <div className="text-center border-r border-slate-100 last:border-r-0">
                   <div className="text-3xl font-black text-slate-800 mb-1">0</div>
                   <div className="flex items-center justify-center gap-1 text-[12px] font-bold text-slate-600">
                     <XCircle className="w-3.5 h-3.5 text-rose-500" /> 错误
                   </div>
                </div>
                <div className="text-center border-r border-slate-100 last:border-r-0">
                   <div className="text-3xl font-black text-slate-800 mb-1">2</div>
                   <div className="flex items-center justify-center gap-1 text-[12px] font-bold text-slate-600">
                     <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> 警告
                   </div>
                </div>
                <div className="text-center">
                   <div className="text-3xl font-black text-slate-800 mb-1">5</div>
                   <div className="flex items-center justify-center gap-1 text-[12px] font-bold text-slate-600">
                     <Info className="w-3.5 h-3.5 text-blue-500" /> 提示
                   </div>
                </div>
             </div>

             <div className="mb-2">
               <h4 className="text-[12px] font-bold text-slate-500 mb-3 tracking-wide">警告明细</h4>
               <div className="space-y-3">
                  <div className="bg-amber-50/40 border border-amber-100 rounded-lg p-3 hover:bg-amber-50 transition-colors cursor-pointer group flex justify-between items-center">
                     <div className="flex gap-2.5 items-start">
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                           <div className="text-[13px] font-bold text-slate-800 mb-1.5">detectForeignKey() 影响 2 个 Workflow</div>
                           <div className="text-[11px] font-medium text-slate-500 flex gap-1 items-center">
                             关联 Workflow: <span className="font-mono bg-white border border-slate-200 px-1 py-0.5 rounded shadow-sm text-[10px]">SemanticReviewWorkflow</span> <span className="font-mono bg-white border border-slate-200 px-1 py-0.5 rounded shadow-sm text-[10px]">DQAssessmentWorkflow</span>
                           </div>
                        </div>
                     </div>
                     <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
                  </div>
                  
                  <div className="bg-amber-50/40 border border-amber-100 rounded-lg p-3 hover:bg-amber-50 transition-colors cursor-pointer group flex justify-between items-center">
                     <div className="flex gap-2.5 items-start">
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                           <div className="text-[13px] font-bold text-slate-800 mb-1.5">maps_to 关系会影响 3 个 DKN Mapping</div>
                           <div className="text-[11px] font-medium text-slate-500 flex gap-1 items-center">
                             关联 Mapping: <span className="bg-white border border-slate-200 px-1 py-0.5 rounded shadow-sm text-[10px]">领域映射</span> <span className="bg-white border border-slate-200 px-1 py-0.5 rounded shadow-sm text-[10px]">术语映射</span> <span className="bg-white border border-slate-200 px-1 py-0.5 rounded shadow-sm text-[10px]">指标映射</span>
                           </div>
                        </div>
                     </div>
                     <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
                  </div>
               </div>
               
               <div className="mt-4 flex justify-end">
                 <button className="text-[12px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer">
                   查看全部 2 条警告 <ChevronRight className="w-3.5 h-3.5" />
                 </button>
               </div>
             </div>
          </div>

          {/* 影响分析 */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col flex-1">
             <div className="flex items-center gap-2 mb-6">
                <div className="w-6 h-6 rounded bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0"><Network className="w-3.5 h-3.5" /></div>
                <h3 className="text-[15px] font-extrabold text-slate-900">影响分析</h3>
             </div>

             <div className="space-y-4 mb-6">
                <div className="flex items-baseline justify-between border-b border-slate-50 pb-3">
                   <div className="text-[13px] font-bold text-slate-700 w-32 shrink-0">影响 Object Type</div>
                   <div className="flex-1 flex items-center justify-between">
                     <span className="text-[12px] font-mono text-slate-500">Field、SemanticAssertion</span>
                     <span className="text-[13px] font-medium text-slate-500 text-right w-8">2 个</span>
                   </div>
                </div>
                <div className="flex items-baseline justify-between border-b border-slate-50 pb-3">
                   <div className="text-[13px] font-bold text-slate-700 w-32 shrink-0">影响 Link Type</div>
                   <div className="flex-1 flex items-center justify-between">
                     <span className="text-[12px] font-mono text-slate-500">maps_to、has_assertion</span>
                     <span className="text-[13px] font-medium text-slate-500 text-right w-8">2 个</span>
                   </div>
                </div>
                <div className="flex items-baseline justify-between border-b border-slate-50 pb-3">
                   <div className="text-[13px] font-bold text-slate-700 w-32 shrink-0">影响 Function</div>
                   <div className="flex-1 flex items-center justify-between">
                     <span className="text-[12px] font-mono text-slate-500">detectForeignKey()</span>
                     <span className="text-[13px] font-medium text-slate-500 text-right w-8">1 个</span>
                   </div>
                </div>
                <div className="flex items-baseline justify-between border-b border-slate-50 pb-3">
                   <div className="text-[13px] font-bold text-slate-700 w-32 shrink-0">影响 Workflow</div>
                   <div className="flex-1 flex items-center justify-between">
                     <span className="text-[12px] font-mono text-slate-500">SemanticReviewWorkflow</span>
                     <span className="text-[13px] font-medium text-slate-500 text-right w-8">1 个</span>
                   </div>
                </div>
                <div className="flex items-baseline justify-between border-b border-slate-50 pb-3">
                   <div className="text-[13px] font-bold text-slate-700 w-32 shrink-0">影响知识网络视图</div>
                   <div className="flex-1 flex items-center justify-between">
                     <span className="text-[12px] font-medium text-slate-500">DRKN 网络、跨层映射网络</span>
                     <span className="text-[13px] font-medium text-slate-500 text-right w-8">2 个</span>
                   </div>
                </div>
                <div className="flex items-baseline justify-between pb-1">
                   <div className="text-[13px] font-bold text-slate-700 w-32 shrink-0">影响 AI 场景</div>
                   <div className="flex-1 flex items-center justify-between">
                     <span className="text-[12px] font-medium text-slate-500">字段解释、语义纠错</span>
                     <span className="text-[13px] font-medium text-slate-500 text-right w-8">2 个</span>
                   </div>
                </div>
             </div>

             <div className="mt-auto flex justify-end">
               <button className="text-[12px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer">
                 查看完整影响分析报告 <ChevronRight className="w-3.5 h-3.5" />
               </button>
             </div>
          </div>

        </div>

      </div>

      {/* 底部：发布流程时间线 */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm px-8 py-6 mb-8 mt-2">
         <h3 className="text-[14px] font-extrabold text-slate-900 mb-8 tracking-wide">发布流程 <span className="text-[13px] font-medium text-slate-500 ml-1">(模型变更发布闭环)</span></h3>
         
         <div className="flex items-start justify-between relative px-4">
            {/* Background connecting line */}
            <div className="absolute top-4 left-10 right-10 h-0.5 bg-slate-100 z-0"></div>

            {[
              { idx: 1, label: '新建变更集', author: '张敏', time: '2026-06-14 10:35', state: 'done', icon: <FilePlus className="w-4 h-4" /> },
              { idx: 2, label: '编辑模型', author: '张敏', time: '2026-06-14 10:41', state: 'done', icon: <Code className="w-4 h-4" /> },
              { idx: 3, label: '自动校验', author: '系统', time: '2026-06-14 11:02', state: 'done', icon: <ShieldCheck className="w-4 h-4" /> },
              { idx: 4, label: '影响分析', author: '系统', time: '2026-06-14 11:05', state: 'done', icon: <Network className="w-4 h-4" /> },
              { idx: 5, label: '提交审核', desc1: '当前步骤', desc2: '等待提交', state: 'current', icon: <FileCheck className="w-5 h-5" /> },
              { idx: 6, label: '审批通过', desc1: '待审批', state: 'pending', icon: <User className="w-4 h-4" /> },
              { idx: 7, label: '发布新版本', desc1: '待发布', state: 'pending', icon: <Rocket className="w-4 h-4" /> },
              { idx: 8, label: '刷新知识网络', desc1: '待刷新', state: 'pending', icon: <RefreshCw className="w-4 h-4" /> },
              { idx: 9, label: 'AI 工作台使用', desc1: '待生效', state: 'pending', icon: <Monitor className="w-4 h-4" /> }
            ].map((step, i) => (
               <div key={i} className="flex flex-col items-center relative z-10 w-28">
                  {/* The connected lines overlapping mechanism for done steps */}
                  {i > 0 && (step.state === 'done' || step.state === 'current') && (
                     <div className="absolute top-4 -left-[calc(50%+1.5rem)] right-1/2 h-0.5 bg-blue-600 -z-10 w-[calc(100%-3rem)] ml-[1.5rem]"></div>
                  )}

                  {step.state === 'done' && (
                     <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center mb-3 shadow-[0_0_0_4px_rgba(255,255,255,1)]">
                        <Check className="w-4 h-4" strokeWidth={3} />
                     </div>
                  )}
                  {step.state === 'current' && (
                     <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center mb-2 shadow-[0_0_0_4px_rgba(255,255,255,1),_0_0_0_8px_rgba(37,99,235,0.1)] relative -top-1">
                        {step.icon}
                     </div>
                  )}
                  {step.state === 'pending' && (
                     <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-200 text-slate-400 flex items-center justify-center mb-3 shadow-[0_0_0_4px_rgba(255,255,255,1)]">
                        <span className="text-[12px] font-bold">{step.idx}</span>
                     </div>
                  )}

                  <div className={`text-[13px] font-extrabold mb-1.5 ${step.state === 'current' ? 'text-blue-600' : (step.state === 'done' ? 'text-slate-900' : 'text-slate-500')}`}>
                     {step.label}
                  </div>
                  
                  {step.state === 'done' && (
                     <div className="text-center font-mono">
                        <div className="text-[11px] text-slate-500">{step.time}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{step.author}</div>
                     </div>
                  )}
                  
                  {step.state === 'current' && (
                     <div className="text-center">
                        <div className="text-[12px] font-bold text-blue-600">{step.desc1}</div>
                        <div className="text-[11px] text-blue-500 mt-0.5 font-medium">{step.desc2}</div>
                     </div>
                  )}

                  {step.state === 'pending' && (
                     <div className="text-center">
                        <div className="text-[12px] text-slate-400 font-medium">{step.desc1}</div>
                     </div>
                  )}
               </div>
            ))}
         </div>
      </div>

    </div>
  );
}
