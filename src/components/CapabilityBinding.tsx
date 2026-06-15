import React, { useState } from 'react';
import { Capability, ObjectType } from '../types';
import { 
  Database, Table, FileText, Compass, ClipboardCopy, 
  Layers, ShieldAlert, Activity, Play, FileCheck, HelpCircle,
  Plus, Search, Code, Cpu, Workflow, ShieldCheck, CheckCircle2,
  AlertCircle, Edit, Trash2, ArrowRight, Settings, Info
} from 'lucide-react';

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
  capabilities,
  objectTypes,
  selectedObjectId,
  onSelectObject,
  onNavigate,
  isEditingActive,
  onUpdateCapabilities
}: CapabilityBindingProps) {

  const [activeCapId, setActiveCapId] = useState<string>(capabilities[1]?.id || 'classifyFieldSemantic');
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Add capability form state
  const [isAddingCap, setIsAddingCap] = useState(false);
  const [newCapName, setNewCapName] = useState('');
  const [newCapType, setNewCapType] = useState<'function' | 'action'>('function');
  const [newCapOutput, setNewCapOutput] = useState('');
  const [newCapAi, setNewCapAi] = useState<'是' | '否' | '可建议'>('是');
  const [newCapWorkflow, setNewCapWorkflow] = useState('SemanticReviewWorkflow');
  const [newCapPermission, setNewCapPermission] = useState('数据治理分析员');
  const [newCapDesc, setNewCapDesc] = useState('');

  // Filtering capabilities bound to the currently selected Object
  const boundCapabilities = capabilities.filter(cap => {
    // Matches if input object is selected object, OR if the search matches
    const isBound = cap.inputObject === selectedObjectId;
    const matchesSearch = searchTerm === '' || 
      cap.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cap.description.toLowerCase().includes(searchTerm.toLowerCase());
    return isBound && matchesSearch;
  });

  const activeCap = capabilities.find(c => c.id === activeCapId) || capabilities[0];

  const getObjIcon = (id: string, className = "h-4 w-4") => {
    switch (id) {
      case 'DataSource': return <Database className={`${className} text-blue-600`} />;
      case 'DataAsset': return <Table className={`${className} text-teal-600`} />;
      case 'Field': return <FileText className={`${className} text-indigo-600`} />;
      case 'SemanticAssertion': return <Compass className={`${className} text-purple-600`} />;
      case 'Evidence': return <ClipboardCopy className={`${className} text-violet-600`} />;
      case 'DataQualityRule': return <Layers className={`${className} text-emerald-600`} />;
      case 'DataIssue': return <ShieldAlert className={`${className} text-rose-600`} />;
      case 'GovernanceTask': return <Activity className={`${className} text-orange-600`} />;
      case 'Run': return <Play className={`${className} text-slate-500`} />;
      case 'Snapshot': return <FileCheck className={`${className} text-amber-600`} />;
      default: return <HelpCircle className={className} />;
    }
  };

  const handleCreateCap = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCapName.trim()) return;

    // Cleaned function/action id
    const newId = newCapName.replace(/[^a-zA-Z0-9]/g, '');

    const newCap: Capability = {
      id: newId,
      name: newCapName.endsWith('()') || newCapType === 'action' ? newCapName : `${newCapName}()`,
      type: newCapType,
      inputObject: selectedObjectId,
      outputObjectOrStatus: newCapOutput,
      isAiEnabled: newCapAi,
      workflows: [newCapWorkflow],
      permissions: newCapPermission,
      description: newCapDesc
    };

    if (capabilities.some(c => c.id === newCap.id)) {
      alert("此方法或动作名称已存存在！");
      return;
    }

    onUpdateCapabilities([...capabilities, newCap]);
    setActiveCapId(newCap.id);
    setIsAddingCap(false);
    // Clear
    setNewCapName('');
    setNewCapOutput('');
    setNewCapDesc('');
  };

  const handleDeleteCap = (idToDelete: string) => {
    if (!window.confirm("确定要解绑并注销该计算能力吗？")) return;
    const updated = capabilities.filter(c => c.id !== idToDelete);
    onUpdateCapabilities(updated);
    if (activeCapId === idToDelete) {
      setActiveCapId(updated[0]?.id || '');
    }
  };

  return (
    <div className="space-y-6" id="capability-workspace">
      
      {/* 头部过滤器 */}
      <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-slate-900">面向对象的 DRKN 计算与行为绑定 (Capability Binding)</h2>
          <p className="text-xs text-slate-500">
            DRKN 本体设计核心：无状态计算 (Functions) 与状态变化 (Actions) 需高内聚绑定在具体 Object Type 上。
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="搜索方法/动作名..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-250 rounded-lg min-w-[200px] focus:outline-none focus:border-blue-500 bg-slate-50/50"
            />
          </div>

          <button
            onClick={() => setIsAddingCap(true)}
            disabled={!isEditingActive}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm transition-colors ${
              isEditingActive 
                ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer' 
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Plus className="h-4 w-4" />
            新建绑定能力
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 左栏：选择绑定的目标 Object Type */}
        <div className="lg:col-span-3 bg-white border border-slate-205 rounded-xl p-4 shadow-sm space-y-4">
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
              按治理实体筛选能力
            </h3>
            <p className="text-[10px] text-slate-400 px-1">点击切换对象以查看其绑定的方法与动作</p>
          </div>

          <div className="space-y-1.5">
            {objectTypes.map((obj) => {
              const capCount = capabilities.filter(c => c.inputObject === obj.id).length;
              return (
                <div
                  key={obj.id}
                  onClick={() => onSelectObject(obj.id)}
                  className={`p-2 rounded-lg flex items-center justify-between cursor-pointer transition-all border ${
                    obj.id === selectedObjectId
                      ? 'bg-blue-50/70 border-blue-200 text-blue-900 font-semibold shadow-xs'
                      : 'hover:bg-slate-50 border-transparent text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {getObjIcon(obj.id, "h-4 w-4")}
                    <span className="text-xs font-mono truncate">{obj.id}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    obj.id === selectedObjectId 
                      ? 'bg-blue-200 text-blue-800' 
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {capCount}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 中栏：能力矩阵及运算展示 */}
        <div className="lg:col-span-6 bg-white border border-slate-205 rounded-xl p-6 shadow-sm flex flex-col justify-between min-h-[500px]">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-50 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="h-4.5 w-4.5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {selectedObjectId} 绑定的方法属性矩阵
                </h3>
              </div>
              <span className="text-xs text-slate-400">过滤结果: {boundCapabilities.length} 项</span>
            </div>

            {/* Split Functions & Actions into neat sub-grids */}
            <div className="space-y-6">
              
              {/* 1. Functions Group (计算/识别/判断) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    无状态计算服务 (Functions)
                  </h4>
                </div>

                <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {boundCapabilities.filter(c => c.type === 'function').map((cap) => (
                    <div
                      key={cap.id}
                      onClick={() => setActiveCapId(cap.id)}
                      className={`p-3.5 text-xs cursor-pointer transition-all flex items-start justify-between ${
                        cap.id === activeCapId
                          ? 'bg-blue-50/40 font-semibold border-l-3 border-l-blue-600'
                          : 'bg-white hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Code className="h-3.5 w-3.5 text-blue-600" />
                          <span className="text-slate-900 font-mono text-[13px]">{cap.name}</span>
                        </div>
                        <p className="text-[11px] font-normal text-slate-500 leading-normal line-clamp-1">{cap.description}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {cap.isAiEnabled === '是' && (
                          <span className="text-[9px] bg-indigo-50 border border-indigo-150 text-indigo-700 px-1.5 py-0.5 rounded-sm flex items-center gap-0.5 font-bold">
                            <Cpu className="h-3 w-3" /> AI可用
                          </span>
                        )}
                        <ArrowRight className="h-4 w-4 text-slate-300" />
                      </div>
                    </div>
                  ))}
                  {boundCapabilities.filter(c => c.type === 'function').length === 0 && (
                    <p className="text-xs text-slate-400 p-4 text-center">暂无绑定的 Function</p>
                  )}
                </div>
              </div>

              {/* 2. Actions Group (创建/确认/修改) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-purple-500"></span>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    状态修改行为处理器 (Actions)
                  </h4>
                </div>

                <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {boundCapabilities.filter(c => c.type === 'action').map((cap) => (
                    <div
                      key={cap.id}
                      onClick={() => setActiveCapId(cap.id)}
                      className={`p-3.5 text-xs cursor-pointer transition-all flex items-start justify-between ${
                        cap.id === activeCapId
                          ? 'bg-purple-50/40 font-semibold border-l-3 border-l-purple-600'
                          : 'bg-white hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Play className="h-3.5 w-3.5 text-purple-600" />
                          <span className="text-slate-900 font-mono text-[13px]">{cap.name}</span>
                        </div>
                        <p className="text-[11px] font-normal text-slate-500 leading-normal line-clamp-1">{cap.description}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[9px] bg-slate-100 border border-slate-200 text-slate-650 px-1.5 py-0.5 rounded-sm font-medium">
                          修改状态
                        </span>
                        <ArrowRight className="h-4 w-4 text-slate-300" />
                      </div>
                    </div>
                  ))}
                  {boundCapabilities.filter(c => c.type === 'action').length === 0 && (
                    <p className="text-xs text-slate-400 p-4 text-center">暂无绑定的 Action</p>
                  )}
                </div>
              </div>

            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 p-3 bg-slate-50 rounded-lg text-xs leading-relaxed text-slate-500">
            📌 <b>方法论设计准则</b>：为了维护 DRKN 实体一致性，<b>Function 绝不能改动数据库或模型状态</b>，它仅负责数据测算提供给推理网；而<b>Action 是唯一的写入与迁移动作来源</b>。这完全是对接高等级 Palantir 规范。
          </div>
        </div>

        {/* 右栏：选中计算/行为能力详情 */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white border border-slate-205 rounded-xl p-5 shadow-sm space-y-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">
              能力运行明细规则
            </h3>

            {activeCap ? (
              <div className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1">
                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${
                      activeCap.type === 'function' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                    }`}>
                      {activeCap.type === 'function' ? '计算服务 (Function)' : '更改状态行为 (Action)'}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 font-mono">{activeCap.name}</h4>
                </div>

                <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-100 leading-normal">
                  {activeCap.description}
                </p>

                <div className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <p className="text-slate-450 uppercase font-semibold text-[10px]">输入绑定对象:</p>
                    <div className="flex items-center gap-1.5 text-slate-800 font-mono bg-slate-50 p-2 rounded border border-slate-100 font-medium">
                      {getObjIcon(activeCap.inputObject, "h-4 w-4 shrink-0")}
                      <span>{activeCap.inputObject}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-slate-450 uppercase font-semibold text-[10px]">
                      {activeCap.type === 'function' ? '计算输出结果荷载:' : '执行产生状态改变:'}
                    </p>
                    <p className="p-2 bg-slate-50 rounded border border-slate-100 font-mono text-slate-850 whitespace-pre-wrap leading-normal font-medium">
                      {activeCap.outputObjectOrStatus}
                    </p>
                  </div>

                  <div className="space-y-2 border-t border-slate-50 pt-2.5">
                    <div className="flex items-center justify-between py-1">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Cpu className="h-3.5 w-3.5 text-slate-400" />
                        AI 在工作可用度？
                      </span>
                      <span className="font-semibold text-slate-800">{activeCap.isAiEnabled}</span>
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Workflow className="h-3.5 w-3.5 text-slate-400" />
                        绑定的审计工作流:
                      </span>
                      <span className="font-semibold font-mono text-indigo-700">{activeCap.workflows.join(', ')}</span>
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <span className="text-slate-500 flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                        要求执行权限策略:
                      </span>
                      <span className="font-semibold text-slate-800 text-right">{activeCap.permissions}</span>
                    </div>
                  </div>
                </div>

                {/* Direct Deletion button */}
                {isEditingActive && (
                  <button 
                    onClick={() => handleDeleteCap(activeCap.id)}
                    className="w-full py-2 bg-slate-50 text-rose-700 hover:bg-rose-50 rounded-lg border border-slate-205 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    解绑并注销模型能力
                  </button>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">暂无选中方法的详细信息</p>
            )}
          </div>
        </div>

      </div>

      {/* Modal interface for adding capability */}
      {isAddingCap && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" onClick={() => setIsAddingCap(false)}></div>
          
          <div className="relative bg-white border border-slate-205 max-w-lg w-full mx-4 rounded-xl shadow-2xl overflow-hidden" id="add-cap-modal">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                为 {selectedObjectId} 对象进行语义能力绑定 (Capability Mapping)
              </h3>
              <button onClick={() => setIsAddingCap(false)} className="text-slate-400 hover:text-slate-600 text-lg">&times;</button>
            </div>

            <form onSubmit={handleCreateCap} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-705 block">方法/动作物理名称</label>
                  <input
                    type="text"
                    required
                    value={newCapName}
                    onChange={(e) => setNewCapName(e.target.value.replace(/[^a-zA-Z0-9()]/g, ''))}
                    placeholder="例如: evaluateAssetRank()"
                    className="w-full px-3 py-2 text-xs border border-slate-250 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-705 block">能力属性模式</label>
                  <select
                    value={newCapType}
                    onChange={(e) => setNewCapType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-250 rounded-lg focus:outline-none focus:border-blue-500 animate-none"
                  >
                    <option value="function">计算验证 (Function - 无状态)</option>
                    <option value="action">状态更改 (Action - 写操作)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-705 block">
                  {newCapType === 'function' ? '计算结果荷载 (Output Object):' : '执行引发的实体状态改变:'}
                </label>
                <input
                  type="text"
                  required
                  value={newCapOutput}
                  onChange={(e) => setNewCapOutput(e.target.value)}
                  placeholder={newCapType === 'function' ? "例如: AssetQualityScoreDto " : "例如: 设为 Deprecated / 触发审批单"}
                  className="w-full px-3 py-2 text-xs border border-slate-250 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-505 block">AI 工作台可见性</label>
                  <select
                    value={newCapAi}
                    onChange={(e) => setNewCapAi(e.target.value as any)}
                    className="w-full px-2.5 py-2 text-xs border border-slate-250 rounded-lg"
                  >
                    <option value="是">是 (可以直接指派)</option>
                    <option value="否">否 (AI不可调配)</option>
                    <option value="可建议">可建议 (引导分析推荐)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-505 block">主依赖审计流</label>
                  <select
                    value={newCapWorkflow}
                    onChange={(e) => setNewCapWorkflow(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs border border-slate-250 rounded-lg"
                  >
                    <option value="SemanticReviewWorkflow">SemanticReview</option>
                    <option value="DQAssessmentWorkflow">DQAssessment</option>
                    <option value="MetadataScanWorkflow">MetadataScan</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-505 block">调用最低执行账户</label>
                  <input
                    type="text"
                    required
                    value={newCapPermission}
                    onChange={(e) => setNewCapPermission(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs border border-slate-250 rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-705 block">规则用途释义</label>
                <textarea
                  rows={3}
                  required
                  value={newCapDesc}
                  onChange={(e) => setNewCapDesc(e.target.value)}
                  placeholder="请输入该能力的口径语义，描述底层物理计算如何转化为该特定的对象方法，供大模型匹配理解..."
                  className="w-full px-3 py-2 text-xs border border-slate-250 rounded-lg focus:outline-none focus:border-blue-500"
                ></textarea>
              </div>

              <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-900 rounded-lg text-[10.5px] leading-relaxed flex items-start gap-1">
                <Info className="h-4 w-4 text-indigo-500 shrink-0" />
                <span>计算绑定建立后将处于草稿态缓存，自动适配进入当期变更包。你可以对其下游 AI 的引用进行校验。</span>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsAddingCap(false)}
                  className="px-4 py-2 text-xs font-semibold border border-slate-300 text-slate-705 hover:bg-slate-50 rounded-lg cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer shadow-xs"
                >
                  确定绑定并缓存配置
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
