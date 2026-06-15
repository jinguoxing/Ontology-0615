import React, { useState } from 'react';
import { ObjectType, Property } from '../types';
import { 
  Database, Table, FileText, Compass, ClipboardCopy, 
  Layers, ShieldAlert, Activity, Play, FileCheck, HelpCircle,
  Plus, Edit, Trash2, ArrowRight, CheckCircle2, ChevronRight,
  User, Sparkles, AlertCircle, Info, Check, Settings2
} from 'lucide-react';

interface ObjectModelProps {
  objectTypes: ObjectType[];
  selectedObjectId: string;
  onSelectObject: (id: string) => void;
  onNavigate: (view: string, targetId?: string) => void;
  isEditingActive: boolean;
  onUpdateObjectType: (updated: ObjectType) => void;
}

export default function ObjectModel({
  objectTypes,
  selectedObjectId,
  onSelectObject,
  onNavigate,
  isEditingActive,
  onUpdateObjectType
}: ObjectModelProps) {
  
  // Find the currently selected object structure
  const activeObj = objectTypes.find(o => o.id === selectedObjectId) || objectTypes[2]; // fallback to Field (idx 2)

  // Attribute editing drawer/form state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingProp, setEditingProp] = useState<Property | null>(null);
  const [drawerMode, setDrawerMode] = useState<'add' | 'edit'>('add');

  // Drawer fields
  const [propName, setPropName] = useState('');
  const [propType, setPropType] = useState('string');
  const [propSemantic, setPropSemantic] = useState('OntologyClass');
  const [propConfidence, setPropConfidence] = useState(0.95);
  const [propOwner, setPropOwner] = useState('数据治理团队');
  const [propDesc, setPropDesc] = useState('');

  // Group objects
  const groups = {
    "核心数据对象": objectTypes.filter(o => o.group === '核心数据对象'),
    "语义治理对象": objectTypes.filter(o => o.group === '语义治理对象'),
    "质量治理对象": objectTypes.filter(o => o.group === '质量治理对象'),
    "运行治理对象": objectTypes.filter(o => o.group === '运行治理对象')
  };

  const getObjectIcon = (id: string, className = "h-4 w-4") => {
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

  const handleOpenEditProp = (prop: Property) => {
    setDrawerMode('edit');
    setEditingProp(prop);
    setPropName(prop.name);
    setPropType(prop.dataType);
    setPropSemantic(prop.semanticType);
    setPropConfidence(prop.confidence);
    setPropOwner(prop.owner);
    setPropDesc(prop.description);
    setIsDrawerOpen(true);
  };

  const handleOpenAddProp = () => {
    setDrawerMode('add');
    setEditingProp(null);
    setPropName('');
    setPropType('string');
    setPropSemantic('OntologyClass');
    setPropConfidence(0.95);
    setPropOwner('数据治理团队');
    setPropDesc('');
    setIsDrawerOpen(true);
  };

  const handleSaveProperty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!propName.trim()) return;

    let updatedProps = [...activeObj.properties];

    const newProp: Property = {
      name: propName,
      dataType: propType,
      semanticType: propSemantic,
      confidence: Number(propConfidence),
      owner: propOwner,
      status: isEditingActive ? 'Draft' : 'Published',
      description: propDesc
    };

    if (drawerMode === 'edit' && editingProp) {
      updatedProps = updatedProps.map(p => p.name === editingProp.name ? newProp : p);
    } else {
      // Avoid duplicate names
      if (updatedProps.some(p => p.name === propName)) {
        alert("属性名称已存在！");
        return;
      }
      updatedProps.push(newProp);
    }

    onUpdateObjectType({
      ...activeObj,
      properties: updatedProps,
      status: 'Modified'
    });

    setIsDrawerOpen(false);
  };

  const handleDeleteProperty = (propNameToDelete: string) => {
    if (!window.confirm(`确定要移除属性 ${propNameToDelete} 吗？`)) return;

    const updatedProps = activeObj.properties.filter(p => p.name !== propNameToDelete);
    onUpdateObjectType({
      ...activeObj,
      properties: updatedProps,
      status: 'Modified'
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="object-workspace">
      
      {/* 左栏：Object Type 列表 */}
      <div className="lg:col-span-3 space-y-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">
            DRKN 治理对象分类结构
          </h3>
          
          <div className="space-y-4">
            {Object.entries(groups).map(([groupName, objects]) => (
              <div key={groupName} className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-500 block px-1">
                  {groupName}
                </span>
                <div className="space-y-1">
                  {objects.map((obj) => (
                    <div
                      key={obj.id}
                      onClick={() => onSelectObject(obj.id)}
                      className={`w-full p-2.5 rounded-lg flex items-center justify-between text-left cursor-pointer transition-all ${
                        obj.id === activeObj.id
                          ? 'bg-blue-50/75 border border-blue-200 shadow-sm'
                          : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {getObjectIcon(obj.id)}
                        <div>
                          <p className="text-xs font-bold text-slate-800">{obj.id}</p>
                          <p className="text-[10px] text-slate-400">{obj.nameCn}</p>
                        </div>
                      </div>

                      <div className="text-right flex items-center gap-1.5">
                        <span className="text-[9px] font-medium bg-slate-100 text-slate-500 px-1 rounded">
                          {obj.instanceCount > 1000 ? `${(obj.instanceCount / 1000).toFixed(1)}k` : obj.instanceCount}
                        </span>
                        {obj.status === 'Modified' && (
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-600 inline-block animate-pulse" title="已缓存未发布的变更"></span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 隔离属性规则警告 */}
        <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl text-xs space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-amber-800">
            <AlertCircle className="h-4 w-4" />
            <span>语义关系治理规则</span>
          </div>
          <p className="text-slate-600 leading-normal text-[11px]">
            DRKN 的关系不同于一般 ER 关系：关系一端通常绑定到带有 `semantic_type` 的“对象语义类别”，而不是直接跟物理主外键硬连接。从而实现“与物理结构解耦的逻辑数据语义”。
          </p>
        </div>
      </div>

      {/* 中间栏：对象模型详情 */}
      <div className="lg:col-span-6 space-y-6">
        
        {/* 对象元信息头部 */}
        <div className="bg-white border border-slate-205 rounded-xl p-6 shadow-sm space-y-4 relative overflow-hidden">
          {activeObj.status === 'Modified' && (
            <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl">
              变更待发布 (Draft)
            </div>
          )}

          <div className="flex items-start gap-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              {getObjectIcon(activeObj.id, "h-8 w-8")}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-slate-900 font-mono">{activeObj.id}</h2>
                <span className="text-sm font-medium text-slate-500">{activeObj.nameCn}</span>
              </div>
              <p className="text-xs text-slate-500">
                所属治理域: <b className="text-slate-700">DRKN</b> | 主责接口团队: <b className="text-slate-705">{activeObj.owner}</b>
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed font-normal">
            <b>定位释义：</b>{activeObj.description}
          </p>

          {/* 状态生命周期 */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <span>状态生命周期状态机流程</span>
              <span className="h-1 bg-slate-100 flex-1 ml-2 rounded"></span>
            </h4>
            <div className="flex flex-wrap items-center gap-1 text-[11px]">
              {activeObj.lifecycle.map((state, idx) => (
                <React.Fragment key={state}>
                  <div className={`px-2 py-1 rounded-sm border font-medium ${
                    idx === 2 
                      ? 'bg-blue-600/90 text-white border-blue-600 shadow-xs' 
                      : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}>
                    {state}
                  </div>
                  {idx < activeObj.lifecycle.length - 1 && (
                    <ChevronRight className="h-3.5 w-3.5 text-slate-350" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* 属性面板 & 配置 */}
        <div className="bg-white border border-slate-205 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-slate-900">核心属性模型管理</h3>
              <p className="text-xs text-slate-500">仅罗列该本体类型承载的顶层抽象属性定义。</p>
            </div>
            
            <button
              onClick={handleOpenAddProp}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors ${
                isEditingActive 
                  ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
              disabled={!isEditingActive}
            >
              <Plus className="h-3.5 w-3.5" />
              新增本体属性
            </button>
          </div>

          {!isEditingActive && (
            <div className="p-2.5 bg-blue-50/50 text-blue-800 text-xs rounded border border-blue-100 flex items-center gap-1.5">
              <Info className="h-4 w-4 text-blue-600 shrink-0" />
              <span>当前系统正在正常线上版本 (v1.3.0) 运行，如果需要新增或编辑属性属性，请先在菜单中<b>“新建变更集”</b>开启编辑保护。</span>
            </div>
          )}

          {/* Properties Table */}
          <div className="border border-slate-100 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs bg-white">
              <thead>
                <tr className="bg-slate-50 text-slate-500/80 uppercase font-bold tracking-widest text-[9px] border-b border-slate-100">
                  <th className="py-2.5 px-3">属性名称</th>
                  <th className="py-2.5 px-3">物理类型</th>
                  <th className="py-2.5 px-3">本体映射语义</th>
                  <th className="py-2.5 px-3">置信阀</th>
                  <th className="py-2.5 px-3">归属者</th>
                  <th className="py-2.5 px-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeObj.properties.map((prop) => (
                  <tr key={prop.name} className="hover:bg-slate-50/40 font-medium">
                    <td className="py-2.5 px-3 font-semibold text-slate-800 group relative">
                      <span className="font-mono">{prop.name}</span>
                      {prop.status === 'Draft' && (
                        <span className="ml-1 text-[9px] bg-amber-50 text-amber-700 px-1 py-0.2 rounded">Draft</span>
                      )}
                      <p className="text-[10px] font-normal text-slate-400 mt-0.5 max-w-xs">{prop.description}</p>
                    </td>
                    <td className="py-2.5 px-3 text-slate-550 font-mono">{prop.dataType}</td>
                    <td className="py-2.5 px-3">
                      <span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded text-[10px] font-mono border border-purple-100 inline-block">
                        {prop.semanticType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{(prop.confidence * 100).toFixed(0)}%</td>
                    <td className="py-2.5 px-3 text-slate-500">{prop.owner.split(' ')[0]}</td>
                    <td className="py-2.5 px-3 text-right space-x-1">
                      <button 
                        onClick={() => handleOpenEditProp(prop)}
                        className={`text-slate-600 hover:text-blue-600 p-1 rounded inline-block ${
                          isEditingActive ? 'cursor-pointer hover:bg-slate-100' : 'opacity-40 cursor-not-allowed'
                        }`}
                        title="编辑此属性项"
                        disabled={!isEditingActive}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteProperty(prop.name)}
                        className={`text-slate-400 hover:text-rose-600 p-1 rounded inline-block ${
                          isEditingActive ? 'cursor-pointer hover:bg-slate-100' : 'opacity-40 cursor-not-allowed'
                        }`}
                        title="移除此属性"
                        disabled={!isEditingActive}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 右栏：能力绑定与引用关系概要 */}
      <div className="lg:col-span-3 space-y-6">
        
        {/* 绑定能力摘要 */}
        <div className="bg-white border border-slate-205 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
            绑定语义能力
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">关联关系种数 (Link Type)：</span>
              <span className="font-bold text-slate-800">4 种</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">绑定服务计算 (Function)：</span>
              <span className="font-bold text-blue-600">3 个</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">变更激发处理器 (Action)：</span>
              <span className="font-bold text-purple-600">2 个</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">参与业务流 (Workflow)：</span>
              <span className="font-bold text-indigo-600">2 个</span>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">引用下游链路</p>
              
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-slate-600 p-1.5 bg-slate-50 rounded">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <span>被 DKN Mapping 引用：<b>2 处</b></span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-600 p-1.5 bg-slate-50 rounded">
                  <Settings2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  <span>被 AI 自动纠错环境使用</span>
                </div>
              </div>
            </div>

            {/* 一键跳转操作 */}
            <div className="pt-2 grid grid-cols-2 gap-2">
              <button 
                onClick={() => onNavigate('relation_model')}
                className="py-1.5 bg-slate-50 border border-slate-205 text-[10px] font-bold text-slate-650 hover:bg-slate-100 text-center rounded-lg transition-colors cursor-pointer"
              >
                查看关系拓扑
              </button>
              <button 
                onClick={() => onNavigate('capability_binding', activeObj.id)}
                className="py-1.5 bg-blue-50 border border-blue-150 text-[10px] font-bold text-blue-700 hover:bg-blue-100 text-center rounded-lg transition-colors cursor-pointer"
              >
                配置计算绑
              </button>
            </div>
          </div>
        </div>

        {/* 归属团队卡片 */}
        <div className="bg-slate-900 text-slate-100 rounded-xl p-5 shadow-sm space-y-3 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">DRKN 精英治理范式</p>
          <p className="text-xs text-slate-300 leading-normal">
            在 Palantir 类似架构中，<b>对象模型</b>是一条生命的主线。它不仅规范属性，更让计算（Function）变为面向对象的安全自洽实体，将复杂数据底层封装，给 AI 提供可复用的一层认知土壤。
          </p>
          <div className="flex items-center gap-2 pt-1.5">
            <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white uppercase">
              GP
            </div>
            <div className="text-[11px]">
              <p className="font-semibold text-slate-100">数据治理架构组代表人</p>
              <p className="text-slate-400">Owner: {activeObj.owner}</p>
            </div>
          </div>
        </div>

      </div>

      {/* 侧滑编辑/新增属性 Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end" id="drawer-container">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" onClick={() => setIsDrawerOpen(false)}></div>
          
          <div className="relative w-full max-w-md bg-white border-l border-slate-200 h-full shadow-2xl flex flex-col justify-between" id="drawer-body">
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-slate-900">
                  {drawerMode === 'add' ? `为 ${activeObj.id} 新增本体属性` : `编辑 ${editingProp?.name} 属性`}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  属性将直接挂接至当前活跃变更集中，经过一键语法校验后才能对下游 DKN 系统生效。
                </p>
              </div>

              <form onSubmit={handleSaveProperty} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-705 block">属性物理名称 (英文字段名)</label>
                  <input
                    type="text"
                    required
                    disabled={drawerMode === 'edit'}
                    value={propName}
                    onChange={(e) => setPropName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="例如: confidence_value"
                    className="w-full px-3 py-2 text-xs border border-slate-250 rounded-lg focus:outline-none focus:border-blue-500 font-mono disabled:bg-slate-100 disabled:text-slate-550"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-705 block">物理存储类型</label>
                    <select
                      value={propType}
                      onChange={(e) => setPropType(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-250 rounded-lg focus:outline-none focus:border-blue-500"
                    >
                      <option value="string">String (文本)</option>
                      <option value="long">Long (整型)</option>
                      <option value="double">Double (高精浮点)</option>
                      <option value="datetime">Datetime (日期时戳)</option>
                      <option value="text">Text (大文本块)</option>
                      <option value="boolean">Boolean (布尔)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-705 block">置信审核门槛</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.0"
                      max="1.0"
                      required
                      value={propConfidence}
                      onChange={(e) => setPropConfidence(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-slate-250 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-705 block">本体语义映射绑定类别</label>
                  <input
                    type="text"
                    required
                    value={propSemantic}
                    onChange={(e) => setPropSemantic(e.target.value)}
                    placeholder="例如: IDCard, MobileNo"
                    className="w-full px-3 py-2 text-xs border border-slate-250 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-450 leading-relaxed font-normal">
                    建立与领域本体术语的一致关联，控制下游 AI 工作台输出时的展示类型映射。
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-705 block">业务口径说明 & 负责人</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      value={propOwner}
                      onChange={(e) => setPropOwner(e.target.value)}
                      placeholder="数据治理团队"
                      className="px-3 py-2 text-xs border border-slate-250 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                    <span className="flex items-center text-slate-400 gap-1.5 text-xs bg-slate-50 border border-slate-100 rounded px-2">
                      <User className="h-3.5 w-3.5" />
                      主签 Owner
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-705 block">描述 (口径释义)</label>
                  <textarea
                    rows={4}
                    required
                    value={propDesc}
                    onChange={(e) => setPropDesc(e.target.value)}
                    placeholder="精确说明该属性代表的数据口径，其在语义层中被计算和传播的意义。"
                    className="w-full px-3 py-2 text-xs border border-slate-250 rounded-lg focus:outline-none focus:border-blue-500"
                  ></textarea>
                </div>
                
                <button type="submit" className="hidden" id="drawer-form-submit-trigger"></button>
              </form>
            </div>

            {/* Drawer 底部控制 */}
            <div className="p-4 border-t border-slate-150 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="px-4 py-2 text-xs font-semibold border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 rounded-lg cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  const btn = document.getElementById('drawer-form-submit-trigger');
                  if (btn) btn.click();
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer shadow-xs"
              >
                保存并加入变更集
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
