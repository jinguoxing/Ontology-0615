import React, { useState } from 'react';
import { Play, ShieldCheck, Send } from 'lucide-react';
import { useUiStore } from '../../store/uiStore';

interface DknPageHeaderProps {
  modelId?: string;
}

export function DknPageHeader({ modelId = 'dkn-global-core' }: DknPageHeaderProps) {
  const navigate = useUiStore((s) => s.navigate);
  const [publishStatus, setPublishStatus] = useState<'draft' | 'running' | 'success'>('draft');

  const getModelDetails = (id: string) => {
    switch(id) {
      case 'dkn-supply-chain':
        return {
          name: 'DKN 供应链资产图谱模型',
          desc: '统一核心供应商、库存和采购行为的跨系统标准化语义映射与行为图谱元模型。',
          domain: '供应链领域',
        };
      case 'dkn-finance-ledger':
        return {
          name: 'DKN 财务账目对账概念模型',
          desc: '规范集团内各财务系统总账与明细交易流的领域实体、交易归组和科目对应语义模型。',
          domain: '财务核算领域',
        };
      case 'dkn-customer-id':
        return {
          name: 'DKN 统一客户核心标识模型',
          desc: '用于多渠道、多源客户注册信息的合并及核心ID语义层映射关系关系模型 and 对齐。',
          domain: '营销服务领域',
        };
      case 'dkn-global-core':
      default:
        return {
          name: '销售域语义治理 DKN',
          desc: '统一查看当前 DKN 的对象、关系、动作、函数、流程、权限与发布状态。',
          domain: '销售领域',
        };
    }
  };

  const modelInfo = getModelDetails(modelId);

  const handleRunValidation = () => {
    setPublishStatus('running');
    setTimeout(() => {
      setPublishStatus('success');
      alert('✅ 模型增量深度校验通过！结构契合度：99.2%，未发现阻断型错误配对。');
    }, 1500);
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200/80 p-4 shadow-3xs flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5 shrink-0">
      <div>
        {/* Breadcrumb row */}
        <div className="flex items-center text-[11px] text-slate-400 font-bold tracking-wide mb-1">
          <span className="hover:text-blue-600 cursor-pointer transition-colors" onClick={() => navigate('drkn_models')}>Ontology Studio</span>
          <span className="mx-1.5 text-slate-300">/</span>
          <span className="hover:text-blue-600 cursor-pointer transition-colors" onClick={() => navigate('dkn_models')}>DKN 模型</span>
          <span className="mx-1.5 text-slate-300">/</span>
          <span className="text-slate-700 font-extrabold truncate max-w-[200px]">{modelInfo.name}</span>
        </div>

        <div className="flex items-center gap-3">
          <h1 className="text-xl font-black text-slate-900 tracking-tight">{modelInfo.name} 建模详情页</h1>
          <div className="flex items-center gap-1.5">
            <span className="bg-blue-50 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded border border-blue-100">
              {modelInfo.domain} DKN
            </span>
            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded border border-emerald-100 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
              启用
            </span>
            <span className="bg-slate-100 text-slate-600 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
              v2.1.0 Draft
            </span>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          {modelInfo.desc}
        </p>
      </div>

      {/* Global actions row from header */}
      <div className="flex items-center gap-2 self-end md:self-center shrink-0">
        <button 
          onClick={() => alert('💾 已成功在云端保存当前模型草案！')}
          className="px-3.5 py-1.5 text-xs font-bold text-slate-655 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-3xs transition-all cursor-pointer"
        >
          保存草稿
        </button>
        
        <button 
          onClick={handleRunValidation}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg shadow-3xs transition-all flex items-center gap-1.5 cursor-pointer ${
            publishStatus === 'running' 
              ? 'bg-amber-500 text-white' 
              : 'text-slate-655 bg-white border border-slate-200 hover:bg-slate-50'
          }`}
        >
          {publishStatus === 'running' ? (
            <>
              <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              校验中...
            </>
          ) : (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-slate-450" /> 校验模型
            </>
          )}
        </button>

        <button 
          onClick={() => navigate('knowledge_network')}
          className="px-3.5 py-1.5 text-xs font-bold text-slate-655 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-3xs transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Play className="w-3 h-3 text-emerald-500 fill-emerald-500" />
          预览运行态
        </button>

        <button 
          onClick={() => alert('🚀 正在部署并全网发布该主数据模型快照...')}
          className="px-4 py-1.5 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm hover:shadow-blue-500/10 flex items-center gap-1.5 cursor-pointer transition-all"
        >
          <Send className="w-3 h-3" />
          发布模型
        </button>
      </div>
    </div>
  );
}
