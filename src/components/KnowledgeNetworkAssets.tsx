import React, { useState } from 'react';
import { 
  Database, Search, Network, ArrowRight, Shield, Activity, 
  GitBranch, HelpCircle, Users, Layers, ExternalLink, Sparkles, Plus, Play
} from 'lucide-react';

interface KnowledgeNetworkAssetsProps {
  onNavigate: (view: string) => void;
}

export default function KnowledgeNetworkAssets({ onNavigate }: KnowledgeNetworkAssetsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'drkn' | 'dkn'>('all');

  // Unified assets lists
  const assets = [
    {
      id: 'drkn-semantic-gov',
      name: 'DRKN-数据语义治理',
      domain: 'DRKN (Data-Reasoning Knowledge Network)',
      desc: '支持大语言模型智能推理、端到端数据血缘归因与自动语义对齐。覆盖企业业务元数据断言与核心控制点，打通物理表与概念层语义。',
      objectCount: 24586,
      relationCount: 18452,
      owner: '数据治理运营组',
      status: 'Active',
      lastUpdate: '2026-06-15 14:32',
      featured: true,
      tags: ['语义建模', '智能推理', 'AI驱动', '物理映射']
    },
    {
      id: 'dkn-sales-analysis',
      name: 'DKN-销售分析关系核心模型',
      domain: 'DKN (Domain Knowledge Network)',
      desc: '围绕零售分销商、加盟商、销售渠道及终端流水的关系资产网络。用于业务自助分析、标签画像关联以及区域业绩影响研究。',
      objectCount: 1256,
      relationCount: 3840,
      owner: '销售数字化团队',
      status: 'Active',
      lastUpdate: '2026-06-12 09:11',
      featured: false,
      tags: ['零售业务', '渠道分析', '客户画像']
    },
    {
      id: 'drkn-supply-chain',
      name: 'DRKN-供应链物流全链血缘网络',
      domain: 'DRKN (Data-Reasoning Knowledge Network)',
      desc: '贯穿采购、制造拼箱、在途货轮、口岸通关至末端仓配的智能推理网络。结合气象及港口拥堵数据，通过AI进行供应链瓶颈自动诊断。',
      objectCount: 8432,
      relationCount: 12450,
      owner: '供应链管理部',
      status: 'Active',
      lastUpdate: '2026-06-14 11:20',
      featured: false,
      tags: ['供应链', '异常检测', '实时风险']
    },
    {
      id: 'dkn-finance-core',
      name: 'DKN-财务业财一体化语义资产',
      domain: 'DKN (Domain Knowledge Network)',
      desc: '连接财务科目、凭证、预算中心与业务端合同及采购订单。保证业财核对语义一致性，对AI大模型进行语义输入。',
      objectCount: 4120,
      relationCount: 6300,
      owner: '财务管理中心',
      status: 'Draft',
      lastUpdate: '2026-06-15 16:28',
      featured: false,
      tags: ['业财一体', '账目校验', '核心合规']
    }
  ];

  // Filter
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          asset.desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          asset.owner.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (activeFilter === 'drkn') return asset.domain.includes('DRKN');
    if (activeFilter === 'dkn') return asset.domain.includes('DKN');
    return true;
  });

  return (
    <div className="min-h-full font-sans bg-[#f8fafc]" id="knowledge-network-assets-page">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* Breadcrumb & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1.5">
              <span>知识网络</span>
              <span>/</span>
              <span className="text-slate-800">网络资产</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              知识网络资产
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              查看并配置企业各数据域、应用场景中的知识网络模型 & 语义治理核心实体资产。
            </p>
          </div>

          <div className="flex bg-slate-150/80 p-0.5 rounded-lg border border-slate-200">
            <button 
              onClick={() => setActiveFilter('all')} 
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${activeFilter === 'all' ? 'bg-white text-slate-850 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              全部 ({assets.length})
            </button>
            <button 
              onClick={() => setActiveFilter('drkn')} 
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${activeFilter === 'drkn' ? 'bg-white text-slate-850 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              DRKN 推理系列 ({assets.filter(a => a.domain.includes('DRKN')).length})
            </button>
            <button 
              onClick={() => setActiveFilter('dkn')} 
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${activeFilter === 'dkn' ? 'bg-white text-slate-850 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              DKN 场景系列 ({assets.filter(a => a.domain.includes('DKN')).length})
            </button>
          </div>
        </div>

        {/* Feature Entry Banner (Featured Asset: DRKN-数据语义治理) */}
        <div className="relative bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl border border-blue-950 p-6 shadow-md overflow-hidden text-white">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(circle_at_right,rgba(59,130,246,0.8),transparent)] pointer-events-none"></div>
          {/* Subtle grid decor */}
          <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-4 max-w-3xl">
              <div className="flex items-center gap-2">
                <span className="bg-blue-500/20 text-blue-300 font-bold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border border-blue-400/30">
                  推荐核心治理资产
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 font-bold text-[10px] px-2.5 py-1 rounded-full border border-emerald-400/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> 生产环境发布中
                </span>
              </div>
              
              <div className="space-y-1">
                <h2 className="text-xl lg:text-2xl font-extrabold text-white font-mono flex items-center gap-3">
                  <Network className="w-6 h-6 text-blue-400" />
                  DRKN-数据语义治理
                </h2>
                <p className="text-[13.5px] text-slate-300 leading-relaxed font-normal">
                  企业核心逻辑建模引擎。连接 <b>ERP、CRM 及供应链物理库表</b>，利用大模型和专家断言逻辑，自动化生成端到端逻辑模型和质量推演血缘。提供秒级路径追踪与数据缺陷溯源。
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-300 pt-1 font-medium">
                <div className="flex items-center gap-1.5 font-mono">
                  <Layers className="w-3.5 h-3.5 text-blue-400" />
                  实体数: <span className="text-white font-bold">24,586</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono">
                  <GitBranch className="w-3.5 h-3.5 text-blue-400" />
                  关系数: <span className="text-white font-bold">18,452</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-400" />
                  管理所有权: <span className="text-white font-bold">数据治理运营组</span>
                </div>
              </div>
            </div>

            <button 
              onClick={() => onNavigate('knowledge_network_explorer')}
              className="lg:self-center shrink-0 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-bold px-6 py-3.5 rounded-xl transition-all shadow-md flex items-center gap-2 group cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current group-hover:scale-105 transition-transform" />
              <span>进入 DRKN 网络探索</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Dashboard search + count card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索网络资产名称, 场景描述或归属团队..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-800"
              />
            </div>
            
            <div className="text-xs text-slate-500 font-medium">
              共找到 <span className="text-slate-800 font-bold">{filteredAssets.length}</span> 个知识资产包
            </div>
          </div>

          {/* Grid of assets */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
            {filteredAssets.map((asset) => {
              const isGovDrv = asset.id === 'drkn-semantic-gov';
              return (
                <div 
                  key={asset.id}
                  className={`bg-white rounded-xl border p-5 flex flex-col justify-between transition-all relative overflow-hidden h-[260px] ${
                    isGovDrv 
                      ? 'border-blue-300 ring-2 ring-blue-550/10 shadow-sm' 
                      : 'border-slate-200 hover:border-slate-350 hover:shadow-xs'
                  }`}
                >
                  {isGovDrv && (
                    <div className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] px-3.5 py-1 font-extrabold uppercase rounded-bl-xl shadow-xs">
                      推荐/核心
                    </div>
                  )}

                  <div>
                    {/* Icon and Type */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`p-2 rounded-lg ${isGovDrv ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-600'}`}>
                        <Database className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-400 font-mono tracking-tight">
                        {asset.domain}
                      </span>
                    </div>

                    {/* Name */}
                    <h3 className="text-[15px] font-bold text-slate-850 font-mono tracking-tight leading-snug">
                      {asset.name}
                    </h3>

                    {/* Desc */}
                    <p className="text-xs text-slate-500 font-normal leading-relaxed mt-2.5 line-clamp-3">
                      {asset.desc}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mt-3.5">
                      {asset.tags.map(t => (
                        <span key={t} className="text-[10px] font-medium bg-slate-50 text-slate-550 px-2 py-0.5 rounded border border-slate-100">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Footer Stats & Actions */}
                  <div className="pt-4 border-t border-slate-100 mt-4">
                    <div className="flex justify-between items-center text-[11.5px]">
                      <div className="flex gap-4 text-slate-400 font-mono font-medium">
                        <div>
                          实体 <span className="text-slate-800 font-bold">{asset.objectCount.toLocaleString()}</span>
                        </div>
                        <div>
                          关系 <span className="text-slate-800 font-bold">{asset.relationCount.toLocaleString()}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (asset.id === 'drkn-semantic-gov') {
                            onNavigate('knowledge_network_explorer');
                          } else {
                            alert(`进入「${asset.name}」资产空间进行离线浏览与配置`);
                          }
                        }}
                        className={`font-bold transition-all flex items-center gap-1 py-1 px-3.5 rounded-lg cursor-pointer ${
                          isGovDrv 
                            ? 'text-white bg-blue-600 hover:bg-blue-700' 
                            : 'text-slate-650 hover:bg-slate-50 hover:text-slate-900 border border-slate-200'
                        }`}
                      >
                        <span>进入</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
