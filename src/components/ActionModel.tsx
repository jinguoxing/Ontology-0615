import React, { useState } from 'react';
import {
  Plus, Search, ChevronDown, CheckCircle2, MoreHorizontal, Settings, Info, Filter, ArrowRight,
  Database, Layers, Type, Compass, ShieldCheck, CheckSquare, AlertTriangle, Play, Camera,
  X, ExternalLink, RefreshCw, Download, GitBranch, ArrowUpRight, HelpCircle,
  Box, FileText, Shield, FileCode, Target, Sparkles, GitMerge, LayoutGrid
} from 'lucide-react';
import type { ObjectType } from '../types';
import CreateActionDrawer from './CreateActionDrawer';
import {useObjectTypes} from '../hooks/useOntology';
import {useUiStore} from '../store/uiStore';

interface ActionDetailData {
  name: string;
  zh: string;
  type: string;
  target: string;
  change: string;
  status: '已发布' | '编辑中' | '草稿' | '待审核';
  domain: string;
  cs: string;
  lastUpdate: string;
  createdTime: string;
  description: string;
  stateChange: { from: string; to: string } | null;
  prerequisites: string[];
  postEffects: string[];
}

export default function ActionModel() {
  const {data: objectTypes = []} = useObjectTypes();
  const navigate = useUiStore((s) => s.navigate);
  const isEditingActive = !useUiStore((s) => s.isLocked);
  const selectedObjectId = useUiStore((s) => s.selectedObjectId);
  const onSelectObject = useUiStore((s) => s.setSelectedObjectId);

  // Tabs mapped from mockup image
  const tabs = [
    '模型总览', '对象模型', '关系模型', '能力绑定', '动作 (Action)', 
    '流程 (Workflow)', '权限策略', '版本与发布', '变更集'
  ];

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [objSearchTerm, setObjSearchTerm] = useState('');
  
  // Filters states
  const [filterObjType, setFilterObjType] = useState('全部开发对象'); // standard all
  const [filterStatus, setFilterStatus] = useState('全部状态');
  const [filterType, setFilterType] = useState('全部类型');

  // Dynamic grouping logic to include standard enabled objects AND custom ones
  const knownKeys = ['DataSource', 'DataAsset', 'Field', 'SemanticAssertion', 'Evidence', 'AIFeedback', 'CandidateSignal', 'DataQualityRule', 'DataIssue', 'GovernanceTask', 'Run', 'Snapshot', 'PromotionRecord'];
  const customObjs = objectTypes.filter(obj => !knownKeys.includes(obj.id));
  
  const groups = [
    {
      name: "核心数据对象",
      keys: ['DataSource', 'DataAsset', 'Field']
    },
    {
      name: "语义治理对象",
      keys: ['SemanticAssertion', 'Evidence', 'AIFeedback', 'CandidateSignal'].filter(k => objectTypes.some(o => o.id === k))
    },
    {
      name: "质量治理对象",
      keys: ['DataQualityRule', 'DataIssue'].filter(k => objectTypes.some(o => o.id === k))
    },
    {
      name: "运行治理对象",
      keys: ['GovernanceTask', 'Run', 'Snapshot', 'PromotionRecord'].filter(k => objectTypes.some(o => o.id === k))
    }
  ];

  if (customObjs.length > 0) {
    groups.push({
      name: "扩展治理对象",
      keys: customObjs.map(o => o.id)
    });
  }

  const getObjectIcon = (id: string, className = "h-4 w-4") => {
    switch (id) {
      case 'DataSource': return <Database className={`${className} text-blue-500`} />;
      case 'DataAsset': return <Box className={`${className} text-blue-500`} />;
      case 'Field': return <FileText className={`${className} text-blue-500`} />;
      case 'SemanticAssertion': return <Shield className={`${className} text-blue-500`} />;
      case 'Evidence': return <FileCode className={`${className} text-blue-500`} />;
      case 'DataQualityRule': return <CheckCircle2 className={`${className} text-blue-500`} />;
      case 'DataIssue': return <AlertTriangle className={`${className} text-red-500`} />;
      case 'GovernanceTask': return <Target className={`${className} text-blue-500`} />;
      case 'Run': return <Play className={`${className} text-blue-500`} />;
      case 'Snapshot': return <Box className={`${className} text-blue-500`} />;
      case 'CandidateSignal': return <Sparkles className={`${className} text-amber-500`} />;
      case 'PromotionRecord': return <GitMerge className={`${className} text-purple-500`} />;
      case 'AIFeedback': return <Shield className={`${className} text-emerald-500`} />;
      default: return <Box className={`${className} text-indigo-500`} />;
    }
  };

  const getMockStats = (id: string) => {
    const stats: Record<string, { count: number, rels: number }> = {
      'DataSource': { count: 128, rels: 8 },
      'DataAsset': { count: 256, rels: 12 },
      'Field': { count: 12842, rels: 16 },
      'SemanticAssertion': { count: 3210, rels: 10 },
      'Evidence': { count: 6589, rels: 9 },
      'DataQualityRule': { count: 342, rels: 6 },
      'DataIssue': { count: 4908, rels: 7 },
      'GovernanceTask': { count: 1204, rels: 8 },
      'Run': { count: 8632, rels: 6 },
      'Snapshot': { count: 2845, rels: 5 },
      'CandidateSignal': { count: 0, rels: 2 },
      'PromotionRecord': { count: 0, rels: 2 },
      'AIFeedback': { count: 0, rels: 2 },
    };
    return stats[id] || { count: 0, rels: 2 };
  };

  // Selected Action for details panel
  const [selectedActionName, setSelectedActionName] = useState<string>('confirmAssertion');
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(true);

  // Actions structured data block matching the mockup image rows
  const actionsData: ActionDetailData[] = [
    { 
      name: 'confirmAssertion', 
      zh: '确认语义断言', 
      type: '状态流转', 
      target: 'SemanticAssertion', 
      change: 'Pending → Confirmed', 
      status: '已发布', 
      domain: 'DRKN', 
      cs: '-', 
      lastUpdate: '2026-08-18 10:15',
      createdTime: '2026-07-28 15:30',
      description: '将待确认的语义断言标记为已确认。',
      stateChange: { from: 'Pending', to: 'Confirmed' },
      prerequisites: [
        'confidence > 0.8',
        '至少 1 条 Evidence',
        '当前用户具备数据治理审核权限',
        'Assertion 未被标记为 Conflict'
      ],
      postEffects: [
        'SemanticAssertion 状态变为 Confirmed',
        '写入 Audit Log',
        '可被 SnapshotPublishWorkflow 使用',
        '可被 AI 工作台作为可信解释依据'
      ]
    },
    { 
      name: 'markUnknown', 
      zh: '标记为未知', 
      type: '状态流转', 
      target: 'SemanticAssertion', 
      change: 'Pending → Unknown', 
      status: '已发布', 
      domain: 'DRKN', 
      cs: '-', 
      lastUpdate: '2026-08-18 10:15',
      createdTime: '2026-07-28 16:00',
      description: '无法完成自动比对或人工确认时，将其标记重置为未知，供后续二次治理工作流调度。',
      stateChange: { from: 'Pending', to: 'Unknown' },
      prerequisites: [
        '无法匹配任何已知领域概念',
        '未通过 AI 自动分类判定置信度判定 (置信度 < 0.5)',
        '已具备基础扫描关联'
      ],
      postEffects: [
        '状态更新为 Unknown 并移出活跃候选态',
        '在问题面板自动生成低置信度数据治理追踪任务'
      ]
    },
    { 
      name: 'ignoreAssertion', 
      zh: '忽略语义断言', 
      type: '状态流转', 
      target: 'SemanticAssertion', 
      change: 'Pending → Ignored', 
      status: '已发布', 
      domain: 'DRKN', 
      cs: '-', 
      lastUpdate: '2026-08-18 10:15',
      createdTime: '2026-07-29 09:12',
      description: '排查确认该断言为噪音或不具备治理价值时，通过此动作予以忽略。',
      stateChange: { from: 'Pending', to: 'Ignored' },
      prerequisites: [
        '用户手动标记为低优先级且无需审计',
        '具备可信忽略的策略条件设定'
      ],
      postEffects: [
        '在此后的网络拓扑大图中隐藏本断言显示',
        '自动在阻断校验名单中将其豁免标记'
      ]
    },
    { 
      name: 'createAssertion', 
      zh: '创建语义断言', 
      type: '创建', 
      target: 'SemanticAssertion', 
      change: 'None → Pending', 
      status: '已发布', 
      domain: 'DRKN', 
      cs: '-', 
      lastUpdate: '2026-08-18 10:15',
      createdTime: '2026-08-01 11:30',
      description: '为特定的外部数据资产或映射模型节点新建一条语义断言声明。',
      stateChange: { from: 'None', to: 'Pending' },
      prerequisites: [
        '关联的 Field / DataAsset 已经生效且非下线状态',
        '未发生语义断言属性名完全冲突'
      ],
      postEffects: [
        '生成一条处于待核验态 (Pending) 的核心断言实体',
        '触发 AI 自动首值语义置信值预测计算'
      ]
    },
    { 
      name: 'createDataAsset', 
      zh: '创建数据资产', 
      type: '创建', 
      target: 'DataAsset', 
      change: 'None → Registered', 
      status: '已发布', 
      domain: 'DRKN', 
      cs: '-', 
      lastUpdate: '2026-08-18 10:15',
      createdTime: '2026-08-02 12:45',
      description: '标准数据管道或手动在治理平台上注册一个全新的受控标准数据资产实体。',
      stateChange: { from: 'None', to: 'Registered' },
      prerequisites: [
        '外部数据源 DataSource 已完成活性及联通探测 (Connected)',
        '当前沙箱或元数据层没有同名重复路径资产实体'
      ],
      postEffects: [
        '资产模型及基础元数据正式录入核心元底仓',
        '广播发出跨系统资产拓扑关系网络连结信号'
      ]
    },
    { 
      name: 'assignIssue', 
      zh: '分派数据问题', 
      type: '分派', 
      target: 'DataIssue', 
      change: 'Open → Assigned', 
      status: '已发布', 
      domain: 'DRKN', 
      cs: '-', 
      lastUpdate: '2026-08-18 10:15',
      createdTime: '2026-08-05 14:00',
      description: '将检测或主动上报上来的数据质量/不一致性安全问题指派给特定的治理负责人。',
      stateChange: { from: 'Open', to: 'Assigned' },
      prerequisites: [
        '数据问题工单处于打开状态 (Open), 紧急程度 Level > 0',
        '已在团队通讯录选定特定的拥有治理资质的处理人员'
      ],
      postEffects: [
        '自动在任务协同工作组发送协同消息及系统置顶通知',
        '挂载问题工单状态正式翻转为 Assigned'
      ]
    },
    { 
      name: 'closeIssue', 
      zh: '关闭数据问题', 
      type: '状态流转', 
      target: 'DataIssue', 
      change: 'Open → Closed', 
      status: '编辑中', 
      domain: 'DRKN', 
      cs: 'CS-2026-012', 
      lastUpdate: '2026-08-20 09:42',
      createdTime: '2026-08-10 10:00',
      description: '在验证模型或关联链路已得到根本性或者临时性豁免整改后，彻底关闭本质量问题。',
      stateChange: { from: 'Assigned', to: 'Closed' },
      prerequisites: [
        '附带不低于 50 字的整改原因或豁免策略原因书面说明',
        '经历过新的一轮质量一致性核验没有阻断的高危异常'
      ],
      postEffects: [
        '状态更新为 Closed 并彻底闭环归档历史变动',
        '释放被本问题挂载关联的阻塞发布全局状态锁'
      ]
    },
    { 
      name: 'reopenIssue', 
      zh: '重新打开问题', 
      type: '状态流转', 
      target: 'DataIssue', 
      change: 'Closed → Open', 
      status: '草稿', 
      domain: 'DRKN', 
      cs: 'CS-2026-012', 
      lastUpdate: '2026-08-20 09:42',
      createdTime: '2026-08-11 11:20',
      description: '如果发现关闭的质量缺陷在之后的扫描重新触发，或者之前策略验证被认定不合规，重新唤醒该工单。',
      stateChange: { from: 'Closed', to: 'Open' },
      prerequisites: [
        '该数据质量问题之前曾被合理归档关闭 (Closed)',
        '检测到回归误差指标反弹或者人工重新审评不通过'
      ],
      postEffects: [
        '工单从历史归档库调回活跃阶段, 状态恢复为 Open',
        '生成自动回归故障任务流并及时同步所属治理工程师'
      ]
    },
    { 
      name: 'createGovernanceTask', 
      zh: '创建治理任务', 
      type: '创建', 
      target: 'GovernanceTask', 
      change: 'None → Created', 
      status: '已发布', 
      domain: 'DRKN', 
      cs: '-', 
      lastUpdate: '2026-08-18 10:15',
      createdTime: '2026-08-12 16:10',
      description: '根据规则模型探查断点，自动或手动调度分发建立对应的跟踪处理流水线任务。',
      stateChange: { from: 'None', to: 'Created' },
      prerequisites: [
        '已绑定合法的探查失败资产或者是冲突核验指标',
        '对应岗位责任角色已分配并包含有效在线承接人员'
      ],
      postEffects: [
        '任务实例入库，写入全局治理排期图表看板',
        '开始跟踪 SLA 时限，并在到达预备阈值时进行预警'
      ]
    },
    { 
      name: 'completeGovernanceTask', 
      zh: '完成治理任务', 
      type: '状态流转', 
      target: 'GovernanceTask', 
      change: 'In_Progress → Completed', 
      status: '已发布', 
      domain: 'DRKN', 
      cs: '-', 
      lastUpdate: '2026-08-18 10:15',
      createdTime: '2026-08-14 09:30',
      description: '验证治理结论合规，彻底将工作调度流标记为历史已完成。',
      stateChange: { from: 'In_Progress', to: 'Completed' },
      prerequisites: [
        '所有关联的数据缺陷已全部获得豁免或变绿，核验百分百通过',
        '具备最高权限审计的治理架构团队签字批复状态'
      ],
      postEffects: [
        '发放本次任务承接群体的治理合规积分 KPI',
        '清除阻碍发布或后续节点触发的阻塞节点锁'
      ]
    },
    { 
      name: 'publishSnapshotCandidate', 
      zh: '发布快照候选', 
      type: '发布', 
      target: 'Snapshot', 
      change: 'Draft → Published', 
      status: '已发布', 
      domain: 'DRKN', 
      cs: '-', 
      lastUpdate: '2026-08-15 11:45',
      createdTime: '2026-08-15 11:45',
      description: '对目前稳定的本体配置、实例或全局拓扑网络，冻结打标作为备份级快照，供其他模块订阅。',
      stateChange: { from: 'Draft', to: 'Published' },
      prerequisites: [
        '本体经历了全局语境约束与一致性核对检验合格 (Consistency check pass)',
        '包含当前处于 Ready 状态和已激活状态的全部静态模型数据'
      ],
      postEffects: [
        '快照被格式化打包注入分布式只读备份仓库中',
        '向有需要的业务订阅和消费端发出广播状态拉取指令'
      ]
    },
    { 
      name: 'promoteToDKN', 
      zh: '晋升到 DKN', 
      type: '发布', 
      target: 'Snapshot', 
      change: 'DRKN_Core → DKN_Global', 
      status: '待审核', 
      domain: 'DRKN', 
      cs: 'CS-2026-012', 
      lastUpdate: '2026-08-20 09:42',
      createdTime: '2026-08-16 14:10',
      description: '将经 DRKN 沙箱测试成熟的核心原子指标和本体结构整体向 DKN 行业大网层级进行合并。',
      stateChange: { from: 'DRKN_Core', to: 'DKN_Global' },
      prerequisites: [
        '在所属本期变更集 CS-2026-012 中全部回归诊断结果中不具备红灯或严重缺陷警告',
        '获得 DKN 评审委员会成员过半的业务联合电子签名背书'
      ],
      postEffects: [
        '结构模型无损复制写入 DKN 行业级标杆词汇库和映射核心模型',
        '在 DKN 节点更新拓扑发出跨系统元数据血缘重构指令'
      ]
    }
  ];

  // Helper row icon provider for each Action based on its custom theme
  const getActionRowIcon = (actionName: string) => {
    switch (actionName) {
      case 'confirmAssertion':
        return <div className="w-5.5 h-5.5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-extrabold select-none text-[11px] border border-blue-200">🔘</div>;
      case 'markUnknown':
        return <div className="w-5.5 h-5.5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold select-none text-[11px] border border-emerald-200">✔️</div>;
      case 'ignoreAssertion':
        return <div className="w-5.5 h-5.5 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold select-none text-[11px] border border-teal-200">ℹ️</div>;
      case 'createAssertion':
      case 'createDataAsset':
      case 'createGovernanceTask':
        return <div className="w-5.5 h-5.5 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 font-bold select-none text-[10px] border border-indigo-200">➕</div>;
      case 'assignIssue':
        return <div className="w-5.5 h-5.5 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold select-none text-[10px] border border-amber-200">👤</div>;
      case 'closeIssue':
        return <div className="w-5.5 h-5.5 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold select-none text-[11px] border border-rose-200">⭕</div>;
      case 'reopenIssue':
        return <div className="w-5.5 h-5.5 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold select-none text-[11px] border border-orange-200">🔄</div>;
      case 'completeGovernanceTask':
        return <div className="w-5.5 h-5.5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-500 font-extrabold select-none text-[11px] border border-emerald-200">⭐</div>;
      case 'promoteToDKN':
        return <div className="w-5.5 h-5.5 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 font-extrabold select-none text-[11px] border border-yellow-200">✨</div>;
      default:
        return <div className="w-5.5 h-5.5 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 font-bold border border-blue-100"><Settings className="w-3 h-3" /></div>;
    }
  };

  // Filter actions dynamically
  const filteredActions = actionsData.filter(action => {
    // Left object sidebar trigger filter
    if (selectedObjectId && action.target !== selectedObjectId) {
      return false;
    }
    // Middle panel filter query matches
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      const matchName = action.name.toLowerCase().includes(query);
      const matchZh = action.zh.toLowerCase().includes(query);
      const matchTarget = action.target.toLowerCase().includes(query);
      if (!matchName && !matchZh && !matchTarget) {
        return false;
      }
    }
    // Dropdown filters mapping
    if (filterStatus !== '全部状态' && action.status !== filterStatus) {
      return false;
    }
    if (filterType !== '全部类型' && action.type !== filterType) {
      return false;
    }
    return true;
  });

  // Keep details active
  const activeDetailData = actionsData.find(a => a.name === selectedActionName) || actionsData[0];

  return (
    <div className="flex flex-col h-full relative text-left">
      
      {/* 顶部 Header：100% 遵照设计图样式 */}
      <div className="mb-5 space-y-1.5 shrink-0">
        
        {/* 第一行：面包屑与常驻右侧的变更沙箱指示 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center text-[12px] text-slate-400 font-semibold tracking-wide">
             <span className="hover:text-blue-600 cursor-pointer transition-colors">管理中心</span>
             <span className="mx-2 text-slate-300">/</span>
             <span className="hover:text-blue-600 cursor-pointer transition-colors">本体管理</span>
             <span className="mx-2 text-slate-300">/</span>
             <span className="hover:text-blue-600 cursor-pointer transition-colors">DRKN 本体模型管理</span>
             <span className="mx-2 text-slate-300">/</span>
             <span className="text-slate-800 font-black">动作 (Action)</span>
          </div>

          <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-150 px-3 py-1 rounded-full shadow-2xs">
             <span className="text-[10px] font-bold text-rose-500">当前变更集</span>
             <span className="text-[11px] font-black text-rose-700 font-mono">CS-2026-012</span>
             <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
             <span className="text-[10px] font-extrabold text-[#9a3412] bg-amber-100 px-1 py-0.2 rounded leading-none">Editing</span>
          </div>
        </div>

        {/* 第二行：核心大标题与功能按钮面板 */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
             <div className="flex items-center gap-3">
                <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>DRKN-Core 数据语义治理模型</span>
                </h1>
                <span className="px-2 py-0.5 rounded text-[11px] font-extrabold bg-blue-50 text-blue-600 border border-blue-200 shadow-3xs leading-none">已发布</span>
             </div>
             <div className="flex items-center gap-4 text-[11px] text-slate-450 font-medium">
                <span className="flex items-center gap-1"><span className="font-bold text-slate-650">当前版本:</span> <span className="text-blue-600 font-mono font-black text-[12px]">v1.3.0</span></span>
                <span className="text-slate-200">|</span>
                <span className="flex items-center gap-1"><span className="font-bold text-slate-650">发布于:</span> 2026-08-20 10:30:00</span>
                <span className="text-slate-200">|</span>
                <span className="flex items-center gap-1"><span className="font-bold text-slate-650">发布人:</span> 系统管理员</span>
             </div>
          </div>

          {/* 右侧操作交互栏 */}
          <div className="flex items-center gap-2">
            <button className="px-3.5 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200/50 hover:bg-slate-50/50 hover:text-slate-800 rounded-lg shadow-3xs hover:border-slate-300/80 hover:shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer">
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" /> 版本对比
            </button>
            <button className="px-3.5 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200/50 hover:bg-slate-50/50 hover:text-slate-800 rounded-lg shadow-3xs hover:border-slate-300/80 hover:shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer">
              <Download className="w-3.5 h-3.5 text-slate-400" /> 导出模型
            </button>
            <button className="p-1.5 bg-white border border-slate-200/50 hover:bg-slate-50/50 rounded-lg shadow-3xs hover:border-slate-300/80 hover:shadow-2xs transition-all cursor-pointer">
              <Settings className="w-4 h-4 text-slate-400" />
            </button>
            
            <div className="h-6 w-px bg-slate-200/60 mx-1"></div>
            
            <button 
              onClick={() => setIsDrawerOpen(true)}
              className="px-4 py-1.5 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs hover:shadow-blue-500/10 flex items-center gap-1 cursor-pointer transition-all"
            >
              启用 / 添加 Action <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 选项卡 Tabs 区域：100% 遵照设计图排版 */}
      <div className="flex gap-1.5 mb-5 border-b border-slate-200/80 shrink-0">
        {tabs.map((tab) => (
          <div 
            key={tab}
            onClick={() => {
              if (tab === '模型总览') navigate('overview');
              if (tab === '对象模型') navigate('object_model');
              if (tab === '关系模型') navigate('relation_model');
              if (tab === '能力绑定') navigate('capability_binding');
              if (tab === '动作 (Action)') navigate('action_model');
              if (tab === '流程 (Workflow)') navigate('workflow_orchestration');
              if (tab === '版本与发布') navigate('change_release');
              if (tab === '变更集') navigate('change_release');
            }}
            className={`px-3 pb-2 text-[13px] font-bold cursor-pointer transition-colors relative ${
              tab === '动作 (Action)' 
                ? 'text-blue-600 font-black border-b-[2.5px] border-blue-600 -mb-[1px]' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab}
          </div>
        ))}
      </div>

      {/* 三栏响应式混合容器：左侧导航树、中间主表单、右侧悬浮详情面板 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0 overflow-hidden">
         
         {/* 左栏：Object Type 列表 */}
         <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col overflow-hidden space-y-4">
            <div className="flex items-center justify-between shrink-0 mb-1">
              <h3 className="text-base font-extrabold text-slate-900">对象类型列表</h3>
              <Settings className="w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-600" />
            </div>

            {/* Dotted border trigger inside list view */}
            <button 
              className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 border-2 border-dashed border-blue-200 hover:border-blue-500 hover:bg-blue-50/20 text-blue-600 hover:text-blue-700 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer mb-1 shrink-0"
            >
              <Plus className="w-4.5 h-4.5" />
              <span>启用 / 添加 Object Type</span>
            </button>
            
            <div className="relative shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="搜索对象类型..."
                value={objSearchTerm}
                onChange={(e) => setObjSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-800 font-medium"
              />
            </div>

            {/* Dynamic groupings rendering with scrollbar-thin */}
            <div className="flex-1 overflow-y-auto space-y-6 pt-2 pr-1 scrollbar-thin">
              {/* 1. Special "全部对象类型" item */}
              <div 
                onClick={() => onSelectObject('')}
                className={`p-3 rounded-xl border cursor-pointer select-none transition-all ${
                  !selectedObjectId 
                    ? 'bg-blue-50/50 border-blue-200' 
                    : 'bg-white border-transparent hover:border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg ${!selectedObjectId ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                      <LayoutGrid className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[13px] font-bold text-slate-800 tracking-tight">全部对象类型</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 font-medium">查看所有 Action 动作</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                      {objectTypes.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Group items */}
              {groups.map(group => {
                const matchedObjects = group.keys
                  .map(key => objectTypes.find(o => o.id === key))
                  .filter(Boolean)
                  .filter(o => 
                    o!.id.toLowerCase().includes(objSearchTerm.toLowerCase()) || 
                    o!.nameCn.toLowerCase().includes(objSearchTerm.toLowerCase())
                  ) as ObjectType[];
                
                if (matchedObjects.length === 0) return null;

                return (
                  <div key={group.name} className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <h4 className="text-[12px] font-bold text-slate-500">{group.name}</h4>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">{matchedObjects.length}</span>
                    </div>
                    <div className="space-y-1.5">
                      {matchedObjects.map(obj => {
                        const isActive = obj.id === selectedObjectId;
                        const stats = getMockStats(obj.id);
                        return (
                          <div 
                            key={obj.id}
                            onClick={() => onSelectObject(obj.id)}
                            className={`p-3 rounded-xl border cursor-pointer select-none transition-all ${
                              isActive 
                                ? 'bg-blue-50/50 border-blue-200' 
                                : 'bg-white border-transparent hover:border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`p-1.5 rounded-lg ${isActive ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                                  {getObjectIcon(obj.id, "w-4 h-4")}
                                </div>
                                <div>
                                  <div className="text-[13px] font-bold text-slate-800 font-mono tracking-tight">{obj.id}</div>
                                  <div className="text-[11px] text-slate-500 mt-0.5 font-medium">{obj.nameCn}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-[11px] font-bold text-slate-600">{stats.count > 0 ? stats.count.toLocaleString() : '0'} 实例</div>
                                <div className="mt-1">
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                    obj.status === 'Published' 
                                      ? 'text-emerald-600 bg-emerald-50' 
                                      : 'text-amber-600 bg-amber-50'
                                  }`}>
                                    {obj.status}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

         {/* 【第二栏：主 Action 数据报表】动态伸缩 5/12 或 9/12 */}
         <div className={`bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden shadow-2xs transition-all ${
           isDetailsOpen ? 'lg:col-span-5' : 'lg:col-span-9'
         }`}>
            
            {/* 中间栏大标题与二级检索首部 */}
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/40 shrink-0">
               <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                     <h2 className="text-sm font-black text-slate-900">动作 (Action)</h2>
                     <span className="text-[11px] font-mono font-bold bg-slate-200 text-slate-600 px-1.5 py-0.2 rounded-full">
                       {filteredActions.length}
                     </span>
                  </div>
               </div>
               
               {/* 复合工具检索过滤条 */}
               <div className="grid grid-cols-1 md:flex items-center gap-2 justify-between mt-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      placeholder="搜索 Action 名称 / 中文名 / 作用对象"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500 font-medium placeholder:text-slate-400 transition-all font-sans"
                    />
                  </div>
                  
                  {/* 一套紧凑的下拉打标签过滤器（遵照设计图排版） */}
                  <div className="flex flex-wrap items-center gap-1.5">
                     <div className="relative">
                        <select 
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                          className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] font-bold text-slate-700 pl-2 pr-7 shrink-0 appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        >
                          <option value="全部状态">全部状态</option>
                          <option value="已发布">已发布</option>
                          <option value="编辑中">编辑中</option>
                          <option value="草稿">草稿</option>
                          <option value="待审核">待审核</option>
                        </select>
                        <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                     </div>

                     <div className="relative">
                        <select 
                          value={filterType}
                          onChange={(e) => setFilterType(e.target.value)}
                          className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] font-bold text-slate-700 pl-2 pr-7 shrink-0 appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        >
                          <option value="全部类型">全部类型</option>
                          <option value="状态流转">状态流转</option>
                          <option value="创建">创建</option>
                          <option value="分派">分派</option>
                          <option value="发布">发布</option>
                        </select>
                        <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                     </div>

                     {/* 快速重置按钮 */}
                     {(searchTerm || selectedObjectId || filterStatus !== '全部状态' || filterType !== '全部类型') && (
                        <button 
                          onClick={() => {
                            setSearchTerm('');
                            onSelectObject('');
                            setFilterStatus('全部状态');
                            setFilterType('全部类型');
                          }}
                          className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100/70 cursor-pointer"
                        >
                          清除过滤
                        </button>
                     )}

                     <button 
                        onClick={() => setIsDrawerOpen(true)}
                        className="px-3.5 py-1 text-[11px] font-extrabold bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1 cursor-pointer transition-all shrink-0 shadow-3xs"
                     >
                        + 创建 Action
                     </button>
                  </div>
               </div>
            </div>

            {/* 中间表格：100% 映射设计图列定义及交互样式 */}
            <div className="flex-1 overflow-auto scrollbar-thin">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="bg-slate-50/80 border-b border-slate-200 sticky top-0 z-10">
                        <th className="pl-5 pr-3 py-2 text-[11px] font-black text-slate-500 whitespace-nowrap tracking-wider">Action Name</th>
                        <th className="px-4 py-2 text-[11px] font-black text-slate-500 whitespace-nowrap tracking-wider">中文名</th>
                        <th className="px-4 py-2 text-[11px] font-black text-slate-500 whitespace-nowrap tracking-wider">Action 类型</th>
                        <th className="px-4 py-2 text-[11px] font-black text-slate-500 whitespace-nowrap tracking-wider">作用对象</th>
                        <th className="px-4 py-2 text-[11px] font-black text-slate-500 whitespace-nowrap tracking-wider text-center">状态</th>
                        <th className="px-4 py-2 text-[11px] font-black text-slate-500 whitespace-nowrap tracking-wider">所属域</th>
                        <th className="px-4 py-2 text-[11px] font-black text-slate-500 whitespace-nowrap tracking-wider">所属变更集</th>
                        <th className="px-4 py-2 text-[11px] font-black text-slate-500 whitespace-nowrap tracking-wider">最后更新</th>
                        <th className="px-5 py-2 text-[11px] font-black text-slate-500 text-center w-14">操作</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 select-none">
                     {filteredActions.map((action) => {
                        const isSelected = selectedActionName === action.name;
                        
                        return (
                           <tr 
                             key={action.name} 
                             onClick={() => {
                               setSelectedActionName(action.name);
                               setIsDetailsOpen(true);
                             }}
                             className={`hover:bg-slate-50/50 transition-colors cursor-pointer group ${
                               isSelected 
                                 ? 'bg-blue-50/40 hover:bg-blue-50/60 font-medium' 
                                 : ''
                             }`}
                           >
                              <td className="pl-5 pr-3 py-2.5 text-[12px] font-mono font-bold text-slate-800">
                                 <div className="flex items-center gap-2">
                                    <div className="shrink-0">
                                      {getActionRowIcon(action.name)}
                                    </div>
                                    <span className={isSelected ? 'text-blue-600 font-black' : 'text-slate-850 font-semibold'}>{action.name}</span>
                                 </div>
                              </td>
                              <td className="px-4 py-2.5 text-[11.5px] text-slate-800 font-extrabold">{action.zh}</td>
                              <td className="px-4 py-2.5 text-[11.5px] text-slate-500 font-medium">{action.type}</td>
                              <td className="px-4 py-2.5 text-[11.5px] text-slate-500 font-mono font-semibold">{action.target}</td>
                              <td className="px-4 py-2.5 text-center">
                                 <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold border leading-none ${
                                    action.status === '已发布' ? 'bg-blue-50 text-blue-600 border-blue-200 shadow-3xs' :
                                    action.status === '编辑中' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                                    action.status === '待审核' ? 'bg-yellow-50 text-amber-700 border-amber-200' :
                                    'bg-slate-100 text-slate-500 border-slate-200'
                                 }`}>
                                    {action.status}
                                 </span>
                              </td>
                              <td className="px-4 py-2.5 text-[11.5px] text-slate-450 font-bold">{action.domain}</td>
                              <td className="px-4 py-2.5 text-[11.5px] font-mono text-slate-400 font-semibold">
                                 {action.cs === '-' ? (
                                   <span className="text-slate-300">-</span>
                                 ) : (
                                   <span className="text-slate-500 font-extrabold">{action.cs}</span>
                                 )}
                              </td>
                              <td className="px-4 py-2.5 text-[11px] font-mono text-slate-450 font-medium whitespace-nowrap">
                                 {action.lastUpdate}
                              </td>
                              <td className="px-5 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                                 <button 
                                   onClick={() => alert(`🎛️ 对动作「${action.name}」的操作面板正在完善中`)}
                                   className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                                 >
                                    <MoreHorizontal className="w-3.5 h-3.5" />
                                 </button>
                              </td>
                           </tr>
                        );
                     })}

                     {filteredActions.length === 0 && (
                        <tr>
                           <td colSpan={9} className="px-6 py-16 text-center text-slate-400 text-xs">
                              <Info className="w-6 h-6 mx-auto mb-2 text-slate-350" />
                              暂无符合此过滤条件的 Action 动作配置
                           </td>
                        </tr>
                     )}
                  </tbody>
               </table>
            </div>

            {/* 底底页合算：共 24 条、跳转页码等 */}
            <div className="px-5 py-3 border-t border-slate-200 shrink-0 bg-slate-50/50 flex items-center justify-between text-[11px] text-slate-455 font-bold">
               <span>共 12 条/24条</span>
               <div className="flex items-center gap-3">
                  <div className="flex bg-white rounded-lg border border-slate-200 p-0.5 shadow-3xs">
                     <button className="px-2 py-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-40" disabled>&lt;</button>
                     <button className="px-2.5 py-0.5 bg-blue-600 text-white font-bold rounded">1</button>
                     <button className="px-2.5 py-0.5 hover:bg-slate-50 text-slate-700 rounded" onClick={() => alert("已经是最后一页")}>2</button>
                     <button className="px-2 py-0.5 text-slate-650 hover:text-slate-700">&gt;</button>
                  </div>
                  <div className="relative">
                    <select className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[11px] font-bold text-slate-600 pr-5 appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer">
                      <option>20 条/页</option>
                      <option>10 条/页</option>
                      <option>50 条/页</option>
                    </select>
                    <ChevronDown className="w-2.5 h-2.5 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
               </div>
            </div>
         </div>

         {/* 【第三栏：Action 详情面板】占 4/12 空间 */}
         {isDetailsOpen && (
           <div className="lg:col-span-4 bg-white border border-slate-250 rounded-2xl flex flex-col overflow-hidden shadow-2xs relative">
              
              {/* 详情头部 */}
              <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/40 shrink-0 flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900">Action 详情</span>
                    <span className={`inline-flex px-1.5 py-0.2 rounded text-[10px] font-extrabold ${
                      activeDetailData.status === '已发布' ? 'bg-blue-50 text-blue-600' :
                      activeDetailData.cs !== '-' ? 'bg-orange-50 text-orange-600' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {activeDetailData.status}
                    </span>
                 </div>
                 <div className="flex items-center gap-2">
                    <button 
                      onClick={() => alert("📋 全屏或者外跳查看详情")} 
                      title="展开面板"
                      className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors cursor-pointer"
                    >
                       <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => setIsDetailsOpen(false)} 
                      title="收起面板"
                      className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors cursor-pointer"
                    >
                       <X className="w-3.5 h-3.5" />
                    </button>
                 </div>
              </div>

              {/* 详情表身滚动区域 */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin">
                 
                 {/* 大图标板块：蓝底图标与动作定性 */}
                 <div className="bg-slate-50/60 border border-slate-200/50 p-4 rounded-xl flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-blue-600 shadow-sm flex items-center justify-center text-white shrink-0">
                       <Settings className="w-5.5 h-5.5" />
                    </div>
                    <div className="min-w-0">
                       <h4 className="text-[15px] font-mono font-black text-slate-900 truncate leading-snug">{activeDetailData.name}</h4>
                       <span className="text-[12px] text-slate-450 font-bold block mt-0.5">{activeDetailData.zh}</span>
                    </div>
                 </div>

                 {/* key-value 坚硬排版 */}
                 <div className="grid grid-cols-2 gap-x-4 gap-y-3 bg-white p-3 border border-slate-100 rounded-xl shadow-3xs text-[11.5px]">
                    <div className="space-y-0.5">
                       <span className="text-slate-400 font-semibold block">Action 类型</span>
                       <span className="font-extrabold text-slate-800">{activeDetailData.type}</span>
                    </div>
                    <div className="space-y-0.5">
                       <span className="text-slate-400 font-semibold block">作用对象</span>
                       <span className="font-mono font-extrabold text-[#475569] bg-[#f8fafc] px-1.5 py-0.2 rounded border border-slate-200">
                         {activeDetailData.target}
                       </span>
                    </div>

                    <div className="col-span-2 h-px bg-slate-100 my-0.5"></div>

                    <div className="space-y-0.5">
                       <span className="text-slate-400 font-semibold block">状态</span>
                       <span className="inline-flex px-2 py-0.5 bg-blue-50/30 text-blue-600 font-bold border border-blue-200/50 rounded leading-none mt-0.5">
                         {activeDetailData.status}
                       </span>
                    </div>
                    <div className="space-y-0.5">
                       <span className="text-slate-400 font-semibold block">所属域</span>
                       <span className="font-bold text-slate-800">{activeDetailData.domain}</span>
                    </div>

                    <div className="col-span-2 h-px bg-slate-100 my-0.5"></div>

                    <div className="space-y-0.5">
                       <span className="text-slate-400 font-semibold block">所属变更集</span>
                       <span className="font-mono font-black text-slate-650">{activeDetailData.cs}</span>
                    </div>
                    <div className="space-y-0.5">
                       <span className="text-slate-400 font-semibold block">创建时间</span>
                       <span className="font-mono text-slate-450">{activeDetailData.createdTime}</span>
                    </div>
                    <div className="col-span-2 space-y-0.5">
                       <span className="text-slate-400 font-semibold block">更新时间</span>
                       <span className="font-mono text-slate-450">{activeDetailData.lastUpdate}</span>
                    </div>
                 </div>

                 {/* 【描述】 */}
                 <div className="space-y-1.5 p-2 bg-slate-50/45 rounded-lg border border-slate-200/40">
                    <h5 className="text-[11px] font-black text-slate-600 tracking-tight flex items-center gap-1">
                      <Info className="w-3.5 h-3.5 text-slate-400" /> 描述
                    </h5>
                    <p className="text-[12px] text-slate-600 leading-relaxed font-semibold pl-1">
                       {activeDetailData.description}
                    </p>
                 </div>

                 {/* 【状态变化】 */}
                 {activeDetailData.stateChange && (
                   <div className="space-y-2 p-3 bg-white border border-slate-200/50 rounded-xl shadow-3xs">
                      <h5 className="text-[11px] font-black text-slate-500 tracking-tight">状态变化</h5>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 text-xs font-mono font-bold bg-slate-100 text-slate-650 rounded border border-slate-200">
                          {activeDetailData.stateChange.from}
                        </span>
                        <ArrowRight className="w-4 h-4 text-slate-350 shrink-0" />
                        <span className="px-2.5 py-1 text-xs font-mono font-bold bg-emerald-50 text-emerald-800 rounded border border-emerald-200 shadow-3xs">
                          {activeDetailData.stateChange.to}
                        </span>
                      </div>
                   </div>
                 )}

                 {/* 【前置条件 (4)】 */}
                 <div className="space-y-2.5">
                    <h5 className="text-xs font-black text-slate-800 flex items-center gap-1.5 pb-1 border-b border-slate-100">
                      <span>前置条件</span>
                      <span className="font-mono text-[10px] bg-slate-200 text-slate-550 px-1.5 rounded-full font-bold">
                        {activeDetailData.prerequisites.length}
                      </span>
                    </h5>
                    <div className="space-y-2">
                       {activeDetailData.prerequisites.map((pre, idx) => (
                         <div key={idx} className="flex items-start gap-2.5 text-[11.5px] text-slate-650 font-medium">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span className="leading-snug">
                              {pre.includes('>') || pre.includes('<') ? (
                                <code className="px-1.5 py-0.2 bg-slate-100 text-slate-800 font-mono text-[11px] rounded border border-slate-200 font-semibold">{pre}</code>
                              ) : (
                                <span>{pre}</span>
                              )}
                            </span>
                         </div>
                       ))}
                    </div>
                 </div>

                 {/* 【后置结果 (4)】 */}
                 <div className="space-y-2.5">
                    <h5 className="text-xs font-black text-slate-800 flex items-center gap-1.5 pb-1 border-b border-slate-100">
                      <span>后置结果</span>
                      <span className="font-mono text-[10px] bg-slate-200 text-slate-550 px-1.5 rounded-full font-bold">
                        {activeDetailData.postEffects.length}
                      </span>
                    </h5>
                    <div className="space-y-2">
                       {activeDetailData.postEffects.map((post, idx) => (
                         <div key={idx} className="flex items-start gap-2.5 text-[11.5px] text-slate-650 font-medium">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span className="leading-snug">{post}</span>
                         </div>
                       ))}
                    </div>
                 </div>

              </div>
           </div>
         )}
      </div>

      <CreateActionDrawer
         open={isDrawerOpen}
         onClose={() => setIsDrawerOpen(false)}
         onSave={() => {
           setIsDrawerOpen(false);
           alert("🌟 新开发的动作行为已保存进 CS-2026-012 变更集中待核验发布！");
         }}
         selectedObject={selectedObjectId || 'SemanticAssertion'}
      />

    </div>
  );
}
