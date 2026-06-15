import React, { useState } from 'react';
import { LinkType } from '../types';
import { 
  Database, Table, FileText, Compass, ClipboardCopy, 
  Layers, ShieldAlert, Activity, Play, FileCheck, HelpCircle,
  HelpCircle as QuestionIcon, Sparkles, Eye, ShieldCheck, 
  GitBranch, ArrowRight, ToggleLeft, Plus, Trash2, Info
} from 'lucide-react';

interface RelationModelProps {
  linkTypes: LinkType[];
  onNavigate: (view: string, targetId?: string) => void;
  isEditingActive: boolean;
  onUpdateLinkTypes: (updated: LinkType[]) => void;
}

export default function RelationModel({
  linkTypes,
  onNavigate,
  isEditingActive,
  onUpdateLinkTypes
}: RelationModelProps) {

  // Current active chosen Link Type
  const [activeLinkId, setActiveLinkId] = useState<string>(linkTypes[2]?.id || 'has_assertion');
  // Filters: 'All' | 'Lineage' | 'AI' | 'Gov'
  const [activeFilter, setActiveFilter] = useState<'All' | 'Lineage' | 'AI' | 'Gov'>('All');

  // Input states for creating relations
  const [isAddingRelation, setIsAddingRelation] = useState(false);
  const [newLinkId, setNewLinkId] = useState('');
  const [newLinkNameCn, setNewLinkNameCn] = useState('');
  const [newLinkSource, setNewLinkSource] = useState('Field');
  const [newLinkTarget, setNewLinkTarget] = useState('Snapshot');
  const [newLinkCardinality, setNewLinkCardinality] = useState<'1:1' | '1:N' | 'N:M'>('1:N');
  const [newLinkLineage, setNewLinkLineage] = useState(false);
  const [newLinkAi, setNewLinkAi] = useState(true);
  const [newLinkAuth, setNewLinkAuth] = useState(false);
  const [newLinkDesc, setNewLinkDesc] = useState('');

  // Sliced relations
  const filteredLinks = linkTypes.filter(link => {
    if (activeFilter === 'Lineage') return link.isLineage;
    if (activeFilter === 'AI') return link.isAiVisible;
    if (activeFilter === 'Gov') return ['checked_by', 'produces', 'assigned_to'].some(kw => link.id.includes(kw));
    return true;
  });

  const activeLink = linkTypes.find(l => l.id === activeLinkId) || linkTypes[0];

  // Helper for nodes in relationship map
  const getObjIcon = (id: string, size = "h-4 w-4") => {
    switch (id) {
      case 'DataSource': return <Database className={`${size} text-blue-600`} />;
      case 'DataAsset': return <Table className={`${size} text-teal-600`} />;
      case 'Field': return <FileText className={`${size} text-indigo-600`} />;
      case 'SemanticAssertion': return <Compass className={`${size} text-purple-600`} />;
      case 'Evidence': return <ClipboardCopy className={`${size} text-violet-600`} />;
      case 'DataQualityRule': return <Layers className={`${size} text-emerald-600`} />;
      case 'DataIssue': return <ShieldAlert className={`${size} text-rose-600`} />;
      case 'GovernanceTask': return <Activity className={`${size} text-orange-600`} />;
      case 'Run': return <Play className={`${size} text-slate-500`} />;
      case 'Snapshot': return <FileCheck className={`${size} text-amber-600`} />;
      default: return <HelpCircle className={size} />;
    }
  };

  const handleCreateRelation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkId.trim()) return;

    const newLink: LinkType = {
      id: newLinkId.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
      nameCn: newLinkNameCn,
      sourceObjId: newLinkSource,
      targetObjId: newLinkTarget,
      direction: `${newLinkSource} → ${newLinkId} → ${newLinkTarget}`,
      cardinality: newLinkCardinality,
      isLineage: newLinkLineage,
      isAiVisible: newLinkAi,
      requiresAuth: newLinkAuth,
      description: newLinkDesc
    };

    if (linkTypes.some(l => l.id === newLink.id)) {
      alert("此 Link Type 关系标识已存在！");
      return;
    }

    onUpdateLinkTypes([...linkTypes, newLink]);
    setActiveLinkId(newLink.id);
    setIsAddingRelation(false);
    // Clear inputs
    setNewLinkId('');
    setNewLinkNameCn('');
    setNewLinkDesc('');
  };

  const handleDeleteRelation = (idToDelete: string) => {
    if (!window.confirm("确定要移除此 Link Type 关系绑定声明吗？")) return;
    const updated = linkTypes.filter(l => l.id !== idToDelete);
    onUpdateLinkTypes(updated);
    if (activeLinkId === idToDelete) {
      setActiveLinkId(updated[0]?.id || '');
    }
  };

  return (
    <div className="space-y-6" id="relation-workspace">
      
      {/* 头部控制过滤 */}
      <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-slate-900">DRKN Link Type 关系多层控制</h2>
          <p className="text-xs text-slate-500">
            Link Type 定义了对象实体类型（如 Field 与 SemanticAssertion）之间如何承载关联。
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filters Selectors */}
          <div className="flex p-0.5 bg-slate-100 rounded-lg text-xs" id="relation-filters">
            {(['All', 'Lineage', 'AI', 'Gov'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                  activeFilter === filter
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {filter === 'All' && '全部关系'}
                {filter === 'Lineage' && '血缘关系'}
                {filter === 'AI' && 'AI 可见关系'}
                {filter === 'Gov' && '治理关系'}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsAddingRelation(true)}
            disabled={!isEditingActive}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm transition-colors ${
              isEditingActive 
                ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer' 
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Plus className="h-4 w-4" />
            创建关系类型
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 左：关系列表 */}
        <div className="lg:col-span-3 bg-white border border-slate-205 rounded-xl p-4 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
            Link Type 关系大纲 (Filtered: {filteredLinks.length})
          </h3>

          <div className="space-y-1">
            {filteredLinks.map((link) => (
              <div
                key={link.id}
                onClick={() => setActiveLinkId(link.id)}
                className={`p-3 rounded-lg flex items-center justify-between text-left cursor-pointer transition-all border ${
                  link.id === activeLink?.id
                    ? 'bg-blue-50 border-blue-200 text-blue-900 shadow-xs font-semibold'
                    : 'hover:bg-slate-50 border-transparent text-slate-700'
                }`}
              >
                <div className="space-y-1">
                  <p className="text-xs font-mono font-bold leading-none">{link.id}</p>
                  <p className="text-[10px] text-slate-400 font-normal">{link.nameCn}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {link.isLineage && (
                    <span className="p-0.5 rounded bg-slate-100 text-slate-500" title="参与血缘">
                      <GitBranch className="h-3 w-3" />
                    </span>
                  )}
                  {link.isAiVisible && (
                    <span className="p-0.5 rounded bg-indigo-50 text-indigo-500" title="AI可见">
                      <Sparkles className="h-3 w-3" />
                    </span>
                  )}
                </div>
              </div>
            ))}
            {filteredLinks.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6">没有匹配该分类的关系类型</p>
            )}
          </div>
        </div>

        {/* 中：关系物理拓扑可视化 Canvas */}
        <div className="lg:col-span-6 bg-white border border-slate-205 rounded-xl p-6 shadow-sm flex flex-col justify-between min-h-[500px]">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-50 pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span>DRKN 包含与因果逻辑视图</span>
                <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-mono">Visual Graph</span>
              </h3>
              <p className="text-[11px] text-slate-400">蓝色为当前选中关系的连接路径</p>
            </div>

            {/* Visual Canvas containing high-fidelity visual representations */}
            <div className="border border-dashed border-slate-200 rounded-xl bg-slate-50/50 p-4 min-h-[380px] relative flex flex-col justify-around gap-6">
              
              {/* Node Pair 1 */}
              <div className="flex items-center justify-between max-w-md mx-auto w-full px-4">
                <div className="flex flex-col items-center gap-1">
                  <div className="h-10 w-28 bg-white border border-slate-200 rounded-lg flex items-center justify-center gap-2 shadow-xs">
                    {getObjIcon(activeLink?.sourceObjId)}
                    <span className="text-xs font-bold text-slate-800 font-mono truncate">{activeLink?.sourceObjId || 'Field'}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Source Object</span>
                </div>

                {/* Animated Directional Arrow */}
                <div className="flex-1 px-4 relative flex flex-col items-center">
                  <span className="text-[10px] font-bold text-blue-600 bg-white border border-blue-200 px-2 py-0.5 rounded-full shadow-xs mb-1">
                    {activeLink?.id || 'contains'}
                  </span>
                  <div className="w-full h-1 bg-blue-500 relative rounded">
                    <div className="absolute right-0 -top-1.5 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[12px] border-l-blue-500"></div>
                    <div className="absolute left-0 bottom-1.5 text-[9px] font-semibold text-slate-400">{activeLink?.cardinality || '1:N'}</div>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <div className="h-10 w-28 bg-white border border-slate-200 rounded-lg flex items-center justify-center gap-2 shadow-xs">
                    {getObjIcon(activeLink?.targetObjId)}
                    <span className="text-xs font-bold text-slate-800 font-mono truncate">{activeLink?.targetObjId || 'Snapshot'}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Target Object</span>
                </div>
              </div>

              {/* Comprehensive visual list of key relationships as interactive grid */}
              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100">
                <p className="text-[11px] text-slate-400 col-span-2 font-semibold uppercase tracking-wider">
                  本体规则拓扑图关系（点击高亮在右侧编辑）
                </p>
                {linkTypes.map((link) => (
                  <div
                    key={link.id}
                    onClick={() => setActiveLinkId(link.id)}
                    className={`p-2.5 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-all ${
                      link.id === activeLink?.id
                        ? 'bg-blue-50/50 border-blue-300 text-blue-900 font-bold'
                        : 'bg-white border-slate-100 hover:border-slate-350 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="p-1 bg-slate-50 rounded shrink-0">{getObjIcon(link.sourceObjId, "h-3.5 w-3.5")}</span>
                      <span className="font-mono text-[11px] truncate">{link.id}</span>
                    </div>
                    <ArrowRight className={`h-3 w-3 shrink-0 ${link.id === activeLink?.id ? 'text-blue-500' : 'text-slate-300'}`} />
                  </div>
                ))}
              </div>

            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>💡 提示: 1:N 关系代表父对象可挂靠多个子状态，从而不发生状态交叉。</span>
            {isEditingActive && (
              <span className="text-blue-600 font-semibold flex items-center gap-1">
                <span>草稿可编辑模型模式开启</span>
              </span>
            )}
          </div>
        </div>

        {/* 右：当前选中关系详情与约束 */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white border border-slate-205 rounded-xl p-5 shadow-sm space-y-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">
              选中 Link Type 详情
            </h3>

            {activeLink ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-800 font-mono">{activeLink.id}</h4>
                  <p className="text-xs font-medium text-slate-500">{activeLink.nameCn}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg text-xs leading-relaxed space-y-2 border border-slate-100">
                  <p className="text-slate-500">关系模型定位 & 口径释义:</p>
                  <p className="text-slate-700 font-normal">{activeLink.description}</p>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs py-1 border-b border-slate-50">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Database className="h-3.5 w-3.5 text-slate-400" />
                      源主体 (Source):
                    </span>
                    <button 
                      onClick={() => onNavigate('object_model', activeLink.sourceObjId)}
                      className="font-bold text-blue-600 hover:underline"
                    >
                      {activeLink.sourceObjId}
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-xs py-1 border-b border-slate-50">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Compass className="h-3.5 w-3.5 text-slate-400" />
                      目标主体 (Target):
                    </span>
                    <button 
                      onClick={() => onNavigate('object_model', activeLink.targetObjId)}
                      className="font-bold text-blue-600 hover:underline"
                    >
                      {activeLink.targetObjId}
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-xs py-1 border-b border-slate-50">
                    <span className="text-slate-500">基数配比 (Cardinality):</span>
                    <span className="font-semibold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px]">
                      {activeLink.cardinality}
                    </span>
                  </div>
                </div>

                {/* Badges/Toggles indicators */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                    <span className="text-slate-550 inline-flex items-center gap-1.5">
                      <GitBranch className="h-4 w-4 text-teal-650" />
                      参与分析血缘树？
                    </span>
                    <span className={`h-2.5 w-2.5 rounded-full ${activeLink.isLineage ? 'bg-emerald-500' : 'bg-slate-305'}`}></span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                    <span className="text-slate-550 inline-flex items-center gap-1.5">
                      <Eye className="h-4 w-4 text-indigo-650" />
                      AI 认知引擎可见？
                    </span>
                    <span className={`h-2.5 w-2.5 rounded-full ${activeLink.isAiVisible ? 'bg-emerald-500' : 'bg-slate-305'}`}></span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                    <span className="text-slate-550 inline-flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-amber-650" />
                      需要敏感权限策略？
                    </span>
                    <span className={`h-2.5 w-2.5 rounded-full ${activeLink.requiresAuth ? 'bg-emerald-500' : 'bg-slate-305'}`}></span>
                  </div>
                </div>

                {/* Interactive Delete if edit mode */}
                {isEditingActive && (
                  <button 
                    onClick={() => handleDeleteRelation(activeLink.id)}
                    className="w-full py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg border border-rose-200 text-xs font-semibold hover:text-rose-800 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    注销该 Link Type 声明
                  </button>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">暂未选择关系</p>
            )}
          </div>
        </div>

      </div>

      {/* Modal Dialog for Creator Relation */}
      {isAddingRelation && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" onClick={() => setIsAddingRelation(false)}></div>
          
          <div className="relative bg-white border border-slate-205 max-w-xl w-full mx-4 rounded-xl shadow-2xl overflow-hidden" id="add-relation-modal">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">定义全新的 DRKN 关系承载体 (Link Type)</h3>
              <button onClick={() => setIsAddingRelation(false)} className="text-slate-400 hover:text-slate-600 text-lg">&times;</button>
            </div>

            <form onSubmit={handleCreateRelation} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-705 block">关系唯一标识 (link_id)</label>
                  <input
                    type="text"
                    required
                    value={newLinkId}
                    onChange={(e) => setNewLinkId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                    placeholder="例如: maps_to, support_by"
                    className="w-full px-3 py-2 text-xs border border-slate-250 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-705 block">中文释义名</label>
                  <input
                    type="text"
                    required
                    value={newLinkNameCn}
                    onChange={(e) => setNewLinkNameCn(e.target.value)}
                    placeholder="例如: 智能归属映射至业务域"
                    className="w-full px-3 py-2 text-xs border border-slate-250 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Edge Node Dropdowns */}
              <div className="grid grid-cols-3 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-150 items-center">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block">源实体 (Source)</label>
                  <select
                    value={newLinkSource}
                    onChange={(e) => setNewLinkSource(e.target.value)}
                    className="w-full p-1.5 bg-white border border-slate-200 text-xs rounded"
                  >
                    <option value="DataSource">DataSource</option>
                    <option value="DataAsset">DataAsset</option>
                    <option value="Field">Field</option>
                    <option value="SemanticAssertion">SemanticAssertion</option>
                    <option value="Evidence">Evidence</option>
                    <option value="DataQualityRule">DataQualityRule</option>
                    <option value="DataIssue">DataIssue</option>
                    <option value="GovernanceTask">GovernanceTask</option>
                    <option value="Run">Run</option>
                    <option value="Snapshot">Snapshot</option>
                  </select>
                </div>

                <div className="text-center font-bold text-blue-600 text-xs pt-3">
                  ──────▶
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block">目标实体 (Target)</label>
                  <select
                    value={newLinkTarget}
                    onChange={(e) => setNewLinkTarget(e.target.value)}
                    className="w-full p-1.5 bg-white border border-slate-200 text-xs rounded"
                  >
                    <option value="DataSource">DataSource</option>
                    <option value="DataAsset">DataAsset</option>
                    <option value="Field">Field</option>
                    <option value="SemanticAssertion">SemanticAssertion</option>
                    <option value="Evidence">Evidence</option>
                    <option value="DataQualityRule">DataQualityRule</option>
                    <option value="DataIssue">DataIssue</option>
                    <option value="GovernanceTask">GovernanceTask</option>
                    <option value="Run">Run</option>
                    <option value="Snapshot">Snapshot</option>
                  </select>
                </div>
              </div>

              {/* Cardinality & Boolean configurations */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-705 block">基数对应模型</label>
                  <select
                    value={newLinkCardinality}
                    onChange={(e) => setNewLinkCardinality(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-250 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="1:1">1:1 (一对一绑定)</option>
                    <option value="1:N">1:N (包含附属关联)</option>
                    <option value="N:M">N:M (网状归属集合)</option>
                  </select>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-xs font-bold text-slate-705 block">关系特性开关</label>
                  <div className="space-y-1.5 text-xs">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={newLinkLineage}
                        onChange={(e) => setNewLinkLineage(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>计算此线路作为全局血缘树的一部分</span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={newLinkAi}
                        onChange={(e) => setNewLinkAi(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>允许 AI 执行推理时可见并使用此关系</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-705 block">关系口径解释 (说明)</label>
                <textarea
                  rows={3}
                  required
                  value={newLinkDesc}
                  onChange={(e) => setNewLinkDesc(e.target.value)}
                  placeholder="请输入对该实体间业务和逻辑关系的准确定义解释，避免大模型生成时解释混淆。"
                  className="w-full px-3 py-2 text-xs border border-slate-250 rounded-lg focus:outline-none focus:border-blue-500"
                ></textarea>
              </div>

              <div className="p-4 bg-blue-50 text-blue-900 border border-blue-100 rounded-lg text-[11px] leading-relaxed flex items-start gap-1.5">
                <Info className="h-4 w-4 text-blue-500 shrink-0" />
                <span>温馨提示: 在当前变更集新增 Link Type 不会破坏已经生产运行的快照。保存前可以在“变更与发布”中进行自动化干系影响预演。</span>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsAddingRelation(false)}
                  className="px-4 py-2 text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer shadow-xs"
                >
                  建立关联并提交缓存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
