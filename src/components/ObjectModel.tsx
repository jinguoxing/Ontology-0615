import React, { useState } from 'react';
import { ObjectType, Property, ObjectGroup } from '../types';
import { 
  Database, Box, FileText, Shield, ClipboardCopy, 
  Layers, AlertTriangle, Target, Play, FileCode, CheckCircle2,
  ChevronRight, Search, Settings, Star, GitMerge, Link as LinkIcon, 
  FunctionSquare, Plus, Edit, Download, Check, Sparkles, X, Info, AlertCircle, Trash2, ChevronDown, RefreshCw
} from 'lucide-react';

interface ObjectModelProps {
  objectTypes: ObjectType[];
  selectedObjectId: string;
  onSelectObject: (id: string) => void;
  onNavigate: (view: string, targetId?: string) => void;
  isEditingActive: boolean;
  onUpdateObjectType: (updated: ObjectType) => void;
  onAddObjectType: (newObj: ObjectType) => void;
}

// -------------------------------------------------------------
// 六大标准治理实体模版数据
// -------------------------------------------------------------
const STANDARD_TEMPLATES = [
  {
    id: 'DataQualityRule',
    nameCn: '数据质量规则',
    description: '用于定义字段或数据资产的质量检查规则。支持探查非空、格式、范畴及合理性等多重物理与语义校验点。',
    dependencies: ['Field', 'DataAsset'],
    recommendedBadge: '标准治理模型推荐',
    isRecommended: true,
    group: '质量治理对象' as ObjectGroup,
    properties: [
      { name: 'rule_name', dataType: 'string', semanticType: 'RuleConfigName', confidence: 1.0, owner: '数据治理团队', status: 'Draft' as const, description: '规则可读名称' },
      { name: 'rule_type', dataType: 'string', semanticType: 'ClassificationCode', confidence: 1.0, owner: '数据治理团队', status: 'Draft' as const, description: '质检校验类型，如 NullCheck, BoundsCheck' },
      { name: 'target_object', dataType: 'string', semanticType: 'FieldName', confidence: 1.0, owner: '数据治理团队', status: 'Draft' as const, description: '检查靶标字段或资产名称' },
      { name: 'threshold', dataType: 'float', semanticType: 'ScaleMetrics', confidence: 1.0, owner: '数据治理团队', status: 'Draft' as const, description: '数值区间约束或通过率阈值(如0.98)' },
      { name: 'severity', dataType: 'string', semanticType: 'LevelCode', confidence: 1.0, owner: '数据治理团队', status: 'Draft' as const, description: '触发熔断报警或阻断的错误级别' },
      { name: 'status', dataType: 'string', semanticType: 'CategoryCode', confidence: 1.0, owner: '数据治理团队', status: 'Draft' as const, description: '当前规则发布及运行生效状态' },
    ],
    lifecycle: ['Created', 'Tested', 'Enabled', 'Disabled']
  },
  {
    id: 'DataIssue',
    nameCn: '数据质量问题',
    description: '执行校验失败或发现冲突时产生的异常实例，是发起主动修复和闭环流程的源点。',
    dependencies: ['DataQualityRule', 'Field'],
    recommendedBadge: '标准治理模型推荐',
    isRecommended: true,
    group: '质量治理对象' as ObjectGroup,
    properties: [
      { name: 'issue_title', dataType: 'string', semanticType: 'TextSummary', confidence: 1.0, owner: '数据治理团队', status: 'Draft' as const, description: '异常故障概要描述' },
      { name: 'severity_level', dataType: 'string', semanticType: 'LevelCode', confidence: 1.0, owner: '数据治理团队', status: 'Draft' as const, description: '阻断、严重或次要预警异常评级' },
      { name: 'created_at', dataType: 'timestamp', semanticType: 'TimestampInstant', confidence: 1.0, owner: '数据治理团队', status: 'Draft' as const, description: '问题自动探针生成瞬间时间戳' },
      { name: 'status', dataType: 'string', semanticType: 'CategoryCode', confidence: 1.0, owner: '数据治理团队', status: 'Draft' as const, description: '处理中 / 已阻断 / 已修复生命周期状态' },
      { name: 'assigned_to', dataType: 'string', semanticType: 'UserAccount', confidence: 1.0, owner: '数据治理团队', status: 'Draft' as const, description: '分流承办的接口责任人' },
    ],
    lifecycle: ['Identified', 'Assigned', 'Resolved', 'Closed']
  },
  {
    id: 'GovernanceTask',
    nameCn: '治理任务',
    description: '因数据缺陷、未决冲突或模型重构而分派至团队或个人的手工和AI协作治理工单流程。',
    dependencies: ['DataIssue', 'Evidence'],
    recommendedBadge: '标准治理模型推荐',
    isRecommended: true,
    group: '运行治理对象' as ObjectGroup,
    properties: [
      { name: 'task_title', dataType: 'string', semanticType: 'TextSummary', confidence: 1.0, owner: '数据治理团队', status: 'Draft' as const, description: '工单治理事宜简述' },
      { name: 'assignee', dataType: 'string', semanticType: 'UserAccount', confidence: 1.0, owner: '数据治理团队', status: 'Draft' as const, description: '具体承办承接账号' },
      { name: 'due_date', dataType: 'date', semanticType: 'DateCalendar', confidence: 1.0, owner: '数据治理团队', status: 'Draft' as const, description: '计划期望最晚结办归档限期' },
      { name: 'status', dataType: 'string', semanticType: 'CategoryCode', confidence: 1.0, owner: '数据治理团队', status: 'Draft' as const, description: '工单进展状态: 挂起/处理/核验中' },
      { name: 'priority', dataType: 'string', semanticType: 'LevelCode', confidence: 1.0, owner: '数据治理团队', status: 'Draft' as const, description: '优先级评级，对应紧急加急程度' },
    ],
    lifecycle: ['Created', 'InProgress', 'Completed']
  },
  {
    id: 'CandidateSignal',
    nameCn: '候选实体信号',
    description: '语义解构引擎离线判定出的高置信潜在字段特征、物理映射或模型拓展多维候选结果。',
    dependencies: ['Field', 'SemanticAssertion'],
    recommendedBadge: '高级探索推荐',
    isRecommended: false,
    group: '语义治理对象' as ObjectGroup,
    properties: [
      { name: 'signal_id', dataType: 'string', semanticType: 'SystemUuid', confidence: 1.0, owner: 'AI工程部', status: 'Draft' as const, description: 'AI判定唯一提取散列UUID' },
      { name: 'signal_type', dataType: 'string', semanticType: 'GovernanceCategory', confidence: 1.0, owner: 'AI工程部', status: 'Draft' as const, description: '语义归类及属性映射探测信号模式' },
      { name: 'confidence_level', dataType: 'float', semanticType: 'ProbabilityScore', confidence: 1.0, owner: 'AI工程部', status: 'Draft' as const, description: '推荐置信打分依据(0-1)' },
      { name: 'detected_pattern', dataType: 'string', semanticType: 'NotesParagraph', confidence: 1.0, owner: '算法工程师', status: 'Draft' as const, description: '命中的物理分布图谱或正则表达式特征' },
    ],
    lifecycle: ['Detected', 'Evaluating', 'Approved', 'Rejected']
  },
  {
    id: 'PromotionRecord',
    nameCn: '发布推广记录',
    description: '记录与归档语义模型在大版本成熟时在各个集成、准生产与生产部署生效的推广传输链路印记。',
    dependencies: ['Snapshot', 'Run'],
    recommendedBadge: '跨域集成推荐',
    isRecommended: false,
    group: '运行治理对象' as ObjectGroup,
    properties: [
      { name: 'record_id', dataType: 'string', semanticType: 'SystemUuid', confidence: 1.0, owner: '配置治理组', status: 'Draft' as const, description: '推送活动签名Hash' },
      { name: 'source_env', dataType: 'string', semanticType: 'SystemName', confidence: 1.0, owner: '配置治理组', status: 'Draft' as const, description: '源头开发沙箱环境标识' },
      { name: 'target_env', dataType: 'string', semanticType: 'SystemName', confidence: 1.0, owner: '配置治理组', status: 'Draft' as const, description: '目的端物理生效宿环境' },
      { name: 'promoted_by', dataType: 'string', semanticType: 'UserAccount', confidence: 1.0, owner: '配置治理组', status: 'Draft' as const, description: '执行人运维主管账号' },
      { name: 'promotion_time', dataType: 'timestamp', semanticType: 'TimestampInstant', confidence: 1.0, owner: '配置治理组', status: 'Draft' as const, description: '记录归口生效物理瞬间' },
    ],
    lifecycle: ['Requested', 'Staged', 'Promoted', 'Verified']
  },
  {
    id: 'AIFeedback',
    nameCn: 'AI 治理反馈',
    description: '收集用户或领域专家复盘AI语义打标时的修正数据、驳回细节及正负反馈凭证。',
    dependencies: ['SemanticAssertion', 'Field'],
    recommendedBadge: '自主治理扩展推荐',
    isRecommended: false,
    group: '语义治理对象' as ObjectGroup,
    properties: [
      { name: 'feedback_id', dataType: 'string', semanticType: 'SystemUuid', confidence: 1.0, owner: '安全审计部', status: 'Draft' as const, description: '纠偏反馈记录UUID' },
      { name: 'feedback_data', dataType: 'string', semanticType: 'NotesParagraph', confidence: 1.0, owner: '数据合规组', status: 'Draft' as const, description: '专家复核驳回或修改的具体理由' },
      { name: 'user_rating', dataType: 'int', semanticType: 'ScaleMetrics', confidence: 1.0, owner: '数据合规组', status: 'Draft' as const, description: '反馈可用度打分，对应 1-5 颗星' },
      { name: 'expert_review_status', dataType: 'string', semanticType: 'CategoryCode', confidence: 1.0, owner: '流程审核室', status: 'Draft' as const, description: '后台专家归档复审状态' },
    ],
    lifecycle: ['Submitted', 'Aggregated', 'Reinforced']
  }
];

