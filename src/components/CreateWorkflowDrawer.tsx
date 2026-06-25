import React, { useState } from 'react';
import { X, Info, Check, Plus, Settings, Sparkles, ChevronDown } from 'lucide-react';
import { Drawer, DrawerContent } from './ui/Drawer';

interface CreateWorkflowDrawerProps {
  open: boolean;
  onClose: () => void;
  onSave: (newWorkflow: { id: string; nameCn: string; triggerType: string; scope: string[]; desc: string }) => void;
}

export default function CreateWorkflowDrawer({ open, onClose, onSave }: CreateWorkflowDrawerProps) {
  const [formData, setFormData] = useState({
    id: '',
    nameCn: '',
    triggerType: 'event',
    desc: '',
  });

  const [selectedScopes, setSelectedScopes] = useState<string[]>(['Field']);
  const [errorMsg, setErrorMsg] = useState('');

  const scopeOptions = ['Field', 'Mapping', 'Assertion', 'Task'];

  const toggleScope = (scope: string) => {
    if (selectedScopes.includes(scope)) {
      setSelectedScopes(selectedScopes.filter(s => s !== scope));
    } else {
      setSelectedScopes([...selectedScopes, scope]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id.trim()) {
      setErrorMsg('工作流 ID 不能为空');
      return;
    }
    if (!formData.nameCn.trim()) {
      setErrorMsg('中文名称 不能为空');
      return;
    }
    if (selectedScopes.length === 0) {
      setErrorMsg('请至少选择一个适用范围 (Scope)');
      return;
    }

    // Basic ID validation (alphanumeric and underscore)
    if (!/^[a-zA-Z0-9_]+$/.test(formData.id)) {
      setErrorMsg('工作流 ID 只能包含英文、数字与下划线');
      return;
    }

    setErrorMsg('');
    onSave({
      id: formData.id.trim(),
      nameCn: formData.nameCn.trim(),
      triggerType: formData.triggerType,
      scope: selectedScopes,
      desc: formData.desc.trim(),
    });
    
    // Reset form
    setFormData({
      id: '',
      nameCn: '',
      triggerType: 'event',
      desc: '',
    });
    setSelectedScopes(['Field']);
  };

  return (
    <Drawer open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DrawerContent maxWidth="max-w-none" className="w-[38%] min-w-[500px] border-l border-slate-200">
        
        {/* 头部 (Header) */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Settings className="w-4.5 h-4.5" />
            </div>
            <h2 className="text-[17px] font-black text-slate-900 tracking-tight">新建工作流流程</h2>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-655 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 辅助状态标签 */}
        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50 flex gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-[11.5px] bg-white border border-slate-200 px-2 py-1 rounded shadow-3xs">
            <span className="text-slate-400 font-bold">编辑环境:</span>
            <span className="font-mono font-bold text-slate-800">沙箱分支 (CS-2026-012)</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11.5px] bg-white border border-slate-200 px-2 py-1 rounded shadow-3xs">
            <span className="text-slate-400 font-bold">触发条件:</span>
            <span className="font-bold text-blue-600">自定义拓扑</span>
          </div>
        </div>

        {/* 主体表单区 */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-7 bg-white flex flex-col justify-between">
          <div className="space-y-6">
            
            {/* 信息提示 */}
            <div className="bg-blue-50/40 border border-blue-100 rounded-lg p-3.5 flex items-start gap-3">
              <Info className="w-4.5 h-4.5 text-blue-500 shrink-0 mt-0.5" />
              <div className="text-[12px] text-blue-800 leading-relaxed font-medium">
                工作流是将多个函数（Function）和执行动作（Action）按照特定的拓扑关系、分流逻辑连接在一起的可执行语义数据治理管道。
              </div>
            </div>

            {errorMsg && (
              <div className="bg-rose-50 border border-rose-150 text-rose-600 p-3 rounded-lg text-xs font-semibold flex items-center gap-2">
                <span className="text-rose-500 font-bold">⚠️</span>
                {errorMsg}
              </div>
            )}

            {/* 工作流 ID */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12.5px] font-extrabold text-slate-700 flex items-center gap-1">
                <span className="text-rose-500">*</span> 工作流 ID (英文/下划线)
              </label>
              <input 
                type="text"
                placeholder="例如: rule_enforcement_workflow"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                className="w-full border border-slate-250 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all font-mono font-bold"
              />
            </div>

            {/* 工作流中文名称 */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12.5px] font-extrabold text-slate-700 flex items-center gap-1">
                <span className="text-rose-500">*</span> 工作流中文名称
              </label>
              <input 
                type="text"
                placeholder="例如: 规则约束强制执行流程"
                value={formData.nameCn}
                onChange={(e) => setFormData({ ...formData, nameCn: e.target.value })}
                className="w-full border border-slate-250 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all font-medium"
              />
            </div>

            {/* 触发类型 */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12.5px] font-extrabold text-slate-700">
                触发类型 (Trigger Type)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div 
                  onClick={() => setFormData({ ...formData, triggerType: 'event' })}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition-all flex items-center justify-between ${
                    formData.triggerType === 'event' 
                      ? 'border-blue-500 bg-blue-50/10 shadow-[0_0_0_1px_rgba(59,130,246,0.2)]' 
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <p className="text-[12.5px] font-extrabold text-slate-850">事件触发</p>
                    <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">由外部事件驱动</span>
                  </div>
                  {formData.triggerType === 'event' && (
                    <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-sm">
                      <Check className="w-3 h-3 stroke-[2.5]" />
                    </div>
                  )}
                </div>

                <div 
                  onClick={() => setFormData({ ...formData, triggerType: 'cron' })}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition-all flex items-center justify-between ${
                    formData.triggerType === 'cron' 
                      ? 'border-blue-500 bg-blue-50/10 shadow-[0_0_0_1px_rgba(59,130,246,0.2)]' 
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <p className="text-[12.5px] font-extrabold text-slate-850">定时触发</p>
                    <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">通过 Cron 定时触发</span>
                  </div>
                  {formData.triggerType === 'cron' && (
                    <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-sm">
                      <Check className="w-3 h-3 stroke-[2.5]" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 适用范围 (Scope) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12.5px] font-extrabold text-slate-700">
                适用范围 (Scope)
              </label>
              <div className="flex gap-2 flex-wrap">
                {scopeOptions.map((scope) => {
                  const isSelected = selectedScopes.includes(scope);
                  return (
                    <button
                      key={scope}
                      type="button"
                      onClick={() => toggleScope(scope)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        isSelected 
                          ? 'bg-blue-50 border-blue-300 text-blue-700 font-extrabold' 
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {isSelected ? (
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                      ) : (
                        <Plus className="w-3 h-3 text-slate-450" />
                      )}
                      {scope}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 描述信息 */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12.5px] font-extrabold text-slate-700">
                流程描述说明
              </label>
              <textarea 
                rows={3}
                placeholder="简述该工作流的执行目标及业务覆盖范围"
                value={formData.desc}
                onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                className="w-full border border-slate-250 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all font-medium resize-none"
              />
            </div>

          </div>

          {/* 底部按钮区 (Footer) */}
          <div className="border-t border-slate-200/80 pt-5 mt-8 flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-2 text-center text-xs font-bold text-slate-600 bg-white border border-slate-200/85 hover:bg-slate-50 rounded-lg shadow-3xs transition-colors cursor-pointer"
            >
              取消
            </button>
            <button 
              type="submit"
              className="flex-1 py-2 text-center text-xs font-black text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs hover:shadow-blue-500/10 transition-colors cursor-pointer"
            >
              确认新建
            </button>
          </div>

        </form>

      </DrawerContent>
    </Drawer>
  );
}
