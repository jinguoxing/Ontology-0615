import React, { useState } from 'react';
import { Capability, ObjectType } from '../types';
import { 
  Database, Box, FileText, Shield, ClipboardCopy, 
  Layers, AlertTriangle, Target, Play, FileCode, CheckCircle2,
  ChevronRight, Search, Settings, Star, Link as LinkIcon, Edit, Download, Check, Menu, ArrowRight, Info,
  RefreshCw, ChevronDown
} from 'lucide-react';
import CreateFunctionBindingDrawer from './CreateFunctionBindingDrawer';

interface CapabilityBindingProps {
  capabilities: Capability[];
  objectTypes: ObjectType[];
  selectedObjectId: string;
  onSelectObject: (id: string) => void;
  onNavigate: (view: string, targetId?: string) => void;
  isEditingActive: boolean;
  onUpdateCapabilities: (updated: Capability[]) => void;
}

export default function CapabilityBinding({
  onNavigate
}: CapabilityBindingProps) {

  // Current active chosen Object Type (Hardcode Field per requirement)
  const selectedObjId = 'Field';
  
  // Current active chosen Capability (Hardcode classifyFieldSemantic per requirement)
  const [activeCapId, setActiveCapId] = useState('classifyFieldSemantic()');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Hardcoded left objects per requirement
  const localObjects = [
    { id: 'DataSource', nameCn: '数据源', count: 12 },
    { id: 'DataAsset', nameCn: '数据资产', count: 14 },
    { id: 'Field', nameCn: '字段对象', count: 11 },
    { id: 'SemanticAssertion', nameCn: '语义断言', count: 9 },
    { id: 'Evidence', nameCn: '证据', count: 8 },
    { id: 'DataQualityRule', nameCn: '质量规则', count: 10 },
    { id: 'DataIssue', nameCn: '数据问题', count: 7 },
    { id: 'GovernanceTask', nameCn: '治理任务', count: 9 },
    { id: 'Run', nameCn: '运行记录', count: 6 },
    { id: 'Snapshot', nameCn: '快照', count: 5 }
  ];

  const getObjIcon = (id: string, className = "h-4 w-4") => {
    switch (id) {
      case 'DataSource': return <Database className={className} />;
      case 'DataAsset': return <Box className={className} />;
      case 'Field': return <FileText className={className} />;
      case 'SemanticAssertion': return <Shield className={className} />;
      case 'Evidence': return <FileCode className={className} />;
      case 'DataQualityRule': return <CheckCircle2 className={className} />;
      case 'DataIssue': return <AlertTriangle className={className} />;
      case 'GovernanceTask': return <Target className={className} />;
      case 'Run': return <Play className={className} />;
      case 'Snapshot': return <Box className={className} />;
      default: return <Box className={className} />;
    }
  };

  const getCapColor = (type: string) => {
    return type === 'Function' ? 'text-blue-600 bg-blue-50 border-blue-200' : 'text-orange-600 bg-orange-50 border-orange-200';
  };

  const getAiAvailabilityColor = (val: string) => {
    if (val === '是') return 'text-emerald-500';
    if (val === '否') return 'text-rose-500';
    return 'text-amber-500';
  };

  return (
    <div className="min-h-full font-sans bg-transparent" id="capability-workspace">
      
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
             <span className="text-slate-800 font-black">能力绑定</span>
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
              + 添加 Function 绑定 <ChevronDown className="w-3.5 h-3.5" />
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
              tab === '能力绑定' 
                ? 'text-blue-600 font-black border-b-[2.5px] border-blue-600 -mb-[1px]' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
        
        {/* 左栏：对象类型列表 */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col h-[850px]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-extrabold text-slate-900">对象类型列表</h3>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="搜索对象类型"
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="space-y-2 pt-2 flex-col overflow-y-auto pb-4">
            {localObjects.map((obj, idx) => {
              const isActive = selectedObjId === obj.id;
              // Hardcode red icon class for DataIssue based on getObjIcon returning red
              const isDanger = obj.id === 'DataIssue';
              return (
                <div 
                  key={idx}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isActive 
                      ? 'bg-blue-50/80 border-blue-200' 
                      : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                       <div className={`mt-0.5 ${isActive ? 'text-blue-600' : isDanger ? 'text-red-500' : 'text-blue-500'}`}>
                         {getObjIcon(obj.id, "w-5 h-5")}
                       </div>
                       <div>
                         <div className={`text-[15px] font-bold ${isActive ? 'text-blue-700' : 'text-slate-800'}`}>{obj.id}</div>
                         <div className={`text-[12px] font-medium ${isActive ? 'text-blue-600/80' : 'text-slate-500'}`}>{obj.nameCn}</div>
                       </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                       <span className="text-[12px] font-medium text-slate-500">{obj.count} 能力</span>
                       <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">已发布</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-slate-500 text-[13px] font-medium shrink-0">
             <span>共 10 项</span>
             <div className="flex items-center gap-1">
               <ChevronRight className="w-4 h-4 rotate-180 cursor-not-allowed text-slate-300" />
               <ChevronRight className="w-4 h-4 cursor-not-allowed text-slate-300" />
             </div>
          </div>
        </div>

        {/* 中栏：能力矩阵栏 */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col h-[850px] overflow-y-auto">
          
          <div className="flex items-center gap-2 mb-6">
             <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                Field (字段对象) 的能力绑定
                <Info className="w-4 h-4 text-slate-400" />
             </h2>
          </div>

          {/* Sub-tabs inside Field Matrix */}
           <div className="flex gap-6 mb-6 border-b border-slate-200">
             <div className="pb-3 text-[14px] font-bold cursor-pointer transition-colors text-blue-600 border-b-2 border-blue-600 -mb-[1px]">能力矩阵</div>
             <div className="pb-3 text-[14px] font-bold cursor-pointer transition-colors text-slate-500 hover:text-slate-800">绑定视图</div>
             <div className="pb-3 text-[14px] font-bold cursor-pointer transition-colors text-slate-500 hover:text-slate-800">依赖视图</div>
           </div>
          
          {/* Function Group */}
          <div className="mb-8">
            <h3 className="text-[15px] font-bold text-slate-800 mb-4 flex items-center">
               Function <span className="text-slate-500 font-medium text-[13px] ml-2">(计算 / 识别 / 判断类)</span>
            </h3>
            
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200">
                   <th className="py-3 px-2 text-[12px] font-bold text-slate-500">能力名称</th>
                   <th className="py-3 px-2 text-[12px] font-bold text-slate-500">类型</th>
                   <th className="py-3 px-2 text-[12px] font-bold text-slate-500">输入对象</th>
                   <th className="py-3 px-2 text-[12px] font-bold text-slate-500">输出 / 状态变化</th>
                   <th className="py-3 px-2 text-[12px] font-bold text-slate-500">AI 可用</th>
                   <th className="py-3 px-2 text-[12px] font-bold text-slate-500">Workflow 使用</th>
                   <th className="py-3 px-2 text-[12px] font-bold text-slate-500">权限策略</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'profileField()', cn: '字段画像', type: 'Function', in: 'Field', out: 'FieldProfileResult', ai: '是', wf: 'SemanticReview', auth: '数据治理人员' },
                  { name: 'classifyFieldSemantic()', cn: '字段语义分类', type: 'Function', in: 'Field +\nEvidence', out: 'SemanticClassification', ai: '是', wf: 'SemanticReview', auth: '数据治理人员' },
                  { name: 'computeSemanticScore()', cn: '计算语义置信度', type: 'Function', in: 'Evidence Set', out: 'Score (0-1)', ai: '是', wf: 'SemanticReview', auth: '数据治理人员' },
                  { name: 'detectPrimaryKey()', cn: '识别主键', type: 'Function', in: 'Field +\nDataAsset', out: 'Boolean', ai: '是', wf: 'KeyDetectionFlow', auth: '数据治理人员' },
                  { name: 'detectForeignKey()', cn: '识别外键', type: 'Function', in: 'Field +\nDataAsset', out: 'ForeignKeyCandidate', ai: '是', wf: 'KeyDetectionFlow', auth: '数据治理人员' },
                ].map((row, i) => {
                  const isActive = activeCapId === row.name;
                  return (
                    <tr 
                      key={i} 
                      onClick={() => setActiveCapId(row.name)}
                      className={`border-b border-slate-100 cursor-pointer transition-colors ${isActive ? 'bg-blue-50/50 outline outline-1 outline-blue-200' : 'hover:bg-slate-50'}`}
                    >
                      <td className="py-3 px-2">
                        <div className="font-mono text-[13px] font-bold text-slate-900">{row.name}</div>
                        <div className="text-[11px] font-medium text-slate-500 mt-0.5">{row.cn}</div>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getCapColor(row.type)}`}>{row.type}</span>
                      </td>
                      <td className="py-3 px-2 text-[12px] text-slate-600 font-mono whitespace-pre-line">{row.in}</td>
                      <td className="py-3 px-2 text-[12px] text-slate-600 font-mono">{row.out}</td>
                      <td className="py-3 px-2 text-[12px] text-slate-600 font-medium">
                        <div className="flex items-center gap-1.5">
                          {row.ai === '是' && <CheckCircle2 className={`w-3.5 h-3.5 ${getAiAvailabilityColor(row.ai)}`} />}
                          {row.ai}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-[12px] text-slate-600">{row.wf}</td>
                      <td className="py-3 px-2 text-[12px] text-slate-600">{row.auth}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Action Group */}
          <div className="mb-4">
            <h3 className="text-[15px] font-bold text-slate-800 mb-4 flex items-center">
               Action <span className="text-slate-500 font-medium text-[13px] ml-2">(创建 / 确认 / 发布 / 状态变更类)</span>
            </h3>
            
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200">
                   <th className="py-3 px-2 text-[12px] font-bold text-slate-500">能力名称</th>
                   <th className="py-3 px-2 text-[12px] font-bold text-slate-500">类型</th>
                   <th className="py-3 px-2 text-[12px] font-bold text-slate-500">输入对象</th>
                   <th className="py-3 px-2 text-[12px] font-bold text-slate-500">输出 / 状态变化</th>
                   <th className="py-3 px-2 text-[12px] font-bold text-slate-500">AI 可用</th>
                   <th className="py-3 px-2 text-[12px] font-bold text-slate-500">Workflow 使用</th>
                   <th className="py-3 px-2 text-[12px] font-bold text-slate-500">权限策略</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'createSemanticAssertion', cn: '创建语义断言', type: 'Action', in: 'Field', out: '创建 SemanticAssertion', ai: '否', wf: 'SemanticReview', auth: '数据治理人员' },
                  { name: 'markUnknown', cn: '标记为未知', type: 'Action', in: 'SemanticAssertion', out: 'Pending → Unknown', ai: '可建议', wf: 'SemanticReview', auth: '数据治理人员' },
                  { name: 'createGovernanceTask', cn: '创建治理任务', type: 'Action', in: 'Field / DataIssue', out: '创建 GovernanceTask', ai: '否', wf: 'IssueHandlingFlow', auth: '数据治理人员' },
                ].map((row, i) => {
                  const isActive = activeCapId === row.name;
                  return (
                     <tr 
                      key={i} 
                      onClick={() => setActiveCapId(row.name)}
                      className={`border-b border-slate-100 cursor-pointer transition-colors ${isActive ? 'bg-blue-50/50 outline outline-1 outline-blue-200' : 'hover:bg-slate-50'}`}
                    >
                      <td className="py-3 px-2">
                        <div className="font-mono text-[13px] font-bold text-slate-900">{row.name}</div>
                        <div className="text-[11px] font-medium text-slate-500 mt-0.5">{row.cn}</div>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getCapColor(row.type)}`}>{row.type}</span>
                      </td>
                      <td className="py-3 px-2 text-[12px] text-slate-600 font-mono">{row.in}</td>
                      <td className="py-3 px-2 text-[12px] text-slate-600 font-mono text-[11px] whitespace-pre-wrap">{row.out}</td>
                      <td className="py-3 px-2 text-[12px] text-slate-600 font-medium">
                        <div className="flex items-center gap-1.5">
                          {row.ai === '是' && <CheckCircle2 className={`w-3.5 h-3.5 text-emerald-500`} />}
                          {row.ai === '否' && <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center bg-rose-100 text-rose-500 text-[10px]`}>✕</div>}
                          {row.ai === '可建议' && <CheckCircle2 className={`w-3.5 h-3.5 text-amber-500`} />}
                          {row.ai}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-[12px] text-slate-600">{row.wf}</td>
                      <td className="py-3 px-2 text-[12px] text-slate-600">{row.auth}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <div className="mt-auto pt-6 flex items-start gap-2 text-[12px] text-slate-500 leading-tight">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            说明：能力仅对已发布的对象生效，未发布的变更需发布后才能在 Workflow 与 AI 场景中使用。
          </div>
          
        </div>

        {/* 右栏：能力详情面板 */}
        <div className="lg:col-span-3 h-[850px] flex flex-col gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col shrink-[0]">
            
            <div className="flex items-center justify-between mb-6">
               <h3 className="text-base font-extrabold text-slate-900">能力详情</h3>
               <button className="flex items-center gap-1.5 text-[13px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-100">
                 <Edit className="w-3.5 h-3.5" /> 编辑
               </button>
            </div>
            
            <div className="flex items-start gap-3 mb-6">
              <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 italic font-bold border border-blue-100 text-[20px]">
                 fx
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[17px] font-bold text-slate-900">classifyFieldSemantic()</span>
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 mt-0.5">已发布</span>
                </div>
              </div>
            </div>

            <div className="space-y-5 text-[13px]">
              <div className="flex">
                <span className="w-24 text-slate-500 shrink-0 font-medium">类型</span>
                <span className="text-slate-800 font-mono">Function</span>
              </div>
              <div className="flex">
                <span className="w-24 text-slate-500 shrink-0 font-medium">用途</span>
                <span className="text-slate-800">字段语义分类</span>
              </div>
              <div className="flex">
                <span className="w-24 text-slate-500 shrink-0 font-medium">输入</span>
                <span className="text-slate-800 font-mono">Field + Evidence</span>
              </div>
              <div className="flex">
                <span className="w-24 text-slate-500 shrink-0 font-medium">输出</span>
                <span className="text-slate-800 font-mono">SemanticClassification</span>
              </div>
              <div className="flex">
                <span className="w-24 text-slate-500 shrink-0 font-medium">是否改变状态</span>
                <span className="text-slate-800 font-medium">否 <span className="text-slate-500 font-normal">（只计算，不修改状态）</span></span>
              </div>
              <div className="flex items-center">
                <span className="w-24 text-slate-500 shrink-0 font-medium">AI 可调用</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-1.5" /> <span className="text-slate-800 font-medium">是</span>
              </div>
              <div className="flex">
                <span className="w-24 text-slate-500 shrink-0 font-medium">使用位置</span>
                <span className="text-slate-800 leading-normal font-mono">SemanticReviewWorkflow、<br />AI 工作台</span>
              </div>
              <div className="flex">
                <span className="w-24 text-slate-500 shrink-0 font-medium">权限策略</span>
                <span className="text-slate-800">数据治理人员</span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <h4 className="text-sm font-extrabold text-slate-900 mb-3">能力描述</h4>
              <p className="text-[13px] text-slate-600 leading-relaxed font-medium">
                基于证据对字段进行语义分类，输出字段的语义类型及置信度结果。
              </p>
            </div>
            
          </div>
          
          <div className="bg-slate-50 border border-slate-200 rounded-2xl shadow-sm p-5 flex flex-col w-full h-full justify-center">
             <div className="flex items-center gap-2 mb-4">
                <Info className="w-5 h-5 text-blue-500" />
                <h4 className="text-[14px] font-extrabold text-slate-900">能力规则提示</h4>
             </div>
             
             <div className="border-l-[3px] border-blue-500 pl-4 py-1 mb-5">
               <div className="text-[13px] font-bold text-blue-700 mb-1 flex items-center gap-1.5">
                 <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Function 只负责计算、识别、判断
               </div>
               <div className="text-[12px] text-slate-600 font-medium pl-3">不改变任何对象的状态，输出计算结果用于决策。</div>
             </div>
             
             <div className="border-l-[3px] border-orange-400 pl-4 py-1">
               <div className="text-[13px] font-bold text-orange-600 mb-1 flex items-center gap-1.5">
                 <div className="w-1.5 h-1.5 rounded-full bg-orange-400"></div> Action 负责创建、确认、发布和状态变化
               </div>
               <div className="text-[12px] text-slate-600 font-medium pl-3">对对象进行实际操作，驱动治理流程的执行与状态变更。</div>
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
            <CreateFunctionBindingDrawer 
               onClose={() => setIsDrawerOpen(false)} 
               onSave={() => setIsDrawerOpen(false)} 
               selectedObject={selectedObjId}
            />
         </>
      )}

    </div>
  );
}
