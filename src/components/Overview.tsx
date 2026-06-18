import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Link as LinkIcon, FunctionSquare, Play,
  GitMerge, Shield, CheckCircle2, Circle, Check,
  Target, AlertTriangle, Info, Bell, Search,
  Settings, ChevronRight, RefreshCw, LayoutGrid, Star,
  Database, FileCode, Beaker, LayoutTemplate, Maximize2, X, Sparkles,
  Plus, Download, ChevronDown, PanelRightOpen, PanelRightClose
} from 'lucide-react';
import {useUiStore} from '../store/uiStore';

const nodeMetrics: Record<string, { count: string, color?: string }> = {
  DataSource: { count: '142' },
  DataAsset: { count: '3.4k' },
  Field: { count: '12k' },
  SemanticAssertion: { count: '8.9k' },
  DataQualityRule: { count: '450' },
  Evidence: { count: '24k' },
  DataIssue: { count: '86', color: 'bg-rose-100 text-rose-700 border-rose-200 ring-rose-500/20' },
  GovernanceTask: { count: '322', color: 'bg-purple-100 text-purple-700 border-purple-200 ring-purple-500/20' },
  Run: { count: '15k' },
  Snapshot: { count: '15' }
};

const leftStripeColors: Record<string, string> = {
  blue: 'bg-blue-500',
  green: 'bg-emerald-500',
  purple: 'bg-purple-500',
  teal: 'bg-teal-500',
  orange: 'bg-orange-500',
  red: 'bg-rose-500',
};

const hoverRingColors: Record<string, string> = {
  blue: 'ring-2 ring-blue-500 border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.25)]',
  green: 'ring-2 ring-emerald-500 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.25)]',
  purple: 'ring-2 ring-purple-500 border-purple-400 shadow-[0_0_12px_rgba(139,92,246,0.25)]',
  teal: 'ring-2 ring-teal-500 border-teal-400 shadow-[0_0_12px_rgba(20,184,166,0.25)]',
  orange: 'ring-2 ring-orange-500 border-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.25)]',
  red: 'ring-2 ring-rose-500 border-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.25)]',
};

const connectedRingColors: Record<string, string> = {
  blue: 'ring-1 ring-blue-300 border-blue-300 bg-blue-50/10 shadow-[0_0_6px_rgba(59,130,246,0.1)]',
  green: 'ring-1 ring-emerald-300 border-emerald-300 bg-emerald-50/10 shadow-[0_0_6px_rgba(16,185,129,0.1)]',
  purple: 'ring-1 ring-purple-300 border-purple-300 bg-purple-50/10 shadow-[0_0_6px_rgba(139,92,246,0.1)]',
  teal: 'ring-1 ring-teal-300 border-teal-300 bg-teal-50/10 shadow-[0_0_6px_rgba(20,184,166,0.1)]',
  orange: 'ring-1 ring-orange-300 border-orange-300 bg-orange-50/10 shadow-[0_0_6px_rgba(249,115,22,0.1)]',
  red: 'ring-1 ring-rose-300 border-rose-300 bg-rose-50/10 shadow-[0_0_6px_rgba(244,63,94,0.1)]',
};

// NODE_W / NODE_H: the pixel dimensions of each canvas node card
const NODE_W = 136;
const NODE_H = 64;

// Dynamic path between two nodes given their top-left positions
const getDynamicPath = (
  posA: { x: number; y: number },
  posB: { x: number; y: number }
): string => {
  // Entry/exit points: bottom-center of A -> top-center of B
  const ax = posA.x + NODE_W / 2;
  const ay = posA.y + NODE_H;
  const bx = posB.x + NODE_W / 2;
  const by = posB.y;
  const cy = (ay + by) / 2;
  return `M ${ax} ${ay} C ${ax} ${cy}, ${bx} ${cy}, ${bx} ${by}`;
};

// Midpoint label position
const getLabelPos = (
  posA: { x: number; y: number },
  posB: { x: number; y: number }
): { x: number; y: number } => {
  const ax = posA.x + NODE_W / 2;
  const ay = posA.y + NODE_H;
  const bx = posB.x + NODE_W / 2;
  const by = posB.y;
  return { x: (ax + bx) / 2 + 6, y: (ay + by) / 2 };
};

const connectionLabels: Record<string, string> = {
  'DataSource-DataAsset': 'contains',
  'DataAsset-Field': 'contains',
  'Field-SemanticAssertion': 'has_assertion',
  'Field-DataQualityRule': 'checked_by',
  'SemanticAssertion-Evidence': 'supported_by',
  'DataQualityRule-DataIssue': 'produces',
  'Evidence-GovernanceTask': 'assigned_to',
  'DataIssue-GovernanceTask': 'assigned_to',
  'Run-Snapshot': 'generates',
};