// -------------------------------------------------------------
// 模版预览映射字典 (校验属性、推荐关系、推荐能力)
// -------------------------------------------------------------
const PREVIEW_RESOURCES: Record<string, {
  properties: { name: string; type: string; desc: string }[];
  relations: { source: string; link: string; target: string }[];
  capabilities: { type: 'Function' | 'Action' | 'Workflow'; name: string; desc: string }[];
  validation: { type: 'success' | 'warning' | 'info'; text: string }[];
}> = {
  DataQualityRule: {
    properties: [
      { name: 'rule_name', type: 'string', desc: '规则可读名称' },
      { name: 'rule_type', type: 'string', desc: '质检校验类型，如 NullCheck' },
      { name: 'target_object', type: 'string', desc: '检查靶标字段' },
      { name: 'threshold', type: 'float', desc: '通过率或区间阈值限制' },
      { name: 'severity', type: 'string', desc: '预警报错级别' },
      { name: 'status', type: 'string', desc: '启用及运行状态' },
    ],
    relations: [
      { source: 'Field', link: 'checked_by', target: 'DataQualityRule' },
      { source: 'DataQualityRule', link: 'produces', target: 'DataIssue' }
    ],
    capabilities: [
      { type: 'Function', name: 'computeDQScore()', desc: '计算当前数据资产和字段的质量得分指数' },
      { type: 'Action', name: 'createDataQualityRule', desc: '呼起向导动态派生并生效配置规则' },
      { type: 'Workflow', name: 'DQAssessmentWorkflow', desc: '调度校验批跑并汇总质量缺陷工单' }
    ],
    validation: [
      { type: 'success', text: '当前模型中 Field (核心字段对象) 依赖已存在' },
      { type: 'info', text: '当前模型中 DataIssue 未启用，建议一并启用以连通异常闭环' },
      { type: 'warning', text: '启用后将关联影响 DQAssessmentWorkflow 工作流参数' }
    ]
  },
  DataIssue: {
    properties: [
      { name: 'issue_title', type: 'string', desc: '异常故障概要描述' },
      { name: 'severity_level', type: 'string', desc: '阻断、严重或预警异常评级' },
      { name: 'created_at', type: 'timestamp', desc: '故障生成系统时钟时间' },
      { name: 'status', type: 'string', desc: '处理中 / 已修复生命状态' },
      { name: 'assigned_to', type: 'string', desc: '领单承办的开发人员账户' },
    ],
    relations: [
      { source: 'DataQualityRule', link: 'produces', target: 'DataIssue' },
      { source: 'DataIssue', link: 'assigned_to', target: 'GovernanceTask' }
    ],
    capabilities: [
      { type: 'Function', name: 'aggregateDQIssues()', desc: '合并同源资产产生的重复与高频异常' },
      { type: 'Action', name: 'escalateDataIssue', desc: '异常故障提级审批传递决策' },
      { type: 'Workflow', name: 'DQAssessmentWorkflow', desc: '异常扫描判定并初始化分配任务工作流' }
    ],
    validation: [
      { type: 'success', text: '依赖的 DataQualityRule 规则实体准备就绪' },
      { type: 'info', text: '建议同工单 GovernanceTask 协同启用以形成完整的质检销号环' },
      { type: 'warning', text: '启用后质检跑批会自动生成异常底账实例，影响线上报盘' }
    ]
  },
  GovernanceTask: {
    properties: [
      { name: 'task_title', type: 'string', desc: '协作事宜简述' },
      { name: 'assignee', type: 'string', desc: '任务责任人或承办人' },
      { name: 'due_date', type: 'date', desc: '期望最晚办结限期' },
      { name: 'status', type: 'string', desc: '工单挂起/处理/核验状态' },
      { name: 'priority', type: 'string', desc: '业务加急程度因子' },
    ],
    relations: [
      { source: 'DataIssue', link: 'assigned_to', target: 'GovernanceTask' },
      { source: 'GovernanceTask', link: 'updates', target: 'Snapshot' }
    ],
    capabilities: [
      { type: 'Function', name: 'calculateSLADuration()', desc: '统计与记录超期或超时停留时长' },
      { type: 'Action', name: 'assignTask', desc: '手工重新分派或划转主办责任组' },
      { type: 'Workflow', name: 'GovernanceResolutionWorkflow', desc: '驱动治理事件全周期手工整改流' }
    ],
    validation: [
      { type: 'success', text: '依赖的 Evidence (治理物证) 模型组件正常搭载' },
      { type: 'info', text: '当前 DataIssue 未完全启用，建议关联使用以激活一键提单' },
      { type: 'warning', text: '启用后治理任务将触发 GovernanceResolutionWorkflow 用户指派' }
    ]
  },
  CandidateSignal: {
    properties: [
      { name: 'signal_id', type: 'string', desc: 'AI判定唯一散列UUID' },
      { name: 'signal_type', type: 'string', desc: '属性衍生信号探测归类' },
      { name: 'confidence_level', type: 'float', desc: '置信打分依据(0-1)' },
      { name: 'detected_pattern', type: 'string', desc: '正则表达式或采样范本' }
    ],
    relations: [
      { source: 'Field', link: 'triggers', target: 'CandidateSignal' },
      { source: 'CandidateSignal', link: 'refines', target: 'SemanticAssertion' }
    ],
    capabilities: [
      { type: 'Function', name: 'evaluateConfidenceScore()', desc: '相似分布及特征相关性权重汇总评析' },
      { type: 'Action', name: 'approveCandidateSignal', desc: '专家手工一键采纳信号为正式模型定义' },
      { type: 'Workflow', name: 'AISemanticDiscoveryWorkflow', desc: '大型AI大语言模型扫表产生新语义流器' }
    ],
    validation: [
      { type: 'success', text: '本体架构中 Field 与 SemanticAssertion 均已启动并就绪' },
      { type: 'info', text: '当前未绑定自动化扫描触发点，建议前往流程中心绑定跑批钩子' },
      { type: 'warning', text: '接入该对象会增加模型在测试及预生产环境评估时的扫描通量与后台计算成本' }
    ]
  },
  PromotionRecord: {
    properties: [
      { name: 'record_id', type: 'string', desc: '推送签名UUID' },
      { name: 'source_env', type: 'string', desc: '开发/沙箱环境标识' },
      { name: 'target_env', type: 'string', desc: '发布目的端环境' },
      { name: 'promoted_by', type: 'string', desc: '部署执行超级账号' },
      { name: 'promotion_time', type: 'timestamp', desc: '推送成功成功时间戳' },
    ],
    relations: [
      { source: 'Snapshot', link: 'records', target: 'PromotionRecord' },
      { source: 'Run', link: 'triggers', target: 'PromotionRecord' }
    ],
    capabilities: [
      { type: 'Function', name: 'validateEnvCompatibility()', desc: '校验目标环境当前对模型结构的承载兼容度' },
      { type: 'Action', name: 'triggerEnvironmentDeploy', desc: '推送编译好的模型发布包到正式端' },
      { type: 'Workflow', name: 'ModelDeploymentWorkflow', desc: '进行自动冒烟、权限卡点后合并到高环境' }
    ],
    validation: [
      { type: 'success', text: '依赖的 Snapshot (模型快照) 与 Run (运行示例) 在模型层活跃' },
      { type: 'info', text: '建议同大版本归档控制项一并配置生效' },
      { type: 'warning', text: '开启记录后任何版本发布的推广变更将具有不可逆物理不可修改的审计性质' }
    ]
  },
  AIFeedback: {
    properties: [
      { name: 'feedback_id', type: 'string', desc: '正负纠偏反馈UUID' },
      { name: 'feedback_data', type: 'string', desc: '驳回或修正的文字理由' },
      { name: 'user_rating', type: 'int', desc: '一键好差评有用度，量阶1-5' },
      { name: 'expert_review_status', type: 'string', desc: '合规安全专家终审校验归口' },
    ],
    relations: [
      { source: 'SemanticAssertion', link: 'collects', target: 'AIFeedback' },
      { source: 'Field', link: 'references', target: 'AIFeedback' }
    ],
    capabilities: [
      { type: 'Function', name: 'aggregateExpertRating()', desc: '收集多源标定反馈计算综合模型精确度权重' },
      { type: 'Action', name: 'submitAIFeedback', desc: '回传专家的修正标贴到AI推理参数层' },
      { type: 'Workflow', name: 'SelfCorrectionReinforcementWorkflow', desc: '模型纠偏自主再强化训练反馈回流线' }
    ],
    validation: [
      { type: 'success', text: '依赖的依赖对象 Field 及其关联 SemanticAssertion 断言均正常存在' },
      { type: 'info', text: '建立后，前端页面将解锁“AI打标纠偏反馈”微件' },
      { type: 'warning', text: '加入变更集后将对现有的 SelfCorrectionReinforcementWorkflow 执行网关有重组影响' }
    ]
  }
};

