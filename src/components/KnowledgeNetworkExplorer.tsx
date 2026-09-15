import React, { useState, useMemo, useEffect } from 'react';
import { 
  Compass, Search, ChevronDown, CheckSquare, Square, 
  Layers, Box, Activity, ShieldAlert, AlertTriangle, Info,
  ArrowRight, Link as LinkIcon, Database, User,
  Settings, Maximize2, Minimize2, RotateCcw, ZoomIn, ZoomOut,
  Maximize, Eye, Network, FilePlus, PlusCircle, BarChart3, Sparkles, Check, Share2, Download, Bookmark
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface KnowledgeNetworkExplorerProps {
  onNavigate: (view: string) => void;
}

interface GraphNode {
  id: string;
  label: string;
  type: 'core' | 'governance' | 'relation';
  typeName: string; // e.g. "DataSource", "Field"
  nameCn: string;
  x: number;
  y: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  dotColor: string;
  details: {
    nameCn: string;
    asset: string;
    source: string;
    dataType: string;
    desc: string;
    createdAt: string;
    updatedAt: string;
    owner: string;
    stats: {
      assertions: number;
      evidences: number;
      rules: number;
      issues: number;
      tasks: number;
      refs: number;
    };
    insights: string[];
  };
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  type: string;
}

export default function KnowledgeNetworkExplorer({ onNavigate }: KnowledgeNetworkExplorerProps) {
  // Main selected node ID matches default in mockup image
  const [selectedNodeId, setSelectedNodeId] = useState<string>('Field: supplier_id');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [relationshipDepth, setRelationshipDepth] = useState<number>(3);
  const [layoutType, setLayoutType] = useState<string>('力导向布局');
  
  // Left Sidebar object type checkboxes
  const [objSearchTerm, setObjSearchTerm] = useState<string>('');
  const [checkedCatalog, setCheckedCatalog] = useState<Record<string, boolean>>({
    all: true,
    DataSource: true,
    DataAsset: true,
    Field: true,
    SemanticAssertion: true,
    Evidence: true,
    DataQualityRule: true,
    DataIssue: true,
    GovernanceTask: true,
    Run: true,
    Snapshot: true,
    contains: true,
    has_assertion: true,
    supported_by: true,
    checked_by: true,
    maps_to: true,
    generated_by: true
  });

  // Right sidebar tab active selection
  const [activeTab, setActiveTab] = useState<'overview' | 'attrs' | 'relations' | 'evidences' | 'quality' | 'tasks'>('overview');

  // Interactive zoom
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isGraphFullscreen, setIsGraphFullscreen] = useState<boolean>(false);

  // Path highlight simulation triggers
  const [highlightedPath, setHighlightedPath] = useState<string[]>([]);
  const [activeHighlightIndex, setActiveHighlightIndex] = useState<number>(-1);

  // Node positions state
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});
  
  // Dragging states
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, clientX: 0, clientY: 0 });
  
  // Panning states
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Toggle Left taxonomy categories
  const handleToggleCatalog = (key: string) => {
    if (key === 'all') {
      const targetState = !checkedCatalog.all;
      const updated = { ...checkedCatalog };
      Object.keys(updated).forEach(k => {
        updated[k] = targetState;
      });
      setCheckedCatalog(updated);
    } else {
      setCheckedCatalog(prev => {
        const next = { ...prev, [key]: !prev[key] };
        // If everything except 'all' is true, make 'all' true, etc
        const keysMinusAll = Object.keys(next).filter(k => k !== 'all');
        const allChecked = keysMinusAll.every(k => next[k]);
        next.all = allChecked;
        return next;
      });
    }
  };

  // Node details & properties mock matching the mockup layout and values exactly
  const nodes: GraphNode[] = useMemo(() => [
    {
      id: 'DataSource: ERP_Supplier',
      label: 'ERP_Supplier',
      type: 'core',
      typeName: 'DataSource',
      nameCn: 'ERP_Supplier',
      x: 480,
      y: 120,
      icon: <Database className="w-4 h-4 text-emerald-600" />,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50/70 border-emerald-300',
      borderColor: 'border-emerald-300',
      textColor: 'text-emerald-800',
      dotColor: 'bg-emerald-500',
      details: {
        nameCn: 'ERP_Supplier (ERP供应商主物理源)',
        asset: 'ERP_Supplier',
        source: 'SAP ERP Server 01',
        dataType: 'Database Table (RDBMS)',
        desc: '承载集团范围内全部采销合同供应商、潜在合作厂商以及注册承运商明细。每日定时通过 CDC 提取入湖，属于 A 级核心数据源。',
        createdAt: '2024-03-12 11:20:00',
        updatedAt: '2026-06-15 02:11:45',
        owner: '仓储系统研发组 / 常静',
        stats: { assertions: 1, evidences: 12, rules: 6, issues: 0, tasks: 1, refs: 180 },
        insights: [
          '数据源安全等级：S级机密，涉及采购成本数据敏感属性',
          '已通过全自动化语法规则校验，无格式破损',
          '该物理表已被 3 个业务 DKN 场景包依赖'
        ]
      }
    },
    {
      id: 'DataAsset: supplier',
      label: 'supplier',
      type: 'core',
      typeName: 'DataAsset',
      nameCn: 'supplier',
      x: 280,
      y: 140,
      icon: <Layers className="w-4 h-4 text-blue-600" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50/75 border-blue-300',
      borderColor: 'border-blue-300',
      textColor: 'text-blue-800',
      dotColor: 'bg-blue-500',
      details: {
        nameCn: 'supplier (供应商核心资产层)',
        asset: 'supplier',
        source: 'ERP_Supplier.t_supplier_main',
        dataType: 'Logical Asset Entity',
        desc: '汇聚了供应链侧已过审供应商名单，集成多源资质，是数据中台提供统一供应商信息 API 的底层逻辑资产。',
        createdAt: '2024-05-18 14:02:10',
        updatedAt: '2026-06-14 18:22:10',
        owner: '中台资产运营组 / 常静',
        stats: { assertions: 6, evidences: 8, rules: 4, issues: 1, tasks: 2, refs: 86 },
        insights: [
          '核心实体实体率 100%，覆盖率已通过集团双重校验',
          '该资产最近新增 1 个资质断言，用于保证三证合一合规'
        ]
      }
    },
    {
      id: 'Field: supplier_id',
      label: 'supplier_id',
      type: 'core',
      typeName: 'Field',
      nameCn: 'supplier_id',
      x: 380,
      y: 260,
      icon: <Compass className="w-4 h-4 text-teal-650" />,
      color: 'text-teal-650',
      bgColor: 'bg-cyan-50/80 border-teal-300',
      borderColor: 'border-teal-300',
      textColor: 'text-teal-900',
      dotColor: 'bg-[#14b8a6]',
      details: {
        nameCn: '供应商ID',
        asset: 'supplier',
        source: 'ERP_Supplier',
        dataType: 'varchar(20)',
        desc: '记录供应商唯一标识，用于关联供应商信息。',
        createdAt: '2025-05-10 10:30:22',
        updatedAt: '2025-06-14 10:28:11',
        owner: '数据治理团队',
        stats: { assertions: 2, evidences: 3, rules: 2, issues: 1, tasks: 2, refs: 12 },
        insights: [
          '该字段存在 1 个高置信度语义断言 (置信度 0.92)',
          '样本值证据覆盖率 98.7%，可信度较高',
          '该字段近期由 2 个规则检测，未发现异常',
          '推荐将该字段映射到 DKN 领域概念：Supplier Identifier'
        ]
      }
    },
    {
      id: 'SemanticAssertion: 供应商标识字段',
      label: 'SemanticAssertion',
      type: 'core',
      typeName: 'SemanticAssertion',
      nameCn: '供应商标识字段',
      x: 530,
      y: 260,
      icon: <Activity className="w-4 h-4 text-purple-600" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50/70 border-purple-300',
      borderColor: 'border-purple-300',
      textColor: 'text-purple-800',
      dotColor: 'bg-purple-500',
      details: {
        nameCn: '供应商唯一表示断言',
        asset: 'supplier',
        source: 'AI-Governance-Reasoner',
        dataType: 'Semantic Assertion Class',
        desc: '经由 AI 数据语义模型推理断定：此字段不仅在物理库中为主键，而且在语义深度上100%映射为集团「供应商编码」模型。',
        createdAt: '2025-06-12 18:32:00',
        updatedAt: '2026-06-15 10:10:00',
        owner: 'AI 语义推理工作组',
        stats: { assertions: 1, evidences: 2, rules: 1, issues: 0, tasks: 0, refs: 5 },
        insights: [
          '基于样本特征和格式结构多角度契合，其计算置信度达 92.4%',
          '下游业务组件及看板均已建立在当前发布断言基础上'
        ]
      }
    },
    {
      id: 'Evidence: 样本值证据',
      label: 'Evidence',
      type: 'core',
      typeName: 'Evidence',
      nameCn: '样本值证据',
      x: 650,
      y: 180,
      icon: <CheckSquare className="w-4 h-4 text-sky-600" />,
      color: 'text-sky-600',
      bgColor: 'bg-sky-50/70 border-sky-300',
      borderColor: 'border-sky-300',
      textColor: 'text-sky-800',
      dotColor: 'bg-sky-400',
      details: {
        nameCn: '样本值特征分布证据',
        asset: 'supplier_id',
        source: 'Profiling-Agent-02',
        dataType: 'Data Value Profile Evidence',
        desc: '根据近 1,000,000 条真实记录 analysis，字段格式多为 [\"SUP_\" + 6位数字]，具有明显唯一序列特征，无混淆噪音。',
        createdAt: '2025-06-12 09:12:45',
        updatedAt: '2026-06-15 11:20:00',
        owner: '自动断言支撑流服务',
        stats: { assertions: 1, evidences: 1, rules: 1, issues: 0, tasks: 0, refs: 2 },
        insights: [
          '有效值覆盖率高达 99.87%，质量非常稳健',
          '发现空字符串率小于 0.01%，无异常重合'
        ]
      }
    },
    {
      id: 'Evidence: 业务规则证据',
      label: 'Evidence',
      type: 'core',
      typeName: 'Evidence',
      nameCn: '业务规则证据',
      x: 650,
      y: 340,
      icon: <CheckSquare className="w-4 h-4 text-sky-600" />,
      color: 'text-sky-600',
      bgColor: 'bg-sky-50/70 border-sky-300',
      borderColor: 'border-sky-300',
      textColor: 'text-sky-800',
      dotColor: 'bg-sky-400',
      details: {
        nameCn: '主数据业务规则规范证据',
        asset: 'master_supplier_standard',
        source: 'Master-Data-Registry',
        dataType: 'Specification Rule Evidence',
        desc: '对齐企业《主数据管理标准-商户供应商域定义标准V2.5》，确认全链路供应商采用六位数字与SUP前缀标识，语义规则完备支撑。',
        createdAt: '2025-05-30 11:22:15',
        updatedAt: '2026-06-11 10:01:45',
        owner: '集团主数据事务理事会',
        stats: { assertions: 1, evidences: 2, rules: 2, issues: 0, tasks: 0, refs: 4 },
        insights: [
          '匹配度测试达到 P级 100% 重叠',
          '与供应链关系核心映射，未检测到语义偏转'
        ]
      }
    },
    {
      id: 'DataQualityRule: 主键唯一性规则',
      label: 'DataQualityRule',
      type: 'governance',
      typeName: 'DataQualityRule',
      nameCn: '主键唯一性规则',
      x: 180,
      y: 260,
      icon: <ShieldAlert className="w-4 h-4 text-amber-650" />,
      color: 'text-amber-650',
      bgColor: 'bg-[#fffbeb] border-amber-300',
      borderColor: 'border-amber-300',
      textColor: 'text-amber-800',
      dotColor: 'bg-amber-500',
      details: {
        nameCn: '主键唯一性/非空属性完整质量规则',
        asset: 'supplier_id',
        source: 'Data-Quality-Service',
        dataType: 'SQL Check Expression Rule',
        desc: '配置每日对 `t_supplier_main` 表的 `supplier_id` 执行 SELECT supplier_id, count(1) 重复主键扫描规则，若有重复立即报警。',
        createdAt: '2025-01-10 10:00:00',
        updatedAt: '25-06-14 10:28:11',
        owner: '中台质量管理组',
        stats: { assertions: 1, evidences: 1, rules: 1, issues: 1, tasks: 1, refs: 12 },
        insights: [
          '今日调度扫描完成后触发：发现 1 条主键重叠记录，因分布式提交没有同步并发锁',
          '对下游指标波动打分 3.5% (中度影响区)'
        ]
      }
    },
    {
      id: 'DataIssue: 重复值问题',
      label: 'DataIssue',
      type: 'governance',
      typeName: 'DataIssue',
      nameCn: '重复值问题',
      x: 180,
      y: 420,
      icon: <AlertTriangle className="w-4 h-4 text-red-600" />,
      color: 'text-red-650',
      bgColor: 'bg-red-50 border-red-300',
      borderColor: 'border-red-300',
      textColor: 'text-red-900',
      dotColor: 'bg-red-500',
      details: {
        nameCn: '供应商ID偶发重复值入库异常',
        asset: 'supplier_id',
        source: 'Data-Quality-Engine-Check',
        dataType: 'Open Quality Issue (P1)',
        desc: '因物理端多级消息队列在进行断线重试时未加去重幂等限制，导致特定供应商编号 `V_SUP_9921` 出现两条记录。已经向业务团队反馈。',
        createdAt: '2026-06-15 08:30:00',
        updatedAt: '2026-06-16 01:10:00',
        owner: '数据治理运维保障组',
        stats: { assertions: 0, evidences: 0, rules: 1, issues: 1, tasks: 1, refs: 1 },
        insights: [
          '影响范围：下游 1 个销售场景报表指标展示轻微波动',
          '解决状态：工单正在流转处理，预计今日下午完成物理层删除'
        ]
      }
    },
    {
      id: 'DomainMapping: 供应商ID映射',
      label: 'DomainMapping',
      type: 'relation',
      typeName: 'DomainMapping',
      nameCn: '供应商ID映射',
      x: 380,
      y: 390,
      icon: <LinkIcon className="w-4 h-4 text-indigo-600" />,
      color: 'text-indigo-650',
      bgColor: 'bg-indigo-50/70 border-indigo-300',
      borderColor: 'border-indigo-300',
      textColor: 'text-indigo-800',
      dotColor: 'bg-indigo-500',
      details: {
        nameCn: '供应商唯一ID到核心词表领域概念对齐',
        asset: 'supplier_id',
        source: 'Semantic-Bridge-Broker',
        dataType: 'Domain Entity Bridge Mapping',
        desc: '连接具体的数仓物理表字段 `supplier_id` 与企业核心标准逻辑本体 DKN「Supplier Identifier」概念的核心连线。',
        createdAt: '2025-06-01 10:00:00',
        updatedAt: '2026-06-15 15:45:12',
        owner: '业务架构定义委员会',
        stats: { assertions: 1, evidences: 1, rules: 1, issues: 0, tasks: 0, refs: 2 },
        insights: [
          '1:1 实体精准挂接',
          '模型映射评分：0.985 (高可信资产)'
        ]
      }
    },
    {
      id: 'DomainConcept: Supplier Identifier',
      label: 'DomainConcept',
      type: 'relation',
      typeName: 'DomainConcept',
      nameCn: 'Supplier Identifier',
      x: 380,
      y: 500,
      icon: <Box className="w-4 h-4 text-emerald-700" />,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50/70 border-emerald-300',
      borderColor: 'border-emerald-300',
      textColor: 'text-emerald-900',
      dotColor: 'bg-emerald-500',
      details: {
        nameCn: 'Supplier Identifier 核心逻辑概念本体',
        asset: 'Enterprise-Ontology-V1',
        source: 'Standards-Committee',
        dataType: 'Enterprise Core Concept Class (P0)',
        desc: '全局唯一供应商公共标准本体类。用在供应链、结算、合规审核等多个子场景系统的跨域数据交换与逻辑对账。',
        createdAt: '2023-11-01 00:00:00',
        updatedAt: '2026-06-01 12:00:00',
        owner: '主数据标准化审议委员会',
        stats: { assertions: 5, evidences: 18, rules: 12, issues: 0, tasks: 0, refs: 412 },
        insights: [
          '已经被多达 142 个物理表内的独立主键直接映射对齐',
          '核心标识评定等级：最高 (P0 核心资产控制点)'
        ]
      }
    },
    {
      id: 'GovernanceTask: 确认字段语义',
      label: 'GovernanceTask',
      type: 'governance',
      typeName: 'GovernanceTask',
      nameCn: '确认字段语义',
      x: 530,
      y: 420,
      icon: <PlusCircle className="w-4 h-4 text-amber-650" />,
      color: 'text-amber-650',
      bgColor: 'bg-amber-50 border-amber-300',
      borderColor: 'border-amber-300',
      textColor: 'text-amber-900',
      dotColor: 'bg-amber-500',
      details: {
        nameCn: '确认 ERP_Supplier 的供应商字段映射任务',
        asset: 'supplier_id',
        source: 'Manual-Assisted-Audit',
        dataType: 'Collaborative Verification Task (Pending)',
        desc: '针对 AI 智能模型自动得出的 92.4% 供应商断言，需要采购域主数据业务专家常静最终在操作前台确认审核通过。',
        createdAt: '2025-06-14 10:20:00',
        updatedAt: '2026-06-16 01:20:00',
        owner: '常静',
        stats: { assertions: 1, evidences: 2, rules: 1, issues: 0, tasks: 1, refs: 1 },
        insights: [
          '已被分配到常静代办中，审批中度阻断：否',
          '通过该确认即可激活下属所有下游血缘通道的自动化监控'
        ]
      }
    }
  ], []);

  // Visual edges model matching screenshot design layout
  const edges: GraphEdge[] = useMemo(() => [
    { id: 'e1', source: 'DataSource: ERP_Supplier', target: 'DataAsset: supplier', label: 'contains', type: 'contains' },
    { id: 'e2', source: 'DataAsset: supplier', target: 'Field: supplier_id', label: 'contains', type: 'contains' },
    { id: 'e3', source: 'Field: supplier_id', target: 'SemanticAssertion: 供应商标识字段', label: 'has_assertion', type: 'has_assertion' },
    { id: 'e4', source: 'Evidence: 样本值证据', target: 'SemanticAssertion: 供应商标识字段', label: 'supported_by', type: 'supported_by' },
    { id: 'e5', source: 'Evidence: 业务规则证据', target: 'SemanticAssertion: 供应商标识字段', label: 'supported_by', type: 'supported_by' },
    { id: 'e6', source: 'Field: supplier_id', target: 'DataQualityRule: 主键唯一性规则', label: 'checked_by', type: 'checked_by' },
    { id: 'e7', source: 'DataQualityRule: 主键唯一性规则', target: 'DataIssue: 重复值问题', label: 'produces', type: 'checked_by' }, // under governance
    { id: 'e8', source: 'Field: supplier_id', target: 'DomainMapping: 供应商ID映射', label: 'maps_to', type: 'maps_to' },
    { id: 'e9', source: 'DomainMapping: 供应商ID映射', target: 'DomainConcept: Supplier Identifier', label: 'resolves_to', type: 'maps_to' },
    { id: 'e10', source: 'SemanticAssertion: 供应商标识字段', target: 'GovernanceTask: 确认字段语义', label: 'generates', type: 'generated_by' }
  ], []);

  // Object count definition for left catalog bar
  const objectTypes = [
    { id: 'DataSource', nameCn: '数据源', count: 320, group: 'core' },
    { id: 'DataAsset', nameCn: '数据资产', count: 1256, group: 'core' },
    { id: 'Field', nameCn: '语义字段', count: 12356, group: 'core' },
    { id: 'SemanticAssertion', nameCn: '语义断言', count: 8542, group: 'core' },
    { id: 'Evidence', nameCn: '验证证据', count: 6124, group: 'core' },
    { id: 'DataQualityRule', nameCn: '数据质量规则', count: 852, group: 'governance' },
    { id: 'DataIssue', nameCn: '数据缺陷问题', count: 1248, group: 'governance' },
    { id: 'GovernanceTask', nameCn: '治理协作任务', count: 1056, group: 'governance' },
    { id: 'Run', nameCn: '调度运行实例', count: 342, group: 'governance' },
    { id: 'Snapshot', nameCn: '物理状态快照', count: 1890, group: 'governance' }
  ];

  // Relation types for catalog
  const relationTypes = [
    { id: 'contains', count: 12356 },
    { id: 'has_assertion', count: 8542 },
    { id: 'supported_by', count: 6124 },
    { id: 'checked_by', count: 1248 },
    { id: 'maps_to', count: 2456 },
    { id: 'generated_by', count: 342 }
  ];

  // Handle preset selector at bottom-left
  const handleSelectPreset = (preset: string) => {
    if (preset === 'Field 全景视图') {
      setSelectedNodeId('Field: supplier_id');
      setRelationshipDepth(3);
    } else if (preset === '高风险断言视图') {
      setSelectedNodeId('DataIssue: 重复值问题');
      setRelationshipDepth(2);
    } else if (preset === '跨域映射视图') {
      setSelectedNodeId('DomainConcept: Supplier Identifier');
      setRelationshipDepth(2);
    }
  };

  // Find inspected entity state
  const selectedNode = useMemo(() => {
    return nodes.find(n => n.id === selectedNodeId) || nodes[2];
  }, [nodes, selectedNodeId]);

  // Compute live nodes on whiteboard based on search boxes, left catalogs, and depth filters
  const displayNodes = useMemo(() => {
    return nodes.filter(node => {
      // 1. Check main header search box
      if (searchQuery) {
        const matchesQuery = node.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             node.nameCn.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             node.label.toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchesQuery) return false;
      }

      // 2. Check left checkboxes state
      const catalogChecked = checkedCatalog[node.typeName];
      if (catalogChecked === false) return false;

      // 3. Simulated connection depth relative to currently inspected node focus
      if (selectedNodeId) {
        if (relationshipDepth === 1) {
          // Strict neighborhood
          const relatives = [selectedNodeId];
          edges.forEach(e => {
            if (e.source === selectedNodeId) relatives.push(e.target);
            if (e.target === selectedNodeId) relatives.push(e.source);
          });
          return relatives.includes(node.id);
        } else if (relationshipDepth === 2) {
          // Intermediate neighbors
          const relatives = [selectedNodeId];
          edges.forEach(e => {
            if (e.source === selectedNodeId || e.target === selectedNodeId) {
              relatives.push(e.source, e.target);
            }
          });
          // Extend by 1 step
          const extended = [...relatives];
          edges.forEach(e => {
            if (relatives.includes(e.source)) extended.push(e.target);
            if (relatives.includes(e.target)) extended.push(e.source);
          });
          return extended.includes(node.id);
        }
      }
      return true;
    });
  }, [nodes, searchQuery, checkedCatalog, selectedNodeId, relationshipDepth, edges]);



  // Compute active lines on whiteboard
  const displayEdges = useMemo(() => {
    return edges.filter(edge => {
      const hasSource = displayNodes.some(n => n.id === edge.source);
      const hasTarget = displayNodes.some(n => n.id === edge.target);
      if (!hasSource || !hasTarget) return false;

      // Filter via edge taxonomy toggles
      const catalogChecked = checkedCatalog[edge.type];
      if (catalogChecked === false) return false;

      return true;
    });
  }, [edges, displayNodes, checkedCatalog]);

  // Synchronous layout generator for static layouts (Columns or Rings)
  const computeStaticLayout = useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    if (displayNodes.length === 0) return positions;

    if (layoutType === '树状图分布') {
      const getRank = (typeName: string) => {
        switch (typeName) {
          case 'DataSource': return 0;
          case 'DataAsset': return 1;
          case 'Field': return 2;
          case 'SemanticAssertion':
          case 'DomainMapping':
          case 'DataQualityRule':
            return 3;
          case 'Evidence':
          case 'DomainConcept':
          case 'DataIssue':
            return 4;
          case 'GovernanceTask':
          default:
            return 5;
        }
      };

      const rankGroups: Record<number, GraphNode[]> = {};
      displayNodes.forEach(node => {
        const rank = getRank(node.typeName);
        if (!rankGroups[rank]) rankGroups[rank] = [];
        rankGroups[rank].push(node);
      });

      const xCoords = [75, 195, 315, 445, 575, 695];
      const canvasHeight = 560;

      Object.keys(rankGroups).forEach(rankKey => {
        const rank = Number(rankKey);
        const group = rankGroups[rank];
        const count = group.length;
        const x = xCoords[rank] || 380;
        
        const spacing = Math.min(100, (canvasHeight - 120) / Math.max(1, count - 1));
        const startY = 280 - ((count - 1) * spacing) / 2;
        
        group.forEach((node, index) => {
          positions[node.id] = {
            x,
            y: count === 1 ? 280 : startY + index * spacing
          };
        });
      });

    } else if (layoutType === '环网层级拓扑') {
      const centerNodeId = selectedNodeId && displayNodes.some(n => n.id === selectedNodeId) 
        ? selectedNodeId 
        : (displayNodes[0]?.id || '');
      
      const distances: Record<string, number> = {};
      if (centerNodeId) {
        distances[centerNodeId] = 0;
        const queue = [centerNodeId];
        while (queue.length > 0) {
          const current = queue.shift()!;
          const currentDist = distances[current];
          
          displayEdges.forEach(edge => {
            let neighbor: string | null = null;
            if (edge.source === current) neighbor = edge.target;
            if (edge.target === current) neighbor = edge.source;
            
            if (neighbor && distances[neighbor] === undefined && displayNodes.some(n => n.id === neighbor)) {
              distances[neighbor] = currentDist + 1;
              queue.push(neighbor);
            }
          });
        }
      }

      const distanceGroups: Record<number, string[]> = {};
      displayNodes.forEach(node => {
        const dist = distances[node.id] !== undefined ? distances[node.id] : 3;
        if (!distanceGroups[dist]) distanceGroups[dist] = [];
        distanceGroups[dist].push(node.id);
      });

      const cx = 380;
      const cy = 280;
      const radii = [0, 130, 245, 345];

      Object.keys(distanceGroups).forEach(distKey => {
        const dist = Number(distKey);
        const ids = distanceGroups[dist];
        const count = ids.length;
        const radius = radii[dist] || 345;

        if (dist === 0) {
          positions[ids[0]] = { x: cx, y: cy };
        } else {
          ids.forEach((id, index) => {
            const angle = (index / count) * 2 * Math.PI + dist * 0.4;
            positions[id] = {
              x: Math.max(40, Math.min(720, cx + radius * Math.cos(angle))),
              y: Math.max(40, Math.min(520, cy + radius * Math.sin(angle)))
            };
          });
        }
      });
    }

    displayNodes.forEach(node => {
      if (!positions[node.id]) {
        positions[node.id] = { x: node.x, y: node.y };
      }
    });

    return positions;
  }, [displayNodes, displayEdges, layoutType, selectedNodeId]);

  // Synchronize static layout nodePositions or trigger force layout initialization
  useEffect(() => {
    if (layoutType !== '力导向布局') {
      setNodePositions(computeStaticLayout);
    } else {
      setNodePositions(prev => {
        const next = { ...prev };
        let hasChanges = false;
        
        displayNodes.forEach(n => {
          if (!next[n.id]) {
            const defaultPos = computeStaticLayout[n.id] || { x: n.x || 380, y: n.y || 280 };
            next[n.id] = { ...defaultPos };
            hasChanges = true;
          }
        });
        
        Object.keys(next).forEach(id => {
          if (!displayNodes.some(n => n.id === id)) {
            delete next[id];
            hasChanges = true;
          }
        });
        
        return hasChanges ? next : prev;
      });
    }
  }, [layoutType, displayNodes, computeStaticLayout]);



  // Handle node dragging start
  const handleNodeMouseDown = (e: React.MouseEvent, node: GraphNode) => {
    e.stopPropagation();
    setSelectedNodeId(node.id);
    
    const currentPos = nodePositions[node.id] || { x: node.x, y: node.y };
    setDraggedNodeId(node.id);
    setDragStart({
      x: currentPos.x,
      y: currentPos.y,
      clientX: e.clientX,
      clientY: e.clientY
    });
  };

  // Handle canvas background panning start
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement | SVGElement;
    if (target.id === 'canvas-container' || target.id === 'grid-bg' || target.tagName === 'svg') {
      setIsPanning(true);
      setPanStart({
        x: e.clientX - panOffset.x,
        y: e.clientY - panOffset.y
      });
    }
  };

  // Process mouse movements for both dragging and panning
  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    } else if (draggedNodeId) {
      const dx = (e.clientX - dragStart.clientX) / zoomLevel;
      const dy = (e.clientY - dragStart.clientY) / zoomLevel;
      
      setNodePositions(prev => ({
        ...prev,
        [draggedNodeId]: {
          x: Math.max(30, Math.min(730, dragStart.x + dx)),
          y: Math.max(30, Math.min(530, dragStart.y + dy))
        }
      }));
    }
  };

  // End all interactions
  const handleCanvasMouseUp = () => {
    setIsPanning(false);
    setDraggedNodeId(null);
  };

  // Dynamic transition style depending on panning/dragging state
  const canvasTransition = isPanning || draggedNodeId ? 'none' : 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1)';

  // Dynamic automatic path testing sequence simulation!
  const triggerPathHighlight = () => {
    const pathKeys = [
      'Field: supplier_id',
      'SemanticAssertion: 供应商标识字段',
      'Evidence: 样本值证据',
      'GovernanceTask: 确认字段语义'
    ];
    
    setHighlightedPath(pathKeys);
    setActiveHighlightIndex(0);

    let index = 0;
    const interval = setInterval(() => {
      index++;
      if (index >= pathKeys.length) {
        clearInterval(interval);
        setTimeout(() => {
          setHighlightedPath([]);
          setActiveHighlightIndex(-1);
        }, 4000);
      } else {
        setActiveHighlightIndex(index);
        setSelectedNodeId(pathKeys[index]);
      }
    }, 1400);
  };

  return (
    <div className="min-h-full -m-6 font-sans bg-[#f6f8fb]" id="knowledge-network-explorer-page">
      <div className="mx-auto max-w-[1680px] p-4 lg:p-5 space-y-3">
        
        {/* ================= HEADER SECTION ================= */}
        <div className="px-1 py-1.5 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1.5">
              <span className="cursor-pointer hover:text-blue-600 transition-colors" onClick={() => onNavigate('knowledge_network_assets')}>知识网络</span>
              <span>/</span>
              <span className="text-slate-700 font-semibold">网络探索</span>
            </div>
            
            <div className="flex items-center gap-2">
              <h1 className="text-[22px] md:text-2xl font-bold text-slate-900 tracking-tight">知识网络探索</h1>
              <div className="w-4 h-4 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-help" title="关于知识网络探索">
                <Info className="w-3" />
              </div>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              在知识网络中探索对象、关系与证据的全局关联，支持多维筛选、路径分析与影响追溯。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => alert("当前 Field 全景视图已保存。")} className="px-3.5 py-2 border border-slate-200 text-xs text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 rounded-md transition-all font-medium inline-flex items-center gap-1.5 shadow-sm shadow-slate-200/30">
              <Bookmark className="w-3.5 h-3.5 text-slate-500" />
              <span>保存视图</span>
            </button>
            <button onClick={() => alert("已创建新的空白探索视图。")} className="px-3.5 py-2 border border-slate-200 text-xs text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 rounded-md transition-all font-medium inline-flex items-center gap-1.5 shadow-sm shadow-slate-200/30">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <span>新建视图</span>
            </button>
            <button onClick={() => alert("已复制当前探索视图分享链接。")} className="px-3.5 py-2 border border-slate-200 text-xs text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 rounded-md transition-all font-medium inline-flex items-center gap-1.5 shadow-sm shadow-slate-200/30">
              <Share2 className="w-3.5 h-3.5 text-slate-500" />
              <span>分享</span>
            </button>
            <button onClick={() => alert("正在导出当前图谱画板快照。")} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-xs text-white rounded-md transition-all font-bold shadow-md shadow-blue-500/20 inline-flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" />
              <span>导出</span>
            </button>
          </div>
        </div>

        {/* ================= FILTER PRESETS CONTROL ROW ================= */}
        <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-sm shadow-slate-200/40 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Domain tag */}
            <div className="flex items-center gap-1 bg-blue-50/90 border border-blue-200 text-xs text-blue-700 px-3 py-2 rounded-md font-semibold">
              <span className="text-blue-400">数据域</span>
              <span className="font-bold">DRKN-数据语义治理</span>
              <button className="hover:bg-blue-100/60 p-0.5 rounded-md text-blue-600 hover:text-blue-900 transition-colors">
                <span className="font-bold ml-1">×</span>
              </button>
            </div>

            {/* Scenario selector */}
            <div className="relative">
              <select className="appearance-none bg-white border border-slate-200 rounded-md pl-3 pr-8 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer">
                <option>数据语义治理</option>
                <option>供应链核心资产场景</option>
                <option>模型归拢一致性</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>

            {/* View Scope selector */}
            <div className="relative">
              <select className="appearance-none bg-white border border-slate-200 rounded-md pl-3 pr-8 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer">
                <option>全局视图</option>
                <option>血缘脉络视图</option>
                <option>质量告警剖面</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>

            {/* Integrated Text search */}
            <div className="relative w-full sm:w-[280px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索对象名称 / ID / 关键词"
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 pl-8 pr-3 py-2 rounded-md text-xs font-medium focus:outline-none transition-all text-slate-800"
              />
            </div>

            {/* Advanced filter */}
            <button className="px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-md font-medium">
              高级筛选
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0 md:justify-end">
            {/* Action group matching mockup */}
            <button 
              onClick={triggerPathHighlight}
              className="px-5 py-2 text-xs bg-blue-50 border border-blue-500 text-blue-700 hover:bg-blue-100 active:bg-blue-100 rounded-md font-bold flex items-center gap-1.5 transition-colors"
            >
              <Network className="w-3.5 h-3.5" />
              <span>路径分析</span>
            </button>

            <button 
              onClick={() => alert("正在跟踪该资产对下游BI看板及数据模型的影响系统评定高风险区...")}
              className="px-5 py-2 text-xs text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-md font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Activity className="w-3.5 h-3.5 text-slate-500" />
              <span>影响分析</span>
            </button>
          </div>
        </div>

        {/* ================= TRIPLE WORKBENCH GRID ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(560px,1fr)_350px] 2xl:grid-cols-[250px_minmax(720px,1fr)_390px] gap-3 items-stretch">
          
          {/* 1. Left taxonomy filters panel (3 cols) */}
          <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col justify-between shadow-sm shadow-slate-200/50 h-[600px] 2xl:h-[620px] overflow-hidden">
            <div className="space-y-3 flex flex-col h-full overflow-hidden">
              
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">对象类型</h3>
                <Settings className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 cursor-pointer" />
              </div>

              {/* Sub search bar */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input 
                  type="text" 
                  value={objSearchTerm}
                  onChange={(e) => setObjSearchTerm(e.target.value)}
                  placeholder="搜索对象类型..."
                  className="w-full bg-slate-50 border border-slate-200 pl-8 pr-3 py-1.5 text-[11px] rounded-md focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-slate-700"
                />
              </div>

              {/* Checklist list tree wrapper */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
                
                {/* Total objects list item */}
                <div 
                  onClick={() => handleToggleCatalog('all')}
                  className="flex items-center justify-between px-2 py-1.5 rounded-md bg-blue-50/70 hover:bg-blue-50 cursor-pointer select-none border border-blue-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {checkedCatalog.all ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300" />
                    )}
                    <span className="text-[12px] font-bold text-slate-800">全部对象</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 font-mono">
                    24,586
                  </span>
                </div>

                {/* Group 1: 核心对象 */}
                <div className="space-y-1">
                  <div className="px-1 flex items-center justify-between py-1">
                    <span className="text-[11px] font-bold text-slate-500">核心对象</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  </div>
                  
                  <div className="space-y-0.5">
                    {objectTypes
                      .filter(t => t.group === 'core' && (t.id.toLowerCase().includes(objSearchTerm.toLowerCase()) || t.nameCn.includes(objSearchTerm)))
                      .map(item => {
                        const isChecked = checkedCatalog[item.id] !== false;
                        return (
                          <div 
                            key={item.id}
                            onClick={() => handleToggleCatalog(item.id)}
                            className="flex items-center justify-between px-1.5 py-1.5 rounded-md hover:bg-slate-50 cursor-pointer select-none transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              {isChecked ? (
                                <CheckSquare className="w-3.5 h-3.5 text-blue-600 shadow-xs" />
                              ) : (
                                <Square className="w-3.5 h-3.5 text-slate-300" />
                              )}
                              <span className="text-[11.5px] font-semibold text-slate-700 font-mono">{item.id}</span>
                              <span className="text-[10.5px] text-slate-400 font-normal">{item.nameCn}</span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 font-mono bg-slate-50 px-1.5 py-0.2 rounded border border-slate-100">
                              {item.count.toLocaleString()}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Group 2: 治理对象 */}
                <div className="space-y-1">
                  <div className="px-1 flex items-center justify-between py-1">
                    <span className="text-[11px] font-bold text-slate-500">治理对象</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                  </div>
                  
                  <div className="space-y-0.5">
                    {objectTypes
                      .filter(t => t.group === 'governance' && (t.id.toLowerCase().includes(objSearchTerm.toLowerCase()) || t.nameCn.includes(objSearchTerm)))
                      .map(item => {
                        const isChecked = checkedCatalog[item.id] !== false;
                        return (
                          <div 
                            key={item.id}
                            onClick={() => handleToggleCatalog(item.id)}
                            className="flex items-center justify-between px-1.5 py-1.5 rounded-md hover:bg-slate-50 cursor-pointer select-none transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              {isChecked ? (
                                <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                              ) : (
                                <Square className="w-3.5 h-3.5 text-slate-300" />
                              )}
                              <span className="text-[11.5px] font-semibold text-slate-700 font-mono">{item.id}</span>
                              <span className="text-[10.5px] text-slate-400 font-normal">{item.nameCn}</span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 font-mono bg-slate-50 px-1.5 py-0.2 rounded border border-slate-100">
                              {item.count.toLocaleString()}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Group 3: 关系类型 */}
                <div className="space-y-1">
                  <div className="px-1 flex items-center justify-between py-1">
                    <span className="text-[11px] font-bold text-slate-500">关系类型</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  </div>

                  <div className="space-y-0.5">
                    {relationTypes.map(rel => {
                      const isChecked = checkedCatalog[rel.id] !== false;
                      return (
                        <div 
                          key={rel.id}
                          onClick={() => handleToggleCatalog(rel.id)}
                          className="flex items-center justify-between px-1.5 py-1.5 rounded-md hover:bg-slate-50 cursor-pointer select-none transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            {isChecked ? (
                              <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                            ) : (
                              <Square className="w-3.5 h-3.5 text-slate-300" />
                            )}
                            <span className="text-[11px] font-semibold text-indigo-700 font-mono">→ {rel.id}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 bg-slate-50 px-1.5 py-0.2 rounded border border-slate-100 font-mono font-bold">
                            {rel.count.toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Group 4: 视图保存 */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="px-1 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500">视图保存</span>
                    <span className="text-[9px] text-blue-600 font-bold bg-blue-50 px-1.5 rounded border border-blue-100">我的视图</span>
                  </div>

                  <div className="space-y-1 my-1">
                    {[
                      { name: 'Field 全景视图', desc: '展现商户供应商ID物理拓扑' },
                      { name: '高风险断言视图', desc: '缺陷预警与逻辑异常路径' },
                      { name: '跨域映射视图', desc: '跨财务与供应链概念映射' }
                    ].map(preset => {
                      const isSelected = (preset.name === 'Field 全景视图' && selectedNodeId === 'Field: supplier_id') || 
                                         (preset.name === '高风险断言视图' && selectedNodeId === 'DataIssue: 重复值问题') ||
                                         (preset.name === '跨域映射视图' && selectedNodeId === 'DomainConcept: Supplier Identifier');
                      return (
                        <div 
                          key={preset.name}
                          onClick={() => handleSelectPreset(preset.name)}
                          className={`px-2 py-1.5 rounded-md border cursor-pointer select-none transition-all ${
                            isSelected 
                              ? 'bg-blue-50 border-blue-200 shadow-[0_1px_4px_rgba(59,130,246,0.06)]' 
                              : 'bg-white border-slate-200/50 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="text-[11.5px] font-bold text-slate-800 flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-blue-500' : 'bg-slate-300'}`}></span>
                            <span>{preset.name}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* 2. Middle high-fidelity whiteboard representation (6 cols) */}
          <div className={`bg-slate-50 border border-slate-200 flex flex-col overflow-hidden relative shadow-sm shadow-slate-200/50 transition-all duration-300 ${
            isGraphFullscreen 
              ? 'fixed inset-0 z-50 bg-[#f8fafc] w-screen h-screen' 
              : 'rounded-lg h-[600px] 2xl:h-[620px]'
          }`}>
            
            {/* Top Interactive Whiteboard utility bar */}
            <div className="bg-white px-4 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 z-20">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-500">当前探索:</span>
                <span className="text-xs bg-white border border-slate-200 text-slate-800 px-2 py-1 rounded-md font-mono font-bold">
                  {selectedNode.typeName === 'Field' ? 'Field' : selectedNode.typeName} ({selectedNode.label})
                </span>
                
                <button 
                  onClick={() => { setSelectedNodeId('Field: supplier_id'); setZoomLevel(1); setPanOffset({ x: 0, y: 0 }); }}
                  className="text-[10.5px] text-blue-600 hover:text-blue-800 ml-1.5 font-bold flex items-center gap-0.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>清空</span>
                </button>
              </div>

              {/* Whiteboard Controls */}
              <div className="flex items-center gap-3.5">
                
                {/* Connection Depth Selector */}
                <div className="flex items-center gap-1 text-[11px]">
                  <span className="text-slate-400 font-bold mr-1">关系深度</span>
                  <div className="flex bg-white rounded-md p-0.5 border border-slate-200">
                    {[1, 2, 3, '4+'].map(depth => {
                      const isActive = (depth === 3 && relationshipDepth === 3) || 
                                       (depth === 2 && relationshipDepth === 2) || 
                                       (depth === 1 && relationshipDepth === 1) || 
                                       (depth === '4+' && relationshipDepth === 4);
                      return (
                        <button 
                          key={depth}
                          onClick={() => setRelationshipDepth(depth === '4+' ? 4 : Number(depth))}
                          className={`w-6 h-6 rounded text-[10.5px] font-bold transition-all text-center leading-none ${
                            isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          {depth}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Layout Type Selector */}
                <div className="relative text-[11px]">
                  <select 
                    value={layoutType}
                    onChange={(e) => setLayoutType(e.target.value)}
                    className="appearance-none bg-white text-slate-700 font-bold border border-slate-200 rounded-md px-2.5 py-1.5 pr-6 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option>力导向布局</option>
                    <option>环网层级拓扑</option>
                    <option>树状图分布</option>
                  </select>
                  <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
                </div>

                {/* Additional canvas helpers */}
                <div className="flex items-center gap-1">
                  <button onClick={() => setZoomLevel(prev => Math.min(prev + 0.15, 2.5))} className="text-slate-500 hover:text-slate-800 p-1.5 hover:bg-slate-100 rounded-md border border-slate-200 bg-white transition-colors" title="放大"><ZoomIn className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setZoomLevel(prev => Math.max(prev - 0.15, 0.4))} className="text-slate-500 hover:text-slate-800 p-1.5 hover:bg-slate-100 rounded-md border border-slate-200 bg-white transition-colors" title="缩小"><ZoomOut className="w-3.5 h-3.5" /></button>
                  <button onClick={() => { setZoomLevel(1); setPanOffset({ x: 0, y: 0 }); }} className="text-slate-500 hover:text-slate-800 p-1.5 hover:bg-slate-100 rounded-md border border-slate-200 bg-white transition-colors" title="重置视角"><Maximize className="w-3.5 h-3.5" /></button>
                  <button 
                    onClick={() => setIsGraphFullscreen(prev => !prev)} 
                    className={`p-1.5 hover:bg-slate-100 rounded-md border transition-colors ${
                      isGraphFullscreen ? 'bg-blue-50 border-blue-300 text-blue-600' : 'text-slate-500 border-slate-200 bg-white'
                    }`} 
                    title={isGraphFullscreen ? "退出全屏" : "全屏探索"}
                  >
                    {isGraphFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  </button>
                </div>

              </div>
            </div>

            {/* Inner Dashboard Legend bar */}
            <div className="bg-white/90 absolute right-4 top-[58px] flex items-center gap-3.5 z-25 text-[10.5px] p-1.5 px-3 rounded-md border border-slate-200 shadow-sm backdrop-blur-xs font-semibold text-slate-600">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>核心对象</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>治理对象</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>证据对象</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-slate-400 inline-block"></span>关系类型</span>
            </div>

            {/* Canvas Area with interactive nodes & lines */}
            <div 
              id="canvas-container"
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              className="flex-1 w-full bg-white relative overflow-hidden flex items-center justify-center cursor-crosshair select-none"
              style={{
                backgroundImage: 'radial-gradient(#d5dce6 1.2px, transparent 1.2px)',
                backgroundSize: '22px 22px',
                backgroundPosition: `${panOffset.x}px ${panOffset.y}px`
              }}
            >
              <style>{`
                @keyframes march {
                  to {
                    stroke-dashoffset: -20;
                  }
                }
                .animate-flow {
                  stroke-dasharray: 6, 6;
                  animation: march 1s linear infinite;
                }
              `}</style>
              
              {/* Dynamic SVG Drawing layer */}
              <svg 
                className="absolute left-1/2 top-1/2 w-[760px] h-[560px] pointer-events-none z-10"
                viewBox="0 0 760 560"
                style={{ 
                  transform: `translate(calc(-50% + ${panOffset.x}px), calc(-50% + ${panOffset.y}px)) scale(${zoomLevel})`, 
                  transformOrigin: 'center',
                  transition: canvasTransition
                }}
              >
                <defs>
                  <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M0,0 L10,5 L0,10 L3,5 Z" fill="#94a3b8" />
                  </marker>
                  <marker id="arrow-highlight" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M0,0 L10,5 L0,10 L3,5 Z" fill="#2563eb" />
                  </marker>
                </defs>

                {/* 1. Draw relations */}
                {displayEdges.map((edge) => {
                  const sourceNode = displayNodes.find(n => n.id === edge.source);
                  const targetNode = displayNodes.find(n => n.id === edge.target);
                  if (!sourceNode || !targetNode) return null;

                  const p1 = nodePositions[edge.source] || { x: sourceNode.x, y: sourceNode.y };
                  const p2 = nodePositions[edge.target] || { x: targetNode.x, y: targetNode.y };

                  // Glowing path trace state
                  const isHighOnPath = highlightedPath.includes(edge.source) && highlightedPath.includes(edge.target);
                  const strokeColor = isHighOnPath ? '#2563eb' : '#94a3b8';
                  const strokeWidth = isHighOnPath ? 2.5 : 1.5;

                  // Border-to-border calculation: radius (24px) + border (3px) + gap (1px) = 28px
                  const R = 28;
                  const dx = p2.x - p1.x;
                  const dy = p2.y - p1.y;
                  const len = Math.sqrt(dx * dx + dy * dy) || 1;

                  const x1 = p1.x + (dx / len) * R;
                  const y1 = p1.y + (dy / len) * R;
                  const x2 = p2.x - (dx / len) * R;
                  const y2 = p2.y - (dy / len) * R;

                  // Curve calculation
                  const isHierarchical = layoutType === '树状图分布';
                  let pathD = '';
                  let textX = 0;
                  let textY = 0;

                  if (isHierarchical) {
                    const segmentDx = x2 - x1;
                    const cx1 = x1 + segmentDx * 0.45;
                    const cy1 = y1;
                    const cx2 = x1 + segmentDx * 0.55;
                    const cy2 = y2;
                    pathD = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
                    
                    textX = 0.125 * x1 + 0.375 * cx1 + 0.375 * cx2 + 0.125 * x2;
                    textY = 0.125 * y1 + 0.375 * cy1 + 0.375 * cy2 + 0.125 * y2;
                  } else {
                    pathD = `M ${x1} ${y1} L ${x2} ${y2}`;
                    textX = (x1 + x2) / 2;
                    textY = (y1 + y2) / 2 - 4;
                  }

                  return (
                    <g key={edge.id}>
                      {/* Base path */}
                      <path
                        d={pathD}
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        fill="none"
                        markerEnd={isHighOnPath ? "url(#arrow-highlight)" : "url(#arrow)"}
                        className="transition-all duration-300"
                      />
                      {/* Flowing animated layer */}
                      {isHighOnPath && (
                        <path
                          d={pathD}
                          stroke="#3b82f6"
                          strokeWidth={strokeWidth * 1.5}
                          fill="none"
                          className="animate-flow opacity-80"
                        />
                      )}
                      {/* Label Text Overlays */}
                      <rect 
                        x={textX - 35} 
                        y={textY - 7} 
                        width="70" 
                        height="14" 
                        fill="#ffffff"
                        rx="3" 
                        className="opacity-90 text-center"
                      />
                      <text
                        x={textX}
                        y={textY + 3}
                        fill={isHighOnPath ? '#1e40af' : '#64748b'}
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="monospace"
                        textAnchor="middle"
                        className="select-none"
                      >
                        {edge.label}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* 2. Absolute layout interactive elements */}
              <div 
                className="absolute left-1/2 top-1/2 w-[760px] h-[560px] pointer-events-none"
                style={{ 
                  transform: `translate(calc(-50% + ${panOffset.x}px), calc(-50% + ${panOffset.y}px)) scale(${zoomLevel})`, 
                  transformOrigin: 'center',
                  transition: canvasTransition
                }}
              >
                {displayNodes.map((node) => {
                  const isSelected = node.id === selectedNodeId;
                  const isDragging = draggedNodeId === node.id;
                  
                  // Highlighted states
                  const nodePathIndex = highlightedPath.indexOf(node.id);
                  const isHighlightedNow = nodePathIndex !== -1 && nodePathIndex <= activeHighlightIndex;

                  const pos = nodePositions[node.id] || { x: node.x, y: node.y };

                  // Determine border color based on node type
                  const getBorderColorClass = (typeName: string) => {
                    switch (typeName) {
                      case 'DataSource': return 'border-emerald-500';
                      case 'DataAsset': return 'border-blue-500';
                      case 'Field': return 'border-teal-500';
                      case 'SemanticAssertion': return 'border-violet-500';
                      case 'Evidence': return 'border-cyan-500';
                      case 'DataQualityRule': return 'border-amber-500';
                      case 'DataIssue': return 'border-red-500';
                      case 'DomainMapping': return 'border-sky-500';
                      case 'DomainConcept': return 'border-emerald-600';
                      case 'GovernanceTask': return 'border-orange-500';
                      default: return 'border-slate-350';
                    }
                  };

                  const getIconColorClass = (typeName: string) => {
                    switch (typeName) {
                      case 'DataSource': return 'text-emerald-500';
                      case 'DataAsset': return 'text-blue-500';
                      case 'Field': return 'text-teal-500';
                      case 'SemanticAssertion': return 'text-violet-500';
                      case 'Evidence': return 'text-cyan-500';
                      case 'DataQualityRule': return 'text-amber-500';
                      case 'DataIssue': return 'text-red-500';
                      case 'DomainMapping': return 'text-sky-500';
                      case 'DomainConcept': return 'text-emerald-600';
                      case 'GovernanceTask': return 'text-orange-500';
                      default: return 'text-slate-500';
                    }
                  };

                  const borderClass = getBorderColorClass(node.typeName);
                  const iconColorClass = getIconColorClass(node.typeName);

                  return (
                    <div
                      key={node.id}
                      onMouseDown={(e) => handleNodeMouseDown(e, node)}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto select-none ${
                        isDragging 
                          ? 'z-50 scale-105' 
                          : 'transition-all duration-300'
                      }`}
                      style={{ left: pos.x, top: pos.y }}
                      id={`node-${node.id.replace(/:/g, '')}`}
                    >
                      {/* Circle container */}
                      <div className={`w-12 h-12 rounded-full border-[3px] bg-white flex items-center justify-center cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all ${
                        isSelected 
                          ? 'border-blue-600 ring-4 ring-blue-500/15' 
                          : isHighlightedNow
                            ? 'border-blue-500 ring-4 ring-blue-500/10'
                            : borderClass
                      }`}>
                        {React.cloneElement(node.icon as React.ReactElement<{className?: string}>, {
                          className: `w-5 h-5 ${isSelected || isHighlightedNow ? 'text-blue-600' : iconColorClass}`
                        })}
                      </div>

                      {/* Text Label Container below the circle */}
                      <div className="absolute top-[52px] w-36 text-center pointer-events-none">
                        <div className={`text-[11px] font-bold tracking-tight leading-tight ${isSelected ? 'text-blue-600' : 'text-slate-800'}`}>
                          {node.typeName}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                          {node.label}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 3. Minimap (Bottom Right Corner) */}
              <div className="absolute right-4 bottom-4 w-[170px] h-[110px] bg-white/95 border border-slate-200 p-2.5 rounded-md flex flex-col justify-between shadow-lg shadow-slate-300/30 z-25 backdrop-blur-xs">
                <div className="flex items-center justify-between text-[8.5px] font-bold text-slate-400 uppercase tracking-widest">
                  <span>视角缩略图</span>
                  <Maximize2 className="w-2.5 h-2.5 text-slate-400 hover:text-slate-700 cursor-pointer" />
                </div>
                
                <div className="flex-1 bg-slate-50 rounded border border-slate-200 m-0.5 relative overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 bg-[#e2e8f0]/40 bg-[linear-gradient(rgba(203,213,225,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(203,213,225,0.2)_1px,transparent_1px)] bg-[size:8px_8px]"></div>
                  <div className="absolute w-[75%] h-[75%] bg-blue-500/5 rounded border border-blue-500/10"></div>
                  
                  {displayNodes.map(node => {
                    const pos = nodePositions[node.id] || { x: node.x, y: node.y };
                    return (
                      <div 
                        key={`mini-${node.id}`}
                        className={`absolute w-1.5 h-1.5 rounded-full ${node.id === selectedNodeId ? 'bg-blue-600 ring-2 ring-blue-500/20' : 'bg-slate-400'}`}
                        style={{ 
                          left: `${(pos.x / 760) * 100}%`,
                          top: `${(pos.y / 560) * 100}%`
                        }}
                      />
                    );
                  })}
                </div>
                
                <div className="flex justify-between items-center text-[8px] font-mono font-bold text-slate-500">
                  <span>Scale: {(zoomLevel * 100).toFixed(0)}%</span>
                  <span>11 对象就位</span>
                </div>
              </div>

            </div>
          </div>

          {/* 3. Right Details Inspector card (3 cols) */}
          <div className="bg-white border border-slate-200 rounded-lg flex flex-col overflow-hidden shadow-sm shadow-slate-200/50 h-[600px] 2xl:h-[620px]">
            
            {/* Inspector header */}
            <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div>
                  <h3 className="text-sm font-mono font-bold text-slate-900 leading-tight">
                    {selectedNode.typeName}: {selectedNode.label}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span className="text-[10px] font-bold text-emerald-600 tracking-wider">已发布</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition-all text-xs" title="加星标">★</button>
                <button className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition-all font-mono text-xs" title="更多">•••</button>
                <button 
                  onClick={() => setSelectedNodeId('Field: supplier_id')}
                  className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition-all text-xs font-bold"
                  title="关闭"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Tabs matching mockup exactly under title */}
            <div className="border-b border-slate-200 bg-white px-2 flex items-center scrollbar-none overflow-x-auto text-[11.5px] font-bold text-slate-500 shrink-0 select-none">
              {[
                { id: 'overview', label: '概览' },
                { id: 'attrs', label: '属性' },
                { id: 'relations', label: `关系 (${selectedNode.details.stats.assertions})` },
                { id: 'evidences', label: `证据 (${selectedNode.details.stats.evidences})` },
                { id: 'assertions', label: '断言' },
                { id: 'quality', label: `质量 (${selectedNode.details.stats.rules})` },
                { id: 'tasks', label: `任务 (${selectedNode.details.stats.tasks})` }
              ].map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`whitespace-nowrap px-2.5 py-3 border-b-2 transition-all cursor-pointer ${
                      isActive 
                        ? 'border-blue-600 text-blue-700 font-bold' 
                        : 'border-transparent hover:text-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Body contents */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
              
              {activeTab === 'overview' && (
                <>
                  {/* Part 1: 基本信息 */}
                  <div className="space-y-2">
                    <h4 className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">基本信息</h4>
                    
                    <div className="space-y-1.5 border border-slate-100 rounded-md p-3 bg-white">
                      <div className="flex justify-between items-start text-[11.5px]">
                        <span className="text-slate-400 font-medium">中文名称</span>
                        <span className="text-slate-800 font-bold text-right truncate max-w-[170px]" title={selectedNode.details.nameCn}>{selectedNode.details.nameCn}</span>
                      </div>
                      <div className="flex justify-between items-start text-[11.5px] border-t border-slate-100/50 pt-1.5">
                        <span className="text-slate-400 font-medium">所属数据资产</span>
                        <span className="text-slate-700 font-mono font-bold text-right truncate max-w-[170px]">{selectedNode.details.asset}</span>
                      </div>
                      <div className="flex justify-between items-start text-[11.5px] border-t border-slate-100/50 pt-1.5">
                        <span className="text-slate-400 font-medium">所属数据源</span>
                        <span className="text-slate-700 font-mono font-semibold text-right truncate max-w-[170px]">{selectedNode.details.source}</span>
                      </div>
                      <div className="flex justify-between items-start text-[11.5px] border-t border-slate-100/50 pt-1.5">
                        <span className="text-slate-400 font-medium">数据类型</span>
                        <span className="text-slate-800 font-mono font-bold text-right">{selectedNode.details.dataType}</span>
                      </div>
                      <div className="flex flex-col gap-0.5 border-t border-slate-100/50 pt-1.5 text-[11px]">
                        <span className="text-slate-400 font-medium">业务描述</span>
                        <span className="text-slate-600 leading-relaxed font-normal mt-0.5">{selectedNode.details.desc}</span>
                      </div>
                      <div className="flex justify-between items-start text-[11px] border-t border-slate-100/50 pt-1.5">
                        <span className="text-slate-400 font-medium">创建时间</span>
                        <span className="text-slate-500 font-medium font-mono">{selectedNode.details.createdAt}</span>
                      </div>
                      <div className="flex justify-between items-start text-[11px] border-t border-slate-100/50 pt-1.5">
                        <span className="text-slate-400 font-medium">更新时间</span>
                        <span className="text-slate-500 font-medium font-mono">{selectedNode.details.updatedAt}</span>
                      </div>
                      <div className="flex justify-between items-start text-[11.5px] border-t border-slate-100/50 pt-1.5">
                        <span className="text-slate-400 font-medium">负责人</span>
                        <span className="text-slate-800 font-bold text-right">{selectedNode.details.owner}</span>
                      </div>
                    </div>
                  </div>

                  {/* Part 2: 统计信息 Grid matching mockup exactly */}
                  <div className="space-y-2">
                    <h4 className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">统计信息</h4>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-slate-50 border border-slate-100 p-2 rounded-md text-center">
                        <div className="text-[9.5px] font-medium text-slate-500 truncate">语义断言</div>
                        <div className="text-base font-bold text-slate-800 font-mono mt-0.5">{selectedNode.details.stats.assertions}</div>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 p-2 rounded-md text-center">
                        <div className="text-[9.5px] font-medium text-slate-500 truncate">证据数量</div>
                        <div className="text-base font-bold text-slate-800 font-mono mt-0.5">{selectedNode.details.stats.evidences}</div>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 p-2 rounded-md text-center">
                        <div className="text-[9.5px] font-medium text-slate-500 truncate">质量规则</div>
                        <div className="text-base font-bold text-slate-800 font-mono mt-0.5">{selectedNode.details.stats.rules}</div>
                      </div>
                      <div className="bg-orange-50/50 border border-orange-100 p-2 rounded-md text-center">
                        <div className="text-[9.5px] font-medium text-slate-500 truncate">数据问题</div>
                        <div className="text-base font-bold text-orange-600 font-mono mt-0.5">{selectedNode.details.stats.issues}</div>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 p-2 rounded-md text-center">
                        <div className="text-[9.5px] font-medium text-slate-500 truncate">治理任务</div>
                        <div className="text-base font-bold text-slate-800 font-mono mt-0.5">{selectedNode.details.stats.tasks}</div>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 p-2 rounded-md text-center">
                        <div className="text-[9.5px] font-medium text-slate-500 truncate">被引用次数</div>
                        <div className="text-base font-bold text-slate-800 font-mono mt-0.5">{selectedNode.details.stats.refs}</div>
                      </div>
                    </div>
                  </div>

                  {/* Part 3: 快速操作 */}
                  <div className="space-y-2">
                    <h4 className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">快速操作</h4>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => alert(`已图面居中聚焦: ${selectedNode.details.nameCn}`)} className="p-2 border border-slate-200 hover:border-blue-200 hover:bg-blue-50/40 text-[11px] font-bold text-slate-700 flex items-center justify-center gap-1.5 rounded-md transition-colors cursor-pointer">
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>查看在图中</span>
                      </button>
                      <button onClick={() => alert("正在载入全血缘路径计算仪表盘...")} className="p-2 border border-slate-200 hover:border-blue-200 hover:bg-blue-50/40 text-[11px] font-bold text-slate-700 flex items-center justify-center gap-1.5 rounded-md transition-colors cursor-pointer">
                        <Network className="w-3.5 h-3.5 text-blue-500" />
                        <span>查看血缘</span>
                      </button>
                      <button onClick={() => alert("初始化新置信断言对话包数据中...")} className="p-2 border border-slate-200 hover:border-blue-200 hover:bg-blue-50/40 text-[11px] font-bold text-slate-700 flex items-center justify-center gap-1.5 rounded-md transition-colors cursor-pointer">
                        <FilePlus className="w-3.5 h-3.5 text-purple-500" />
                        <span>创建断言</span>
                      </button>
                      <button onClick={() => alert("创建新协作督导治理工单...")} className="p-2 border border-slate-200 hover:border-blue-200 hover:bg-blue-50/40 text-[11px] font-bold text-slate-700 flex items-center justify-center gap-1.5 rounded-md transition-colors cursor-pointer">
                        <PlusCircle className="w-3.5 h-3.5 text-amber-500" />
                        <span>创建任务</span>
                      </button>
                      <button onClick={() => alert("载入数据质量详细剖析面板中...")} className="p-2 border border-slate-200 hover:border-blue-200 hover:bg-blue-50/40 text-[11px] font-bold text-slate-700 flex items-center justify-center gap-1.5 rounded-md transition-colors col-span-2 cursor-pointer">
                        <BarChart3 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>数据质量分析</span>
                      </button>
                    </div>
                  </div>

                  {/* Part 4: 智能洞察 */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">智能洞察</h4>
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    </div>

                    <div className="space-y-1.5 border border-emerald-100 rounded-md p-3 bg-emerald-50/30">
                      {selectedNode.details.insights.map((insight, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-700 leading-relaxed font-medium">
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{insight}</span>
                        </div>
                      ))}
                      
                      <button className="text-[10.5px] font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-0.5 pt-1 cursor-pointer">
                        <span>查看全部洞察</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </>
              )}

              {activeTab !== 'overview' && (
                <div className="py-12 text-center text-xs text-slate-400 font-medium">
                  <Activity className="w-8 h-8 text-slate-300 mx-auto mb-2 animate-pulse" />
                  <span>「{selectedNode.details.nameCn}」的 {activeTab} 深度属性表已对齐</span>
                  <p className="text-[10px] text-slate-400 mt-1">已成功解析 3 项核心属性，并与 AI 沙箱保持实时校验。</p>
                </div>
              )}

            </div>
          </div>

        </div>

        {/* ================= BOTTOM BENTO SUMMARY INFO FOOTER ================= */}
        <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-sm shadow-slate-200/40 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
          
          {/* Box 1: 当前视图基础属性 */}
          <div className="md:col-span-3 space-y-1.5 md:border-r border-slate-100 pr-4">
            <span className="text-xs font-bold text-slate-700">当前视图信息</span>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-1">
              <div>
                <p className="text-[10px] text-slate-400 leading-none font-medium">视图名称</p>
                <p className="text-[12.5px] font-bold text-slate-800 mt-1">Field 全景视图</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 leading-none font-medium">创建人</p>
                <div className="flex items-center gap-1 mt-1">
                  <div className="w-3.5 h-3.5 rounded-full bg-blue-50 text-[9px] text-blue-700 flex items-center justify-center font-bold">张</div>
                  <span className="text-xs font-bold text-slate-700">张三</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 leading-none font-medium">对象数</p>
                <p className="text-[12.5px] font-bold text-slate-800 font-mono mt-1">12</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 leading-none font-medium">关系数</p>
                <p className="text-[12.5px] font-bold text-slate-800 font-mono mt-1">18</p>
              </div>
            </div>
            <p className="text-[10.5px] text-slate-400 font-medium">创建时间: 2025-06-14 10:20</p>
          </div>

          {/* Box 2: 视图洞察 breakdown grid */}
          <div className="md:col-span-5 space-y-1.5 md:border-r border-slate-100 pr-4">
            <span className="text-xs font-bold text-slate-700">视图洞察</span>
            <div className="grid grid-cols-5 gap-1.5 pt-1 text-center font-mono">
              <div className="bg-blue-50/70 p-1.5 rounded-md border border-blue-100/70">
                <span className="block text-[9px] text-slate-400 font-sans font-medium">核心对象</span>
                <span className="text-xs font-bold text-blue-600">5</span>
              </div>
              <div className="bg-teal-50/70 p-1.5 rounded-md border border-teal-100/70">
                <span className="block text-[9px] text-slate-400 font-sans font-medium">治理对象</span>
                <span className="text-xs font-bold text-teal-600">3</span>
              </div>
              <div className="bg-purple-50/70 p-1.5 rounded-md border border-purple-100/70">
                <span className="block text-[9px] text-slate-400 font-sans font-medium">证据对象</span>
                <span className="text-xs font-bold text-purple-600">2</span>
              </div>
              <div className="bg-indigo-50/70 p-1.5 rounded-md border border-indigo-100/70">
                <span className="block text-[9px] text-slate-400 font-sans font-medium">关系类型</span>
                <span className="text-xs font-bold text-indigo-600 font-mono">6</span>
              </div>
              <div className="bg-orange-50 p-1.5 rounded-md border border-orange-100 flex flex-col justify-center items-center">
                <span className="block text-[9.5px] text-orange-600 font-sans font-bold uppercase">高风险</span>
                <AlertTriangle className="w-3 h-3 text-orange-600 mt-0.5 animate-pulse" />
              </div>
            </div>
            <p className="text-[10.5px] text-slate-500 leading-relaxed font-medium">
              当前画板涵盖 2 个数据源和 1 个标准本体概念，暂有 <b>1 项重合主键异常</b> 关联。
            </p>
          </div>

          {/* Box 3: AI Path Exploration sequences */}
          <div className="md:col-span-4 space-y-1.5">
            <span className="text-xs font-bold text-slate-700">推荐探索路径</span>
            
            <div className="flex items-center justify-between gap-2.5 bg-slate-50 p-2 rounded-md border border-slate-200 mt-1">
              <div className="space-y-1 overflow-hidden min-w-0">
                <div className="text-xs font-bold text-slate-800 truncate">SupplierID 全链路</div>
                
                <div className="flex items-center gap-1 text-[9px] text-slate-400 font-mono flex-nowrap overflow-hidden">
                  <span className="bg-white border border-slate-200/80 px-1 py-0.2 rounded text-blue-600 font-bold">Field</span>
                  <span className="text-slate-300">→</span>
                  <span className="bg-white border border-slate-200/80 px-1 py-0.2 rounded text-blue-600 font-bold">SemanticAssertion</span>
                  <span className="text-slate-300">→</span>
                  <span className="bg-white border border-slate-200/80 px-1 py-0.2 rounded text-purple-600 font-bold">Evidence</span>
                  <span className="text-slate-300">→</span>
                  <span className="bg-white border border-slate-200/80 px-1 py-0.2 rounded text-teal-600 font-bold">GovernanceTask</span>
                  <span className="text-slate-300">→</span>
                  <span className="bg-white border border-slate-200/80 px-1 py-0.2 rounded text-slate-600 font-bold">Snapshot</span>
                </div>
              </div>

              <button 
                onClick={triggerPathHighlight}
                className="shrink-0 font-bold text-xs text-white bg-[#2563eb] hover:bg-blue-700 active:bg-blue-800 px-4 py-2 rounded-md transition-all flex items-center gap-1 group cursor-pointer shadow-sm shadow-blue-500/20"
              >
                <span>探索</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
            
            {highlightedPath.length > 0 && (
              <div className="text-[10px] text-blue-600 font-bold animate-pulse text-right">
                正在执行第 {activeHighlightIndex + 1}/{highlightedPath.length} 步血缘推理闪烁追溯中...
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