const getPanoramaPathD = (nodeA: string, nodeB: string): string => {
  if (nodeA === 'DataSource' && nodeB === 'DataAsset') return 'M 176 82 L 200 82';
  if (nodeA === 'DataAsset' && nodeB === 'Field') return 'M 336 82 L 370 82';
  if (nodeA === 'Field' && nodeB === 'SemanticAssertion') return 'M 506 82 L 550 82';
  if (nodeA === 'SemanticAssertion' && nodeB === 'Evidence') return 'M 686 82 L 710 82';
  if (nodeA === 'Field' && nodeB === 'DataQualityRule') return 'M 438 114 C 438 162, 618 162, 618 210';
  if (nodeA === 'DataQualityRule' && nodeB === 'DataIssue') return 'M 686 242 L 710 242';
  if (nodeA === 'Evidence' && nodeB === 'GovernanceTask') return 'M 778 114 C 778 170, 438 150, 438 210';
  if (nodeA === 'DataIssue' && nodeB === 'GovernanceTask') return 'M 710 242 L 506 242';
  if (nodeA === 'Run' && nodeB === 'Snapshot') return 'M 336 382 L 370 382';
  if (nodeA === 'Snapshot' && nodeB === 'SemanticAssertion') return 'M 438 350 C 438 230, 618 230, 618 114';
  return '';
};

const panoramaLabels: Record<string, { x: number, y: number, text: string, textAnchor?: string, transform?: string }> = {
  'DataSource-DataAsset': { x: 188, y: 72, text: 'contains', textAnchor: 'middle' },
  'DataAsset-Field': { x: 353, y: 72, text: 'contains', textAnchor: 'middle' },
  'Field-SemanticAssertion': { x: 528, y: 72, text: 'has_assertion', textAnchor: 'middle' },
  'SemanticAssertion-Evidence': { x: 698, y: 72, text: 'supported_by', textAnchor: 'middle' },
  'Field-DataQualityRule': { x: 510, y: 155, text: 'checked_by', textAnchor: 'middle', transform: 'rotate(20 510 155)' },
  'DataQualityRule-DataIssue': { x: 698, y: 232, text: 'produces', textAnchor: 'middle' },
  'Evidence-GovernanceTask': { x: 620, y: 140, text: 'assigned_to', textAnchor: 'middle', transform: 'rotate(-20 620 140)' },
  'DataIssue-GovernanceTask': { x: 608, y: 232, text: 'assigned_to', textAnchor: 'middle' },
  'Run-Snapshot': { x: 353, y: 372, text: 'generates', textAnchor: 'middle' },
  'Snapshot-SemanticAssertion': { x: 505, y: 265, text: 'includes', textAnchor: 'middle', transform: 'rotate(-40 505 265)' }
};

const panoramaConnections = [
  { from: 'DataSource', to: 'DataAsset' },
  { from: 'DataAsset', to: 'Field' },
  { from: 'Field', to: 'SemanticAssertion' },
  { from: 'SemanticAssertion', to: 'Evidence' },
  { from: 'Field', to: 'DataQualityRule' },
  { from: 'DataQualityRule', to: 'DataIssue' },
  { from: 'Evidence', to: 'GovernanceTask' },
  { from: 'DataIssue', to: 'GovernanceTask' },
  { from: 'Run', to: 'Snapshot' },
  { from: 'Snapshot', to: 'SemanticAssertion' }
];

