import React, { useState } from 'react';
import { ChangeSet, ValidationItem } from '../types';
import { 
  GitCommit, AlertTriangle, CheckCircle2, ShieldCheck, 
  RefreshCw, Clock, ArrowRight, ClipboardList, Layers, 
  Compass, Eye, Sparkles, Send, Ban, Check, FileCheck
} from 'lucide-react';

interface ChangeReleaseProps {
  changeSets: ChangeSet[];
  validationItems: ValidationItem[];
  isLocked: boolean;
  onNavigate: (view: string, targetId?: string) => void;
  onUpdateChangeSets: (updated: ChangeSet[]) => void;
  onClearActiveDraft: () => void;
}

export default function ChangeRelease({
  changeSets,
  validationItems,
  isLocked,
  onNavigate,
  onUpdateChangeSets,
  onClearActiveDraft
}: ChangeReleaseProps) {

  // Current active chosen changeset ID
  const [activeCsId, setActiveCsId] = useState<string>('CS-2026-012');
  const activeCs = changeSets.find(cs => cs.id === activeCsId) || changeSets[0];

  // Action status indicators
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'running' | 'success'>('idle');
  const [publishSuccessDialog, setPublishSuccessDialog] = useState(false);

  // Filter out statistics
  const errors = validationItems.filter(item => item.type === 'error');
  const warnings = validationItems.filter(item => item.type === 'warning');
  const infos = validationItems.filter(item => item.type === 'info');

  const handleVerify = () => {
    setVerifyStatus('running');
    setTimeout(() => {
      setVerifyStatus('success');
    }, 1500);
  };

  const handleSubmitForReview = () => {
    if (activeCs.status !== 'editing') return;
    const updated = changeSets.map(cs => {
      if (cs.id === activeCs.id) {
        return { ...cs, status: 'pending_review' as const };
      }
      return cs;
    });
    onUpdateChangeSets(updated);
    alert(`🎉 变更集 [${activeCs.id}] 已成功提交至架构演进委员会，当前状态更新为 “待审核”！`);
  };

  const handleApprove = () => {
    if (activeCs.status !== 'pending_review') return;
    const updated = changeSets.map(cs => {
      if (cs.id === activeCs.id) {
        return { ...cs, status: 'approved' as const };
      }
      return cs;
    });
    onUpdateChangeSets(updated);
    alert(`🎉 架构委员会已成功审批通过 [${activeCs.id}] 语义模型变更！`);
  };

  const handlePublish = () => {
    if (activeCs.status !== 'approved' && activeCs.status !== 'editing') {
      alert("仅限已通过审核或编辑中的变更集可以直接执行安全发布流程！");
      return;
    }
    const updated = changeSets.map(cs => {
      if (cs.id === activeCs.id) {
        return { ...cs, status: 'published' as const, date: new Date().toISOString().split('T')[0] };
      }
      return cs;
    });
    onUpdateChangeSets(updated);
    setPublishSuccessDialog(true);
    // Unlocks workspace additions
    onClearActiveDraft();
  };

  return (
    <div className="space-y-6" id="release-workspace">
      
      {/* 顶部版本元数据控制 */}
      <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-xs font-bold bg-purple-50 text-purple-700 rounded-sm">版本进化论</span>
            <h2 className="text-lg font-bold text-slate-900">DRKN 模型语义发布与回滚控制环</h2>
          </div>
          <p className="text-xs text-slate-500">
            模型修改必须遵循严格的变更集模型隔离，通过校验、影响分析、三方会签和安全一键合并发布方能部署至工作台。
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleVerify}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-205 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${verifyStatus === 'running' ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
            {verifyStatus === 'running' ? '编译预校验中...' : '自动语法编译校验'}
          </button>

          {activeCs.status === 'editing' && (
            <button
              onClick={handleSubmitForReview}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
              提交会签审核
            </button>
          )}

          {activeCs.status === 'pending_review' && (
            <button
              onClick={handleApprove}
              className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <ShieldCheck className="h-4 w-4" />
              架构委员会一键同意
            </button>
          )}

          {(activeCs.status === 'approved' || (activeCs.status === 'editing' && verifyStatus === 'success')) && (
            <button
              onClick={handlePublish}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer animate-none"
            >
              <FileCheck className="h-4 w-4" />
              执行一键正式发布
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 左：变更集列表 */}
        <div className="lg:col-span-3 bg-white border border-slate-205 rounded-xl p-4 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
            历史及活跃变更集 (Transactions)
          </h3>

          <div className="space-y-1.5">
            {changeSets.map((cs) => (
              <div
                key={cs.id}
                onClick={() => {
                  setActiveCsId(cs.id);
                  setVerifyStatus('idle');
                }}
                className={`p-3 rounded-lg flex flex-col gap-1 cursor-pointer transition-all border ${
                  cs.id === activeCs.id
                    ? 'bg-blue-50 border-blue-200 text-blue-900 shadow-xs'
                    : 'hover:bg-slate-50 border-transparent text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono">{cs.id}</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                    cs.status === 'published' 
                      ? 'bg-emerald-50 text-emerald-700' 
                      : cs.status === 'editing'
                      ? 'bg-blue-50 text-blue-700 animate-pulse'
                      : cs.status === 'approved'
                      ? 'bg-purple-50 text-purple-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}>
                    {cs.status === 'published' && '已合并'}
                    {cs.status === 'editing' && '本地草稿'}
                    {cs.status === 'approved' && '待发布'}
                    {cs.status === 'pending_review' && '待审核'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-800 font-bold leading-normal truncate">{cs.title}</p>
                <span className="text-[9px] text-slate-405 self-start mt-1 font-medium">{cs.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 中：变更内容卡片 */}
        <div className="lg:col-span-6 bg-white border border-slate-205 rounded-xl p-6 shadow-sm flex flex-col justify-between min-h-[460px]">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-55 pb-2">
              <div className="flex items-center gap-1.5">
                <ClipboardList className="h-4.5 w-4.5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 font-mono">
                  变更内容 Diffs: {activeCs.id}
                </h3>
              </div>
              <span className="text-xs text-slate-400">含有 {activeCs.changes.length} 项逻辑改动</span>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800">{activeCs.title}</h4>
              <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                {activeCs.description}
              </p>
            </div>

            {/* List changed configurations with high-fidelity visual elements */}
            <div className="space-y-2.5 pt-2">
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">具体模型变更参数拓扑列表</p>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {activeCs.changes.map((change, idx) => (
                  <div key={idx} className="p-3 bg-slate-50/70 border border-slate-100 rounded-lg flex items-start gap-2 text-xs">
                    <span className="h-5 w-5 rounded bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-[10px] shrink-0 inline-block">
                      {idx + 1}
                    </span>
                    <div className="space-y-1">
                      <p className="font-bold text-slate-900 font-mono">
                        {change.type === 'modify_property' && `修改属性定义 [${change.target}]`}
                        {change.type === 'add_link' && `新增关系Link [${change.target}]`}
                        {change.type === 'bind_capability' && `函数能力绑定 [${change.target}]`}
                        {change.type === 'modify_workflow' && `修改时序条件 [${change.target}]`}
                        {change.type === 'add_object' && `添加本体对象 [${change.target}]`}
                      </p>
                      <p className="text-slate-600 leading-relaxed font-normal text-[11px]">{change.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between bg-slate-50/50 p-3 rounded">
            <span>当前处于: <b>{activeCs.status === 'published' ? '模型不可撰写态 (只读归档)' : '可修改发布周期草案'}</b></span>
            {activeCs.status !== 'published' && (
              <span className="text-[11px] font-bold text-blue-600 flex items-center gap-1">
                <span>校验建议通过</span>
              </span>
            )}
          </div>
        </div>

        {/* 右：校验与影响分析 */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* 自动编译诊断 */}
          <div className="bg-white border border-slate-205 rounded-xl p-5 shadow-sm space-y-3.5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2 flex items-center justify-between">
              <span>自动语法编译诊断</span>
              {verifyStatus === 'success' && (
                <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-1 rounded">Passed</span>
              )}
            </h3>

            <div className="space-y-2">
              <div className="flex text-xs justify-between">
                <span className="text-slate-500">发现错误 (Errors):</span>
                <span className="font-bold text-rose-600">0 ⚠️</span>
              </div>
              <div className="flex text-xs justify-between">
                <span className="text-slate-500">逻辑警告 (Warnings):</span>
                <span className="font-bold text-amber-600">{activeCs.status === 'published' ? 0 : warnings.length} 条</span>
              </div>
              <div className="flex text-xs justify-between">
                <span className="text-slate-500">审计提示 (Infos):</span>
                <span className="font-bold text-blue-600">{activeCs.status === 'published' ? 1 : infos.length} 条</span>
              </div>

              {/* Compilation feedback simulations */}
              {verifyStatus === 'success' ? (
                <div className="p-2.5 bg-emerald-50 border border-emerald-100 text-[11px] leading-relaxed text-emerald-800 rounded-lg space-y-1">
                  <div className="flex items-center gap-1 font-bold">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>模型结构校验完美通过！</span>
                  </div>
                  <p className="text-slate-650 font-normal">0个物理死锁，0个无根连线。各Object Type 绑定计算方法的输入参数和输出荷载完全对齐。保障100%安全合并运行。</p>
                </div>
              ) : verifyStatus === 'running' ? (
                <div className="p-4 flex items-center justify-center gap-2 text-xs text-slate-500">
                  <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                  <span>编译树校验演习跑批中...</span>
                </div>
              ) : activeCs.status !== 'published' ? (
                <div className="space-y-1.5 pt-1">
                  {validationItems.slice(0, 2).map((item, idx) => (
                    <div key={idx} className="p-2 bg-amber-50/50 border border-amber-100 rounded text-[10.5px] leading-snug text-amber-800 flex items-start gap-1">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold font-mono">{item.source}</p>
                        <p className="text-slate-600 text-[10px]">{item.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 py-3 text-center">本变更集已正式合并，无待处理警告项</p>
              )}
            </div>
          </div>

          {/* 跨层映射对下游的影响分析 */}
          <div className="bg-white border border-slate-205 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">
              全图谱影响深度演习
            </h3>

            {activeCs.status === 'published' ? (
              <p className="text-xs text-slate-400 py-4 text-center">本变更集已融入 v1.3.0 模型中。</p>
            ) : (
              <div className="space-y-2.5 text-xs">
                <div className="p-2.5 bg-indigo-50/50 border border-indigo-100 rounded-lg flex items-start gap-2 text-indigo-900 leading-normal">
                  <Sparkles className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-[11px]">AI 工作台与图依赖</h5>
                    <p className="text-slate-600 text-[10.5px] mt-0.5">
                      本配置调整后，大语言模型对 Field.semantic_type 的判定可读格式信度将顺位上提 <b>5%</b>。
                    </p>
                  </div>
                </div>

                <div className="space-y-1 bg-slate-50 p-2.5 rounded border border-slate-100">
                  <div className="flex items-center justify-between py-0.5 font-semibold text-slate-800">
                    <span>受影响 Object Type：</span>
                    <span className="font-mono text-blue-750">2 个 (Field)</span>
                  </div>
                  <div className="flex items-center justify-between py-0.5 font-semibold text-slate-800">
                    <span>受影响 Link Type：</span>
                    <span className="font-mono text-blue-750">1 个 (maps_to)</span>
                  </div>
                  <div className="flex items-center justify-between py-0.5 font-semibold text-slate-800">
                    <span>受影响 Workflow：</span>
                    <span className="font-semibold text-indigo-700">SemanticReview</span>
                  </div>
                  <div className="flex items-center justify-between py-0.5 font-semibold text-slate-800 border-t border-slate-150/40 mt-1 pt-1 text-[11px]">
                    <span>映射 Downstream:</span>
                    <span className="text-slate-500">DRKN语义网络 / 纠错流</span>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* 底部发布流程时间线 */}
      <div className="bg-white border border-slate-205 rounded-xl p-5 shadow-sm space-y-4 font-normal">
        <h3 className="text-xs font-bold text-slate-450 uppercase tracking-widest px-1">
          当前变更发布闭环控制轴
        </h3>

        {/* 流程时间线 */}
        <div className="flex flex-wrap items-center justify-between gap-2 overflow-x-auto p-2" id="release-pipeline">
          {[
            { label: '新建变更集', status: 'done', desc: 'CS-2026-012 已建立' },
            { label: '编辑模型', status: 'done', desc: '属性功能绑定就绪' },
            { label: '自动校验', status: verifyStatus === 'success' ? 'done' : 'active', desc: '等待编译检验' },
            { label: '影响分析', status: verifyStatus === 'success' ? 'done' : 'next', desc: '分析下游依赖' },
            { label: '提交会签', status: activeCs.status !== 'editing' ? 'done' : 'next', desc: '架构会核准中' },
            { label: '审批通过', status: (activeCs.status === 'approved' || activeCs.status === 'published') ? 'done' : 'next', desc: '完成多方数字鉴权' },
            { label: '发布新版本', status: activeCs.status === 'published' ? 'done' : 'next', desc: '合并至 v1.4.0' },
            { label: '刷新图网络', status: activeCs.status === 'published' ? 'done' : 'next', desc: '更新下游DKN映射' },
            { label: 'AI 工作台启用', status: activeCs.status === 'published' ? 'done' : 'next', desc: '可用能力推送' }
          ].map((step, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1 flex-1 min-w-[90px] text-center relative">
              {/* Node dot */}
              <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
                step.status === 'done'
                  ? 'bg-emerald-500 border-emerald-600 text-white shadow-xs'
                  : step.status === 'active'
                  ? 'bg-blue-600 border-blue-705 text-white animate-pulse'
                  : 'bg-white border-slate-205 text-slate-400'
              }`}>
                {step.status === 'done' ? <Check className="h-3.5 w-3.5" /> : idx + 1}
              </div>
              <p className="text-[11px] font-semibold text-slate-805 leading-none mt-1">{step.label}</p>
              <p className="text-[9px] text-slate-400 whitespace-nowrap mt-0.5">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Release Success Modal dialog popup */}
      {publishSuccessDialog && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" onClick={() => setPublishSuccessDialog(false)}></div>
          
          <div className="relative bg-white border border-slate-205 max-w-md w-full mx-4 rounded-xl p-6 shadow-2xl text-center space-y-4" id="success-publish-modal">
            <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-7 w-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-900">🎉 DRKN 模型一键安全发布成功！</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                变更集 <b>{activeCs.id}</b> 已完美通过一整闭环审批和密码签名校验。
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs text-left leading-relaxed space-y-1 font-normal text-slate-650">
              <p className="font-semibold text-slate-800">🔥 下游渠道触发联动：</p>
              <p>1. <b>核心物理语义快照生成：</b> 固化为版本号 <span className="font-mono font-bold text-blue-700">v1.4.0</span>。</p>
              <p>2. <b>刷新 DKN 知识图谱网络索引：</b> 下游图谱跨视图 mapping 完成一触增量刷新。</p>
              <p>3. <b>AI 工作台能力热刷新：</b> classifyFieldSemantic()、computeSemanticScore() 等与 Field 对象绑定的无状态计算方法已在智能终端环境热重载上架！</p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setPublishSuccessDialog(false)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
              >
                好的，刷新并返回
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
