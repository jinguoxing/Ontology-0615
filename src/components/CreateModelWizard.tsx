import React, { useState } from 'react';
import { 
  Check, 
  CheckCircle2,
  Box, 
  Link as LinkIcon, 
  FunctionSquare, 
  Play, 
  GitMerge, 
  Shield, 
  Tag, 
  Info,
  RefreshCw,
  Server,
  Layers,
  LayoutGrid,
  Menu,
  FileText
} from 'lucide-react';

interface CreateModelWizardProps {
  onCancel: () => void;
  onComplete: () => void;
}

export default function CreateModelWizard({ onCancel, onComplete }: CreateModelWizardProps) {
  const [selectedTemplate, setSelectedTemplate] = useState('standard');

  const steps = [
    { id: 1, title: '基础信息', status: 'completed', desc: '已完成' },
    { id: 2, title: '选择模型模板', status: 'current', desc: '进行中' },
    { id: 3, title: '启用能力包', status: 'upcoming', desc: '未开始' },
    { id: 4, title: '预览生成内容', status: 'upcoming', desc: '未开始' },
    { id: 5, title: '创建草稿模型', status: 'upcoming', desc: '未开始' },
  ];

  const Node = ({ title }: { title: string }) => (
    <div className="border border-blue-200 bg-white rounded flex items-center justify-center text-[10px] text-blue-700 font-medium px-2 py-1 shadow-sm shrink-0">
      {title}
    </div>
  );

  return (
    <div className="min-h-full bg-white font-sans flex flex-col">
      {/* Top Header */}
      <div className="pt-6 px-8 bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-3 text-[13px] text-slate-600 font-medium mb-4">
          <Menu className="w-5 h-5 text-slate-800 cursor-pointer" />
          <span className="text-slate-400">管理中心</span> <span className="text-slate-300">/</span> <span className="text-slate-400">本体管理</span> <span className="text-slate-300">/</span> <span className="text-slate-400">DRKN 本体模型</span> <span className="text-slate-300">/</span> <span className="font-bold text-slate-800">新建模型</span>
        </div>
        
        <div className="flex items-center justify-between pb-5">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">新建 DRKN 本体模型</h1>
            <p className="text-sm text-slate-500 mt-1">选择治理模板与能力包，快速生成标准 DRKN 本体模型</p>
            
            <div className="flex items-center gap-3 mt-4">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600">
                <Server className="w-3.5 h-3.5 text-blue-500" />
                Scope: DRKN
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600">
                <Layers className="w-3.5 h-3.5 text-blue-500" />
                本体类型: 数据语义治理
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600">
                <LayoutGrid className="w-3.5 h-3.5 text-blue-500" />
                创建方式: 模板创建
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={onCancel}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-bold transition-all shadow-sm cursor-pointer"
            >
              取消
            </button>
            <button 
              className="px-4 py-2 bg-white border border-blue-200 hover:bg-blue-50 text-blue-600 rounded-lg text-sm font-bold transition-all shadow-sm cursor-pointer"
            >
              保存草稿
            </button>
            <button 
              onClick={onComplete}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-all shadow-sm cursor-pointer border border-blue-600"
            >
              创建模型
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar Steps */}
        <div className="w-64 bg-[#f8fafc] border-r border-slate-200 p-8 overflow-y-auto shrink-0 relative">
          <div className="absolute left-[47px] top-[48px] bottom-16 w-0.5 bg-slate-200 z-0"></div>
          
          <div className="space-y-8 relative z-10">
            {steps.map((step) => {
              const isCompleted = step.status === 'completed';
              const isCurrent = step.status === 'current';
              
              return (
                <div key={step.id} className="flex gap-4">
                  <div className="shrink-0 mt-0.5">
                    {isCompleted ? (
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center border-4 border-white shadow-sm">
                        <Check className="w-4 h-4 text-white stroke-[3]" />
                      </div>
                    ) : isCurrent ? (
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center border-4 border-blue-100 shadow-sm text-white font-bold text-sm">
                        {step.id}
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-100 border-4 border-white flex items-center justify-center text-slate-400 font-bold text-sm">
                        {step.id}
                      </div>
                    )}
                  </div>
                  <div className={`mt-1.5 ${isCurrent ? 'bg-white px-4 py-2.5 rounded-lg border border-blue-200 shadow-sm -mt-2 -ml-2 -mr-2' : ''}`}>
                    <div className={`text-sm font-bold ${isCurrent ? 'text-blue-700' : isCompleted ? 'text-slate-800' : 'text-slate-500'}`}>
                      {step.title}
                    </div>
                    <div className={`text-[11px] mt-1 ${isCurrent ? 'text-blue-500 font-semibold' : 'text-slate-400'}`}>
                      {step.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center Template Selection */}
        <div className="flex-1 overflow-y-auto p-8 bg-white border-r border-slate-200">
          <div className="mb-6">
            <h2 className="text-xl font-extrabold text-slate-900">选择模型模板</h2>
            <p className="text-sm text-slate-500 mt-1.5">请基于标准模板快速创建 DRKN 本体模型，避免从零自由定义全部 Object Type。</p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            {/* Template 1 */}
            <div 
              onClick={() => setSelectedTemplate('basic')}
              className={`border rounded-xl p-6 cursor-pointer transition-all relative ${
                selectedTemplate === 'basic' 
                  ? 'border-blue-500 bg-blue-50/20 shadow-md ring-1 ring-blue-500/20' 
                  : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-[15px] font-extrabold text-slate-900">基础闭环模型</h3>
                <span className="px-2 py-0.5 bg-emerald-100/60 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200/50">最小闭环</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mb-6 h-10">
                适合快速启动，只完成“扫描—语义断言—证据—审核—快照”的最小闭环。
              </p>
              
              <div className="space-y-5">
                <div>
                  <div className="flex items-center gap-1.5 text-[11.5px] font-bold text-slate-700 hover:text-blue-600 mb-2">
                    <Box className="w-3.5 h-3.5 text-blue-500" />
                    启用对象
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">DataSource、DataAsset、Field、<br/>SemanticAssertion、Evidence、Run、Snapshot</p>
                </div>
                
                <div>
                  <div className="flex items-center gap-1.5 text-[11.5px] font-bold text-slate-700 mb-2">
                    <FunctionSquare className="w-3.5 h-3.5 text-blue-500" />
                    启用能力
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">profileField、classifyFieldSemantic、<br/>computeSemanticScore</p>
                </div>
                
                <div>
                  <div className="flex items-center gap-1.5 text-[11.5px] font-bold text-slate-700 mb-2">
                    <GitMerge className="w-3.5 h-3.5 text-blue-500" />
                    启用流程
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">MetadataScanWorkflow、<br/>SemanticReviewWorkflow、<br/>SnapshotPublishWorkflow</p>
                </div>
              </div>

              <div className="mt-8 flex justify-center">
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  selectedTemplate === 'basic' ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                }`}>
                  {selectedTemplate === 'basic' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                </div>
              </div>
            </div>

            {/* Template 2: Standard */}
            <div 
              onClick={() => setSelectedTemplate('standard')}
              className={`border rounded-xl p-6 cursor-pointer transition-all relative ${
                selectedTemplate === 'standard' 
                  ? 'border-blue-500 bg-blue-50/20 shadow-md ring-1 ring-blue-500/20' 
                  : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              {selectedTemplate === 'standard' && (
                <div className="absolute -top-3 -right-3 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-sm">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-[15px] font-extrabold text-slate-900">标准治理模型</h3>
                <span className="px-2 py-0.5 bg-blue-100/60 text-blue-700 text-[10px] font-bold rounded-full border border-blue-200/50">推荐</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mb-6 h-10">
                适合正式数据治理场景，包含语义识别、证据、数据质量、治理任务和快照发布。
              </p>
              
              <div className="space-y-5">
                <div>
                  <div className="flex items-center gap-1.5 text-[11.5px] font-bold text-slate-700 mb-2">
                    <Box className="w-3.5 h-3.5 text-blue-500" />
                    启用对象
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">DataSource、DataAsset、Field、<br/>SemanticAssertion、Evidence、DataQualityRule、<br/>DataIssue、GovernanceTask、Run、Snapshot</p>
                </div>
                
                <div>
                  <div className="flex items-center gap-1.5 text-[11.5px] font-bold text-slate-700 mb-2">
                    <FunctionSquare className="w-3.5 h-3.5 text-blue-500" />
                    启用能力
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">字段画像、主外键识别、语义评分、质量评分、<br/>冲突检测</p>
                </div>
                
                <div>
                  <div className="flex items-center gap-1.5 text-[11.5px] font-bold text-slate-700 mb-2">
                    <GitMerge className="w-3.5 h-3.5 text-blue-500" />
                    启用流程
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">MetadataScanWorkflow、SemanticReviewWorkflow、<br/>DQAssessmentWorkflow、IssueRemediationWorkflow、<br/>SnapshotPublishWorkflow</p>
                </div>
              </div>

              <div className="mt-8 flex justify-center">
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  selectedTemplate === 'standard' ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                }`}>
                  {selectedTemplate === 'standard' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                </div>
              </div>
            </div>

            {/* Template 3: Full */}
            <div 
              onClick={() => setSelectedTemplate('full')}
              className={`border rounded-xl p-6 cursor-pointer transition-all relative ${
                selectedTemplate === 'full' 
                  ? 'border-blue-500 bg-blue-50/20 shadow-md ring-1 ring-blue-500/20' 
                  : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-[15px] font-extrabold text-slate-900">全量治理模型</h3>
                <span className="px-2 py-0.5 bg-purple-100/60 text-purple-700 text-[10px] font-bold rounded-full border border-purple-200/50">高级</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mb-6 h-10">
                适合成熟治理体系，包含 DRKN → DKN 晋升与 AI 反馈回流。
              </p>
              
              <div className="space-y-5">
                <div>
                  <div className="flex items-center gap-1.5 text-[11.5px] font-bold text-slate-700 mb-2">
                    <Box className="w-3.5 h-3.5 text-blue-500" />
                    启用对象
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">标准治理模型全部对象 +<br/>CandidateSignal、PromotionRecord、AIFeedback</p>
                </div>
                
                <div>
                  <div className="flex items-center gap-1.5 text-[11.5px] font-bold text-slate-700 mb-2">
                    <FunctionSquare className="w-3.5 h-3.5 text-blue-500" />
                    启用能力
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">候选信号生成、Owner 推荐、AI 反馈分析、<br/>晋升流程</p>
                </div>
                
                <div>
                  <div className="flex items-center gap-1.5 text-[11.5px] font-bold text-slate-700 mb-2">
                    <GitMerge className="w-3.5 h-3.5 text-blue-500" />
                    启用流程
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">CandidatePromotionWorkflow、<br/>AIFeedbackGovernanceWorkflow</p>
                </div>
              </div>

              <div className="mt-8 flex justify-center">
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  selectedTemplate === 'full' ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                }`}>
                  {selectedTemplate === 'full' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2 bg-blue-50/50 border border-blue-100 rounded-lg p-4 text-xs font-semibold text-blue-800">
             <Info className="w-4 h-4 text-blue-500 shrink-0" />
             建议优先使用标准治理模型，以便快速建立数据语义治理闭环。
          </div>
        </div>

        {/* Right Sidebar Preview */}
        <div className="w-[400px] xl:w-[460px] bg-[#f8fafc] p-8 overflow-y-auto shrink-0 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-extrabold text-slate-900">将创建的模型内容</h3>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 cursor-pointer hover:text-slate-700">
              <RefreshCw className="w-3 h-3" /> 实时预览
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
             <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex items-start gap-3 shadow-xs">
               <Box className="w-5 h-5 text-blue-500 mt-0.5" />
               <div>
                 <div className="text-[11px] text-slate-500 font-medium leading-none mb-1.5">Object Type</div>
                 <div className="text-[17px] font-black text-slate-800 leading-none">10</div>
               </div>
             </div>
             
             <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex items-start gap-3 shadow-xs">
               <LinkIcon className="w-4 h-4 text-blue-500 mt-1" />
               <div>
                 <div className="text-[11px] text-slate-500 font-medium leading-none mb-1.5">Link Type</div>
                 <div className="text-[17px] font-black text-slate-800 leading-none">18</div>
               </div>
             </div>

             <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex items-start gap-3 shadow-xs">
               <div className="text-blue-500 font-bold italic w-5 h-5 flex items-center justify-center text-sm">fx</div>
               <div>
                 <div className="text-[11px] text-slate-500 font-medium leading-none mb-1.5">Function</div>
                 <div className="text-[17px] font-black text-slate-800 leading-none">12</div>
               </div>
             </div>

             <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex items-start gap-3 shadow-xs">
               <Play className="w-4 h-4 text-blue-500 mt-1" />
               <div>
                 <div className="text-[11px] text-slate-500 font-medium leading-none mb-1.5">Action</div>
                 <div className="text-[17px] font-black text-slate-800 leading-none">16</div>
               </div>
             </div>

             <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex items-start gap-3 shadow-xs">
               <GitMerge className="w-4 h-4 text-blue-500 mt-1" />
               <div>
                 <div className="text-[11px] text-slate-500 font-medium leading-none mb-1.5">Workflow</div>
                 <div className="text-[17px] font-black text-slate-800 leading-none">6</div>
               </div>
             </div>

             <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex items-start gap-3 shadow-xs">
               <Shield className="w-4 h-4 text-blue-500 mt-1" />
               <div>
                 <div className="text-[11px] text-slate-500 font-medium leading-none mb-1.5">Permission Policy</div>
                 <div className="text-[17px] font-black text-slate-800 leading-none">4</div>
               </div>
             </div>

             <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex items-start gap-3 shadow-xs">
               <Tag className="w-4 h-4 text-blue-500 mt-1" />
               <div>
                 <div className="text-[11px] text-slate-500 font-medium leading-none mb-1.5">初始版本</div>
                 <div className="text-[17px] font-black text-slate-800 leading-none">v0.1.0</div>
               </div>
             </div>

             <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex items-start gap-3 shadow-xs">
               <div className="w-2 h-2 rounded-full bg-slate-400 mt-1.5"></div>
               <div>
                 <div className="text-[11px] text-slate-500 font-medium leading-none mb-1.5">模型状态</div>
                 <div className="inline-flex items-center justify-center px-1.5 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 rounded text-[10px] font-bold">
                   Draft
                 </div>
               </div>
             </div>
          </div>

          {/* Structure Preview */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
             <h4 className="text-[13px] font-bold text-slate-800 mb-4">结构预览</h4>
             <div className="relative h-[120px]">
               <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                 <defs>
                   <marker id="arrowhead-small" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                     <polygon points="0 0, 6 3, 0 6" fill="#94a3b8" />
                   </marker>
                 </defs>
                 
                 <line x1="16%" y1="20%" x2="25%" y2="20%" stroke="#94a3b8" strokeWidth="1" markerEnd="url(#arrowhead-small)" />
                 <line x1="41%" y1="20%" x2="50%" y2="20%" stroke="#94a3b8" strokeWidth="1" markerEnd="url(#arrowhead-small)" />
                 <line x1="66%" y1="20%" x2="75%" y2="20%" stroke="#94a3b8" strokeWidth="1" markerEnd="url(#arrowhead-small)" />
                 <line x1="91%" y1="20%" x2="100%" y2="20%" stroke="#94a3b8" strokeWidth="1" markerEnd="url(#arrowhead-small)" />
                 
                 <path d="M 50% 30% L 50% 75% L 58%" fill="none" stroke="#94a3b8" strokeWidth="1" markerEnd="url(#arrowhead-small)" strokeLinejoin="round" />
                 
                 <line x1="75%" y1="75%" x2="83%" y2="75%" stroke="#94a3b8" strokeWidth="1" markerEnd="url(#arrowhead-small)" />
               </svg>

               <div className="absolute inset-0 grid grid-cols-6 grid-rows-2">
                 <div className="col-start-1 row-start-1 flex items-center justify-center"><Node title="DataSource" /></div>
                 <div className="col-start-2 row-start-1 flex items-center justify-center"><Node title="DataAsset" /></div>
                 <div className="col-start-3 row-start-1 flex items-center justify-center"><Node title="Field" /></div>
                 <div className="col-start-4 row-start-1 flex items-center justify-center"><Node title="SemanticAssertion" /></div>
                 <div className="col-start-5 row-start-1 flex items-center justify-center"><Node title="Evidence" /></div>
                 <div className="col-start-6 row-start-1 flex items-center justify-center"><Node title="Snapshot" /></div>
                 
                 <div className="col-start-4 row-start-2 flex items-center justify-center"><Node title="DataQualityRule" /></div>
                 <div className="col-start-5 row-start-2 flex items-center justify-center"><Node title="DataIssue" /></div>
                 <div className="col-start-6 row-start-2 flex items-center justify-center"><Node title="GovernanceTask" /></div>
               </div>
             </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <h4 className="text-[13px] font-bold text-slate-800 mb-3">治理机制 <span className="text-[11px] font-medium text-slate-500 ml-1">(所有修改进入 Change Set)</span></h4>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center mt-0.5 shrink-0">
                  <FileText className="w-3 h-3 text-slate-600" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-700">Change Set</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">创建后自动生成初始 Change Set</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center mt-0.5 shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-slate-600" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-700">校验项</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">模型结构校验 / 影响分析 / 发布审核</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center mt-0.5 shrink-0">
                  <Play className="w-3 h-3 text-slate-600" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-700">发布路径</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">草稿 → 待审核 → 已发布</div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Bottom Footer Area */}
      <div className="bg-white border-t border-slate-200 py-4 px-8 flex justify-center items-center gap-4 shrink-0">
         <button className="px-6 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-bold transition-all shadow-sm cursor-pointer w-32">
           上一步
         </button>
         <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 rounded-lg text-sm font-bold transition-all shadow-sm cursor-pointer w-32">
           下一步
         </button>
         <button 
          onClick={onComplete}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 rounded-lg text-sm font-bold transition-all shadow-sm cursor-pointer ml-4"
         >
           创建草稿模型
         </button>
      </div>

    </div>
  );
}
