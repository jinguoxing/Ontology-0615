import React, { useState } from 'react';
import { DRKNWorkflow, WorkflowNode } from '../types';
import { 
  Play, Settings, FileText, Compass, ClipboardCopy, 
  Layers, ShieldAlert, Activity, FileCheck, HelpCircle,
  Clock, CheckCircle, AlertTriangle, ArrowRight, CornerDownRight,
  Info, Cpu, Shield, UserCheck, Search, Sparkles
} from 'lucide-react';

interface WorkflowOrchestratorProps {
  workflows: DRKNWorkflow[];
  onNavigate: (view: string, targetId?: string) => void;
  isEditingActive: boolean;
}

export default function WorkflowOrchestrator({
  workflows,
  onNavigate,
  isEditingActive
}: WorkflowOrchestratorProps) {

  const [activeWfId, setActiveWfId] = useState<string>('SemanticReviewWorkflow');
  const activeWf = workflows.find(w => w.id === activeWfId) || workflows[0];

  // Selected Node in workflow diagram
  const [selectedNodeId, setSelectedNodeId] = useState<string>('W2-N3'); // default to computeSemanticScore node

  // Simulation execution state
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStep, setSimulationStep] = useState<number>(-1);
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);

  const getNodeIcon = (type: string, className = "h-4 w-4 text-slate-600") => {
    switch (type) {
      case 'Trigger': return <Clock className={`${className} text-blue-600`} />;
      case 'Function': return <Settings className={`${className} text-teal-600`} />;
      case 'Action': return <Play className={`${className} text-purple-600`} />;
      case 'Condition': return <Layers className={`${className} text-amber-600`} />;
      case 'HumanReview': return <UserCheck className={`${className} text-orange-600`} />;
      case 'Audit': return <Shield className={`${className} text-slate-600`} />;
      default: return <HelpCircle className={className} />;
    }
  };

  const getSelectedNodeDetails = () => {
    if (!activeWf) return null;
    const node = activeWf.nodes.find(n => n.id === selectedNodeId);
    if (!node) return activeWf.nodes[0];
    return node;
  };

  const activeNode = getSelectedNodeDetails();

  // Run a simulated step-by-step execution!
  const runSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimulationStep(0);
    setSimulationLogs(["[SYSTEM] 🟢 初始化 DRKN Workflow 调试模拟容器...", `[SYSTEM] 🔔 加载流程模板: [${activeWf.name}]`, "[SYSTEM] 🔍 检测到 1 个依赖的模型: Field"]);

    const steps = activeWf.nodes;
    let currentIdx = 0;

    const interval = setInterval(() => {
      if (currentIdx < steps.length) {
        const node = steps[currentIdx];
        setSimulationStep(currentIdx);
        setSimulationLogs(prev => [
          ...prev, 
          `[STEP ${currentIdx + 1}/${steps.length}] 🚀 正在执行 ${node.type} 节点: ${node.label}...`,
          `[DETAIL] ${node.description}`,
          `[RESULT] ✅ ${node.label} 执行成功. Output: SUCCESS_COMPLETED_STATUS`
        ]);
        currentIdx++;
      } else {
        clearInterval(interval);
        setSimulationLogs(prev => [
          ...prev, 
          `[SYSTEM] ✨ 流程全链跑通！运行成功率: ${activeWf.successRate}%.`,
          `[SYSTEM] 💾 审计归档记录已登记在 Run 控制单元。`,
          `[SYSTEM] 🔄 知识图谱 DKN 及 AI 调试网可用能力已完成增量同步。`
        ]);
        setIsSimulating(false);
        setSimulationStep(steps.length);
      }
    }, 2000);
  };

  const handleSelectNode = (id: string) => {
    setSelectedNodeId(id);
  };

  return (
    <div className="space-y-6" id="workflow-workspace">
      
      {/* 顶部标题与快操作 */}
      <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-slate-900">DRKN 语义治理确定性流程定义 (Workflow Def)</h2>
          <p className="text-xs text-slate-500">
            不同于一般基于 Prompt 的不确定性 AI Agent，治理流程由高度确定的条件判断、算式计算、人工审核和审计动作共同定义。
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={runSimulation}
            disabled={isSimulating}
            className={`px-4 py-2 text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 ${
              isSimulating 
                ? 'bg-amber-100 text-amber-700 cursor-not-allowed animate-pulse' 
                : 'bg-slate-900 hover:bg-slate-800 text-slate-100 cursor-pointer'
            }`}
          >
            <Play className="h-4.5 w-4.5 fill-current" />
            {isSimulating ? '流程模拟演练中...' : '启动沙箱模拟演练'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 左栏：工作流分类 */}
        <div className="lg:col-span-3 bg-white border border-slate-205 rounded-xl p-4 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
            治理流程资产 (Workflows)
          </h3>

          <div className="space-y-1.5">
            {workflows.map((wf) => (
              <div
                key={wf.id}
                onClick={() => {
                  setActiveWfId(wf.id);
                  setSelectedNodeId(wf.nodes[0]?.id || '');
                  // Clear simulation
                  setIsSimulating(false);
                  setSimulationStep(-1);
                  setSimulationLogs([]);
                }}
                className={`p-3 rounded-lg flex flex-col gap-1 cursor-pointer transition-all border ${
                  wf.id === activeWf.id
                    ? 'bg-blue-50 border-blue-200 text-blue-900 shadow-xs'
                    : 'hover:bg-slate-50 border-transparent text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono">{wf.name}</span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1 py-0.2 rounded font-semibold uppercase">
                    Active
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-normal leading-normal line-clamp-2">
                  {wf.description}
                </p>
                
                <div className="flex items-center justify-between text-[10px] text-slate-450 border-t border-slate-100/50 mt-1.5 pt-1.5 font-medium">
                  <span>运行 {wf.runCount} 次</span>
                  <span>成功率 {wf.successRate}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 中栏：流程可视画布（垂直树模型） */}
        <div className="lg:col-span-6 bg-white border border-slate-205 rounded-xl p-6 shadow-sm min-h-[500px] flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-50 pb-2">
              <h3 className="text-sm font-bold text-slate-905 font-mono">
                {activeWf.name} 主流程拓扑
              </h3>
              <p className="text-xs text-slate-500">
                包含 {activeWf.nodes.length} 个核心配置控制节点 (点击节点查看变量定义)
              </p>
            </div>

            {/* Vertical Flow Diagram */}
            <div className="border border-dashed border-slate-200 rounded-xl bg-slate-50/50 p-6 min-h-[360px] flex flex-col items-center gap-4 py-8">
              {activeWf.nodes.map((node, idx) => {
                const isSelected = node.id === selectedNodeId;
                const isExecutedInSimulation = idx <= simulationStep;
                
                return (
                  <React.Fragment key={node.id}>
                    {/* Node block */}
                    <div
                      onClick={() => handleSelectNode(node.id)}
                      className={`w-72 p-3 rounded-lg border-2 text-left cursor-pointer transition-all flex items-start gap-2.5 relative group ${
                        isSelected
                          ? 'bg-blue-50 border-blue-600 shadow-md transform -translate-y-0.5'
                          : isExecutedInSimulation
                          ? 'bg-emerald-50/70 border-emerald-500 text-slate-700'
                          : 'bg-white border-slate-200 hover:border-slate-350 text-slate-700'
                      }`}
                    >
                      {/* Connection indices */}
                      <span className="absolute -left-7 top-1/2 -translate-y-1/2 h-5 w-5 bg-slate-250 text-slate-700 border border-slate-300 text-[10px] font-bold rounded-full flex items-center justify-center pointer-events-none">
                        {idx + 1}
                      </span>

                      {/* Simulation checkbox status indicator */}
                      {isSimulating && isExecutedInSimulation && (
                        <span className="absolute -right-3 -top-1 bg-emerald-500 text-white p-0.5 rounded-full shadow-xs">
                          <CheckCircle className="h-3 w-3" />
                        </span>
                      )}

                      <div className="p-1.5 bg-slate-50 rounded shrink-0 group-hover:bg-slate-100">
                        {getNodeIcon(node.type, "h-4.5 w-4.5")}
                      </div>

                      <div className="space-y-0.5 truncate">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600">{node.label}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate">{node.type} Node</p>
                      </div>
                    </div>

                    {/* Sequential Connector */}
                    {idx < activeWf.nodes.length - 1 && (
                      <div className="w-0.5 h-6 bg-slate-200 relative flex items-center justify-center">
                        <div className="absolute top-1 border-r-[6px] border-r-transparent border-l-[6px] border-l-transparent border-t-[8px] border-t-slate-300"></div>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-350 flex items-center gap-1">
            <span>💡 点击任意节点，在右侧面板上查看输入源、输出格式与执行角色条件。</span>
          </div>
        </div>

        {/* 右栏：所选节点的属性/变量解析 */}
        <div className="lg:col-span-3 space-y-6">
          
          <div className="bg-white border border-slate-205 rounded-xl p-5 shadow-sm space-y-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">
              节点参数定义 (Inspector)
            </h3>

            {activeNode ? (
              <div className="space-y-4 text-xs">
                <div>
                  <span className="px-2 py-0.5 text-[9px] font-bold bg-slate-100 text-slate-700 rounded-sm uppercase tracking-wide">
                    {activeNode.type} 节点配置
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 mt-1">{activeNode.label}</h4>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-slate-650 leading-relaxed space-y-1">
                  <p className="text-slate-400 font-semibold uppercase text-[9px]">节点作用定位:</p>
                  <p className="text-slate-700">{activeNode.description}</p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-0.5">
                    <p className="text-slate-450 uppercase font-bold text-[9px]">输入数据或触发模式:</p>
                    <p className="p-2 bg-slate-50 border border-slate-100 font-mono text-slate-810 rounded">
                      {activeNode.type === 'Trigger' ? 'Event: ObjectLifecycleTrigger' : 'Context: active_field_properties'}
                    </p>
                  </div>

                  <div className="space-y-0.5">
                    <p className="text-slate-450 uppercase font-bold text-[9px]">输出及执行状态:</p>
                    <p className="p-2 bg-slate-50 border border-slate-100 font-mono text-slate-810 rounded">
                      {activeNode.type === 'Condition' ? 'Branch: Approved_Flow | Escalate_Flow' : 'Payload: SUCCESS_CALLBACK_DTO'}
                    </p>
                  </div>

                  <div className="space-y-2 border-t border-slate-100 pt-2.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-600">
                      <span>失败容错策略:</span>
                      <span className="font-semibold text-rose-700 font-mono">中断并分拨人工任务</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-600">
                      <span>要求最少执行人:</span>
                      <span className="font-semibold text-slate-800">系统内部任务队列</span>
                    </div>
                  </div>
                </div>

                {activeNode.type === 'Function' && (
                  <button 
                    onClick={() => onNavigate('capability_binding', 'Field')}
                    className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-150 transition-colors flex items-center justify-center gap-1 font-semibold text-[11px] cursor-pointer"
                  >
                    跳转修改绑定的 Function 详情
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">暂未选择节点</p>
            )}
          </div>

          {/* 模拟运行调试控制台 */}
          {(isSimulating || simulationLogs.length > 0) && (
            <div className="bg-slate-900 text-slate-100 rounded-xl p-4 shadow-lg space-y-3 font-mono text-[10.5px]">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-amber-400 font-bold flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                  沙箱运行控制台
                </span>
                <button 
                  onClick={() => {
                    setIsSimulating(false);
                    setSimulationStep(-1);
                    setSimulationLogs([]);
                  }}
                  className="text-slate-400 hover:text-white"
                >
                  清除
                </button>
              </div>

              {/* Logs area */}
              <div className="space-y-2 h-44 overflow-y-auto leading-relaxed scrollbar-thin scrollbar-thumb-slate-800">
                {simulationLogs.map((log, idx) => (
                  <p key={idx} className={
                    log.startsWith('[SYSTEM]') ? 'text-blue-400' :
                    log.startsWith('[STEP') ? 'text-purple-300 font-bold' :
                    log.startsWith('[DETAIL]') ? 'text-slate-400 pl-4' : 'text-emerald-400 font-medium pl-4'
                  }>
                    {log}
                  </p>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
