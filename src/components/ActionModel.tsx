import React, { useState } from 'react';
import { 
  Plus, Search, ChevronDown, CheckCircle2, MoreHorizontal, Settings, Info, Filter, ArrowRight
} from 'lucide-react';
import type { ObjectType } from '../types';
import CreateActionDrawer from './CreateActionDrawer';

interface ActionModelProps {
  objectTypes: ObjectType[];
  selectedObjectId: string;
  onSelectObject: (id: string) => void;
  onNavigate: (view: string) => void;
  isEditingActive: boolean;
}

export default function ActionModel({
  objectTypes,
  selectedObjectId,
  onSelectObject,
  onNavigate,
  isEditingActive
}: ActionModelProps) {
  const tabs = [
    '模型总览', '对象模型', '关系模型', '能力 (Function)', '动作 (Action)', 
    '流程 (Workflow)', '权限策略', '变更与发布'
  ];

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // 示例动作列表数据
  const actions = [
    { name: 'confirmAssertion', zh: '确认语义断言', type: '状态流转', target: 'SemanticAssertion', change: 'Pending → Confirmed', status: 'Editing', cs: 'CS-2026-012' },
    { name: 'markUnknown', zh: '标记为未知', type: '状态流转', target: 'SemanticAssertion', change: 'Pending → Unknown', status: 'Editing', cs: 'CS-2026-012' },
    { name: 'ignoreAssertion', zh: '忽略语义断言', type: '状态流转', target: 'SemanticAssertion', change: 'Pending → Ignored', status: '已发布', cs: '-' },
    { name: 'rejectAssertion', zh: '拒绝语义断言', type: '状态流转', target: 'SemanticAssertion', change: 'Pending → Rejected', status: 'Draft', cs: 'CS-2026-011' },
    { name: 'attachEvidence', zh: '关联证据', type: '创建关系', target: 'Evidence', change: '创建 Evidence 关联', status: '已发布', cs: '-' },
    { name: 'assignIssue', zh: '分派问题', type: '分派', target: 'DataIssue', change: 'Open → Assigned', status: '已发布', cs: '-' },
    { name: 'closeIssue', zh: '关闭问题', type: '状态流转', target: 'DataIssue', change: 'Open → Closed', status: '已发布', cs: '-' }
  ];

  const filteredActions = actions.filter(a => 
    (a.name.toLowerCase().includes(searchTerm.toLowerCase()) || a.zh.includes(searchTerm)) &&
    (a.target === selectedObjectId || !selectedObjectId)
  );

  return (
    <div className="flex flex-col h-full relative">
      {/* 顶部 Header：模型级信息 */}
      <div className="mb-6 space-y-4">
        {/* 面包屑 & 变更集横幅 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center text-[13px] text-slate-500 font-medium">
             <span className="hover:text-slate-800 cursor-pointer">管理中心</span>
             <span className="mx-2">/</span>
             <span className="hover:text-slate-800 cursor-pointer">本体管理</span>
             <span className="mx-2">/</span>
             <span className="hover:text-slate-800 cursor-pointer">DRKN 本体模型管理</span>
             <span className="mx-2">/</span>
             <span className="text-slate-800 font-bold">动作 (Action)</span>
          </div>
          {isEditingActive && (
             <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full shadow-sm">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                <span className="text-[12px] font-bold text-blue-700">当前变更集: CS-2026-012</span>
                <span className="text-[11px] font-medium text-blue-600 bg-blue-100/50 px-1.5 py-0.5 rounded">Editing</span>
             </div>
          )}
        </div>

        <div className="flex items-center justify-between">
           <div>
              <div className="flex items-center gap-3 mb-1">
                 <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">DRKN-Core 数据语义治理模型</h1>
                 <span className="px-2 py-0.5 rounded text-[12px] font-bold bg-blue-50 text-blue-600 border border-blue-100">已发布</span>
              </div>
              <div className="flex items-center gap-4 text-[13px] text-slate-500">
                 <span className="flex items-center gap-1.5"><span className="font-bold text-slate-700">当前版本:</span> <span className="text-blue-600 font-mono font-medium">v1.3.0</span></span>
                 <span className="flex items-center gap-1.5"><span className="font-bold text-slate-700">发布于:</span> 2026-08-20 10:30:00</span>
                 <span className="flex items-center gap-1.5"><span className="font-bold text-slate-700">发布人:</span> 系统管理员</span>
              </div>
           </div>
           
        </div>
      </div>

      {/* 顶部 Tabs */}
      <div className="flex gap-8 mb-6 border-b border-slate-200">
        {tabs.map((tab) => (
          <div 
            key={tab}
            onClick={() => {
              if (tab === '模型总览') onNavigate('overview');
              if (tab === '对象模型') onNavigate('object_model');
              if (tab === '关系模型') onNavigate('relation_model');
              if (tab === '能力 (Function)') onNavigate('capability_binding');
              if (tab === '动作 (Action)') onNavigate('action_model');
              if (tab === '流程 (Workflow)') onNavigate('workflow_orchestration');
              if (tab === '变更与发布') onNavigate('change_release');
            }}
            className={`pb-3 text-sm font-bold cursor-pointer transition-colors ${
              tab === '动作 (Action)' 
                ? 'text-blue-600 border-b-2 border-blue-600 -mb-[1px]' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab}
          </div>
        ))}
      </div>

      {/* 主体布局：左侧对象类型层级列表，右侧 Action 配置画布 */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 min-h-0">
         
         {/* 左侧结构树导航 */}
         <div className="md:col-span-3 bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
               <h3 className="text-[14px] font-extrabold text-slate-800">Object Type</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
               <div className="space-y-0.5">
                 {objectTypes.map((obj) => (
                   <div 
                      key={obj.id} 
                      onClick={() => onSelectObject(obj.id)}
                      className={`px-3 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer transition-colors ${
                        selectedObjectId === obj.id 
                          ? 'bg-blue-50 border border-blue-100/50 shadow-sm' 
                          : 'hover:bg-slate-50 border border-transparent'
                      }`}
                   >
                      <div className={`w-2 h-2 rounded-full ${selectedObjectId === obj.id ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                      <span className={`text-[13px] font-medium ${selectedObjectId === obj.id ? 'text-blue-700 font-bold' : 'text-slate-700'}`}>
                        {obj.id}
                      </span>
                   </div>
                 ))}
               </div>
            </div>
         </div>

         {/* 右侧 Action 列表 */}
         <div className="md:col-span-9 bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden shadow-sm">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/30">
               <div className="flex items-center justify-between mb-2">
                 <h2 className="text-[18px] font-extrabold text-slate-900">动作 (Action)</h2>
               </div>
               <p className="text-[13px] text-slate-500">
                  管理对象上可执行的受控动作，例如确认、发布、分派、状态变化等。
               </p>
            </div>

            {/* Toolbar */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
               <button 
                  onClick={() => setIsDrawerOpen(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[13px] font-bold transition-all shadow-sm flex items-center gap-1.5"
               >
                  <Plus className="w-4 h-4" /> 新建 Action
               </button>

               <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      placeholder="搜索 Action 名称 / 中文名"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64 pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium placeholder:font-normal"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                     <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[13px] font-medium text-slate-600 flex items-center gap-2 hover:bg-slate-50 transition-colors">
                        全部类型 <ChevronDown className="w-4 h-4" />
                     </button>
                     <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[13px] font-medium text-slate-600 flex items-center gap-2 hover:bg-slate-50 transition-colors">
                        全部状态 <ChevronDown className="w-4 h-4" />
                     </button>
                  </div>
               </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-auto">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-6 py-3 text-[12px] font-bold text-slate-600 whitespace-nowrap">Action 名称</th>
                        <th className="px-6 py-3 text-[12px] font-bold text-slate-600 whitespace-nowrap">中文名</th>
                        <th className="px-6 py-3 text-[12px] font-bold text-slate-600 whitespace-nowrap">Action 类型</th>
                        <th className="px-6 py-3 text-[12px] font-bold text-slate-600 whitespace-nowrap">作用对象</th>
                        <th className="px-6 py-3 text-[12px] font-bold text-slate-600 whitespace-nowrap">状态变化 / 结果</th>
                        <th className="px-6 py-3 text-[12px] font-bold text-slate-600 whitespace-nowrap">状态</th>
                        <th className="px-6 py-3 text-[12px] font-bold text-slate-600 whitespace-nowrap">所属变更集</th>
                        <th className="px-6 py-3 text-[12px] font-bold text-slate-600 text-center w-16">操作</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {filteredActions.map((action, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                           <td className="px-6 py-3 text-[13px] font-mono font-medium text-blue-600">
                              <div className="flex items-center gap-2">
                                 <div className="w-6 h-6 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500">
                                    <Settings className="w-3.5 h-3.5" />
                                 </div>
                                 {action.name}
                              </div>
                           </td>
                           <td className="px-6 py-3 text-[13px] text-slate-800 font-medium">{action.zh}</td>
                           <td className="px-6 py-3 text-[13px] text-slate-600">{action.type}</td>
                           <td className="px-6 py-3 text-[13px] text-slate-600 font-mono">{action.target}</td>
                           <td className="px-6 py-3">
                              {action.change.includes('→') ? (
                                 <div className="flex items-center gap-1.5 text-[12px] font-mono">
                                    <span className="text-slate-500">{action.change.split('→')[0].trim()}</span>
                                    <ArrowRight className="w-3 h-3 text-slate-400" />
                                    <span className="text-slate-800 font-bold">{action.change.split('→')[1].trim()}</span>
                                 </div>
                              ) : (
                                 <span className="text-[12px] text-slate-600">{action.change}</span>
                              )}
                           </td>
                           <td className="px-6 py-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${
                                 action.status === '已发布' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                 action.status === 'Editing' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                                 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}>
                                 {action.status}
                              </span>
                           </td>
                           <td className="px-6 py-3 text-[12px] font-mono text-slate-500">
                              {action.cs}
                           </td>
                           <td className="px-6 py-3 text-center">
                              <button className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                                 <MoreHorizontal className="w-4 h-4" />
                              </button>
                           </td>
                        </tr>
                     ))}
                     {filteredActions.length === 0 && (
                        <tr>
                           <td colSpan={8} className="px-6 py-12 text-center text-slate-500 text-[13px]">
                              暂无 Action 数据
                           </td>
                        </tr>
                     )}
                  </tbody>
               </table>
            </div>
         </div>
      </div>

      {isDrawerOpen && (
         <>
            <div 
               className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40"
               onClick={() => setIsDrawerOpen(false)}
            ></div>
            <CreateActionDrawer 
               onClose={() => setIsDrawerOpen(false)} 
               onSave={() => setIsDrawerOpen(false)} 
               selectedObject={selectedObjectId || 'SemanticAssertion'}
            />
         </>
      )}

    </div>
  );
}
