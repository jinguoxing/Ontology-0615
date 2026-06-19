import React, { useState } from 'react';
import {
  X, HelpCircle, CheckCircle2, Info, ArrowRight, Settings, ChevronDown, Check, Code, Play
} from 'lucide-react';
import {Drawer, DrawerContent} from './ui/Drawer';

interface CreateFunctionBindingDrawerProps {
  open: boolean;
  onClose: () => void;
  onSave?: () => void;
  selectedObject: string;
}

export default function CreateFunctionBindingDrawer({ open, onClose, onSave, selectedObject }: CreateFunctionBindingDrawerProps) {
  const [selectedFunction, setSelectedFunction] = useState('detectForeignKey()');
  const [testRun, setTestRun] = useState(false);

  const functions = [
    'profileField()',
    'classifyFieldSemantic()',
    'computeSemanticScore()',
    'detectPrimaryKey()',
    'detectForeignKey()',
    'detectSemanticConflict()'
  ];
  
  return (
    <Drawer open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DrawerContent maxWidth="max-w-none" className="w-[42%] min-w-[560px] border-l border-slate-200">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-[18px] font-extrabold text-slate-900 tracking-tight">添加 Function 绑定</h2>
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
            <span className="text-slate-500">Object Type:</span>
            <span className="font-mono font-bold text-slate-800">{selectedObject}</span>
         </div>
         <div className="flex items-center gap-1.5 text-[12px] bg-white border border-slate-200 px-2 py-1 rounded shadow-sm">
            <span className="text-slate-500">当前变更集:</span>
            <span className="font-mono font-bold text-slate-800">CS-2026-012</span>
         </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-8 bg-white">
        
        {/* Info Banner */}
        <div className="bg-amber-50/50 border border-amber-200 rounded-lg p-3.5 flex items-start gap-3">
           <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
           <div className="text-[13px] text-amber-800 leading-relaxed font-medium">
              Function 只负责计算、识别、判断，不应改变对象状态。
           </div>
        </div>

        {/* Block 1: 选择 Function */}
        <section className="space-y-4">
          <h3 className="text-[14px] font-extrabold text-slate-900 border-l-[3px] border-blue-600 pl-2">1. 选择 Function</h3>
          
          <div className="bg-slate-50/50 rounded-lg border border-slate-200 p-4">
             <div className="relative mb-3">
                <input 
                   type="text" 
                   placeholder="搜索 Function..." 
                   className="w-full pl-3 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
             </div>
             <div className="flex flex-wrap gap-2">
                {functions.map(fn => (
                   <button 
                      key={fn}
                      onClick={() => setSelectedFunction(fn)}
                      className={`px-3 py-1.5 rounded-lg text-[12px] font-mono transition-all ${
                         selectedFunction === fn
                            ? 'bg-blue-100 text-blue-700 border-blue-300 font-bold shadow-sm border'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                      }`}
                   >
                      {fn}
                   </button>
                ))}
             </div>
          </div>
        </section>

        {/* Block 2: Function 基础信息 */}
        <section className="space-y-4">
          <h3 className="text-[14px] font-extrabold text-slate-900 border-l-[3px] border-blue-600 pl-2">2. Function 基础信息</h3>
          
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-500">Function 名称</label>
                <div className="font-mono text-[13px] text-slate-900 font-bold">{selectedFunction}</div>
             </div>
             <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-500">类型</label>
                <div className="text-[13px] text-slate-900">识别类 Function</div>
             </div>
             <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-500">用途</label>
                <div className="text-[13px] text-slate-900">识别字段是否可能是外键字段</div>
             </div>
             <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-500">所属域 / 版本</label>
                <div className="text-[13px] text-slate-900">DRKN / <span className="font-mono text-slate-500 bg-slate-100 px-1 rounded">v1.0.0</span></div>
             </div>
          </div>
        </section>

        {/* Block 3: 输入输出配置 */}
        <section className="space-y-4">
          <h3 className="text-[14px] font-extrabold text-slate-900 border-l-[3px] border-blue-600 pl-2">3. 输入输出配置</h3>
          
          <div className="bg-slate-50/50 rounded-lg border border-slate-200 p-4 space-y-4">
             <div>
                <label className="text-[12px] font-bold text-slate-700 block mb-2">输入对象</label>
                <div className="flex flex-wrap gap-2">
                   <span className="px-2 py-1 bg-white border border-slate-200 rounded text-[12px] font-mono text-slate-700">Field</span>
                   <span className="px-2 py-1 bg-white border border-slate-200 rounded text-[12px] font-mono text-slate-700">DataAsset</span>
                   <span className="px-2 py-1 bg-white border border-slate-200 rounded text-[12px] font-mono text-slate-700">Evidence Set</span>
                </div>
             </div>
             <div>
                <label className="text-[12px] font-bold text-slate-700 block mb-2">读取属性</label>
                <div className="flex flex-wrap gap-2">
                   {['field_name', 'data_type', 'sample_values', 'uniqueness', 'null_rate'].map(attr => (
                      <span key={attr} className="px-2 py-1 bg-white border border-slate-200 rounded text-[12px] font-mono text-slate-600">{attr}</span>
                   ))}
                </div>
             </div>
             <div>
                <label className="text-[12px] font-bold text-slate-700 block mb-2">读取关系</label>
                <div className="flex flex-col gap-1.5">
                   <div className="text-[12px] font-mono text-slate-600 bg-white border border-slate-200 px-2 py-1 rounded">Field <span className="text-blue-500 font-bold">belongs_to</span> DataAsset</div>
                   <div className="text-[12px] font-mono text-slate-600 bg-white border border-slate-200 px-2 py-1 rounded">Field <span className="text-blue-500 font-bold">has_assertion</span> SemanticAssertion</div>
                </div>
             </div>
             <div className="border-t border-slate-200 pt-4">
                <label className="text-[12px] font-bold text-emerald-700 block mb-2 flex items-center gap-1.5"><ArrowRight className="w-3.5 h-3.5" /> 输出结构</label>
                <div className="flex flex-col gap-1.5">
                   <div className="text-[12px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-100 px-2 py-1.5 rounded font-bold">ForeignKeyCandidate</div>
                   <div className="text-[12px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-100 px-2 py-1.5 rounded">Confidence Score</div>
                   <div className="text-[12px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-100 px-2 py-1.5 rounded">Evidence Recommendation</div>
                </div>
             </div>
          </div>
        </section>

        {/* Block 4: 调用范围 */}
        <section className="space-y-4">
          <h3 className="text-[14px] font-extrabold text-slate-900 border-l-[3px] border-blue-600 pl-2">4. 调用范围</h3>
          
          <div className="grid grid-cols-2 gap-y-3">
             <label className="flex items-center gap-2 cursor-pointer group">
               <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500" />
               <span className="text-[13px] text-slate-700 group-hover:text-slate-900">可被 Workflow 调用</span>
             </label>
             <label className="flex items-center gap-2 cursor-pointer group">
               <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500" />
               <span className="text-[13px] text-slate-700 group-hover:text-slate-900">可被 AI 工作台调用</span>
             </label>
             <label className="flex items-center gap-2 cursor-pointer group">
               <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500" />
               <span className="text-[13px] text-slate-700 group-hover:text-slate-900">可在对象详情页手动运行</span>
             </label>
             <label className="flex items-center gap-2 cursor-pointer group">
               <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500" />
               <span className="text-[13px] text-slate-700 group-hover:text-slate-900">可作为 Action 前置校验</span>
             </label>
          </div>
        </section>

        {/* Block 5: 权限与 AI 策略 */}
        <section className="space-y-4">
          <h3 className="text-[14px] font-extrabold text-slate-900 border-l-[3px] border-blue-600 pl-2">5. 权限配置</h3>
          
          <div className="grid grid-cols-2 gap-x-8 gap-y-5 pt-1">
             <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-slate-600">调用权限</label>
                <div className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-[13px] text-slate-900 flex justify-between items-center">
                   数据治理人员 / 系统任务 <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>
             </div>
             
             <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-slate-600">编辑权限</label>
                <div className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-[13px] text-slate-900 flex justify-between items-center">
                   模型管理员 <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>
             </div>

             <div className="flex items-center justify-between col-span-1">
                 <span className="text-[13px] font-medium text-slate-700 flex items-center gap-1.5">AI 可调用 <Info className="w-3.5 h-3.5 text-slate-400" /></span>
                 <div className="w-8 h-4.5 bg-blue-600 rounded-full relative cursor-pointer shadow-inner">
                    <div className="w-3.5 h-3.5 bg-white rounded-full absolute right-0.5 top-[2px] shadow-sm"></div>
                 </div>
              </div>

             <div className="flex items-center justify-between col-span-1">
                 <span className="text-[13px] font-medium text-slate-700 flex items-center gap-1.5">AI 可直接修改结果</span>
                 <div className="w-8 h-4.5 bg-slate-200 rounded-full relative cursor-pointer shadow-inner">
                    <div className="w-3.5 h-3.5 bg-white rounded-full absolute left-0.5 top-[2px] shadow-sm"></div>
                 </div>
              </div>

          </div>
        </section>
        
        {/* Block 6: 测试样例 */}
        <section className="space-y-4">
          <h3 className="text-[14px] font-extrabold text-slate-900 border-l-[3px] border-blue-600 pl-2">6. 测试样例</h3>
          
          <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
             <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[12px] font-mono text-slate-600">
                   <Code className="w-3.5 h-3.5" /> Field: <span className="text-slate-900 font-bold">erp_order_header.supplier_id</span>
                </div>
                <button 
                  onClick={() => setTestRun(true)}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 rounded-lg text-[12px] font-bold transition-colors"
                >
                   <Play className="w-3 h-3" /> 运行测试
                </button>
             </div>
             {testRun ? (
                <div className="p-4 bg-emerald-50/50">
                   <div className="text-[12px] font-mono text-emerald-800 leading-relaxed">
                      {'>'} 可能是外键字段，置信度 <span className="font-bold">0.91</span>，建议关联 <span className="font-bold underline decoration-emerald-300">supplier_table.id</span>
                   </div>
                </div>
             ) : (
                <div className="p-4 bg-white text-center text-[12px] text-slate-400 py-6">
                   点击运行测试查看输出结果
                </div>
             )}
          </div>
        </section>

        {/* Block 7: 影响分析 */}
        <section className="space-y-4">
          <h3 className="text-[14px] font-extrabold text-slate-900 border-l-[3px] border-blue-600 pl-2">7. 影响分析</h3>
          
          <div className="bg-slate-50/50 border border-slate-200 rounded-lg p-4 shadow-sm">
             <div className="space-y-2.5">
                <div className="flex items-start gap-2">
                   <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                   <span className="text-[12px] text-slate-700">影响 Object Type: <span className="font-bold">Field</span></span>
                </div>
                <div className="flex items-start gap-2">
                   <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                   <span className="text-[12px] text-slate-700">可被 <span className="font-mono">SemanticReviewWorkflow</span> 使用</span>
                </div>
                <div className="flex items-start gap-2">
                   <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                   <span className="text-[12px] text-slate-700">可能影响 <span className="font-bold">AI 字段解释场景</span></span>
                </div>
                <div className="flex items-start gap-2">
                   <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                   <span className="text-[12px] font-bold text-emerald-700">不改变对象状态</span>
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

      </DrawerContent>
    </Drawer>
  );
}
