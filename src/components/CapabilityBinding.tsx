import React, { useState, useEffect } from 'react';
import { Capability, ObjectType } from '../types';
import {
  Database, Box, FileText, Shield, ClipboardCopy,
  Layers, AlertTriangle, Target, Play, FileCode, CheckCircle2,
  ChevronRight, Search, Settings, Star, Link as LinkIcon, Edit, Download, Check, Menu, ArrowRight, Info,
  RefreshCw, ChevronDown
} from 'lucide-react';
import CreateFunctionBindingDrawer from './CreateFunctionBindingDrawer';
import {useUiStore} from '../store/uiStore';
import {PageHeader} from './ui/PageHeader';
import {DknPageHeader} from './ui/DknPageHeader';

export default function CapabilityBinding() {
  const navigate = useUiStore((s) => s.navigate);
  const modelType = useUiStore((s) => s.modelType);

  // Current active chosen Object Type (Hardcode Field per requirement)
  const selectedObjId = 'Field';
  
  // Current active chosen Capability (Hardcode classifyFieldSemantic per requirement)
  const [activeCapId, setActiveCapId] = useState('classifyFieldSemantic()');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editCn, setEditCn] = useState('');
  const [editIn, setEditIn] = useState('');
  const [editOut, setEditOut] = useState('');
  const [editWf, setEditWf] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editIsStateChange, setEditIsStateChange] = useState('');
  const [editAi, setEditAi] = useState('');
  const [editAuth, setEditAuth] = useState('');

  const [functionDetails, setFunctionDetails] = useState<Record<string, {
    name: string;
    cn: string;
    type: string;
    in: string;
    out: string;
    isStateChange: string;
    ai: string;
    wf: string;
    auth: string;
    desc: string;
  }>>({
    'profileField()': {
      name: 'profileField()',
      cn: '字段画像',
      type: 'Function',
      in: 'Field',
      out: 'FieldProfileResult',
      isStateChange: '否 （只计算，不修改状态）',
      ai: '是',
      wf: 'SemanticReview',
      auth: '数据治理人员',
      desc: '分析字段的数据特征、数据分布、空值率以及唯一性特征，输出字段 of 画像结果。'
    },
    'classifyFieldSemantic()': {
      name: 'classifyFieldSemantic()',
      cn: '字段语义分类',
      type: 'Function',
      in: 'Field +\nEvidence',
      out: 'SemanticClassification',
      isStateChange: '否 （只计算，不修改状态）',
      ai: '是',
      wf: 'SemanticReview',
      auth: '数据治理人员',
      desc: '基于证据对字段进行语义分类，输出字段 of 语义类型及置信度结果。'
    },
    'computeSemanticScore()': {
      name: 'computeSemanticScore()',
      cn: '计算语义置信度',
      type: 'Function',
      in: 'Evidence Set',
      out: 'Score (0-1)',
      isStateChange: '否 （只计算，不修改状态）',
      ai: '是',
      wf: 'SemanticReview',
      auth: '数据治理人员',
      desc: '汇聚多重治理凭证证据集，计算当前字段语义判定的最终综合置信度得分。'
    },
    'detectPrimaryKey()': {
      name: 'detectPrimaryKey()',
      cn: '识别主键',
      type: 'Function',
      in: 'Field +\nDataAsset',
      out: 'Boolean',
      isStateChange: '否 （只计算，不修改状态）',
      ai: '是',
      wf: 'KeyDetectionFlow',
      auth: '数据治理人员',
      desc: '基于字段唯一性特征和数据资产属性，智能识别字段是否为主键标识。'
    },
    'detectForeignKey()': {
      name: 'detectForeignKey()',
      cn: '识别外键',
      type: 'Function',
      in: 'Field +\nDataAsset',
      out: 'ForeignKeyCandidate',
      isStateChange: '否 （只计算，不修改状态）',
      ai: '是',
      wf: 'KeyDetectionFlow',
      auth: '数据治理人员',
      desc: '基于字段值重合度和外键命名规范，智能识别字段是否为潜在的外键关联字段。'
    }
  });

  const currentDetail = functionDetails[activeCapId] || functionDetails['classifyFieldSemantic()'];

  useEffect(() => {
    setIsEditing(false);
  }, [activeCapId]);

  const startEditing = () => {
    setEditCn(currentDetail.cn);
    setEditIn(currentDetail.in.replace(/\n/g, ' '));
    setEditOut(currentDetail.out);
    setEditWf(currentDetail.wf);
    setEditDesc(currentDetail.desc);
    setEditIsStateChange(currentDetail.isStateChange);
    setEditAi(currentDetail.ai);
    setEditAuth(currentDetail.auth);
    setIsEditing(true);
  };

  const handleSave = () => {
    setFunctionDetails(prev => ({
      ...prev,
      [activeCapId]: {
        ...prev[activeCapId],
        cn: editCn,
        in: editIn,
        out: editOut,
        wf: editWf,
        desc: editDesc,
        isStateChange: editIsStateChange,
        ai: editAi,
        auth: editAuth,
      }
    }));
    setIsEditing(false);
  };

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
      {/* 顶部 Header */}
      {modelType === 'DKN' ? (
        <DknPageHeader />
      ) : (
        <PageHeader
          breadcrumbs={[
            {label: '管理中心', onClick: () => navigate('overview')},
            {label: '本体管理'},
            {label: 'DRKN 本体模型管理'},
            {label: '函数（Function）'},
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
                  className="px-4 py-1.5 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs hover:shadow-blue-500/10 flex items-center gap-1 cursor-pointer transition-all"
                >
                  + 添加 Function 绑定 <ChevronDown className="w-3.5 h-3.5" />
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
              const isActive = tab === '函数';
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
              className="px-4 py-1.5 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs hover:shadow-blue-500/10 flex items-center gap-1 cursor-pointer transition-all"
            >
              + 添加 Function 绑定 <ChevronDown className="w-3.5 h-3.5" />
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
                  tab === '函数（Function）' 
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
        
        {/* 左栏：对象类型列表 */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4 flex flex-col h-[850px]">
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
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
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
                       <span className="text-[12px] font-medium text-slate-500">{obj.count} 个 Function</span>
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

        {/* 中栏：Function 矩阵栏 */}
        <div className={`bg-white border border-slate-200 rounded-lg shadow-sm p-6 flex flex-col h-[850px] overflow-y-auto transition-all duration-300 ${
          isRightSidebarOpen ? 'lg:col-span-6' : 'lg:col-span-9'
        }`}>
          
          <div className="flex items-center justify-between gap-4 mb-6">
             <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                Field (字段对象) 的函数（Function）绑定
                <Info className="w-4 h-4 text-slate-400" />
             </h2>
             <button
               onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
               className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200/50 hover:bg-slate-50/50 hover:text-slate-800 rounded-lg text-xs font-bold text-slate-600 shadow-3xs hover:border-slate-300/80 hover:shadow-2xs transition-all cursor-pointer"
             >
               {isRightSidebarOpen ? "收起右栏" : "展开右栏"}
             </button>
          </div>

          {/* Sub-tabs inside Field Matrix */}
           <div className="flex gap-6 mb-6 border-b border-slate-200">
             <div className="pb-3 text-[14px] font-bold cursor-pointer transition-colors text-blue-600 border-b-2 border-blue-600 -mb-[1px]">Function 矩阵</div>
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
                   <th className="py-3 px-2 text-[12px] font-bold text-slate-500">Function 名称</th>
                   <th className="py-3 px-2 text-[12px] font-bold text-slate-500">类型</th>
                   <th className="py-3 px-2 text-[12px] font-bold text-slate-500">输入对象</th>
                   <th className="py-3 px-2 text-[12px] font-bold text-slate-500">输出 / 状态变化</th>
                   <th className="py-3 px-2 text-[12px] font-bold text-slate-500">AI 可用</th>
                   <th className="py-3 px-2 text-[12px] font-bold text-slate-500">Workflow 使用</th>
                   <th className="py-3 px-2 text-[12px] font-bold text-slate-500">权限策略</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(functionDetails).map((row: any, i) => {
                  const isActive = activeCapId === row.name;
                  return (
                    <tr 
                      key={i} 
                      onClick={() => {
                        setActiveCapId(row.name);
                        setIsRightSidebarOpen(true);
                      }}
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
          
          <div className="mt-auto pt-6 flex items-start gap-2 text-[12px] text-slate-500 leading-tight">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            说明：函数仅对已发布的对象生效，未发布的变更需发布后才能在 Workflow 与 AI 场景中使用。
          </div>
          
        </div>

        {/* 右栏：Function 详情面板 */}
        {isRightSidebarOpen && (
          <div className="lg:col-span-3 h-[850px] flex flex-col gap-6 animate-fade-in animate-duration-200 overflow-y-auto scrollbar-thin">
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 flex flex-col shrink-[0]">
            
            <div className="flex items-center justify-between mb-6">
               <h3 className="text-base font-extrabold text-slate-900">Function 详情</h3>
               {isEditing ? (
                 <div className="flex gap-1.5">
                   <button 
                     onClick={() => setIsEditing(false)}
                     className="px-2.5 py-1 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
                   >
                     取消
                   </button>
                   <button 
                     onClick={handleSave}
                     className="px-2.5 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
                   >
                     保存
                   </button>
                 </div>
               ) : (
                 <button 
                   onClick={startEditing}
                   className="flex items-center gap-1.5 text-[12px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-100 cursor-pointer"
                 >
                   <Edit className="w-3.5 h-3.5" /> 编辑
                 </button>
               )}
            </div>
            
            <div className="flex items-start gap-3 mb-6">
              <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 italic font-bold border border-blue-100 text-[20px]">
                 fx
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[17px] font-bold text-slate-900">{currentDetail.name}</span>
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 mt-0.5">已发布</span>
                </div>
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-4 text-[13px]">
                <div className="flex items-center border-b border-slate-50 pb-2">
                  <span className="w-24 text-slate-500 shrink-0 font-medium">类型</span>
                  <span className="text-slate-808 font-mono bg-slate-50 border border-slate-200/50 px-2 py-0.5 rounded text-[12px]">{currentDetail.type}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-slate-500 font-medium">用途</span>
                  <input 
                    type="text" 
                    value={editCn} 
                    onChange={(e) => setEditCn(e.target.value)} 
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-slate-805 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs font-semibold"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-slate-500 font-medium">输入</span>
                  <input 
                    type="text" 
                    value={editIn} 
                    onChange={(e) => setEditIn(e.target.value)} 
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-slate-805 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-slate-500 font-medium">输出</span>
                  <input 
                    type="text" 
                    value={editOut} 
                    onChange={(e) => setEditOut(e.target.value)} 
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-slate-805 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-slate-500 font-medium">是否改变状态</span>
                  <select 
                    value={editIsStateChange} 
                    onChange={(e) => setEditIsStateChange(e.target.value)} 
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-slate-805 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs font-semibold"
                  >
                    <option value="否 （只计算，不修改状态）">否 （只计算，不修改状态）</option>
                    <option value="是 （修改状态）">是 （修改状态）</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-slate-500 font-medium">AI 可调用</span>
                  <select 
                    value={editAi} 
                    onChange={(e) => setEditAi(e.target.value)} 
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-slate-805 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs font-semibold"
                  >
                    <option value="是">是</option>
                    <option value="否">否</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-slate-500 font-medium">使用位置</span>
                  <input 
                    type="text" 
                    value={editWf} 
                    onChange={(e) => setEditWf(e.target.value)} 
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-slate-805 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-slate-500 font-medium">权限策略</span>
                  <input 
                    type="text" 
                    value={editAuth} 
                    onChange={(e) => setEditAuth(e.target.value)} 
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-slate-805 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs font-semibold"
                  />
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-1">
                  <span className="text-slate-500 font-medium">Function 描述</span>
                  <textarea 
                    rows={3}
                    value={editDesc} 
                    onChange={(e) => setEditDesc(e.target.value)} 
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-slate-805 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs leading-normal resize-none"
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-5 text-[13px]">
                  <div className="flex">
                    <span className="w-24 text-slate-500 shrink-0 font-medium">类型</span>
                    <span className="text-slate-800 font-mono">{currentDetail.type}</span>
                  </div>
                  <div className="flex">
                    <span className="w-24 text-slate-500 shrink-0 font-medium">用途</span>
                    <span className="text-slate-800">{currentDetail.cn}</span>
                  </div>
                  <div className="flex">
                    <span className="w-24 text-slate-500 shrink-0 font-medium">输入</span>
                    <span className="text-slate-800 font-mono">{currentDetail.in}</span>
                  </div>
                  <div className="flex">
                    <span className="w-24 text-slate-500 shrink-0 font-medium">输出</span>
                    <span className="text-slate-800 font-mono">{currentDetail.out}</span>
                  </div>
                  <div className="flex">
                    <span className="w-24 text-slate-500 shrink-0 font-medium">是否改变状态</span>
                    <span className="text-slate-800 font-medium">{currentDetail.isStateChange}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-24 text-slate-500 shrink-0 font-medium">AI 可调用</span>
                    {currentDetail.ai === '是' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-1.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-500 mr-1.5" />
                    )}
                    <span className="text-slate-800 font-medium">{currentDetail.ai}</span>
                  </div>
                  <div className="flex">
                    <span className="w-24 text-slate-500 shrink-0 font-medium">使用位置</span>
                    <span className="text-slate-800 leading-normal font-mono">{currentDetail.wf}</span>
                  </div>
                  <div className="flex">
                    <span className="w-24 text-slate-500 shrink-0 font-medium">权限策略</span>
                    <span className="text-slate-800">{currentDetail.auth}</span>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100">
                  <h4 className="text-sm font-extrabold text-slate-900 mb-3">Function 描述</h4>
                  <p className="text-[13px] text-slate-600 leading-relaxed font-medium">
                    {currentDetail.desc}
                  </p>
                </div>
              </>
            )}
            
          </div>
          
          <div className="bg-slate-50 border border-slate-200 rounded-lg shadow-sm p-5 flex flex-col w-full h-full justify-center">
             <div className="flex items-center gap-2 mb-4">
                <Info className="w-5 h-5 text-blue-500" />
                <h4 className="text-[14px] font-extrabold text-slate-900">Function 规则提示</h4>
             </div>
             
             <div className="border-l-[3px] border-blue-500 pl-4 py-1">
               <div className="text-[13px] font-bold text-blue-700 mb-1 flex items-center gap-1.5">
                 <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Function 只负责计算、识别、判断
               </div>
               <div className="text-[12px] text-slate-600 font-medium pl-3">不改变任何对象的状态，输出计算结果用于决策。</div>
             </div>
          </div>
          
        </div>
      )}
      </div>

      <CreateFunctionBindingDrawer
         open={isDrawerOpen}
         onClose={() => setIsDrawerOpen(false)}
         onSave={() => setIsDrawerOpen(false)}
         selectedObject={selectedObjId}
      />

    </div>
  );
}
