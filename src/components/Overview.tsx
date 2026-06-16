import React, { useState, useEffect } from 'react';
import { 
  Box, Link as LinkIcon, FunctionSquare, Play, 
  GitMerge, Shield, CheckCircle2, Circle, Check,
  Target, AlertTriangle, Info, Bell, Search,
  Settings, ChevronRight, RefreshCw, LayoutGrid, Star,
  Database, FileCode, Beaker, LayoutTemplate, Maximize2, X, Sparkles,
  Plus, Download, ChevronDown
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

export default function Overview({ onNavigate, onCreateChangeSet, onRunValidation, isLocked }: OverviewProps) {
  const tabs = [
    '模型总览', '对象模型', '关系模型', '能力绑定', '动作 (Action)', 
    '流程 (Workflow)', '权限策略', '版本与发布', '变更集'
  ];

  // Interactive Workspace States
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [isPanoramaOpen, setIsPanoramaOpen] = useState(false);
  const [selectedPanoramaNodeId, setSelectedPanoramaNodeId] = useState<string>('Field');
  const [panoramaFilter, setPanoramaFilter] = useState<'all' | 'lineage' | 'semantic' | 'quality'>('all');

  // Adjacency connections map for highlighting
  const areConnected = (nodeA: string, nodeB: string): boolean => {
    const connections = [
      ['DataSource', 'DataAsset'],
      ['DataAsset', 'Field'],
      ['Field', 'SemanticAssertion'],
      ['Field', 'DataQualityRule'],
      ['SemanticAssertion', 'Evidence'],
      ['DataQualityRule', 'DataIssue'],
      ['Evidence', 'GovernanceTask'],
      ['DataIssue', 'GovernanceTask'],
      ['Run', 'Snapshot']
    ];
    return connections.some(con => con.includes(nodeA) && con.includes(nodeB));
  };

  const getLineColor = (nodeA: string, nodeB: string): string => {
    if (nodeA === 'DataSource' || nodeB === 'DataSource' || nodeA === 'DataAsset' || nodeB === 'DataAsset') return '#2563eb'; // Deep Blue
    if (nodeA === 'SemanticAssertion' || nodeB === 'SemanticAssertion' || nodeA === 'Evidence' || nodeB === 'Evidence') return '#059669'; // Emerald
    if (nodeA === 'DataQualityRule' || nodeB === 'DataQualityRule' || nodeA === 'DataIssue' || nodeB === 'DataIssue') return '#e11d48'; // Rose
    return '#7c3aed'; // Purple (Workflow/Snapshot/Run)
  };

  const getActiveMarker = (nodeA: string, nodeB: string): string => {
    const col = getLineColor(nodeA, nodeB);
    if (col === '#2563eb') return 'url(#arrowhead-blue)';
    if (col === '#059669') return 'url(#arrowhead-emerald)';
    if (col === '#e11d48') return 'url(#arrowhead-rose)';
    return 'url(#arrowhead-purple)';
  };

  const getLineProps = (nodeA: string, nodeB: string) => {
    const hasHover = hoveredNodeId !== null;
    const isRelated = hoveredNodeId === nodeA || hoveredNodeId === nodeB;
    const col = getLineColor(nodeA, nodeB);
    
    if (!hasHover) {
      return {
        stroke: "#cbd5e1",
        strokeWidth: 2,
        opacity: 1,
        markerEnd: "url(#arrowhead-slate)",
        className: "transition-all duration-300",
      };
    }
    if (isRelated) {
      return {
        stroke: col,
        strokeWidth: 2.5,
        opacity: 1,
        markerEnd: getActiveMarker(nodeA, nodeB),
        className: "transition-all duration-300 flow-active",
      };
    }
    return {
      stroke: "#cbd5e1",
      strokeWidth: 1.5,
      opacity: 0.15,
      markerEnd: "url(#arrowhead-slate)",
      className: "transition-all duration-300",
    };
  };

  const getTextProps = (nodeA: string, nodeB: string) => {
    const hasHover = hoveredNodeId !== null;
    const isRelated = hoveredNodeId === nodeA || hoveredNodeId === nodeB;
    const col = getLineColor(nodeA, nodeB);
    
    if (!hasHover) {
      return {
        fill: "#94a3b8",
        opacity: 1,
        fontWeight: "bold" as const,
        className: "transition-all duration-300",
      };
    }
    if (isRelated) {
      return {
        fill: col,
        opacity: 1,
        fontWeight: "extrabold" as const,
        className: "transition-all duration-300 scale-105 transform origin-center",
      };
    }
    return {
      fill: "#e2e8f0",
      opacity: 0.15,
      fontWeight: "normal" as const,
      className: "transition-all duration-300",
    };
  };

  // Static detailed metadata mapping for Panorama Modals
  const PANORAMA_NODE_DETAILS: Record<string, {
    title: string;
    subtitle: string;
    group: string;
    instanceCount: string;
    owner: string;
    description: string;
    properties: string[];
    lifecycle: string[];
  }> = {
    DataSource: {
      title: "DataSource (数据源对象)",
      subtitle: "数据源注册单元",
      group: "核心数据对象",
      instanceCount: "142 个物理源",
      owner: "数据平台组",
      description: "表示物理存储连接或计算引擎的顶级治理边界，承载连接细节与元数据扫描配置，参与系统最高级生命期巡查。",
      properties: ["ds_name (标识符)", "conn_type (协议类型)", "host (主机地址)", "db_name (关联物理库)", "owner (主接口人)"],
      lifecycle: ["Registered (已注册)", "Connected (连接成功)", "Scanned (质检扫描后)", "Active (投产中)", "Deprecated (下线已弃用)"]
    },
    DataAsset: {
      title: "DataAsset (数据资产表)",
      subtitle: "物理表/视图抽象",
      group: "核心数据对象",
      instanceCount: "3,450 张登记表",
      owner: "数仓治理部",
      description: "对应底层的物理表、视图或主题分区，是血缘脉络和属性传播的基础物理承载层。与其它业务域强绑定。",
      properties: ["table_name (全名称)", "row_count (总行数)", "table_type (表形态)", "asset_path (文件路径)", "owner (接口人)"],
      lifecycle: ["Catalogued (已被编目)", "Classified (已多域打标)", "LineageTracked (已获血缘追溯)", "Governed (治理状态)", "Deprecated (弃用)"]
    },
    Field: {
      title: "Field (字段对象)",
      subtitle: "逻辑物理列单元",
      group: "核心数据对象",
      instanceCount: "12,356 列治理原子",
      owner: "数据治理团队",
      description: "数据资产表中的逻辑/物理构成列，是关系映射、语义分类及断言验证的最小治理原子单元。是本体打标核心点。",
      properties: ["field_name (字段名)", "data_type (存储类型)", "semantic_type (语义匹配类)", "confidence (置信分数)", "owner (总接口人)"],
      lifecycle: ["Discovered (探查发现)", "Profiled (特征采样)", "Asserted (断言草稿)", "Confirmed (人工研判发布)", "Published (推送快照)"]
    },
    SemanticAssertion: {
      title: "SemanticAssertion (语义断言)",
      subtitle: "语义判别声明",
      group: "语义治理对象",
      instanceCount: "8,940 条有效断言",
      owner: "语义网络架构组",
      description: "针对 Field 对象的语义归属判定声明（如：字段是身份证号），需经过证据累积和流程确认。用于对齐各业务域认知。",
      properties: ["assertion_type (判定形态)", "confidence_score (置信得分)", "verified_by (审核人)", "assert_date (生效时间)"],
      lifecycle: ["Proposed (自动推荐)", "Analyzing (证据计算中)", "Contradictory (冲突预警)", "Confirmed (确证)", "Rejected (駁回拒绝)"]
    },
    Evidence: {
      title: "Evidence (证据对象)",
      subtitle: "物理逻辑凭证",
      group: "语义治理对象",
      instanceCount: "24,900 例验证凭证",
      owner: "特征采集引擎组",
      description: "支撑或证伪某个语义断言的具体物理特征及相似度。例如采样数据的正则识别匹配比例、列高重合、血缘溯源等。",
      properties: ["evidence_type (证据模式)", "extracted_val (定性度量)", "conf_weight (影响因子)", "source_file (存储链接)"],
      lifecycle: ["Extracted (解析提取)", "Normalized (规格对齐)", "Evaluated (估重分配)", "Archived (全期归档)"]
    },
    DataQualityRule: {
      title: "DataQualityRule (数据质量规则)",
      subtitle: "动态分析约束",
      group: "质量治理对象",
      instanceCount: "450 个生效模板",
      owner: "数据质量保障组",
      description: "作用于特定语义对象的校验准则（如非空约束、业务范围判断、外键关系探测），其结构随本体层模型联动自动化投产。",
      properties: ["rule_name (可读名称)", "rule_type (规则形态)", "check_sql (执行片段)", "severity (预警等级)"],
      lifecycle: ["Created (已建配置)", "Tested (模拟适配)", "Enabled (生效质检)", "Disabled (临时熔断停用)"]
    },
    DataIssue: {
      title: "DataIssue (数据问题)",
      subtitle: "治理异常故障",
      group: "质量治理对象",
      instanceCount: "86 例未关闭问题",
      owner: "运维监控中心",
      description: "执行数据质量校验后生成的异常实体，与数据对象及相关断言强关联，是主动性语义纠偏和修复的行动线索。",
      properties: ["issue_title (概要描述)", "severity_level (故障等级)", "created_at (创建时刻)"],
      lifecycle: ["Identified (规则预警)", "Assigned (派发责任人)", "Resolved (已做修正)", "Reverified (重新确认)", "Closed (终保归档)"]
    },
    GovernanceTask: {
      title: "GovernanceTask (治理任务)",
      subtitle: "人工流工作单",
      group: "运行治理对象",
      instanceCount: "322 条指派任务",
      owner: "治理流程管控科",
      description: "数据质量问题、冲突断言或变更升级触发的任务实例，驱动人工在 AI 的辅助下完成多层语义审查、关系复核与重发布。",
      properties: ["task_title (事物标题)", "assignee (承办人)", "due_date (截止期限)"],
      lifecycle: ["Created (已开待办)", "InProgress (办理中)", "UnderReview (质量审核)", "Completed (已闭环)", "Cancelled (废弃撤回)"]
    },
    Run: {
      title: "Run (运行实例)",
      subtitle: "扫描执行追踪",
      group: "运行治理对象",
      instanceCount: "15,403 历史跑批",
      owner: "运维工程组",
      description: "本体扫描、质量检测跑批或模型版本发布的执行追踪元数据流，用来核定系统工作通量与故障率。",
      properties: ["run_id (分布式追踪符)", "start_time (启动瞬间)", "duration (总耗时)"],
      lifecycle: ["Scheduled (在列等待)", "Running (火热跑批中)", "Completed (圆满跑完)", "Failed (故障崩溃)", "Aborted (人工掐断)"]
    },
    Snapshot: {
      title: "Snapshot (模型快照)",
      subtitle: "稳定版本快照",
      group: "运行治理对象",
      instanceCount: "15 个归档版本",
      owner: "架构演进委员会",
      description: "由治理人员核准发布的 DRKN 全量或增量语义模型结构定义与规则集，代表整个语义层的特定稳定版本，支持快捷挂载。",
      properties: ["snapshot_version (版本编号)", "snapshot_desc (变更说明)", "created_at (签名时刻)"],
      lifecycle: ["Staged (版本起草)", "Validating (跑批校验中)", "Approved (决策会通过)", "Published (已全网下发)", "Deprecated (过期已撤销)"]
    }
  };

  const Node = ({ 
    title, 
    subtitle, 
    icon: Icon, 
    color, 
    className, 
    style 
  }: { 
    title: string, 
    subtitle: string, 
    icon?: any, 
    color: string, 
    className?: string, 
    style?: React.CSSProperties 
  }) => {
    const colorClasses: Record<string, string> = {
      blue: 'bg-white ring-1 ring-blue-100/50 border-blue-200/60 shadow-blue-950/[0.04] hover:border-blue-300/80 hover:shadow-blue-900/5',
      green: 'bg-white ring-1 ring-emerald-100/50 border-emerald-200/60 shadow-emerald-950/[0.04] hover:border-emerald-300/80 hover:shadow-emerald-900/5',
      purple: 'bg-white ring-1 ring-purple-100/50 border-purple-200/60 shadow-purple-950/[0.04] hover:border-purple-300/80 hover:shadow-purple-900/5',
      teal: 'bg-white ring-1 ring-teal-100/50 border-teal-200/60 shadow-teal-950/[0.04] hover:border-teal-300/80 hover:shadow-teal-900/5',
      orange: 'bg-white ring-1 ring-orange-100/50 border-orange-200/60 shadow-orange-950/[0.04] hover:border-orange-300/80 hover:shadow-orange-900/5',
      red: 'bg-white ring-1 ring-rose-100/50 border-rose-200/60 shadow-rose-950/[0.04] hover:border-rose-300/80 hover:shadow-rose-900/5',
    };
    const iconColors: Record<string, string> = {
      blue: 'text-blue-600 bg-blue-50/70',
      green: 'text-emerald-600 bg-emerald-50/70',
      purple: 'text-purple-600 bg-purple-50/70',
      teal: 'text-teal-600 bg-teal-50/70',
      orange: 'text-orange-600 bg-orange-50/70',
      red: 'text-rose-600 bg-rose-50/70',
    };

    const hasHover = hoveredNodeId !== null;
    const isSelf = hoveredNodeId === title;
    const isConnected = hoveredNodeId ? areConnected(title, hoveredNodeId) : false;
    const isMuted = hasHover && !isSelf && !isConnected;

    return (
      <div 
        onMouseEnter={() => setHoveredNodeId(title)}
        onMouseLeave={() => setHoveredNodeId(null)}
        onClick={() => onNavigate('object_model', title)}
        className={`absolute rounded-xl px-2.5 py-2 flex flex-col items-center justify-center text-center z-10 w-[136px] h-[64px] shadow-sm border cursor-pointer select-none transition-all duration-300 ${
          isMuted 
            ? 'opacity-20 scale-[0.95] blur-[0.2px] border-slate-100' 
            : isSelf 
              ? 'ring-2 ring-blue-500 scale-[1.05] -translate-y-1 z-20 border-blue-400 shadow-md' 
              : isConnected 
                ? 'ring-1 ring-blue-300 scale-[1.02] border-blue-300 z-15 shadow-sm bg-blue-50/10' 
                : 'hover:shadow-md hover:-translate-y-0.5'
        } ${colorClasses[color]} ${className || ''}`}
        style={style}
      >
        <div className="flex items-center gap-2 w-full pl-0.5">
          {Icon && (
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconColors[color]} ring-1 ring-black/[0.03]`}>
              <Icon className="w-4 h-4" />
            </div>
          )}
          <div className="text-left min-w-0 flex-1">
            <div className="text-[12px] font-extrabold font-mono tracking-tight text-slate-800 truncate" title={title}>{title}</div>
            <div className="text-[10px] font-bold text-slate-400 mt-0.5 truncate" title={subtitle}>{subtitle}</div>
          </div>
        </div>
      </div>
    );
  };

  const isLineVisible = (nodeA: string, nodeB: string): boolean => {
    if (panoramaFilter === 'all') return true;
    if (panoramaFilter === 'lineage') {
      return (nodeA === 'DataSource' && nodeB === 'DataAsset') ||
             (nodeA === 'DataAsset' && nodeB === 'Field') ||
             (nodeA === 'Run' && nodeB === 'Snapshot');
    }
    if (panoramaFilter === 'semantic') {
      return (nodeA === 'Field' && nodeB === 'SemanticAssertion') ||
             (nodeA === 'SemanticAssertion' && nodeB === 'Evidence') ||
             (nodeA === 'Evidence' && nodeB === 'GovernanceTask') ||
             (nodeA === 'Snapshot' && nodeB === 'SemanticAssertion');
    }
    if (panoramaFilter === 'quality') {
      return (nodeA === 'Field' && nodeB === 'DataQualityRule') ||
             (nodeA === 'DataQualityRule' && nodeB === 'DataIssue') ||
             (nodeA === 'DataIssue' && nodeB === 'GovernanceTask');
    }
    return false;
  };

  const renderModalNode = (id: string, nameCn: string, icon: any, color: string, style: React.CSSProperties) => {
    const isSelected = selectedPanoramaNodeId === id;
    const IconComp = icon;
    
    const themeClasses: Record<string, string> = {
      blue: isSelected 
        ? 'bg-blue-950/40 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)] text-blue-100 ring-1 ring-blue-400'
        : 'bg-slate-900 border-slate-700 hover:border-blue-500 hover:bg-slate-800 text-slate-200',
      green: isSelected 
        ? 'bg-emerald-950/40 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] text-emerald-100 ring-1 ring-emerald-400'
        : 'bg-slate-900 border-slate-700 hover:border-emerald-500 hover:bg-slate-800 text-slate-200',
      purple: isSelected 
        ? 'bg-purple-950/40 border-purple-500 shadow-[0_0_15px_rgba(139,92,246,0.3)] text-purple-100 ring-1 ring-purple-400'
        : 'bg-slate-900 border-slate-700 hover:border-purple-500 hover:bg-slate-800 text-slate-200',
      teal: isSelected 
        ? 'bg-teal-950/40 border-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.3)] text-teal-100 ring-1 ring-teal-400'
        : 'bg-slate-900 border-slate-700 hover:border-teal-500 hover:bg-slate-800 text-slate-200',
      orange: isSelected 
        ? 'bg-orange-950/40 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.3)] text-orange-100 ring-1 ring-orange-400'
        : 'bg-slate-900 border-slate-700 hover:border-orange-500 hover:bg-slate-800 text-slate-200',
      red: isSelected 
        ? 'bg-rose-950/40 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)] text-rose-100 ring-1 ring-rose-400'
        : 'bg-slate-900 border-slate-700 hover:border-rose-500 hover:bg-slate-800 text-slate-200',
    };

    const iconBg: Record<string, string> = {
      blue: 'bg-blue-950 text-blue-400 border-blue-800',
      green: 'bg-emerald-950 text-emerald-400 border-emerald-800',
      purple: 'bg-purple-950 text-purple-400 border-purple-800',
      teal: 'bg-teal-950 text-teal-400 border-teal-800',
      orange: 'bg-orange-950 text-orange-400 border-slate-850',
      red: 'bg-rose-950 text-rose-400 border-rose-800',
    };

    return (
      <div 
        onClick={() => setSelectedPanoramaNodeId(id)}
        className={`absolute rounded-xl px-3 py-2.5 flex flex-col items-center justify-center text-center z-10 w-[136px] h-[64px] border cursor-pointer select-none transition-all duration-300 ${themeClasses[color]}`}
        style={style}
      >
        <div className="flex items-center gap-2.5 w-full pl-0.5">
          {icon && (
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${iconBg[color]}`}>
              <IconComp className="w-4 h-4" />
            </div>
          )}
          <div className="text-left min-w-0 flex-1">
            <div className="text-[12px] font-extrabold font-mono tracking-tight truncate">{id}</div>
            <div className="text-[10px] font-bold text-slate-400 mt-0.5 truncate">{nameCn}</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-full font-sans bg-transparent" id="overview-view">
      
      {/* 顶部 Header：100% 遵照设计图样式 */}
      <div className="mb-5 space-y-1.5 shrink-0">
        
        {/* 第一行：面包屑与常驻右侧的变更沙箱指示 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center text-[12px] text-slate-400 font-semibold tracking-wide">
             <span className="hover:text-blue-600 cursor-pointer transition-colors" onClick={() => onNavigate('overview')}>管理中心</span>
             <span className="mx-2 text-slate-300">/</span>
             <span className="hover:text-blue-600 cursor-pointer transition-colors">本体管理</span>
             <span className="mx-2 text-slate-300">/</span>
             <span className="hover:text-blue-600 cursor-pointer transition-colors">DRKN 本体模型管理</span>
             <span className="mx-2 text-slate-300">/</span>
             <span className="text-slate-800 font-black">模型总览</span>
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
            <button 
              onClick={onRunValidation}
              className="px-3.5 py-1.5 text-xs font-black text-slate-650 bg-white border border-slate-250 hover:bg-slate-50 rounded-lg shadow-3xs hover:border-slate-350 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-450" /> 校验模型
            </button>
            <button className="px-3.5 py-1.5 text-xs font-black text-slate-650 bg-white border border-slate-250 hover:bg-slate-50 rounded-lg shadow-3xs hover:border-slate-350 transition-all flex items-center gap-1.5 cursor-pointer">
              <Download className="w-3.5 h-3.5 text-slate-450" /> 导出模型
            </button>
            <button className="p-1.5 bg-white border border-slate-250 hover:bg-slate-50 rounded-lg shadow-3xs hover:border-slate-350 transition-all cursor-pointer">
              <Settings className="w-4 h-4 text-slate-550" />
            </button>
            
            <div className="h-6 w-px bg-slate-250 mx-1"></div>
            
            <button 
              onClick={onCreateChangeSet}
              className="px-4 py-1.5 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs hover:shadow-blue-500/10 flex items-center gap-1 cursor-pointer transition-all"
            >
              + 新建变更集 <ChevronDown className="w-3.5 h-3.5" />
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
              if (tab === '模型总览') onNavigate('overview');
              if (tab === '对象模型') onNavigate('object_model');
              if (tab === '关系模型') onNavigate('relation_model');
              if (tab === '能力绑定' || tab === '能力 (Function)') onNavigate('capability_binding');
              if (tab === '动作 (Action)') onNavigate('action_model');
              if (tab === '流程 (Workflow)') onNavigate('workflow_orchestration');
              if (tab === '版本与发布' || tab === '变更与发布' || tab === '变更集') onNavigate('change_release');
            }}
            className={`px-3 pb-2 text-[13px] font-bold cursor-pointer transition-colors relative ${
              tab === '模型总览' 
                ? 'text-blue-600 font-black border-b-[2.5px] border-blue-600 -mb-[1px]' 
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
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsPanoramaOpen(true)}
                className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-sm hover:shadow"
              >
                <Maximize2 className="w-3 h-3" />
                <span>全景视图</span>
              </button>
              <div 
                className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer border border-slate-200 px-2.5 py-1.5 rounded-lg flex items-center transition-all bg-white shadow-sm"
                onClick={() => onNavigate('relation_model')}
              >
                <span>关系模型</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          </div>
          
          <div className="flex-1 min-h-[560px] flex items-center justify-center p-2 bg-slate-50/40 rounded-2xl border border-slate-100/80 shadow-inner mt-2">
            <div className="relative w-[440px] h-[540px] shrink-0 overflow-hidden">
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
              <defs>
                <style>{`
                  @keyframes line-flow {
                    to {
                      stroke-dashoffset: -16;
                    }
                  }
                  .flow-active {
                    stroke-dasharray: 6 3;
                    animation: line-flow 1.2s linear infinite;
                  }
                `}</style>
                <marker id="arrowhead-slate" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <polygon points="0 0, 6 3, 0 6" fill="#cbd5e1" />
                </marker>
                <marker id="arrowhead-blue" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <polygon points="0 0, 6 3, 0 6" fill="#2563eb" />
                </marker>
                <marker id="arrowhead-emerald" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <polygon points="0 0, 6 3, 0 6" fill="#059669" />
                </marker>
                <marker id="arrowhead-rose" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <polygon points="0 0, 6 3, 0 6" fill="#e11d48" />
                </marker>
                <marker id="arrowhead-purple" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <polygon points="0 0, 6 3, 0 6" fill="#7c3aed" />
                </marker>
              </defs>
              
              {/* Vertical Path: DataSource -> DataAsset -> Field */}
              <line x1="220" y1="48" x2="220" y2="100" {...getLineProps('DataSource', 'DataAsset')} />
              <text x="226" y="78" {...getTextProps('DataSource', 'DataAsset')} fontSize="10" fontFamily="monospace">contains</text>

              <line x1="220" y1="132" x2="220" y2="184" {...getLineProps('DataAsset', 'Field')} />
              <text x="226" y="162" {...getTextProps('DataAsset', 'Field')} fontSize="10" fontFamily="monospace">contains</text>

              {/* Branch Left: Field -> SemanticAssertion */}
              <path d="M 220 216 C 220 245, 100 240, 100 273" fill="none" {...getLineProps('Field', 'SemanticAssertion')} />
              <text x="110" y="248" {...getTextProps('Field', 'SemanticAssertion')} fontSize="10" fontFamily="monospace">has_assertion</text>

              {/* Branch Right: Field -> DataQualityRule */}
              <path d="M 220 216 C 220 245, 340 240, 340 273" fill="none" {...getLineProps('Field', 'DataQualityRule')} />
              <text x="250" y="248" {...getTextProps('Field', 'DataQualityRule')} fontSize="10" fontFamily="monospace">checked_by</text>

              {/* Path: SemanticAssertion -> Evidence */}
              <line x1="100" y1="305" x2="100" y2="373" {...getLineProps('SemanticAssertion', 'Evidence')} />
              <text x="106" y="344" {...getTextProps('SemanticAssertion', 'Evidence')} fontSize="10" fontFamily="monospace">supported_by</text>

              {/* Path: DataQualityRule -> DataIssue */}
              <line x1="340" y1="305" x2="340" y2="373" {...getLineProps('DataQualityRule', 'DataIssue')} />
              <text x="346" y="344" {...getTextProps('DataQualityRule', 'DataIssue')} fontSize="10" fontFamily="monospace">produces</text>

              {/* Path: Evidence -> GovernanceTask */}
              <path d="M 100 405 C 100 440, 220 435, 220 473" fill="none" {...getLineProps('Evidence', 'GovernanceTask')} strokeDasharray={hoveredNodeId === 'Evidence' || hoveredNodeId === 'GovernanceTask' ? undefined : "4 2"} />
              
              {/* Path: DataIssue -> GovernanceTask */}
              <path d="M 340 405 C 340 440, 220 435, 220 473" fill="none" {...getLineProps('DataIssue', 'GovernanceTask')} strokeDasharray={hoveredNodeId === 'DataIssue' || hoveredNodeId === 'GovernanceTask' ? undefined : "4 2"} />
              <text x="135" y="450" {...getTextProps('Evidence', 'GovernanceTask')} fontSize="10" fontFamily="monospace" textAnchor="middle">assigned_to</text>

              {/* Right Side Floating logic: Run -> Snapshot */}
              <path d="M 340 132 C 340 160, 400 155, 400 184" fill="none" {...getLineProps('Run', 'Snapshot')} strokeDasharray={hoveredNodeId === 'Run' || hoveredNodeId === 'Snapshot' ? undefined : "3 3"} />
              <text x="346" y="162" {...getTextProps('Run', 'Snapshot')} fontSize="10" fontFamily="monospace">generates</text>
            </svg>

            {/* Nodes Positioning exactly using pixel style */}
            <Node title="DataSource" subtitle="数据源" icon={Database} color="blue" style={{ left: '152px', top: '16px' }} />
            <Node title="DataAsset" subtitle="数据资产" icon={Box} color="blue" style={{ left: '152px', top: '100px' }} />
            <Node title="Field" subtitle="字段" icon={LayoutGrid} color="blue" style={{ left: '152px', top: '184px' }} />
            
            <Node title="SemanticAssertion" subtitle="语义断言" icon={Shield} color="green" style={{ left: '32px', top: '273px' }} />
            <Node title="DataQualityRule" subtitle="质量规则" icon={CheckCircle2} color="green" style={{ left: '272px', top: '273px' }} />
            
            <Node title="Evidence" subtitle="证据" icon={FileCode} color="teal" style={{ left: '32px', top: '373px' }} />
            <Node title="DataIssue" subtitle="数据问题" icon={AlertTriangle} color="red" style={{ left: '272px', top: '373px' }} />
            
            <Node title="GovernanceTask" subtitle="治理任务" icon={Target} color="purple" style={{ left: '152px', top: '473px' }} />
            
            {/* Floating Side Nodes */}
            <Node title="Run" subtitle="检测记录" icon={Play} color="blue" style={{ left: '332px', top: '100px' }} />
            <Node title="Snapshot" subtitle="状态快照" icon={Box} color="orange" style={{ left: '332px', top: '184px' }} />
          </div>
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

      {/* 
        =========================================
        FULLSCREEN PANORAMA WORKSPACE MODAL
        ========================================= 
      */}
      {isPanoramaOpen && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-8 animate-fade-in font-sans">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden shadow-2xl text-slate-100">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white tracking-tight flex items-center gap-1.5">
                    DRKN 本体关系整合全景图谱
                    <span className="text-[10px] font-mono font-bold bg-blue-500/10 border border-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded leading-none">V1.3.0 模型</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">展示 10 个数据治理核心对象的关系拓扑、能力函数绑定与流运行轨迹</p>
                </div>
              </div>

              {/* Filtering Controls */}
              <div className="flex bg-slate-950/50 border border-slate-800 p-1 rounded-lg gap-1">
                {[
                  { id: 'all', label: '全部关系' },
                  { id: 'lineage', label: '物理与血缘' },
                  { id: 'semantic', label: '语义打标' },
                  { id: 'quality', label: '质量保障' }
                ].map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => setPanoramaFilter(filter.id as any)}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                      panoramaFilter === filter.id 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {/* Close Button */}
              <button 
                onClick={() => setIsPanoramaOpen(false)}
                className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-400 flex items-center justify-center transition-colors cursor-pointer border border-slate-800 shadow-inner"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Split View */}
            <div className="flex-1 flex overflow-hidden">
              
              {/* Left Panel: Legend & Filters */}
              <div className="w-64 border-r border-slate-800/80 p-5 flex flex-col gap-5 bg-slate-950/15 shrink-0 overflow-y-auto">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">本体分类标识</h4>
                  <div className="space-y-2.5">
                    {[
                      { label: '核心物理对象', color: 'bg-blue-500', desc: '物理元数据与存储边界' },
                      { label: '语义治理对象', color: 'bg-emerald-500', desc: '语义归属与技术证据链路' },
                      { label: '质量治理对象', color: 'bg-rose-500', desc: '质检规则与熔断异常问题' },
                      { label: '运行治理对象', color: 'bg-purple-500', desc: '跑批记录、快照与任务工单' }
                    ].map((item, idx) => (
                      <div key={idx} className="flex gap-2">
                        <div className={`w-2 h-2 rounded-full ${item.color} mt-1.5 shrink-0`}></div>
                        <div>
                          <div className="text-xs font-bold text-slate-200">{item.label}</div>
                          <div className="text-[10px] text-slate-400 font-medium mt-0.5">{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-slate-800/80"></div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">连接图谱索引</h4>
                  <div className="space-y-3.5 text-xs text-slate-400 font-medium leading-relaxed">
                    <p>选中不同的筛选器可以只点亮特定生命周期的脉络线条：</p>
                    <div className="space-y-2">
                      <div className="p-2 bg-slate-950/40 rounded-lg border border-slate-800">
                        <span className="text-blue-400 font-bold">物理与血缘 (Lineage)</span>
                        <div className="text-[10px] text-slate-400 mt-1">包含 contains 关系以及由质量问题向上回溯的数据源完整血缘路径。</div>
                      </div>
                      <div className="p-2 bg-slate-950/40 rounded-lg border border-slate-800">
                        <span className="text-emerald-400 font-bold">语义对齐 (Semantic alignment)</span>
                        <div className="text-[10px] text-slate-400 mt-1">标记 has_assertion 生成断言、证据支撑，以及版本快照打包归纳。</div>
                      </div>
                      <div className="p-2 bg-slate-950/40 rounded-lg border border-slate-800">
                        <span className="text-rose-400 font-bold">质量保障 (Quality core)</span>
                        <div className="text-[10px] text-slate-400 mt-1">由校验 checked_by 出发，触发数据问题异常并生成指派治理任务工单。</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Central Topological Canvas */}
              <div className="flex-1 bg-slate-950/40 relative h-full flex items-center justify-center overflow-hidden">
                {/* Visual Grid Backdrop */}
                <div className="absolute inset-0 bg-[radial-gradient(#334155_1.2px,transparent_1.2px)] opacity-35 [background-size:20px_20px] pointer-events-none"></div>

                <div className="relative w-[880px] h-[450px] shrink-0">
                  {/* SVG paths representing highlighted lines */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                    <defs>
                      <style>{`
                        @keyframes panorama-flow {
                          to {
                            stroke-dashoffset: -20;
                          }
                        }
                        .flow-active-modal {
                          stroke-dasharray: 6 3;
                          animation: panorama-flow 0.8s linear infinite;
                        }
                        @keyframes pulse-modal {
                          0%, 100% { transform: scale(1); opacity: 0.25; }
                          50% { transform: scale(1.6); opacity: 0.6; }
                        }
                        .node-pulse-modal {
                          transform-origin: center;
                          animation: pulse-modal 2s infinite ease-in-out;
                        }
                      `}</style>
                      <marker id="modal-arrowhead-slate" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                        <polygon points="0 0, 6 3, 0 6" fill="#475569" />
                      </marker>
                      <marker id="modal-arrowhead-blue" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                        <polygon points="0 0, 6 3, 0 6" fill="#3b82f6" />
                      </marker>
                      <marker id="modal-arrowhead-emerald" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                        <polygon points="0 0, 6 3, 0 6" fill="#10b981" />
                      </marker>
                      <marker id="modal-arrowhead-rose" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                        <polygon points="0 0, 6 3, 0 6" fill="#f43f5e" />
                      </marker>
                    </defs>

                    {/* DS -> DA: contains */}
                    {isLineVisible('DataSource', 'DataAsset') && (
                      <g>
                        <line 
                          x1="108" y1="82" x2="268" y2="82" 
                          stroke={panoramaFilter !== 'all' ? '#3b82f6' : '#475569'} 
                          strokeWidth={panoramaFilter !== 'all' ? 2.5 : 1.5} 
                          className={panoramaFilter !== 'all' ? 'flow-active-modal' : ''}
                          markerEnd={panoramaFilter !== 'all' ? 'url(#modal-arrowhead-blue)' : 'url(#modal-arrowhead-slate)'}
                        />
                        <text x="180" y="70" fill={panoramaFilter !== 'all' ? '#60a5fa' : '#64748b'} fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">contains</text>
                      </g>
                    )}

                    {/* DA -> FI: contains */}
                    {isLineVisible('DataAsset', 'Field') && (
                      <g>
                        <line 
                          x1="278" y1="82" x2="438" y2="82" 
                          stroke={panoramaFilter !== 'all' ? '#3b82f6' : '#475569'} 
                          strokeWidth={panoramaFilter !== 'all' ? 2.5 : 1.5} 
                          className={panoramaFilter !== 'all' ? 'flow-active-modal' : ''}
                          markerEnd={panoramaFilter !== 'all' ? 'url(#modal-arrowhead-blue)' : 'url(#modal-arrowhead-slate)'}
                        />
                        <text x="350" y="70" fill={panoramaFilter !== 'all' ? '#60a5fa' : '#64748b'} fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">contains</text>
                      </g>
                    )}

                    {/* FI -> SA: has_assertion */}
                    {isLineVisible('Field', 'SemanticAssertion') && (
                      <g>
                        <line 
                          x1="448" y1="82" x2="608" y2="82" 
                          stroke={panoramaFilter !== 'all' ? '#10b981' : '#475569'} 
                          strokeWidth={panoramaFilter !== 'all' ? 2.5 : 1.5} 
                          className={panoramaFilter !== 'all' ? 'flow-active-modal' : ''}
                          markerEnd={panoramaFilter !== 'all' ? 'url(#modal-arrowhead-emerald)' : 'url(#modal-arrowhead-slate)'}
                        />
                        <text x="520" y="70" fill={panoramaFilter !== 'all' ? '#34d399' : '#64748b'} fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">has_assertion</text>
                      </g>
                    )}

                    {/* SA -> EV: supported_by */}
                    {isLineVisible('SemanticAssertion', 'Evidence') && (
                      <g>
                        <line 
                          x1="618" y1="82" x2="778" y2="82" 
                          stroke={panoramaFilter !== 'all' ? '#10b981' : '#475569'} 
                          strokeWidth={panoramaFilter !== 'all' ? 2.5 : 1.5} 
                          className={panoramaFilter !== 'all' ? 'flow-active-modal' : ''}
                          markerEnd={panoramaFilter !== 'all' ? 'url(#modal-arrowhead-emerald)' : 'url(#modal-arrowhead-slate)'}
                        />
                        <text x="690" y="70" fill={panoramaFilter !== 'all' ? '#34d399' : '#64748b'} fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">supported_by</text>
                      </g>
                    )}

                    {/* FI -> DQ: checked_by */}
                    {isLineVisible('Field', 'DataQualityRule') && (
                      <g>
                        <line 
                          x1="448" y1="82" x2="608" y2="232" 
                          stroke={panoramaFilter !== 'all' ? '#f43f5e' : '#475569'} 
                          strokeWidth={panoramaFilter !== 'all' ? 2.5 : 1.5} 
                          className={panoramaFilter !== 'all' ? 'flow-active-modal' : ''}
                          markerEnd={panoramaFilter !== 'all' ? 'url(#modal-arrowhead-rose)' : 'url(#modal-arrowhead-slate)'}
                        />
                        <text x="515" y="160" fill={panoramaFilter !== 'all' ? '#fb7185' : '#64748b'} fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle" transform="rotate(35 515 160)">checked_by</text>
                      </g>
                    )}

                    {/* DQ -> DI: produces */}
                    {isLineVisible('DataQualityRule', 'DataIssue') && (
                      <g>
                        <line 
                          x1="618" y1="232" x2="778" y2="232" 
                          stroke={panoramaFilter !== 'all' ? '#f43f5e' : '#475569'} 
                          strokeWidth={panoramaFilter !== 'all' ? 2.5 : 1.5} 
                          className={panoramaFilter !== 'all' ? 'flow-active-modal' : ''}
                          markerEnd={panoramaFilter !== 'all' ? 'url(#modal-arrowhead-rose)' : 'url(#modal-arrowhead-slate)'}
                        />
                        <text x="690" y="222" fill={panoramaFilter !== 'all' ? '#fb7185' : '#64748b'} fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">produces</text>
                      </g>
                    )}

                    {/* EV -> GT: assigned_to */}
                    {isLineVisible('Evidence', 'GovernanceTask') && (
                      <g>
                        <path 
                          d="M 778,82 C 778,140 448,160 448,232" 
                          fill="none"
                          stroke={panoramaFilter !== 'all' ? '#10b981' : '#475569'} 
                          strokeWidth={panoramaFilter !== 'all' ? 2.5 : 1.5} 
                          className={panoramaFilter !== 'all' ? 'flow-active-modal' : ''}
                          strokeDasharray="3 3"
                        />
                      </g>
                    )}

                    {/* DI -> GT: assigned_to */}
                    {isLineVisible('DataIssue', 'GovernanceTask') && (
                      <g>
                        <line 
                          x1="778" y1="232" x2="448" y2="232" 
                          stroke={panoramaFilter !== 'all' ? '#f43f5e' : '#475569'} 
                          strokeWidth={panoramaFilter !== 'all' ? 2.5 : 1.5} 
                          className={panoramaFilter !== 'all' ? 'flow-active-modal' : ''}
                          strokeDasharray="3 3"
                        />
                        <text x="610" y="222" fill={panoramaFilter !== 'all' ? '#fb7185' : '#64748b'} fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">assigned_to</text>
                      </g>
                    )}

                    {/* RU -> SS: generates */}
                    {isLineVisible('Run', 'Snapshot') && (
                      <g>
                        <line 
                          x1="278" y1="382" x2="438" y2="382" 
                          stroke="#7c3aed" 
                          strokeWidth={2} 
                          markerEnd="url(#modal-arrowhead-slate)"
                        />
                        <text x="350" y="370" fill="#a78bfa" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">generates</text>
                      </g>
                    )}

                    {/* SS -> SA: includes */}
                    {isLineVisible('Snapshot', 'SemanticAssertion') && (
                      <g>
                        <path 
                          d="M 448,382 C 448,300 618,220 618,82" 
                          fill="none"
                          stroke="#7c3aed" 
                          strokeWidth={2} 
                          className="flow-active-modal"
                          markerEnd="url(#modal-arrowhead-slate)"
                        />
                        <text x="490" y="290" fill="#a78bfa" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">includes</text>
                      </g>
                    )}
                  </svg>

                  {/* Pulsing Highlight Rings on Selection */}
                  {Object.entries({
                    DataSource: { x: 108, y: 82, col: 'rgba(59,130,246,0.5)' },
                    DataAsset: { x: 278, y: 82, col: 'rgba(59,130,246,0.5)' },
                    Field: { x: 448, y: 82, col: 'rgba(59,130,246,0.5)' },
                    SemanticAssertion: { x: 618, y: 82, col: 'rgba(16,185,129,0.5)' },
                    Evidence: { x: 778, y: 82, col: 'rgba(20,184,166,0.5)' },
                    DataQualityRule: { x: 618, y: 242, col: 'rgba(244,63,94,0.5)' },
                    DataIssue: { x: 778, y: 242, col: 'rgba(244,63,94,0.5)' },
                    GovernanceTask: { x: 448, y: 242, col: 'rgba(139,92,246,0.5)' },
                    Run: { x: 268, y: 382, col: 'rgba(59,130,246,0.5)' },
                    Snapshot: { x: 438, y: 382, col: 'rgba(249,115,22,0.5)' }
                  }).map(([id, item]) => selectedPanoramaNodeId === id && (
                    <div 
                      key={id}
                      className="absolute rounded-full pointer-events-none"
                      style={{
                        left: `${item.x - 40}px`,
                        top: `${item.y - 40}px`,
                        width: '80px',
                        height: '80px',
                        background: item.col,
                        filter: 'blur(10px)',
                        animation: 'pulse-modal 2s infinite ease-in-out',
                        zIndex: 1
                      }}
                    ></div>
                  ))}

                  {/* Nodes position overrides container width/height styling */}
                  {renderModalNode('DataSource', '数据源', Database, 'blue', { left: '40px', top: '50px' })}
                  {renderModalNode('DataAsset', '数据资产表', Box, 'blue', { left: '200px', top: '50px' })}
                  {renderModalNode('Field', '字段对象', LayoutGrid, 'blue', { left: '370px', top: '50px' })}

                  {renderModalNode('SemanticAssertion', '语义断言', Shield, 'green', { left: '550px', top: '50px' })}
                  {renderModalNode('Evidence', '物理证据', FileCode, 'teal', { left: '710px', top: '50px' })}

                  {renderModalNode('DataQualityRule', '质量规则', CheckCircle2, 'green', { left: '550px', top: '210px' })}
                  {renderModalNode('DataIssue', '数据问题', AlertTriangle, 'red', { left: '710px', top: '210px' })}

                  {renderModalNode('GovernanceTask', '治理任务', Target, 'purple', { left: '370px', top: '210px' })}

                  {renderModalNode('Run', '运行实例', Play, 'blue', { left: '200px', top: '350px' })}
                  {renderModalNode('Snapshot', '稳定快照', Box, 'orange', { left: '370px', top: '350px' })}
                </div>
              </div>

              {/* Right Panel: Detail Panel */}
              <div className="w-80 border-l border-slate-800 p-6 overflow-y-auto bg-slate-950/20 shrink-0 flex flex-col h-full gap-5">
                {PANORAMA_NODE_DETAILS[selectedPanoramaNodeId] ? (
                  <>
                    <div>
                      <span className="text-[10px] font-bold tracking-wider uppercase text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
                        {PANORAMA_NODE_DETAILS[selectedPanoramaNodeId].group}
                      </span>
                      <h4 className="text-lg font-bold text-white tracking-tight mt-2.5">
                        {PANORAMA_NODE_DETAILS[selectedPanoramaNodeId].title}
                      </h4>
                      <p className="text-xs text-slate-400 font-medium mt-1">
                        {PANORAMA_NODE_DETAILS[selectedPanoramaNodeId].subtitle}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-950/30 border border-slate-800 rounded-lg p-2.5 text-center">
                        <div className="text-[10px] text-slate-500 font-bold uppercase">实例规模</div>
                        <div className="text-xs font-extrabold text-blue-400 mt-0.5">{PANORAMA_NODE_DETAILS[selectedPanoramaNodeId].instanceCount}</div>
                      </div>
                      <div className="bg-slate-950/30 border border-slate-800 rounded-lg p-2.5 text-center">
                        <div className="text-[10px] text-slate-500 font-bold uppercase">主责任域</div>
                        <div className="text-xs font-extrabold text-slate-300 mt-0.5">{PANORAMA_NODE_DETAILS[selectedPanoramaNodeId].owner}</div>
                      </div>
                    </div>

                    <div>
                      <h5 className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">底层治理模型</h5>
                      <p className="text-xs text-slate-300 leading-relaxed font-medium bg-slate-950/30 p-3 rounded-lg border border-slate-800">
                        {PANORAMA_NODE_DETAILS[selectedPanoramaNodeId].description}
                      </p>
                    </div>

                    <div>
                      <h5 className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">模型属性结构 (Properties)</h5>
                      <div className="space-y-1 bg-slate-950/20 p-2 border border-slate-800 rounded-lg">
                        {PANORAMA_NODE_DETAILS[selectedPanoramaNodeId].properties.map((prop, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs font-mono font-medium text-slate-300 py-1 border-b border-slate-800/40 last:border-0 pl-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500/80 shrink-0"></span>
                            {prop}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h5 className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2.5">生命周期状态 (Lifecycle)</h5>
                      <div className="flex flex-col gap-2">
                        {PANORAMA_NODE_DETAILS[selectedPanoramaNodeId].lifecycle.map((state, idx) => (
                          <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-300 pl-0.5 font-medium">
                            <div className="flex flex-col items-center shrink-0">
                              <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 font-mono text-[9px] font-bold text-slate-400 flex items-center justify-center">
                                {idx + 1}
                              </div>
                            </div>
                            <span>{state}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-auto pt-4 shrink-0">
                      <button 
                        onClick={() => {
                          setIsPanoramaOpen(false);
                          onNavigate('object_model', selectedPanoramaNodeId);
                        }}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-500/10 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>进入此对象配置中心</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-slate-500 text-xs font-bold text-center py-20">请点击左侧节点查看详细对象定义</div>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}