export default function ObjectModel({
  objectTypes,
  selectedObjectId,
  onSelectObject,
  onNavigate,
  isEditingActive,
  onUpdateObjectType,
  onAddObjectType
}: ObjectModelProps) {

  // Find currently selected object structure, fallback to Field.
  // May be undefined while the objectTypes query is still loading (React Query).
  const activeObj = objectTypes.find(o => o.id === selectedObjectId) || objectTypes.find(o => o.id === 'Field') || objectTypes[0];

  // Data not loaded yet — render a lightweight placeholder instead of crashing
  // when downstream code dereferences activeObj.properties.
  if (!activeObj) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        正在加载本体模型…
      </div>
    );
  }

  // State elements
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Drawer-specific state
  const [selectionMode, setSelectionMode] = useState<'standard' | 'extended'>('standard');
  const [selectedAddTargetId, setSelectedAddTargetId] = useState<string>('DataQualityRule');

  // New Add Property Drawer state
  const [isAddPropertyDrawerOpen, setIsAddPropertyDrawerOpen] = useState(false);
  const [propName, setPropName] = useState('semantic_source');
  const [propCnName, setPropCnName] = useState('语义来源');
  const [propDataType, setPropDataType] = useState('Enum');
  const [propIsRequired, setPropIsRequired] = useState(false);
  const [propDefaultVal, setPropDefaultVal] = useState('System Inferred');
  const [propDescription, setPropDescription] = useState('记录字段语义来源，例如系统识别、人工确认、AI 反馈。');
  const [enumItems, setEnumItems] = useState(['System Inferred', 'Human Confirmed', 'AI Feedback', 'External Glossary']);
  const [newEnumVal, setNewEnumVal] = useState('');

  // Usage scope states
  const [scopeKnowledgeNetwork, setScopeKnowledgeNetwork] = useState(true);
  const [scopeAiWorkbench, setScopeAiWorkbench] = useState(true);
  const [scopeFunctionInput, setScopeFunctionInput] = useState(true);
  const [scopeWorkflowCondition, setScopeWorkflowCondition] = useState(true);
  const [scopeReleaseCheck, setScopeReleaseCheck] = useState(true);

  // Custom Extension Object Form state
  const [customId, setCustomId] = useState('');
  const [customNameCn, setCustomNameCn] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [customOwner, setCustomOwner] = useState('数据治理团队');
  const [customGroup, setCustomGroup] = useState<ObjectGroup>('语义治理对象');
  const [customDependencies, setCustomDependencies] = useState<string[]>(['Field']);
  const [customAttributes, setCustomAttributes] = useState<Array<{ name: string; dataType: string; isRequired: boolean; description: string }>>([
    { name: 'record_id', dataType: 'string', isRequired: true, description: '唯一序列记录ID' },
    { name: 'severity_code', dataType: 'string', isRequired: false, description: '严重评级代号' }
  ]);

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

  const currentStats = getMockStats(activeObj.id);

  // Trigger brief alert-styled toast message
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Add standard attributes table dynamic actions
  const handleAddAttributeRow = () => {
    setCustomAttributes([
      ...customAttributes,
      { name: '', dataType: 'string', isRequired: false, description: '' }
    ]);
  };

  const handleUpdateAttributeRow = (idx: number, key: string, val: any) => {
    const updated = [...customAttributes];
    updated[idx] = { ...updated[idx], [key]: val };
    setCustomAttributes(updated);
  };

  const handleRemoveAttributeRow = (idx: number) => {
    if (customAttributes.length <= 1) return;
    setCustomAttributes(customAttributes.filter((_, i) => i !== idx));
  };

  // Handle saving new property to changeset
  const handleSavePropertyToChangeset = () => {
    if (!propName.trim() || !propCnName.trim()) {
      alert('❌ 请输入合法的属性英文名与中文名！');
      return;
    }

    // Check conflict
    const isConflict = activeObj.properties.some(p => p.name.toLowerCase() === propName.toLowerCase().trim());
    if (isConflict) {
      alert(`❌ 命名冲突：在当前对象类型 ${activeObj.id} 中已存在名为 ${propName} 的属性元素！`);
      return;
    }

    const descriptionText = propDataType === 'Enum' 
      ? `${propDescription || ''} (可选枚举值: ${enumItems.join(', ')})`
      : propDescription || '无详细描述';

    const newProperty: Property = {
      name: propName.trim(), // Keep casing as inputted or convert as needed
      dataType: propDataType,
      semanticType: propDataType === 'Enum' ? 'EnumConfig' : 'Primitive',
      confidence: 1.0,
      owner: '数据治理团队',
      status: 'Draft',
      description: descriptionText
    };

    const updatedObj: ObjectType = {
      ...activeObj,
      properties: [...activeObj.properties, newProperty],
      status: activeObj.status === 'Published' ? 'Modified' : activeObj.status
    };

    onUpdateObjectType(updatedObj);
    triggerToast(`✨ 成功向模型对象「${activeObj.id} (${activeObj.nameCn})」添加新属性「${propName} (${propCnName})」！已被并入当前变更沙箱 CS-2026-012 中安全管理。`);
    
    // Close Drawer
    setIsAddPropertyDrawerOpen(false);
  };

  // Handle drawer action "加入当前变更集"
  const handleCommitToChangeSet = () => {
    if (selectionMode === 'standard') {
      const template = STANDARD_TEMPLATES.find(t => t.id === selectedAddTargetId);
      if (!template) return;

      const newObjectType: ObjectType = {
        id: template.id,
        nameCn: template.nameCn,
        description: template.description,
        group: template.group,
        instanceCount: 0,
        properties: template.properties.map(p => ({
          ...p,
          confidence: 1.0,
          owner: '系统集成组',
          status: 'Draft' as const
        })),
        lifecycle: template.lifecycle,
        status: 'Draft' as const,
        owner: '数据治理团队'
      };

      onAddObjectType(newObjectType);
      triggerToast(`🎉 成功启用标准治理对象 ${template.id} (${template.nameCn})！并发布配置关系，已自动将新增条目编入当前变更沙箱 CS-2026-012 中。`);
      setIsAddDrawerOpen(false);
    } else {
      // Custom Extended Model Validation
      if (!customId.trim() || !customNameCn.trim()) {
        alert('❌ 请输入合法的自定义对象标识 (Object ID) 与中文名称！');
        return;
      }

      // Filter empty list rows
      const validProperties = customAttributes
        .filter(attr => attr.name.trim() !== '')
        .map(attr => ({
          name: attr.name.toLowerCase().trim(),
          dataType: attr.dataType,
          semanticType: 'CustomProperty',
          confidence: 1.0,
          owner: customOwner,
          status: 'Draft' as const,
          description: attr.description || '自定义添加的扩展属性'
        }));

      const newObjectType: ObjectType = {
        id: customId.trim(),
        nameCn: customNameCn.trim(),
        description: customDesc.trim() || '高治理场景扩展的自定义实体。',
        group: customGroup,
        instanceCount: 0,
        properties: validProperties,
        lifecycle: ['Draft', 'Active', 'Deprecated'],
        status: 'Draft' as const,
        owner: customOwner
      };

      onAddObjectType(newObjectType);
      triggerToast(`🚀 成功添加扩展对象类型 ${newObjectType.id} (${newObjectType.nameCn})！已被记录，成功并入并自动保存至变更草稿 changeset 中。`);
      
      // Reset custom form
      setCustomId('');
      setCustomNameCn('');
      setCustomDesc('');
      setCustomAttributes([
        { name: 'record_id', dataType: 'string', isRequired: true, description: '唯一序列记录ID' }
      ]);
      setIsAddDrawerOpen(false);
    }
  };

  return (
    <div className="min-h-full font-sans bg-transparent" id="object-workspace">
      
      {/* Dynamic Action Toast Notifications */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-950 border border-emerald-500/30 text-white rounded-2xl px-6 py-4 shadow-2xl flex items-center gap-3.5 max-w-xl animate-fade-in">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="text-left">
            <p className="text-[13px] font-bold tracking-tight text-emerald-200">系统数据变更成功</p>
            <p className="text-[11px] text-slate-300 font-medium mt-0.5 leading-relaxed">{toastMessage}</p>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white transition-colors ml-4 shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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
             <span className="text-slate-800 font-black">对象模型</span>
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
            <button className="px-3.5 py-1.5 text-xs font-black text-slate-650 bg-white border border-slate-250 hover:bg-slate-50 rounded-lg shadow-3xs hover:border-slate-350 transition-all flex items-center gap-1.5 cursor-pointer">
              <RefreshCw className="w-3.5 h-3.5 text-slate-450" /> 版本对比
            </button>
            <button className="px-3.5 py-1.5 text-xs font-black text-slate-650 bg-white border border-slate-250 hover:bg-slate-50 rounded-lg shadow-3xs hover:border-slate-350 transition-all flex items-center gap-1.5 cursor-pointer">
              <Download className="w-3.5 h-3.5 text-slate-450" /> 导出模型
            </button>
            <button className="p-1.5 bg-white border border-slate-250 hover:bg-slate-50 rounded-lg shadow-3xs hover:border-slate-350 transition-all cursor-pointer">
              <Settings className="w-4 h-4 text-slate-550" />
            </button>
            
            <div className="h-6 w-px bg-slate-250 mx-1"></div>
            
            <button 
              onClick={() => setIsAddDrawerOpen(true)}
              className="px-4 py-1.5 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs hover:shadow-blue-500/10 flex items-center gap-1 cursor-pointer transition-all"
            >
              启用 / 添加 Object Type <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 选项卡 Tabs 区域：100% 遵照设计图排版 */}
      <div className="flex gap-1.5 mb-5 border-b border-slate-200/80 shrink-0">
        {[
          '模型总览', '对象模型', '关系模型', '能力绑定', '动作 (Action)', 
          '流程 (Workflow)', '权限策略', '版本与发布', '变更集'
        ].map((tab) => (
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
              tab === '对象模型' 
                ? 'text-blue-600 font-black border-b-[2.5px] border-blue-600 -mb-[1px]' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab}
          </div>
        ))}
      </div>

      {/* 主体三列工作区 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
        
        {/* 左栏：Object Type 列表 */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base font-extrabold text-slate-900">对象类型列表</h3>
            <Settings className="w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-600" />
          </div>

          {/* Dotted border trigger inside list view */}
          <button 
            onClick={() => setIsAddDrawerOpen(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 border-2 border-dashed border-blue-200 hover:border-blue-500 hover:bg-blue-50/20 text-blue-600 hover:text-blue-700 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer mb-2"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>启用 / 添加 Object Type</span>
          </button>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="搜索对象类型..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Dynamic groupings rendering */}
          <div className="space-y-6 pt-2">
            {groups.map(group => {
              const matchedObjects = group.keys
                .map(key => objectTypes.find(o => o.id === key))
                .filter(Boolean)
                .filter(o => 
                  o!.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                  o!.nameCn.toLowerCase().includes(searchTerm.toLowerCase())
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
                      const isActive = obj.id === activeObj.id;
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

        {/* 中栏：对象详情主区域 */}
        <div className="lg:col-span-6 space-y-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-extrabold text-slate-900 font-mono tracking-tight">{activeObj.id} <span className="text-slate-500 text-base font-medium font-sans">({activeObj.nameCn})</span></h2>
            <span className={`text-[11px] font-bold px-2 py-1 rounded border ${
              activeObj.status === 'Published' 
                ? 'text-emerald-600 bg-emerald-50 border-emerald-100' 
                : 'text-amber-600 bg-amber-50 border-amber-100'
            }`}>
              {activeObj.status}
            </span>
          </div>

          {/* 1. 基础信息卡片 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative animate-fade-in">
            <div className="absolute top-6 right-6 cursor-pointer text-slate-400 hover:text-blue-600 transition-colors">
              <Edit className="w-4 h-4" />
            </div>
            
            <h3 className="text-sm font-extrabold text-slate-900 mb-5">基础信息</h3>
            
            <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-[13px]">
              <div className="flex border-b border-slate-50 pb-2">
                <span className="text-slate-500 w-24 shrink-0 font-medium">Object Type</span>
                <span className="font-bold text-slate-800 font-mono">{activeObj.id}</span>
              </div>
              <div className="flex border-b border-slate-50 pb-2">
                <span className="text-slate-500 w-24 shrink-0 font-medium">状态</span>
                <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-mono">{activeObj.status}</span>
              </div>
              <div className="flex border-b border-slate-50 pb-2">
                <span className="text-slate-500 w-24 shrink-0 font-medium">中文名</span>
                <span className="font-bold text-slate-800">{activeObj.nameCn}</span>
              </div>
              <div className="flex border-b border-slate-50 pb-2">
                <span className="text-slate-500 w-24 shrink-0 font-medium">Owner</span>
                <span className="font-bold text-slate-700">{activeObj.owner || '数据治理团队'}</span>
              </div>
              <div className="flex border-b border-slate-50 pb-2">
                <span className="text-slate-500 w-24 shrink-0 font-medium">所属域</span>
                <span className="font-bold text-slate-800 font-mono">DRKN本体域</span>
              </div>
              <div className="flex border-b border-slate-50 pb-2">
                <span className="text-slate-500 w-24 shrink-0 font-medium">创建时间</span>
                <span className="font-medium text-slate-700">2024-05-10 14:32:21</span>
              </div>
              <div className="flex col-span-2 pt-1 border-t border-slate-50">
                <span className="text-slate-500 w-24 shrink-0 mt-0.5 font-medium">描述说明</span>
                <span className="font-semibold text-slate-500 leading-relaxed max-w-[90%] text-xs">
                  {activeObj.description}
                </span>
              </div>
            </div>
          </div>

          {/* 2. 核心属性卡片 (FULLY DYNAMIC BASED ON CURRENT OPTION PROPERTIES) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-extrabold text-slate-900">核心属性 <span className="text-slate-400 font-medium text-xs">({activeObj.properties.length} 个字段定义)</span></h3>
              <button 
                onClick={() => {
                  if (activeObj.id === 'Field') {
                    setPropName('semantic_source');
                    setPropCnName('语义来源');
                    setPropDataType('Enum');
                    setPropIsRequired(false);
                    setPropDefaultVal('System Inferred');
                    setPropDescription('记录字段语义来源，例如系统识别、人工确认、AI 反馈。');
                    setEnumItems(['System Inferred', 'Human Confirmed', 'AI Feedback', 'External Glossary']);
                  } else {
                    setPropName('');
                    setPropCnName('');
                    setPropDataType('string');
                    setPropIsRequired(false);
                    setPropDefaultVal('');
                    setPropDescription('');
                    setEnumItems(['System Inferred', 'Human Confirmed', 'AI Feedback', 'External Glossary']);
                  }
                  setScopeKnowledgeNetwork(true);
                  setScopeAiWorkbench(true);
                  setScopeFunctionInput(true);
                  setScopeWorkflowCondition(true);
                  setScopeReleaseCheck(true);
                  setIsAddPropertyDrawerOpen(true);
                }}
                className="px-2.5 py-1 text-xs font-bold text-blue-655 hover:text-blue-700 bg-blue-50/50 hover:bg-blue-100/60 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-blue-600" /> 添加属性
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 font-bold">
                    <th className="py-2.5 px-2">属性名</th>
                    <th className="py-2.5 px-2">数据类型</th>
                    <th className="py-2.5 px-2 text-center">必填</th>
                    <th className="py-2.5 px-2">描述</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700">
                  {activeObj.properties.map((prop, idx) => (
                    <tr key={prop.name} className="border-b border-slate-50 h-11 hover:bg-slate-50/40">
                      <td className="px-2 font-bold font-mono text-slate-800">{prop.name}</td>
                      <td className="px-2 font-mono text-slate-500">{prop.dataType}</td>
                      <td className="px-2">
                        <div className="flex justify-center mt-0.5">
                          {idx < 3 ? (
                            <div className="w-4 h-4 rounded-full border border-emerald-500 flex items-center justify-center text-emerald-500">
                              <Check className="w-3 h-3" />
                            </div>
                          ) : (
                            <span className="text-slate-300 font-semibold text-xs">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 text-slate-500 max-w-[200px] truncate" title={prop.description}>{prop.description}</td>
                    </tr>
                  ))}
                  {activeObj.properties.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-405 text-xs font-semibold">
                        本扩展对象暂未声明自定义核心属性，点击下方“编辑属性”添加。
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
               <button className="px-4 py-2 bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 font-bold text-[13px] rounded-lg transition-colors cursor-pointer">查看全部属性</button>
               <button 
                 onClick={() => {
                   if (activeObj.id === 'Field') {
                     setPropName('semantic_source');
                     setPropCnName('语义来源');
                     setPropDataType('Enum');
                     setPropIsRequired(false);
                     setPropDefaultVal('System Inferred');
                     setPropDescription('记录字段语义来源，例如系统识别、人工确认、AI 反馈。');
                     setEnumItems(['System Inferred', 'Human Confirmed', 'AI Feedback', 'External Glossary']);
                   } else {
                     setPropName('');
                     setPropCnName('');
                     setPropDataType('string');
                     setPropIsRequired(false);
                     setPropDefaultVal('');
                     setPropDescription('');
                     setEnumItems(['System Inferred', 'Human Confirmed', 'AI Feedback', 'External Glossary']);
                   }
                   setScopeKnowledgeNetwork(true);
                   setScopeAiWorkbench(true);
                   setScopeFunctionInput(true);
                   setScopeWorkflowCondition(true);
                   setScopeReleaseCheck(true);
                   setIsAddPropertyDrawerOpen(true);
                 }}
                 className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[13px] rounded-lg transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
               >
                 <Plus className="w-4 h-4" /> 添加属性
               </button>
            </div>
          </div>

          {/* 3. 生命周期卡片 (DYNAMIC) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-1.5 mb-6">
              <h3 className="text-sm font-extrabold text-slate-900">生命周期流</h3>
              <Settings className="w-4 h-4 text-slate-400" />
            </div>
            
            <div className="flex flex-wrap items-start justify-between w-full max-w-lg mx-auto relative px-4 gap-y-4">
              {activeObj.lifecycle && activeObj.lifecycle.length > 0 ? (
                activeObj.lifecycle.map((state, idx) => {
                  const isCurrent = idx === activeObj.lifecycle.length - 2; 
                  return (
                    <div key={state} className="flex flex-col items-center gap-2 min-w-[70px] flex-1">
                      <div className={`w-10 h-10 rounded-full bg-white border-2 flex items-center justify-center z-10 transition-all ${
                        isCurrent 
                          ? 'border-blue-600 bg-blue-600 text-white shadow-sm' 
                          : 'border-blue-500 text-blue-500'
                      }`}>
                        {isCurrent ? <Target className="w-5 h-5" /> : <Check className="w-5 h-5" />}
                      </div>
                      <div className={`text-[12px] font-bold ${isCurrent ? 'text-blue-600' : 'text-slate-700'}`}>{state}</div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-xs text-slate-400 py-2 w-full font-semibold">该自定义对象类型使用通用的 Draft 治理流生命周期形态。</p>
              )}
            </div>
          </div>

          {/* 4. 对象说明卡片 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative">
            <h3 className="text-sm font-extrabold text-slate-900 mb-3">治理定位与说明</h3>
            <div className="absolute top-6 right-6 cursor-pointer text-slate-400 hover:text-blue-600 transition-colors">
              <Edit className="w-4 h-4" />
            </div>
            <p className="text-[13px] text-slate-500 leading-relaxed font-semibold">
              {activeObj.description}
            </p>
          </div>
        </div>

        {/* 右栏：能力与影响摘要 */}
        <div className="lg:col-span-3 space-y-6">
          
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">能力与影响摘要</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-slate-100 bg-slate-50 rounded-xl p-3 flex flex-col justify-between h-[88px]">
                <div className="flex items-center gap-2 text-[12px] text-slate-600 font-bold"><LinkIcon className="w-5 h-5 text-blue-500 rounded-md bg-blue-100 p-1" /> 相关关系</div>
                <div className="text-2xl font-black text-slate-800">{currentStats.rels}</div>
              </div>
              <div className="border border-slate-100 bg-slate-50 rounded-xl p-3 flex flex-col justify-between h-[88px]">
                <div className="flex items-center gap-2 text-[12px] text-slate-600 font-bold"><div className="w-5 h-5 rounded-md bg-blue-100 text-blue-600 italic font-bold flex items-center justify-center text-[10px]">fx</div> 绑定 Function</div>
                <div className="text-2xl font-black text-slate-800">2</div>
              </div>
              <div className="border border-slate-100 bg-slate-50 rounded-xl p-3 flex flex-col justify-between h-[88px]">
                <div className="flex items-center gap-2 text-[12px] text-slate-600 font-bold"><Play className="w-5 h-5 text-orange-500 rounded-md bg-orange-100 p-1" /> 绑定 Action</div>
                <div className="text-2xl font-black text-slate-800">3</div>
              </div>
              <div className="border border-slate-100 bg-slate-50 rounded-xl p-3 flex flex-col justify-between h-[88px]">
                <div className="flex items-center gap-2 text-[12px] text-slate-600 font-bold"><GitMerge className="w-5 h-5 text-orange-500 rounded-md bg-orange-100 p-1" /> 相关 Workflow</div>
                <div className="text-2xl font-black text-slate-800">2</div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900">关系摘要</h3>
            
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-[13px] bg-slate-50 p-2 rounded-lg border border-slate-100">
                <span className="font-mono font-bold text-slate-600">checked_by</span>
                <span className="text-slate-300">→</span>
                <span className="font-medium text-slate-800">DataQualityRule</span>
              </div>
              <div className="flex items-center justify-between text-[13px] bg-slate-50 p-2 rounded-lg border border-slate-100">
                <span className="font-mono font-bold text-slate-600">belongs_to</span>
                <span className="text-slate-300">→</span>
                <span className="font-medium text-slate-800">DataAsset</span>
              </div>
            </div>
            
            <div className="pt-2 text-right">
              <span className="text-xs font-bold text-blue-600 cursor-pointer hover:underline flex items-center justify-end gap-0.5">
                查看全部关系 <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900">快捷操作</h3>
            
            <div className="space-y-2">
               <button className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl text-sm font-bold text-slate-700 transition-colors cursor-pointer">
                 <div className="flex items-center gap-2"><LinkIcon className="w-4 h-4 text-blue-500" /> 查看关联关系</div>
                 <ChevronRight className="w-4 h-4 text-slate-400" />
               </button>
               <button className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl text-sm font-bold text-slate-700 transition-colors cursor-pointer">
                 <div className="flex items-center gap-2"><GitMerge className="w-4 h-4 text-blue-500" /> 查看调优工作流</div>
                 <ChevronRight className="w-4 h-4 text-slate-400" />
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          启用/添加 Object Type [右侧抽屉]
         ------------------------------------------------------------- */}
      {isAddDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end transition-all duration-300">
          {/* Backdrop clicks close */}
          <div className="absolute inset-0" onClick={() => setIsAddDrawerOpen(false)} />
          
          {/* Drawer Body (Generous max-w-5xl for professional side-by-side splits) */}
          <div className="relative w-full max-w-5xl bg-white h-full shadow-2xl flex flex-col z-10 border-l border-slate-200 animate-slide-in-right overflow-hidden">
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-150 flex items-center justify-between bg-slate-50">
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-500" />
                  <span>启用 / 添加 Object Type</span>
                </h2>
                <p className="text-xs text-slate-450 mt-1">扩展或激活 DRKN 主数据本体的核心模型，在变更集沙箱 CS-2026-012 中安全演进。</p>
              </div>
              <button 
                onClick={() => setIsAddDrawerOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Inner scroll area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* 第一块：选择方式 单选卡片 */}
              <div className="space-y-3">
                <label className="text-[13px] font-extrabold text-slate-800 block">第一步：选择对象定义模式</label>
                <div className="grid grid-cols-2 gap-4">
                  
                  {/* 标准卡片 */}
                  <div 
                    onClick={() => setSelectionMode('standard')}
                    className={`p-4 rounded-xl border border-dashed text-left cursor-pointer transition-all select-none ${
                      selectionMode === 'standard' 
                        ? 'bg-blue-50/40 border-blue-500 ring-1 ring-blue-500' 
                        : 'bg-white border-slate-200 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                        selectionMode === 'standard' ? 'bg-blue-100 border-blue-200 text-blue-600' : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}>
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-extrabold text-slate-900">启用标准对象类型</div>
                        <div className="text-[11px] text-slate-450 font-normal mt-0.5">从 DRKN 规范治理模型预置模板中，激活并绑定关系和能力特征。</div>
                      </div>
                    </div>
                  </div>

                  {/* 扩展自定义卡片 */}
                  <div 
                    onClick={() => setSelectionMode('extended')}
                    className={`p-4 rounded-xl border border-dashed text-left cursor-pointer transition-all select-none ${
                      selectionMode === 'extended' 
                        ? 'bg-indigo-50/40 border-indigo-500 ring-1 ring-indigo-500' 
                        : 'bg-white border-slate-200 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                        selectionMode === 'extended' ? 'bg-indigo-100 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}>
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-extrabold text-slate-900">添加扩展对象类型</div>
                        <div className="text-[11px] text-slate-450 font-normal mt-0.5">仅用于定制化的治理事务或复杂的AI标注闭环场景，自行设计自定义属性。</div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* ----------------- 标准对象选择分支 ----------------- */}
              {selectionMode === 'standard' ? (
                <div className="grid grid-cols-12 gap-6 items-start">
                  
                  {/* 第二块：标准对象类型选择列表 (40%) */}
                  <div className="col-span-12 lg:col-span-6 space-y-3">
                    <label className="text-[13px] font-extrabold text-slate-800 block">第二步：选择要启用的标准对象</label>
                    
                    <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-2 scrollbar-thin">
                      {STANDARD_TEMPLATES.map(tmpl => {
                        const isChosen = tmpl.id === selectedAddTargetId;
                        const isAlreadyActive = objectTypes.some(o => o.id === tmpl.id);
                        
                        return (
                          <div 
                            key={tmpl.id}
                            onClick={() => setSelectedAddTargetId(tmpl.id)}
                            className={`p-3.5 rounded-xl border cursor-pointer transition-all relative ${
                              isChosen 
                                ? 'bg-blue-50/40 border-blue-500 ring-1 ring-blue-500' 
                                : 'bg-white border-slate-200 hover:bg-slate-50/30'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg border ${
                                isChosen ? 'bg-blue-100 border-blue-200 text-blue-600' : 'bg-slate-50 border-slate-200 text-slate-500'
                              }`}>
                                {getObjectIcon(tmpl.id, 'w-4.5 h-4.5')}
                              </div>
                              <div className="flex-1 min-w-0 pr-6">
                                <div className="flex items-center gap-2">
                                  <span className="text-[13.5px] font-black text-slate-900 font-mono tracking-tight">{tmpl.id}</span>
                                  {tmpl.isRecommended && (
                                    <span className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-1 rounded">
                                      推荐
                                    </span>
                                  )}
                                  {isAlreadyActive && (
                                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1 rounded">
                                      已配置
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11.5px] text-slate-450 font-bold mt-0.5">{tmpl.nameCn}</p>
                                <p className="text-[11px] text-slate-450 mt-1 leading-relaxed line-clamp-2">{tmpl.description}</p>
                                
                                <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-slate-100">
                                  <span className="text-[10px] text-slate-400 font-medium">依赖本体:</span>
                                  {tmpl.dependencies.map(dep => (
                                    <span key={dep} className="text-[9.5px] font-black font-mono text-slate-650 bg-slate-100 px-1.5 py-0.5 rounded">
                                      {dep}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 第三块与第四块：对象类型实时预览及校验面板 (60%) */}
                  <div className="col-span-12 lg:col-span-6 space-y-4 bg-slate-50/50 rounded-2xl border border-slate-200 p-5">
                    
                    {/* Header */}
                    <div className="border-b border-slate-150 pb-3 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-450">实时预览面板</span>
                        <h4 className="text-sm font-black text-slate-800 font-mono mt-0.5">
                          {selectedAddTargetId} ({STANDARD_TEMPLATES.find(t => t.id === selectedAddTargetId)?.nameCn})
                        </h4>
                      </div>
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                    </div>

                    {/* Previews properties list */}
                    <div className="space-y-4">
                      
                      {/* Properties list */}
                      <div>
                        <span className="text-[11px] font-bold text-slate-450 block mb-2">默认携带属性 (Properties)</span>
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-50">
                          {PREVIEW_RESOURCES[selectedAddTargetId]?.properties.map(p => (
                            <div key={p.name} className="px-3.5 py-2 flex items-center justify-between text-xs hover:bg-slate-50/40">
                              <span className="font-mono font-bold text-slate-700">{p.name}</span>
                              <div className="flex items-center gap-3">
                                <span className="font-mono text-slate-405">{p.type}</span>
                                <span className="text-slate-400 text-[10.5px]">{p.desc}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Relations list */}
                      <div>
                        <span className="text-[11px] font-bold text-slate-450 block mb-2">推荐绑定关系 (Relations)</span>
                        <div className="flex flex-col gap-1.5">
                          {PREVIEW_RESOURCES[selectedAddTargetId]?.relations.map((r, i) => (
                            <div key={i} className="bg-white border border-slate-200 rounded-lg p-2.5 flex items-center justify-between text-[11px]">
                              <span className="font-bold font-mono text-slate-500">{r.source}</span>
                              <span className="font-semibold text-blue-600 bg-blue-50 border border-blue-100 rounded px-1.5 py-0.5 text-[9.5px]">{r.link}</span>
                              <span className="font-bold font-mono text-slate-500">{r.target}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Capacities list */}
                      <div>
                        <span className="text-[11px] font-bold text-slate-450 block mb-2">推荐附加能力 (Capabilities)</span>
                        <div className="space-y-2">
                          {PREVIEW_RESOURCES[selectedAddTargetId]?.capabilities.map((cap, i) => (
                            <div key={i} className="flex items-start gap-2 bg-white rounded-xl p-2.5 border border-slate-150">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5 shrink-0 ${
                                cap.type === 'Function' ? 'bg-amber-50 text-amber-600' : cap.type === 'Action' ? 'bg-emerald-50 text-emerald-600' : 'bg-purple-50 text-purple-600'
                              }`}>
                                {cap.type}
                              </span>
                              <div className="min-w-0 flex-1">
                                <span className="text-xs font-bold text-slate-800 font-mono tracking-tight block truncate">{cap.name}</span>
                                <span className="text-[10px] text-slate-450 leading-relaxed block truncate mt-0.5">{cap.desc}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 第四块：校验提示 */}
                      <div className="pt-3 border-t border-slate-150">
                        <span className="text-[11px] font-bold text-slate-450 block mb-2">架构校验提示 (Validation Status)</span>
                        <div className="space-y-1.5">
                          {PREVIEW_RESOURCES[selectedAddTargetId]?.validation.map((v, i) => (
                            <div key={i} className={`rounded-xl p-3 border text-xs flex items-start gap-2.5 ${
                              v.type === 'success' 
                                ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                                : v.type === 'info' 
                                ? 'bg-blue-50 border-blue-100 text-blue-850' 
                                : 'bg-amber-50 border-amber-100 text-amber-850'
                            }`}>
                              {v.type === 'success' ? (
                                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              ) : v.type === 'info' ? (
                                <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                              )}
                              <span className="font-semibold leading-relaxed text-[11px]">{v.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              ) : (
                
                // ----------------- 添加扩展对象分支 (Mode 2) -----------------
                <div className="bg-slate-50/50 rounded-2xl border border-slate-200 p-6 space-y-5 animate-fade-in">
                  <div className="flex items-center gap-2 border-b border-slate-150 pb-3">
                    <Sparkles className="w-5 h-5 text-indigo-500" />
                    <div>
                      <h4 className="text-sm font-black text-slate-800">构建添加扩展对象类型</h4>
                      <p className="text-[10.5px] text-slate-450 mt-0.5">请遵循 DRKN 本地与平台治理命名协议规范设计您的扩展自定义模型元数据。</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5 text-left">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">Object ID / 实体唯一英文标识 *</label>
                      <input 
                        type="text" 
                        placeholder="例如: PromotionRecord, AIFeedback 等"
                        value={customId}
                        onChange={(e) => setCustomId(e.target.value.replace(/[^A-Za-z]/g, ''))} // restrict to alpha chars for safety
                        className="w-full px-3 py-2 bg-white border border-slate-250 rounded-lg text-sm text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">中文名 / 显示可读别称 *</label>
                      <input 
                        type="text" 
                        placeholder="例如: 模型部署包发布活动"
                        value={customNameCn}
                        onChange={(e) => setCustomNameCn(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-250 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">属于模型分组 *</label>
                      <select 
                        value={customGroup}
                        onChange={(e) => setCustomGroup(e.target.value as ObjectGroup)}
                        className="w-full px-2.5 py-2 bg-white border border-slate-250 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="核心数据对象">核心数据对象</option>
                        <option value="语义治理对象">语义治理对象</option>
                        <option value="质量治理对象">质量治理对象</option>
                        <option value="运行治理对象">运行治理对象</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">主接口治理团队 / Owner *</label>
                      <input 
                        type="text" 
                        value={customOwner}
                        onChange={(e) => setCustomOwner(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-250 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">本体关系依赖声明 (Dependencies) *</label>
                      <div className="flex gap-3 pt-1">
                        {['Field', 'DataAsset', 'DataSource', 'SemanticAssertion', 'Evidence', 'Snapshot', 'Run'].map(d => {
                          const hasDep = customDependencies.includes(d);
                          return (
                            <label key={d} className="flex items-center gap-1.5 text-xs text-slate-650 cursor-pointer user-select-none">
                              <input 
                                type="checkbox"
                                checked={hasDep}
                                onChange={() => {
                                  if (hasDep) {
                                    setCustomDependencies(customDependencies.filter(x => x !== d));
                                  } else {
                                    setCustomDependencies([...customDependencies, d]);
                                  }
                                }}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="font-mono">{d}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div className="col-span-2">
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">作用定位描述说明</label>
                      <textarea 
                        rows={2}
                        placeholder="主要用作哪些复杂的语义治理规则判定、大模型跑批标注，包含哪些业务场景规范..."
                        value={customDesc}
                        onChange={(e) => setCustomDesc(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-250 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    {/* 自定义属性表构建器 */}
                    <div className="col-span-2 pt-3">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-extrabold text-slate-800">定义携带元属性列表 (Attributes Custom Builder)</label>
                        <button 
                          type="button"
                          onClick={handleAddAttributeRow}
                          className="px-2.5 py-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 rounded-lg flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> 增加额外属性行
                        </button>
                      </div>

                      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                        <table className="w-full text-left text-xs text-slate-650 divide-y divide-slate-150">
                          <thead className="bg-slate-50 font-bold text-slate-500">
                            <tr>
                              <th className="p-2.5">属性英文名 (Property ID)</th>
                              <th className="p-2.5">元数据类型</th>
                              <th className="p-2.5 text-center">必要必填</th>
                              <th className="p-2.5">描述说明</th>
                              <th className="p-2.5 text-center">操作</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {customAttributes.map((attr, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/40">
                                <td className="p-2">
                                  <input 
                                    type="text" 
                                    placeholder="输入字段.如 target_env"
                                    value={attr.name}
                                    onChange={(e) => handleUpdateAttributeRow(idx, 'name', e.target.value.replace(/[^A-Za-z0-9_]/g, ''))}
                                    className="px-2 py-1 w-full bg-slate-50 border border-slate-200 rounded text-xs font-mono"
                                  />
                                </td>
                                <td className="p-2">
                                  <select 
                                    value={attr.dataType}
                                    onChange={(e) => handleUpdateAttributeRow(idx, 'dataType', e.target.value)}
                                    className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                                  >
                                    <option value="string">string</option>
                                    <option value="int">int</option>
                                    <option value="float">float</option>
                                    <option value="boolean">boolean</option>
                                    <option value="timestamp">timestamp</option>
                                    <option value="text">text</option>
                                  </select>
                                </td>
                                <td className="p-2 text-center">
                                  <input 
                                    type="checkbox" 
                                    checked={attr.isRequired}
                                    onChange={(e) => handleUpdateAttributeRow(idx, 'isRequired', e.target.checked)}
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                  />
                                </td>
                                <td className="p-2">
                                  <input 
                                    type="text" 
                                    placeholder="输入注释描述"
                                    value={attr.description}
                                    onChange={(e) => handleUpdateAttributeRow(idx, 'description', e.target.value)}
                                    className="px-2 py-1 w-full bg-slate-50 border border-slate-200 rounded text-xs"
                                  />
                                </td>
                                <td className="p-2 text-center">
                                  <button 
                                    type="button"
                                    disabled={customAttributes.length <= 1}
                                    onClick={() => handleRemoveAttributeRow(idx)}
                                    className="text-slate-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4 ml-2" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                  </div>
                </div>
              )}

            </div>

            {/* Footer Buttons */}
            <div className="px-6 py-4 border-t border-slate-150 flex items-center justify-end gap-3 bg-slate-50">
              <button 
                onClick={() => setIsAddDrawerOpen(false)}
                className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-250 text-slate-700 rounded-lg text-sm font-bold transition-all shadow-xs cursor-pointer"
              >
                取消
              </button>
              <button 
                onClick={handleCommitToChangeSet}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-all shadow-sm cursor-pointer"
              >
                加入当前变更集
              </button>
            </div>

          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          添加属性 [右侧抽屉]
         ------------------------------------------------------------- */}
      {isAddPropertyDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end transition-all duration-300 animate-fade-in">
          {/* Backdrop clicks close */}
          <div className="absolute inset-0" onClick={() => setIsAddPropertyDrawerOpen(false)} />
          
          {/* Drawer Body (Sleek side panel: max-w-2xl for dense, readable form flows) */}
          <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col z-10 border-l border-slate-200 animate-slide-in-right overflow-hidden text-left">
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-150 flex items-center justify-between bg-slate-50">
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-600" />
                  <span>添加属性</span>
                </h2>
                <p className="text-xs text-slate-450 mt-1">
                  在变更集沙箱 CS-2026-012 中，为当前主体对象增配全新的核心元数据属性。
                </p>
              </div>
              <button 
                onClick={() => setIsAddPropertyDrawerOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Top Context Breadcrumb-style Area */}
            <div className="bg-slate-150/40 px-6 py-3 border-b border-slate-150 flex flex-wrap items-center gap-y-2 justify-between text-xs text-slate-650">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-450">Object Type:</span>
                <span className="font-black font-mono text-slate-850 bg-slate-200/65 px-1.5 py-0.5 rounded">
                  {activeObj.id}
                </span>
                <span className="text-slate-300">|</span>
                <span className="font-bold text-slate-450">所属域:</span>
                <span className="font-black text-blue-600">DRKN 本体</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-450">当前版本:</span>
                <span className="font-mono font-bold bg-slate-200/65 px-1.5 py-0.5 rounded text-slate-700">v1.3.0</span>
                <span className="text-slate-300">|</span>
                <span className="font-bold text-slate-455">当前变更集:</span>
                <span className="font-mono font-black text-orange-600 bg-orange-50 border border-orange-100/50 px-1.5 py-0.5 rounded">
                  CS-2026-012
                </span>
              </div>
            </div>

            {/* Inner scroll area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* 第一块：属性基础信息 */}
              <div className="space-y-4">
                <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <h3 className="text-sm font-black text-slate-800">第一块：属性基础信息</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11.5px] font-extrabold text-slate-600 block mb-1">
                      属性名 Property Name *
                    </label>
                    <input 
                      type="text" 
                      placeholder="例如: semantic_source"
                      value={propName}
                      onChange={(e) => setPropName(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                      className="w-full px-3 py-2 bg-white border border-slate-250 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder:text-slate-300 placeholder:font-sans"
                    />
                  </div>

                  <div>
                    <label className="text-[11.5px] font-extrabold text-slate-600 block mb-1">
                      中文名 *
                    </label>
                    <input 
                      type="text" 
                      placeholder="例如: 语义来源"
                      value={propCnName}
                      onChange={(e) => setPropCnName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-250 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11.5px] font-extrabold text-slate-600 block mb-1">
                      数据类型
                    </label>
                    <select 
                      value={propDataType}
                      onChange={(e) => {
                        setPropDataType(e.target.value);
                        if (e.target.value !== 'Enum') {
                          setPropDefaultVal('');
                        } else {
                          setPropDefaultVal('System Inferred');
                        }
                      }}
                      className="w-full px-2.5 py-2 bg-white border border-slate-250 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="string">string (字符串)</option>
                      <option value="int">int (整型)</option>
                      <option value="float">float (浮点型)</option>
                      <option value="boolean">boolean (布尔值)</option>
                      <option value="timestamp">timestamp (时间戳)</option>
                      <option value="Enum">Enum (枚举值型)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11.5px] font-extrabold text-slate-600 block mb-1">
                      是否必填
                    </label>
                    <div className="flex gap-4 items-center h-[34px] px-1">
                      <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-650">
                        <input 
                          type="radio" 
                          name="isRequired" 
                          checked={propIsRequired === true}
                          onChange={() => setPropIsRequired(true)}
                          className="text-blue-650 focus:ring-blue-500"
                        />
                        <span>是 (Required)</span>
                      </label>
                      <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-650">
                        <input 
                          type="radio" 
                          name="isRequired" 
                          checked={propIsRequired === false}
                          onChange={() => setPropIsRequired(false)}
                          className="text-blue-655 focus:ring-blue-500"
                        />
                        <span>否 (Optional)</span>
                      </label>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <label className="text-[11.5px] font-extrabold text-slate-600 block mb-1">
                      默认值
                    </label>
                    <input 
                      type="text" 
                      placeholder="指定默认填充值，例如: System Inferred"
                      value={propDefaultVal}
                      onChange={(e) => setPropDefaultVal(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-250 rounded-lg text-xs text-slate-805 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="text-[11.5px] font-extrabold text-slate-600 block mb-1">
                      描述
                    </label>
                    <textarea 
                      rows={2}
                      placeholder="记录属性的定义和主要应用范畴..."
                      value={propDescription}
                      onChange={(e) => setPropDescription(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-250 rounded-lg text-xs text-slate-805 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* 第二块：属性类型配置 */}
              {propDataType === 'Enum' && (
                <div className="space-y-3 bg-indigo-50/30 rounded-xl border border-indigo-150 p-4 animate-fade-in">
                  <div className="flex items-center gap-1.5 border-b border-indigo-100 pb-2 mb-2">
                    <Settings className="w-4 h-4 text-indigo-500" />
                    <h3 className="text-xs font-black text-slate-850">第二块：属性类型配置（枚举值可选值配置）</h3>
                  </div>

                  <p className="text-[10.5px] text-slate-450 leading-relaxed font-semibold">
                    请定义该枚举型属性包含的值：
                  </p>

                  <div className="flex flex-wrap gap-2 py-2">
                    {enumItems.map((item, idx) => (
                      <span 
                        key={idx} 
                        className="inline-flex items-center gap-1.5 bg-white border border-indigo-105 text-indigo-700 font-bold font-mono text-[11px] px-2.5 py-1 rounded-lg shadow-2xs hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition-all group cursor-pointer"
                        title="点击删除"
                        onClick={() => setEnumItems(enumItems.filter(x => x !== item))}
                      >
                        <span>{item}</span>
                        <X className="w-3 h-3 text-slate-400 group-hover:text-rose-500 transition-colors" />
                      </span>
                    ))}
                    {enumItems.length === 0 && (
                      <span className="text-xs text-slate-400 italic">空枚举，请输入下面的值并回车添加</span>
                    )}
                  </div>

                  <div className="flex gap-2 max-w-sm pt-1">
                    <input 
                      type="text" 
                      placeholder="输入一个新的枚举可选值值项..."
                      value={newEnumVal}
                      onChange={(e) => setNewEnumVal(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newEnumVal.trim() && !enumItems.includes(newEnumVal.trim())) {
                            setEnumItems([...enumItems, newEnumVal.trim()]);
                            setNewEnumVal('');
                          }
                        }
                      }}
                      className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-805 focus:outline-none"
                    />
                    <button 
                      type="button"
                      onClick={() => {
                        if (newEnumVal.trim() && !enumItems.includes(newEnumVal.trim())) {
                          setEnumItems([...enumItems, newEnumVal.trim()]);
                          setNewEnumVal('');
                        }
                      }}
                      className="px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
                    >
                      添加值
                    </button>
                  </div>
                </div>
              )}

              {/* 第三块：使用范围 */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <Target className="w-4 h-4 text-slate-500" />
                  <h3 className="text-sm font-black text-slate-800">第三块：使用范围 (Checkboxes)</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                  {[
                    { id: 'scopeKnowledgeNetwork', label: '可在知识网络中展示', value: scopeKnowledgeNetwork, setter: setScopeKnowledgeNetwork, desc: '勾选后本体大图、缩略拓扑及全景图谱中将携带挂载该属性声明' },
                    { id: 'scopeAiWorkbench', label: '可被 AI 工作台引用', value: scopeAiWorkbench, setter: setScopeAiWorkbench, desc: '系统大模型场景和 Prompt 词典检索将自动获取且运用该信息' },
                    { id: 'scopeFunctionInput', label: '可参与 Function 输入', value: scopeFunctionInput, setter: setScopeFunctionInput, desc: '授权作为底层各种数据一致性、规则探查函数的基础入参' },
                    { id: 'scopeWorkflowCondition', label: '可参与 Workflow 条件判断', value: scopeWorkflowCondition, setter: setScopeWorkflowCondition, desc: '授权支持工作流中的 Condition 决策引擎做分支规则路流判断' },
                    { id: 'scopeReleaseCheck', label: '可参与发布校验', value: scopeReleaseCheck, setter: setScopeReleaseCheck, desc: '启动对该对象实例化或提交时进行沙箱与生产边界的强制比照' }
                  ].map(scope => (
                    <label 
                      key={scope.id}
                      className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer text-left transition-all select-none ${
                        scope.value 
                          ? 'bg-blue-50/25 border-blue-200 shadow-3xs' 
                          : 'bg-white border-slate-200 hover:bg-slate-50/50'
                      }`}
                    >
                      <input 
                        type="checkbox"
                        checked={scope.value}
                        onChange={(e) => scope.setter(e.target.checked)}
                        className="rounded border-slate-350 text-blue-600 focus:ring-blue-500 mt-1 shrink-0 cursor-pointer"
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-extrabold text-slate-800 tracking-tight block">
                          {scope.label}
                        </span>
                        <span className="text-[10px] text-slate-450 block mt-0.5 leading-normal">
                          {scope.desc}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* 第四块：影响分析预览 */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <Layers className="w-4 h-4 text-slate-500" />
                  <h3 className="text-sm font-black text-slate-800">第四块：影响分析预览</h3>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs leading-normal text-slate-700">
                  <div className="flex items-center gap-2 text-blue-800 font-bold">
                    <Info className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>自动级联影响计算提示</span>
                  </div>
                  
                  <p className="text-[11px] text-slate-450 leading-relaxed font-semibold">
                    新增此元属性之后，基于 DRKN 系统依赖网络，将可能连带影响以下实体及能力流正常计算：
                  </p>

                  <div className="grid grid-cols-2 gap-3.5 pt-1">
                    <div className="bg-white border border-slate-150 p-2.5 rounded-lg flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded bg-blue-50 border border-blue-150 flex items-center justify-center shrink-0">
                        <Database className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-slate-400 block tracking-tight">影响 Object Type</span>
                        <span className="text-[11px] font-black text-slate-800 truncate block font-mono">{activeObj.id}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 bg-white border border-slate-150 p-2.5 rounded-lg">
                      <div className="w-7 h-7 rounded bg-amber-50 border border-amber-150 flex items-center justify-center shrink-0">
                        <span className="text-amber-600 text-[10px] uppercase font-mono font-black">Fx</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-slate-400 block tracking-tight">可能影响 Function</span>
                        <span className="text-[11px] font-black text-slate-800 truncate block font-mono">classifyFieldSemantic()</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 bg-white border border-slate-150 p-2.5 rounded-lg">
                      <div className="w-7 h-7 rounded bg-emerald-50 border border-emerald-150 flex items-center justify-center shrink-0">
                        <GitMerge className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-slate-400 block tracking-tight">可能影响 Workflow</span>
                        <span className="text-[11px] font-black text-slate-800 truncate block font-mono">SemanticReviewWorkflow</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 bg-white border border-slate-150 p-2.5 rounded-lg">
                      <div className="w-7 h-7 rounded bg-purple-50 border border-purple-150 flex items-center justify-center shrink-0">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-slate-400 block tracking-tight">可能影响 AI 场景</span>
                        <span className="text-[11px] font-black text-slate-800 truncate block font-medium">字段解释</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 第五块：校验结果 */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <Shield className="w-4 h-4 text-slate-500" />
                  <h3 className="text-sm font-black text-slate-800">第五块：校验结果 (Validation Status)</h3>
                </div>

                <div className="space-y-2">
                  {/* Validation Item 1 - Name Conflict */}
                  {activeObj.properties.some(p => p.name.toLowerCase() === propName.toLowerCase().trim()) ? (
                    <div className="bg-rose-50 border border-rose-100/50 rounded-xl p-3 flex items-start gap-2.5 text-rose-800">
                      <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                      <div className="text-xs text-left">
                        <div className="font-extrabold text-[12px]">存在命名冲突 (Name Conflict Detected)</div>
                        <p className="text-[10.5px] text-rose-700 font-semibold mt-0.5 leading-relaxed">
                          当前对象模型 {activeObj.id} 中已经存在名为「{propName.trim()}」的属性元素，重名将被拒绝录入。
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3 flex items-start gap-2.5 text-emerald-805">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 bg-emerald-100/70 rounded-full p-0.5 animate-pulse" />
                      <div className="text-xs text-left">
                        <div className="font-extrabold text-[12px] text-emerald-900">命名无冲突</div>
                        <p className="text-[10.5px] text-emerald-700/80 leading-relaxed font-bold mt-0.5">
                          属性名「{propName || '<空输入>'}」在当前 {activeObj.id} 实体模型下具有全局唯一性，未与现有指标域或元属性冲突。
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Validation Item 2 - Data Type legality */}
                  <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3 flex items-start gap-2.5 text-emerald-850">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 bg-emerald-100/70 rounded-full p-0.5" />
                    <div className="text-xs text-left">
                      <div className="font-extrabold text-[12px] text-emerald-900">数据类型合法 (Type Legal)</div>
                      <p className="text-[10.5px] text-emerald-700/80 leading-relaxed font-semibold mt-0.5">
                        「{propDataType}」类型属于数据分类标准注册集白名单，编译能正常映射解析。
                      </p>
                    </div>
                  </div>

                  {/* Validation Item 3 - Required Fields Checks */}
                  <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3 flex items-start gap-2.5 text-emerald-850">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 bg-emerald-100/70 rounded-full p-0.5" />
                    <div className="text-xs text-left">
                      <div className="font-extrabold text-[12px] text-emerald-900">当前属性不影响已有必填项校验</div>
                      <p className="text-[10.5px] text-emerald-700/80 leading-relaxed font-semibold mt-0.5">
                        由于默认指定为选填，或提供了缺省机制，写入已有运行态资产节点时不会发生空对象异常错误。
                      </p>
                    </div>
                  </div>

                  {/* Validation Item 4 - Workflow Re-validation Alert */}
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-start gap-2.5 text-amber-850">
                    <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    <div className="text-xs text-left">
                      <div className="font-extrabold text-[12px] text-amber-900">需要重新校验 SemanticReviewWorkflow</div>
                      <p className="text-[10.5px] text-amber-700/80 leading-relaxed font-bold mt-0.5">
                        发布或合并本沙箱变更时，因底层规则级联，必须启动针对核心审校流《SemanticReviewWorkflow》的探查和重新运行校验校验。
                      </p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer Buttons */}
            <div className="px-6 py-4 border-t border-slate-150 flex items-center justify-end gap-3 bg-slate-50">
              <button 
                onClick={() => setIsAddPropertyDrawerOpen(false)}
                className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-250 text-slate-700 rounded-lg text-sm font-bold transition-all shadow-xs cursor-pointer"
              >
                取消
              </button>
              <button 
                onClick={handleSavePropertyToChangeset}
                disabled={activeObj.properties.some(p => p.name.toLowerCase() === propName.toLowerCase().trim())}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-all shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                保存到变更集
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
