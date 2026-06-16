import React, { useState } from 'react';
import { 
  X, HelpCircle, CheckCircle2, Info, ArrowRight, Settings, ChevronDown, Check
} from 'lucide-react';

interface CreateActionDrawerProps {
  onClose: () => void;
  onSave?: () => void;
  selectedObject: string;
}

export default function CreateActionDrawer({ onClose, onSave, selectedObject }: CreateActionDrawerProps) {
  const [selectedTemplate, setSelectedTemplate] = useState('confirmAssertion');
  
  return (
    <div className="fixed inset-y-0 right-0 w-[42%] min-w-[560px] bg-white shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-300 border-l border-slate-200">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-[18px] font-extrabold text-slate-900 tracking-tight">新建 Action</h2>
        </div>
        <button 
          onClick={onClose} 
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Context Tags */}
      <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-3 shrink-0">
         <div className="flex items-center gap-1.5 text-[12px] bg-white border border-slate-200 px-2 py-1 rounded shadow-sm">
            <span className="text-slate-500">对象类型:</span>
            <span className="font-mono font-bold text-slate-800">{selectedObject}</span>
         </div>
         <div className="flex items-center gap-1.5 text-[12px] bg-white border border-slate-200 px-2 py-1 rounded shadow-sm">
            <span className="text-slate-500">当前变更集:</span>
            <span className="font-mono font-bold text-slate-800">CS-2026-012</span>
         </div>
         <div className="flex items-center gap-1.5 text-[12px] bg-white border border-slate-200 px-2 py-1 rounded shadow-sm">
            <span className="text-slate-500">状态:</span>
            <span className="font-bold text-orange-600">Editing</span>
         </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-8 bg-white">
        
        {/* Info Banner */}
        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3.5 flex items-start gap-3">
           <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
           <div className="text-[13px] text-blue-800 leading-relaxed">
              Action 用于定义对象上的受控动作，例如确认、忽略、发布、分派或状态变化。<br/>
              如果只是计算、识别或判断，请使用 <span className="font-mono font-bold">Function</span>。
           </div>
        </div>

        {/* Block 1: 选择 Action 模板 */}
        <section className="space-y-4">
          <h3 className="text-[14px] font-extrabold text-slate-900 border-l-[3px] border-blue-600 pl-2">1. 选择 Action 模板</h3>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
             {/* Template 1 */}
             <div 
               onClick={() => setSelectedTemplate('confirmAssertion')}
               className={`p-3.5 rounded-xl border relative cursor-pointer transition-all ${
                 selectedTemplate === 'confirmAssertion' 
                  ? 'border-blue-500 bg-blue-50/20 shadow-[0_0_0_1px_rgba(59,130,246,0.3)]' 
                  : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
               }`}
             >
                {selectedTemplate === 'confirmAssertion' && (
                  <div className="absolute top-2 right-2 flex items-center justify-center w-5 h-5 bg-blue-500 rounded-full text-white shadow-sm">
                     <Check className="w-3.5 h-3.5" />
                  </div>
                )}
                <div className="text-[13px] font-extrabold text-slate-900 mb-0.5">确认语义断言</div>
                <div className="text-[11px] font-mono text-slate-500 mb-2">confirmAssertion</div>
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-600 bg-slate-100/80 px-2 py-0.5 rounded inline-flex mb-2">
                   Pending <ArrowRight className="w-3 h-3" /> Confirmed
                </div>
                <div>
                   <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">推荐</span>
                </div>
             </div>

             {/* Template 2 */}
             <div 
               onClick={() => setSelectedTemplate('markUnknown')}
               className={`p-3.5 rounded-xl border relative cursor-pointer transition-all ${
                 selectedTemplate === 'markUnknown' 
                  ? 'border-blue-500 bg-blue-50/20 shadow-[0_0_0_1px_rgba(59,130,246,0.3)]' 
                  : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
               }`}
             >
                <div className="text-[13px] font-extrabold text-slate-900 mb-0.5">标记为未知</div>
                <div className="text-[11px] font-mono text-slate-500 mb-2">markUnknown</div>
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-600 bg-slate-100/80 px-2 py-0.5 rounded inline-flex mb-2">
                   Pending <ArrowRight className="w-3 h-3" /> Unknown
                </div>
                <div>
                   <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold">常用</span>
                </div>
             </div>

             {/* Template 3 */}
             <div 
               onClick={() => setSelectedTemplate('ignoreAssertion')}
               className={`p-3.5 rounded-xl border relative cursor-pointer transition-all ${
                 selectedTemplate === 'ignoreAssertion' 
                  ? 'border-blue-500 bg-blue-50/20 shadow-[0_0_0_1px_rgba(59,130,246,0.3)]' 
                  : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
               }`}
             >
                <div className="text-[13px] font-extrabold text-slate-900 mb-0.5">忽略语义断言</div>
                <div className="text-[11px] font-mono text-slate-500 mb-2">ignoreAssertion</div>
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-600 bg-slate-100/80 px-2 py-0.5 rounded inline-flex mb-2">
                   Pending <ArrowRight className="w-3 h-3" /> Ignored
                </div>
                <div>
                   <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold">常用</span>
                </div>
             </div>

             {/* Template 4 */}
             <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100 cursor-pointer transition-colors flex flex-col justify-center items-center">
                <div className="text-[13px] font-bold text-slate-700 mb-1">更多模板</div>
                <div className="text-[11px] text-slate-500 mb-3 text-center">查看全部 Action 模板</div>
                <div className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                   <ArrowRight className="w-3.5 h-3.5" />
                </div>
             </div>
          </div>
        </section>

        {/* Block 2: 核心行为 */}
        <section className="space-y-4">
          <h3 className="text-[14px] font-extrabold text-slate-900 border-l-[3px] border-blue-600 pl-2">2. 核心行为</h3>
          
          <div className="grid grid-cols-[1fr_240px] gap-6 pt-1">
             <div className="space-y-4">
                <div className="flex items-center gap-4">
                   <label className="w-20 shrink-0 text-[13px] font-medium text-slate-600">Action Name <span className="text-red-500">*</span></label>
                   <div className="flex-1 relative">
                      <input type="text" value="confirmAssertion" readOnly className="w-full pl-3 pr-10 py-1.5 bg-white border border-slate-200 rounded-lg text-[13px] font-mono text-slate-900 focus:outline-none" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">15/64</span>
                   </div>
                </div>
                <div className="flex items-center gap-4">
                   <label className="w-20 shrink-0 text-[13px] font-medium text-slate-600">中文名 <span className="text-red-500">*</span></label>
                   <div className="flex-1 relative">
                      <input type="text" value="确认语义断言" readOnly className="w-full pl-3 pr-10 py-1.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-900 focus:outline-none" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">6/32</span>
                   </div>
                </div>
                <div className="flex items-center gap-4">
                   <label className="w-20 shrink-0 text-[13px] font-medium text-slate-600">作用对象</label>
                   <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-[13px] font-mono text-slate-500 flex justify-between items-center cursor-not-allowed">
                      {selectedObject} <ChevronDown className="w-4 h-4 text-slate-400" />
                   </div>
                </div>
                <div className="flex items-center gap-4">
                   <label className="w-20 shrink-0 text-[13px] font-medium text-slate-600">Action 类型</label>
                   <div className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-[13px] text-slate-900 flex justify-between items-center">
                      状态流转 <ChevronDown className="w-4 h-4 text-slate-400" />
                   </div>
                </div>
             </div>

             <div className="bg-slate-50/50 rounded-xl border border-slate-200 p-4 flex flex-col justify-center">
                <div className="text-[12px] font-bold text-slate-700 mb-3">状态变化</div>
                <div className="flex items-center justify-between mb-6">
                   <div className="px-3 py-1.5 rounded-lg border border-orange-200 bg-orange-50 text-orange-700 font-mono font-bold text-[12px] shadow-sm">
                      Pending
                   </div>
                   <div className="flex-1 flex items-center justify-center relative">
                      <div className="w-full h-px bg-slate-300"></div>
                      <ArrowRight className="w-4 h-4 text-slate-400 absolute right-0 -mr-2 bg-slate-50/50" />
                   </div>
                   <div className="ml-2 px-3 py-1.5 rounded-lg border border-teal-200 bg-teal-50 text-teal-700 font-mono font-bold text-[12px] shadow-sm">
                      Confirmed
                   </div>
                </div>
                
                <div className="text-[12px] font-bold text-slate-700 mb-2">审计事件 (自动生成)</div>
                <div className="px-3 py-1.5 border border-slate-200 bg-slate-100 rounded-lg text-[12px] font-mono text-slate-500 cursor-not-allowed truncate" title="SemanticAssertionConfirmed">
                   SemanticAssertionConfirmed
                </div>
             </div>
          </div>
        </section>

        {/* Block 3: 执行条件（摘要） */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
             <h3 className="text-[14px] font-extrabold text-slate-900 border-l-[3px] border-blue-600 pl-2">3. 执行条件（摘要）</h3>
             <button className="text-[13px] font-bold text-blue-600 hover:text-blue-700">编辑条件</button>
          </div>
          
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2">
             <div className="flex flex-col gap-2">
               <div className="flex items-center gap-2">
                 <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                 <span className="text-[13px] text-slate-700">当前状态为 <span className="font-mono bg-slate-100 px-1 rounded">Pending</span></span>
               </div>
               <div className="flex items-center gap-2">
                 <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                 <span className="text-[13px] text-slate-700 font-mono">confidence {'>'} 0.8</span>
               </div>
               <div className="flex items-center gap-2">
                 <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                 <span className="text-[13px] text-slate-700">至少存在 1 条 <span className="font-mono bg-slate-100 px-1 rounded">Evidence</span></span>
               </div>
               <div className="flex items-center gap-2">
                 <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                 <span className="text-[13px] text-slate-700">当前用户具备语义审核权限</span>
               </div>
               <div className="flex items-center gap-2">
                 <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                 <span className="text-[13px] text-slate-700"><span className="font-mono bg-slate-100 px-1 rounded">Assertion</span> 未被标记为 <span className="font-mono bg-slate-100 px-1 rounded">Conflict</span></span>
               </div>
             </div>
          </div>
        </section>

        {/* Block 4: 执行实现 */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
             <h3 className="text-[14px] font-extrabold text-slate-900 border-l-[3px] border-blue-600 pl-2">4. 执行实现</h3>
             <button className="text-[12px] font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1">高级配置 <ChevronDown className="w-3.5 h-3.5" /></button>
          </div>
          
          <div className="space-y-3 pt-1">
             <label className="flex items-start gap-3 p-4 border border-blue-200 bg-blue-50/30 rounded-xl cursor-pointer">
                <div className="mt-0.5">
                   <div className="w-4 h-4 rounded-full border-4 border-blue-600 bg-white shadow-sm"></div>
                </div>
                <div>
                   <div className="text-[13px] font-bold text-slate-900 mb-1">系统内置 Action</div>
                   <div className="text-[12px] text-slate-500 leading-snug">适用于状态流转、审计写入、对象更新等标准治理动作。</div>
                </div>
             </label>
             
             <label className="flex items-start gap-3 p-4 border border-slate-200 bg-white rounded-xl cursor-pointer hover:bg-slate-50">
                <div className="mt-0.5">
                   <div className="w-4 h-4 rounded-full border border-slate-300 bg-white"></div>
                </div>
                <div>
                   <div className="text-[13px] font-bold text-slate-700 mb-1">绑定 Skill / Tool</div>
                   <div className="text-[12px] text-slate-500 leading-snug">适用于外部系统调用、跨域同步、复杂副作用等场景。</div>
                </div>
             </label>
          </div>
        </section>

        {/* Block 5: 权限与 AI 策略 */}
        <section className="space-y-4">
          <h3 className="text-[14px] font-extrabold text-slate-900 border-l-[3px] border-blue-600 pl-2">5. 权限与 AI 策略</h3>
          
          <div className="grid grid-cols-2 gap-x-8 gap-y-5 pt-1">
             <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-slate-600">执行权限</label>
                <div className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-[13px] text-slate-900 flex justify-between items-center">
                   数据治理审核人 <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>
             </div>

             <div className="space-y-4">
                <div className="flex items-center justify-between mt-2">
                   <span className="text-[13px] font-medium text-slate-700 flex items-center gap-1.5">AI 可建议</span>
                   <div className="w-8 h-4.5 bg-blue-600 rounded-full relative cursor-pointer shadow-inner">
                      <div className="w-3.5 h-3.5 bg-white rounded-full absolute right-0.5 top-[2px] shadow-sm"></div>
                   </div>
                </div>
                <div className="flex items-center justify-between">
                   <span className="text-[13px] font-medium text-slate-700 flex items-center gap-1.5">AI 可直接执行 <Info className="w-3.5 h-3.5 text-slate-400" /></span>
                   <div className="w-8 h-4.5 bg-slate-200 rounded-full relative cursor-pointer shadow-inner">
                      <div className="w-3.5 h-3.5 bg-white rounded-full absolute left-0.5 top-[2px] shadow-sm"></div>
                   </div>
                </div>
                <div className="flex items-center justify-between">
                   <span className="text-[13px] font-medium text-slate-700 flex items-center gap-1.5">AI 可预填理由 <Info className="w-3.5 h-3.5 text-slate-400" /></span>
                   <div className="w-8 h-4.5 bg-blue-600 rounded-full relative cursor-pointer shadow-inner">
                      <div className="w-3.5 h-3.5 bg-white rounded-full absolute right-0.5 top-[2px] shadow-sm"></div>
                   </div>
                </div>
             </div>

             <div className="space-y-1.5 -mt-[4.5rem]">
                <label className="text-[13px] font-medium text-slate-600 flex items-center gap-1.5">权限策略 <Info className="w-3 h-3 text-slate-400" /></label>
                <div className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-[12px] font-mono text-slate-700 flex justify-between items-center">
                   SemanticAssertionReviewerPolicy <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>
             </div>

             <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                   <span className="text-[13px] font-medium text-slate-700">审计要求</span>
                   <div className="flex items-center gap-1.5 text-[13px] font-bold text-slate-700">
                      强制开启 <ChevronDown className="w-3 h-3 text-slate-400" />
                   </div>
                </div>
             </div>

          </div>
        </section>

        {/* Block 6: 保存预览 */}
        <section className="space-y-4">
          <h3 className="text-[14px] font-extrabold text-slate-900 border-l-[3px] border-blue-600 pl-2">6. 保存预览</h3>
          
          <div className="bg-[#f0fdf6] border border-[#bbf7d0] rounded-xl p-4 shadow-sm">
             <div className="text-[12px] font-bold text-[#166534] mb-3 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> 将保存到当前变更集 CS-2026-012
             </div>
             <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                <div className="flex items-start gap-2">
                   <div className="w-4 h-4 rounded-full bg-[#dcfce7] text-[#15803d] flex items-center justify-center shrink-0 mt-0.5"><Check className="w-3 h-3" /></div>
                   <span className="text-[12px] text-[#166534]">新增 Action: <span className="font-bold">confirmAssertion</span></span>
                </div>
                <div className="flex items-start gap-2">
                   <div className="w-4 h-4 rounded-full bg-[#dcfce7] text-[#15803d] flex items-center justify-center shrink-0 mt-0.5"><Check className="w-3 h-3" /></div>
                   <span className="text-[12px] text-[#166534]">作用对象: <span className="font-mono">SemanticAssertion</span></span>
                </div>
                <div className="flex items-start gap-2">
                   <div className="w-4 h-4 rounded-full bg-[#dcfce7] text-[#15803d] flex items-center justify-center shrink-0 mt-0.5"><Check className="w-3 h-3" /></div>
                   <span className="text-[12px] text-[#166534]">引用权限策略: <span className="font-mono">SemanticAssertionReviewerPolicy</span></span>
                </div>
                <div className="flex items-start gap-2">
                   <div className="w-4 h-4 rounded-full bg-[#dcfce7] text-[#15803d] flex items-center justify-center shrink-0 mt-0.5"><Check className="w-3 h-3" /></div>
                   <span className="text-[12px] text-[#166534]">状态变化: <span className="font-mono">Pending → Confirmed</span></span>
                </div>
                <div className="flex items-start gap-2">
                   <div className="w-4 h-4 rounded-full bg-[#dcfce7] text-[#15803d] flex items-center justify-center shrink-0 mt-0.5"><Check className="w-3 h-3" /></div>
                   <span className="text-[12px] text-[#166534]">引用 AI 策略: <span className="font-mono">SuggestOnlyPolicy</span></span>
                </div>
                <div className="flex items-start gap-2">
                   <div className="w-4 h-4 rounded-full bg-[#dcfce7] text-[#15803d] flex items-center justify-center shrink-0 mt-0.5"><Check className="w-3 h-3" /></div>
                   <span className="text-[12px] text-[#166534]">生成审计事件: <span className="font-mono truncate" title="SemanticAssertionConfirmed" style={{display: 'inline-block', maxWidth: '120px', verticalAlign: 'bottom'}}>SemanticAssertionConfirmed</span></span>
                </div>
                <div className="flex items-start gap-2">
                   <div className="w-4 h-4 rounded-full bg-[#dcfce7] text-[#15803d] flex items-center justify-center shrink-0 mt-0.5"><Check className="w-3 h-3" /></div>
                   <span className="text-[12px] text-[#166534]">可被 Workflow: <span className="font-mono">SemanticReviewWorkflow</span> 调用</span>
                </div>
             </div>
          </div>
        </section>

      </div>

      {/* Footer */}
      <div className="p-5 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 shrink-0">
        <button 
          onClick={onClose}
          className="px-6 py-2 text-[14px] font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-sm transition-colors"
        >
          取消
        </button>
        <button 
          onClick={onSave}
          className="px-6 py-2 text-[14px] font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm rounded-lg transition-colors flex items-center gap-1.5"
        >
          保存到变更集
        </button>
      </div>
      
    </div>
  );
}
