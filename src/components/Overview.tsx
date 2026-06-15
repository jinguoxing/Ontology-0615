import React from 'react';
import { 
  Box, Link as LinkIcon, FunctionSquare, Play, 
  GitMerge, Shield, CheckCircle2, Circle, Check,
  Target, AlertTriangle, Info, Bell, Search,
  Settings, ChevronRight, RefreshCw, LayoutGrid, Star,
  Database, FileCode, Beaker, LayoutTemplate 
} from 'lucide-react';

interface OverviewProps {
  onNavigate: (view: string, targetId?: string) => void;
  objectTypes?: any[];
  linkTypes?: any[];
  changeSets?: any[];
  validationItems?: any[];
  onCreateChangeSet?: () => void;
  onRunValidation?: () => void;
  isLocked?: boolean;
}

export default function Overview({ onNavigate, onCreateChangeSet, onRunValidation }: OverviewProps) {
  const tabs = [
    '模型总览', '对象模型', '关系模型', '能力 (Function)', '动作 (Action)', 
    '流程 (Workflow)', '权限策略', '版本与发布', '变更集'
  ];

  const Node = ({ title, subtitle, icon: Icon, color, className }: { title: string, subtitle: string, icon?: any, color: string, className?: string }) => {
    const colorClasses: Record<string, string> = {
      blue: 'bg-[#f0f5ff] text-[#2563eb] border-[#dbeafe]',
      green: 'bg-[#f0fdf4] text-[#16a34a] border-[#dcfce7]',
      purple: 'bg-[#faf5ff] text-[#9333ea] border-[#f3e8ff]',
      teal: 'bg-[#f0fdfa] text-[#0d9488] border-[#ccfbf1]',
      orange: 'bg-[#fff7ed] text-[#ea580c] border-[#ffedd5]',
      red: 'bg-[#fef2f2] text-[#dc2626] border-[#fee2e2]',
    };

    return (
      <div className={`rounded-xl px-4 py-3 flex flex-col items-center justify-center text-center z-10 w-[140px] shadow-sm border ${colorClasses[color]} bg-white ${className}`}>
        {Icon && <Icon className={`w-5 h-5 mb-1.5 ${colorClasses[color].split(' ')[1]}`} />}
        <div className="text-[13px] font-bold font-sans tracking-tight text-slate-800">{title}</div>
        <div className="text-[11px] font-medium text-slate-500 mt-0.5">{subtitle}</div>
      </div>
    );
  };

  return (
    <div className="min-h-full font-sans bg-transparent" id="overview-view">
      
      {/* 面包屑 */}
      <div className="flex items-center gap-2 text-[13px] text-slate-500 mb-6">
        <div className="w-5 h-5 flex items-center justify-center bg-slate-200/50 rounded-md">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        </div>
        <span className="hover:text-slate-800 cursor-pointer">管理中心</span>
        <span className="text-slate-300">/</span>
        <span className="hover:text-slate-800 cursor-pointer">本体管理</span>
        <span className="text-slate-300">/</span>
        <span className="font-bold text-slate-800">DRKN 本体管理</span>
      </div>

      {/* 标题和上下文信息 */}
      <div className="flex flex-col md:flex-row md:items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">模型总览</h1>
            <Star className="w-5 h-5 text-slate-400 stroke-[1.5]" />
          </div>
          <p className="text-sm text-slate-500 mt-2 font-medium">
            查看 DRKN 数据语义治理本体的结构、健康状态与发布情况
          </p>
        </div>
        
        <div className="flex flex-col items-end gap-4 mt-4 md:mt-0">
          <div className="flex gap-2">
            <div className="border border-slate-200 rounded-lg px-3 py-1.5 bg-white flex items-center gap-2 shadow-sm">
               <Database className="w-3.5 h-3.5 text-blue-500" />
               <span className="text-[11px] text-slate-400 font-medium">模型域</span>
               <span className="text-xs font-bold text-slate-700">DRKN 数据语义治理</span>
            </div>
            <div className="border border-slate-200 rounded-lg px-3 py-1.5 bg-white flex items-center gap-2 shadow-sm">
               <LayoutTemplate className="w-3.5 h-3.5 text-blue-500" />
               <span className="text-[11px] text-slate-400 font-medium">场景</span>
               <span className="text-xs font-bold text-slate-700">默认数据治理模型</span>
            </div>
            <div className="border border-slate-200 rounded-lg px-3 py-1.5 bg-white flex items-center gap-2 shadow-sm cursor-pointer hover:bg-slate-50">
               <FileCode className="w-3.5 h-3.5 text-blue-500" />
               <span className="text-[11px] text-slate-400 font-medium">版本</span>
               <span className="text-xs font-bold text-slate-700">v1.3.0 ˇ</span>
            </div>
            <div className="border border-blue-200 rounded-lg px-3 py-1.5 bg-blue-50 flex items-center gap-2 shadow-sm cursor-pointer hover:bg-blue-100/50">
               <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
               <span className="text-[11px] text-blue-600/70 font-medium">状态</span>
               <span className="text-xs font-bold text-blue-700">已发布 ˇ</span>
            </div>
          </div>
          <div className="flex gap-3">
             <button 
               onClick={onCreateChangeSet}
               className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
             >
               + 新建变更集
             </button>
             <button 
               onClick={onRunValidation}
               className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
             >
               <CheckCircle2 className="w-4 h-4 text-slate-400" /> 校验模型
             </button>
             <button className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1.5">
               <GitMerge className="w-4 h-4 text-slate-400" /> 影响分析
             </button>
             <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-all shadow-sm cursor-pointer border border-blue-600">
               发布新版本
             </button>
          </div>
        </div>
      </div>

      {/* 顶部 Tabs */}
      <div className="flex gap-8 mb-6 border-b border-slate-200">
        {tabs.map((tab) => (
          <div 
            key={tab}
            className={`pb-3 text-sm font-bold cursor-pointer transition-colors ${
              tab === '模型总览' 
                ? 'text-blue-600 border-b-2 border-blue-600 -mb-[1px]' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab}
          </div>
        ))}
      </div>

      {/* 主体三列工作区 */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* 左栏：核心对象结构 */}
        <div className="md:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
              核心对象结构 <Info className="w-4 h-4 text-slate-400 cursor-pointer" />
            </h2>
            <div className="text-xs font-bold text-blue-600 cursor-pointer hover:underline flex items-center gap-0.5">
              查看完整图谱 <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
          
          <div className="flex-1 min-h-[500px] relative mt-2 bg-[#fafbfc] rounded-xl border border-slate-100 overflow-hidden">
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
              <defs>
                <marker id="arrowhead-blue" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <polygon points="0 0, 6 3, 0 6" fill="#60a5fa" />
                </marker>
              </defs>
              
              {/* Vertical Path: DataSource -> DataAsset -> Field */}
              <line x1="50%" y1="12%" x2="50%" y2="28%" stroke="#93c5fd" strokeWidth="1.5" markerEnd="url(#arrowhead-blue)" />
              <text x="51%" y="22%" fill="#3b82f6" fontSize="10" fontWeight="bold">contains</text>

              <line x1="50%" y1="36%" x2="50%" y2="48%" stroke="#93c5fd" strokeWidth="1.5" markerEnd="url(#arrowhead-blue)" />
              <text x="51%" y="43%" fill="#3b82f6" fontSize="10" fontWeight="bold">contains</text>

              {/* Branch Left: Field -> SemanticAssertion */}
              <path d="M 50% 56% C 50% 64%, 25% 61%, 25% 69%" fill="none" stroke="#93c5fd" strokeWidth="1.5" markerEnd="url(#arrowhead-blue)" />
              <text x="32%" y="62%" fill="#3b82f6" fontSize="10" fontWeight="bold">has_assertion</text>

              {/* Branch Right: Field -> DataQualityRule */}
              <path d="M 50% 56% C 50% 64%, 75% 61%, 75% 69%" fill="none" stroke="#93c5fd" strokeWidth="1.5" markerEnd="url(#arrowhead-blue)" />
              <text x="60%" y="62%" fill="#3b82f6" fontSize="10" fontWeight="bold">checked_by</text>

              {/* Path: SemanticAssertion -> Evidence */}
              <line x1="25%" y1="77%" x2="25%" y2="85%" stroke="#93c5fd" strokeWidth="1.5" markerEnd="url(#arrowhead-blue)" />
              <text x="26%" y="82%" fill="#3b82f6" fontSize="10" fontWeight="bold">supported_by</text>

              {/* Path: DataQualityRule -> DataIssue */}
              <line x1="75%" y1="77%" x2="75%" y2="85%" stroke="#93c5fd" strokeWidth="1.5" markerEnd="url(#arrowhead-blue)" />
              <text x="76%" y="82%" fill="#3b82f6" fontSize="10" fontWeight="bold">produces</text>

              {/* Path: Evidence -> GovernanceTask */}
              <path d="M 33% 89% C 40% 89%, 45% 82%, 50% 82%" fill="none" stroke="#93c5fd" strokeWidth="1.5" markerEnd="url(#arrowhead-blue)" strokeDasharray="4 2" />
              
              {/* Path: DataIssue -> GovernanceTask */}
              <path d="M 67% 89% C 60% 89%, 55% 82%, 50% 82%" fill="none" stroke="#93c5fd" strokeWidth="1.5" markerEnd="url(#arrowhead-blue)" strokeDasharray="4 2" />

              <text x="36%" y="87%" fill="#3b82f6" fontSize="10" fontWeight="bold">assigned_to</text>

              {/* Bottom: Run -> Snapshot */}
              <line x1="30%" y1="96%" x2="60%" y2="96%" stroke="#93c5fd" strokeWidth="1.5" markerEnd="url(#arrowhead-blue)" />
              <text x="40%" y="95%" fill="#3b82f6" fontSize="10" fontWeight="bold">generates</text>
            </svg>

            {/* Nodes */}
            <Node title="DataSource" subtitle="数据源" icon={Database} color="blue" className="absolute left-1/2 top-[8%] -translate-x-1/2" />
            <Node title="DataAsset" subtitle="数据资产" icon={Box} color="blue" className="absolute left-1/2 top-[28%] -translate-x-1/2" />
            <Node title="Field" subtitle="字段" icon={LayoutGrid} color="blue" className="absolute left-1/2 top-[48%] -translate-x-1/2" />
            
            <Node title="SemanticAssertion" subtitle="语义断言" icon={Shield} color="blue" className="absolute left-1/4 top-[69%] -translate-x-1/2" />
            <Node title="DataQualityRule" subtitle="质量规则" icon={CheckCircle2} color="blue" className="absolute left-3/4 top-[69%] -translate-x-1/2" />
            
            <Node title="Evidence" subtitle="证据" icon={FileCode} color="blue" className="absolute left-1/4 top-[85%] -translate-x-1/2" />
            <Node title="DataIssue" subtitle="数据问题" icon={AlertTriangle} color="red" className="absolute left-3/4 top-[85%] -translate-x-1/2" />
            
            <Node title="GovernanceTask" subtitle="治理任务" icon={Target} color="blue" className="absolute left-1/2 top-[76%] -translate-x-1/2" />

            <Node title="Run" subtitle="运行记录" icon={Play} color="blue" className="absolute left-1/4 top-[96%] -translate-x-1/2 -translate-y-1/2" />
            <Node title="Snapshot" subtitle="快照" icon={Box} color="blue" className="absolute left-[65%] top-[96%] -translate-y-1/2" />
          </div>
        </div>

        {/* 中栏：模型健康状态 */}
        <div className="md:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
              模型健康状态 <Info className="w-4 h-4 text-slate-400 cursor-pointer" />
            </h2>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="border border-slate-100 bg-slate-50 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600"><Box className="w-5 h-5" /></div>
              <div><div className="text-[11px] text-slate-500 font-bold mb-0.5">Object Type</div><div className="text-xl font-black text-slate-800">10</div></div>
            </div>
            <div className="border border-slate-100 bg-slate-50 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600"><LinkIcon className="w-5 h-5" /></div>
              <div><div className="text-[11px] text-slate-500 font-bold mb-0.5">Link Type</div><div className="text-xl font-black text-slate-800">18</div></div>
            </div>
            <div className="border border-slate-100 bg-slate-50 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold italic">fx</div>
              <div><div className="text-[11px] text-slate-500 font-bold mb-0.5">Function</div><div className="text-xl font-black text-slate-800">12</div></div>
            </div>
            <div className="border border-slate-100 bg-slate-50 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600"><Play className="w-5 h-5" /></div>
              <div><div className="text-[11px] text-slate-500 font-bold mb-0.5">Action</div><div className="text-xl font-black text-slate-800">16</div></div>
            </div>
            <div className="border border-slate-100 bg-slate-50 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600"><GitMerge className="w-5 h-5" /></div>
              <div><div className="text-[11px] text-slate-500 font-bold mb-0.5">Workflow</div><div className="text-xl font-black text-slate-800">6</div></div>
            </div>
            <div className="border border-slate-100 bg-slate-50 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600"><Shield className="w-5 h-5" /></div>
              <div><div className="text-[11px] text-slate-500 font-bold mb-0.5">校验结果</div><div className="text-[15px] font-black tracking-tight"><span className="text-emerald-500">0</span> <span className="text-slate-400 font-medium text-[11px]">错误</span> / <span className="text-orange-500">2</span> <span className="text-slate-400 font-medium text-[11px]">警告</span></div></div>
            </div>
            <div className="border border-slate-100 bg-slate-50 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600"><Target className="w-5 h-5" /></div>
              <div><div className="text-[11px] text-slate-500 font-bold mb-0.5">AI 使用场景</div><div className="text-xl font-black text-slate-800">3</div></div>
            </div>
            <div className="border border-slate-100 bg-slate-50 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600"><Settings className="w-5 h-5" /></div>
              <div><div className="text-[11px] text-slate-500 font-bold mb-0.5">知识网络视图</div><div className="text-xl font-black text-slate-800">5</div></div>
            </div>
          </div>

          <div className="mt-auto border border-slate-100 bg-slate-50 rounded-xl p-5 flex items-center gap-6">
            <div className="relative w-[72px] h-[72px] shrink-0">
               <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                 <circle cx="50" cy="50" r="42" stroke="#e2e8f0" strokeWidth="8" fill="none" />
                 <circle cx="50" cy="50" r="42" stroke="#10b981" strokeWidth="8" fill="none" strokeDasharray="264" strokeDashoffset={264 - (264 * 87) / 100} strokeLinecap="round" />
               </svg>
               <div className="absolute inset-0 flex flex-col items-center justify-center">
                 <div className="text-2xl font-black text-slate-800 leading-none">87</div>
                 <div className="text-[10px] font-bold text-slate-500 mt-0.5">良好</div>
               </div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center text-xs"><span className="text-slate-500 w-20">结构完整性</span><div className="flex-1 bg-slate-200 h-1.5 rounded-full overflow-hidden mx-3"><div className="bg-emerald-500 h-full w-[92%]"></div></div><span className="font-bold text-slate-700">92%</span></div>
              <div className="flex items-center text-xs"><span className="text-slate-500 w-20">一致性</span><div className="flex-1 bg-slate-200 h-1.5 rounded-full overflow-hidden mx-3"><div className="bg-emerald-500 h-full w-[88%]"></div></div><span className="font-bold text-slate-700">88%</span></div>
              <div className="flex items-center text-xs"><span className="text-slate-500 w-20">可用性</span><div className="flex-1 bg-slate-200 h-1.5 rounded-full overflow-hidden mx-3"><div className="bg-emerald-500 h-full w-[85%]"></div></div><span className="font-bold text-slate-700">85%</span></div>
              <div className="flex items-center text-xs"><span className="text-slate-500 w-20">可维护性</span><div className="flex-1 bg-slate-200 h-1.5 rounded-full overflow-hidden mx-3"><div className="bg-emerald-500 h-full w-[83%]"></div></div><span className="font-bold text-slate-700">83%</span></div>
            </div>
          </div>
        </div>

        {/* 右栏：待处理事项与风险 */}
        <div className="md:col-span-3 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
              待处理事项与风险 <Info className="w-4 h-4 text-slate-400 cursor-pointer" />
            </h2>
          </div>

          <div className="space-y-3 flex-1">
             <div className="flex items-center justify-between p-4 rounded-xl border border-rose-100 bg-rose-50 cursor-pointer hover:bg-rose-100/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-500"><Box className="w-4 h-4" /></div>
                  <div>
                    <div className="text-[13px] font-bold text-slate-800 tracking-tight">2 个 Object Type</div>
                    <div className="text-[11px] text-slate-500">有未发布变更</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-rose-600 font-black text-lg">2 <ChevronRight className="w-4 h-4" /></div>
             </div>

             <div className="flex items-center justify-between p-4 rounded-xl border border-orange-100 bg-orange-50 cursor-pointer hover:bg-orange-100/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-500"><GitMerge className="w-4 h-4" /></div>
                  <div>
                    <div className="text-[13px] font-bold text-slate-800 tracking-tight">1 个 Workflow</div>
                    <div className="text-[11px] text-slate-500">受影响</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-orange-600 font-black text-lg">1 <ChevronRight className="w-4 h-4" /></div>
             </div>

             <div className="flex items-center justify-between p-4 rounded-xl border border-rose-100 bg-rose-50 cursor-pointer hover:bg-rose-100/50">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 font-bold italic">fx</div>
                  <div>
                    <div className="text-[13px] font-bold text-slate-800 tracking-tight">3 个 Function</div>
                    <div className="text-[11px] text-slate-500">需要重新测试</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-rose-600 font-black text-lg">3 <ChevronRight className="w-4 h-4" /></div>
             </div>

             <div className="flex items-center justify-between p-4 rounded-xl border border-orange-100 bg-orange-50 cursor-pointer hover:bg-orange-100/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-500"><Shield className="w-4 h-4" /></div>
                  <div>
                    <div className="text-[13px] font-bold text-slate-800 tracking-tight">1 个 AI 场景</div>
                    <div className="text-[11px] text-slate-500">需要重新校验</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-orange-600 font-black text-lg">1 <ChevronRight className="w-4 h-4" /></div>
             </div>
          </div>

          {/* Bottom simple stats */}
          <div className="mt-6 pt-5 border-t border-slate-100 space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 font-medium">最近一次发布</span>
              <div className="text-right">
                <div className="font-bold text-slate-800">2 天前</div>
                <div className="text-[10px] text-slate-400">v1.3.0</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 font-medium">发布风险等级</span>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-100 text-orange-700 rounded-md font-bold text-[12px]">
                 <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div> 中 <ChevronRight className="w-3.5 h-3.5 -ml-0.5" />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 底部两列图表/记录区 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pb-12">
        
        {/* 最近变更 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-extrabold text-slate-900">最近变更</h2>
            <div className="text-xs font-bold text-blue-600 cursor-pointer hover:underline flex items-center gap-0.5">
              查看全部 <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400">
                  <th className="py-3 px-2">变更项</th>
                  <th className="py-3 px-2 w-16">类型</th>
                  <th className="py-3 px-2">变更集</th>
                  <th className="py-3 px-2 w-20">提交人</th>
                  <th className="py-3 px-2 w-24">时间</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2 font-medium text-slate-700">
                      <LayoutGrid className="w-4 h-4 text-emerald-500" />
                      调整 Field 属性定义
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded text-[10px] font-bold">更新</span>
                  </td>
                  <td className="py-3 px-2"><span className="text-blue-600 font-medium hover:underline cursor-pointer text-xs">CS-2025-05-26-001</span></td>
                  <td className="py-3 px-2 text-slate-500">张伟</td>
                  <td className="py-3 px-2 text-slate-400 text-xs">1 小时前</td>
                </tr>
                <tr className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2 font-medium text-slate-700">
                      <FunctionSquare className="w-4 h-4 text-blue-500" />
                      新增 detectForeignKey Function
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[10px] font-bold">新增</span>
                  </td>
                  <td className="py-3 px-2"><span className="text-blue-600 font-medium hover:underline cursor-pointer text-xs">CS-2025-05-25-003</span></td>
                  <td className="py-3 px-2 text-slate-500">李明</td>
                  <td className="py-3 px-2 text-slate-400 text-xs">5 小时前</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2 font-medium text-slate-700">
                      <GitMerge className="w-4 h-4 text-orange-500" />
                      修改 SemanticReviewWorkflow 条件阈值
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-bold">更新</span>
                  </td>
                  <td className="py-3 px-2"><span className="text-blue-600 font-medium hover:underline cursor-pointer text-xs">CS-2025-05-24-002</span></td>
                  <td className="py-3 px-2 text-slate-500">王芳</td>
                  <td className="py-3 px-2 text-slate-400 text-xs">昨天 16:30</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 发布记录 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-extrabold text-slate-900">发布记录</h2>
            <div className="text-xs font-bold text-blue-600 cursor-pointer hover:underline flex items-center gap-0.5">
              查看全部 <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400">
                  <th className="py-3 px-2 w-20">版本</th>
                  <th className="py-3 px-2 w-20">状态</th>
                  <th className="py-3 px-2">发布时间</th>
                  <th className="py-3 px-2">发布人</th>
                  <th className="py-3 px-2">说明</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-2 font-bold text-slate-800">v1.3.0</td>
                  <td className="py-3 px-2">
                    <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-bold">已发布</span>
                  </td>
                  <td className="py-3 px-2 text-slate-500 text-xs">2025-05-24 10:30</td>
                  <td className="py-3 px-2 text-slate-500 text-xs">系统管理员</td>
                  <td className="py-3 px-2 text-slate-500 text-xs font-medium truncate max-w-[150px]">优化语义断言校验逻辑</td>
                </tr>
                <tr className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-2 font-bold text-slate-800">v1.2.1</td>
                  <td className="py-3 px-2">
                    <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-bold">已发布</span>
                  </td>
                  <td className="py-3 px-2 text-slate-500 text-xs">2025-05-18 09:15</td>
                  <td className="py-3 px-2 text-slate-500 text-xs">系统管理员</td>
                  <td className="py-3 px-2 text-slate-500 text-xs font-medium truncate max-w-[150px]">新增质量规则推荐能力</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-2 font-bold text-slate-500">v1.2.0</td>
                  <td className="py-3 px-2">
                    <span className="bg-slate-100 text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded text-[10px] font-bold">已归档</span>
                  </td>
                  <td className="py-3 px-2 text-slate-500 text-xs">2025-05-10 14:20</td>
                  <td className="py-3 px-2 text-slate-500 text-xs">系统管理员</td>
                  <td className="py-3 px-2 text-slate-500 text-xs font-medium truncate max-w-[150px]">基础模型发布</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}

