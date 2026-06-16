import React, { useState } from 'react';
import { 
  X, HelpCircle, AlertTriangle, ChevronDown, CheckCircle2, 
  Link as LinkIcon, AlertCircle, Info, ArrowRight, Shield, 
  Sparkles, Layers, Check, Users, Eye, Play, Sparkle, Target, Database, GitMerge
} from 'lucide-react';

interface CreateLinkTypeDrawerProps {
  onClose: () => void;
  onSave?: () => void;
}

export default function CreateLinkTypeDrawer({ onClose, onSave }: CreateLinkTypeDrawerProps) {
  // --- Form States ---
  // Block 1: 关系基础信息
  const [linkTypeName, setLinkTypeName] = useState('maps_to');
  const [cnName, setCnName] = useState('映射到');
  const [description, setDescription] = useState(
    '用于连接 DRKN Field 与 DKN DomainMapping，表示字段被领域映射引用。'
  );
  const [selectedModel, setSelectedModel] = useState('DRKN-Core');
  const [selectedChangeset, setSelectedChangeset] = useState('CS-2026-012');

  // Block 2: 源对象与目标对象
  const [sourceObj, setSourceObj] = useState('Field');
  const [targetObj, setTargetObj] = useState('DomainMapping');
  const [cardinality, setCardinality] = useState<'1:1' | '1:N' | 'N:N'>('N:N');

  // Block 3: 关系约束
  const [isRequired, setIsRequired] = useState(false);
  const [allowMultiTarget, setAllowMultiTarget] = useState(true);
  const [allowReverseQuery, setAllowReverseQuery] = useState(true);
  const [allowCrossDomain, setAllowCrossDomain] = useState(true);
  const [isLineage, setIsLineage] = useState(true);
  const [isAiVisible, setIsAiVisible] = useState(true);

  // Block 4: 权限与展示
  const [creatorRole, setCreatorRole] = useState('数据治理管理员');
  const [viewerRole, setViewerRole] = useState('数据治理人员 / 领域建模人员');
  const [webDisplayStyle, setWebDisplayStyle] = useState('虚线映射关系');
  const [aiRefEnable, setAiRefEnable] = useState(true);

  // Available options
  const modelOptions = ['DRKN-Core', 'DRKN-Extension', 'DKN-Domain', 'System-Meta'];
  const changesetOptions = ['CS-2026-012', 'CS-2026-009', 'CS-2026-015'];
  const objTypeOptions = [
    { value: 'Field', label: 'Field (字段)' },
    { value: 'DomainMapping', label: 'DomainMapping (领域映射)' },
    { value: 'DataSource', label: 'DataSource (数据源)' },
    { value: 'DataAsset', label: 'DataAsset (数据资产)' },
    { value: 'SemanticAssertion', label: 'SemanticAssertion (语义断言)' },
    { value: 'Evidence', label: 'Evidence (证据)' },
    { value: 'DataQualityRule', label: 'DataQualityRule (质量规则)' },
    { value: 'DataIssue', label: 'DataIssue (数据问题)' },
    { value: 'GovernanceTask', label: 'GovernanceTask (治理任务)' }
  ];
  const roleOptions = [
    '数据治理管理员',
    '数据治理人员 / 领域建模人员',
    '普通业务分析师',
    '系统运维人员',
    '安全合规官'
  ];
  const webDisplayStyleOptions = [
    '虚线映射关系',
    '实线关联关系',
    '双向虚线连线',
    '单向粗实线'
  ];

  // Check if target is indeed in DKN domain group (for dynamic check calculation)
  const isTargetInDknDomain = targetObj === 'DomainMapping' || targetObj.startsWith('Domain');

  // Submission validation
  const isFormValid = linkTypeName.trim() !== '' && cnName.trim() !== '';

  const handleSave = () => {
    if (!linkTypeName.trim() || !cnName.trim()) {
      alert('❌ 请输入合法的关系英文名与中文名！');
      return;
    }
    if (onSave) {
      onSave();
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[640px] bg-white shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-300 border-l border-slate-200 text-left">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-slate-50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-sm">
            <LinkIcon className="w-4.5 h-4.5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight">添加 Link Type</h2>
            <p className="text-[11px] text-slate-450 font-medium mt-0.5">创建两个 Object Type 之间的新关联定义并安全管理</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="text-[12px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 bg-white hover:bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer">
            <HelpCircle className="w-3.5 h-3.5" /> 帮助说明
          </button>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Top Context Info Tag area */}
      <div className="bg-slate-100/70 border-b border-slate-150 px-6 py-3 shrink-0 flex items-center justify-between text-[11px] text-slate-550 font-medium">
        <div className="flex items-center gap-2">
          <span>所属域: </span>
          <span className="font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100">DRKN 基础核心</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span>当前沙箱: </span>
            <span className="font-mono font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">CS-2026-012</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1">
            <span>隔离状态: </span>
            <span className="font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">校验通过</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
        
        {/* Block 1: 关系基础信息 */}
        <section className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-3xs space-y-4">
          <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
            <span className="w-1.5 h-3 bg-blue-600 rounded-full block"></span>
            <h3 className="text-xs font-black text-slate-800">第一块：关系基础信息</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11.5px] font-extrabold text-slate-600 block">
                Link Type Name <span className="text-red-500" title="必填">*</span>
              </label>
              <input 
                type="text" 
                value={linkTypeName} 
                onChange={(e) => setLinkTypeName(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))} 
                placeholder="例如: maps_to"
                className="w-full px-3 py-2 bg-white border border-slate-250 rounded-lg text-xs text-slate-805 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder:font-sans placeholder:text-slate-305" 
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[11.5px] font-extrabold text-slate-600 block">
                中文名 <span className="text-red-500" title="必填">*</span>
              </label>
              <input 
                type="text" 
                value={cnName} 
                onChange={(e) => setCnName(e.target.value)} 
                placeholder="例如: 映射到"
                className="w-full px-3 py-2 bg-white border border-slate-250 rounded-lg text-xs text-slate-805 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" 
              />
            </div>

            <div className="col-span-2 space-y-1.5">
              <label className="text-[11.5px] font-extrabold text-slate-600 block">关系说明</label>
              <textarea 
                rows={2} 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                placeholder="填写精要描述，以便大模型与血缘审计模块正常解析..."
                className="w-full px-3 py-2 bg-white border border-slate-250 rounded-lg text-xs text-slate-805 leading-relaxed focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11.5px] font-extrabold text-slate-600 block">所属模型</label>
              <div className="relative">
                <select 
                  value={selectedModel} 
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full pl-3 pr-8 py-2 bg-white border border-slate-250 rounded-lg text-xs text-slate-805 font-semibold appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  {modelOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11.5px] font-extrabold text-slate-600 block">所属变更集</label>
              <div className="relative">
                <select 
                  value={selectedChangeset} 
                  onChange={(e) => setSelectedChangeset(e.target.value)}
                  className="w-full pl-3 pr-8 py-2 bg-white border border-slate-250 rounded-lg text-xs text-slate-805 font-mono font-bold appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  {changesetOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </section>

        {/* Block 2: 源对象与目标对象 */}
        <section className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-3xs space-y-4">
          <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
            <span className="w-1.5 h-3 bg-blue-600 rounded-full block"></span>
            <h3 className="text-xs font-black text-slate-800">第二块：源对象与目标对象</h3>
          </div>
          
          <div className="bg-indigo-50/20 border border-indigo-100/60 p-4 rounded-xl space-y-4 animate-fade-in">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-600 tracking-tight">Source Object Type</label>
                <div className="relative">
                  <select 
                    value={sourceObj} 
                    onChange={(e) => setSourceObj(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 bg-white border border-slate-250 rounded-lg text-xs font-mono font-bold text-slate-805 appearance-none focus:outline-none focus:ring-1 focus:focus:ring-blue-500 focus:border-blue-500 shadow-3xs"
                  >
                    {objTypeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
              
              <div className="flex flex-col items-center justify-center pt-4">
                <div className="text-[10px] font-black text-blue-600 tracking-tight mb-1 bg-blue-50/80 px-1.5 py-0.5 rounded border border-blue-100">方向</div>
                <div className="flex items-center text-slate-450">
                  <span className="text-xs font-bold leading-none font-sans select-none">→</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-600 tracking-tight">Target Object Type</label>
                <div className="relative">
                  <select 
                    value={targetObj} 
                    onChange={(e) => setTargetObj(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 bg-white border border-slate-250 rounded-lg text-xs font-mono font-bold text-slate-805 appearance-none focus:outline-none focus:ring-1 focus:focus:ring-blue-500 focus:border-blue-500 shadow-3xs"
                  >
                    {objTypeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Dynamic path flow visual card */}
            <div className="bg-white border border-indigo-100/50 p-2.5 rounded-lg flex items-center justify-between text-xs text-slate-600">
              <span className="font-extrabold text-[11px]">链路表示:</span>
              <div className="flex items-center gap-2 font-mono font-black text-indigo-700 bg-indigo-50/50 px-2 py-1 rounded">
                <span>{sourceObj}</span>
                <ArrowRight className="w-3 h-3 text-indigo-400" />
                <span>{targetObj}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200/60">
              <div className="flex items-center justify-between">
                <label className="text-[11.5px] font-extrabold text-slate-600">基数 (Cardinality)</label>
                <div className="flex bg-white rounded-lg border border-slate-250 p-0.5 shadow-3xs">
                  {(['1:1', '1:N', 'N:N'] as const).map(card => (
                    <button 
                      key={card}
                      type="button"
                      onClick={() => setCardinality(card)}
                      className={`px-3 py-1 font-mono text-[11.5px] font-bold rounded-md transition-all cursor-pointer ${
                        cardinality === card 
                          ? 'bg-blue-600 text-white shadow-2xs' 
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      {card}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[11px] text-slate-450 mt-2 font-medium leading-relaxed bg-slate-100/40 p-2 rounded-lg border border-slate-200/30">
                {cardinality === 'N:N' && '🌟 一个源对象实例可被关联至多个目标对象实例，且支持多对多的双向解耦关联（一个字段可被多个域映射引用，一个映射可包含多个字段）。'}
                {cardinality === '1:N' && '🌟 一个源对象实例可关联至多个目标对象实例，但每个目标对象实例最多属于一个源对象。'}
                {cardinality === '1:1' && '🌟 严格的单对单映射关联，一个源对象仅允许严格对应一个目标实体。'}
              </p>
            </div>
          </div>
        </section>

        {/* Block 3: 关系约束 */}
        <section className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-3xs space-y-4">
          <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
            <span className="w-1.5 h-3 bg-blue-600 rounded-full block"></span>
            <h3 className="text-xs font-black text-slate-800">第三块：关系约束</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-3 pb-1">
            {[
              { id: 'isRequired', label: '是否必填', value: isRequired, setter: setIsRequired, desc: '写入源实例时需同时指定该核心连接' },
              { id: 'allowMultiTarget', label: '是否允许多目标', value: allowMultiTarget, setter: setAllowMultiTarget, desc: '支持将其连接至一系列不通的目标实例' },
              { id: 'allowReverseQuery', label: '是否允许反向查询', value: allowReverseQuery, setter: setAllowReverseQuery, desc: '后台自动注册及编排目标实体的层级倒查' },
              { id: 'allowCrossDomain', label: '是否允许跨域关系', value: allowCrossDomain, setter: setAllowCrossDomain, desc: '支持跨 DRKN 核心到非核心等外部模型域' },
              { id: 'isLineage', label: '是否参与血缘', value: isLineage, setter: setIsLineage, desc: '直接参与并影响底层数据治理及血缘大图展现', highlight: 'text-emerald-700 font-extrabold bg-emerald-50/30 border-emerald-100' },
              { id: 'isAiVisible', label: '是否 AI 可见', value: isAiVisible, setter: setIsAiVisible, desc: '启用该属性暴露给 AI Studio 工作场景及 Prompt 集', highlight: 'text-blue-700 font-extrabold bg-blue-50/30 border-blue-100' }
            ].map(item => (
              <label 
                key={item.id}
                className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer text-left transition-all select-none ${
                  item.value 
                    ? item.highlight ? `${item.highlight} shadow-3xs` : 'bg-blue-50/20 border-blue-200 shadow-3xs text-blue-900' 
                    : 'bg-white border-slate-200 hover:bg-slate-50/50 text-slate-650'
                }`}
              >
                <input 
                  type="checkbox"
                  checked={item.value}
                  onChange={(e) => item.setter(e.target.checked)}
                  className="rounded border-slate-350 text-blue-600 focus:ring-blue-500 mt-0.5 shrink-0 cursor-pointer"
                />
                <div className="min-w-0">
                  <span className="text-xs font-black block tracking-tight">
                    {item.label}: <span className="font-bold underline">{item.value ? '是' : '否'}</span>
                  </span>
                  <span className="text-[10px] text-slate-450 block mt-0.5 leading-normal font-medium">
                    {item.desc}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </section>

        {/* Block 4: 权限与展示 */}
        <section className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-3xs space-y-4">
          <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
            <span className="w-1.5 h-3 bg-blue-600 rounded-full block"></span>
            <h3 className="text-xs font-black text-slate-800">第四块：权限与展示</h3>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11.5px] font-extrabold text-slate-600 block">谁能创建该关系</label>
                <div className="relative">
                  <select 
                    value={creatorRole} 
                    onChange={(e) => setCreatorRole(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 bg-white border border-slate-250 rounded-lg text-xs text-slate-805 font-bold appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {roleOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11.5px] font-extrabold text-slate-600 block">谁能查看该关系</label>
                <div className="relative">
                  <select 
                    value={viewerRole} 
                    onChange={(e) => setViewerRole(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 bg-white border border-slate-250 rounded-lg text-xs text-slate-805 font-bold appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {roleOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100/80">
              <div className="space-y-1.5">
                <label className="text-[11.5px] font-extrabold text-slate-600 block">知识网络展示方式</label>
                <div className="relative">
                  <select 
                    value={webDisplayStyle} 
                    onChange={(e) => setWebDisplayStyle(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 bg-white border border-slate-250 rounded-lg text-xs text-slate-805 font-bold appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {webDisplayStyleOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11.5px] font-extrabold text-slate-600 block">AI 工作台是否可引用</label>
                <div className="flex bg-slate-100 rounded-lg border border-slate-250 p-0.5 h-[34px]">
                  <button 
                    type="button"
                    onClick={() => setAiRefEnable(true)}
                    className={`flex-1 text-[11px] font-extrabold rounded-md transition-all cursor-pointer ${
                      aiRefEnable 
                        ? 'bg-emerald-600 text-white shadow-2xs' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    是 (Enabled)
                  </button>
                  <button 
                    type="button"
                    onClick={() => setAiRefEnable(false)}
                    className={`flex-1 text-[11px] font-extrabold rounded-md transition-all cursor-pointer ${
                      !aiRefEnable 
                        ? 'bg-slate-500 text-white shadow-2xs' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    否 (Disabled)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Block 5: 校验与影响分析 */}
        <section className="bg-indigo-50/20 border border-slate-200/95 p-5 rounded-2xl shadow-3xs space-y-4">
          <div className="flex items-center gap-2 mb-2 border-b border-indigo-100/40 pb-2">
            <Layers className="w-4.5 h-4.5 text-indigo-600" />
            <h3 className="text-xs font-black text-slate-850">第五块：校验与影响分析</h3>
          </div>
          
          <div className="space-y-2.5">
            {/* Rule 1: Source object state validation */}
            <div className="bg-emerald-50/60 border border-emerald-100 p-3 rounded-xl flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 bg-emerald-100/50 rounded-full p-0.5" />
              <div className="text-xs">
                <span className="font-extrabold text-emerald-950 block">Source Object Type 已存在</span>
                <span className="text-[10.5px] text-emerald-700 font-semibold block mt-0.5">
                  实体模型「{sourceObj}」处于已激活/已发布状态，可直接用作本次关系拓展的起点。
                </span>
              </div>
            </div>

            {/* Rule 2: Target object category validation */}
            {isTargetInDknDomain ? (
              <div className="bg-emerald-50/60 border border-emerald-100 p-3 rounded-xl flex items-start gap-3 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 bg-emerald-100/50 rounded-full p-0.5" />
                <div className="text-xs">
                  <span className="font-extrabold text-emerald-950 block">
                    Target Object Type 来自 <span className="font-black text-indigo-700 bg-indigo-50 px-1 rounded border border-indigo-100">DKN 域</span>
                  </span>
                  <span className="text-[10.5px] text-emerald-700/80 font-bold block mt-1 leading-relaxed">
                    目标对象「{targetObj}」属于受保护的 DKN 行业领域核心注册集，跨网校验通过。
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-250/70 p-3 rounded-xl flex items-start gap-3 animate-fade-in">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-extrabold text-amber-950 block">Target Object Type 来自非 DKN 域</span>
                  <span className="text-[10.5px] text-amber-700 font-medium block mt-0.5">
                    目标对象「{targetObj}」未注册在 DKN 标准域下，关联可能无法触发跨域级联。
                  </span>
                </div>
              </div>
            )}

            {/* Rule 3: Lineage & structural impact */}
            <div className="bg-blue-50/40 border border-blue-150 p-3 rounded-xl flex items-start gap-3">
              <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-900">
                <span className="font-extrabold block">该关系将影响跨层映射网络</span>
                <span className="text-[10.5px] text-slate-500/90 block mt-0.5 leading-relaxed font-semibold">
                  因为源 Field 指向 DomainMapping 两端均处于数据资产跟行业模型树的核心相交点。
                </span>
              </div>
            </div>

            {/* Rule 4: Affected active item instances count */}
            <div className="bg-amber-50 border border-amber-200/90 p-3 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-extrabold text-amber-950 block">
                  该关系可能影响 <span className="font-mono font-black text-base text-amber-600 mx-0.5">3</span> 个 DKN Mapping
                </span>
                <span className="text-[10.5px] text-amber-700/80 leading-relaxed font-bold block mt-1">
                  变更部署时，处于预备态的级联解释计算需要重新扫描并重构对应的逻辑连接指标链。
                </span>
              </div>
            </div>

            {/* Rule 5: Generative Semantic interpretation */}
            <div className="bg-indigo-50/40 border border-indigo-150 p-3 rounded-xl flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <div className="text-xs text-indigo-950/80">
                <span className="font-extrabold block">该关系将被 AI 解释链使用</span>
                <span className="text-[10.5px] text-indigo-700 font-semibold block mt-0.5">
                  AI 检索工作台在做全自动链路说明（Semantic explanation chain）时将优先对该链接做路由描述。
                </span>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* Footer */}
      <div className="p-5 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 shrink-0">
        <button 
          onClick={onClose}
          className="px-5 py-2 text-xs font-black text-slate-700 bg-white border border-slate-250 hover:bg-slate-100 rounded-lg shadow-xs transition-all cursor-pointer"
        >
          取消
        </button>
        <button 
          onClick={handleSave}
          disabled={!isFormValid}
          className="px-5 py-2 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 shadow-sm rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
        >
          保存到变更集
        </button>
      </div>
      
    </div>
  );
}
