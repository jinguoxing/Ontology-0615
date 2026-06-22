import React, { useState } from 'react';
import { X, AlertTriangle, Check, Search, Shield, Settings, Cpu, Layers, Link2, BookOpen, AlertCircle, Info } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from './ui/Drawer';
import { Button } from './ui/Button';

interface CreateChangeSetDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export default function CreateChangeSetDrawer({ isOpen, onClose, onSubmit }: CreateChangeSetDrawerProps) {
  const [formData, setFormData] = useState({
    name: '字段语义识别能力优化',
    reason: 'AI 工作台反馈 supplier_id 字段识别错误',
    changeType: 'Function 绑定变更 + 调整',
    baseVersion: 'v1.3.0 (已发布)',
    targetVersion: 'v1.4.0',
    relatedTask: 'TASK-2026-0831',
    reviewer: '数据治理负责人',
    notes: '',
  });

  const [selectedTypes, setSelectedTypes] = useState<string[]>([
    '对象模型变更',
    'Function 绑定变更'
  ]);

  const toggleType = (type: string) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter(t => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const changeTypes = [
    { id: '对象模型变更', icon: <Layers className="h-4 w-4" />, colorClass: 'text-blue-600' },
    { id: '关系模型变更', icon: <Link2 className="h-4 w-4" />, colorClass: 'text-emerald-600' },
    { id: 'Function 绑定变更', icon: <Cpu className="h-4 w-4" />, colorClass: 'text-blue-600' },
    { id: 'Workflow 变更', icon: <Settings className="h-4 w-4" />, colorClass: 'text-slate-500' },
    { id: '权限变更', icon: <Shield className="h-4 w-4" />, colorClass: 'text-slate-500' },
    { id: '发布配置变更', icon: <BookOpen className="h-4 w-4" />, colorClass: 'text-slate-500' },
    { id: '紧急修复', icon: <AlertTriangle className="h-4 w-4" />, colorClass: 'text-slate-500' },
  ];

  return (
    <Drawer open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DrawerContent maxWidth="max-w-[480px]">
        {/* Header */}
        <DrawerHeader>
          <DrawerTitle>新建变更集</DrawerTitle>
        </DrawerHeader>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin">
          
          {/* Section 1: Basic Info */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-[13px] font-bold text-slate-800">
              <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">1</span>
              基础信息
            </h3>
            
            <div className="space-y-3">
              {/* Field: Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                  <span className="text-rose-500">*</span> 变更集名称
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all font-medium"
                  />
                  <span className="absolute right-3 top-2.5 text-[10px] text-slate-400">10/50</span>
                </div>
              </div>

              {/* Field: Reason */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                  <span className="text-rose-500">*</span> 变更原因
                </label>
                <div className="relative">
                  <textarea 
                    value={formData.reason}
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                    rows={2}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all font-medium resize-none"
                  />
                   <span className="absolute right-3 bottom-2 text-[10px] text-slate-400 bg-white px-1">21/200</span>
                </div>
              </div>

              {/* Field: Change Type */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                  <span className="text-rose-500">*</span> 变更类型
                </label>
                <select 
                  value={formData.changeType}
                  onChange={(e) => setFormData({...formData, changeType: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all font-medium appearance-none cursor-pointer"
                >
                  <option value="Function 绑定变更 + 调整">Function 绑定变更 + 调整</option>
                  <option value="对象模型结构扩展">对象模型结构扩展</option>
                  <option value="关系模型补齐">关系模型补齐</option>
                </select>
              </div>

              {/* Field: Base Version */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                  <span className="text-rose-500">*</span> 基于版本
                </label>
                <select 
                  value={formData.baseVersion}
                  onChange={(e) => setFormData({...formData, baseVersion: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all font-medium appearance-none cursor-pointer"
                >
                  <option value="v1.3.0 (已发布)">v1.3.0 (已发布)</option>
                  <option value="v1.2.0 (已发布)">v1.2.0 (已发布)</option>
                </select>
              </div>

              {/* Field: Target Version */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                  <span className="text-rose-500">*</span> 目标版本
                </label>
                <input 
                  type="text" 
                  value={formData.targetVersion}
                  onChange={(e) => setFormData({...formData, targetVersion: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all font-medium"
                />
              </div>

              {/* Field: Related Task */}
              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-slate-600 w-16 shrink-0">
                  关联任务
                </label>
                <div className="relative flex-1">
                  <input 
                    type="text" 
                    value={formData.relatedTask}
                    onChange={(e) => setFormData({...formData, relatedTask: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-all font-medium"
                  />
                  <X className="absolute right-2.5 top-2 h-3.5 w-3.5 text-slate-300 cursor-pointer hover:text-slate-500" />
                </div>
              </div>

              {/* Field: Reviewer */}
              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-slate-600 flex items-center gap-1 w-16 shrink-0">
                  <span className="text-rose-500">*</span> 审核人
                </label>
                <div className="relative flex-1">
                  <div className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all font-medium flex items-center gap-1.5 cursor-pointer bg-white">
                    <div className="bg-blue-50 text-blue-600 p-0.5 rounded-full">
                      <Shield className="h-3 w-3" />
                    </div>
                    {formData.reviewer}
                  </div>
                   <X className="absolute right-2.5 top-2 h-3.5 w-3.5 text-slate-300 cursor-pointer hover:text-slate-500" />
                </div>
              </div>

              {/* Field: Notes */}
              <div className="flex items-start gap-3 pt-1">
                <label className="text-xs font-semibold text-slate-600 w-16 shrink-0 pt-2">
                  备注
                </label>
                <div className="relative flex-1">
                  <textarea 
                    placeholder="选填，输入备注信息（不超过 200 字）"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={2}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all font-medium resize-none placeholder:font-normal"
                  />
                  <span className="absolute right-3 bottom-2 text-[10px] text-slate-400 bg-white px-1">0/200</span>
                </div>
              </div>

            </div>
          </div>

          {/* Section 2: Change Types Multi-Select */}
          <div className="space-y-3">
            <h3 className="flex items-center justify-between text-[13px] font-bold text-slate-800">
              <div className="flex items-center gap-2">
                <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">2</span>
                变更类型 (可多选)
              </div>
            </h3>
            
            <div className="grid grid-cols-2 gap-2.5">
              {changeTypes.map((type) => {
                const isSelected = selectedTypes.includes(type.id);
                return (
                  <div 
                    key={type.id}
                    onClick={() => toggleType(type.id)}
                    className={`flex items-center justify-between border rounded-lg px-3 py-2.5 cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50/30 shadow-sm' 
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`${
                        isSelected 
                          ? type.colorClass
                          : 'text-slate-400'
                      }`}>
                        {type.icon}
                      </div>
                      <span className={`text-xs font-bold ${
                        isSelected ? 'text-slate-800' : 'text-slate-600'
                      }`}>{type.id}</span>
                    </div>
                    {/* Checkbox */}
                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600'
                        : 'bg-white border-slate-300'
                    }`}>
                      {isSelected && <Check className="h-2.5 w-2.5 text-white stroke-[3]" />}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Section 3: Expected Impact */}
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-[13px] font-bold text-slate-800">
              <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">3</span>
               预计影响范围
            </h3>
            
            <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3.5 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <span className="text-[11.5px] font-semibold text-amber-800">可能影响知识网络视图</span>
              </div>
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <span className="text-[11.5px] font-semibold text-amber-800">可能影响 AI 工作台解释</span>
              </div>
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <span className="text-[11.5px] font-semibold text-amber-800">可能影响 DKN Mapping</span>
              </div>
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <span className="text-[11.5px] font-bold text-amber-900">发布前需执行模型校验与影响分析</span>
              </div>
            </div>
            
            <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3.5 flex gap-2">
              <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-[11.5px] text-blue-800 font-medium leading-relaxed">
                所有对象、关系、Function 和流程修改都会先进入该变更集，发布前需要经过校验、影响分析和审核。
              </p>
            </div>
          </div>

        </div>

        {/* Footer actions */}
        <DrawerFooter>
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              onSubmit(formData);
              onClose();
            }}
          >
            创建变更集
          </Button>
        </DrawerFooter>

      </DrawerContent>
    </Drawer>
  );
}