export default function Overview() {
  const navigate = useUiStore((s) => s.navigate);
  const setCreateDrawerOpen = useUiStore((s) => s.setCreateDrawerOpen);
  const onCreateChangeSet = () => setCreateDrawerOpen(true);
  const onRunValidation = () => {
    alert("🔍 开始扫描逻辑一致性... \n一式 10 个 Object Type, 8 个 Link Type, 8 个绑定能力全链节点扫描完成！状态完美正常，检验无破坏。");
  };
  const tabs = [
    '模型总览', '对象模型', '关系模型', '能力绑定', '动作 (Action)', 
    '流程 (Workflow)', '权限策略', '版本与发布', '变更集'
  ];

  // Canvas node positions (top-left pixel coords)
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>(() => ({
    DataSource:       { x: 152, y: 16 },
    DataAsset:        { x: 152, y: 100 },
    Field:            { x: 152, y: 184 },
    SemanticAssertion:{ x: 32,  y: 273 },
    DataQualityRule:  { x: 272, y: 273 },
    Evidence:         { x: 32,  y: 373 },
    DataIssue:        { x: 272, y: 373 },
    GovernanceTask:   { x: 152, y: 473 },
    Run:              { x: 332, y: 100 },
    Snapshot:         { x: 332, y: 184 },
  }));

  // Drag state
  const draggingRef = useRef<{ nodeId: string; startMouseX: number; startMouseY: number; startNodeX: number; startNodeY: number } | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // Hover tooltip
  const [tooltipNode, setTooltipNode] = useState<string | null>(null);
  const tooltipTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const pos = nodePositions[nodeId];
    draggingRef.current = {
      nodeId,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startNodeX: pos.x,
      startNodeY: pos.y,
    };
    setDraggingId(nodeId);
    setTooltipNode(null); // hide tooltip while dragging
  }, [nodePositions]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      const { nodeId, startMouseX, startMouseY, startNodeX, startNodeY } = draggingRef.current;
      const dx = e.clientX - startMouseX;
      const dy = e.clientY - startMouseY;
      setNodePositions(prev => ({
        ...prev,
        [nodeId]: { x: startNodeX + dx, y: startNodeY + dy },
      }));
    };
    const onMouseUp = () => {
      draggingRef.current = null;
      setDraggingId(null);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  const handleNodeMouseEnter = useCallback((nodeId: string) => {
    setHoveredNodeId(nodeId);
    if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current);
    tooltipTimeout.current = setTimeout(() => setTooltipNode(nodeId), 300);
  }, []);

  const handleNodeMouseLeave = useCallback(() => {
    setHoveredNodeId(null);
    if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current);
    setTooltipNode(null);
  }, []);

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
  }: { 
    title: string, 
    subtitle: string, 
    icon?: any, 
    color: string,
    className?: string,
  }) => {
    const iconColors: Record<string, string> = {
      blue: 'text-blue-600 bg-blue-50/60 ring-1 ring-blue-100/50',
      green: 'text-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-100/50',
      purple: 'text-purple-600 bg-purple-50/60 ring-1 ring-purple-100/50',
      teal: 'text-teal-600 bg-teal-50/60 ring-1 ring-teal-100/50',
      orange: 'text-orange-600 bg-orange-50/60 ring-1 ring-orange-100/50',
      red: 'text-rose-600 bg-rose-50/60 ring-1 ring-rose-100/50',
    };

    const hasHover = hoveredNodeId !== null;
    const isSelf = hoveredNodeId === title;
    const isConnected = hoveredNodeId ? areConnected(title, hoveredNodeId) : false;
    const isMuted = hasHover && !isSelf && !isConnected;
    const metric = nodeMetrics[title];
    const pos = nodePositions[title];
    const isDragging = draggingId === title;

    const nodeClass = isDragging
      ? `z-50 shadow-xl scale-[1.04] bg-white border-transparent ${hoverRingColors[color]}`
      : isMuted
        ? 'opacity-25 scale-[0.95] blur-[0.2px] border-slate-100 bg-white/50'
        : isSelf
          ? `-translate-y-1 z-25 bg-white shadow-lg border-transparent ${hoverRingColors[color]}`
          : isConnected
            ? `scale-[1.02] z-20 ${connectedRingColors[color]}`
            : 'hover:shadow-md hover:-translate-y-0.5 bg-white/95 backdrop-blur-sm border-slate-200/80 hover:border-slate-350';

    return (
      <div 
        onMouseEnter={() => handleNodeMouseEnter(title)}
        onMouseLeave={handleNodeMouseLeave}
        onMouseDown={(e) => handleNodeMouseDown(e, title)}
        onClick={() => { if (!isDragging) navigate('object_model', title); }}
        className={`absolute rounded-md py-2 pl-4 pr-3 flex flex-col items-center justify-center text-center z-10 w-[136px] h-[64px] border ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} select-none transition-all duration-200 ${nodeClass} ${className || ''}`}
        style={{ left: pos.x, top: pos.y }}
      >
        {/* Left Category Accent Stripe */}
        <div className={`absolute left-0 top-0 bottom-0 w-[4px] rounded-l-md ${leftStripeColors[color]}`} />
        
        {/* Live Metric Badge */}
        {metric && (
          <span className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold border font-mono tracking-tighter leading-none scale-[0.85] origin-top-right ${
            metric.color || 'bg-slate-100 text-slate-650 border-slate-250/65'
          }`}>
            {metric.count}
          </span>
        )}

        <div className="flex items-center gap-2 w-full pl-0.5">
          {Icon && (
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconColors[color]}`}>
              <Icon className="w-4 h-4" />
            </div>
          )}
          <div className="text-left min-w-0 flex-1">
            <div className="text-[12px] font-extrabold font-mono tracking-tight text-slate-800 truncate" title={title}>{title}</div>
            <div className="text-[10px] font-bold text-slate-450 mt-0.5 truncate" title={subtitle}>{subtitle}</div>
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
    const metric = nodeMetrics[id];
    
    // Custom selection glow rings inside the dark modal based on category color
    const categorySelClasses: Record<string, string> = {
      blue: 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)] ring-2 ring-blue-500/50',
      green: 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] ring-2 ring-emerald-500/50',
      purple: 'border-purple-500 shadow-[0_0_20px_rgba(139,92,246,0.3)] ring-2 ring-purple-500/50',
      teal: 'border-teal-500 shadow-[0_0_20px_rgba(20,184,166,0.3)] ring-2 ring-teal-500/50',
      orange: 'border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.3)] ring-2 ring-orange-500/50',
      red: 'border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.3)] ring-2 ring-rose-500/50',
    };
    
    const nodeClass = isSelected 
      ? `bg-slate-900/95 ${categorySelClasses[color]} scale-[1.04] -translate-y-0.5` 
      : 'bg-slate-900/80 border-slate-700/80 hover:border-slate-500 hover:bg-slate-805 hover:scale-[1.02] hover:-translate-y-0.5 shadow-sm';

    const iconBg: Record<string, string> = {
      blue: 'bg-blue-950/60 text-blue-400 border-blue-800/60',
      green: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60',
      purple: 'bg-purple-950/60 text-purple-400 border-purple-800/60',
      teal: 'bg-teal-950/60 text-teal-400 border-teal-800/60',
      orange: 'bg-orange-950/60 text-orange-400 border-orange-800/60',
      red: 'bg-rose-950/60 text-rose-450 border-rose-800/60',
    };

    return (
      <div 
        onClick={() => setSelectedPanoramaNodeId(id)}
        className={`absolute rounded-md py-2.5 pl-4 pr-3 flex flex-col items-center justify-center text-center z-10 w-[136px] h-[64px] border cursor-pointer select-none transition-all duration-300 ${nodeClass}`}
        style={style}
      >
        {/* Left Category Accent Stripe */}
        <div className={`absolute left-0 top-0 bottom-0 w-[4px] rounded-l-xl ${leftStripeColors[color]}`} />
        
        {/* Live Metric Badge */}
        {metric && (
          <span className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold border font-mono tracking-tighter leading-none scale-[0.85] origin-top-right ${
            metric.color || 'bg-slate-800/80 text-slate-300 border-slate-700/60'
          }`}>
            {metric.count}
          </span>
        )}

        <div className="flex items-center gap-2.5 w-full pl-0.5">
          {icon && (
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${iconBg[color]}`}>
              <IconComp className="w-4 h-4" />
            </div>
          )}
          <div className="text-left min-w-0 flex-1">
            <div className="text-[12px] font-extrabold font-mono tracking-tight text-slate-100 truncate">{id}</div>
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
             <span className="hover:text-blue-600 cursor-pointer transition-colors" onClick={() => navigate('overview')}>管理中心</span>
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
              if (tab === '模型总览') navigate('overview');
              if (tab === '对象模型') navigate('object_model');
              if (tab === '关系模型') navigate('relation_model');
              if (tab === '能力绑定' || tab === '能力 (Function)') navigate('capability_binding');
              if (tab === '动作 (Action)') navigate('action_model');
              if (tab === '流程 (Workflow)') navigate('workflow_orchestration');
              if (tab === '版本与发布' || tab === '变更与发布' || tab === '变更集') navigate('change_release');
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

      {/* 顶部横向：待处理事项与风险 */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="flex items-center justify-between p-4 rounded-md border border-rose-100 bg-rose-50/50 hover:bg-rose-50 transition-colors shadow-sm cursor-pointer group">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform"><Box className="w-4 h-4" /></div>
            <div>
              <div className="text-[13px] font-bold text-slate-800 tracking-tight">2 个 Object Type</div>
              <div className="text-[11px] text-slate-500">有未发布变更</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-rose-400 group-hover:translate-x-0.5 transition-transform" />
        </div>
        <div className="flex items-center justify-between p-4 rounded-md border border-orange-100 bg-orange-50/50 hover:bg-orange-50 transition-colors shadow-sm cursor-pointer group">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform"><GitMerge className="w-4 h-4" /></div>
            <div>
              <div className="text-[13px] font-bold text-slate-800 tracking-tight">1 个 Workflow</div>
              <div className="text-[11px] text-slate-500">受影响</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-orange-400 group-hover:translate-x-0.5 transition-transform" />
        </div>
        <div className="flex items-center justify-between p-4 rounded-md border border-rose-100 bg-rose-50/50 hover:bg-rose-50 transition-colors shadow-sm cursor-pointer group">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 font-bold italic group-hover:scale-110 transition-transform">fx</div>
            <div>
              <div className="text-[13px] font-bold text-slate-800 tracking-tight">3 个 Function</div>
              <div className="text-[11px] text-slate-500">需要重新测试</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-rose-400 group-hover:translate-x-0.5 transition-transform" />
        </div>
        <div className="flex items-center justify-between p-4 rounded-md border border-orange-100 bg-orange-50/50 hover:bg-orange-50 transition-colors shadow-sm cursor-pointer group">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform"><Shield className="w-4 h-4" /></div>
            <div>
              <div className="text-[13px] font-bold text-slate-800 tracking-tight">1 个 AI 场景</div>
              <div className="text-[11px] text-slate-500">需要重新校验</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-orange-400 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>

      {/* 主体二列工作区 */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 transition-all duration-500">
        
        {/* 左栏：核心对象结构 */}
        <div className="md:col-span-7 bg-white border border-slate-200 rounded-lg p-6 shadow-sm flex flex-col">
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
                onClick={() => navigate('relation_model')}
              >
                <span>关系模型</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          </div>
          
          <div className="flex-1 min-h-[560px] flex items-center justify-center p-2 bg-slate-50/30 rounded-lg border border-slate-200/50 shadow-inner mt-2 relative overflow-hidden group">
            {/* Ambient glowing orbs */}
            <div className="absolute -top-20 -left-20 w-72 h-72 bg-blue-400/20 rounded-full blur-[80px] pointer-events-none group-hover:bg-blue-400/30 transition-colors duration-1000" style={{ animation: 'float-slow 8s ease-in-out infinite' }}></div>
            <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-emerald-400/20 rounded-full blur-[80px] pointer-events-none group-hover:bg-emerald-400/30 transition-colors duration-1000" style={{ animation: 'float-slow 12s ease-in-out infinite reverse' }}></div>
            
            {/* Visual Grid Backdrop - static */}
            <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1.5px,transparent_1.5px)] opacity-60 [background-size:24px_24px] pointer-events-none rounded-lg group-hover:opacity-80 transition-opacity duration-1000"></div>
            
            <div className="relative w-[460px] h-[580px] shrink-0 overflow-visible z-10 animate-fade-in">
              <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" style={{ zIndex: 0 }}>
                <defs>
                  <style>{`
                    @keyframes float-slow {
                      0%, 100% { transform: translateY(0) scale(1); }
                      50% { transform: translateY(-20px) scale(1.05); }
                    }
                    @keyframes flow-dash {
                      to {
                        stroke-dashoffset: -40;
                      }
                    }
                    .flow-active-trail {
                      stroke-dasharray: 4 16;
                      animation: flow-dash 1.5s linear infinite;
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

                {/* Render All Connections - dynamic paths from nodePositions */}
                {[
                  ['DataSource', 'DataAsset'],
                  ['DataAsset', 'Field'],
                  ['Field', 'SemanticAssertion'],
                  ['Field', 'DataQualityRule'],
                  ['SemanticAssertion', 'Evidence'],
                  ['DataQualityRule', 'DataIssue'],
                  ['Evidence', 'GovernanceTask'],
                  ['DataIssue', 'GovernanceTask'],
                  ['Run', 'Snapshot']
                ].map(([nodeA, nodeB]) => {
                  const posA = nodePositions[nodeA];
                  const posB = nodePositions[nodeB];
                  if (!posA || !posB) return null;
                  const pathD = getDynamicPath(posA, posB);
                  const labelPos = getLabelPos(posA, posB);
                  const labelText = connectionLabels[`${nodeA}-${nodeB}`];
                  const textProps = getTextProps(nodeA, nodeB);
                  const key = `${nodeA}-${nodeB}`;
                  const hasHover = hoveredNodeId !== null;
                  const isRelated = hoveredNodeId === nodeA || hoveredNodeId === nodeB;
                  const col = getLineColor(nodeA, nodeB);
                  
                  return (
                    <g key={key}>
                      {/* Base glowing shadow path */}
                      <path
                        d={pathD}
                        fill="none"
                        stroke={hasHover ? (isRelated ? col : '#cbd5e1') : '#cbd5e1'}
                        strokeWidth={isRelated ? 2.5 : 1}
                        opacity={hasHover ? (isRelated ? 0.3 : 0.1) : 0.5}
                        style={{
                          filter: isRelated ? `drop-shadow(0 0 4px ${col})` : 'none'
                        }}
                      />
                      {/* Main connection path */}
                      <path
                        d={pathD}
                        fill="none"
                        stroke={hasHover ? (isRelated ? col : '#e2e8f0') : '#cbd5e1'}
                        strokeWidth={isRelated ? 1.5 : 1}
                        opacity={hasHover ? (isRelated ? 1 : 0.2) : 1}
                        markerEnd={hasHover ? (isRelated ? getActiveMarker(nodeA, nodeB) : 'url(#arrowhead-slate)') : 'url(#arrowhead-slate)'}
                      />
                      {/* Active Light Trail Overlay */}
                      {isRelated && (
                        <path
                          d={pathD}
                          fill="none"
                          stroke={col}
                          strokeWidth={1.5}
                          strokeLinecap="round"
                          className="flow-active-trail"
                          style={{ filter: `drop-shadow(0 0 2px ${col})` }}
                        />
                      )}
                      {/* Edge Label */}
                      {labelText && (
                        <text
                          x={labelPos.x}
                          y={labelPos.y}
                          textAnchor="start"
                          {...textProps}
                          fontSize="9"
                          fontFamily="monospace"
                        >
                          {labelText}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Nodes - positions are now managed by nodePositions state */}
              <Node title="DataSource" subtitle="数据源" icon={Database} color="blue" />
              <Node title="DataAsset" subtitle="数据资产" icon={Box} color="blue" />
              <Node title="Field" subtitle="字段" icon={LayoutGrid} color="blue" />
              
              <Node title="SemanticAssertion" subtitle="语义断言" icon={Shield} color="green" />
              <Node title="DataQualityRule" subtitle="质量规则" icon={CheckCircle2} color="green" />
              
              <Node title="Evidence" subtitle="证据" icon={FileCode} color="teal" />
              <Node title="DataIssue" subtitle="数据问题" icon={AlertTriangle} color="red" />
              
              <Node title="GovernanceTask" subtitle="治理任务" icon={Target} color="purple" />
              
              <Node title="Run" subtitle="检测记录" icon={Play} color="blue" />
              <Node title="Snapshot" subtitle="状态快照" icon={Box} color="orange" />

              {/* Hover Tooltip Panel */}
              {tooltipNode && PANORAMA_NODE_DETAILS[tooltipNode] && (() => {
                const pos = nodePositions[tooltipNode];
                const detail = PANORAMA_NODE_DETAILS[tooltipNode];
                const colorMap: Record<string, string> = {
                  DataSource: 'blue', DataAsset: 'blue', Field: 'blue', Run: 'blue',
                  SemanticAssertion: 'green', Evidence: 'teal',
                  DataQualityRule: 'green', DataIssue: 'red',
                  GovernanceTask: 'purple', Snapshot: 'orange',
                };
                const c = colorMap[tooltipNode] || 'blue';
                const accentMap: Record<string, string> = {
                  blue: 'border-l-blue-500 bg-blue-50/80 text-blue-700',
                  green: 'border-l-emerald-500 bg-emerald-50/80 text-emerald-700',
                  teal: 'border-l-teal-500 bg-teal-50/80 text-teal-700',
                  orange: 'border-l-orange-500 bg-orange-50/80 text-orange-700',
                  purple: 'border-l-purple-500 bg-purple-50/80 text-purple-700',
                  red: 'border-l-rose-500 bg-rose-50/80 text-rose-700',
                };
                // Place tooltip to the right of the node, fallback to left
                const tooltipLeft = pos.x + NODE_W + 12;
                const tooltipTop = pos.y;
                return (
                  <div
                    key={tooltipNode}
                    className="absolute z-50 w-56 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg shadow-xl p-3 pointer-events-none animate-fade-in"
                    style={{ left: tooltipLeft, top: tooltipTop }}
                  >
                    {/* Header */}
                    <div className={`border-l-4 pl-2.5 rounded-sm mb-2.5 ${accentMap[c]}`}>
                      <div className="text-[11px] font-extrabold tracking-tight leading-tight">{detail.title}</div>
                      <div className="text-[9px] font-semibold opacity-70 mt-0.5">{detail.group}</div>
                    </div>

                    {/* Quick stats */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 bg-slate-50 border border-slate-100 rounded p-1.5 text-center">
                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">实例规模</div>
                        <div className="text-[10px] font-extrabold text-slate-700 mt-0.5">{detail.instanceCount}</div>
                      </div>
                      <div className="flex-1 bg-slate-50 border border-slate-100 rounded p-1.5 text-center">
                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">责任域</div>
                        <div className="text-[10px] font-extrabold text-slate-700 mt-0.5 truncate" title={detail.owner}>{detail.owner}</div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-[10px] text-slate-600 leading-relaxed line-clamp-3 mb-2">{detail.description}</p>

                    {/* Properties */}
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">核心属性</div>
                    <div className="flex flex-wrap gap-1">
                      {detail.properties.slice(0, 3).map(p => (
                        <span key={p} className="text-[9px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 truncate max-w-[100px]" title={p}>{p.split(' ')[0]}</span>
                      ))}
                    </div>

                    {/* Lifecycle */}
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-2 mb-1">生命周期</div>
                    <div className="flex gap-0.5">
                      {detail.lifecycle.slice(0, 4).map((lc, i) => (
                        <div key={i} className={`flex-1 h-1 rounded-full ${i === 0 ? 'bg-emerald-400' : i === 1 ? 'bg-blue-400' : i === 2 ? 'bg-orange-400' : 'bg-slate-200'}`} title={lc} />
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* 中栏：模型健康状态 */}
        <div className="md:col-span-5 bg-white border border-slate-200 rounded-lg p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
              模型健康状态 <Info className="w-4 h-4 text-slate-400 cursor-pointer" />
            </h2>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="border border-slate-100 bg-slate-50 rounded-md p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600"><Box className="w-5 h-5" /></div>
              <div><div className="text-[11px] text-slate-500 font-bold mb-0.5">Object Type</div><div className="text-xl font-black text-slate-800">10</div></div>
            </div>
            <div className="border border-slate-100 bg-slate-50 rounded-md p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600"><LinkIcon className="w-5 h-5" /></div>
              <div><div className="text-[11px] text-slate-500 font-bold mb-0.5">Link Type</div><div className="text-xl font-black text-slate-800">18</div></div>
            </div>
            <div className="border border-slate-100 bg-slate-50 rounded-md p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold italic">fx</div>
              <div><div className="text-[11px] text-slate-500 font-bold mb-0.5">Function</div><div className="text-xl font-black text-slate-800">12</div></div>
            </div>
            <div className="border border-slate-100 bg-slate-50 rounded-md p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600"><Play className="w-5 h-5" /></div>
              <div><div className="text-[11px] text-slate-500 font-bold mb-0.5">Action</div><div className="text-xl font-black text-slate-800">16</div></div>
            </div>
            <div className="border border-slate-100 bg-slate-50 rounded-md p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600"><GitMerge className="w-5 h-5" /></div>
              <div><div className="text-[11px] text-slate-500 font-bold mb-0.5">Workflow</div><div className="text-xl font-black text-slate-800">6</div></div>
            </div>
            <div className="border border-slate-100 bg-slate-50 rounded-md p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600"><Shield className="w-5 h-5" /></div>
              <div><div className="text-[11px] text-slate-500 font-bold mb-0.5">校验结果</div><div className="text-[15px] font-black tracking-tight"><span className="text-emerald-500">0</span> <span className="text-slate-400 font-medium text-[11px]">错误</span> / <span className="text-orange-500">2</span> <span className="text-slate-400 font-medium text-[11px]">警告</span></div></div>
            </div>
            <div className="border border-slate-100 bg-slate-50 rounded-md p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600"><Target className="w-5 h-5" /></div>
              <div><div className="text-[11px] text-slate-500 font-bold mb-0.5">AI 使用场景</div><div className="text-xl font-black text-slate-800">3</div></div>
            </div>
            <div className="border border-slate-100 bg-slate-50 rounded-md p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600"><Settings className="w-5 h-5" /></div>
              <div><div className="text-[11px] text-slate-500 font-bold mb-0.5">知识网络视图</div><div className="text-xl font-black text-slate-800">5</div></div>
            </div>
          </div>

          <div className="mt-auto border border-slate-100 bg-slate-50 rounded-md p-5 flex items-center gap-6">
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



      </div>

      {/* 底部两列图表/记录区 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pb-12">
        
        {/* 最近变更 */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
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
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
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
          <div className="bg-slate-900 border border-slate-800 rounded-lg w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden shadow-2xl text-slate-100">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
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
                className="w-10 h-10 rounded-md bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-400 flex items-center justify-center transition-colors cursor-pointer border border-slate-800 shadow-inner"
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
                <div className="absolute inset-0 bg-[radial-gradient(#334155_1.2px,transparent_1.2px)] opacity-35 [background-size:20px_20px] pointer-events-none rounded-lg"></div>

                <div className="relative w-[880px] h-[450px] shrink-0 z-10">
                  {/* SVG paths representing highlighted lines */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                    <defs>
                      <style>{`
                        @keyframes flow-dash {
                          to {
                            stroke-dashoffset: -40;
                          }
                        }
                        .flow-active-trail {
                          stroke-dasharray: 6 14;
                          animation: flow-dash 1.2s linear infinite;
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
                      <marker id="arrowhead-slate" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                        <polygon points="0 0, 6 3, 0 6" fill="#475569" />
                      </marker>
                      <marker id="arrowhead-blue" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                        <polygon points="0 0, 6 3, 0 6" fill="#3b82f6" />
                      </marker>
                      <marker id="arrowhead-emerald" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                        <polygon points="0 0, 6 3, 0 6" fill="#10b981" />
                      </marker>
                      <marker id="arrowhead-rose" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                        <polygon points="0 0, 6 3, 0 6" fill="#f43f5e" />
                      </marker>
                      <marker id="arrowhead-purple" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                        <polygon points="0 0, 6 3, 0 6" fill="#7c3aed" />
                      </marker>
                    </defs>

                    {/* Loop through all Panorama Connections */}
                    {panoramaConnections.map(({ from, to }) => {
                      if (!isLineVisible(from, to)) return null;
                      
                      const pathD = getPanoramaPathD(from, to);
                      if (!pathD) return null;
                      
                      const isSelected = selectedPanoramaNodeId === from || selectedPanoramaNodeId === to;
                      const col = getLineColor(from, to);
                      const key = `${from}-${to}`;
                      const label = panoramaLabels[key];
                      
                      // Highlight line if filter is active or connected node is selected
                      const isHighlighted = panoramaFilter !== 'all' || isSelected;
                      
                      return (
                        <g key={key}>
                          {/* Base Glowing Path */}
                          <path
                            d={pathD}
                            fill="none"
                            stroke={isHighlighted ? col : '#334155'}
                            strokeWidth={isHighlighted ? 3.5 : 1.5}
                            opacity={isHighlighted ? 0.35 : 0.4}
                            className="transition-all duration-300"
                            style={{
                              filter: isHighlighted ? `drop-shadow(0 0 3px ${col})` : 'none'
                            }}
                          />
                          
                          {/* Main Connection Path */}
                          <path
                            d={pathD}
                            fill="none"
                            stroke={isHighlighted ? col : '#475569'}
                            strokeWidth={isHighlighted ? 2 : 1.2}
                            opacity={isHighlighted ? 1 : 0.5}
                            markerEnd={isHighlighted ? getActiveMarker(from, to) : "url(#arrowhead-slate)"}
                            className="transition-all duration-300"
                          />
                          
                          {/* Flowing Light Trail Overlay */}
                          {isHighlighted && (
                            <path
                              d={pathD}
                              fill="none"
                              stroke={col}
                              strokeWidth={1.8}
                              strokeLinecap="round"
                              className="flow-active-trail"
                              style={{
                                filter: `drop-shadow(0 0 2px ${col})`
                              }}
                            />
                          )}
                          
                          {/* Text Label */}
                          {label && (
                            <text
                              x={label.x}
                              y={label.y}
                              transform={label.transform}
                              textAnchor={label.textAnchor || 'middle'}
                              fill={isHighlighted ? col : '#64748b'}
                              opacity={isHighlighted ? 1 : 0.6}
                              fontWeight={isHighlighted ? 'extrabold' : 'bold'}
                              fontSize="9.5"
                              fontFamily="monospace"
                              className="transition-all duration-300"
                            >
                              {label.text}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </svg>

                  {/* Pulsing Highlight Rings on Selection */}
                  {Object.entries({
                    DataSource: { x: 108, y: 82, col: 'rgba(59,130,246,0.35)' },
                    DataAsset: { x: 268, y: 82, col: 'rgba(59,130,246,0.35)' },
                    Field: { x: 438, y: 82, col: 'rgba(59,130,246,0.35)' },
                    SemanticAssertion: { x: 618, y: 82, col: 'rgba(16,185,129,0.35)' },
                    Evidence: { x: 778, y: 82, col: 'rgba(20,184,166,0.35)' },
                    DataQualityRule: { x: 618, y: 242, col: 'rgba(244,63,94,0.35)' },
                    DataIssue: { x: 778, y: 242, col: 'rgba(244,63,94,0.35)' },
                    GovernanceTask: { x: 438, y: 242, col: 'rgba(139,92,246,0.35)' },
                    Run: { x: 268, y: 382, col: 'rgba(59,130,246,0.35)' },
                    Snapshot: { x: 438, y: 382, col: 'rgba(249,115,22,0.35)' }
                  }).map(([id, item]) => selectedPanoramaNodeId === id && (
                    <div 
                      key={id}
                      className="absolute rounded-full pointer-events-none"
                      style={{
                        left: `${item.x - 45}px`,
                        top: `${item.y - 45}px`,
                        width: '90px',
                        height: '90px',
                        background: item.col,
                        filter: 'blur(12px)',
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
                          navigate('object_model', selectedPanoramaNodeId);
                        }}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold transition-all shadow-lg shadow-blue-500/10 flex items-center justify-center gap-1.5 cursor-pointer"
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

