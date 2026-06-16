import React, { useState } from 'react';
import { 
  X, HelpCircle, AlertTriangle, ChevronDown, CheckCircle2, Link as LinkIcon, AlertCircle, Info
} from 'lucide-react';

interface CreateLinkTypeDrawerProps {
  onClose: () => void;
  onSave?: () => void;
}

export default function CreateLinkTypeDrawer({ onClose, onSave }: CreateLinkTypeDrawerProps) {
  return (
    <div className="fixed inset-y-0 right-0 w-[560px] bg-white shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-300 border-l border-slate-200">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <LinkIcon className="w-4 h-4" />
          </div>
          <h2 className="text-[17px] font-extrabold text-slate-800">添加 Link Type</h2>
        </div>
        <div className="flex items-center gap-3">
          <button className="text-[13px] font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors">
            <HelpCircle className="w-4 h-4" /> 帮助
          </button>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin">
        
        {/* Block 1: 关系基础信息 */}
        <section className="space-y-4">
          <h3 className="text-[14px] font-extrabold text-slate-900 border-l-4 border-blue-600 pl-2">关系基础信息</h3>
          
          <div className="space-y-4 pt-2">
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-slate-700 flex items-center gap-1">Link Type Name <span className="text-red-500">*</span></label>
                  <input type="text" value="maps_to" readOnly className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-800 font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
               </div>
               <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-slate-700 flex items-center gap-1">中文名 <span className="text-red-500">*</span></label>
                  <input type="text" value="映射到" readOnly className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
               </div>
             </div>

             <div className="space-y-1.5">
               <label className="text-[13px] font-bold text-slate-700">关系说明</label>
               <textarea rows={2} value="用于连接 DRKN Field 与 DKN DomainMapping，表示字段被领域映射引用。" readOnly className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"></textarea>
             </div>

             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-slate-700">所属模型</label>
                  <div className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] text-slate-500 flex justify-between items-center cursor-not-allowed">
                     DRKN-Core <ChevronDown className="w-4 h-4" />
                  </div>
               </div>
               <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-slate-700">所属变更集</label>
                  <div className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] text-slate-500 flex justify-between items-center cursor-not-allowed">
                     CS-2026-012 <ChevronDown className="w-4 h-4" />
                  </div>
               </div>
             </div>
          </div>
        </section>

        {/* Block 2: 源对象与目标对象 */}
        <section className="space-y-4">
          <h3 className="text-[14px] font-extrabold text-slate-900 border-l-4 border-blue-600 pl-2">源对象与目标对象</h3>
          
          <div className="bg-slate-50/80 border border-slate-200 p-4 rounded-xl space-y-4">
             <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <div className="space-y-1.5">
                   <label className="text-[12px] font-bold text-slate-500">Source Object Type</label>
                   <div className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-800 font-mono flex justify-between items-center shadow-sm">
                      Field <ChevronDown className="w-4 h-4 text-slate-400" />
                   </div>
                </div>
                
                <div className="flex flex-col items-center justify-center pt-5">
                   <div className="text-[11px] font-medium text-slate-400 mb-0.5">方向</div>
                   <div className="w-8 flex items-center text-slate-400">
                     <div className="h-px bg-slate-400 w-full"></div>
                     <div className="w-1.5 h-1.5 border-t border-r border-slate-400 rotate-45 -ml-1"></div>
                   </div>
                </div>

                <div className="space-y-1.5">
                   <label className="text-[12px] font-bold text-slate-500">Target Object Type</label>
                   <div className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-800 font-mono flex justify-between items-center shadow-sm">
                      DomainMapping <ChevronDown className="w-4 h-4 text-slate-400" />
                   </div>
                </div>
             </div>

             <div className="pt-3 border-t border-slate-200/60">
                <div className="flex items-center justify-between">
                   <label className="text-[13px] font-bold text-slate-700">基数 (Cardinality)</label>
                   <div className="flex bg-white rounded-lg border border-slate-200 p-0.5 shadow-sm">
                      <button className="px-3 py-1 font-mono text-[12px] font-medium text-slate-600 hover:text-slate-800 rounded-md">1:1</button>
                      <button className="px-3 py-1 font-mono text-[12px] font-medium text-slate-600 hover:text-slate-800 rounded-md">1:N</button>
                      <button className="px-3 py-1 font-mono text-[12px] font-bold bg-blue-50 text-blue-600 rounded-md border border-blue-100">N:N</button>
                   </div>
                </div>
                <div className="text-[11px] text-slate-500 mt-1.5">一个字段可被多个映射引用，一个映射可包含多个字段</div>
             </div>
          </div>
        </section>

        {/* Block 3: 关系约束 */}
        <section className="space-y-4">
          <h3 className="text-[14px] font-extrabold text-slate-900 border-l-4 border-blue-600 pl-2">关系约束</h3>
          
          <div className="grid grid-cols-2 gap-y-4 gap-x-6 pt-2">
             <label className="flex items-center gap-2 cursor-pointer group">
               <input type="checkbox" className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500" />
               <span className="text-[13px] font-medium text-slate-700 group-hover:text-slate-900">是否必填</span>
             </label>
             <label className="flex items-center gap-2 cursor-pointer group">
               <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500" />
               <span className="text-[13px] font-medium text-slate-700 group-hover:text-slate-900">是否允许多目标</span>
             </label>
             <label className="flex items-center gap-2 cursor-pointer group">
               <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500" />
               <span className="text-[13px] font-medium text-slate-700 group-hover:text-slate-900">是否允许反向查询</span>
             </label>
             <label className="flex items-center gap-2 cursor-pointer group">
               <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500" />
               <span className="text-[13px] font-medium text-slate-700 group-hover:text-slate-900">是否允许跨域关系</span>
             </label>
             <label className="flex items-center gap-2 cursor-pointer group border-t border-slate-100 pt-3">
               <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500" />
               <span className="text-[13px] font-bold text-emerald-700">是否参与血缘</span>
             </label>
             <label className="flex items-center gap-2 cursor-pointer group border-t border-slate-100 pt-3">
               <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500" />
               <span className="text-[13px] font-bold text-blue-700">是否 AI 可见</span>
             </label>
          </div>
        </section>

        {/* Block 4: 权限与展示 */}
        <section className="space-y-4">
          <h3 className="text-[14px] font-extrabold text-slate-900 border-l-4 border-blue-600 pl-2">权限与展示</h3>
          
          <div className="space-y-4 pt-2">
             <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-slate-600">谁能创建该关系</span>
                <span className="text-[13px] font-bold text-slate-800">数据治理管理员</span>
             </div>
             <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-slate-600">谁能查看该关系</span>
                <span className="text-[13px] font-bold text-slate-800">数据治理人员 / 领域建模人员</span>
             </div>
             <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-[13px] font-medium text-slate-600">知识网络展示方式</span>
                <span className="text-[13px] font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">虚线映射关系</span>
             </div>
             <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-slate-600">AI 工作台是否可引用</span>
                <span className="text-[13px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">是</span>
             </div>
          </div>
        </section>

        {/* Block 5: 校验与影响分析 */}
        <section className="space-y-4 bg-blue-50/40 p-4 rounded-xl border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
             <AlertCircle className="w-4 h-4 text-blue-500" />
             <h3 className="text-[14px] font-extrabold text-blue-900">校验与影响分析</h3>
          </div>
          <div className="space-y-2.5">
             <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-[12px] font-medium text-slate-700">Source Object Type 已存在</span>
             </div>
             <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-[12px] font-medium text-slate-700">Target Object Type 来自 <span className="font-bold text-blue-700">DKN 域</span></span>
             </div>
             <div className="flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                <span className="text-[12px] font-medium text-slate-700">该关系将影响跨层映射网络</span>
             </div>
             <div className="flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span className="text-[12px] font-medium text-slate-700">该关系可能影响 <span className="font-bold">3</span> 个 DKN Mapping</span>
             </div>
             <div className="flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                <span className="text-[12px] font-medium text-slate-700">该关系将被 AI 解释链使用</span>
             </div>
          </div>
        </section>

      </div>

      {/* Footer */}
      <div className="p-5 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 shrink-0">
        <button 
          onClick={onClose}
          className="px-5 py-2 text-[14px] font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-sm transition-colors"
        >
          取消
        </button>
        <button 
          onClick={onSave}
          className="px-5 py-2 text-[14px] font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm rounded-lg transition-colors flex items-center gap-1.5"
        >
          保存到变更集
        </button>
      </div>
      
    </div>
  );
}
