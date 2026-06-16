import React from 'react';
import { 
  Search, ChevronDown, Layers, Box, Activity, ShieldAlert,
  AlertTriangle, Info, MessageSquare, ArrowRight, Link as LinkIcon, Clock, Shield, Database, User
} from 'lucide-react';

interface KnowledgeNetworkOverviewProps {
  onNavigate: (view: string) => void;
}

export default function KnowledgeNetworkOverview({ onNavigate }: KnowledgeNetworkOverviewProps) {
  return (
    <div className="min-h-full font-sans bg-[#f8fafc]" id="knowledge-network-overview">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* Top Header Section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">知识网络</h1>
            <p className="text-sm text-slate-500 mt-1.5 font-medium">查看网络状态、对象关系与知识路径</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="搜索字段、指标、意图、场景、数据源"
                className="w-full sm:w-[280px] pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow shadow-sm"
              />
            </div>
            {/* Select Scenario */}
            <button className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-[13px] font-medium text-slate-700 shadow-sm flex items-center gap-2 hover:bg-slate-50">
              全部场景 / 数据治理 / 销售分析 / 供应链风险 <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
            {/* Context Switcher */}
            <div className="flex bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/60 shadow-sm">
              <button className="px-4 py-1.5 bg-blue-600 text-white text-[13px] font-bold rounded-md shadow-sm">全部</button>
              <button className="px-4 py-1.5 text-slate-600 hover:text-slate-900 text-[13px] font-medium rounded-md transition-colors hover:bg-slate-200/50">DRKN</button>
              <button className="px-4 py-1.5 text-slate-600 hover:text-slate-900 text-[13px] font-medium rounded-md transition-colors hover:bg-slate-200/50">DKN</button>
              <button className="px-4 py-1.5 text-slate-600 hover:text-slate-900 text-[13px] font-medium rounded-md transition-colors hover:bg-slate-200/50">跨层路径</button>
            </div>
            {/* Version */}
            <button className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-[13px] font-medium text-slate-700 shadow-sm flex items-center gap-2 hover:bg-slate-50">
              v1.3 <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Region 1: 网络健康概览 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
           {/* Card 1 */}
           <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between h-[140px]">
              <div className="flex items-center gap-2">
                 <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100/50 text-blue-500">
                    <Layers className="w-5 h-5" />
                 </div>
                 <div className="flex items-center gap-1.5 text-[14px] font-extrabold text-slate-700">
                   DRKN 语义资产 <Info className="w-3.5 h-3.5 text-slate-300" />
                 </div>
              </div>
              <div className="flex items-end gap-6 mt-3">
                 <div>
                    <div className="text-3xl font-extrabold text-blue-600 leading-none mb-1.5">1,284</div>
                    <div className="text-[11px] font-medium text-slate-500">已确认字段语义</div>
                 </div>
                 <div className="w-px h-8 bg-slate-200 mb-1"></div>
                 <div>
                    <div className="text-2xl font-bold text-slate-800 leading-none mb-1.5">42</div>
                    <div className="text-[11px] font-medium text-slate-500">待确认断言</div>
                 </div>
              </div>
              <div className="text-[11.5px] text-slate-400 mt-auto pt-4 border-t border-slate-50 tracking-wide font-medium">语义资产覆盖企业核心数据要素</div>
           </div>
           
           {/* Card 2 */}
           <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between h-[140px]">
              <div className="flex items-center gap-2">
                 <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100/50 text-blue-500">
                    <Box className="w-5 h-5" />
                 </div>
                 <div className="flex items-center gap-1.5 text-[14px] font-extrabold text-slate-700">
                   DKN 场景包 <Info className="w-3.5 h-3.5 text-slate-300" />
                 </div>
              </div>
              <div className="flex items-end gap-6 mt-3 pl-[48px]">
                 <div>
                    <div className="text-3xl font-extrabold text-blue-600 leading-none mb-1.5">12</div>
                    <div className="text-[11px] font-medium text-slate-500">已发布</div>
                 </div>
                 <div className="w-px h-8 bg-slate-200 mb-1"></div>
                 <div>
                    <div className="text-2xl font-bold text-slate-800 leading-none mb-1.5">3</div>
                    <div className="text-[11px] font-medium text-slate-500">待审核</div>
                 </div>
              </div>
              <div className="text-[11.5px] text-slate-400 mt-auto pt-4 border-t border-slate-50 tracking-wide font-medium">场景沉淀与复用，支撑业务分析</div>
           </div>

           {/* Card 3 */}
           <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between h-[140px]">
              <div className="flex items-center gap-2">
                 <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100/50 text-blue-500">
                    <Activity className="w-5 h-5" />
                 </div>
                 <div className="flex items-center gap-1.5 text-[14px] font-extrabold text-slate-700">
                   AI 使用路径 <Info className="w-3.5 h-3.5 text-slate-300" />
                 </div>
              </div>
              <div className="flex items-baseline gap-2 mt-3 pl-[48px]">
                 <div className="text-[13px] font-medium text-slate-600">今日</div>
                 <div className="text-3xl font-extrabold text-blue-600">326</div>
                 <div className="text-[13px] font-medium text-slate-500">次</div>
              </div>
              <div className="text-[11.5px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded w-fit ml-[48px] mt-1 border border-emerald-100">
                较昨日 ↑ 18.6%
              </div>
              <div className="text-[11.5px] text-slate-400 mt-auto pt-3 border-t border-slate-50 tracking-wide font-medium">AI 通过知识网络完成推理与问答</div>
           </div>

           {/* Card 4 */}
           <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between h-[140px]">
              <div className="flex items-center gap-2">
                 <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100/50 text-blue-500">
                    <ShieldAlert className="w-5 h-5" />
                 </div>
                 <div className="flex items-center gap-1.5 text-[14px] font-extrabold text-slate-700">
                   风险提醒 <Info className="w-3.5 h-3.5 text-slate-300" />
                 </div>
              </div>
              <div className="flex items-end gap-6 mt-3 pl-[48px]">
                 <div>
                    <div className="text-3xl font-extrabold text-rose-500 leading-none mb-1.5">18</div>
                    <div className="text-[11px] font-medium text-slate-500">数据质量问题</div>
                 </div>
                 <div className="w-px h-8 bg-slate-200 mb-1"></div>
                 <div>
                    <div className="text-2xl font-bold text-amber-500 leading-none mb-1.5">5</div>
                    <div className="text-[11px] font-medium text-slate-500">映射异常</div>
                 </div>
              </div>
              <div className="text-[11.5px] text-slate-400 mt-auto pt-4 border-t border-slate-50 tracking-wide font-medium">风险识别与提醒，保障数据可信</div>
           </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-6">
           
           {/* Left Column (col-span-7) */}
           <div className="lg:col-span-7 space-y-6 flex flex-col h-full">
              
              {/* Region 2: 常用网络入口 */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 shrink-0">
                 <h2 className="text-[15px] font-extrabold text-slate-900 mb-5">常用网络入口</h2>
                 <div className="grid grid-cols-2 gap-4">
                    
                    {/* Entry Card 1 */}
                    <div className="border border-slate-100 hover:border-slate-300 rounded-xl p-4 bg-white shadow-xs transition-shadow cursor-pointer group">
                       <div className="flex items-start justify-between mb-3">
                          <div className="flex gap-3">
                             <div className="w-10 h-10 rounded-full bg-blue-50/80 flex items-center justify-center text-blue-500 border border-blue-100 shrink-0 group-hover:bg-blue-100 transition-colors"><Shield className="w-5 h-5" /></div>
                             <div>
                               <h3 className="text-[14px] font-bold text-slate-800 mb-1 leading-snug">数据质量治理网络</h3>
                               <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">所属域: <span className="font-bold text-slate-700">DRKN</span></div>
                             </div>
                          </div>
                          <ChevronDown className="w-4 h-4 text-slate-300 -rotate-90 group-hover:text-slate-500" />
                       </div>
                       <div className="flex items-center gap-6 mb-4">
                          <div>
                            <div className="text-[15px] font-extrabold text-slate-800">128</div>
                            <div className="text-[11px] font-medium text-slate-400">对象数量</div>
                          </div>
                          <div>
                            <div className="text-[15px] font-extrabold text-slate-800">54</div>
                            <div className="text-[11px] font-medium text-slate-400">关系数量</div>
                          </div>
                       </div>
                       <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-[11px]">
                          <div className="text-slate-400 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> 最近使用: 今天 09:42</div>
                          <div className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">已发布</div>
                       </div>
                    </div>

                    {/* Entry Card 2 */}
                    <div className="border border-slate-100 hover:border-slate-300 rounded-xl p-4 bg-white shadow-xs transition-shadow cursor-pointer group">
                       <div className="flex items-start justify-between mb-3">
                          <div className="flex gap-3">
                             <div className="w-10 h-10 rounded-full bg-blue-50/80 flex items-center justify-center text-blue-500 border border-blue-100 shrink-0 group-hover:bg-blue-100 transition-colors"><Activity className="w-5 h-5" /></div>
                             <div>
                               <h3 className="text-[14px] font-bold text-slate-800 mb-1 leading-snug">销售分析网络</h3>
                               <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">所属域: <span className="font-bold text-slate-700">DKN</span></div>
                             </div>
                          </div>
                          <ChevronDown className="w-4 h-4 text-slate-300 -rotate-90 group-hover:text-slate-500" />
                       </div>
                       <div className="flex items-center gap-6 mb-4">
                          <div>
                            <div className="text-[15px] font-extrabold text-slate-800">256</div>
                            <div className="text-[11px] font-medium text-slate-400">对象数量</div>
                          </div>
                          <div>
                            <div className="text-[15px] font-extrabold text-slate-800">112</div>
                            <div className="text-[11px] font-medium text-slate-400">关系数量</div>
                          </div>
                       </div>
                       <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-[11px]">
                          <div className="text-slate-400 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> 最近使用: 今天 08:57</div>
                          <div className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">使用中</div>
                       </div>
                    </div>

                    {/* Entry Card 3 */}
                    <div className="border border-slate-100 hover:border-slate-300 rounded-xl p-4 bg-white shadow-xs transition-shadow cursor-pointer group">
                       <div className="flex items-start justify-between mb-3">
                          <div className="flex gap-3">
                             <div className="w-10 h-10 rounded-full bg-blue-50/80 flex items-center justify-center text-blue-500 border border-blue-100 shrink-0 group-hover:bg-blue-100 transition-colors"><Box className="w-5 h-5" /></div>
                             <div>
                               <h3 className="text-[14px] font-bold text-slate-800 mb-1 leading-snug">供应链风险网络</h3>
                               <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">所属域: <span className="font-bold text-slate-700">DRKN</span></div>
                             </div>
                          </div>
                          <ChevronDown className="w-4 h-4 text-slate-300 -rotate-90 group-hover:text-slate-500" />
                       </div>
                       <div className="flex items-center gap-6 mb-4">
                          <div>
                            <div className="text-[15px] font-extrabold text-slate-800">168</div>
                            <div className="text-[11px] font-medium text-slate-400">对象数量</div>
                          </div>
                          <div>
                            <div className="text-[15px] font-extrabold text-slate-800">78</div>
                            <div className="text-[11px] font-medium text-slate-400">关系数量</div>
                          </div>
                       </div>
                       <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-[11px]">
                          <div className="text-slate-400 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> 最近使用: 昨天 16:28</div>
                          <div className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">已发布</div>
                       </div>
                    </div>

                    {/* Entry Card 4 */}
                    <div className="border border-slate-100 hover:border-slate-300 rounded-xl p-4 bg-white shadow-xs transition-shadow cursor-pointer group">
                       <div className="flex items-start justify-between mb-3">
                          <div className="flex gap-3">
                             <div className="w-10 h-10 rounded-full bg-blue-50/80 flex items-center justify-center text-blue-500 border border-blue-100 shrink-0 group-hover:bg-blue-100 transition-colors"><User className="w-5 h-5" /></div>
                             <div>
                               <h3 className="text-[14px] font-bold text-slate-800 mb-1 leading-snug">客户经营网络</h3>
                               <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">所属域: <span className="font-bold text-slate-700">DKN</span></div>
                             </div>
                          </div>
                          <ChevronDown className="w-4 h-4 text-slate-300 -rotate-90 group-hover:text-slate-500" />
                       </div>
                       <div className="flex items-center gap-6 mb-4">
                          <div>
                            <div className="text-[15px] font-extrabold text-slate-800">198</div>
                            <div className="text-[11px] font-medium text-slate-400">对象数量</div>
                          </div>
                          <div>
                            <div className="text-[15px] font-extrabold text-slate-800">92</div>
                            <div className="text-[11px] font-medium text-slate-400">关系数量</div>
                          </div>
                       </div>
                       <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-[11px]">
                          <div className="text-slate-400 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> 最近使用: 昨天 14:11</div>
                          <div className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">使用中</div>
                       </div>
                    </div>

                 </div>
              </div>

              {/* Region 4: 待处理问题 */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex-1 flex flex-col">
                 <h2 className="text-[15px] font-extrabold text-slate-900 mb-5">待处理问题</h2>
                 
                 <div className="space-y-3 flex-1">
                    <div className="flex items-center justify-between p-3.5 rounded-xl border border-amber-100 bg-amber-50/40 hover:bg-amber-50 transition-colors cursor-pointer group">
                       <div className="flex items-center gap-3 text-[13.5px] font-bold text-slate-800">
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                          <span>3 个指标口径待认证</span>
                       </div>
                       <div className="flex items-center gap-1 text-[13px] font-medium text-slate-500 group-hover:text-slate-800">
                          3 项 <ChevronDown className="w-4 h-4 -rotate-90 text-slate-300" />
                       </div>
                    </div>
                    <div className="flex items-center justify-between p-3.5 rounded-xl border border-[#ffedd5] bg-[#fff7ed] hover:bg-[#ffedd5]/50 transition-colors cursor-pointer group">
                       <div className="flex items-center gap-3 text-[13.5px] font-bold text-slate-800">
                          <AlertTriangle className="w-4 h-4 text-[#ea580c]" />
                          <span>5 个字段映异常</span>
                       </div>
                       <div className="flex items-center gap-1 text-[13px] font-medium text-slate-500 group-hover:text-slate-800">
                          5 项 <ChevronDown className="w-4 h-4 -rotate-90 text-slate-300" />
                       </div>
                    </div>
                    <div className="flex items-center justify-between p-3.5 rounded-xl border border-blue-100 bg-blue-50/40 hover:bg-blue-50 transition-colors cursor-pointer group">
                       <div className="flex items-center gap-3 text-[13.5px] font-bold text-slate-800">
                          <Info className="w-4 h-4 text-blue-500" />
                          <span>12 个语义断言待确认</span>
                       </div>
                       <div className="flex items-center gap-1 text-[13px] font-medium text-slate-500 group-hover:text-slate-800">
                          12 项 <ChevronDown className="w-4 h-4 -rotate-90 text-slate-300" />
                       </div>
                    </div>
                    <div className="flex items-center justify-between p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/40 hover:bg-indigo-50 transition-colors cursor-pointer group">
                       <div className="flex items-center gap-3 text-[13.5px] font-bold text-slate-800">
                          <MessageSquare className="w-4 h-4 text-indigo-500" />
                          <span>2 个 AI 反馈需要处理</span>
                       </div>
                       <div className="flex items-center gap-1 text-[13px] font-medium text-slate-500 group-hover:text-slate-800">
                          2 项 <ChevronDown className="w-4 h-4 -rotate-90 text-slate-300" />
                       </div>
                    </div>
                 </div>
              </div>

           </div>

           {/* Right Column (col-span-5) */}
           <div className="lg:col-span-5 space-y-6 flex flex-col h-full">
              
              {/* Region 3: 最近被 AI 使用的知识路径 */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 shrink-0 h-[480px] flex flex-col">
                 <h2 className="text-[15px] font-extrabold text-slate-900 mb-5">最近被 AI 使用的知识路径</h2>
                 
                 <div className="space-y-4 flex-1">
                    {/* Path Item 1 */}
                    <div className="border border-slate-100 rounded-xl p-4 bg-white/50 hover:bg-white hover:shadow-xs hover:border-slate-200 transition-all">
                       <div className="flex justify-between items-start mb-3">
                          <div className="flex gap-3">
                             <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 shadow-sm">1</div>
                             <div className="text-[13px] font-bold text-slate-800 leading-snug">问题：为什么本周延期订单率上升？</div>
                          </div>
                          <div className="text-[11px] font-medium text-slate-400 shrink-0 mt-0.5 whitespace-nowrap">10 分钟前</div>
                       </div>
                       <div className="flex items-center justify-between pl-8">
                          <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 flex-wrap">
                             <span className="shrink-0">路径:</span>
                             <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">Intent</span>
                             <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
                             <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 shadow-sm">Metric</span>
                             <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
                             <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 shadow-sm">Mapping</span>
                             <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
                             <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 shadow-sm">Field</span>
                             <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
                             <span className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-slate-500 shadow-sm">DataSource</span>
                          </div>
                          <div className="shrink-0 text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">
                            有证据
                          </div>
                       </div>
                    </div>

                    {/* Path Item 2 */}
                    <div className="border border-slate-100 rounded-xl p-4 bg-white/50 hover:bg-white hover:shadow-xs hover:border-slate-200 transition-all">
                       <div className="flex justify-between items-start mb-3">
                          <div className="flex gap-3">
                             <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 shadow-sm">2</div>
                             <div className="text-[13px] font-bold text-slate-800 leading-snug">问题：哪些字段映射到了供应商对象？</div>
                          </div>
                          <div className="text-[11px] font-medium text-slate-400 shrink-0 mt-0.5 whitespace-nowrap">25 分钟前</div>
                       </div>
                       <div className="flex items-center justify-between pl-8">
                          <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 flex-wrap">
                             <span className="shrink-0">路径:</span>
                             <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">DomainObject</span>
                             <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
                             <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 shadow-sm">Mapping</span>
                             <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
                             <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 shadow-sm">Assertion</span>
                             <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
                             <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 shadow-sm">Field</span>
                          </div>
                          <div className="shrink-0 text-[11px] font-bold text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded">
                            有映射风险
                          </div>
                       </div>
                    </div>

                    {/* Path Item 3 */}
                    <div className="border border-slate-100 rounded-xl p-4 bg-white/50 hover:bg-white hover:shadow-xs hover:border-slate-200 transition-all">
                       <div className="flex justify-between items-start mb-3">
                          <div className="flex gap-3">
                             <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 shadow-sm">3</div>
                             <div className="text-[13px] font-bold text-slate-800 leading-snug">问题：客户经营网络最近关联了哪些流失指标？</div>
                          </div>
                          <div className="text-[11px] font-medium text-slate-400 shrink-0 mt-0.5 whitespace-nowrap">47 分钟前</div>
                       </div>
                       <div className="flex items-center justify-between pl-8">
                          <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 flex-wrap">
                             <span className="shrink-0">路径:</span>
                             <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">Scenario</span>
                             <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
                             <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 shadow-sm">DomainObject</span>
                             <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
                             <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 shadow-sm">Metric</span>
                             <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
                             <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 shadow-sm">Mapping</span>
                          </div>
                          <div className="shrink-0 text-[11px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">
                            已验证
                          </div>
                       </div>
                    </div>

                 </div>

                 <div className="pt-4 border-t border-slate-100 mt-2 flex justify-center">
                    <button className="text-[13px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">查看全部 <ChevronDown className="w-4 h-4 -rotate-90" /></button>
                 </div>
              </div>

              {/* Region 5: 推荐探索入口 */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex-1 flex flex-col">
                 <h2 className="text-[15px] font-extrabold text-slate-900 mb-5">推荐探索入口</h2>
                 <div className="flex gap-4 h-full">
                    
                    {/* Exploration Card 1 */}
                    <div className="flex-1 bg-slate-50/80 rounded-xl p-4 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer group flex flex-col justify-between">
                       <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 border border-blue-200 text-blue-600"><LinkIcon className="w-5 h-5" /></div>
                          <div>
                            <div className="text-[14px] font-bold text-slate-800 mb-1.5">查看跨层路径</div>
                            <div className="text-[11px] text-slate-500 font-medium">探索跨域、跨层级的业务关联链路</div>
                          </div>
                       </div>
                       <div className="flex justify-end mt-2"><ArrowRight className="w-4 h-4 text-blue-500 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" /></div>
                    </div>

                    {/* Exploration Card 2 */}
                    <div className="flex-1 bg-slate-50/80 rounded-xl p-4 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer group flex flex-col justify-between">
                       <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 border border-blue-200 text-blue-600"><Database className="w-5 h-5" /></div>
                          <div>
                            <div className="text-[14px] font-bold text-slate-800 mb-1.5">浏览最近使用对象</div>
                            <div className="text-[11px] text-slate-500 font-medium">看最近被 AI 引用的热点对象资源</div>
                          </div>
                       </div>
                       <div className="flex justify-end mt-2"><ArrowRight className="w-4 h-4 text-blue-500 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" /></div>
                    </div>

                    {/* Exploration Card 3 */}
                    <div className="flex-1 bg-slate-50/80 rounded-xl p-4 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer group flex flex-col justify-between">
                       <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 border border-blue-200 text-blue-600"><ShieldAlert className="w-5 h-5" /></div>
                          <div>
                            <div className="text-[14px] font-bold text-slate-800 mb-1.5">排查网络异常</div>
                            <div className="text-[11px] text-slate-500 font-medium">定位数据质量、映射与断言等异常问题</div>
                          </div>
                       </div>
                       <div className="flex justify-end mt-2"><ArrowRight className="w-4 h-4 text-blue-500 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" /></div>
                    </div>

                 </div>
              </div>

           </div>

        </div>
      </div>
    </div>
  );
}
