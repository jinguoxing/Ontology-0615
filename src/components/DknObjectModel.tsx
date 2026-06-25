import React, { useState, useEffect } from 'react';

export interface DknRelation {
  id: string;
  source: string;
  relationType: string;
  target: string;
  direction: '单向' | '双向';
  cardinality: string;
  creationMethod: string;
  status: '已启用' | '草稿';
  desc: string;
  confidence?: number;
}

export interface DknAction {
  id: string;
  name: string;
  code: string;
  targetObject: string;
  actionType: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  execMode: 'ASYNC' | 'SYNC';
  boundFunction: string;
  requireApproval: boolean;
  status: '已绑定' | '草稿';
  inputSchema: string;
  outputSchema: string;
  desc: string;
}
import { 
  Database, Play, CheckCircle, HelpCircle, AlertTriangle,
  Sparkles, Plus, Settings, ChevronDown, Check, Layers, ShieldCheck,
  Workflow, Cpu, Network, Info, Eye, ArrowUpRight, Code, Shield, Sparkle,
  Search, Bell, ExternalLink, RefreshCw, Download, Edit2, List, Trash2, X,
  Link2, Trash, ClipboardList, BookOpen, AlertCircle, BarChart3, HelpCircle as HelpIcon,
  PlayCircle, Activity, ShieldAlert, CheckSquare, Sparkles as SparkleIcon,
  GitBranch, HelpCircle as QuestionIcon, ArrowRight, ArrowLeft, ArrowUp, ChevronRight, CheckCircle2,
  GripVertical, Clock
} from 'lucide-react';
import { DknPageHeader } from './ui/DknPageHeader';

interface DknObjectModelProps {
  onNavigate: (view: string, targetId?: string) => void;
  selectedObjectId?: string;
  onSelectObject: (id: string) => void;
  isLocked?: boolean;
}

// Full interactive mockup state representing the DKN model data
interface DknAttr {
  id: string;
  name: string;
  code: string;
  dataType: string;
  semanticType: string;
  isRequired: boolean;
  defaultValue: string;
  desc: string;
  isSearchable?: boolean;
  sourcePath?: string;
  unit?: string;
  range?: string;
  isNullable?: boolean;
  isPrimary?: boolean;
  sortPriority?: number;
  mappingMode?: string;
}

interface DknObjDetail {
  id: string;
  nameCn: string;
  category: string;
  status: string;
  lifecycle: string;
  desc: string;
  properties: DknAttr[];
  links: string[];
  actions: string[];
  functions: { name: string; badge: string }[];
  workflows: { name: string; badge: string }[];
}

export default function DknObjectModel({
  onNavigate,
  selectedObjectId = 'Field',
  onSelectObject,
  isLocked = false
}: DknObjectModelProps) {
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeStep, setActiveStep] = useState(2); // Step 2 "补充关系" is active by default in design sheet

  // ==================== WIZARD ON-CREATE STATE (RESTORING SCREENSHOT DESIGN) ====================
  const [isAddingObjectType, setIsAddingObjectType] = useState(true);
  const [wizardActiveStep, setWizardActiveStep] = useState(5); // Set to Step 5 (Function Binding) to restore design immediately.
  const [wizardObjName, setWizardObjName] = useState('Field');
  const [wizardObjCode, setWizardObjCode] = useState('field');
  const [wizardCategory, setWizardCategory] = useState('数据对象');
  const [wizardStatus, setWizardStatus] = useState('启用');
  const [wizardDesc, setWizardDesc] = useState('表示销售域中用于描述数据字段的对象，承载字段语义、数据类型、质量与来源等信息。');
  const [wizardLifecycle, setWizardLifecycle] = useState('标准生命周期');
  const [wizardPrimaryId, setWizardPrimaryId] = useState('fieldId');
  const [wizardSourceType, setWizardSourceType] = useState('表结构映射'); // '表结构映射' | 'AI推断' | '人工定义'
  const [wizardAllowRef, setWizardAllowRef] = useState(true);
  const [wizardAllowAction, setWizardAllowAction] = useState(true);
  const [wizardAllowFunc, setWizardAllowFunc] = useState(true);

  // Selected property to edit inside Step 2
  const [selectedPropCode, setSelectedPropCode] = useState('qualityScore');
  const [isJsonViewMode, setIsJsonViewMode] = useState(false);
  const [propSearchTerm, setPropSearchTerm] = useState('');

  // Lists inside wizard
  const [wizardProperties, setWizardProperties] = useState<DknAttr[]>([
    {
      id: 'wp1',
      name: '编号',
      code: 'id',
      dataType: 'String',
      semanticType: 'ID',
      isRequired: true,
      defaultValue: '-',
      desc: '对象的全局唯一序列号或标识符。',
      isSearchable: true,
      sourcePath: 'source.id',
      unit: '-',
      range: '-',
      isNullable: false,
      isPrimary: true,
      sortPriority: 10,
      mappingMode: '字段映射 font-mono'
    },
    {
      id: 'wp2',
      name: '名称',
      code: 'name',
      dataType: 'String',
      semanticType: 'DIMENSION',
      isRequired: true,
      defaultValue: '-',
      desc: '对应实体的显示名或展示属性。',
      isSearchable: true,
      sourcePath: 'source.name',
      unit: '-',
      range: '-',
      isNullable: false,
      isPrimary: false,
      sortPriority: 20,
      mappingMode: '字段映射 font-mono'
    },
    {
      id: 'wp3',
      name: '状态',
      code: 'status',
      dataType: 'String',
      semanticType: 'STATUS',
      isRequired: true,
      defaultValue: 'ACTIVE',
      desc: '标记当前模型在系统中的生命激活状态。',
      isSearchable: true,
      sourcePath: 'source.status',
      unit: '-',
      range: 'ACTIVE, INACTIVE',
      isNullable: false,
      isPrimary: false,
      sortPriority: 30,
      mappingMode: '字段映射 font-mono'
    },
    {
      id: 'wp4',
      name: '创建时间',
      code: 'createdAt',
      dataType: 'DateTime',
      semanticType: 'DIMENSION',
      isRequired: false,
      defaultValue: '-',
      desc: '实体在源系统中的建立时间。',
      isSearchable: false,
      sourcePath: 'source.created_at',
      unit: '-',
      range: '-',
      isNullable: true,
      isPrimary: false,
      sortPriority: 40,
      mappingMode: '字段映射'
    },
    {
      id: 'wp5',
      name: '质量评分',
      code: 'qualityScore',
      dataType: 'Decimal (18,2)',
      semanticType: 'MEASURE',
      isRequired: false,
      defaultValue: '0',
      desc: '数据质量评分，取值范围 0 到 100，分数越高表示数据质量越好。',
      isSearchable: true,
      sourcePath: 'source.quality_score',
      unit: '分',
      range: '0 ~ 100',
      isNullable: true,
      isPrimary: false,
      sortPriority: 50,
      mappingMode: '字段映射'
    }
  ]);

  const [wizardRelations, setWizardRelations] = useState<DknRelation[]>([
    {
      id: 'r1',
      source: 'Dataset',
      relationType: 'contains',
      target: 'Field',
      direction: '单向',
      cardinality: '1:N',
      creationMethod: 'schema-based',
      status: '已启用',
      desc: '源物理数据集包含此字段实体。',
      confidence: 95
    },
    {
      id: 'r2',
      source: 'Field',
      relationType: 'mapped_to',
      target: 'Mapping',
      direction: '单向',
      cardinality: 'N:1',
      creationMethod: 'schema-based',
      status: '已启用',
      desc: 'Field 与 Mapping 之间的映射关系，一个 Mapping 可被多个 Field 引用。',
      confidence: 90
    },
    {
      id: 'r3',
      source: 'Field',
      relationType: 'has_quality',
      target: 'DataQuality',
      direction: '单向',
      cardinality: '1:N',
      creationMethod: 'rule-based',
      status: '草稿',
      desc: '对应字段实体上所包含的血缘规则质量绑定。',
      confidence: 85
    }
  ]);

  const [selectedRelationId, setSelectedRelationId] = useState<string>('r2');
  const [relationSearchTerm, setRelationSearchTerm] = useState('');

  const [wizardLinks, setWizardLinks] = useState<string[]>([
    'Dataset -> contains -> Field',
    'Field -> has_quality -> DataQuality',
    'Field -> mapped_to -> Mapping'
  ]);

  useEffect(() => {
    setWizardLinks(wizardRelations.map(r => `${r.source} -> ${r.relationType} -> ${r.target}`));
  }, [wizardRelations]);
  const [wizardActionList, setWizardActionList] = useState<DknAction[]>([
    {
      id: 'wa1',
      name: 'infer_field_semantics',
      code: 'infer_field_semantics',
      targetObject: 'Field',
      actionType: 'GENERATE',
      riskLevel: 'LOW',
      execMode: 'ASYNC',
      boundFunction: 'fn_infer_field_semantics',
      requireApproval: false,
      status: '已绑定',
      desc: '基于样例数据，调用 LLM 推定和矫正其真实业务语义角色。',
      inputSchema: JSON.stringify({
        type: "object",
        properties: {
          field_name: "string",
          sample_values: "array"
        }
      }, null, 2),
      outputSchema: JSON.stringify({
        type: "object",
        properties: {
          semantic_tag: "string",
          confidence: "number"
        }
      }, null, 2)
    },
    {
      id: 'wa2',
      name: 'calculate_data_quality',
      code: 'calculate_data_quality',
      targetObject: 'Field',
      actionType: 'VALIDATE',
      riskLevel: 'MEDIUM',
      execMode: 'ASYNC',
      boundFunction: 'fn_calculate_data_quality',
      requireApproval: true,
      status: '已绑定',
      desc: '计算字段的质量，输出质量分数、问题列表与指标详情。',
      inputSchema: JSON.stringify({
        type: "object",
        properties: {
          field_id: "string",
          data_sample: "array",
          rules: "array"
        }
      }, null, 2),
      outputSchema: JSON.stringify({
        type: "object",
        properties: {
          quality_score: "number",
          issues: "array",
          metrics: "object"
        }
      }, null, 2)
    },
    {
      id: 'wa3',
      name: 'generate_mapping',
      code: 'generate_mapping',
      targetObject: 'Field',
      actionType: 'GENERATE',
      riskLevel: 'HIGH',
      execMode: 'ASYNC',
      boundFunction: 'fn_generate_mapping',
      requireApproval: false,
      status: '已绑定',
      desc: '全自动建立物理到语义标准层之映射路径方案。',
      inputSchema: JSON.stringify({
        type: "object",
        properties: {
          source_fields: "array",
          target_ontology: "string"
        }
      }, null, 2),
      outputSchema: JSON.stringify({
        type: "object",
        properties: {
          mappings: "array",
          avg_confidence: "number"
        }
      }, null, 2)
    },
    {
      id: 'wa4',
      name: 'create_assertion',
      code: 'create_assertion',
      targetObject: 'Field',
      actionType: 'UPDATE',
      riskLevel: 'MEDIUM',
      execMode: 'SYNC',
      boundFunction: 'fn_create_assertion',
      requireApproval: false,
      status: '已绑定',
      desc: '由拥有审核权限之专家机制产生直接性事实断言标签。',
      inputSchema: JSON.stringify({
        type: "object",
        properties: {
          assertion_key: "string",
          assertion_value: "string"
        }
      }, null, 2),
      outputSchema: JSON.stringify({
        type: "object",
        properties: {
          status: "string"
        }
      }, null, 2)
    }
  ]);
  const [selectedActionId, setSelectedActionId] = useState<string>('wa2');
  const [actionSearchTerm, setActionSearchTerm] = useState<string>('');

  const [wizardActions, setWizardActions] = useState<string[]>([]);
  useEffect(() => {
    setWizardActions(wizardActionList.filter(a => a.status === '已绑定').map(a => a.code));
  }, [wizardActionList]);

  const [wizardFunctions, setWizardFunctions] = useState<{ name: string; badge: string }[]>([
    { name: 'field_semantic_classification', badge: 'In 4 / Out 1' },
    { name: 'quality_score_compute', badge: 'In 3 / Out 1' },
    { name: 'mapping_confidence_compute', badge: 'In 4 / Out 1' }
  ]);

  // Step 5 high-fidelity state
  const [wizardFnSearch, setWizardFnSearch] = useState<string>('');
  const [selectedFnId, setSelectedFnId] = useState<string>('2');
  const [isTestingFn, setIsTestingFn] = useState<boolean>(false);
  const [testSuccess, setTestSuccess] = useState<boolean>(true);
  const [wizardFnList, setWizardFnList] = useState([
    {
      id: '1',
      name: 'field_semantic_classification',
      type: 'inference',
      targetObj: 'Field',
      targetAct: 'classify',
      inputSchemaName: 'FieldInput',
      outputSchemaName: 'ClassificationResult',
      mode: '同步',
      status: '● 已启用',
      desc: '基于字段元数据、样本数据，自动对该字段推导推荐对应的底层物理列及计算引擎所适合的高维业务分类名称。',
      inputSchemaText: JSON.stringify({
        type: "object",
        properties: {
          fieldNames: "array",
          sampleValues: "array",
          characterSet: "string"
        }
      }, null, 2),
      outputSchemaText: JSON.stringify({
        type: "object",
        properties: {
          recommendedClass: "string",
          confidence: "number",
          alternativeClasses: "array"
        }
      }, null, 2),
      testInput: JSON.stringify({
        fieldNames: ["user_age", "age_col"],
        sampleValues: ["23", "45", "18"],
        characterSet: "UTF-8"
      }, null, 2),
      testOutput: JSON.stringify({
        recommendedClass: "UserAge",
        confidence: 0.985,
        alternativeClasses: ["AgeGroup", "DurationYears"]
      }, null, 2),
      execMode: '同步',
      timeout: '3000',
      execTime: '84 ms',
      time: '2025-05-15 14:31:02'
    },
    {
      id: '2',
      name: 'quality_score_compute',
      type: 'scoring',
      targetObj: 'Field',
      targetAct: 'score',
      inputSchemaName: 'FieldQualityInput',
      outputSchemaName: 'QualityScoreResult',
      mode: '同步',
      status: '● 已启用',
      desc: '基于字段值、数据类型及上下文信息，计算字段质量得分，输出质量等级、原因与优化建议，用于数据质量评估与排序。',
      inputSchemaText: JSON.stringify({
        type: "object",
        properties: {
          fieldName: "string",
          fieldValue: "string",
          dataType: "string",
          context: "object"
        }
      }, null, 2),
      outputSchemaText: JSON.stringify({
        type: "object",
        properties: {
          qualityScore: "number",
          level: "string",
          reasons: "array",
          suggestions: "array"
        }
      }, null, 2),
      testInput: JSON.stringify({
        fieldName: "客户年龄",
        fieldValue: "35",
        dataType: "int",
        context: {
          source: "crm_system",
          recordCount: 1250
        }
      }, null, 2),
      testOutput: JSON.stringify({
        qualityScore: 92,
        level: "优秀",
        reasons: ["数据完整", "类型匹配", "无异常值"],
        suggestions: ["保持当前规范", "定期校验数据一致性"]
      }, null, 2),
      execMode: '同步 (Synchronous)',
      timeout: '5000',
      execTime: '128 ms',
      time: '2025-05-15 14:32:18'
    },
    {
      id: '3',
      name: 'mapping_confidence_compute',
      type: 'scoring',
      targetObj: 'Field',
      targetAct: 'computeConfidence',
      inputSchemaName: 'MappingInput',
      outputSchemaName: 'ConfidenceResult',
      mode: '异步',
      status: '● 已启用',
      desc: '深度多维度比对源表及目标表的字段值分布特征、关联分布图表和主外键历史基数，输出连接图血缘投射置信指数。',
      inputSchemaText: JSON.stringify({
        type: "object",
        properties: {
          sourceField: "string",
          targetField: "string",
          cardinality: "number"
        }
      }, null, 2),
      outputSchemaText: JSON.stringify({
        type: "object",
        properties: {
          confidenceIndex: "number",
          mappingStatus: "string",
          provenanceChain: "array"
        }
      }, null, 2),
      testInput: JSON.stringify({
        sourceField: "users.id",
        targetField: "profiles.user_id",
        cardinality: 84500
      }, null, 2),
      testOutput: JSON.stringify({
        confidenceIndex: 0.941,
        mappingStatus: "StrongCandidate",
        provenanceChain: ["ImplicitFK", "DomainOverlap"]
      }, null, 2),
      execMode: '异步',
      timeout: '8000',
      execTime: '312 ms',
      time: '2025-05-15 14:34:55'
    }
  ]);

  // AI suggestions list inside wizard
  const [wizardAiSuggestions, setWizardAiSuggestions] = useState([
    { id: 'was1', text: '建议配置取值范围', isAdopted: false, tip: '检测到该属性为评分类型，建议配置取值范围 0 ~ 100。' },
    { id: 'was2', text: '建议挂载质量评估函数', isAdopted: false, tip: '建议挂载 calculate_data_quality 函数，自动计算质量得分。' },
    { id: 'was3', text: '建议设置默认值', isAdopted: false, tip: '建议默认值设置为 0，表示未评估。' }
  ]);

  // Handle single suggestion adoption
  const handleAdoptWizardSuggestion = (id: string) => {
    setWizardAiSuggestions(prev => prev.map(item => {
      if (item.id === id) {
        if (id === 'was1') {
          // update qualityScore range
          setWizardProperties(prevProps => prevProps.map(p => {
            if (p.code === 'qualityScore') {
              return { ...p, range: '0 ~ 100', unit: '分' };
            }
            return p;
          }));
        }
        if (id === 'was3') {
          // update qualityScore default value
          setWizardProperties(prevProps => prevProps.map(p => {
            if (p.code === 'qualityScore') {
              return { ...p, defaultValue: '0' };
            }
            return p;
          }));
        }
        return { ...item, isAdopted: true };
      }
      return item;
    }));
    showToast('💡 已采纳 AI 建模建议！且已更新属性字段属性。', 'success');
  };

  const handleAddPresets = () => {
    setWizardProperties([
      { id: 'wp1', name: '编号', code: 'id', dataType: 'String', semanticType: 'ID', isRequired: true, defaultValue: '-', desc: '全局主键标识', isSearchable: true, sourcePath: 'source.id', range: '-', unit: '-', isNullable: false, isPrimary: true, sortPriority: 10, mappingMode: '字段映射' },
      { id: 'wp2', name: '名称', code: 'name', dataType: 'String', semanticType: 'DIMENSION', isRequired: true, defaultValue: '-', desc: '系统显示名', isSearchable: true, sourcePath: 'source.name', range: '-', unit: '-', isNullable: false, isPrimary: false, sortPriority: 20, mappingMode: '字段映射' },
      { id: 'wp3', name: '状态', code: 'status', dataType: 'String', semanticType: 'STATUS', isRequired: true, defaultValue: 'ACTIVE', desc: '物理运行状态', isSearchable: true, sourcePath: 'source.status', range: 'ACTIVE, INACTIVE', unit: '-', isNullable: false, isPrimary: false, sortPriority: 30, mappingMode: '字段映射' },
      { id: 'wp4', name: '创建时间', code: 'createdAt', dataType: 'DateTime', semanticType: 'DIMENSION', isRequired: false, defaultValue: '-', desc: '物理流在源系统中的建立时间', isSearchable: false, sourcePath: 'source.created_at', range: '-', unit: '-', isNullable: true, isPrimary: false, sortPriority: 40, mappingMode: '字段映射' },
      { id: 'wp5', name: '质量评分', code: 'qualityScore', dataType: 'Decimal (18,2)', semanticType: 'MEASURE', isRequired: false, defaultValue: '0', desc: '数据质量评分，取值范围 0 到 100，分数越高表示数据质量越好。', isSearchable: true, sourcePath: 'source.quality_score', range: '0 ~ 100', unit: '分', isNullable: true, isPrimary: false, sortPriority: 50, mappingMode: '字段映射' }
    ]);
    showToast('💡 成功加载 5 项高保真默认设计属性！', 'success');
  };

  // State to simulate loading when checking
  const [isValidating, setIsValidating] = useState(false);
  const [validationSuccess, setValidationSuccess] = useState(true); // default true for high fidelity initial paint as shown in screen

  // Step 6 high-fidelity state
  const [checklistTab, setChecklistTab] = useState<'all' | 'pass' | 'warn' | 'error' | 'block'>('all');
  const [checklistExpanded, setChecklistExpanded] = useState<Record<string, boolean>>({
    base: true,
    properties: true,
    relationship: true,
    action: true
  });
  const [confirmModelingChecked, setConfirmModelingChecked] = useState<boolean>(true);
  const [confirmListChecked, setConfirmListChecked] = useState<boolean>(true);
  const [adoptedStep6Suggestions, setAdoptedStep6Suggestions] = useState<Record<string, boolean>>({
    genMapGroup: false,
    qualityGroup: false,
    hasQualityGroup: false
  });

  // Form states for manual property additions
  const [pName, setPName] = useState('');
  const [pCode, setPCode] = useState('');
  const [pType, setPType] = useState('String');
  const [pSemantic, setPSemantic] = useState('DIMENSION');
  const [pRequired, setPRequired] = useState(false);
  const [pDesc, setPDesc] = useState('');

  // State for popups, actions, and processes
  const [isAddPropOpen, setIsAddPropOpen] = useState(false);
  const [isEditObjOpen, setIsEditObjOpen] = useState(false);
  const [isAddLinkOpen, setIsAddLinkOpen] = useState(false);
  const [isAddActionOpen, setIsAddActionOpen] = useState(false);
  const [isAddFuncOpen, setIsAddFuncOpen] = useState(false);
  const [isViewDagOpen, setIsViewDagOpen] = useState(false);
  const [isRunPreviewOpen, setIsRunPreviewOpen] = useState(false);
  
  // Custom states for editing/added values
  const [newPropName, setNewPropName] = useState('');
  const [newPropCode, setNewPropCode] = useState('');
  const [newPropType, setNewPropType] = useState('String');
  const [newPropSemantic, setNewPropSemantic] = useState('');
  const [newPropRequired, setNewPropRequired] = useState(false);
  const [newPropDefault, setNewPropDefault] = useState('-');
  const [newPropDesc, setNewPropDesc] = useState('');

  const [newLinkSource, setNewLinkSource] = useState('');
  const [newLinkVerb, setNewLinkVerb] = useState('');
  const [newLinkTarget, setNewLinkTarget] = useState('');

  const [newActionName, setNewActionName] = useState('');
  const [newActionRisk, setNewActionRisk] = useState('低风险');

  const [newFuncName, setNewFuncName] = useState('');
  const [newFuncIo, setNewFuncIo] = useState('In 3 / Out 1');

  // Interactive Action Toggles (simulating model configuration)
  const [actionToggles, setActionToggles] = useState<Record<string, boolean>>({
    infer_field_semantics: true,
    calculate_data_quality: true,
    generate_mapping: true,
    create_assertion: true,
    scan_data_source: true,
    test_connection: true,
    collect_metadata: true,
    analyze_dataset: true,
    trigger_data_profiling: true,
    refresh_statistics: true,
    run_quality_validation: true,
    recompute_quality_index: true,
    create_rule_template: true,
    evaluate_rule_accuracy: true,
    accept_recommendations: true,
    create_task: true,
    reassign_owner: true,
    close_governed_issue: true
  });

  // Toast notifications state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'warn' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'warn' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleCommitCreation = () => {
    if (!confirmModelingChecked || !confirmListChecked) {
      showToast('⚠️ 在创建前必须勾选两条对齐确认项！', 'warn');
      return;
    }
    if (!wizardObjCode || !wizardObjName) {
      showToast('核心名称 or 编码不能为空！', 'warn');
      return;
    }
    const newCodeCapitalized = wizardObjCode.charAt(0).toUpperCase() + wizardObjCode.slice(1);
    setObjects({
      ...objects,
      [newCodeCapitalized]: {
        id: newCodeCapitalized,
        nameCn: wizardObjName,
        category: 'DATA',
        status: wizardStatus,
        lifecycle: 'Draft',
        desc: wizardDesc,
        properties: wizardProperties.length > 0 ? wizardProperties : [
          { id: 'wp1', name: '对象标识ID', code: `${wizardObjCode}Id`, dataType: 'String', semanticType: 'ID', isRequired: true, defaultValue: '-', desc: '全局唯一标识' }
        ],
        links: wizardLinks,
        actions: wizardActions,
        functions: wizardFunctions.map(f => f.name),
        workflows: [{ name: 'semantic_governance_workflow', badge: '8 steps' }]
      }
    });
    onSelectObject(newCodeCapitalized);
    setIsAddingObjectType(false);
    showToast(`🎉 成功基于元配置并入并发布实体: ${wizardObjName} (${newCodeCapitalized})`, 'success');
  };

  // Base mockup data for all 9 object types mirroring the DRKN schema
  const [objects, setObjects] = useState<Record<string, DknObjDetail>>({
    Field: {
      id: 'Field',
      nameCn: '字段',
      category: 'DATA',
      status: '启用',
      lifecycle: 'Draft',
      desc: '数据集中最小语义分析单元，用于字段理解、映射建议和质量评估。',
      properties: [
        { id: '1', name: '字段ID', code: 'fieldId', dataType: 'String', semanticType: 'ID', isRequired: true, defaultValue: '-', desc: '字段唯一标识' },
        { id: '2', name: '字段名称', code: 'fieldName', dataType: 'String', semanticType: 'NAME', isRequired: true, defaultValue: '-', desc: '字段名称' },
        { id: '3', name: '物理类型', code: 'physicalType', dataType: 'String', semanticType: 'TYPE', isRequired: true, defaultValue: '-', desc: '原始数据类型' },
        { id: '4', name: '语义类型', code: 'semanticType', dataType: 'String', semanticType: 'DIMENSION', isRequired: false, defaultValue: '-', desc: '推荐语义类型' },
        { id: '5', name: '质量评分', code: 'qualityScore', dataType: 'Number', semanticType: 'SCORE', isRequired: false, defaultValue: '0', desc: '字段质量评分' }
      ],
      links: [
        'Dataset -> contains -> Field',
        'Field -> has_quality -> DataQuality',
        'Field -> mapped_to -> Mapping',
        'Task -> covers -> Field'
      ],
      actions: [
        'infer_field_semantics',
        'calculate_data_quality',
        'generate_mapping',
        'create_assertion'
      ],
      functions: [
        { name: 'field_semantic_classification', badge: 'In 4 / Out 1' },
         { name: 'quality_score_compute', badge: 'In 3 / Out 1' },
         { name: 'mapping_confidence_compute', badge: 'In 4 / Out 1' }
      ],
      workflows: [
        { name: 'semantic_governance_workflow', badge: '8 steps' },
        { name: 'mapping_validation_workflow', badge: '5 steps' }
      ]
    },
    DataSource: {
      id: 'DataSource',
      nameCn: '数据源',
      category: 'PHYSICAL',
      status: '启用',
      lifecycle: 'Draft',
      desc: '物理存储/数仓源链接实体，定义数据库驱动、网络路由、用户凭证及表采集深度策略。',
      properties: [
        { id: '1', name: '数据源ID', code: 'sourceId', dataType: 'String', semanticType: 'ID', isRequired: true, defaultValue: '-', desc: '数据源全局唯一序列号' },
        { id: '2', name: '连接名称', code: 'sourceName', dataType: 'String', semanticType: 'NAME', isRequired: true, defaultValue: '-', desc: '物理元链接展示名' },
        { id: '3', name: '后端类型', code: 'dbType', dataType: 'String', semanticType: 'TYPE', isRequired: true, defaultValue: 'PostgreSQL', desc: '数据库物理引擎类型' }
      ],
      links: [
        'DataSource -> aggregates -> Dataset',
        'Rule -> restricts -> DataSource'
      ],
      actions: [
        'scan_data_source',
        'test_connection',
        'collect_metadata'
      ],
      functions: [
        { name: 'source_loadance_compute', badge: 'In 2 / Out 1' },
        { name: 'route_latency_eval', badge: 'In 3 / Out 2' }
      ],
      workflows: [
        { name: 'datasource_polling_workflow', badge: '12 steps' }
      ]
    },
    Dataset: {
      id: 'Dataset',
      nameCn: '数据集',
      category: 'PHYSICAL',
      status: '启用',
      lifecycle: 'Draft',
      desc: '登记在本体系统内的底层物理数据库表或大宽表、多维视图模型，是字段绑定的上一级容器。',
      properties: [
        { id: '1', name: '数据集ID', code: 'datasetId', dataType: 'String', semanticType: 'ID', isRequired: true, defaultValue: '-', desc: '数据集全局统一标识' },
        { id: '2', name: '业务中文名', code: 'displayName', dataType: 'String', semanticType: 'NAME', isRequired: true, defaultValue: '-', desc: '物理表的汉语规范名' }
      ],
      links: [
        'DataSource -> aggregates -> Dataset',
        'Dataset -> contains -> Field'
      ],
      actions: [
        'analyze_dataset',
        'trigger_data_profiling',
        'refresh_statistics'
      ],
      functions: [
        { name: 'dataset_volume_prediction', badge: 'In 4 / Out 1' }
      ],
      workflows: [
        { name: 'dataset_profiling_workflow', badge: '6 steps' }
      ]
    },
    DataQuality: {
      id: 'DataQuality',
      nameCn: '数据质量',
      category: 'GOVERNANCE',
      status: '启用',
      lifecycle: 'Draft',
      desc: '记录单次质量核验批跑的质检快照评分、故障条数、通过率阈值和总体一致性表现。',
      properties: [
        { id: '1', name: '质检批次ID', code: 'qualityBatchId', dataType: 'String', semanticType: 'ID', isRequired: true, defaultValue: '-', desc: '批跑事件唯一样本标识' },
        { id: '2', name: '合格度分数', code: 'score', dataType: 'Number', semanticType: 'SCORE', isRequired: true, defaultValue: '100', desc: '质量综合算法加权分数值' }
      ],
      links: [
        'Field -> has_quality -> DataQuality',
        'DataQuality -> triggers -> Task'
      ],
      actions: [
        'run_quality_validation',
        'recompute_quality_index'
      ],
      functions: [
        { name: 'weighted_quality_score_calc', badge: 'In 5 / Out 1' }
      ],
      workflows: [
        { name: 'quality_alert_dispatch', badge: '4 steps' }
      ]
    },
    Rule: {
      id: 'Rule',
      nameCn: '数据规则',
      category: 'GOVERNANCE',
      status: '禁用',
      lifecycle: 'Draft',
      desc: '统一主数据语义判断准则，支持各种探针定义字段的区间校验度、空值检验规范及对标逻辑。',
      properties: [
        { id: '1', name: '规则唯一标识', code: 'ruleId', dataType: 'String', semanticType: 'ID', isRequired: true, defaultValue: '-', desc: '语义判断规则ID' },
        { id: '2', name: '规则中文简述', code: 'ruleName', dataType: 'String', semanticType: 'NAME', isRequired: true, defaultValue: '-', desc: '规则名称' }
      ],
      links: [
        'Field -> governed_by -> Rule',
        'Rule -> restricts -> DataSource'
      ],
      actions: [
        'create_rule_template',
        'evaluate_rule_accuracy'
      ],
      functions: [
        { name: 'rule_expression_parser', badge: 'In 3 / Out 1' }
      ],
      workflows: [
        { name: 'rule_enforcement_workflow', badge: '8 steps' }
      ]
    },
    Mapping: {
      id: 'Mapping',
      nameCn: '映射建议',
      category: 'SEMANTIC',
      status: '启用',
      lifecycle: 'Draft',
      desc: '表示主数据在分布式环境或异构系统间的标准属性映射、对齐桥梁和字段置信推荐值。',
      properties: [
        { id: '1', name: '映射ID', code: 'mappingId', dataType: 'String', semanticType: 'ID', isRequired: true, defaultValue: '-', desc: '两端属性对齐映射唯一ID' },
        { id: '2', name: '置信度系数', code: 'confidence', dataType: 'Number', semanticType: 'PERCENT', isRequired: false, defaultValue: '1.0', desc: '多源NLP推算相关性概率' }
      ],
      links: [
        'Field -> mapped_to -> Mapping',
        'Mapping -> supported_by -> Evidence'
      ],
      actions: [
        'generate_mapping',
        'accept_recommendations'
      ],
      functions: [
        { name: 'mapping_confidence_compute', badge: 'In 4 / Out 1' }
      ],
      workflows: [
        { name: 'mapping_recommendation_flow', badge: '5 steps' }
      ]
    },
    Assertion: {
      id: 'Assertion',
      nameCn: '语义断言',
      category: 'SEMANTIC',
      status: '启用',
      lifecycle: 'Draft',
      desc: '利用主数据声明图层关系真实性证据，结合大模型推理进行模型合理性的主动校验结论发布。',
      properties: [
        { id: '1', name: '断言编号', code: 'assertionId', dataType: 'String', semanticType: 'ID', isRequired: true, defaultValue: '-', desc: '断言对标证据句柄ID' }
      ],
      links: [
        'Assertion -> validates -> Mapping'
      ],
      actions: [
        'create_assertion'
      ],
      functions: [
        { name: 'logic_consistency_evaluator', badge: 'In 2 / Out 1' }
      ],
      workflows: [
        { name: 'assertion_audit_flow', badge: '3 steps' }
      ]
    },
    Evidence: {
      id: 'Evidence',
      nameCn: '证据事实',
      category: 'SEMANTIC',
      status: '禁用',
      lifecycle: 'Draft',
      desc: '血缘链路关系或数据相似性的实体比对。探查匹配的硬性物证，辅助专家评估推断置信度。',
      properties: [
        { id: '1', name: '事实ID', code: 'evidenceId', dataType: 'String', semanticType: 'ID', isRequired: true, defaultValue: '-', desc: '物证据事实UUID' }
      ],
      links: [
        'Mapping -> supported_by -> Evidence'
      ],
      actions: [
        'capture_provenance_evidence'
      ],
      functions: [
        { name: 'evidence_weight_calculation', badge: 'In 3 / Out 1' }
      ],
      workflows: [
        { name: 'evidence_collection_workflow', badge: '4 steps' }
      ]
    },
    Task: {
      id: 'Task',
      nameCn: '治理任务',
      category: 'GOVERNANCE',
      status: '启用',
      lifecycle: 'Draft',
      desc: '对应质量问题闭环治理工单实体，通过工作流分派至承接专家或开发人员追踪解决异常。',
      properties: [
        { id: '1', name: '任务ID', code: 'taskId', dataType: 'String', semanticType: 'ID', isRequired: true, defaultValue: '-', desc: '问题治理追踪工单UUID' },
        { id: '2', name: '责任承接人', code: 'assignee', dataType: 'String', semanticType: 'USER', isRequired: false, defaultValue: 'admin', desc: '负责治理、修正的涉事责任账号' }
      ],
      links: [
        'Task -> covers -> Field',
        'DataQuality -> triggers -> Task'
      ],
      actions: [
        'create_task',
        'reassign_owner',
        'close_governed_issue'
      ],
      functions: [
        { name: 'sla_timeout_eval', badge: 'In 3 / Out 1' }
      ],
      workflows: [
        { name: 'task_escalation_flow', badge: '6 steps' }
      ]
    }
  });

  // Current selected object detail
  const activeObj = objects[selectedObjectId] || objects.Field;

  // AI Suggestions list
  const [aiSuggestions, setAiSuggestions] = useState([
    { id: 's1', text: '建议为 Field 增加与 Rule 的 governed_by 关系', isAdopted: false, targetType: 'relation', payload: 'Field -> governed_by -> Rule' },
    { id: 's2', text: '建议补充 semanticRole 属性', isAdopted: false, targetType: 'attribute', payload: { name: '语义角色', code: 'semanticRole', dataType: 'String', semanticType: 'ROLE', desc: '该字段自动识别推断出来的应用业务语义标签角色分类' } },
    { id: 's3', text: '建议绑定 validate_mapping 动作', isAdopted: false, targetType: 'action', payload: { name: 'validate_mapping', risk: '中风险' } },
    { id: 's4', text: '建议生成字段语义治理标准流程', isAdopted: false, targetType: 'workflow', payload: { name: 'field_semantic_standards_flow', badge: '10 steps' } }
  ]);

  // Handle adopting AI recommendation
  const handleAdoptSuggestion = (id: string) => {
    const sug = aiSuggestions.find(s => s.id === id);
    if (!sug) return;
    
    if (sug.targetType === 'attribute') {
      const payload = sug.payload as any;
      const updatedProps = [...activeObj.properties];
      if (!updatedProps.some(p => p.code === payload.code)) {
        updatedProps.push({
          id: Date.now().toString(),
          name: payload.name,
          code: payload.code,
          dataType: payload.dataType,
          semanticType: payload.semanticType,
          isRequired: false,
          defaultValue: '-',
          desc: payload.desc
        });
        setObjects({
          ...objects,
          [activeObj.id]: {
            ...activeObj,
            properties: updatedProps
          }
        });
      }
    } else if (sug.targetType === 'relation') {
      const updatedLinks = [...activeObj.links];
      const relStr = sug.payload as string;
      if (!updatedLinks.includes(relStr)) {
        updatedLinks.push(relStr);
        setObjects({
          ...objects,
          [activeObj.id]: {
            ...activeObj,
            links: updatedLinks
          }
        });
      }
    } else if (sug.targetType === 'action') {
      const payload = sug.payload as any;
      const updatedActs = [...activeObj.actions];
      if (!updatedActs.includes(payload.name)) {
        updatedActs.push(payload.name);
        setObjects({
          ...objects,
          [activeObj.id]: {
            ...activeObj,
            actions: updatedActs
          }
        });
      }
    } else if (sug.targetType === 'workflow') {
      const payload = sug.payload as any;
      const updatedFlows = [...activeObj.workflows];
      if (!updatedFlows.some(f => f.name === payload.name)) {
        updatedFlows.push(payload);
        setObjects({
          ...objects,
          [activeObj.id]: {
            ...activeObj,
            workflows: updatedFlows
          }
        });
      }
    }

    setAiSuggestions(aiSuggestions.map(s => s.id === id ? { ...s, isAdopted: true } : s));
    showToast(`采纳成功！已完成 [${sug.targetType}] 的绑定与并入。`, 'success');
  };

  const handleAdoptAllSuggestions = () => {
    let count = 0;
    aiSuggestions.forEach(s => {
      if (!s.isAdopted) {
        handleAdoptSuggestion(s.id);
        count++;
      }
    });
    if (count > 0) {
      showToast(`✨ 一键智能采纳并应用了 ${count} 条语义本体配置建议！`, 'success');
    } else {
      showToast('AI 意见均已在当前版本中完全采纳。', 'info');
    }
  };

  // Add custom property logic
  const handleAddProperty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPropName || !newPropCode) {
      alert('请输入属性名称和属性编码！');
      return;
    }

    if (activeObj.properties.some(p => p.code.toLowerCase() === newPropCode.toLowerCase().trim())) {
      showToast(`❌ 属性编码 "${newPropCode}" 已存在！`, 'warn');
      return;
    }

    const newAttr: DknAttr = {
      id: Date.now().toString(),
      name: newPropName,
      code: newPropCode,
      dataType: newPropType,
      semanticType: newPropSemantic || 'PRIMITIVE',
      isRequired: newPropRequired,
      defaultValue: newPropDefault,
      desc: newPropDesc || '新建属性字段说明描述'
    };

    setObjects({
      ...objects,
      [activeObj.id]: {
        ...activeObj,
        properties: [...activeObj.properties, newAttr]
      }
    });

    // Reset Form
    setNewPropName('');
    setNewPropCode('');
    setNewPropSemantic('');
    setNewPropRequired(false);
    setNewPropDefault('-');
    setNewPropDesc('');
    setIsAddPropOpen(false);

    showToast(`🎉 成功为 "${activeObj.nameCn}" 增加物理属性 [${newPropName}]！`, 'success');
  };

  // Quick Relationship Addition
  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkSource || !newLinkVerb || !newLinkTarget) {
      alert('请将关系主体、关系动词和客体填写完整！');
      return;
    }
    const relStr = `${newLinkSource} -> ${newLinkVerb} -> ${newLinkTarget}`;
    const updatedLinks = [...activeObj.links];
    if (!updatedLinks.includes(relStr)) {
      updatedLinks.push(relStr);
      setObjects({
        ...objects,
        [activeObj.id]: {
          ...activeObj,
          links: updatedLinks
        }
      });
      showToast(`🔗 成功关联新语义关系：${relStr}`, 'success');
    } else {
      showToast(`关联已经存在。`, 'warn');
    }
    setNewLinkSource('');
    setNewLinkVerb('');
    setNewLinkTarget('');
    setIsAddLinkOpen(false);
  };

  // Quick Action Type adding
  const handleAddAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionName) return;
    const updatedActs = [...activeObj.actions];
    if (!updatedActs.includes(newActionName)) {
      updatedActs.push(newActionName);
      setObjects({
        ...objects,
        [activeObj.id]: {
          ...activeObj,
          actions: updatedActs
        }
      });
      showToast(`⚡ 成功加载新动作治理类型：${newActionName}`, 'success');
    }
    setNewActionName('');
    setIsAddActionOpen(false);
  };

  // Quick Function adding
  const handleAddFunc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFuncName) return;
    const updatedFuncs = [...activeObj.functions];
    if (!updatedFuncs.some(f => f.name === newFuncName)) {
      updatedFuncs.push({ name: newFuncName, badge: newFuncIo });
      setObjects({
        ...objects,
        [activeObj.id]: {
          ...activeObj,
          functions: updatedFuncs
        }
      });
      showToast(`⚙️ 已成功建立底层函数绑定关系: ${newFuncName}`, 'success');
    }
    setNewFuncName('');
    setIsAddFuncOpen(false);
  };

  // Filter list of sidebar objects
  const sidebarList = (Object.values(objects) as DknObjDetail[]).filter(obj => 
    obj.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    obj.nameCn.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getObjectCount = (id: string): number => {
    const counts: Record<string, number> = {
      DataSource: 8,
      Dataset: 12,
      Field: 24,
      DataQuality: 6,
      Rule: 3,
      Mapping: 7,
      Assertion: 5,
      Evidence: 4,
      Task: 9
    };
    return counts[id] || 0;
  };

  // Colors match corresponding status state in DKN
  const getObjectIconColorClass = (id: string) => {
    switch (id) {
      case 'DataSource': return 'text-sky-500 bg-sky-50 border-sky-100';
      case 'Dataset': return 'text-indigo-500 bg-indigo-50 border-indigo-100';
      case 'Field': return 'text-blue-500 bg-blue-50 border-blue-100';
      case 'DataQuality': return 'text-emerald-500 bg-emerald-50 border-emerald-100';
      case 'Rule': return 'text-slate-400 bg-slate-50 border-slate-200';
      case 'Mapping': return 'text-purple-500 bg-purple-50 border-purple-100';
      case 'Assertion': return 'text-violet-500 bg-violet-50 border-violet-100';
      case 'Evidence': return 'text-slate-400 bg-slate-50 border-slate-200';
      case 'Task': return 'text-rose-500 bg-rose-50 border-rose-100';
      default: return 'text-blue-500 bg-blue-50 border-blue-100';
    }
  };

  if (isAddingObjectType) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none text-slate-800" id="dkn-ontology-wizard-stage">
        
        {/* 🔮 SLICK FLOATING TOASTS inside Wizard */}
        {toast && (
          <div className="fixed top-16 right-6 z-50 bg-slate-900 text-white rounded-md px-4 py-3 shadow-xl border border-slate-800 flex items-center gap-2.5 animate-fade-in text-[12.5px] font-semibold">
            <SparkleIcon className="w-4.5 h-4.5 text-amber-400 shrink-0" />
            <span>{toast.message}</span>
          </div>
        )}

        {/* ================= 1. SYSTEM NAVIGATION HEADER ================= */}
        <header className="bg-white border-b border-slate-200/80 h-14 shrink-0 flex items-center justify-between px-6 sticky top-0 z-40 shadow-xs">
          {/* Left Brand Container */}
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-650 flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
                S
              </div>
              <div>
                <span className="text-[13px] font-black text-slate-900 tracking-tight flex items-center gap-1 leading-none">
                  Semovix <span className="text-blue-600 font-extrabold text-[12px] bg-blue-50/80 px-1 rounded">DRKN Studio</span>
                </span>
                <p className="text-[8.5px] text-slate-400 font-extrabold uppercase mt-0.5">本体与行动治理研判台</p>
              </div>
            </div>

            <div className="h-4 w-px bg-slate-200"></div>

            {/* Main Top Nav tabs */}
            <nav className="flex items-center space-x-1">
              {[
                { label: '总览', view: 'overview_link' },
                { label: 'Ontology Studio', view: 'active', active: true },
                { label: '版本管理', view: 'change_release' },
                { label: '运行态网络', view: 'relation_model' }
              ].map((tab) => (
                <button
                  key={tab.label}
                  onClick={() => {
                    if (tab.view !== 'active') {
                      setIsAddingObjectType(false);
                      onNavigate(tab.view);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    tab.active 
                      ? 'text-blue-600 bg-blue-50/70 font-black' 
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Header Rightmost Actions */}
          <div className="flex items-center gap-2.5">
            <button 
              onClick={() => showToast('💾 成功保存当前的本体语义关系集草稿！对应 changeset 沙箱 ID: CS-2026-012')}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg flex items-center gap-1.5 transition-all shadow-3xs cursor-pointer"
            >
              <ClipboardList className="w-3.5 h-3.5 text-slate-400" />
              保存草稿
            </button>

            <button 
              onClick={() => {
                showToast('✅ 基础模型一致性预校验通过！无无效指向关系。', 'success');
              }}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg flex items-center gap-1.5 transition-all shadow-3xs cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              校验模型
            </button>

            <button 
              onClick={() => {
                setIsAddingObjectType(false);
                showToast('已取消本次新建对象，已返回本体建模工作台。', 'info');
              }}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg flex items-center gap-1 transition-all shadow-3xs cursor-pointer"
            >
              取消
            </button>

            <button 
              onClick={() => {
                // Instantly complete wizard
                if (!wizardObjCode || !wizardObjName) {
                  showToast('核心名称 or 编码不能为空！', 'warn');
                  return;
                }
                const newCodeCapitalized = wizardObjCode.charAt(0).toUpperCase() + wizardObjCode.slice(1);
                setObjects({
                  ...objects,
                  [newCodeCapitalized]: {
                    id: newCodeCapitalized,
                    nameCn: wizardObjName,
                    category: 'DATA',
                    status: wizardStatus,
                    lifecycle: 'Draft',
                    desc: wizardDesc,
                    properties: wizardProperties.length > 0 ? wizardProperties : [
                      { id: '1', name: '对象标识ID', code: `${wizardObjCode}Id`, dataType: 'String', semanticType: 'ID', isRequired: true, defaultValue: '-', desc: '全局唯一标识' }
                    ],
                    links: wizardLinks,
                    actions: wizardActions,
                    functions: wizardFunctions,
                    workflows: [{ name: 'semantic_governance_workflow', badge: '8 steps' }]
                  }
                });
                onSelectObject(newCodeCapitalized);
                setIsAddingObjectType(false);
                showToast(`🎉 成功在沙箱中新增并注入对象模型: ${wizardObjName} (${newCodeCapitalized})`, 'success');
              }}
              className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 transition-all shadow-sm shadow-blue-500/10 cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-white" />
              创建对象模型
            </button>

            <div className="h-5 w-px bg-slate-200 mx-1"></div>

            {/* Profile */}
            <div className="flex items-center gap-1.5 pl-1 cursor-pointer">
              <div className="h-7 w-7 rounded-full bg-blue-500 text-white font-extrabold text-xs flex items-center justify-center shadow-inner">
                A
              </div>
              <span className="text-xs font-bold text-slate-700">admin</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </div>
          </div>
        </header>

        {/* ================= 2. BREADCRUMBS ROW ================= */}
        <div className="bg-white border-b border-slate-200 py-2.5 px-8 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
            <span>Ontology Studio</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span>DRKN 模型</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span>销售域语义治理 DRKN</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span>对象模型</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-blue-600 font-bold">新增对象类型</span>
          </div>
          <div className="text-[10px] text-slate-400 font-bold bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
            SANDBOX: CS-2026-012
          </div>
        </div>

        {/* ================= 3. SYSTEM PAGE TITLE AREA ================= */}
        <div className="pt-6 px-10 pb-4 bg-[#f8fafc]">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            新增对象类型
            <span className="text-[10px] uppercase bg-blue-100 text-blue-800 font-extrabold px-1.5 py-0.5 rounded tracking-wide font-mono">
              Drafting wizard
            </span>
          </h1>
          <p className="text-[12px] text-slate-500 mt-1">
            按步骤定义对象的结构、关系、动作与函数，完成 DRKN 对象建模
          </p>
        </div>

        {/* ================= 4. MAIN WORKSPACE ROW split into Left, Center, Right ================= */}
        <div className="flex-1 px-8 pb-10 grid grid-cols-12 gap-6 items-stretch overflow-hidden bg-[#f8fafc]">
          
          {/* 4A. LEFT STEPPER BAR (cols: 2/12) */}
          <div className="col-span-12 lg:col-span-2.5 xl:col-span-2 pr-2 mt-2">
            <div className="bg-white border border-slate-200 rounded-md p-5 shadow-3xs flex flex-col justify-between h-full min-h-[460px]">
              <div className="space-y-6 relative">
                {/* Stepper Vertical Connector Line */}
                <div className="absolute left-[20px] top-[14px] bottom-6 h-[85%] w-0.5 bg-slate-100 z-0"></div>

                {[
                  { step: 1, title: '基础信息' },
                  { step: 2, title: '属性定义' },
                  { step: 3, title: '关系绑定' },
                  { step: 4, title: '动作绑定' },
                  { step: 5, title: '函数绑定' },
                  { step: 6, title: '校验与创建' }
                ].map((s) => {
                  const isCurrent = s.step === wizardActiveStep;
                  const isCompleted = s.step < wizardActiveStep;
                  const statusLabel = isCompleted ? '已完成' : isCurrent ? '进行中' : '待进行';
                  
                  return (
                    <div 
                      key={s.step} 
                      onClick={() => setWizardActiveStep(s.step)}
                      className="flex gap-4 cursor-pointer group relative z-10 items-center"
                    >
                      <div className="shrink-0 animate-none">
                        {isCompleted ? (
                          <div className="w-9 h-9 rounded-full bg-emerald-500 border border-emerald-500 flex items-center justify-center text-white text-[12px] font-black shadow-inner transition-all">
                            <Check className="w-4 h-4 text-white stroke-[3.5]" />
                          </div>
                        ) : isCurrent ? (
                          <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black shadow-md border-4 border-blue-100 transition-all scale-105">
                            {s.step}
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-slate-50 text-slate-400 hover:text-slate-700 border border-slate-200 flex items-center justify-center text-xs font-bold transition-all">
                            {s.step}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col justify-center min-w-[100px]">
                        <div className={`text-[12px] font-black leading-none flex items-center gap-1.5 ${isCurrent ? 'text-blue-700' : isCompleted ? 'text-slate-800' : 'text-slate-400 group-hover:text-slate-700'}`}>
                          <span>{s.step}</span>
                          <span>{s.title}</span>
                        </div>
                        <div className={`text-[9.5px] mt-1.5 leading-none font-bold ${isCurrent ? 'text-blue-600' : isCompleted ? 'text-slate-400' : 'text-slate-400'}`}>
                          {statusLabel}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Estimate Duration Block */}
              <div className="pt-4 border-t border-slate-100 flex items-center gap-2 text-[10px] text-slate-400 font-semibold px-1">
                <ClipboardList className="w-3.5 h-3.5 text-slate-300" />
                <span>预计 6-10 分钟完成</span>
              </div>
            </div>
          </div>

          {/* 4B. CENTER DYNAMIC FORM AREA (cols: 6.5/12) */}
          <div className="col-span-12 lg:col-span-6.5 xl:col-span-7 flex flex-col gap-4 mt-2 h-full overflow-y-auto pr-1">
            
            {/* Step Content Wrapper inside a single big card */}
            <div className={wizardActiveStep === 5 
              ? "flex-1 flex flex-col justify-between" 
              : "bg-white border border-slate-200 rounded-md p-6 shadow-sm flex-1 flex flex-col justify-between"
            }>
              <div>
                
                {/* Step Headline info removed to avoid duplication with left sidebar */}

                {/* STEP 1 RENDERING */}
                {wizardActiveStep === 1 && (
                  <div className="space-y-6 text-[12px]">
                    <div className="grid grid-cols-2 gap-5">
                      
                      {/* Left Form Column */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[11.5px] font-bold text-slate-700 mb-1.5">
                            <span className="text-red-500 font-black mr-0.5">*</span> 对象名称
                          </label>
                          <input 
                            type="text" 
                            value={wizardObjName} 
                            onChange={(e) => setWizardObjName(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-550 focus:bg-white text-[12px] font-semibold text-slate-800" 
                            placeholder="如: Field, Customer"
                          />
                        </div>

                        <div>
                          <label className="block text-[11.5px] font-bold text-slate-700 mb-1.5">
                            <span className="text-red-500 font-black mr-0.5">*</span> 对象编码
                          </label>
                          <input 
                            type="text" 
                            value={wizardObjCode} 
                            onChange={(e) => setWizardObjCode(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-550 focus:bg-white text-[12px] font-semibold text-slate-800" 
                            placeholder="如: field, customer"
                          />
                        </div>

                        <div>
                          <label className="block text-[11.5px] font-bold text-slate-700 mb-1.5">
                            <span className="text-red-500 font-black mr-0.5">*</span> 对象分类
                          </label>
                          <select 
                            value={wizardCategory}
                            onChange={(e) => setWizardCategory(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-550 focus:bg-white text-[12px] font-semibold text-slate-800"
                          >
                            <option value="数据对象">数据对象</option>
                            <option value="计算实例">计算实例</option>
                            <option value="行动连接器">行动连接器</option>
                            <option value="物理对象">物理对象</option>
                            <option value="治理标准">治理标准</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11.5px] font-bold text-slate-700 mb-1.5">
                            <span className="text-red-500 font-black mr-0.5">*</span> 对象状态
                          </label>
                          <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
                            <button 
                              type="button" 
                              onClick={() => setWizardStatus('启用')}
                              className={`py-1.5 text-center rounded-md font-bold text-xs transition-all cursor-pointer ${wizardStatus === '启用' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 bg-transparent'}`}
                            >
                              启用
                            </button>
                            <button 
                              type="button" 
                              onClick={() => setWizardStatus('停用')}
                              className={`py-1.5 text-center rounded-md font-bold text-xs transition-all cursor-pointer ${wizardStatus === '停用' ? 'bg-slate-300 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 bg-transparent'}`}
                            >
                              停用
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11.5px] font-bold text-slate-700 mb-1.5">
                            对象描述
                          </label>
                          <textarea 
                            value={wizardDesc}
                            onChange={(e) => setWizardDesc(e.target.value)}
                            rows={3}
                            maxLength={500}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-550 focus:bg-white text-[11.5px] leading-normal font-semibold text-slate-800"
                            placeholder="请描述该治理对象在销售域或全库分析中的语义、生命周期和分析目的..."
                          />
                          <div className="text-right text-[10px] text-slate-400 font-semibold mt-1">
                            {wizardDesc.length} / 500
                          </div>
                        </div>
                      </div>

                      {/* Right Form Column */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[11.5px] font-bold text-slate-700 mb-1.5">
                            <span className="text-red-500 font-black mr-0.5">*</span> 生命周期类型
                          </label>
                          <select 
                            value={wizardLifecycle}
                            onChange={(e) => setWizardLifecycle(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-550 focus:bg-white text-[12px] font-semibold text-slate-800"
                          >
                            <option value="标准生命周期">标准生命周期</option>
                            <option value="简版生命周期">简版生命周期</option>
                            <option value="持久层归档生命周期">持久层归档生命周期</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11.5px] font-bold text-slate-700 mb-1.5">
                            <span className="text-red-500 font-black mr-0.5">*</span> 主标识属性
                          </label>
                          <select
                            value={wizardPrimaryId}
                            onChange={(e) => setWizardPrimaryId(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-550 focus:bg-white text-[12px] font-semibold text-slate-800"
                          >
                            <option value="fieldId">fieldId (推荐首选项)</option>
                            <option value="fieldName">fieldName</option>
                            <option value="uuid">uuid (元数据通用ID)</option>
                            <option value="customId">人工建立主标识编码</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11.5px] font-bold text-slate-700 mb-1.5">
                            <span className="text-red-500 font-black mr-0.5">*</span> 来源方式
                          </label>
                          <div className="flex gap-2">
                            {[
                              { label: '表结构映射', mode: '表结构映射' },
                              { label: 'AI推断', mode: 'AI推断' },
                              { label: '人工定义', mode: '人工定义' }
                            ].map((tab) => {
                              const isChecked = wizardSourceType === tab.mode;
                              return (
                                <button
                                  type="button"
                                  key={tab.mode}
                                  onClick={() => setWizardSourceType(tab.mode)}
                                  className={`flex-1 py-1.5 px-0.5 text-center font-bold text-[11.5px] rounded-lg transition-all border flex items-center justify-center gap-1 bg-white cursor-pointer ${
                                    isChecked 
                                      ? 'border-blue-600 text-blue-755 ring-2 ring-blue-50 shadow-sm font-black' 
                                      : 'border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                                  }`}
                                >
                                  {isChecked && <Check className="w-3.5 h-3.5 text-blue-600 stroke-[3]" />}
                                  {tab.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Interactive Toggle switches */}
                        <div className="space-y-4 pt-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-700 text-[11.5px]">允许被其它对象引用</span>
                              <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" title="开启后，其他高层或同层本体如DataAsset等可配置为此对象的所属节点" />
                            </div>
                            <button
                              type="button"
                              onClick={() => setWizardAllowRef(!wizardAllowRef)}
                              className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${wizardAllowRef ? 'bg-blue-600' : 'bg-slate-200'}`}
                            >
                              <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${wizardAllowRef ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-700 text-[11.5px]">允许挂载动作</span>
                              <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" title="开启后，此对象可作为 infer_field_semantics 等原子治理动作的输入端客体" />
                            </div>
                            <button
                              type="button"
                              onClick={() => setWizardAllowAction(!wizardAllowAction)}
                              className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${wizardAllowAction ? 'bg-blue-600' : 'bg-slate-200'}`}
                            >
                              <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${wizardAllowAction ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-700 text-[11.5px]">允许挂载函数</span>
                              <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" title="是否支持在其字段变更和一致性核对流程中挂载底层映射计算或分析函数" />
                            </div>
                            <button
                              type="button"
                              onClick={() => setWizardAllowFunc(!wizardAllowFunc)}
                              className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${wizardAllowFunc ? 'bg-blue-600' : 'bg-slate-200'}`}
                            >
                              <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${wizardAllowFunc ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>

                  </div>
                )}

                {/* STEP 2 RENDERING */}
                {wizardActiveStep === 2 && (
                  <div className="space-y-4 text-[12px]">
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between pb-1 gap-3">
                      <div>
                        <div className="text-[11px] text-blue-600 font-bold uppercase tracking-wider">Step 2 / 属性定义</div>
                        <h2 className="text-[13px] font-black text-slate-800 mt-0.5">
                          定义对象的属性字段、语义类型、默认值与来源映射。
                        </h2>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {/* 搜索属性 query input */}
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                          <input 
                            type="text"
                            placeholder="搜索属性"
                            value={propSearchTerm}
                            onChange={(e) => setPropSearchTerm(e.target.value)}
                            className="bg-white border border-slate-200 text-slate-700 placeholder-slate-400 text-xs pl-8 pr-3 py-1.5 rounded-lg w-32 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium" 
                          />
                        </div>

                        {/* White action buttons */}
                        <button 
                          type="button"
                          onClick={() => {
                            const idNum = Date.now();
                            const newProp: DknAttr = {
                              id: `wp_${idNum}`,
                              name: '新属性',
                              code: `new_prop_${idNum % 1000}`,
                              dataType: 'String',
                              semanticType: 'DIMENSION',
                              isRequired: false,
                              defaultValue: '-',
                              desc: '新增的字段属性描述信息。',
                              isSearchable: true,
                              sourcePath: 'source.new_field',
                              isNullable: true,
                              isPrimary: false,
                              sortPriority: 60,
                              mappingMode: '字段映射'
                            };
                            setWizardProperties([...wizardProperties, newProp]);
                            setSelectedPropCode(newProp.code);
                            showToast('➕ 已新增‘新属性’字段！可以在下方页面中配置详细属性值。', 'success');
                          }}
                          className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-blue-600 rounded-lg flex items-center gap-1 cursor-pointer shadow-3xs"
                        >
                          <Plus className="w-3.5 h-3.5 text-blue-650" />
                          新增属性
                        </button>

                        <button 
                          type="button"
                          onClick={() => {
                            handleAddPresets();
                          }}
                          className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg flex items-center gap-1 cursor-pointer shadow-3xs hover:text-blue-600"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          AI 推荐属性
                        </button>

                        <button 
                          type="button"
                          onClick={() => {
                            showToast('📂 已触发批量导入模板！支持导入 CSV, XLSX 格式及 SQL 结构表。', 'info');
                          }}
                          className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg flex items-center gap-1 cursor-pointer shadow-3xs hover:text-blue-600"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-400" />
                          批量导入
                        </button>
                      </div>
                    </div>

                    {/* Table of Properties */}
                    <div className="border border-slate-200 rounded-md overflow-hidden bg-white shadow-3xs">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold">
                            <th className="py-2.5 px-3 w-8 text-center"></th>
                            <th className="py-2.5 px-3">属性名称</th>
                            <th className="py-2.5 px-3">显示名称</th>
                            <th className="py-2.5 px-3">数据类型</th>
                            <th className="py-2.5 px-3">语义类型</th>
                            <th className="py-2.5 px-3">默认值</th>
                            <th className="py-2.5 px-3">来源映射</th>
                            <th className="py-2.5 px-3 text-center">是否必填</th>
                            <th className="py-2.5 px-3 text-center">是否搜索</th>
                            <th className="py-1.5 px-3 text-center w-16">操作</th>
                          </tr>
                        </thead>
                        <tbody>
                          {wizardProperties
                            .filter(p => !propSearchTerm || p.name.includes(propSearchTerm) || p.code.includes(propSearchTerm))
                            .map((prop) => {
                              const isSelected = selectedPropCode === prop.code;
                              return (
                                <tr 
                                  key={prop.id} 
                                  onClick={() => setSelectedPropCode(prop.code)}
                                  className={`border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 cursor-pointer transition-colors ${
                                    isSelected ? 'bg-blue-50/40 border-l-2 border-l-blue-600' : ''
                                  }`}
                                >
                                  <td className="py-2.5 px-1 text-center text-slate-300">
                                    <GripVertical className="w-3.5 h-3.5 mx-auto cursor-grab" />
                                  </td>
                                  <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{prop.code}</td>
                                  <td className="py-2.5 px-3 font-bold text-slate-700">{prop.name}</td>
                                  <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">{prop.dataType}</td>
                                  <td className="py-2.5 px-3">
                                    <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md border ${
                                      prop.semanticType === 'ID' ? 'bg-pink-50 text-pink-700 border-pink-100' :
                                      prop.semanticType === 'DIMENSION' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                      prop.semanticType === 'STATUS' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                      prop.semanticType === 'MEASURE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                      'bg-slate-50 text-slate-600 border-slate-100'
                                    }`}>
                                      {prop.semanticType}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 font-mono text-slate-500">{prop.defaultValue}</td>
                                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">{prop.sourcePath || '-'}</td>
                                  <td className="py-2.5 px-3 text-center">
                                    {prop.isRequired ? (
                                      <span className="text-emerald-600 font-bold text-xs bg-emerald-50 px-1.5 py-0.5 rounded">是</span>
                                    ) : (
                                      <span className="text-slate-400">否</span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 text-center">
                                    {prop.isSearchable ? (
                                      <span className="text-emerald-600 font-bold text-xs bg-emerald-50 px-1.5 py-0.5 rounded">是</span>
                                    ) : (
                                      <span className="text-slate-400">否</span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-center gap-1">
                                      <button 
                                        type="button"
                                        onClick={() => {
                                          setSelectedPropCode(prop.code);
                                          showToast(`正在编辑属性: ${prop.code}`, 'info');
                                        }}
                                        className="p-1 hover:text-blue-650 text-slate-400 transition-colors cursor-pointer"
                                        title="编辑属性"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button 
                                        type="button"
                                        onClick={() => {
                                          if (wizardProperties.length <= 1) {
                                            showToast('⚠️ 对象模型必须包含至少一个属性识别字段！', 'warn');
                                            return;
                                          }
                                          setWizardProperties(prev => prev.filter(p => p.id !== prop.id));
                                          showToast(`🗑️ 已删除属性字段: ${prop.code}`, 'info');
                                        }}
                                        className="p-1 hover:text-red-650 text-slate-400 transition-colors cursor-pointer"
                                        title="删除属性"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>

                    {/* Edit Selected Property Form Panel */}
                    {(() => {
                      const activeProp = wizardProperties.find(p => p.code === selectedPropCode) || wizardProperties[0];
                      if (!activeProp) return null;

                      const handlePropUpdate = (fields: Partial<DknAttr>) => {
                        setWizardProperties(prev => prev.map(p => {
                          if (p.code === selectedPropCode) {
                            return { ...p, ...fields };
                          }
                          return p;
                        }));
                      };

                      return (
                        <div className="bg-slate-50/30 border border-slate-200 rounded-md p-4.5 space-y-4">
                          
                          {/* Header of editing panel */}
                          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                            <span className="font-extrabold text-[12.5px] text-slate-800 flex items-center gap-1.5">
                              <span className="w-1.5 h-3 bg-blue-600 rounded"></span>
                              编辑属性: <span className="font-mono text-blue-650 font-black">{activeProp.code}</span>
                            </span>
                            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                              <button 
                                type="button"
                                onClick={() => setIsJsonViewMode(false)}
                                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                                  !isJsonViewMode 
                                    ? 'bg-white shadow-3xs text-blue-600 font-extrabold' 
                                    : 'text-slate-500 hover:text-slate-800'
                                }`}
                              >
                                表单编辑
                              </button>
                              <button 
                                type="button"
                                onClick={() => setIsJsonViewMode(true)}
                                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                                  isJsonViewMode 
                                    ? 'bg-white shadow-3xs text-blue-600 font-extrabold' 
                                    : 'text-slate-500 hover:text-slate-800'
                                }`}
                              >
                                JSON 预览
                              </button>
                            </div>
                          </div>

                          {isJsonViewMode ? (
                            <div className="p-3 bg-slate-900 rounded-lg font-mono text-[11px] text-emerald-450 overflow-x-auto border border-slate-950 shadow-inner">
                              <pre>{JSON.stringify(activeProp, null, 2)}</pre>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 px-0.5">
                              {/* Left column */}
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                    属性名称 <span className="text-red-500 font-black">*</span>
                                  </label>
                                  <input 
                                    type="text" 
                                    value={activeProp.code}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      handlePropUpdate({ code: val });
                                      setSelectedPropCode(val);
                                    }}
                                    className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 hover:border-slate-300 bg-white font-mono text-blue-650 font-bold"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                    显示名称 <span className="text-red-500 font-black">*</span>
                                  </label>
                                  <input 
                                    type="text" 
                                    value={activeProp.name}
                                    onChange={(e) => handlePropUpdate({ name: e.target.value })}
                                    className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 hover:border-slate-300 bg-white font-bold text-slate-700"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                    语义类型 <span className="text-red-500 font-black">*</span>
                                  </label>
                                  <select 
                                    value={activeProp.semanticType}
                                    onChange={(e) => handlePropUpdate({ semanticType: e.target.value })}
                                    className="w-full rounded-lg border border-slate-200 px-2 py-1.5 focus:outline-none hover:border-slate-300 bg-white font-semibold text-slate-700"
                                  >
                                    <option value="ID">ID</option>
                                    <option value="DIMENSION">DIMENSION</option>
                                    <option value="STATUS">STATUS</option>
                                    <option value="MEASURE">MEASURE</option>
                                    <option value="TEXT">TEXT</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold text-slate-600 mb-1">单位</label>
                                  <input 
                                    type="text" 
                                    value={activeProp.unit || ''}
                                    onChange={(e) => handlePropUpdate({ unit: e.target.value })}
                                    className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 hover:border-slate-300 bg-white text-slate-700"
                                    placeholder="如: 分, 个, 级, %"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold text-slate-600 mb-1">取值范围</label>
                                  <input 
                                    type="text" 
                                    value={activeProp.range || ''}
                                    onChange={(e) => handlePropUpdate({ range: e.target.value })}
                                    className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 hover:border-slate-300 bg-white text-slate-700 font-mono"
                                    placeholder="如: 0 ~ 100"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold text-slate-600 mb-1">属性描述</label>
                                  <textarea 
                                    rows={2}
                                    value={activeProp.desc || ''}
                                    onChange={(e) => handlePropUpdate({ desc: e.target.value })}
                                    className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 hover:border-slate-300 bg-white text-[11.5px] leading-normal text-slate-600 font-medium"
                                    placeholder="请输入关于此字段详细的语义学描述与质检边界规则..."
                                  />
                                </div>
                              </div>

                              {/* Right column */}
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                    数据类型 <span className="text-red-500 font-black">*</span>
                                  </label>
                                  <select 
                                    value={activeProp.dataType}
                                    onChange={(e) => handlePropUpdate({ dataType: e.target.value })}
                                    className="w-full rounded-lg border border-slate-200 px-2 py-1.5 focus:outline-none hover:border-slate-300 bg-white font-mono text-[11.5px] text-slate-700"
                                  >
                                    <option value="String">String</option>
                                    <option value="Decimal (18,2)">Decimal (18,2)</option>
                                    <option value="Decimal">Decimal</option>
                                    <option value="Integer">Integer</option>
                                    <option value="Boolean">Boolean</option>
                                    <option value="DateTime">DateTime</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold text-slate-600 mb-1">默认值</label>
                                  <input 
                                    type="text" 
                                    value={activeProp.defaultValue}
                                    onChange={(e) => handlePropUpdate({ defaultValue: e.target.value })}
                                    className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 hover:border-slate-300 bg-white text-slate-700 font-mono"
                                  />
                                </div>

                                {/* Modern Radio grids */}
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 pt-1 bg-slate-100/50 p-2.5 border border-slate-200 rounded-lg">
                                  <div>
                                    <span className="block text-[10px] font-black text-slate-500 mb-1">是否必填</span>
                                    <div className="flex gap-4">
                                      <label className="flex items-center gap-1.5 font-bold text-slate-700 cursor-pointer">
                                        <input 
                                          type="radio" 
                                          name="isRequiredOption"
                                          checked={activeProp.isRequired === true}
                                          onChange={() => handlePropUpdate({ isRequired: true })}
                                          className="text-blue-600 focus:ring-0 cursor-pointer w-3.5 h-3.5"
                                        />
                                        <span>是</span>
                                      </label>
                                      <label className="flex items-center gap-1.5 font-bold text-slate-600 cursor-pointer">
                                        <input 
                                          type="radio" 
                                          name="isRequiredOption"
                                          checked={activeProp.isRequired === false}
                                          onChange={() => handlePropUpdate({ isRequired: false })}
                                          className="text-blue-600 focus:ring-0 cursor-pointer w-3.5 h-3.5"
                                        />
                                        <span>否</span>
                                      </label>
                                    </div>
                                  </div>

                                  <div>
                                    <span className="block text-[10px] font-black text-slate-500 mb-1">是否允许为空</span>
                                    <div className="flex gap-4">
                                      <label className="flex items-center gap-1.5 font-bold text-slate-700 cursor-pointer">
                                        <input 
                                          type="radio" 
                                          name="isNullableOption"
                                          checked={activeProp.isNullable === true}
                                          onChange={() => handlePropUpdate({ isNullable: true })}
                                          className="text-blue-600 focus:ring-0 cursor-pointer w-3.5 h-3.5"
                                        />
                                        <span>是</span>
                                      </label>
                                      <label className="flex items-center gap-1.5 font-bold text-slate-600 cursor-pointer">
                                        <input 
                                          type="radio" 
                                          name="isNullableOption"
                                          checked={activeProp.isNullable === false}
                                          onChange={() => handlePropUpdate({ isNullable: false })}
                                          className="text-blue-600 focus:ring-0 cursor-pointer w-3.5 h-3.5"
                                        />
                                        <span>否</span>
                                      </label>
                                    </div>
                                  </div>

                                  <div>
                                    <span className="block text-[10px] font-black text-slate-500 mb-1">是否参与搜索</span>
                                    <div className="flex gap-4">
                                      <label className="flex items-center gap-1.5 font-bold text-slate-700 cursor-pointer">
                                        <input 
                                          type="radio" 
                                          name="isSearchableOption"
                                          checked={activeProp.isSearchable === true}
                                          onChange={() => handlePropUpdate({ isSearchable: true })}
                                          className="text-blue-600 focus:ring-0 cursor-pointer w-3.5 h-3.5"
                                        />
                                        <span>是</span>
                                      </label>
                                      <label className="flex items-center gap-1.5 font-bold text-slate-600 cursor-pointer">
                                        <input 
                                          type="radio" 
                                          name="isSearchableOption"
                                          checked={activeProp.isSearchable === false}
                                          onChange={() => handlePropUpdate({ isSearchable: false })}
                                          className="text-blue-600 focus:ring-0 cursor-pointer w-3.5 h-3.5"
                                        />
                                        <span>否</span>
                                      </label>
                                    </div>
                                  </div>

                                  <div>
                                    <span className="block text-[10px] font-black text-slate-500 mb-1">是否主标识</span>
                                    <div className="flex gap-4">
                                      <label className="flex items-center gap-1.5 font-bold text-slate-700 cursor-pointer">
                                        <input 
                                          type="radio" 
                                          name="isPrimaryOption"
                                          checked={activeProp.isPrimary === true}
                                          onChange={() => handlePropUpdate({ isPrimary: true })}
                                          className="text-blue-600 focus:ring-0 cursor-pointer w-3.5 h-3.5"
                                        />
                                        <span>是</span>
                                      </label>
                                      <label className="flex items-center gap-1.5 font-bold text-slate-600 cursor-pointer">
                                        <input 
                                          type="radio" 
                                          name="isPrimaryOption"
                                          checked={activeProp.isPrimary === false}
                                          onChange={() => handlePropUpdate({ isPrimary: false })}
                                          className="text-blue-600 focus:ring-0 cursor-pointer w-3.5 h-3.5"
                                        />
                                        <span>否</span>
                                      </label>
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-[11px] font-bold text-slate-600 mb-1">排序优先级</label>
                                    <input 
                                      type="number" 
                                      value={activeProp.sortPriority || 50}
                                      onChange={(e) => handlePropUpdate({ sortPriority: parseInt(e.target.value) || 50 })}
                                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 hover:border-slate-300 bg-white text-slate-700"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[11px] font-bold text-slate-600 mb-1">来源映射方式 <span className="text-red-500">*</span></label>
                                    <select 
                                      value={activeProp.mappingMode || '字段映射'}
                                      onChange={(e) => handlePropUpdate({ mappingMode: e.target.value })}
                                      className="w-full rounded-lg border border-slate-200 px-2 py-1.5 focus:outline-none hover:border-slate-300 bg-white font-medium text-slate-700"
                                    >
                                      <option value="字段映射">字段映射</option>
                                      <option value="聚合计算">聚合计算</option>
                                      <option value="API配置">API 映射</option>
                                    </select>
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold text-slate-600 mb-1">来源映射物理路径</label>
                                  <div className="relative">
                                    <input 
                                      type="text" 
                                      value={activeProp.sourcePath || ''}
                                      onChange={(e) => handlePropUpdate({ sourcePath: e.target.value })}
                                      className="w-full rounded-lg border border-slate-200 pl-2.5 pr-8 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 hover:border-slate-300 bg-white font-mono text-slate-700 text-[11.5px]"
                                      placeholder="如: source.field_code"
                                    />
                                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 cursor-pointer hover:text-slate-600" />
                                  </div>
                                </div>

                              </div>
                            </div>
                          )}

                        </div>
                      );
                    })()}

                    {/* RECOMMENDED PRESETS BADGES ROW */}
                    <div className="bg-slate-50/50 border border-slate-200 rounded-md p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-black text-slate-800 flex items-center gap-1">
                            <Sparkle className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                            属性预设推荐
                          </h4>
                          <span className="text-slate-300">|</span>
                          <span className="text-[10px] text-slate-400 font-bold font-sans">一键加入常用主表质检度量规范属性</span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => {
                            showToast('🔄 已重新换一批高可信质检验证建议指标！', 'success');
                          }}
                          className="text-[11px] text-blue-600 font-extrabold hover:text-blue-805 flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3 hover:rotate-180 transition-transform duration-500 text-blue-550" />
                          换一批
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2.5">
                        {[
                          { id: 'rec1', name: '数据质量等级', code: 'qualityLevel', dataType: 'String', semanticType: 'STATUS', isRequired: false, defaultValue: 'A', desc: '根据综合物理或语义质检断言核验得出的等级划分分值。', isSearchable: true, sourcePath: 'source.quality_level', unit: '级', range: 'A, B, C, D' },
                          { id: 'rec2', name: '质量检查时间', code: 'checkedAt', dataType: 'DateTime', semanticType: 'DIMENSION', isRequired: false, defaultValue: '-', desc: '上一次数据审计和一致性核查触发的物理执行时间。', isSearchable: false, sourcePath: 'source.checked_at' },
                          { id: 'rec3', name: '质量规则数', code: 'ruleCount', dataType: 'Integer', semanticType: 'MEASURE', isRequired: false, defaultValue: '0', desc: '作用在销售域以及目标物理结构底盘上的预警断言总数。', isSearchable: true, sourcePath: 'source.rule_count', unit: '个' },
                          { id: 'rec4', name: '异常记录数', code: 'errorCount', dataType: 'Integer', semanticType: 'MEASURE', isRequired: false, defaultValue: '0', desc: '脏数据与越界断言核验失败的记录绝对条数。', isSearchable: true, sourcePath: 'source.error_count', unit: '条' },
                          { id: 'rec5', name: '完整性得分', code: 'completenessScore', dataType: 'Decimal (18,2)', semanticType: 'MEASURE', isRequired: false, defaultValue: '100', desc: '表非空单元格、主键必填项目一致性在多副本间的对齐测度得分。', isSearchable: true, sourcePath: 'source.completeness_score', unit: '分' },
                          { id: 'rec6', name: '准确性得分', code: 'accuracyScore', dataType: 'Decimal (18,2)', semanticType: 'MEASURE', isRequired: false, defaultValue: '100', desc: '值正则与字典规则核对通过占比。', isSearchable: true, sourcePath: 'source.accuracy_score', unit: '分' },
                          { id: 'rec7', name: '一致性得分', code: 'consistencyScore', dataType: 'Decimal (18,2)', semanticType: 'MEASURE', isRequired: false, defaultValue: '100', desc: '多源系统对等主键对齐比度得分。', isSearchable: true, sourcePath: 'source.consistency_score', unit: '分' },
                          { id: 'rec8', name: '时效性得分', code: 'timelinessScore', dataType: 'Decimal (18,2)', semanticType: 'MEASURE', isRequired: false, defaultValue: '100', desc: '流入数据平均物理延迟值评分。', isSearchable: true, sourcePath: 'source.timeliness_score', unit: '分' }
                        ].map((rec) => {
                          const alreadyHas = wizardProperties.some(p => p.code === rec.code);
                          return (
                            <button
                              key={rec.id}
                              type="button"
                              onClick={() => {
                                if (alreadyHas) {
                                  showToast(`⚠️ 列表中已存在 ${rec.code} 属性！`, 'warn');
                                  return;
                                }
                                setWizardProperties([...wizardProperties, rec]);
                                setSelectedPropCode(rec.code);
                                showToast(`＋ 成功一键载入质检预设指标: ${rec.name} (${rec.code})`, 'success');
                              }}
                              className={`px-3 py-1.5 text-[11px] font-bold rounded-lg border transition-all ${
                                alreadyHas 
                                  ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' 
                                  : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50/50 shadow-3xs cursor-pointer'
                              }`}
                            >
                              + {rec.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                )}

                {/* STEP 3 RENDERING */}
                {wizardActiveStep === 3 && (
                  <div className="grid grid-cols-12 gap-5 text-[12px] animate-fade-in font-sans">
                    
                    {/* Left Column: holds Config Table, Preview Graph and Active Edit Form */}
                    <div className="col-span-12 xl:col-span-9 space-y-5">
                      
                      {/* Sub-grid of Config Table (3/5) & Preview Graph (2/5) */}
                      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                        
                        {/* 关系配置表 Card */}
                        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-md p-4 flex flex-col justify-between shadow-3xs min-h-[340px]">
                          <div>
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                              <span className="font-extrabold text-[13px] text-slate-800 flex items-center gap-1.5">
                                <span className="w-1.5 h-3.5 bg-blue-600 rounded"></span>
                                关系配置表
                              </span>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const idNum = Date.now();
                                    const newRel: DknRelation = {
                                      id: `r_${idNum}`,
                                      source: 'Field',
                                      relationType: 'new_relation',
                                      target: 'TargetNode',
                                      direction: '单向',
                                      cardinality: '1:1',
                                      creationMethod: 'manual',
                                      status: '草稿',
                                      desc: '请填入此新关系的物理或逻辑血缘机制等描述。',
                                      confidence: 100
                                    };
                                    setWizardRelations([...wizardRelations, newRel]);
                                    setSelectedRelationId(newRel.id);
                                    showToast('➕ 已生产草稿关系！请在下方面板中配置详细内容。', 'success');
                                  }}
                                  className="px-2.5 py-1.5 text-[11px] font-bold text-white bg-blue-605 hover:bg-blue-700 rounded-lg flex items-center gap-1 cursor-pointer shadow-3xs"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  新增关系
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    showToast('✨ AI 推荐：正在对当前 DKN 本体图谱进行全谱联通度推理...', 'info');
                                    setTimeout(() => {
                                      showToast('✓ AI 关系推荐已就绪, 请在右侧“AI 建模建议”面板中查看并采纳！', 'success');
                                    }, 800);
                                  }}
                                  className="px-2.5 py-1.5 text-[11px] font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-blue-600 rounded-lg flex items-center gap-1 cursor-pointer"
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                  AI 推荐关系
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    showToast('🔄 正在启动图谱完整依赖环核查...', 'info');
                                    setTimeout(() => {
                                      showToast('✓ 图谱验证通过：数据孤立度为 0%, 血缘回路闭环无冲突。', 'success');
                                    }, 1000);
                                  }}
                                  className="px-2.5 py-1.5 text-[11px] font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-blue-600 rounded-lg flex items-center gap-1 cursor-pointer"
                                >
                                  <Network className="w-3.5 h-3.5 text-slate-500" />
                                  图谱校验
                                </button>
                              </div>
                            </div>

                            {/* Filters row with Search bar */}
                            <div className="relative mb-3">
                              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                              <input 
                                type="text"
                                placeholder="搜索关系"
                                value={relationSearchTerm}
                                onChange={(e) => setRelationSearchTerm(e.target.value)}
                                className="bg-slate-50 border border-slate-200 text-slate-700 placeholder-slate-400 text-xs pl-8 pr-3 py-1.5 rounded-lg w-full focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium" 
                              />
                            </div>

                            {/* Relationship Items Table inside Left Card */}
                            <div className="border border-slate-200 rounded-lg overflow-hidden bg-white max-h-[190px] overflow-y-auto shadow-3xs">
                              <table className="w-full text-left text-[11px] border-collapse leading-normal">
                                <thead>
                                  <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-bold">
                                    <th className="py-2 px-2.5">来源对象</th>
                                    <th className="py-2 px-2.5">关系类型</th>
                                    <th className="py-2 px-2.5">目标对象</th>
                                    <th className="py-2 px-2.5">方向</th>
                                    <th className="py-2 px-2.5">基数</th>
                                    <th className="py-2 px-2.5">创建方式</th>
                                    <th className="py-2 px-2.5">状态</th>
                                    <th className="py-2 px-2.5 text-center">操作</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {wizardRelations
                                    .filter(r => !relationSearchTerm || r.source.toLowerCase().includes(relationSearchTerm.toLowerCase()) || r.target.toLowerCase().includes(relationSearchTerm.toLowerCase()) || r.relationType.toLowerCase().includes(relationSearchTerm.toLowerCase()))
                                    .map((relation) => {
                                      const isSelected = selectedRelationId === relation.id;
                                      return (
                                        <tr
                                          key={relation.id}
                                          onClick={() => setSelectedRelationId(relation.id)}
                                          className={`border-b border-slate-100 last:border-b-0 cursor-pointer hover:bg-slate-50/50 transition-all ${
                                            isSelected ? 'bg-blue-50/40 border-l-2 border-l-blue-600 font-bold' : ''
                                          }`}
                                        >
                                          <td className="py-2 px-2.5 font-bold text-slate-700">{relation.source}</td>
                                          <td className="py-2 px-2.5 font-mono text-blue-650 font-bold">{relation.relationType}</td>
                                          <td className="py-2 px-2.5 font-bold text-slate-700">{relation.target}</td>
                                          <td className="py-2 px-2.5 text-slate-500 text-[10.5px]">{relation.direction}</td>
                                          <td className="py-2 px-2.5 font-mono font-bold text-slate-600">{relation.cardinality || <span className="text-amber-500 font-black">未配置</span>}</td>
                                          <td className="py-2 px-2.5 text-slate-400 font-medium text-[10.5px]">{relation.creationMethod}</td>
                                          <td className="py-2 px-2.5">
                                            <span className="flex items-center gap-1 font-bold">
                                              <span className={`w-1.5 h-1.5 rounded-full ${relation.status === '已启用' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
                                              <span className={relation.status === '已启用' ? 'text-emerald-700' : 'text-amber-750'}>{relation.status}</span>
                                            </span>
                                          </td>
                                          <td className="py-2 px-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-center gap-1">
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setSelectedRelationId(relation.id);
                                                  showToast(`正在编辑关系: ${relation.source} -> ${relation.relationType}`, 'info');
                                                }}
                                                className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                                                title="编辑"
                                              >
                                                <Edit2 className="w-3.5 h-3.5" />
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setWizardRelations(prev => prev.filter(r => r.id !== relation.id));
                                                  showToast(`🗑️ 成功删除关系： ${relation.source} -> ${relation.relationType}`, 'info');
                                                }}
                                                className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                                                title="删除"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>

                        {/* 关系图谱预览 Card */}
                        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-md p-4 flex flex-col justify-between shadow-3xs min-h-[340px]">
                          <div>
                            <span className="font-extrabold text-[13px] text-slate-800 flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                              <span className="flex items-center gap-1.5">
                                <span className="w-1.5 h-3.5 bg-blue-600 rounded"></span>
                                关系图谱预览
                                <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-pointer" title="查看图依赖网络说明" />
                              </span>
                            </span>

                            {/* Graphic Canvas Layout */}
                            <div className="relative w-full h-[245px] bg-slate-50/40 rounded-md border border-slate-200 p-2 overflow-hidden select-none">
                              
                              {/* SVG Link lines between nodes */}
                              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                                <defs>
                                  <marker id="arrow-gray" viewBox="0 0 10 10" refX="21" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#cbd5e1" />
                                  </marker>
                                  <marker id="arrow-blue" viewBox="0 0 10 10" refX="21" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#3b82f6" />
                                  </marker>
                                </defs>

                                {/* Link 1: Dataset -> contains -> Field */}
                                <g>
                                  <line 
                                    x1="50%" y1="52" x2="50%" y2="108" 
                                    stroke={wizardRelations.some(r => r.relationType === 'contains') ? '#3b82f6' : '#cbd5e1'} 
                                    strokeWidth={selectedRelationId === 'r1' ? '2.5' : '1.5'} 
                                    markerEnd="url(#arrow-blue)"
                                  />
                                  <rect x="52%" y="71" width="55" height="18" rx="3" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
                                  <text x="53%" y="80" fontSize="8" fontWeight="bold" fill="#64748b" className="font-mono">contains</text>
                                  <text x="53%" y="87" fontSize="7" fontWeight="bold" fill="#94a3b8" className="font-mono">1:N</text>
                                </g>

                                {/* Link 2: Field -> mapped_to -> Mapping */}
                                <g>
                                  <line 
                                    x1="50%" y1="125" x2="22%" y2="125" 
                                    stroke={wizardRelations.some(r => r.relationType === 'mapped_to') ? '#3b82f6' : '#cbd5e1'} 
                                    strokeWidth={selectedRelationId === 'r2' ? '2.5' : '1.5'} 
                                    markerEnd="url(#arrow-blue)"
                                  />
                                  <rect x="25%" y="103" width="55" height="18" rx="3" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
                                  <text x="26%" y="112" fontSize="8" fontWeight="bold" fill="#64748b" className="font-mono">mapped_to</text>
                                  <text x="26%" y="119" fontSize="7" fontWeight="bold" fill="#94a3b8" className="font-mono">N:1</text>
                                </g>

                                {/* Link 3: Field -> has_quality -> DataQuality */}
                                <g>
                                  <line 
                                    x1="50%" y1="125" x2="78%" y2="125" 
                                    stroke={wizardRelations.some(r => r.relationType === 'has_quality' || r.relationType === 'affects') ? '#3b82f6' : '#cbd5e1'} 
                                    strokeWidth={selectedRelationId === 'r3' ? '2.5' : '1.5'} 
                                    markerEnd="url(#arrow-blue)"
                                  />
                                  <rect x="58%" y="103" width="55" height="18" rx="3" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
                                  <text x="59%" y="112" fontSize="8" fontWeight="bold" fill="#64748b" className="font-mono">has_quality</text>
                                  <text x="59%" y="119" fontSize="7" fontWeight="bold" fill="#94a3b8" className="font-mono">1:N</text>
                                </g>

                                {/* Link 4: Rule -> validated_by -> Field */}
                                {wizardRelations.some(r => r.source === 'Rule' || r.relationType === 'validated_by') && (
                                  <g>
                                    <line 
                                      x1="50%" y1="195" x2="50%" y2="140" 
                                      stroke="#3b82f6" 
                                      strokeWidth="1.5" 
                                      strokeDasharray="3,3"
                                      markerEnd="url(#arrow-blue)"
                                    />
                                    <rect x="52%" y="155" width="55" height="18" rx="3" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
                                    <text x="53%" y="164" fontSize="8" fontWeight="bold" fill="#64748b" className="font-mono">validated_by</text>
                                    <text x="53%" y="171" fontSize="7" fontWeight="bold" fill="#94a3b8" className="font-mono">N:1</text>
                                  </g>
                                )}
                              </svg>

                              {/* Nodes absolutely placed */}
                              {/* Central Node (Field) */}
                              <div className="absolute left-1/2 top-[125px] -translate-x-1/2 -translate-y-1/2 z-10">
                                <div className="border-[1.5px] border-blue-500 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg flex items-center gap-1 text-[11px] font-black shadow-sm ring-4 ring-blue-500/10">
                                  <Layers className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                  Field
                                </div>
                              </div>

                              {/* Top Node (Dataset) */}
                              <div className="absolute left-1/2 top-[35px] -translate-x-1/2 -translate-y-1/2 z-10">
                                <div className="border border-emerald-250 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-lg flex items-center gap-1 text-[10.5px] font-bold shadow-3xs">
                                  <Database className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  Dataset
                                </div>
                              </div>

                              {/* Left Node (Mapping) */}
                              <div className="absolute left-[13%] top-[125px] -translate-x-1/2 -translate-y-1/2 z-10">
                                <div className="border border-purple-250 bg-purple-50 text-purple-800 px-3 py-1 rounded-lg flex items-center gap-1 text-[10.5px] font-bold shadow-3xs">
                                  <Workflow className="w-3.5 h-3.5 text-purple-600 shrink-0 animate-none" />
                                  Mapping
                                </div>
                              </div>

                              {/* Right Node (DataQuality) */}
                              <div className="absolute left-[87%] top-[125px] -translate-x-1/2 -translate-y-1/2 z-10">
                                <div className="border border-amber-250 bg-amber-50 text-amber-805 px-3 py-1 rounded-lg flex items-center gap-1 text-[10.5px] font-bold shadow-3xs">
                                  <Shield className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                  DataQuality
                                </div>
                              </div>

                              {/* Bottom Node (Rule) */}
                              <div className="absolute left-1/2 top-[215px] -translate-x-1/2 -translate-y-1/2 z-10">
                                <div className={`border px-3 py-1 rounded-lg flex items-center gap-1 text-[10.5px] font-bold transition-all ${
                                  wizardRelations.some(r => r.source === 'Rule') 
                                    ? 'border-sky-300 bg-sky-50 text-sky-850 shadow-3xs ring-2 ring-sky-500/10' 
                                    : 'border-slate-200 bg-slate-100 text-slate-400 opacity-60'
                                }`}>
                                  <ClipboardList className={`w-3.5 h-3.5 shrink-0 ${wizardRelations.some(r => r.source === 'Rule') ? 'text-sky-600' : 'text-slate-400'}`} />
                                  Rule
                                </div>
                              </div>

                            </div>
                          </div>
                        </div>

                      </div>

                      {/* 编辑关系 Form Card */}
                      {(() => {
                        const activeRel = wizardRelations.find(r => r.id === selectedRelationId) || wizardRelations[0];
                        if (!activeRel) {
                          return (
                            <div className="bg-white border border-slate-200 rounded-md p-6 text-center text-slate-400 font-bold shadow-3xs">
                              📭 暂无选中的关系。请在配置表中点击任一行进行编辑。
                            </div>
                          );
                        }

                        const handleFormUpdate = (fields: Partial<DknRelation>) => {
                          setWizardRelations(prev => prev.map(r => {
                            if (r.id === activeRel.id) {
                              return { ...r, ...fields };
                            }
                            return r;
                          }));
                        };

                        return (
                          <div className="bg-white border border-slate-200 rounded-md p-5 space-y-4 shadow-3xs animate-fade-in">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                              <span className="font-extrabold text-[12.5px] text-slate-800 flex items-center gap-2">
                                <span className="w-1.5 h-3 bg-blue-600 rounded"></span>
                                编辑关系 ({activeRel.source} → <span className="font-mono text-blue-650 font-black">{activeRel.relationType}</span> → {activeRel.target})
                              </span>
                              <span className="text-[10px] font-extrabold uppercase bg-blue-50 border border-blue-200 text-blue-600 px-2 py-0.5 rounded-md font-mono">
                                ID: {activeRel.id}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 text-xs font-sans">
                              {/* Row 1 */}
                              <div>
                                <label className="block text-[11px] font-bold text-slate-550 mb-1 flex items-center gap-1">
                                  来源对象 <span className="text-red-500 font-extrabold">*</span>
                                </label>
                                <div className="relative">
                                  <input 
                                    type="text" 
                                    value={activeRel.source}
                                    disabled
                                    className="w-full rounded-lg border border-slate-202 bg-slate-50 text-slate-500 pl-3 pr-8 py-2 font-semibold focus:outline-none cursor-not-allowed"
                                  />
                                  <HelpCircle className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" title="主域核心映射来源，当前编辑步骤默认为宿主 Field 对象（或血缘反向链接源）" />
                                </div>
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-slate-550 mb-1">
                                  关系名称 <span className="text-red-500 font-extrabold">*</span>
                                </label>
                                <input 
                                  type="text" 
                                  value={activeRel.relationType}
                                  onChange={(e) => handleFormUpdate({ relationType: e.target.value })}
                                  className="w-full rounded-lg border border-slate-200 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white px-3 py-2 font-mono text-blue-650 font-black"
                                  placeholder="如: has_quality, contains"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-slate-550 mb-1 flex items-center justify-between">
                                  <span>目标对象 <span className="text-red-500 font-extrabold">*</span></span>
                                  {activeRel.target && (
                                    <button 
                                      type="button" 
                                      onClick={() => handleFormUpdate({ target: '' })}
                                      className="text-red-500 font-extrabold hover:text-red-700 text-[10px]"
                                    >
                                      清除
                                    </button>
                                  )}
                                </label>
                                <div className="relative">
                                  <input 
                                    type="text" 
                                    value={activeRel.target}
                                    onChange={(e) => handleFormUpdate({ target: e.target.value })}
                                    className="w-full rounded-lg border border-slate-200 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white px-3 pr-8 py-2 font-bold text-slate-700"
                                    placeholder="输入或选择目标类别，如: Mapping, DataQuality"
                                  />
                                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 cursor-pointer" />
                                </div>
                              </div>

                              {/* Row 2 */}
                              <div>
                                <label className="block text-[11px] font-bold text-slate-550 mb-1">
                                  方向 <span className="text-red-500 font-extrabold">*</span>
                                </label>
                                <div className="flex gap-6 py-2">
                                  <label className="flex items-center gap-1.5 font-bold text-slate-800 cursor-pointer">
                                    <input 
                                      type="radio" 
                                      name="relDirection"
                                      checked={activeRel.direction === '单向'}
                                      onChange={() => handleFormUpdate({ direction: '单向' })}
                                      className="text-blue-600 focus:ring-0 cursor-pointer w-4 h-4"
                                    />
                                    <span>单向</span>
                                  </label>
                                  <label className="flex items-center gap-1.5 font-bold text-slate-600 cursor-pointer">
                                    <input 
                                      type="radio" 
                                      name="relDirection"
                                      checked={activeRel.direction === '双向'}
                                      onChange={() => handleFormUpdate({ direction: '双向' })}
                                      className="text-blue-600 focus:ring-0 cursor-pointer w-4 h-4"
                                    />
                                    <span>双向</span>
                                  </label>
                                </div>
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-slate-550 mb-1">
                                  基数 <span className="text-red-500 font-extrabold">*</span>
                                </label>
                                <select 
                                  value={activeRel.cardinality || ''}
                                  onChange={(e) => handleFormUpdate({ cardinality: e.target.value })}
                                  className="w-full rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white px-3 py-2 font-mono font-bold text-slate-700 hover:border-slate-300"
                                >
                                  <option value="">-- 请选择基数 (必填) --</option>
                                  <option value="1:1">1:1</option>
                                  <option value="1:N">1:N</option>
                                  <option value="N:1">N:1</option>
                                  <option value="N:M">N:M</option>
                                </select>
                              </div>

                              <div className="md:row-span-2">
                                <label className="block text-[11px] font-bold text-slate-550 mb-1 flex items-center justify-between">
                                  <span>关系说明</span>
                                  <span className="text-[10px] text-slate-400 font-mono">{(activeRel.desc || '').length}/200</span>
                                </label>
                                <textarea 
                                  rows={4}
                                  value={activeRel.desc || ''}
                                  maxLength={200}
                                  onChange={(e) => handleFormUpdate({ desc: e.target.value })}
                                  className="w-full rounded-lg border border-slate-200 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white p-2.5 text-[11.5px] leading-normal font-medium text-slate-600 shadow-inner"
                                  placeholder="请输入关于此关系的图连通性及拓扑血缘业务规则描述..."
                                />
                              </div>

                              {/* Row 3 */}
                              <div>
                                <label className="block text-[11px] font-bold text-slate-550 mb-1">
                                  创建方式 <span className="text-red-500 font-extrabold">*</span>
                                </label>
                                <select 
                                  value={activeRel.creationMethod}
                                  onChange={(e) => handleFormUpdate({ creationMethod: e.target.value })}
                                  className="w-full rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white px-3 py-2 font-medium text-slate-700 cursor-pointer hover:border-slate-300"
                                >
                                  <option value="schema-based">schema-based</option>
                                  <option value="rule-based">rule-based</option>
                                  <option value="manual">manual</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-slate-550 mb-1 flex items-center gap-1">
                                  置信度
                                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" title="AI图推理置信评估分值，人工编辑后默认为100%" />
                                </label>
                                <div className="space-y-1.5 pt-1">
                                  <div className="flex items-center gap-3">
                                    <input 
                                      type="range" 
                                      min="0" 
                                      max="100" 
                                      value={activeRel.confidence !== undefined ? activeRel.confidence : 100}
                                      onChange={(e) => handleFormUpdate({ confidence: parseInt(e.target.value) })}
                                      className="flex-1 accent-emerald-500 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <span className="font-black text-slate-800 text-xs w-8 text-right font-mono">
                                      {activeRel.confidence !== undefined ? activeRel.confidence : 100}%
                                    </span>
                                  </div>
                                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-emerald-500 transition-all duration-300"
                                      style={{ width: `${activeRel.confidence !== undefined ? activeRel.confidence : 100}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>

                              {/* Status dropdown */}
                              <div>
                                <label className="block text-[11px] font-bold text-slate-550 mb-1">
                                  状态 <span className="text-red-500 font-extrabold">*</span>
                                </label>
                                <select 
                                  value={activeRel.status}
                                  onChange={(e) => {
                                    const val = e.target.value as '已启用' | '草稿';
                                    handleFormUpdate({ status: val });
                                    showToast(`关系状态变更为: ${val}`, 'info');
                                  }}
                                  className="w-full rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white px-3 py-2 font-bold hover:border-slate-300 text-slate-700"
                                >
                                  <option value="已启用">已启用</option>
                                  <option value="草稿">草稿</option>
                                </select>
                              </div>

                            </div>
                          </div>
                        );
                      })()}

                    </div>
                    
                    {/* Right Column: holds A. Summary, B. AI Suggestions, C. Risk alerts */}
                    <div className="col-span-12 xl:col-span-3 space-y-4">
                      
                      {/* A. 关系摘要 Card */}
                      <div className="bg-white border border-slate-200 rounded-md p-4 shadow-3xs space-y-3">
                        <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
                          <ClipboardList className="w-4 h-4 text-slate-600" />
                          <span className="font-extrabold text-[12.5px] text-slate-805 font-sans">A. 关系摘要</span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-slate-50/50 rounded-lg p-2.5 border border-slate-200/50">
                            <span className="block font-mono text-[19px] font-black text-slate-800 leading-none">
                              {wizardRelations.length}
                            </span>
                            <span className="block text-[9px] text-slate-400 font-bold mt-1.5 font-sans">总关系数</span>
                          </div>
                          
                          <div className="bg-blue-50/30 rounded-lg p-2.5 border border-blue-100">
                            <span className="block font-mono text-[19px] font-black text-blue-650 leading-none">
                              {wizardRelations.filter(r => r.status === '已启用').length}
                            </span>
                            <span className="block text-[9px] text-blue-550 font-bold mt-1.5 font-sans">启用数</span>
                          </div>

                          <div className="bg-amber-50/40 rounded-lg p-2.5 border border-amber-100">
                            <span className="block font-mono text-[19px] font-black text-amber-605 leading-none">
                              {wizardRelations.filter(r => r.status === '草稿').length}
                            </span>
                            <span className="block text-[9px] text-amber-550 font-bold mt-1.5 font-sans">草稿数</span>
                          </div>
                        </div>
                      </div>

                      {/* B. AI 建模建议 Card */}
                      <div className="bg-white border border-slate-200 rounded-md p-4 shadow-3xs space-y-3 font-sans">
                        <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
                          <Sparkles className="w-4 h-4 text-amber-500 shrink-0 animate-pulse" />
                          <span className="font-extrabold text-[12.5px] text-slate-805 font-sans">B. AI 建模建议</span>
                        </div>
                        
                        <p className="text-[10.5px] text-slate-400 leading-normal font-medium font-sans">
                          基于当前对象及图谱上下文分析，推荐以下关系：
                        </p>

                        <div className="space-y-2.5 text-[11px]">
                          {/* Suggestion 1 */}
                          <div className="bg-slate-50/60 hover:bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-center justify-between gap-1 transition-all">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 flex-wrap">
                                <span className="font-semibold text-slate-700">Field</span>
                                <span className="text-slate-400 font-mono text-[9px]">←</span>
                                <span className="font-mono text-[10px] text-blue-600 font-bold bg-blue-50 px-1 py-0.2 rounded">validated_by</span>
                                <span className="text-slate-400 font-mono text-[9px]">←</span>
                                <span className="font-semibold text-slate-700">Rule</span>
                              </div>
                              <div className="text-[9.5px] text-slate-400 font-sans font-bold">
                                建议基数: <span className="font-mono text-slate-600">N:1</span>
                              </div>
                            </div>
                            
                            {wizardRelations.some(r => r.source === 'Rule' && r.relationType === 'validated_by') ? (
                              <span className="text-[9.5px] font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-150 px-2 py-0.5 rounded shrink-0">
                                已采纳
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  const newRel: DknRelation = {
                                    id: `r_ai1`,
                                    source: 'Rule',
                                    relationType: 'validated_by',
                                    target: 'Field',
                                    direction: '单向',
                                    cardinality: 'N:1',
                                    creationMethod: 'schema-based',
                                    status: '已启用',
                                    desc: '对应的校验规则模型对字段进行物理一致性及范围约束的定义验证。',
                                    confidence: 95
                                  };
                                  setWizardRelations([...wizardRelations, newRel]);
                                  setSelectedRelationId(newRel.id);
                                  showToast('✓ AI 建议：成功采纳 Rule -> validated_by -> Field 关系！', 'success');
                                }}
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 font-bold text-white text-[10px] rounded cursor-pointer leading-tight shadow-3xs transition-colors shrink-0"
                              >
                                采纳
                              </button>
                            )}
                          </div>

                          {/* Suggestion 2 */}
                          <div className="bg-slate-50/60 hover:bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-center justify-between gap-1 transition-all">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 flex-wrap">
                                <span className="font-semibold text-slate-700">Field</span>
                                <span className="text-slate-400 font-mono text-[9px]">→</span>
                                <span className="font-mono text-[10px] text-blue-600 font-bold bg-blue-50 px-1 py-0.2 rounded">affects</span>
                                <span className="text-slate-400 font-mono text-[9px]">→</span>
                                <span className="font-semibold text-slate-700">DataQuality</span>
                              </div>
                              <div className="text-[9.5px] text-slate-400 font-sans font-bold">
                                建议基数: <span className="font-mono text-slate-600">1:N</span>
                              </div>
                            </div>
                            
                            {wizardRelations.some(r => r.source === 'Field' && r.relationType === 'affects') ? (
                              <span className="text-[9.5px] font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-150 px-2 py-0.5 rounded shrink-0">
                                已采纳
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  const newRel: DknRelation = {
                                    id: `r_ai2`,
                                    source: 'Field',
                                    relationType: 'affects',
                                    target: 'DataQuality',
                                    direction: '单向',
                                    cardinality: '1:N',
                                    creationMethod: 'rule-based',
                                    status: '草稿',
                                    desc: '字段在血缘层级上发生任何质量变化时直接波及此度量评估模型。',
                                    confidence: 85
                                  };
                                  setWizardRelations([...wizardRelations, newRel]);
                                  setSelectedRelationId(newRel.id);
                                  showToast('✓ AI 建议：成功采纳 Field -> affects -> DataQuality 关系！', 'success');
                                }}
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 font-bold text-white text-[10px] rounded cursor-pointer leading-tight shadow-3xs transition-colors shrink-0"
                              >
                                采纳
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="pt-1.5 border-t border-slate-100 flex justify-center">
                          <button
                            type="button"
                            onClick={() => showToast('⭐ 正在从大语言元学分析模型加载更多潜在拓扑建议关系...', 'info')}
                            className="text-[10.5px] text-blue-650 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            查看更多建议 (2)
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* C. 风险提示 Card */}
                      <div className="bg-white border border-slate-200 rounded-md p-4 shadow-3xs space-y-3 font-sans">
                        <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                          <span className="font-extrabold text-[12.5px] text-slate-805">C. 风险提示</span>
                        </div>
                        
                        <div className="space-y-2.5">
                          {/* Alert 1 */}
                          {(() => {
                            const hasQualityRel = wizardRelations.find(r => r.relationType === 'has_quality');
                            const isMissingCardinality = hasQualityRel && !hasQualityRel.cardinality;
                            
                            return (
                              <div className="bg-amber-50/50 border border-amber-200 rounded-lg p-2.5 space-y-1.5 font-sans leading-relaxed text-[11px] text-amber-800 animate-fade-in">
                                <div className="flex items-center justify-between font-bold">
                                  <span className="flex items-center gap-1 font-extrabold">
                                    <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                                    1 条关系缺少 cardinality
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (hasQualityRel) {
                                        setSelectedRelationId(hasQualityRel.id);
                                        showToast('🔍 已为您定位并选中‘Field -> has_quality -> DataQuality’关系进行修改！', 'info');
                                      }
                                    }}
                                    className="text-[10px] font-black text-blue-600 hover:text-blue-800 underline active:text-blue-900 cursor-pointer"
                                  >
                                    去修复
                                  </button>
                                </div>
                                <p className="text-slate-500 text-[10px] font-semibold leading-normal pl-4.5">
                                  请为关系 <span className="font-bold text-slate-700">Field → has_quality → DataQuality</span> 配置基数
                                </p>
                              </div>
                            );
                          })()}

                          {/* Alert 2 */}
                          {(() => {
                            const hasRule = wizardRelations.some(r => r.source === 'Rule');
                            return (
                              <div className={`border rounded-lg p-2.5 space-y-1.5 font-sans leading-relaxed text-[11px] transition-all ${
                                !hasRule 
                                  ? 'bg-rose-50/50 border-rose-200 text-rose-800' 
                                  : 'bg-emerald-50/40 border-emerald-150 text-emerald-805 opacity-80'
                              }`}>
                                <div className="flex items-center justify-between font-bold">
                                  <span className="flex items-center gap-1 font-extrabold">
                                    <AlertCircle className={`w-3.5 h-3.5 ${!hasRule ? 'text-rose-500' : 'text-emerald-500'}`} />
                                    {!hasRule ? '1 个对象存在孤立风险' : '0 个对象存在孤立风险'}
                                  </span>
                                  {!hasRule && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        // Adopt!
                                        const newRel: DknRelation = {
                                          id: `r_rule_opt`,
                                          source: 'Rule',
                                          relationType: 'validated_by',
                                          target: 'Field',
                                          direction: '单向',
                                          cardinality: 'N:1',
                                          creationMethod: 'schema-based',
                                          status: '已启用',
                                          desc: '对应的校验规则模型对字段进行物理一致性及范围约束的定义验证。',
                                          confidence: 95
                                        };
                                        setWizardRelations([...wizardRelations, newRel]);
                                        setSelectedRelationId(newRel.id);
                                        showToast('✓ 已为您修复该物理对立，Rule 主线校验血缘已连通！', 'success');
                                      }}
                                      className="text-[10px] font-black text-rose-600 hover:text-rose-800 underline cursor-pointer"
                                    >
                                      去处理
                                    </button>
                                  )}
                                </div>
                                <p className="text-slate-500 text-[10px] font-semibold leading-normal pl-4.5">
                                  {!hasRule ? (
                                    <>对象 <span className="font-bold text-slate-700">Rule</span> 未与当前对象建立直接关联关系</>
                                  ) : (
                                    <>已成功为 <span className="font-semibold text-emerald-750">Rule</span> 配置到主宿主的连通血缘，孤立风险解除</>
                                  )}
                                </p>
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                    </div>

                  </div>
                )}

                {/* STEP 4 RENDERING */}
                {wizardActiveStep === 4 && (() => {
                  const selectedAction = wizardActionList.find(a => a.id === selectedActionId) || wizardActionList[0];
                  const filteredActions = wizardActionList.filter(act => {
                    const term = actionSearchTerm.toLowerCase();
                    return act.name.toLowerCase().includes(term) ||
                           act.code.toLowerCase().includes(term) ||
                           act.desc.toLowerCase().includes(term);
                  });

                  const handleAddNewAction = () => {
                    const newId = `wa_${Date.now()}`;
                    const newAct: DknAction = {
                      id: newId,
                      name: 'new_action_' + (wizardActionList.length + 1),
                      code: 'new_action_' + (wizardActionList.length + 1),
                      targetObject: 'Field',
                      actionType: 'GENERATE',
                      riskLevel: 'LOW',
                      execMode: 'ASYNC',
                      boundFunction: 'fn_new_action',
                      requireApproval: false,
                      status: '已绑定',
                      desc: '请提供该物理或业务算子的说明描述。',
                      inputSchema: JSON.stringify({ type: "object", properties: { param_1: "string" } }, null, 2),
                      outputSchema: JSON.stringify({ type: "object", properties: { result_1: "string" } }, null, 2)
                    };
                    setWizardActionList([...wizardActionList, newAct]);
                    setSelectedActionId(newId);
                    showToast('✓ 成功创建并绑定动作！您可以在下方“动作详情编辑表单”中对其进行修改。', 'success');
                  };

                  const handleRecommendActions = () => {
                    showToast('🔍 正在通过 AI 分析当前数据实体（Field）的血缘特征与语义角色...', 'info');
                    setTimeout(() => {
                      showToast('💡 AI 推荐了 2 个新算子！请查看右侧“AI 建模建议”面板进行采纳。', 'success');
                    }, 800);
                  };

                  const handleBulkBind = () => {
                    setWizardActionList(prev => prev.map(a => ({ ...a, status: '已绑定' })));
                    showToast('✓ 已为您一键批量绑定/激活当前列表中的所有 Action Types！', 'success');
                  };

                  const handleUnbindAction = (id: string, e: React.MouseEvent) => {
                    e.stopPropagation();
                    setWizardActionList(prev => prev.map(a => {
                      if (a.id === id) {
                        return { ...a, status: '草稿' };
                      }
                      return a;
                    }));
                    showToast('✓ 已解绑该动作！该动作已置为未绑定/草稿状态。', 'info');
                  };

                  const handleRebindAction = (id: string, e: React.MouseEvent) => {
                    e.stopPropagation();
                    setWizardActionList(prev => prev.map(a => {
                      if (a.id === id) {
                        return { ...a, status: '已绑定' };
                      }
                      return a;
                    }));
                    showToast('✓ 成功为该物体重新绑定该 Action Type！', 'success');
                  };

                  const updateSelectedActionField = (field: keyof DknAction, val: any) => {
                    setWizardActionList(prev => prev.map(act => {
                      if (act.id === selectedActionId) {
                        return { ...act, [field]: val };
                      }
                      return act;
                    }));
                  };

                  return (
                    <div className="space-y-5 text-[12px] animate-fade-in">
                      {/* Subtitle description card */}
                      <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-md flex items-start gap-2.5">
                        <Sparkles className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[11.5px] text-slate-700 font-bold leading-normal">
                            当前对象已绑定物理算子或业务运行动作，定义了对象在元架构引擎编排中的运行时语义。
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            元引擎启动阶段会自动抓取已绑定的 Action，进行参数对齐、依赖检查与血缘发布。
                          </p>
                        </div>
                      </div>

                      {/* 1. 已绑定动作列表 Card / Element */}
                      <div className="bg-white border border-slate-200 rounded-md overflow-hidden shadow-3xs">
                        {/* Header bar */}
                        <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-200 flex flex-wrap gap-2.5 items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-3.5 bg-blue-600 rounded"></span>
                            <h3 className="font-bold text-slate-800 text-[12.5px]">已绑定动作列表</h3>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Blue "+ 新增动作绑定" button */}
                            <button
                              type="button"
                              onClick={handleAddNewAction}
                              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-705 text-white text-[11px] font-bold rounded-lg flex items-center gap-1 transition-all shadow-sm shadow-blue-500/10 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                              新增动作绑定
                            </button>

                            {/* "AI 推荐动作" button */}
                            <button
                              type="button"
                              onClick={handleRecommendActions}
                              className="px-2.5 py-1.5 bg-white border border-blue-200 hover:bg-blue-50 text-blue-650 text-[11px] font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                              AI 推荐动作
                            </button>

                            {/* "批量绑定" button */}
                            <button
                              type="button"
                              onClick={handleBulkBind}
                              className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <Layers className="w-3.5 h-3.5 text-slate-400" />
                              批量绑定
                            </button>

                            {/* Search box */}
                            <div className="relative">
                              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                              <input
                                type="text"
                                placeholder="搜索动作名称、编码或描述..."
                                value={actionSearchTerm}
                                onChange={(e) => setActionSearchTerm(e.target.value)}
                                className="pl-8 pr-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-550 w-44 focus:w-56 transition-all"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Interactive Table representation */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50/30 text-slate-400 text-[10.5px] font-bold border-b border-slate-100 uppercase tracking-wider">
                                <th className="py-2.5 px-4 font-bold">动作名称</th>
                                <th className="py-2.5 px-3 font-bold">类型</th>
                                <th className="py-2.5 px-3 font-bold">风险等级</th>
                                <th className="py-2.5 px-3 font-bold">执行方式</th>
                                <th className="py-2.5 px-3 font-bold">绑定函数</th>
                                <th className="py-2.5 px-3 font-bold">审批要求</th>
                                <th className="py-2.5 px-3 font-bold">状态</th>
                                <th className="py-2.5 px-4 font-bold text-right">操作</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-[11px] font-semibold text-slate-700">
                              {filteredActions.length === 0 ? (
                                <tr>
                                  <td colSpan={8} className="py-6 text-center text-slate-400 font-medium">
                                    暂无符合搜索条件的动作记录
                                  </td>
                                </tr>
                              ) : (
                                filteredActions.map((act) => {
                                  const isSelected = act.id === selectedActionId;
                                  return (
                                    <tr
                                      key={act.id}
                                      onClick={() => setSelectedActionId(act.id)}
                                      className={`group cursor-pointer hover:bg-blue-50/30 transition-all ${
                                        isSelected ? 'bg-blue-50/50 border-l-2 border-l-blue-600' : ''
                                      }`}
                                    >
                                      <td className="py-3 px-4">
                                        <div className="flex flex-col">
                                          <span className="text-blue-600 font-bold hover:underline">
                                            {act.name}
                                          </span>
                                          <span className="text-[10px] text-slate-400 font-mono mt-0.5">{act.code}</span>
                                        </div>
                                      </td>
                                      
                                      <td className="py-3 px-3">
                                        <span className="text-slate-500 font-mono font-bold">{act.actionType}</span>
                                      </td>

                                      <td className="py-3 px-3">
                                        {act.riskLevel === 'LOW' && (
                                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-55 border border-emerald-150 px-2.5 py-0.5 rounded-full text-[9.5px] font-bold">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                            LOW
                                          </span>
                                        )}
                                        {act.riskLevel === 'MEDIUM' && (
                                          <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-150 px-2.5 py-0.5 rounded-full text-[9.5px] font-bold">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                            MEDIUM
                                          </span>
                                        )}
                                        {act.riskLevel === 'HIGH' && (
                                          <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 border border-rose-150 px-2.5 py-0.5 rounded-full text-[9.5px] font-bold">
                                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                                            HIGH
                                          </span>
                                        )}
                                      </td>

                                      <td className="py-3 px-3">
                                        <span className="text-slate-500 font-mono text-[10px]">{act.execMode}</span>
                                      </td>

                                      <td className="py-3 px-3">
                                        <span className="text-slate-600 font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/65">
                                          {act.boundFunction}
                                        </span>
                                      </td>

                                      <td className="py-3 px-3">
                                        <span className={`px-1.5 py-0.5 rounded text-[10.5px] ${act.requireApproval ? 'text-amber-700 bg-amber-50' : 'text-slate-400 bg-slate-100'}`}>
                                          {act.requireApproval ? '是' : '否'}
                                        </span>
                                      </td>

                                      <td className="py-3 px-3">
                                        {act.status === '已绑定' ? (
                                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-150 px-2 py-0.5 rounded-full text-[10px]">
                                            <span className="w-1 h-1 bg-emerald-600 rounded-full"></span>
                                            已绑定
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1 text-slate-550 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full text-[10px]">
                                            <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                                            未绑定
                                          </span>
                                        )}
                                      </td>

                                      <td className="py-3 px-4 text-right">
                                        <div className="flex items-center justify-end gap-3" onClick={(e) => e.stopPropagation()}>
                                          <button
                                            type="button"
                                            onClick={() => setSelectedActionId(act.id)}
                                            className="text-blue-605 hover:text-blue-800 font-bold hover:underline cursor-pointer"
                                          >
                                            编辑
                                          </button>
                                          
                                          {act.status === '已绑定' ? (
                                            <button
                                              type="button"
                                              onClick={(e) => handleUnbindAction(act.id, e)}
                                              className="text-rose-600 hover:text-rose-800 font-bold hover:underline cursor-pointer"
                                            >
                                              解绑
                                            </button>
                                          ) : (
                                            <button
                                              type="button"
                                              onClick={(e) => handleRebindAction(act.id, e)}
                                              className="text-emerald-650 hover:text-emerald-800 font-bold hover:underline cursor-pointer"
                                            >
                                              挂载绑定
                                            </button>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>

                        {/* Pagination box */}
                        <div className="px-4 py-2.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-slate-400 font-semibold text-[10.5px]">
                          <span>共 {filteredActions.length} 条</span>
                          <div className="flex items-center gap-3">
                            <span className="border border-slate-200 bg-white px-2 py-0.5 rounded text-slate-600">10条/页</span>
                            <div className="flex items-center gap-1.5">
                              <button type="button" disabled className="w-5 h-5 border border-slate-155 bg-white rounded flex items-center justify-center text-slate-300 cursor-not-allowed">‹</button>
                              <button type="button" className="w-5 h-5 bg-blue-600 border border-blue-600 rounded flex items-center justify-center text-white font-bold">1</button>
                              <button type="button" disabled className="w-5 h-5 border border-slate-155 bg-white rounded flex items-center justify-center text-slate-300 cursor-not-allowed">›</button>
                            </div>
                            <div className="flex items-center gap-1">
                              <span>前往</span>
                              <input type="text" readOnly value="1" className="w-6 text-center border border-slate-200 rounded bg-white py-0.5 text-slate-700" />
                              <span>页</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 2. Bottom Grid divided: Left: 编辑表单 | Right: 链路预览 */}
                      <div className="grid grid-cols-12 gap-4">
                        {/* 2A. LEFT: 动作详情编辑表单 */}
                        <div className="col-span-12 xl:col-span-6 bg-white border border-slate-200 rounded-md p-4.5 space-y-4 shadow-3xs">
                          <div className="border-b border-slate-100 pb-2.5 flex items-center gap-1.5">
                            <Layers className="w-4 h-4 text-blue-500" />
                            <h3 className="font-extrabold text-slate-800 text-[12px]">动作详情编辑表单</h3>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[10.5px] font-bold text-slate-500 mb-1">
                                <span className="text-red-500">*</span> 动作名称
                              </label>
                              <input
                                type="text"
                                value={selectedAction.name}
                                onChange={(e) => updateSelectedActionField('name', e.target.value)}
                                className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[10.5px] font-bold text-slate-500 mb-1">
                                <span className="text-red-500">*</span> 动作编码
                              </label>
                              <input
                                type="text"
                                value={selectedAction.code}
                                onChange={(e) => updateSelectedActionField('code', e.target.value)}
                                className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-mono text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[10.5px] font-bold text-slate-500 mb-1">
                                <span className="text-red-505">*</span> 目标对象
                              </label>
                              <select
                                value={selectedAction.targetObject}
                                onChange={(e) => updateSelectedActionField('targetObject', e.target.value)}
                                className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-550"
                              >
                                <option value="Field">Field</option>
                                <option value="Dataset">Dataset</option>
                                <option value="Mapping">Mapping</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[10.5px] font-bold text-slate-500 mb-1">
                                <span className="text-red-505">*</span> 动作类型
                              </label>
                              <select
                                value={selectedAction.actionType}
                                onChange={(e) => updateSelectedActionField('actionType', e.target.value)}
                                className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-550"
                              >
                                <option value="GENERATE">GENERATE</option>
                                <option value="VALIDATE">VALIDATE</option>
                                <option value="UPDATE">UPDATE</option>
                                <option value="DELETE">DELETE</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10.5px] font-bold text-slate-500 mb-1">
                                <span className="text-red-505">*</span> 风险等级
                              </label>
                              <select
                                value={selectedAction.riskLevel}
                                onChange={(e) => updateSelectedActionField('riskLevel', e.target.value as any)}
                                className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-550"
                              >
                                <option value="LOW">LOW</option>
                                <option value="MEDIUM">MEDIUM</option>
                                <option value="HIGH">HIGH</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10.5px] font-bold text-slate-500 mb-1">
                                <span className="text-red-505">*</span> 执行模式
                              </label>
                              <select
                                value={selectedAction.execMode}
                                onChange={(e) => updateSelectedActionField('execMode', e.target.value as any)}
                                className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-550"
                              >
                                <option value="ASYNC">ASYNC</option>
                                <option value="SYNC">SYNC</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10.5px] font-bold text-slate-500 mb-1">输入 Schema 摘要</label>
                              <textarea
                                value={selectedAction.inputSchema}
                                onChange={(e) => updateSelectedActionField('inputSchema', e.target.value)}
                                rows={5}
                                className="w-full px-2.5 py-1.5 bg-[#f8fafc] border border-slate-200 rounded-lg text-[10px] font-mono text-blue-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-550 h-[105px] resize-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10.5px] font-bold text-slate-500 mb-1">输出 Schema 摘要</label>
                              <textarea
                                value={selectedAction.outputSchema}
                                onChange={(e) => updateSelectedActionField('outputSchema', e.target.value)}
                                rows={5}
                                className="w-full px-2.5 py-1.5 bg-[#f8fafc] border border-slate-200 rounded-lg text-[10px] font-mono text-blue-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-550 h-[105px] resize-none"
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between py-1 border-t border-b border-slate-100">
                            <div>
                              <span className="text-[11px] font-bold text-slate-700 block">审批要求</span>
                              <span className="text-[9.5px] text-slate-400">高风险操作需要专家级权限进行审核确认</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => updateSelectedActionField('requireApproval', !selectedAction.requireApproval)}
                              className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                selectedAction.requireApproval ? 'bg-blue-600' : 'bg-slate-200'
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                  selectedAction.requireApproval ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </div>

                          <div>
                            <label className="block text-[10.5px] font-bold text-slate-500 mb-1">描述说明</label>
                            <input
                              type="text"
                              value={selectedAction.desc}
                              onChange={(e) => updateSelectedActionField('desc', e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-550"
                            />
                          </div>
                        </div>

                        {/* 2B. RIGHT: 动作执行链路预览 */}
                        <div className="col-span-12 xl:col-span-6 bg-white border border-slate-200 rounded-md p-4.5 space-y-4 shadow-3xs flex flex-col justify-between">
                          <div>
                            <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
                              <h3 className="font-extrabold text-slate-800 text-[12px] flex items-center gap-1.5">
                                <Workflow className="w-4 h-4 text-blue-500" />
                                动作执行链路预览
                              </h3>
                              <span className="text-[9.5px] text-blue-600 font-extrabold font-mono bg-blue-50 border border-blue-150 px-1.5 py-0.5 rounded leading-none">
                                {selectedAction.execMode === 'ASYNC' ? '异步模式 (ASYNC)' : '同步模式 (SYNC)'}
                              </span>
                            </div>

                            {/* 6-step horizontal flow layout */}
                            <div className="grid grid-cols-6 gap-1.5 mt-5 text-center relative">
                              
                              {/* 1. User/Workflow */}
                              <div className="bg-slate-50/50 border border-slate-200/80 rounded-lg p-2 flex flex-col items-center gap-1 min-h-[92px] justify-between relative shadow-6xs">
                                <div className="h-6 w-6 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                                  <Layers className="w-3.5 h-3.5" />
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-[8.5px] font-black text-slate-400 block tracking-tight scale-95 leading-none">User / Workflow</span>
                                  <p className="text-[8.5px] text-slate-700 font-bold scale-90 leading-tight">用户端工作流<br/>发起请求</p>
                                </div>
                                <div className="absolute top-1/2 -right-1 transform -translate-y-1/2 z-10">
                                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 stroke-[2.5]" />
                                </div>
                              </div>

                              {/* 2. Action Trigger */}
                              <div className="bg-blue-50/20 border border-blue-200/80 rounded-lg p-2 flex flex-col items-center gap-1 min-h-[92px] justify-between relative shadow-6xs">
                                <div className="h-6 w-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                                  <Activity className="w-3.5 h-3.5" />
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-[8.5px] font-black text-blue-600 block tracking-tight scale-95 leading-none">Action Trigger</span>
                                  <p className="text-[8px] text-slate-600 font-semibold font-mono scale-90 leading-tight">触发动作为<br/><span className="text-blue-700 bg-blue-50 border border-blue-100 px-0.5 py-0.2 rounded font-bold break-all inline-block truncate max-w-[50px]">{selectedAction.code}</span></p>
                                </div>
                                <div className="absolute top-1/2 -right-1 transform -translate-y-1/2 z-10">
                                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 stroke-[2.5]" />
                                </div>
                              </div>

                              {/* 3. Validation */}
                              <div className="bg-slate-50/50 border border-slate-200/80 rounded-lg p-2 flex flex-col items-center gap-1 min-h-[92px] justify-between relative shadow-6xs">
                                <div className="h-6 w-6 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-[8.5px] font-black text-slate-400 block tracking-tight scale-95 leading-none">Validation</span>
                                  <p className="text-[8.5px] text-slate-700 font-bold scale-90 leading-tight">参数校验与<br/>权限校验</p>
                                </div>
                                <div className="absolute top-1/2 -right-1 transform -translate-y-1/2 z-10">
                                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 stroke-[2.5]" />
                                </div>
                              </div>

                              {/* 4. Function Execution */}
                              <div className="bg-violet-50/20 border border-violet-100 rounded-lg p-2 flex flex-col items-center gap-1 min-h-[92px] justify-between relative shadow-6xs">
                                <div className="h-6 w-6 bg-violet-50 text-violet-600 rounded-full flex items-center justify-center">
                                  <Code className="w-3.5 h-3.5" />
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-[8.5px] font-black text-violet-600 block tracking-tight scale-95 leading-none">Function Exec</span>
                                  <p className="text-[8px] text-slate-600 font-semibold font-mono scale-90 leading-tight">执行绑定函数<br/><span className="text-violet-750 bg-violet-50 px-0.5 rounded font-bold select-all truncate max-w-[50px] inline-block">{selectedAction.boundFunction || 'fn_' + selectedAction.code}</span></p>
                                </div>
                                <div className="absolute top-1/2 -right-1 transform -translate-y-1/2 z-10">
                                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 stroke-[2.5]" />
                                </div>
                              </div>

                              {/* 5. Graph Mutation */}
                              <div className="bg-slate-50/50 border border-slate-200/80 rounded-lg p-2 flex flex-col items-center gap-1 min-h-[92px] justify-between relative shadow-6xs">
                                <div className="h-6 w-6 bg-pink-50 text-pink-600 rounded-full flex items-center justify-center">
                                  <GitBranch className="w-3.5 h-3.5" />
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-[8.5px] font-black text-slate-400 block tracking-tight scale-95 leading-none">Graph Mutation</span>
                                  <p className="text-[8.5px] text-slate-700 font-bold scale-90 leading-tight">更新图数据<br/>(质量结果写入)</p>
                                </div>
                                <div className="absolute top-1/2 -right-1 transform -translate-y-1/2 z-10">
                                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 stroke-[2.5]" />
                                </div>
                              </div>

                              {/* 6. Event Emit */}
                              <div className="bg-emerald-50/20 border border-emerald-150 rounded-lg p-2 flex flex-col items-center gap-1 min-h-[92px] justify-between relative shadow-6xs">
                                <div className="h-6 w-6 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                                  <Bell className="w-3.5 h-3.5 text-emerald-600" />
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-[8.5px] font-black text-emerald-600 block tracking-tight scale-95 leading-none">Event Emit</span>
                                  <p className="text-[8.5px] text-slate-700 font-bold scale-90 leading-tight">事件发布与<br/>通知订阅者</p>
                                </div>
                              </div>

                            </div>

                            {/* Back pointer Exception treatment arrow line */}
                            <div className="mt-5 pt-3 border-t border-dashed border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-bold">
                              <div className="w-full flex items-center gap-1.5 relative">
                                <div className="w-full h-px bg-[#d1d5db] relative border-t border-dashed">
                                  <div className="absolute left-0 -top-[3.5px] border-l border-t border-slate-400/80 w-1.5 h-1.5 rotate-[225deg]"></div>
                                </div>
                                <span className="shrink-0 bg-white px-2.5 text-slate-400 text-[9.5px] font-semibold tracking-wide">异常回滚 / 补偿处理</span>
                                <div className="w-full h-px bg-[#d1d5db] relative border-t border-dashed"></div>
                              </div>
                            </div>
                          </div>

                          <div className="pt-2 flex items-center gap-2 text-slate-400 leading-relaxed text-[10px] font-semibold border-t border-slate-100 bg-slate-50/30 p-2.5 rounded-lg border border-slate-200 mt-4 font-sans">
                            <span className="text-xs shrink-0 mt-0.5 font-bold">📝</span>
                            <p>
                              当算子由于断言异常、超时或元机制调度失败触发回滚时，
                              系统将按 <span className="font-mono text-slate-700 font-bold">逆向补偿链路</span> 撤销在图数据中写入的节点状态属性。
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* STEP 5 RENDERING - HIGHLY RESTORED FUNCTION BINDING VIEW */}
                {wizardActiveStep === 5 && (() => {
                  const activeFn = wizardFnList.find(f => f.id === selectedFnId) || wizardFnList[1];
                  const filteredFns = wizardFnList.filter(f => 
                    f.name.toLowerCase().includes(wizardFnSearch.toLowerCase()) ||
                    f.desc.toLowerCase().includes(wizardFnSearch.toLowerCase())
                  );

                  const updateActiveFn = (key: string, value: any) => {
                    setWizardFnList(prev => prev.map(f => {
                      if (f.id === selectedFnId) {
                        return { ...f, [key]: value };
                      }
                      return f;
                    }));
                  };

                  const handleRunTest = () => {
                    setIsTestingFn(true);
                    setTimeout(() => {
                      setIsTestingFn(false);
                      showToast(`✓ 测试在沙箱环境运行通过！(${activeFn.name})`, 'success');
                    }, 1000);
                  };

                  const renderMockCodeBlock = (codeString: string) => {
                    const lines = codeString.split('\n');
                    return (
                      <div className="bg-[#f8fafc]/90 border border-slate-200/80 rounded-lg p-2.5 font-mono text-[10px] text-slate-700 leading-normal overflow-auto max-h-[140px] select-text">
                        <table className="border-collapse w-full">
                          <tbody>
                            {lines.map((line, idx) => (
                              <tr key={idx} className="hover:bg-slate-100/50">
                                <td className="w-5 text-right pr-2 select-none text-slate-300 font-bold border-r border-slate-200/50 leading-normal">{idx + 1}</td>
                                <td className="pl-2 leading-normal whitespace-pre font-semibold text-slate-600">{line}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  };

                  return (
                    <div className="space-y-4 text-[12px] animate-fade-in font-sans">
                      
                      {/* 1. Step Title & Action Buttons Header */}
                      <div className="flex items-center justify-end">
                        <div className="flex items-center gap-2">
                          <button 
                            type="button"
                            onClick={() => showToast('📚 已为您打开 DRKN 拓扑函数关联机制文档。', 'info')}
                            className="px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-lg text-[10.5px] font-black transition-all shadow-3xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
                            帮助文档
                          </button>
                          <button 
                            type="button"
                            onClick={() => showToast('🔬 正在对当前 Field 包含的 3 项关联函数结构建立虚拟编译图谱...', 'success')}
                            className="px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-lg text-[10.5px] font-black transition-all shadow-3xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-500" />
                            预览本体
                          </button>
                        </div>
                      </div>

                      {/* 2. CARD: 已绑定函数列表 (Table Container) */}
                      <div className="bg-white border border-slate-200 rounded-md p-5 shadow-3xs space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <h3 className="text-xs font-black text-slate-805 flex items-center gap-1.5 shrink-0 leading-none">
                            已绑定函数列表
                          </h3>
                          
                          <div className="flex flex-wrap items-center gap-2 w-full justify-end select-none">
                            <button
                              type="button"
                              onClick={() => {
                                const newId = String(wizardFnList.length + 1);
                                const newFn = {
                                  id: newId,
                                  name: `custom_rule_compute_${newId}`,
                                  type: 'validation',
                                  targetObj: 'Field',
                                  targetAct: 'validate',
                                  inputSchemaName: 'CustomInput',
                                  outputSchemaName: 'ValidationResult',
                                  mode: '同步',
                                  status: '● 已启用',
                                  desc: '应用自定义数据规则核验函数，提供底层语义校验映射。',
                                  inputSchemaText: JSON.stringify({ type: "object", properties: { inputVal: "string" } }, null, 2),
                                  outputSchemaText: JSON.stringify({ type: "object", properties: { isValid: "boolean" } }, null, 2),
                                  testInput: JSON.stringify({ inputVal: "TestValue" }, null, 2),
                                  testOutput: JSON.stringify({ isValid: true }, null, 2),
                                  execMode: '同步',
                                  timeout: '3000',
                                  execTime: '20 ms',
                                  time: '2025-05-15 14:36:00'
                                };
                                setWizardFnList([...wizardFnList, newFn]);
                                setSelectedFnId(newId);
                                showToast('✓ 成功快速创建并绑定新规则解耦函数!', 'success');
                              }}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10.5px] font-black transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5 stroke-[3]" />
                              新增函数绑定
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setWizardFnList(prev => prev.map(f => ({ ...f, status: '● 已启用' })));
                                showToast('🪄 AI 重组推荐！已为您补全最佳字段提取算法。', 'info');
                              }}
                              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-[10.5px] font-black transition-all shadow-3xs flex items-center gap-1 cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                              AI 推荐函数
                            </button>
                            <button
                              type="button"
                              onClick={() => showToast('📥 已打开云函数模板库分类，支持快速导入。', 'info')}
                              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-[10.5px] font-black transition-all shadow-3xs flex items-center gap-1 cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5 text-slate-400" />
                              导入函数模板
                            </button>
                            
                            <div className="relative w-full sm:w-48 shrink-0">
                              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                              <input
                                type="text"
                                value={wizardFnSearch}
                                onChange={(e) => setWizardFnSearch(e.target.value)}
                                placeholder="搜索函数名称、编码或描述..."
                                className="w-full pl-8 pr-6 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10.5px] font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all font-sans"
                              />
                              {wizardFnSearch && (
                                <button type="button" onClick={() => setWizardFnSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Elegantly styled Table layout */}
                        <div className="border border-slate-200 rounded-md overflow-hidden bg-white">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse table-fixed min-w-[800px] leading-relaxed">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-[10.5px] font-extrabold text-slate-500 h-9">
                                  <th className="pl-4 py-2 font-black text-slate-700 w-[240px]">函数名称</th>
                                  <th className="py-2 font-black text-slate-700 w-[90px]">类型</th>
                                  <th className="py-2 font-black text-slate-700 w-[85px]">绑定对象</th>
                                  <th className="py-2 font-black text-slate-700 w-[110px]">绑定动作</th>
                                  <th className="py-2 font-black text-slate-700 w-[110px]">输入 Schema</th>
                                  <th className="py-2 font-black text-slate-700 w-[130px]">输出 Schema</th>
                                  <th className="py-2 font-black text-slate-700 w-[80px]">执行方式</th>
                                  <th className="py-2 font-black text-slate-700 w-[80px]">状态</th>
                                  <th className="py-2 px-4 font-black text-slate-700 text-center w-[100px]">操作</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-[11px] font-semibold text-slate-600">
                                {filteredFns.map((f) => {
                                  const isSelected = f.id === selectedFnId;
                                  return (
                                    <tr 
                                      key={f.id}
                                      onClick={() => setSelectedFnId(f.id)}
                                      className={`hover:bg-blue-50/20 cursor-pointer h-10 transition-colors ${
                                        isSelected ? 'bg-blue-50/40 border-l-2 border-l-blue-600' : ''
                                      }`}
                                    >
                                      <td className="pl-4 py-2 text-slate-900 font-extrabold font-mono truncate">{f.name}</td>
                                      <td className="py-2">
                                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] font-bold border ${
                                          f.type === 'inference' 
                                            ? 'bg-purple-100/60 text-purple-700 border-purple-200' 
                                            : f.type === 'scoring' 
                                              ? 'bg-emerald-50 border border-emerald-150 text-emerald-700'
                                              : 'bg-amber-50 border border-amber-150 text-amber-700'
                                        }`}>
                                          {f.type}
                                        </span>
                                      </td>
                                      <td className="py-2 text-slate-800 font-sans">{f.targetObj}</td>
                                      <td className="py-2 text-slate-700 font-mono truncate">{f.targetAct}</td>
                                      <td className="py-2 text-slate-600 font-sans truncate">{f.inputSchemaName}</td>
                                      <td className="py-2 text-slate-600 font-sans truncate">{f.outputSchemaName}</td>
                                      <td className="py-2 text-slate-600 font-sans">{f.mode}</td>
                                      <td className="py-2">
                                        <span className="inline-flex items-center gap-1 text-emerald-700 text-[10px] font-bold">
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                          已启用
                                        </span>
                                      </td>
                                      <td className="py-2 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center justify-center gap-1">
                                          <button 
                                            type="button"
                                            onClick={() => { setSelectedFnId(f.id); showToast(`🔧 编辑函数「${f.name}」`, 'info'); }}
                                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded transition-colors"
                                          >
                                            <Edit2 className="w-3.5 h-3.5" />
                                          </button>
                                          <button 
                                            type="button" 
                                            onClick={() => { setSelectedFnId(f.id); showToast(`👁️ 预览函数信息`, 'info'); }}
                                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded transition-colors"
                                          >
                                            <Eye className="w-3.5 h-3.5" />
                                          </button>
                                          <button 
                                            type="button" 
                                            onClick={() => {
                                              if (confirm(`确定要移除对函数「${f.name}」的绑定吗？`)) {
                                                setWizardFnList(wizardFnList.filter(item => item.id !== f.id));
                                                showToast('🗑️ 已解除动作函数关联', 'warn');
                                              }
                                            }}
                                            className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded transition-colors"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                                {filteredFns.length === 0 && (
                                  <tr>
                                    <td colSpan={9} className="text-center py-8 text-slate-400">没有查找到符合条件的函数模块数据。</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                          
                          {/* Table Pagination Footer */}
                          <div className="bg-slate-50/50 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between text-[10px] text-slate-400 font-bold select-none leading-none">
                            <div>共 {filteredFns.length} 条</div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1.5">
                                <button type="button" className="p-1 bg-white border border-slate-200 rounded leading-none text-slate-400 hover:text-slate-700 cursor-pointer">&lt;</button>
                                <span className="px-2.5 py-1 bg-white border border-slate-300 text-blue-650 rounded-md font-sans">1</span>
                                <button type="button" className="p-1 bg-white border border-slate-200 rounded leading-none text-slate-400 hover:text-slate-700 cursor-pointer">&gt;</button>
                              </div>
                              <select className="bg-white border border-slate-200 rounded px-1.5 py-1 text-slate-600 focus:outline-none">
                                <option>10 条/页</option>
                                <option>20 条/页</option>
                                <option>50 条/页</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 3. BOTTOM DUAL COLUMN GRIDS (Card 2 and Card 3) */}
                      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
                        
                        {/* 3A. CARD 2: 函数详情 (quality_score_compute) - taking 6cols */}
                        <div className="bg-white border border-slate-200 rounded-md p-5 shadow-3xs space-y-4 xl:col-span-6 flex flex-col justify-between">
                          <h3 className="text-xs font-black text-slate-805 leading-none shrink-0">
                            函数详情 ({activeFn.name})
                          </h3>

                          <div className="space-y-3.5">
                            {/* Inputs form grid */}
                            <div className="grid grid-cols-2 gap-3.5">
                              <div>
                                <label className="block text-[10px] font-black text-slate-500 mb-1 leading-none">
                                  <span className="text-red-500 mr-0.5">*</span> 函数名称
                                </label>
                                <input
                                  type="text"
                                  value={activeFn.name}
                                  onChange={(e) => updateActiveFn('name', e.target.value)}
                                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10.5px] font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 font-sans"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-black text-slate-500 mb-1 leading-none">
                                  <span className="text-red-500 mr-0.5">*</span> 函数编码
                                </label>
                                <input
                                  type="text"
                                  value={activeFn.name}
                                  onChange={(e) => updateActiveFn('name', e.target.value)}
                                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10.5px] font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 font-mono"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3.5">
                              <div>
                                <label className="block text-[10px] font-black text-slate-500 mb-1 leading-none">
                                  <span className="text-red-500 mr-0.5">*</span> 函数类型
                                </label>
                                <select
                                  value={activeFn.type}
                                  onChange={(e) => updateActiveFn('type', e.target.value)}
                                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10.5px] font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 font-sans"
                                >
                                  <option value="scoring">scoring</option>
                                  <option value="inference">inference</option>
                                  <option value="validation">validation</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] font-black text-slate-500 mb-1 leading-none">
                                  <span className="text-red-500 mr-0.5">*</span> 执行模式
                                </label>
                                <select
                                  value={activeFn.execMode}
                                  onChange={(e) => updateActiveFn('execMode', e.target.value)}
                                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10.5px] font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 font-sans"
                                >
                                  <option>同步 (Synchronous)</option>
                                  <option>异步 (Asynchronous)</option>
                                </select>
                              </div>
                            </div>

                            {/* Schema editors */}
                            <div className="grid grid-cols-2 gap-3.5">
                              <div className="space-y-1">
                                <label className="block text-[10px] font-black text-slate-500 mb-1 leading-none">
                                  <span className="text-red-500 mr-0.5">*</span> 输入 Schema 摘要
                                </label>
                                {renderMockCodeBlock(activeFn.inputSchemaText)}
                                <div className="flex items-center justify-between text-[9px] text-slate-400 font-semibold pt-1">
                                  <span>Schema 名称: <span className="font-mono text-slate-600">{activeFn.inputSchemaName}</span></span>
                                  <button type="button" onClick={() => showToast(`🔗 已跳出查看 ${activeFn.inputSchemaName} 完整元定义`, 'success')} className="text-blue-600 hover:underline inline-flex items-center gap-0.5">
                                    查看完整 Schema <ExternalLink className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <label className="block text-[10px] font-black text-slate-500 mb-1 leading-none">
                                  <span className="text-red-500 mr-0.5">*</span> 输出 Schema 摘要
                                </label>
                                {renderMockCodeBlock(activeFn.outputSchemaText)}
                                <div className="flex items-center justify-between text-[9px] text-slate-400 font-semibold pt-1">
                                  <span>Schema 名称: <span className="font-mono text-slate-600">{activeFn.outputSchemaName}</span></span>
                                  <button type="button" onClick={() => showToast(`🔗 已跳出查看 ${activeFn.outputSchemaName} 完整元定义`, 'success')} className="text-blue-600 hover:underline inline-flex items-center gap-0.5">
                                    查看完整 Schema <ExternalLink className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                            {/* STEP 6 RENDERING */}
                {wizardActiveStep === 6 && (
                  <div className="space-y-4 font-sans select-none animate-fade-in text-[12px]">
                    
                    {/* Step Title Row removed to avoid duplication with left sidebar */}

                    {/* TWO COLS: 校验结果摘要 & 创建对象预览 */}
                    <div className="grid grid-cols-12 gap-4">
                      
                      {/* CARD A: 校验结果摘要 */}
                      <div className="col-span-12 lg:col-span-7 bg-white border border-slate-200 rounded-md p-5 shadow-3xs">
                        <h3 className="text-xs font-black text-slate-805 mb-4 flex items-center gap-1.5 leading-none">
                          校验结果摘要
                        </h3>
                        
                        <div className="grid grid-cols-4 gap-3">
                          {/* 通过项 */}
                          <div 
                            onClick={() => setChecklistTab('pass')}
                            className={`border rounded-md p-3.5 flex flex-col items-center justify-center text-center shadow-3xs transition-all cursor-pointer ${
                              checklistTab === 'pass' 
                                ? 'bg-emerald-50/50 border-emerald-400 ring-2 ring-emerald-400/20' 
                                : 'bg-emerald-50/20 border-emerald-100 hover:bg-emerald-50/40'
                            }`}
                          >
                            <CheckCircle className="w-5 h-5 text-emerald-500 mb-2 stroke-[2.5]" />
                            <span className="text-[10px] text-slate-400 font-bold block mb-1">通过项</span>
                            <span className="font-mono text-xl font-extrabold text-emerald-600 leading-none">18</span>
                          </div>

                          {/* 警告 */}
                          <div 
                            onClick={() => setChecklistTab('warn')}
                            className={`border rounded-md p-3.5 flex flex-col items-center justify-center text-center shadow-3xs transition-all cursor-pointer ${
                              checklistTab === 'warn' 
                                ? 'bg-amber-50/50 border-amber-400 ring-2 ring-amber-400/20' 
                                : 'bg-amber-50/20 border-amber-100 hover:bg-amber-50/40'
                            }`}
                          >
                            <AlertTriangle className="w-5 h-5 text-amber-500 mb-2 stroke-[2.5]" />
                            <span className="text-[10px] text-slate-400 font-bold block mb-1">警告</span>
                            <span className="font-mono text-xl font-extrabold text-amber-500 leading-none">3</span>
                          </div>

                          {/* 错误 */}
                          <div 
                            onClick={() => setChecklistTab('error')}
                            className={`border rounded-md p-3.5 flex flex-col items-center justify-center text-center shadow-3xs transition-all cursor-pointer ${
                              checklistTab === 'error' 
                                ? 'bg-rose-50/50 border-rose-400 ring-2 ring-rose-400/20' 
                                : 'bg-rose-50/20 border-rose-100 hover:bg-rose-50/40'
                            }`}
                          >
                            <X className="w-5 h-5 text-rose-500 mb-2 bg-rose-100/30 rounded-full p-0.5 stroke-[3]" />
                            <span className="text-[10px] text-slate-400 font-bold block mb-1">错误</span>
                            <span className="font-mono text-xl font-extrabold text-rose-500 leading-none">1</span>
                          </div>

                          {/* 阻断项 */}
                          <div 
                            onClick={() => setChecklistTab('block')}
                            className={`border rounded-md p-3.5 flex flex-col items-center justify-center text-center shadow-3xs transition-all cursor-pointer ${
                              checklistTab === 'block' 
                                ? 'bg-red-50/50 border-red-400 ring-2 ring-red-400/20' 
                                : 'bg-red-50/20 border-red-100/50 hover:bg-red-50/40'
                            }`}
                          >
                            <ShieldAlert className="w-5 h-5 text-red-700 mb-2 bg-red-105 rounded-full stroke-[2]" />
                            <span className="text-[10px] text-slate-400 font-bold block mb-1">阻断项</span>
                            <span className="font-mono text-xl font-extrabold text-red-700 leading-none">1</span>
                          </div>
                        </div>
                      </div>

                      {/* CARD B: 创建对象预览 */}
                      <div className="col-span-12 lg:col-span-5 bg-white border border-slate-200 rounded-md p-5 shadow-3xs flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-3.5">
                          <h3 className="text-xs font-black text-slate-805 leading-none">创建对象预览</h3>
                          <span className="bg-emerald-50 border border-emerald-150 text-emerald-705 px-2 py-0.5 rounded-md text-[9.5px] font-black leading-none animate-pulse">
                            可创建
                          </span>
                        </div>

                        <div className="grid grid-cols-12 gap-3 items-center">
                          {/* Circle Icon left */}
                          <div className="col-span-3 flex justify-center">
                            <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/10">
                              <Database className="w-6 h-6 stroke-[1.8]" />
                            </div>
                          </div>

                          {/* Double column item grid info */}
                          <div className="col-span-9 grid grid-cols-2 gap-x-4 gap-y-2 text-[10.5px]">
                            <div className="flex flex-col gap-1">
                              <div className="flex justify-between border-b border-slate-100 pb-0.5">
                                <span className="text-slate-400 font-semibold">对象名称:</span>
                                <span className="font-bold text-slate-800">{wizardObjName}</span>
                              </div>
                              <div className="flex justify-between border-b border-slate-100 pb-0.5">
                                <span className="text-slate-400 font-semibold">编码:</span>
                                <span className="font-mono font-bold text-slate-800">{wizardObjCode}</span>
                              </div>
                              <div className="flex justify-between border-b border-slate-100 pb-0.5">
                                <span className="text-slate-400 font-semibold">分类:</span>
                                <span className="font-bold text-slate-805">{wizardCategory}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400 font-semibold">状态:</span>
                                <span className="font-black text-emerald-600">启用</span>
                              </div>
                            </div>

                            <div className="flex flex-col gap-1 border-l border-slate-100 pl-4">
                              <div className="flex justify-between border-b border-slate-100 pb-0.5">
                                <span className="text-slate-400 font-semibold">属性数:</span>
                                <span className="font-bold text-slate-800 font-mono">{wizardProperties.length}</span>
                              </div>
                              <div className="flex justify-between border-b border-slate-100 pb-0.5">
                                <span className="text-slate-400 font-semibold">关系数:</span>
                                <span className="font-bold text-slate-800 font-mono">{wizardLinks.length}</span>
                              </div>
                              <div className="flex justify-between border-b border-slate-100 pb-0.5">
                                <span className="text-slate-400 font-semibold">动作数:</span>
                                <span className="font-bold text-slate-800 font-mono">{wizardActionList.filter(a => a.status === '已绑定').length}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400 font-semibold">函数数:</span>
                                <span className="font-bold text-slate-800 font-mono">3</span>
                              </div>
                            </div>
                          </div>

                        </div>
                      </div>

                    </div>

                    {/* ACCORDION/LIST: 详细校验清单 */}
                    <div className="bg-white border border-slate-200 rounded-md p-5 shadow-3xs space-y-4">
                      
                      {/* Header filter row */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                        <h3 className="text-xs font-black text-slate-805 flex items-center gap-1.5 leading-none">
                          详细校验清单
                        </h3>

                        <div className="flex flex-wrap items-center gap-1.5">
                          {[
                            { key: 'all', label: '全部', count: 23 },
                            { key: 'pass', label: '通过', count: 18 },
                            { key: 'warn', label: '警告', count: 3 },
                            { key: 'error', label: '错误', count: 1 },
                            { key: 'block', label: '阻断', count: 1 }
                          ].map((tab) => {
                            const isSelected = checklistTab === tab.key;
                            return (
                              <button
                                key={tab.key}
                                type="button"
                                onClick={() => setChecklistTab(tab.key as any)}
                                className={`px-2.5 py-1 rounded-md text-[10.5px] font-extrabold flex items-center gap-1 border transition-all cursor-pointer ${
                                  isSelected 
                                    ? 'bg-[#0052cc] border-[#0052cc] text-white shadow-xs' 
                                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                <span>{tab.label}</span>
                                <span className={`px-1 py-0.2 rounded-md text-[9px] font-bold ${isSelected ? 'bg-blue-700 text-white' : 'bg-slate-200/60 text-slate-600'}`}>
                                  {tab.count}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Display Accordions based on selected tab filter */}
                      <div className="space-y-3">
                        
                        {/* ACCORDION 1: 基础信息校验 (3项) */}
                        {(checklistTab === 'all' || checklistTab === 'pass') && (
                          <div className="border border-slate-200 rounded-md overflow-hidden shadow-3xs transition-all">
                            {/* Header */}
                            <div 
                              onClick={() => setChecklistExpanded(prev => ({ ...prev, base: !prev.base }))}
                              className="bg-slate-50/50 hover:bg-slate-50 p-4 shrink-0 flex items-center justify-between cursor-pointer select-none transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <CheckSquare className="w-4 h-4 text-emerald-600 fill-emerald-50 stroke-[2]" />
                                <span className="font-extrabold text-slate-800 text-[11.5px]">基础信息校验（3项）</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="bg-emerald-50 border border-emerald-150 text-emerald-700 px-1.5 py-0.5 rounded text-[9.5px] font-bold">通过 3</span>
                                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${checklistExpanded.base ? 'rotate-180' : ''}`} />
                              </div>
                            </div>

                            {/* Expanded items */}
                            {checklistExpanded.base && (
                              <div className="bg-slate-50/20 border-t border-slate-100 p-4 animate-fade-in font-sans">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Item 1 */}
                                  <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                    <div className="flex items-start gap-2 max-w-[80%]">
                                      <div className="text-[10.5px]">
                                        <span className="font-extrabold text-[#1e293b] block">对象编码唯一</span>
                                        <span className="text-slate-400 text-[9.5px] leading-relaxed block mt-0.5 font-semibold">对象编码在当前域内唯一</span>
                                      </div>
                                    </div>
                                    <span className="inline-flex items-center gap-1.5 text-emerald-600 font-extrabold text-[10.5px]">
                                      通过
                                    </span>
                                  </div>

                                  {/* Item 2 */}
                                  <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                    <div className="flex items-start gap-2 max-w-[80%]">
                                      <div className="text-[10.5px]">
                                        <span className="font-extrabold text-[#1e293b] block">对象描述完整</span>
                                        <span className="text-slate-400 text-[9.5px] leading-relaxed block mt-0.5 font-semibold">对象描述已填写完整</span>
                                      </div>
                                    </div>
                                    <span className="inline-flex items-center gap-1.5 text-emerald-600 font-extrabold text-[10.5px]">
                                      通过
                                    </span>
                                  </div>

                                  {/* Item 3 */}
                                  <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                    <div className="flex items-start gap-2 max-w-[80%]">
                                      <div className="text-[10.5px]">
                                        <span className="font-extrabold text-[#1e293b] block">标识属性规范度</span>
                                        <span className="text-slate-400 text-[9.5px] leading-relaxed block mt-0.5 font-semibold">首要标识属性未包含非法字符</span>
                                      </div>
                                    </div>
                                    <span className="inline-flex items-center gap-1.5 text-emerald-600 font-extrabold text-[10.5px]">
                                      通过
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* ACCORDION 2: 属性定义校验 (4项) */}
                        {(checklistTab === 'all' || checklistTab === 'pass' || checklistTab === 'warn') && (
                          <div className="border border-slate-200 rounded-md overflow-hidden shadow-3xs transition-all">
                            {/* Header */}
                            <div 
                              onClick={() => setChecklistExpanded(prev => ({ ...prev, properties: !prev.properties }))}
                              className="bg-slate-50/50 hover:bg-slate-50 p-4 shrink-0 flex items-center justify-between cursor-pointer select-none transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-500 stroke-[2]" />
                                <span className="font-extrabold text-slate-800 text-[11.5px]">属性定义校验（4项）</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="bg-emerald-50 border border-emerald-150 text-emerald-700 px-1.5 py-0.5 rounded text-[9.5px] font-bold">通过 3</span>
                                <span className="bg-amber-50 border border-amber-150 text-amber-600 px-1.5 py-0.5 rounded text-[9.5px] font-bold">警告 1</span>
                                <span className="bg-slate-50 border border-slate-200 text-slate-400 px-1.5 py-0.5 rounded text-[9.5px] font-bold">错误 0</span>
                                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${checklistExpanded.properties ? 'rotate-180' : ''}`} />
                              </div>
                            </div>

                            {/* Expanded items */}
                            {checklistExpanded.properties && (
                              <div className="bg-slate-50/20 border-t border-slate-100 p-4 animate-fade-in font-sans">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Item 1 */}
                                  {(checklistTab === 'all' || checklistTab === 'pass') && (
                                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                      <div className="flex items-start gap-2 max-w-[80%]">
                                        <div className="text-[10.5px]">
                                          <span className="font-extrabold text-[#1e293b] block">属性命名唯一性</span>
                                          <span className="text-slate-400 text-[9.5px] leading-relaxed block mt-0.5 font-semibold">属性名称和物理编码在实体内部不重叠</span>
                                        </div>
                                      </div>
                                      <span className="inline-flex items-center gap-1.5 text-emerald-600 font-extrabold text-[10.5px]">
                                        通过
                                      </span>
                                    </div>
                                  )}

                                  {/* Item 2 */}
                                  {(checklistTab === 'all' || checklistTab === 'pass') && (
                                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                      <div className="flex items-start gap-2 max-w-[80%]">
                                        <div className="text-[10.5px]">
                                          <span className="font-extrabold text-[#1e293b] block">所有属性的语义标识已配置</span>
                                          <span className="text-slate-400 text-[9.5px] leading-relaxed block mt-0.5 font-semibold">属性物理底层与标准语义字典映射健全</span>
                                        </div>
                                      </div>
                                      <span className="inline-flex items-center gap-1.5 text-emerald-600 font-extrabold text-[10.5px]">
                                        通过
                                      </span>
                                    </div>
                                  )}

                                  {/* Item 3 */}
                                  {(checklistTab === 'all' || checklistTab === 'pass') && (
                                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                      <div className="flex items-start gap-2 max-w-[80%]">
                                        <div className="text-[10.5px]">
                                          <span className="font-extrabold text-[#1e293b] block">默认值格式检测</span>
                                          <span className="text-slate-400 text-[9.5px] leading-relaxed block mt-0.5 font-semibold">默认值未检测到可能导致溢出的字符段</span>
                                        </div>
                                      </div>
                                      <span className="inline-flex items-center gap-1.5 text-emerald-600 font-extrabold text-[10.5px]">
                                        通过
                                      </span>
                                    </div>
                                  )}

                                  {/* Item 4 */}
                                  {(checklistTab === 'all' || checklistTab === 'warn') && (
                                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                      <div className="flex items-start gap-2 max-w-[80%]">
                                        <div className="text-[10.5px]">
                                          <span className="font-extrabold text-[#1e293b] block">数据来源血缘完整</span>
                                          <span className="text-slate-400 text-[9.5px] leading-relaxed block mt-0.5 font-semibold">部分字段的底层物理库来源映射悬空</span>
                                        </div>
                                      </div>
                                      <span className="inline-flex items-center gap-1 text-amber-600 font-extrabold text-[10.5px]">
                                        警告
                                        <Info className="w-3 h-3 stroke-[2.5]" />
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* ACCORDION 3: 关系绑定校验 (3项) */}
                        {(checklistTab === 'all' || checklistTab === 'pass' || checklistTab === 'warn') && (
                          <div className="border border-slate-200 rounded-md overflow-hidden shadow-3xs transition-all">
                            {/* Header */}
                            <div 
                              onClick={() => setChecklistExpanded(prev => ({ ...prev, relationship: !prev.relationship }))}
                              className="bg-slate-50/50 hover:bg-slate-50 p-4 shrink-0 flex items-center justify-between cursor-pointer select-none transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-500 stroke-[2]" />
                                <span className="font-extrabold text-slate-800 text-[11.5px]">关系绑定校验（3项）</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="bg-emerald-50 border border-emerald-150 text-emerald-700 px-1.5 py-0.5 rounded text-[9.5px] font-bold">通过 2</span>
                                <span className="bg-amber-50 border border-amber-150 text-amber-600 px-1.5 py-0.5 rounded text-[9.5px] font-bold">警告 1</span>
                                <span className="bg-slate-50 border border-slate-200 text-slate-400 px-1.5 py-0.5 rounded text-[9.5px] font-bold">错误 0</span>
                                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${checklistExpanded.relationship ? 'rotate-180' : ''}`} />
                              </div>
                            </div>

                            {/* Expanded items */}
                            {checklistExpanded.relationship && (
                              <div className="bg-slate-50/20 border-t border-slate-100 p-4 animate-fade-in font-sans">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Item 1 */}
                                  {(checklistTab === 'all' || checklistTab === 'pass') && (
                                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                      <div className="flex items-start gap-2 max-w-[80%]">
                                        <div className="text-[10.5px]">
                                          <span className="font-extrabold text-[#1e293b] block">关系 cardinality 已配置</span>
                                          <span className="text-slate-400 text-[9.5px] leading-relaxed block mt-0.5 font-semibold">所有关系的 cardinality 已配置</span>
                                        </div>
                                      </div>
                                      <span className="inline-flex items-center gap-1.5 text-emerald-600 font-extrabold text-[10.5px]">
                                        通过
                                      </span>
                                    </div>
                                  )}

                                  {/* Item 2 */}
                                  {(checklistTab === 'all' || checklistTab === 'pass') && (
                                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                      <div className="flex items-start gap-2 max-w-[80%]">
                                        <div className="text-[10.5px]">
                                          <span className="font-extrabold text-[#1e293b] block">无孤立关系</span>
                                          <span className="text-slate-400 text-[9.5px] leading-relaxed block mt-0.5 font-semibold">所有关系的指向对象均存在且有效</span>
                                        </div>
                                      </div>
                                      <span className="inline-flex items-center gap-1.5 text-emerald-600 font-extrabold text-[10.5px]">
                                        通过
                                      </span>
                                    </div>
                                  )}

                                  {/* Item 3 */}
                                  {(checklistTab === 'all' || checklistTab === 'warn') && (
                                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                      <div className="flex items-start gap-2 max-w-[80%]">
                                        <div className="text-[10.5px]">
                                          <span className="font-extrabold text-[#1e293b] block">关系目标对象配置自适应</span>
                                          <span className="text-slate-400 text-[9.5px] leading-relaxed block mt-0.5 font-semibold">部分目标实体处于非激活可用状态</span>
                                        </div>
                                      </div>
                                      <span className="inline-flex items-center gap-1 text-amber-600 font-extrabold text-[10.5px]">
                                        警告
                                        <Info className="w-3 h-3 stroke-[2.5]" />
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* ACCORDION 4: 动作与函数校验 (4项) */}
                        {(checklistTab === 'all' || checklistTab === 'pass' || checklistTab === 'error' || checklistTab === 'block') && (
                          <div className="border border-slate-200 rounded-md overflow-hidden shadow-3xs transition-all">
                            {/* Header */}
                            <div 
                              onClick={() => setChecklistExpanded(prev => ({ ...prev, action: !prev.action }))}
                              className="bg-slate-50/50 hover:bg-slate-50 p-4 shrink-0 flex items-center justify-between cursor-pointer select-none transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <X className="w-4 h-4 text-[#ffcc00] stroke-[2]" />
                                <span className="font-extrabold text-slate-800 text-[11.5px]">动作与函数校验（4项）</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="bg-emerald-50 border border-emerald-150 text-emerald-700 px-1.5 py-0.5 rounded text-[9.5px] font-bold">通过 2</span>
                                <span className="bg-amber-50 border border-slate-200 text-slate-400 px-1.5 py-0.5 rounded text-[9.5px] font-bold">警告 0</span>
                                <span className="bg-rose-50 border border-rose-150 text-rose-600 px-1.5 py-0.5 rounded text-[9.5px] font-bold">错误 1</span>
                                <span className="bg-red-50 border border-red-150 text-red-700 px-1.5 py-0.5 rounded text-[9.5px] font-bold">阻断 1</span>
                                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${checklistExpanded.action ? 'rotate-180' : ''}`} />
                              </div>
                            </div>

                            {/* Expanded items */}
                            {checklistExpanded.action && (
                              <div className="bg-slate-50/20 border-t border-slate-100 p-4 animate-fade-in font-sans">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Item 1 */}
                                  {(checklistTab === 'all' || checklistTab === 'pass') && (
                                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                      <div className="flex items-start gap-2 max-w-[80%]">
                                        <div className="text-[10.5px]">
                                          <span className="font-extrabold text-[#1e293b] block">动作已绑定函数</span>
                                          <span className="text-slate-400 text-[9.5px] leading-relaxed block mt-0.5 font-semibold">所有动作已绑定有效函数</span>
                                        </div>
                                      </div>
                                      <span className="inline-flex items-center gap-1.5 text-emerald-600 font-extrabold text-[10.5px]">
                                        通过
                                      </span>
                                    </div>
                                  )}

                                  {/* Item 2 */}
                                  {(checklistTab === 'all' || checklistTab === 'pass') && (
                                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                      <div className="flex items-start gap-2 max-w-[80%]">
                                        <div className="text-[10.5px]">
                                          <span className="font-extrabold text-[#1e293b] block">动作/函数入参 Schema 合法</span>
                                          <span className="text-slate-400 text-[9.5px] leading-relaxed block mt-0.5 font-semibold">动作及函数的输入输出在 Schema 合法</span>
                                        </div>
                                      </div>
                                      <span className="inline-flex items-center gap-1.5 text-emerald-600 font-extrabold text-[10.5px]">
                                        通过
                                      </span>
                                    </div>
                                  )}

                                  {/* Item 3 */}
                                  {(checklistTab === 'all' || checklistTab === 'error') && (
                                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors border-rose-105">
                                      <div className="flex items-start gap-2 max-w-[80%]">
                                        <div className="text-[10.5px]">
                                          <span className="font-extrabold text-[#1e293b] block">输入输出 Schema 异常警告</span>
                                          <span className="text-slate-400 text-[9.5px] leading-relaxed block mt-0.5 font-semibold">高级动作已配置审批要求</span>
                                        </div>
                                      </div>
                                      <span className="inline-flex items-center gap-1 text-rose-600 font-extrabold text-[10.5px]">
                                        错误
                                      </span>
                                    </div>
                                  )}

                                  {/* Item 4 */}
                                  {(checklistTab === 'all' || checklistTab === 'block') && (
                                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors border-rose-105 border">
                                      <div className="flex items-start gap-2 max-w-[80%]">
                                        <div className="text-[10.5px]">
                                          <span className="font-extrabold text-[#1e293b] block">风险动作审批未配置</span>
                                          <span className="text-slate-400 text-[9.5px] leading-relaxed block mt-0.5 font-semibold">未针对 quality_score_compute 分配审批权流</span>
                                        </div>
                                      </div>
                                      <span className="inline-flex items-center gap-1.5 text-rose-700 font-extrabold text-[10.5px]">
                                        阻断
                                        <ShieldAlert className="w-3.5 h-3.5" />
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* THREE COLS ROW: 创建前影响分析与确认 */}
                    <div className="grid grid-cols-12 gap-5 bg-white border border-slate-200 rounded-md p-5 shadow-3xs">
                      {/* Box 1: 影响分析 */}
                      <div className="col-span-12 lg:col-span-4 bg-slate-50/40 border border-slate-200 rounded-md p-4 flex flex-col justify-between">
                        <div>
                          <h4 className="font-black text-slate-805 text-xs mb-2 leading-none flex items-center gap-2">
                            <span className="text-[11px] select-none">📊</span>
                            影响分析
                          </h4>
                          <span className="text-[10px] text-slate-400 font-bold block mb-3 font-mono leading-none">IMPACT ANALYSIS</span>
                          <div className="space-y-2 text-[10.5px] font-semibold text-slate-600 font-sans">
                            <p className="flex justify-between border-b border-dashed border-slate-200 pb-1.5">
                              <span>受关联影响节点:</span>
                              <span className="font-extrabold text-slate-700">3 项</span>
                            </p>
                            <p className="flex justify-between border-b border-dashed border-slate-200 pb-1.5">
                              <span>涉及元拓扑实体:</span>
                              <span className="font-extrabold text-slate-700">2 节点</span>
                            </p>
                            <p className="flex justify-between">
                              <span>对图性能预估:</span>
                              <span className="font-extrabold text-emerald-600">0.02ms (极佳)</span>
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 border-t border-slate-200/70 pt-3">
                          <label className="flex items-start gap-2 cursor-pointer select-none">
                            <input 
                              type="checkbox"
                              checked={confirmModelingChecked}
                              onChange={(e) => setConfirmModelingChecked(e.target.checked)}
                              className="w-3.5 h-3.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 mt-0.5 cursor-pointer"
                            />
                            <span className="text-[10.5px] font-black text-slate-700 font-sans">确认执行此实体对象建模</span>
                          </label>
                        </div>
                      </div>

                      {/* Box 2: 版本与变更摘要 */}
                      <div className="col-span-12 lg:col-span-4 bg-slate-50/40 border border-slate-200 rounded-md p-4 flex flex-col justify-between">
                        <div>
                          <h4 className="font-black text-slate-805 text-xs mb-2 leading-none flex items-center gap-2">
                            <span className="text-[11px] select-none">📑</span>
                            版本与变更摘要
                          </h4>
                          <span className="text-[10px] text-slate-400 font-bold block mb-3 font-mono leading-none">CHANGE RESOLUTION SET</span>
                          <div className="space-y-2 text-[10.5px] font-semibold text-slate-605 font-sans">
                            <p className="flex justify-between border-b border-dashed border-slate-200 pb-1.5">
                              <span>临时分支:</span>
                              <span className="font-mono text-slate-700">CS-2026-012</span>
                            </p>
                            <p className="flex justify-between border-b border-dashed border-slate-200 pb-1.5">
                              <span>预挂载算子:</span>
                              <span className="font-mono text-slate-700">3 active</span>
                            </p>
                            <p className="flex justify-between">
                              <span>一致性登记:</span>
                              <span className="font-extrabold text-emerald-600">高 (Consistence-A)</span>
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 border-t border-slate-200/70 pt-3">
                          <label className="flex items-start gap-2 cursor-pointer select-none">
                            <input 
                              type="checkbox"
                              checked={confirmListChecked}
                              onChange={(e) => setConfirmListChecked(e.target.checked)}
                              className="w-3.5 h-3.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 mt-0.5 cursor-pointer"
                            />
                            <span className="text-[10.5px] font-black text-slate-700 font-sans">确认清单检验状态并认可风险</span>
                          </label>
                        </div>
                      </div>

                      {/* Box 3: 创建确认 */}
                      <div className="col-span-12 lg:col-span-4 bg-blue-50/20 border border-blue-105 rounded-md p-4 flex flex-col justify-between">
                        <div>
                          <h4 className="font-black text-blue-805 text-xs mb-2 leading-none flex items-center gap-2">
                            <span className="text-[11px] select-none">🌟</span>
                            创建操作组
                          </h4>
                          <span className="text-[10px] text-blue-400 font-bold block mb-3 font-mono leading-none">SUBMISSION CONTROLS</span>
                          <p className="text-[10px] leading-relaxed text-slate-500 font-medium font-sans">
                            所有校验项目核对完成后，点击下方按钮将对象模型保存至本地模拟状态，并同步刷新最顶层本体对象列表。
                          </p>
                        </div>

                        <div className="mt-4 pt-3 flex flex-col gap-1.5">
                          <button
                            type="button"
                            onClick={handleCommitCreation}
                            className={`w-full py-2 bg-[#0052cc] hover:bg-[#0747a6] text-white font-extrabold text-[11.5px] rounded-lg transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer border border-[#0052cc] ${
                              (!confirmModelingChecked || !confirmListChecked) ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            disabled={!confirmModelingChecked || !confirmListChecked}
                          >
                            完成并创建模型
                            <ArrowRight className="w-3.5 h-3.5 leading-none shrink-0" />
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => {
                              setWizardActiveStep(5);
                              showToast('已返回 Step 5 / 函数绑定 进行微调');
                            }}
                            className="w-full py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-605 font-extrabold text-[10px] rounded-md transition-all flex items-center justify-center cursor-pointer"
                          >
                            返回修改
                          </button>
                        </div>
                      </div>
                    </div>

                    {validationSuccess && !isValidating && (
                      <div className="p-4 bg-emerald-50 border border-emerald-250 rounded-md space-y-2 text-emerald-800 animate-fade-in text-[11.5px] mt-4 font-sans">
                        <p className="font-black flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          系统核对完成： 一致性等级(高)，无主键重名，无环依赖。项目已写入元变更集分支 (CS-2026-012)。
                        </p>
                        <div className="space-y-1 font-semibold text-slate-600 pt-1 border-t border-emerald-200 text-[10.5px] pl-6">
                          <p>• 主标识符 [{wizardObjCode || 'id'}_id] 符合语义定义库规范，唯一有效。</p>
                          <p>• [{wizardProperties.length}] 项属性属性未发生重名冲突，主类型定义安全。</p>
                          <p>• 已自动生成 Change Set 分支变更记录，目标沙箱归档槽: CS-2026-012。</p>
                        </div>
                      </div>
                    )}

                    {/* Preview summary panel */}
                    <div className="bg-white border border-slate-200 rounded-md p-4 space-y-3.5 shadow-3xs mt-4">
                      <h4 className="font-extrabold text-slate-805 text-xs">即将在本体库创建的元数据大纲:</h4>
                      <div className="grid grid-cols-2 gap-4 text-[11px] font-semibold text-slate-600 font-sans">
                        <div className="space-y-2.5">
                          <p>• 对象实体Code: <span className="font-mono text-slate-800 bg-slate-50 px-1 py-0.5 rounded border border-slate-200">{wizardObjCode || '-'}</span></p>
                          <p>• 实体中文简称: <span className="text-slate-800">{wizardObjName}</span></p>
                          <p>• 本体基本分类: <span className="text-slate-800">{wizardCategory}</span></p>
                          <p>• 主标识映射代码: <span className="font-mono text-slate-800 bg-slate-100 px-1 py-0.5 rounded">{wizardObjCode}_id</span></p>
                        </div>
                        <div className="space-y-2.5">
                          <p>• 声明属性字段: <span className="text-blue-600 font-extrabold">{wizardProperties.length} 项 (已配置)</span></p>
                          <p>• 分类绑定血缘: <span className="text-blue-600 font-extrabold">{wizardLinks.length} 项</span></p>
                          <p>• 元挂载Actions: <span className="text-blue-600 font-extrabold">{wizardActionList.filter(a => a.status === '已绑定').length} 项</span></p>
                          <p>• 系统算法计算Functions: <span className="text-blue-600 font-extrabold">{wizardFunctions.length} 项</span></p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>



          </div>

          {/* 4C. RIGHT SIDEBAR: REAL-TIME PREVIEW + AI ADVISOR + CREATION TIPS (cols: 3.5/12) */}
          <div className="col-span-12 lg:col-span-3 mt-2 space-y-4">
            
            {wizardActiveStep === 5 ? (
              <>
                {/* A. 函数摘要 */}
                <div className="bg-white border border-slate-200 rounded-md p-5 shadow-3xs space-y-4 select-none">
                  <h3 className="text-xs font-black text-slate-805 flex items-center gap-1.5 border-b border-slate-100 pb-2.5 leading-none">
                    <List className="w-4 h-4 text-blue-500 animate-[pulse_2s_infinite]" />
                    A. 函数摘要
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="bg-slate-50/50 hover:bg-slate-50 border border-slate-200 p-3 rounded-md flex items-center justify-between transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="text-base select-none">📦</span>
                        <div>
                          <span className="font-extrabold text-slate-800 block text-[11.5px] leading-tight font-sans">累计绑定函数</span>
                          <span className="text-[9.5px] leading-none text-slate-400 font-bold block mt-1 font-mono">Bound Functions Scale</span>
                        </div>
                      </div>
                      <span className="font-mono text-base font-black text-blue-600 leading-none">{wizardFnList.length} 项</span>
                    </div>

                    <div className="bg-slate-50/50 hover:bg-slate-50 border border-slate-200 p-3 rounded-md flex items-center justify-between transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="text-base select-none">🚀</span>
                        <div>
                          <span className="font-extrabold text-slate-800 block text-[11.5px] leading-tight font-sans">激活高维算子</span>
                          <span className="text-[9.5px] leading-none text-slate-400 font-bold block mt-1 font-mono">Active AI Operators</span>
                        </div>
                      </div>
                      <span className="font-mono text-base font-black text-emerald-600 leading-none">
                        {wizardFnList.filter(f => f.status.includes('已启用')).length} / {wizardFnList.length}
                      </span>
                    </div>

                    <div className="bg-slate-50/50 hover:bg-slate-50 border border-slate-200 p-3 rounded-md flex items-center justify-between transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="text-base select-none">⏱️</span>
                        <div>
                          <span className="font-extrabold text-slate-800 block text-[11.5px] leading-tight font-sans">平均响应开销</span>
                          <span className="text-[9.5px] leading-none text-slate-400 font-bold block mt-1 font-mono">Avg Execution Ingress</span>
                        </div>
                      </div>
                      <span className="font-mono text-[13.5px] font-black text-slate-700 leading-none">174 ms</span>
                    </div>
                  </div>
                </div>

                {/* B. AI 建模建议 */}
                <div className="bg-white border border-slate-200 rounded-md p-5 shadow-3xs space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <h3 className="text-xs font-black text-slate-805 flex items-center gap-1.5 leading-none">
                      <Sparkles className="w-4 h-4 text-blue-500 animate-pulse" />
                      B. AI 建模建议
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {[
                      {
                        title: '挂载 semantic_classification 算法',
                        desc: '当前语义实体为 Field 字段。AI 推荐挂载 semantic_classification 函数极速预测物理拓扑角色元数据。',
                      },
                      {
                        title: '注入 scoring 逻辑校验算子',
                        desc: '为过滤漂移空极特征值，建议在动作绑定层增加 quality_score_compute 语义检验评分模型并同步。',
                      },
                      {
                        title: '设定流式延迟解耦加载',
                        desc: '对于高维特征比对等平均由于外部拉取耗时大于 500ms 的模型算法，建议选择异步防单点故障解耦。',
                      }
                    ].map((sug, idx) => {
                      return (
                        <div key={idx} className="p-3 rounded-lg border border-blue-50/70 bg-blue-50/25 text-[11px] leading-relaxed flex flex-col justify-between gap-1 hover:bg-blue-50/40 transition-all font-sans">
                          <div className="flex items-start gap-2">
                            <span className="text-blue-550 text-xs mt-0.5 shrink-0 select-none">💡</span>
                            <div>
                              <span className="font-extrabold text-slate-800 block leading-tight text-[11px]">{sug.title}</span>
                              <p className="text-[9.5px] text-slate-400 mt-1.5 leading-relaxed font-semibold">{sug.desc}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* C. 风险提示 */}
                <div className="bg-white border border-slate-200 rounded-md p-5 shadow-3xs space-y-3.5">
                  <h3 className="text-xs font-black text-slate-805 flex items-center gap-1.5 border-b border-slate-100 pb-2.5 leading-none">
                    <ShieldAlert className="w-4 h-4 text-amber-500" />
                    C. 风险提示
                  </h3>

                  <div className="space-y-3 font-semibold text-[10px] leading-relaxed text-slate-500 font-sans">
                    <div className="flex items-start gap-2">
                      <span className="text-xs shrink-0 mt-0.5 select-none">⚠️</span>
                      <p>未在 Schema 入参及响应体关联安全验证防篡，存在跨节点拦截和未授权泄漏隐患。</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-xs shrink-0 mt-0.5 select-none">⚠️</span>
                      <p>在高吞吐并发回流场景，极值特征比对容易发生算子在沙箱事务超时，造成管道事务回溯。</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-xs shrink-0 mt-0.5 select-none">⚠️</span>
                      <p>未对同步被调算子部署逆向补偿机制。一旦核心节点通信丢包重试失败将可能引发全局死锁。</p>
                    </div>
                  </div>
                </div>
              </>
            ) : wizardActiveStep === 6 ? (
              <>
                {/* A. 创建摘要 */}
                <div className="bg-white border border-slate-200 rounded-md p-5 shadow-3xs space-y-4 select-none">
                  <h3 className="text-xs font-black text-slate-805 flex items-center gap-1.5 border-b border-slate-100 pb-2.5 leading-none">
                    <List className="w-4 h-4 text-blue-500 animate-[pulse_2s_infinite]" />
                    A. 创建摘要
                  </h3>
                  
                  <div className="space-y-3 font-semibold text-[11px] text-slate-600">
                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                      <span>对象</span>
                      <span className="font-bold text-slate-805">{wizardObjName}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                      <span>当前状态</span>
                      <span className="px-2 py-0.5 rounded-md text-[9.5px] bg-orange-50 border border-orange-150 text-orange-650 font-black">Draft</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                      <span>预计创建结果</span>
                      <span className="text-slate-500 text-[10px] font-bold">进入对象模型列表</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span>可发布状态</span>
                      <span className="px-2 py-0.5 rounded-md text-[9.5px] bg-red-50 border border-rose-150 text-rose-600 font-extrabold">否</span>
                    </div>
                  </div>
                </div>

                {/* B. AI 建模建议 */}
                <div className="bg-white border border-slate-200 rounded-md p-5 shadow-3xs space-y-3.5">
                  <h3 className="text-xs font-black text-slate-805 flex items-center gap-1.5 border-b border-slate-100 pb-2.5 leading-none">
                    <Sparkles className="w-4 h-4 text-blue-500 animate-pulse" />
                    B. AI 建模建议
                  </h3>

                  <div className="space-y-3.5">
                    {[
                      {
                        key: 'genMapGroup',
                        text: '建议为 generate_mapping 开启审批',
                      },
                      {
                        key: 'qualityGroup',
                        text: '建议为 qualityScore 增加规则校验',
                      },
                      {
                        key: 'hasQualityGroup',
                        text: '建议补充 has_quality 的关系说明',
                      }
                    ].map((sug) => {
                      const isAdopted = adoptedStep6Suggestions[sug.key];
                      return (
                        <div key={sug.key} className="p-3 rounded-lg border border-blue-50 bg-blue-50/25 text-[11px] leading-relaxed flex items-center justify-between gap-2 hover:bg-blue-50/50 transition-all font-sans">
                          <div className="flex items-start gap-1.5 min-w-0">
                            <span className="text-blue-550 text-xs shrink-0 select-none">💡</span>
                            <span className="font-extrabold text-slate-700 text-[10px] leading-snug truncate">{sug.text}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setAdoptedStep6Suggestions(prev => ({ ...prev, [sug.key]: !isAdopted }));
                              if (!isAdopted) {
                                showToast(`✓ 已采纳建议：「${sug.text}」`, 'success');
                              } else {
                                showToast(`撤销采纳该建议`, 'info');
                              }
                            }}
                            className={`px-2.5 py-0.5 font-bold text-[9.5px] rounded-md transition-all shrink-0 cursor-pointer ${
                              isAdopted
                                ? 'bg-emerald-50 border border-emerald-300 text-emerald-700'
                                : 'bg-white border border-blue-300 hover:bg-blue-50 text-blue-650'
                            }`}
                          >
                            {isAdopted ? '已采纳' : '采纳'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* C. 风险提示 */}
                <div className="bg-white border border-slate-200 rounded-md p-5 shadow-3xs space-y-3.5">
                  <h3 className="text-xs font-black text-slate-855 flex items-center gap-1.5 border-b border-slate-100 pb-2.5 leading-none">
                    <ShieldAlert className="w-4 h-4 text-slate-550" />
                    C. 风险提示
                  </h3>

                  <div className="space-y-2.5 font-sans font-extrabold text-[11px]">
                    <div className="flex items-center gap-2 text-rose-700 bg-rose-50/40 border border-rose-100/50 rounded-lg py-2 px-3 shadow-3xs">
                      <span className="text-rose-500 text-xs shrink-0 select-none">🔴</span>
                      <p>1 个阻断项未修复</p>
                    </div>
                    <div className="flex items-center gap-2 text-red-650 bg-red-50/40 border border-red-100/50 rounded-lg py-2 px-3 shadow-3xs">
                      <span className="text-rose-500 text-xs shrink-0 select-none">🔴</span>
                      <p>1 个高风险动作未审批</p>
                    </div>
                    <div className="flex items-center gap-2 text-amber-600 bg-amber-50/40 border border-amber-100/50 rounded-lg py-2 px-3 shadow-3xs">
                      <span className="text-amber-500 text-xs shrink-0 select-none">⚠️</span>
                      <p>2 个警告建议优化</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* 1. 对象预览 (Object Preview) Card */}
                <div className="bg-white border border-slate-200 rounded-md p-5 shadow-3xs space-y-4">
                  <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
                    <Eye className="w-4 h-4 text-blue-500" />
                    对象预览
                  </h3>

                  <div className="flex flex-col items-center justify-center py-2.5 bg-gradient-to-b from-slate-50/80 to-transparent border border-slate-200 rounded-md font-sans">
                    {/* Simulated 3D cube colored blue */}
                    <div className="h-14 w-14 rounded-2xl bg-blue-50 border border-blue-150 shadow-inner flex items-center justify-center text-blue-650">
                      <Database className="w-7 h-7 stroke-[2]" />
                    </div>
                    <h4 className="text-[13.5px] font-black text-slate-900 mt-2 font-mono">{wizardObjName}</h4>
                    <div className="mt-1.5 flex flex-col items-center gap-1 text-[10.5px] font-semibold text-slate-500 w-full px-5">
                      <div className="flex justify-between w-full border-b border-dashed border-slate-100 pb-1">
                        <span>编码: </span>
                        <span className="font-mono text-slate-800">{wizardObjCode}</span>
                      </div>
                      <div className="flex justify-between w-full border-b border-dashed border-slate-100 py-1">
                        <span>分类: </span>
                        <span className="text-slate-800">{wizardCategory}</span>
                      </div>
                      <div className="flex justify-between w-full pt-1">
                        <span>状态: </span>
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-150 px-1 py-0.5 rounded leading-none text-[9.5px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          {wizardStatus}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stat grid */}
                  <div className="grid grid-cols-4 border border-slate-200 divide-x divide-slate-200 rounded-lg overflow-hidden text-center bg-slate-50/40 leading-none">
                    <div className="py-2.5">
                      <div className="text-[13px] font-extrabold text-slate-800 leading-none">{wizardProperties.length}</div>
                      <div className="text-[9px] text-slate-400 font-bold mt-1 scale-90">属性数</div>
                    </div>
                    <div className="py-2.5">
                      <div className="text-[13px] font-extrabold text-slate-800 leading-none">{wizardLinks.length}</div>
                      <div className="text-[9px] text-slate-400 font-bold mt-1 scale-90">关系数</div>
                    </div>
                    <div className="py-2.5">
                      <div className="text-[13px] font-extrabold text-slate-800 leading-none">{wizardActions.length}</div>
                      <div className="text-[9px] text-slate-400 font-bold mt-1 scale-90">动作数</div>
                    </div>
                    <div className="py-2.5">
                      <div className="text-[13px] font-extrabold text-slate-800 leading-none">{wizardFunctions.length}</div>
                      <div className="text-[9px] text-slate-400 font-bold mt-1 scale-90">函数数</div>
                    </div>
                  </div>
                </div>

                {/* 2. AI 建模建议 (AI Modeling Suggestions) Card */}
                <div className="bg-white border border-slate-200 rounded-md p-5 shadow-3xs space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-blue-500 animate-pulse" />
                      AI 建模建议
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setWizardAiSuggestions(prev => prev.map(item => ({ ...item, isAdopted: false })));
                        showToast('🔀 已为您重新换一批语义分析建模推荐！', 'info');
                      }}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-805 cursor-pointer font-sans"
                    >
                      换一批
                    </button>
                  </div>

                  <div className="space-y-3">
                    {wizardAiSuggestions.map((sug) => (
                      <div 
                        key={sug.id} 
                        className={`p-3 rounded-lg border text-[11px] leading-relaxed transition-all flex flex-col justify-between gap-2.5 ${
                          sug.isAdopted 
                            ? 'bg-slate-50/55 border-slate-200 opacity-75' 
                            : 'bg-blue-50/30 border-blue-100'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div className="h-4.5 w-4.5 rounded-full bg-blue-100 text-blue-605 flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                            💡
                          </div>
                          <div>
                            <span className="font-bold text-slate-855 block leading-tight">{sug.text}</span>
                            <p className="text-[9.5px] text-slate-400 mt-1 leading-normal font-semibold font-sans">{sug.tip}</p>
                          </div>
                        </div>
                        
                        <div className="flex justify-end pt-1.5 border-t border-slate-100/65">
                          {sug.isAdopted ? (
                            <span className="text-[9.5px] text-slate-400 font-bold flex items-center gap-1 leading-none">
                              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3.5]" />
                              已置入
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAdoptWizardSuggestion(sug.id)}
                              className="px-2.5 py-0.5 bg-white border border-blue-300 hover:bg-blue-50 text-blue-650 font-bold text-[9.5px] rounded-md transition-all shadow-3xs cursor-pointer"
                            >
                              采纳建议
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. 创建提示 (Creation Tips) Card */}
                <div className="bg-white border border-slate-200 rounded-md p-5 shadow-3xs space-y-3.5">
                  <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
                    <Info className="w-4 h-4 text-slate-500" />
                    创建提示
                  </h3>

                  <div className="space-y-3 font-semibold text-[10px] leading-relaxed text-slate-500 font-sans">
                    <div className="flex items-start gap-2">
                      <span className="text-amber-500 text-xs shrink-0 mt-0.5">🕒</span>
                      <p>创建对象后建议继续完成后续属性定义与校验项对齐，以保证最终血缘推导的绝对语义完整性。</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-amber-500 text-xs shrink-0 mt-0.5">🕒</span>
                      <p>若未配置绑定图谱连接，可能影响下游对于物理表结构的自动化语义映射及可解释度质量评估。</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-amber-500 text-xs shrink-0 mt-0.5">🕒</span>
                      <p>若停用当前对象，将无法在该语义域下的全自动数据管道及大模型回流场景中被引用。</p>
                    </div>
                  </div>
                </div>
              </>
            )}

          </div>

        </div>

        {/* ================= 5. UNDER-FOOTER STICKY STATUS BAR ================= */}
        <div className="bg-white border-t border-slate-200 py-3.5 px-8 flex items-center justify-between sticky bottom-0 z-40 shadow-xl shrink-0 text-[11px] font-bold text-slate-600">
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1 text-slate-805">
              <span className="text-blue-600 font-extrabold font-sans">✓</span> 当前步骤: 
              <span className="bg-blue-50 border border-blue-150 text-blue-800 font-mono font-black px-1.5 py-0.5 rounded leading-none">
                {wizardActiveStep} / 6
              </span>
            </span>
            <div className="h-4 w-px bg-slate-200"></div>
            <span className="flex items-center gap-1 leading-none">
              已完成: 
              <span className={wizardProperties.length > 0 ? 'text-emerald-700 font-extrabold' : 'text-amber-600 font-semibold'}>
                {wizardProperties.length > 0 ? '基础属性配置完成' : '基础信息未定义齐全'}
              </span>
            </span>
            <div className="h-4 w-px bg-slate-200"></div>
            <span className="flex items-center gap-1 leading-none">
              草稿状态: 
              <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-150 px-1 py-0.5 rounded-md leading-none">
                <span className="h-1.5 w-1.5 bg-amber-500 rounded-full animate-ping"></span>
                未保存至主库
              </span>
            </span>
            <div className="h-4 w-px bg-slate-200"></div>
            <span className="flex items-center gap-1 leading-none">
              校验状态: 
              {validationSuccess ? (
                <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-150 px-1.5 py-0.5 rounded-md">
                  ✓ 核对通过
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded-md">
                  🔃 待启动校验
                </span>
              )}
            </span>
            <div className="h-4 w-px bg-slate-200 block md:hidden lg:block"></div>
            <span className="hidden md:inline-flex items-center gap-1 leading-none">
              关联主名称: <span className="font-mono text-slate-800">{wizardObjName}</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setIsAddingObjectType(false);
                showToast('已关闭引导，已返回对象类型主页');
              }}
              className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-all shadow-3xs cursor-pointer"
            >
              返回对象模型列表
            </button>
            <button
              onClick={() => {
                showToast('💾 当前向导内部信息已被临时缓存在本地！', 'success');
              }}
              className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all shadow-3xs cursor-pointer flex items-center gap-1"
            >
              <ClipboardList className="w-3.5 h-3.5 text-slate-400" />
              保存草稿
            </button>
            <button
              onClick={() => {
                if (wizardActiveStep < 6) {
                  setWizardActiveStep(wizardActiveStep + 1);
                } else {
                  // Final Creation Submit
                  if (!wizardObjCode || !wizardObjName) {
                    showToast('核心名称 or 编码不能为空！', 'warn');
                    return;
                  }
                  const newCodeCapitalized = wizardObjCode.charAt(0).toUpperCase() + wizardObjCode.slice(1);
                  setObjects({
                    ...objects,
                    [newCodeCapitalized]: {
                      id: newCodeCapitalized,
                      nameCn: wizardObjName,
                      category: 'DATA',
                      status: wizardStatus,
                      lifecycle: 'Draft',
                      desc: wizardDesc,
                      properties: wizardProperties.length > 0 ? wizardProperties : [
                        { id: '1', name: '对象标识ID', code: `${wizardObjCode}Id`, dataType: 'String', semanticType: 'ID', isRequired: true, defaultValue: '-', desc: '全局唯一标识' }
                      ],
                      links: wizardLinks,
                      actions: wizardActions,
                      functions: wizardFunctions,
                      workflows: [{ name: 'semantic_governance_workflow', badge: '8 steps' }]
                    }
                  });
                  onSelectObject(newCodeCapitalized);
                  setIsAddingObjectType(false);
                  showToast(`🎉 成功在沙箱中新增并注入对象模型: ${wizardObjName} (${newCodeCapitalized})`, 'success');
                }
              }}
              className="px-4 py-2 bg-[#0052cc] hover:bg-blue-750 text-white rounded-lg text-xs font-bold transition-all shadow-sm shadow-blue-550/10 cursor-pointer inline-flex items-center gap-1 border border-[#0052cc]"
            >
              <span>{wizardActiveStep === 6 ? '完成并创建模型' : '下一步 →'}</span>
            </button>
          </div>
        </div>

      </div>
    );
  }

  return (
    <div className="min-h-full font-sans bg-transparent flex flex-col select-none" id="dkn-ontology-studio-workspace">
      
      {/* 🔮 SLICK FLOATING TOASTS */}
      {toast && (
        <div className="fixed top-16 right-6 z-50 bg-slate-900 text-white rounded-md px-4 py-3 shadow-xl border border-slate-800 flex items-center gap-2.5 animate-fade-in text-[12.5px] font-semibold">
          <SparkleIcon className="w-4.5 h-4.5 text-amber-400 shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* ================= 1. DKN PAGE HEADER ================= */}
      <DknPageHeader />
      {/* 选项卡 Tabs 区域 */}
      <div className="bg-white rounded-lg border border-slate-200 p-1 shadow-3xs flex items-center justify-between flex-wrap gap-1 mb-5 shrink-0">
        <div className="flex items-center space-x-1 overflow-x-auto scrollbar-none py-0.5 px-1 max-w-full">
          {[
            '模型总览', '对象模型', '关系模型', '函数', '动作', '流程', '权限策略', '发布'
          ].map((tab) => {
            const isActive = tab === '对象模型';
            return (
              <button
                key={tab}
                onClick={() => {
                  if (tab === '模型总览') onNavigate('dkn_overview');
                  else if (tab === '对象模型') onNavigate('dkn_object_model');
                  else if (tab === '关系模型') onNavigate('relation_model');
                  else if (tab === '函数') onNavigate('capability_binding');
                  else if (tab === '动作') onNavigate('action_model');
                  else if (tab === '流程') onNavigate('workflow_orchestration');
                  else if (tab === '发布') onNavigate('change_release');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all whitespace-nowrap ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-2xs' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                {tab === '模型总览' ? '📊 模型总览' : tab}
              </button>
            );
          })}
        </div>
        <div className="hidden sm:flex items-center gap-1.5 pr-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[10px] font-mono font-bold text-slate-400">Sandbox.Active</span>
        </div>
      </div>


      {/* ================= 2. THREE-PANEL CORE GRID WORKSPACE ================= */}
      <div className="flex-1 p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch overflow-hidden">
        
        {/* ================= COLUMN 1: LEFT SIDEBAR (Width: 2.2/12) ================= */}
        {!sidebarCollapsed && (
          <div className="lg:col-span-2.5 xl:col-span-2.2 bg-white border border-slate-200 rounded-md p-4 flex flex-col justify-between shadow-3xs">
            
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="搜索对象类型..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all font-medium text-slate-800"
                />
              </div>

              {/* Sidebar Heavy Call to Action Add Object type */}
              <button 
                onClick={() => {
                  setWizardActiveStep(1);
                  setWizardObjName('Field');
                  setWizardObjCode('field');
                  setWizardCategory('数据对象');
                  setWizardStatus('启用');
                  setWizardDesc('表示销售域中用于描述数据字段的对象，承载字段语义、数据类型、质量与来源等信息。');
                  setWizardLifecycle('标准生命周期');
                  setWizardPrimaryId('fieldId');
                  setWizardSourceType('表结构映射');
                  setWizardAllowRef(true);
                  setWizardAllowAction(true);
                  setWizardAllowFunc(true);
                  setWizardProperties([]);
                  setWizardLinks([
                    'Dataset -> contains -> Field',
                    'Field -> has_quality -> DataQuality',
                    'Field -> mapped_to -> Mapping'
                  ]);
                  setWizardActions([
                    'infer_field_semantics',
                    'calculate_data_quality'
                  ]);
                  setWizardFunctions([
                    { name: 'semantic_classification', badge: 'In 4 / Out 1' },
                    { name: 'quality_score_compute', badge: 'In 3 / Out 1' }
                  ]);
                  setWizardAiSuggestions([
                    { id: 'was1', text: '建议将 Field 设为 "数据对象"。', isAdopted: false, tip: '将分类变更为数据层级的基础节点，优化血缘分类' },
                    { id: 'was2', text: '建议默认主标识属性使用 fieldId。', isAdopted: false, tip: '强制绑定语义规范标识符提高全局可解析度' },
                    { id: 'was3', text: '建议启用动作挂载，便于后续自动化处理。', isAdopted: false, tip: '允许调用infer_field_semantics算子执行语义识别' }
                  ]);
                  setValidationSuccess(false);
                  setIsAddingObjectType(true);
                  showToast('🛠️ 已开启新增对象高保真建模引导流程', 'info');
                }}
                className="w-full bg-blue-600 hover:bg-blue-750 text-white font-bold text-xs py-2 px-4 rounded-lg flex items-center justify-center gap-1.5 shadow-sm shadow-blue-550/10 cursor-pointer transition-all"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                新建对象类型
              </button>

              {/* Sidebar Entities List */}
              <div className="space-y-1 max-h-[360px] overflow-y-auto pr-1">
                {sidebarList.map((obj) => {
                  const isSelected = obj.id === activeObj.id;
                  const countVal = getObjectCount(obj.id);
                  const isGrayState = obj.status === '禁用';

                  return (
                    <div
                      key={obj.id}
                      onClick={() => onSelectObject(obj.id)}
                      className={`group p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                          : 'bg-white border-transparent hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded-md ${
                          isSelected ? 'bg-blue-500 text-white' : getObjectIconColorClass(obj.id)
                        }`}>
                          <Database className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className={`text-xs font-bold font-mono tracking-tight ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                            {obj.id}
                          </p>
                          <p className={`text-[10px] ${isSelected ? 'text-blue-100' : 'text-slate-400'} font-semibold`}>
                            {obj.nameCn}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          isGrayState ? 'bg-slate-300' : 'bg-emerald-500 animate-pulse'
                        }`}></span>
                        <span className={`text-[11px] font-mono font-black ${isSelected ? 'text-white' : 'text-slate-500'}`}>
                          {countVal}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions Panel inside sidebar */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="space-y-1.5">
                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">快速模板</h4>
                {[
                  { title: '从数据源开始建模', id: 'DataSource' },
                  { title: '从字段理解开始建模', id: 'Field' },
                  { title: '从质量治理开始建模', id: 'DataQuality' }
                ].map((tmpl, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      onSelectObject(tmpl.id);
                      showToast(`💡 已切至「${tmpl.id}」推荐分析流！`, 'info');
                    }}
                    className="w-full text-left text-[11px] font-bold text-slate-600 hover:text-blue-600 bg-slate-50 border border-slate-200 p-2 rounded-lg flex items-center justify-between transition-all group cursor-pointer"
                  >
                    <span>{tmpl.title}</span>
                    <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-blue-650 transition-colors" />
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setSidebarCollapsed(true)}
                className="w-full py-1.5 text-center text-[11px] font-black text-slate-400 hover:text-slate-700 bg-slate-100/50 hover:bg-slate-100 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all"
              >
                <ArrowLeft className="w-3 h-3" />
                收起侧栏
              </button>
            </div>

          </div>
        )}

        {/* Collapsed Sidebar Handle */}
        {sidebarCollapsed && (
          <div className="lg:col-span-0.5 bg-white border border-slate-200 rounded-md flex flex-col items-center py-4 px-1 shadow-3xs cursor-pointer hover:bg-slate-50" onClick={() => setSidebarCollapsed(false)}>
            <div className="space-y-6 flex flex-col items-center">
              <ArrowRight className="w-4 h-4 text-slate-400" />
              <div className="h-4 p-px bg-slate-300"></div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest [writing-mode:vertical-lr] text-center">展开对象树</span>
            </div>
          </div>
        )}

        {/* ================= COLUMN 2: CENTER RICH ONTOLOGY VISUAL CANVAS (Width: 6.8/12) ================= */}
        <div className={`${sidebarCollapsed ? 'lg:col-span-8.5' : 'lg:col-span-7'} xl:col-span-6.8 flex flex-col justify-between space-y-4`}>
          
          <div className="bg-white border border-slate-200 rounded-md p-5 shadow-3xs flex-1 flex flex-col justify-between relative overflow-hidden">
            
            {/* Header Title inside Visual Area */}
            <div className="flex items-center justify-between z-10">
              <div>
                <h1 className="text-xl font-bold font-sans text-slate-900 tracking-tight flex items-center gap-2">
                  Ontology 建模工作台
                  <span className="text-xs font-bold text-blue-600 bg-blue-55/60 border border-blue-100 rounded-full px-2 py-0.2 font-mono">v1.0.0 Draft</span>
                </h1>
                <p className="text-[11.5px] text-slate-400 font-semibold mt-0.5">
                  以对象为中心构建知识网络本体，并逐步补全关系、动作、函数与流程
                </p>
              </div>

              {/* Simple Quick Indicator Badge / Settings */}
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => setIsEditObjOpen(true)}
                  className="px-2.5 py-1 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Edit2 className="w-3 h-3 text-slate-500" />
                  编辑属性
                </button>
              </div>
            </div>

            {/* ================= MIDDLE CORE VISUAL DIAGRAM NETWORK ================= */}
            <div className="relative flex-1 min-h-[460px] flex items-center justify-center my-4">
              
              {/* BACKGROUND SVG CONNECTIONS (Curved Bezier Paths matching layout) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minHeight: '430px' }}>
                <defs>
                  <linearGradient id="blueGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.4" />
                  </linearGradient>
                  {/* Glowing Animated Orbs Pattern */}
                  <radialGradient id="bulletPoint" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="1" />
                    <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Left Top Connection (Link Types) */}
                <path 
                  d="M 230 140 C 290 140, 240 230, 310 230" 
                  fill="none" 
                  stroke="url(#blueGlow)" 
                  strokeWidth="2" 
                  strokeDasharray="4 4"
                />
                <circle cx="270" cy="180" r="3" fill="#3b82f6" className="animate-pulse" />

                {/* Left Bottom Connection (Functions) */}
                <path 
                  d="M 230 330 C 290 330, 240 260, 310 250" 
                  fill="none" 
                  stroke="url(#blueGlow)" 
                  strokeWidth="2" 
                  strokeDasharray="4 4"
                />
                <circle cx="265" cy="275" r="3" fill="#10b981" />

                {/* Right Top Connection (Action Types) */}
                <path 
                  d="M 500 140 C 440 140, 480 230, 410 230" 
                  fill="none" 
                  stroke="url(#blueGlow)" 
                  strokeWidth="2" 
                  strokeDasharray="4 4"
                />
                <circle cx="455" cy="190" r="3" fill="#6366f1" />

                {/* Right Bottom Connection (Workflow) */}
                <path 
                  d="M 500 330 C 440 330, 480 260, 410 250" 
                  fill="none" 
                  stroke="url(#blueGlow)" 
                  strokeWidth="2" 
                  strokeDasharray="4 4"
                />
                <circle cx="450" cy="280" r="3" fill="#f97316" className="animate-pulse" />
              </svg>

              {/* 1. TOP-LEFT: 关系 (Link Types) */}
              <div className="absolute top-4 left-4 w-72 bg-white border border-slate-200 rounded-md p-3.5 shadow-xs flex flex-col justify-between min-h-[178px] hover:shadow-md hover:border-blue-200 transition-all">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                      <div className="p-1 rounded-md bg-blue-50 text-blue-600">
                        <Link2 className="w-3.5 h-3.5" />
                      </div>
                      <span>关系 (Link Types)</span>
                    </div>

                    <span className="text-[10px] font-mono font-black text-slate-400">CS_L_04</span>
                  </div>

                  <ul className="space-y-1.5 text-[11px] font-semibold text-slate-500">
                    {activeObj.links.length === 0 ? (
                      <li className="text-[10px] text-slate-400 italic py-3 text-center">暂未建立关联实体关系</li>
                    ) : (
                      activeObj.links.map((lnk, idx) => {
                        const isPrimary = idx < 3;
                        return (
                          <li key={idx} className="flex items-center justify-between bg-slate-50/50 hover:bg-slate-200 p-1 rounded transition-colors group">
                            <span className="font-mono text-slate-700 truncate block max-w-[210px]">{lnk}</span>
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isPrimary ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                          </li>
                        );
                      })
                    )}
                  </ul>
                </div>

                <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-slate-100">
                  <button 
                    onClick={() => {
                      setNewLinkSource(activeObj.id);
                      setIsAddLinkOpen(true);
                    }}
                    className="flex-1 py-1 px-3 bg-slate-50 hover:bg-blue-50 text-blue-600 hover:text-blue-700 rounded-lg text-[10.5px] font-bold border border-slate-200 hover:border-blue-200 transition-all flex items-center justify-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    添加关系
                  </button>
                  <button 
                    onClick={() => {
                      alert(`【${activeObj.nameCn}】当前拓扑共关系: ${activeObj.links.length} 个。`);
                    }}
                    className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-400 hover:text-slate-700 rounded-lg transition-all"
                    title="关系分布统计"
                  >
                    <GitBranch className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 2. BOTTOM-LEFT: 函数 (Functions) */}
              <div className="absolute bottom-4 left-4 w-72 bg-white border border-slate-200 rounded-md p-3.5 shadow-xs flex flex-col justify-between min-h-[178px] hover:shadow-md hover:border-emerald-200 transition-all">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                      <div className="p-1 rounded bg-emerald-50 text-emerald-600">
                        <Code className="w-3.5 h-3.5" />
                      </div>
                      <span>函数 (Functions)</span>
                    </div>

                    <span className="text-[10px] font-mono font-black text-slate-400">CS_F_03</span>
                  </div>

                  <ul className="space-y-1.5 text-[11px] font-semibold text-slate-500">
                    {activeObj.functions.length === 0 ? (
                      <li className="text-[10px] text-slate-400 italic py-3 text-center">暂未载入任何模型计算函数</li>
                    ) : (
                      activeObj.functions.map((f, i) => (
                        <li key={i} className="flex items-center justify-between bg-slate-50/50 p-1 rounded">
                          <span className="font-mono text-slate-700 truncate max-w-[150px]" title={f.name}>{f.name}</span>
                          <span className="text-[9.5px] font-mono font-black text-slate-400 bg-slate-100 px-1 py-0.2 rounded scale-90">
                            {f.badge}
                          </span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>

                <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-slate-100">
                  <button 
                    onClick={() => setIsAddFuncOpen(true)}
                    className="flex-1 py-1 px-2 text-[10.5px] font-bold text-slate-600 hover:text-emerald-700 bg-slate-50 hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-250 rounded-lg flex items-center justify-center gap-0.5 cursor-pointer transition-all"
                  >
                    <Plus className="w-3 h-3" />
                    绑定函数
                  </button>
                  <button 
                    onClick={() => {
                      showToast(`⚙️ [${activeObj.nameCn}] 的 ${activeObj.functions.length} 个特征函数全部模拟执行成功！`, 'success');
                    }}
                    className="flex-1 py-1 px-2 text-[10.5px] font-bold text-slate-600 hover:text-blue-700 bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-250 rounded-lg flex items-center justify-center gap-0.5 cursor-pointer transition-all"
                  >
                    <Play className="w-2.5 h-2.5 inline fill-current animate-pulse text-blue-500" />
                    测试运行
                  </button>
                </div>
              </div>

              {/* 3. CENTER CARD (Field / DataSource / Dataset / etc) */}
              <div className="w-60 bg-white border-2 border-blue-600 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all relative z-25 text-center flex flex-col justify-between min-h-[220px]">
                
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-2">
                    <div className="p-1 px-2 rounded-lg bg-blue-600 text-white font-extrabold text-xs">
                      <Layers className="w-4 h-4 inline" />
                    </div>
                    <h2 className="text-sm font-black text-slate-900 tracking-tight font-mono">
                      {activeObj.id} <span className="text-slate-500 font-sans text-xs">({activeObj.nameCn})</span>
                    </h2>
                  </div>

                  <div className="text-[10px] text-slate-400 font-bold font-mono py-0.5">
                    Code: {activeObj.id.toLowerCase()}
                  </div>

                  <p className="text-[10.5px] font-semibold text-slate-500 leading-relaxed py-1.5 text-left border-y border-slate-100">
                    <span className="font-extrabold text-slate-600 block mb-0.5 text-[9.5px] uppercase tracking-wider">描述：</span>
                    {activeObj.desc}
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-400 font-extrabold">状态：</span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50/50 border border-emerald-100 rounded px-1 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                      启用
                    </span>
                  </div>

                  {/* Core Properties Preview */}
                  <div className="space-y-1 text-left">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">核心属性预览:</span>
                    <div className="flex flex-wrap gap-1">
                      {activeObj.properties.map((p) => (
                        <span key={p.id} className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50/60 border border-indigo-100 rounded px-1">
                          {p.code}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={() => setIsEditObjOpen(true)}
                    className="w-full py-1.5 text-[11px] font-bold text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-200 hover:border-blue-700 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                    编辑属性
                  </button>
                </div>

              </div>

              {/* 4. TOP-RIGHT: 动作 (Action Types) */}
              <div className="absolute top-4 right-4 w-72 bg-white border border-slate-200 rounded-md p-3.5 shadow-xs flex flex-col justify-between min-h-[178px] hover:shadow-md hover:border-violet-200 transition-all">
                
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                      <div className="p-1 rounded bg-violet-50 text-violet-600">
                        <Activity className="w-3.5 h-3.5" />
                      </div>
                      <span>动作 (Action Types)</span>
                    </div>

                    <span className="text-[10px] font-mono font-black text-slate-400">CS_ACT_02</span>
                  </div>

                  <ul className="space-y-1.5 text-[11px] font-semibold text-slate-500">
                    {activeObj.actions.length === 0 ? (
                      <li className="text-[10px] text-slate-400 py-3 text-center italic">暂未绑定执行动作</li>
                    ) : (
                      activeObj.actions.map((act, i) => {
                        const isToggled = actionToggles[act] !== false;
                        const riskBadge = i % 2 === 0 ? '低风险' : (i % 3 === 0 ? '高风险' : '中风险');
                        const badgeColor = riskBadge === '低风险' ? 'bg-emerald-50 text-emerald-600 text-[10px]' : (riskBadge === '高风险' ? 'bg-red-50 text-red-650 text-[10px]' : 'bg-amber-50 text-amber-600 text-[10px]');
                        
                        return (
                          <li key={i} className="flex items-center justify-between bg-slate-50/50 p-1 rounded">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-slate-700 truncate max-w-[130px]" title={act}>{act}</span>
                              <span className={`px-1 py-0.2 rounded ${badgeColor} text-[9px]`}>{riskBadge}</span>
                            </div>

                            {/* Simulated Toggle Switch */}
                            <div 
                              onClick={() => {
                                setActionToggles({ ...actionToggles, [act]: !isToggled });
                                showToast(`💡 已将动作 ${act} 状态切换为: ${!isToggled ? "启用" : "禁用"}`, 'info');
                              }}
                              className={`w-9 h-4.5 rounded-full p-0.5 cursor-pointer flex items-center transition-colors ${isToggled ? 'bg-blue-600 justify-end' : 'bg-slate-200 justify-start'}`}
                            >
                              <span className="w-3.5 h-3.5 rounded-full bg-white shadow-xs"></span>
                            </div>
                          </li>
                        );
                      })
                    )}
                  </ul>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-100">
                  <button 
                    onClick={() => setIsAddActionOpen(true)}
                    className="w-full py-1 bg-slate-50 hover:bg-violet-50 text-violet-600 hover:text-violet-700 rounded-lg text-[10.5px] font-bold border border-slate-200 hover:border-violet-250 transition-all flex items-center justify-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    绑定动作
                  </button>
                </div>

              </div>

              {/* 5. BOTTOM-RIGHT: 流程 (Workflows) */}
              <div className="absolute bottom-4 right-4 w-72 bg-white border border-slate-200 rounded-md p-3.5 shadow-xs flex flex-col justify-between min-h-[178px] hover:shadow-md hover:border-orange-200 transition-all">
                
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                      <div className="p-1 rounded bg-orange-50 text-orange-600">
                        <Workflow className="w-3.5 h-3.5" />
                      </div>
                      <span>流程 (Workflow)</span>
                    </div>

                    <span className="text-[10px] font-mono font-black text-slate-400">CS_W_02</span>
                  </div>

                  <ul className="space-y-1.5 text-[11px] font-semibold text-slate-500">
                    {activeObj.workflows.length === 0 ? (
                      <li className="text-[10px] text-slate-400 py-3 text-center italic">暂无流转关联流程</li>
                    ) : (
                      activeObj.workflows.map((flow, i) => (
                        <li key={i} className="flex items-center justify-between bg-slate-50/50 p-1.5 rounded">
                          <span className="font-mono text-slate-700 truncate max-w-[150px]" title={flow.name}>{flow.name}</span>
                          <span className="text-[9.5px] text-orange-700 font-extrabold bg-orange-50/80 px-1.5 py-0.2 rounded border border-orange-100 shrink-0">
                            {flow.badge}
                          </span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>

                <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-slate-100">
                  <button 
                    onClick={() => {
                      showToast('🔮 大模型正在智能分析该对象实体，正在编排标准治理流程...', 'info');
                      setTimeout(() => {
                        const updated = [...activeObj.workflows];
                        const newFlName = `${activeObj.id.toLowerCase()}_governance_auto_flow`;
                        if (!updated.some(u => u.name === newFlName)) {
                          updated.push({ name: newFlName, badge: '6 steps' });
                          setObjects({
                            ...objects,
                            [activeObj.id]: { ...activeObj, workflows: updated }
                          });
                          showToast(`✨ 成功一键生成流程：${newFlName}！`, 'success');
                        } else {
                          showToast('标准治理流已完成部署编排。', 'info');
                        }
                      }, 1100);
                    }}
                    className="flex-1 py-1 px-2.5 bg-slate-50 hover:bg-orange-50 text-orange-600 hover:text-orange-700 rounded-lg text-[10.5px] font-bold border border-slate-200 hover:border-orange-250 transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Sparkle className="w-3 h-3 text-amber-500" />
                    生成流程
                  </button>
                  <button 
                    onClick={() => setIsViewDagOpen(true)}
                    className="flex-1 py-1 px-2.5 bg-slate-50 hover:bg-blue-50 text-blue-600 hover:text-blue-700 rounded-lg text-[10.5px] font-bold border border-slate-200 hover:border-blue-250 transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Network className="w-3 h-3" />
                    查看 DAG
                  </button>
                </div>

              </div>

            </div>

            {/* ================= BOTTOM STEP PROGRESS WIZARD BAR ================= */}
            <div className="border-t border-slate-100 pt-3 mt-2 flex items-center justify-center">
              <div className="flex items-center gap-2 max-w-xl text-center flex-wrap justify-center text-xs text-slate-400 font-bold">
                
                <div className="flex items-center gap-1">
                  <span className="w-5 h-5 rounded-full border border-emerald-500 text-emerald-500 flex items-center justify-center text-[10.5px] font-mono bg-emerald-50">1</span>
                  <span>选择对象</span>
                </div>

                <div className="h-0.5 w-6 bg-slate-200 inline-block"></div>

                <div className="flex items-center gap-1 font-black text-blue-600 bg-blue-50/50 px-2.5 py-1 rounded-full border border-blue-200">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-mono shadow-xs">2</span>
                  <span>补充关系</span>
                </div>

                <div className="h-0.5 w-6 bg-slate-200 inline-block"></div>

                <div className="flex items-center gap-1">
                  <span className="w-5 h-5 rounded-full border border-slate-200 flex items-center justify-center text-[10.5px] font-mono">3</span>
                  <span>绑定动作</span>
                </div>

                <div className="h-0.5 w-6 bg-slate-200 inline-block"></div>

                <div className="flex items-center gap-1">
                  <span className="w-5 h-5 rounded-full border border-slate-200 flex items-center justify-center text-[10.5px] font-mono">4</span>
                  <span>绑定函数</span>
                </div>

                <div className="h-0.5 w-6 bg-slate-200 inline-block"></div>

                <div className="flex items-center gap-1">
                  <span className="w-5 h-5 rounded-full border border-slate-200 flex items-center justify-center text-[10.5px] font-mono">5</span>
                  <span>生成流程</span>
                </div>

                <div className="h-0.5 w-6 bg-slate-200 inline-block"></div>

                <div className="flex items-center gap-1">
                  <span className="w-5 h-5 rounded-full border border-slate-200 flex items-center justify-center text-[10.5px] font-mono">6</span>
                  <span>校验与发布</span>
                </div>

              </div>
            </div>

          </div>

        </div>

        {/* ================= COLUMN 3: RIGHT PANEL (Width: 3/12) ================= */}
        <div className="lg:col-span-3 space-y-4 flex flex-col justify-between">
          
          {/* Section 1: AI Suggestions */}
          <div className="bg-white border border-slate-200 rounded-md p-4 shadow-3xs space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1 text-xs font-black text-slate-800 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-violet-600" />
                <span>AI Suggestions</span>
              </div>

              <button 
                onClick={handleAdoptAllSuggestions}
                className="text-[10px] font-black text-white bg-violet-600 hover:bg-violet-700 px-2 py-1 rounded shadow-3xs transition-all flex items-center gap-1"
              >
                一键补全全建模建议
              </button>
            </div>

            <div className="space-y-1.5">
              {aiSuggestions.map((sug) => (
                <div key={sug.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-start justify-between gap-2">
                  <p className="text-[11px] font-semibold text-slate-600 leading-relaxed max-w-[210px] break-words">
                    {sug.text}
                  </p>

                  <button
                    disabled={sug.isAdopted}
                    onClick={() => handleAdoptSuggestion(sug.id)}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded flex shrink-0 cursor-pointer ${
                      sug.isAdopted 
                        ? 'bg-slate-200 text-slate-400 border border-transparent font-medium' 
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-blue-600 hover:text-white hover:border-blue-700'
                    }`}
                  >
                    {sug.isAdopted ? '已采纳' : '采纳'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Impact Analysis */}
          <div className="bg-white border border-slate-200 rounded-md p-4 shadow-3xs space-y-3">
            <div className="flex items-center gap-1 text-xs font-black text-slate-800 uppercase border-b border-slate-100 pb-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span>2. Impact Analysis</span>
            </div>

            {/* Micro statistic grids */}
            <div className="grid grid-cols-4 gap-1">
              {[
                { title: 'Link 影响', count: 4, color: 'text-blue-600 bg-blue-50/50 border-blue-100' },
                { title: 'Action 影响', count: 5, color: 'text-purple-600 bg-purple-50/50 border-purple-100' },
                { title: 'Function 影响', count: 3, color: 'text-emerald-600 bg-emerald-50/50 border-emerald-100' },
                { title: 'Workflow 影响', count: 2, color: 'text-orange-600 bg-orange-50/50 border-orange-100' }
              ].map((stat, i) => (
                <div key={i} className={`p-1 text-center rounded border ${stat.color}`}>
                  <p className="text-[8.5px] font-extrabold text-slate-400 truncate scale-95">{stat.title}</p>
                  <p className="text-sm font-black mt-1 font-mono">{stat.count}</p>
                </div>
              ))}
            </div>

            <div className="space-y-1.5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">受影响项 (4)</p>
              <ul className="space-y-1 flex flex-col">
                {[
                  'semantic_governance_workflow',
                  'mapping_validation_workflow',
                  'assertion_builder',
                  'field_query_semantics'
                ].map((eff, i) => (
                  <li key={i} className="text-[10.5px] font-semibold text-slate-500 pl-2 border-l border-slate-300 flex items-center justify-between">
                    <span className="font-mono truncate max-w-[190px]">{eff}</span>
                    <span className="text-[8.5px] scale-90 border border-slate-200 text-slate-400 font-bold px-1 rounded bg-slate-50 shrink-0">流转</span>
                  </li>
                ))}
              </ul>
            </div>

            <button 
              onClick={() => alert(`【${activeObj.nameCn} (${activeObj.id})】血缘传导感知度链路计算完成！\n本次涉及直接传导：11个，潜在耦合：3个。`)}
              className="w-full py-1.5 text-center text-[11px] font-black text-blue-600 hover:text-blue-800 bg-blue-50/30 hover:bg-blue-50 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all border border-blue-105"
            >
              <span>查看详情</span>
              <ArrowRight className="w-3 h-3 text-blue-600" />
            </button>
          </div>

          {/* Section 3: Model Notes */}
          <div className="bg-amber-50/80 border border-amber-250 rounded-md p-4 text-[11px] leading-relaxed text-amber-800 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 font-black text-amber-900 border-b border-amber-200 pb-1.5 mb-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>3. Model Notes</span>
            </div>

            <ul className="list-disc pl-3.5 space-y-1.5 font-semibold text-amber-800">
              <li>当前对象为核心治理对象，建议优先完成关系与动作绑定。</li>
              <li>停用 <span className="font-mono font-bold px-1 bg-amber-100 rounded text-amber-905">{activeObj.id}</span> 将影响字段理解、映射建议与任务生成。</li>
              <li>发布前建议完成模型校验与至少一次函数测试运行。</li>
            </ul>
          </div>

        </div>

      </div>

      {/* ================= 3. BOTTOM FOOTER TRIO INTERACTIVE STATUS CARDS ================= */}
      <footer className="bg-slate-100 border-t border-slate-200/80 p-4 shrink-0 grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: Validation */}
        <div className="bg-white border border-slate-200 rounded-md p-4 flex flex-col justify-between shadow-3xs min-h-[141px]">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-[11.5px] font-black text-slate-800 uppercase tracking-wider">
              <Shield className="text-emerald-500 w-4 h-4" />
              <span>Validation</span>
            </div>

            <ul className="space-y-1 text-[10.5px] font-bold text-slate-500">
              <li className="flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="text-slate-600">schema 校验通过</span>
              </li>
              <li className="flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="text-slate-600">关系校验通过</span>
              </li>
              <li className="flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="text-slate-600">动作绑定完整</span>
              </li>
              <li className="flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 animate-pulse" />
                <span className="text-amber-700 font-semibold bg-amber-50 rounded px-1.5 py-0.2 scale-95 border border-amber-100">warning: 1 条建议补充 Rule 关系</span>
              </li>
            </ul>
          </div>

          <button 
            onClick={() => {
              alert('📦 完整校验批跑信息：\n- 实体节点: 9/9 健康\n- 元属性数量: 48\n- 连通性深度: 5层 \n结论: schema及约束校验通过。');
            }}
            className="w-full mt-2 py-1 text-center text-[10.5px] font-black text-slate-600 hover:text-slate-900 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg cursor-pointer"
          >
            查看详情
          </button>
        </div>

        {/* Card 2: Version Diff */}
        <div className="bg-white border border-slate-200 rounded-md p-4 flex flex-col justify-between shadow-3xs min-h-[141px]">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-[11.5px] font-black text-slate-800 uppercase tracking-wider">
              <GitBranch className="text-indigo-500 w-4 h-4" />
              <span>Version Diff</span>
            </div>

            <ul className="space-y-1 text-[11px] font-mono font-black">
              <li className="text-emerald-600 flex items-center gap-1 bg-emerald-50/50 rounded px-1.5 scale-95">
                <Plus className="w-3 h-3 text-emerald-500 shrink-0" />
                <span>新增 qualityScore</span>
              </li>
              <li className="text-emerald-600 flex items-center gap-1 bg-emerald-50/50 rounded px-1.5 scale-95">
                <Plus className="w-3 h-3 text-emerald-500 shrink-0" />
                <span>新增 validate_mapping Action</span>
              </li>
              <li className="text-red-500 flex items-center gap-1 bg-red-50/50 rounded px-1.5 scale-95">
                <X className="w-3 h-3 text-red-500 shrink-0" />
                <span>删除 oldSemanticTag</span>
              </li>
            </ul>
          </div>

          <button 
            onClick={() => {
              alert('🔄 版本快照变更差异报告 (Draft -> Base Commit):\n\n[Field Object]\n  + Property: qualityScore (Number)\n  + Action: validate_mapping (Active)\n  - Property: oldSemanticTag (Retired)');
            }}
            className="w-full mt-2 py-1 text-center text-[10.5px] font-black text-slate-600 hover:text-slate-900 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg cursor-pointer"
          >
            查看完整差异
          </button>
        </div>

        {/* Card 3: Runtime Preview */}
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-3xs min-h-[141px] flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2.5">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-1.5 text-[11.5px] font-black text-slate-800 uppercase tracking-wider">
                <PlayCircle className="text-blue-500 w-4 h-4" />
                <span>Runtime Preview</span>
              </div>

              <div className="space-y-1 text-[10px] font-semibold text-slate-500 leading-normal">
                <div className="flex flex-col gap-1">
                  <span className="font-extrabold text-slate-400 uppercase tracking-wider">预期生成对象:</span>
                  <div className="flex flex-wrap gap-1">
                    {['Field', 'Mapping', 'Assertion', 'Task'].map(ob => (
                      <span key={ob} className="px-1 bg-indigo-50 text-indigo-700 rounded text-[9.5px]">{ob}</span>
                    ))}
                  </div>
                </div>
                <p className="mt-1">
                  <span className="font-extrabold text-slate-400 block mb-0.5">预期流程:</span>
                  <span className="font-mono font-bold text-slate-700">semantic_governance_workflow</span>
                </p>
              </div>
            </div>

            {/* A beautiful visual micro diagram scheme on the right side */}
            <div className="w-24 shrink-0 bg-slate-50 border border-slate-180 p-1.5 rounded-lg flex flex-col items-center justify-between gap-1 shadow-inner h-[86px]">
              <div className="flex items-center gap-1 text-[8px] font-extrabold text-slate-300 uppercase">
                Schema Graph
              </div>

              <div className="flex items-center gap-1.5 relative py-1">
                {/* Micro blocks */}
                <span className="w-5 h-5 rounded bg-blue-100 flex items-center justify-center text-[9px] text-blue-600 font-extrabold shadow-3xs" title="Field">田</span>
                <span className="text-[10px] text-slate-300 animate-pulse">➔</span>
                <span className="w-5 h-5 rounded bg-amber-100 flex items-center justify-center text-[9px] text-amber-600 font-extrabold shadow-3xs" title="Rule">规</span>
                <span className="text-[10px] text-slate-300">➔</span>
                <span className="w-5 h-5 rounded bg-emerald-100 flex items-center justify-center text-[9px] text-emerald-600 font-extrabold shadow-3xs" title="Task">治</span>
              </div>

              <div className="w-full h-1 bg-blue-500 rounded-full scale-y-75 animate-pulse"></div>
            </div>
          </div>

          <button 
            onClick={() => {
              showToast('🔬 正在调起沙箱容器加载实时关系DAG图...', 'info');
              setIsRunPreviewOpen(true);
            }}
            className="w-full mt-1 py-1 text-center text-[10.5px] font-black text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-200 hover:border-blue-700 rounded-lg cursor-pointer transition-all"
          >
            查看运行预览
          </button>
        </div>

      </footer>

      {/* ========================================================================= */}
      {/* ========================== POPUP DIALOGS & DRAWERS ======================= */}
      {/* ========================================================================= */}

      {/* PopUp 1: EDIT ATTRIBUTES / MODEL PROPERTIES MODAL */}
      {isEditObjOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-3xs flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-300/80 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-slide-up">
            
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-600" />
                  管理对象属性 - {activeObj.id} ({activeObj.nameCn})
                </h3>
                <p className="text-[11px] text-slate-400 font-semibold">在此处直接编辑物理层字段定义、绑定校验规则及元编码。</p>
              </div>

              <button 
                onClick={() => setIsEditObjOpen(false)}
                className="p-1.5 hover:bg-slate-200/80 rounded-lg text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Main scrollable grid table */}
            <div className="p-5 overflow-y-auto space-y-4">
              
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-700">属性个数：{activeObj.properties.length} 个</span>
                <button 
                  onClick={() => setIsAddPropOpen(true)}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  新增属性
                </button>
              </div>

              <div className="border border-slate-200 rounded-md overflow-hidden bg-white max-h-[350px] overflow-y-auto shadow-inner">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 border-b border-slate-180 text-slate-400 font-extrabold uppercase tracking-widest text-[10px]">
                    <tr>
                      <th className="py-2 px-3">属性名称</th>
                      <th className="py-2 px-3">编码</th>
                      <th className="py-2 px-3">物理类型</th>
                      <th className="py-2 px-3">基础默认值</th>
                      <th className="py-2 px-3">描述</th>
                      <th className="py-2 px-3 text-center">必填</th>
                      <th className="py-2 px-3 text-center">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-semibold text-slate-700">
                    {activeObj.properties.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3">
                          <input 
                            type="text" 
                            value={p.name}
                            onChange={(e) => {
                              const updatedProps = activeObj.properties.map(item => item.id === p.id ? { ...item, name: e.target.value } : item);
                              setObjects({ ...objects, [activeObj.id]: { ...activeObj, properties: updatedProps } });
                            }}
                            className="bg-slate-50 hover:bg-white border hover:border-blue-300 focus:border-blue-500 rounded p-1 w-full text-xs font-bold text-slate-800 focus:outline-none"
                          />
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-600">{p.code}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-400">{p.dataType}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-400">{p.defaultValue}</td>
                        <td className="py-2.5 px-3 max-w-[150px] truncate">{p.desc}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={p.isRequired ? "text-emerald-600 font-black" : "text-slate-300"}>
                            {p.isRequired ? '是' : '否'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button 
                            onClick={() => {
                              if (confirm(`确定要移除属性 [${p.name}] 吗？`)) {
                                const left = activeObj.properties.filter(item => item.id !== p.id);
                                setObjects({ ...objects, [activeObj.id]: { ...activeObj, properties: left } });
                                showToast(`🗑️ 已成功移除属性 "${p.name}"`, 'info');
                              }
                            }}
                            className="text-slate-400 hover:text-red-500 p-1 hover:bg-slate-100 rounded"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-end gap-3 font-bold">
              <button 
                onClick={() => setIsEditObjOpen(false)}
                className="px-4 py-2 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
              >
                保存所有更改
              </button>
            </div>

          </div>
        </div>
      )}

      {/* PopUp 2: ADD PROPERTY SIDE PANEL / MODEL FORM */}
      {isAddPropOpen && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-3xs flex items-center justify-end z-55 animate-fade-in">
          <div className="bg-white w-96 h-full shadow-2xl border-l border-slate-200 flex flex-col justify-between animate-slide-left">
            
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-slate-900 flex items-center gap-1">
                  <Plus className="w-4 h-4 text-blue-600" />
                  新增物理属性
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold">为 {activeObj.nameCn} 挂载新的属性到建模树中</p>
              </div>

              <button 
                onClick={() => setIsAddPropOpen(false)}
                className="p-1 hover:bg-slate-200 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleAddProperty} className="p-5 flex-1 overflow-y-auto space-y-4">
              
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                  属性中文名 (如: 注册电话)
                </label>
                <input 
                  type="text"
                  required
                  placeholder="请输入中文属性简称..."
                  value={newPropName}
                  onChange={(e) => setNewPropName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white font-semibold text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                  属性标识 Code (如: regPhone)
                </label>
                <input 
                  type="text"
                  required
                  placeholder="使用驼峰或者下划度格式..."
                  value={newPropCode}
                  onChange={(e) => setNewPropCode(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                  className="w-full text-xs p-2.5 font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white font-bold text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                  基础物理类型 (Type)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['String', 'Number', 'Boolean', 'DateTime', 'Array', 'JSON'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewPropType(t)}
                      className={`py-1.5 text-[10.5px] font-bold rounded-lg border text-center transition-all ${
                        newPropType === t
                          ? 'bg-blue-50 border-blue-500 text-blue-700 font-extrabold'
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                  语义分析分类 (Semantic Code)
                </label>
                <input 
                  type="text"
                  placeholder="如: LEVEL, ID, ROLE, MEASURE"
                  value={newPropSemantic}
                  onChange={(e) => setNewPropSemantic(e.target.value.toUpperCase().replace(/[^A-Z_]/g, ''))}
                  className="w-full text-xs p-2.5 font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white font-semibold text-slate-800"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-md border border-slate-200">
                <div>
                  <p className="text-xs font-black text-slate-800">是否必填属性</p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">实例注入时是否判定非空值</p>
                </div>

                <div 
                  onClick={() => setNewPropRequired(!newPropRequired)}
                  className={`w-11 h-6 rounded-full p-0.5 cursor-pointer flex items-center transition-colors shadow-inner ${
                    newPropRequired ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-white shadow-xs"></span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                  业务及用途说明描述
                </label>
                <textarea 
                  rows={3}
                  placeholder="详细描述该配置属性在本体上下文中的分析用途基底..."
                  value={newPropDesc}
                  onChange={(e) => setNewPropDesc(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white font-semibold text-slate-800"
                />
              </div>

              <button 
                type="submit"
                className="w-full py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-755 rounded-lg shadow-sm transition-all cursor-pointer"
              >
                完成添加
              </button>

            </form>

            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <button 
                type="button" 
                onClick={() => setIsAddPropOpen(false)}
                className="w-full py-2 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 bg-white rounded-lg cursor-pointer"
              >
                取消
              </button>
            </div>

          </div>
        </div>
      )}

      {/* PopUp 3: ADD RELATION LINK DIALOG */}
      {isAddLinkOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-3xs flex items-center justify-center z-55 animate-fade-in">
          <div className="bg-white rounded-2xl p-5 shadow-xl border border-slate-300/80 max-w-md w-full animate-slide-up space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <Link2 className="w-4 h-4 text-blue-600" />
                新增关联关系
              </h3>
              <X className="w-4 h-4 text-slate-400 hover:text-slate-600 cursor-pointer" onClick={() => setIsAddLinkOpen(false)} />
            </div>

            <form onSubmit={handleAddLink} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase">源实体主体 (Subject)</label>
                <input 
                  type="text" 
                  value={newLinkSource} 
                  onChange={(e) => setNewLinkSource(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold font-mono text-slate-800 focus:outline-none" 
                  required 
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase">关联关系动词 (Verb, 如 contains, mapped_to)</label>
                <input 
                  type="text" 
                  placeholder="如: governed_by, maps_to"
                  value={newLinkVerb} 
                  onChange={(e) => setNewLinkVerb(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold font-mono text-slate-800" 
                  required 
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase">目的实体客体 (Object)</label>
                <input 
                  type="text" 
                  placeholder="如: Rule, Task, Dataset"
                  value={newLinkTarget} 
                  onChange={(e) => setNewLinkTarget(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold font-mono text-slate-800" 
                  required 
                />
              </div>

              <div className="pt-2 flex items-center gap-2 font-bold justify-end">
                <button 
                  type="button" 
                  onClick={() => setIsAddLinkOpen(false)} 
                  className="px-3 py-1.5 text-xs text-slate-600 bg-slate-50 rounded-lg"
                >
                  取消
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  确认添加关系
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PopUp 4: ADD CAPABILITY ACTION DIALOG */}
      {isAddActionOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-3xs flex items-center justify-center z-55 animate-fade-in">
          <div className="bg-white rounded-2xl p-5 shadow-xl border border-slate-300/80 max-w-md w-full animate-slide-up space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-violet-600" />
                绑定动作类型
              </h3>
              <X className="w-4 h-4 text-slate-400 hover:text-slate-600 cursor-pointer" onClick={() => setIsAddActionOpen(false)} />
            </div>

            <form onSubmit={handleAddAction} className="space-y-3">
              <div className="space-y-1 bg-slate-50 p-2 text-[11px] text-slate-500 rounded border border-blue-50">
                绑定治理动作可以使该本体对象在元实例刷新时具有自动拦截或者校验的安全钩子能力。
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase">动作唯一名 Action Code</label>
                <input 
                  type="text" 
                  placeholder="如: validate_metadata, audit_credentials"
                  value={newActionName} 
                  onChange={(e) => setNewActionName(e.target.value.toLowerCase().replace(/[^a-z_]/g, ''))}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold font-mono text-slate-800" 
                  required 
                />
              </div>

              <div className="pt-2 flex items-center gap-2 justify-end font-bold">
                <button type="button" onClick={() => setIsAddActionOpen(false)} className="px-3 py-1.5 text-xs text-slate-600 bg-slate-50 rounded-lg">
                  取消
                </button>
                <button type="submit" className="px-4 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded-lg">
                  完成动作绑定
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PopUp 5: BIND COMPUTATION FUNCTION DIALOG */}
      {isAddFuncOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-3xs flex items-center justify-center z-55 animate-fade-in">
          <div className="bg-white rounded-2xl p-5 shadow-xl border border-slate-300/80 max-w-md w-full animate-slide-up space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <Code className="w-4 h-4 text-emerald-600" />
                绑定逻辑特征函数
              </h3>
              <X className="w-4 h-4 text-slate-400 hover:text-slate-600 cursor-pointer" onClick={() => setIsAddFuncOpen(false)} />
            </div>

            <form onSubmit={handleAddFunc} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase">函数代码标名 (Function Code)</label>
                <input 
                  type="text" 
                  placeholder="如: string_length_checker, predict_model_type"
                  value={newFuncName} 
                  onChange={(e) => setNewFuncName(e.target.value.toLowerCase().replace(/[^a-z_]/g, ''))}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold font-mono text-slate-800" 
                  required 
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase">输入输出节点比例 (I/O Rate)</label>
                <select 
                  value={newFuncIo} 
                  onChange={(e) => setNewFuncIo(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold font-sans text-slate-800"
                >
                  <option value="In 1 / Out 1">In 1 / Out 1 (1对1传导)</option>
                  <option value="In 3 / Out 1">In 3 / Out 1 (聚合统计)</option>
                  <option value="In 4 / Out 1">In 4 / Out 1 (高维度归集)</option>
                  <option value="In 8 / Out 2">In 8 / Out 2 (跨实体预测)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center gap-2 justify-end font-bold">
                <button type="button" onClick={() => setIsAddFuncOpen(false)} className="px-3 py-1.5 text-xs text-slate-600 bg-slate-50 rounded-lg">
                  取消
                </button>
                <button type="submit" className="px-4 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded-lg">
                  立即绑定逻辑
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PopUp 6: DAG GRAPH PREVIEW GRAPH MODAL */}
      {isViewDagOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-3xs flex items-center justify-center z-55 animate-fade-in p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full p-5 space-y-4 animate-slide-up border border-slate-300">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <GitBranch className="w-4 h-4 text-orange-600" />
                【{activeObj.nameCn}】 行为树调度 DAG 图 (Direct Acyclic Graph)
              </h3>
              <X className="w-4.5 h-4.5 text-slate-400 hover:text-slate-700 cursor-pointer" onClick={() => setIsViewDagOpen(false)} />
            </div>

            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              这是为您自动通过 DRKN 系统编排好的 DAG 工作流。所有绑定在 <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-1 rounded">{activeObj.id}</span> 上的动作将根据流程拓扑按序拉起：
            </p>

            {/* A beautiful visual interactive chart representing the DAG Graph */}
            <div className="bg-slate-900 border border-slate-800 rounded-md p-6 text-white min-h-[200px] flex items-center justify-center relative overflow-hidden shadow-inner">
              
              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>

              <div className="flex items-center gap-2 text-xs relative z-10 flex-wrap justify-center p-3">
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-2 text-center" title="启动首级拦截探针">
                  <span className="text-[9px] font-extrabold text-blue-400 block uppercase">Step 1: Raw Meta</span>
                  <span className="font-mono font-bold text-slate-200">collect_metadata</span>
                </div>

                <span className="text-slate-500 font-black animate-pulse">➔</span>

                <div className="bg-slate-800 border border-slate-700 rounded-lg p-2 text-center shadow-lg border-blue-500/40" title="NLP 模型打标签判断">
                  <span className="text-[9px] font-extrabold text-indigo-400 block uppercase font-mono">Step 2: Core Inf</span>
                  <span className="font-mono font-bold text-slate-200">infer_field_semantics</span>
                </div>

                <span className="text-slate-500 font-black">➔</span>

                <div className="bg-slate-800 border border-slate-700 rounded-lg p-2 text-center" title="探查质量打分">
                  <span className="text-[9px] font-extrabold text-emerald-400 block uppercase">Step 3: Quality Val</span>
                  <span className="font-mono font-bold text-slate-200">calculate_data_quality</span>
                </div>

                <span className="text-slate-555 font-black">➔</span>

                <div className="bg-slate-800 border border-slate-700 rounded-lg p-2 text-center" title="智能生成工单派发">
                  <span className="text-[9px] font-extrabold text-rose-400 block uppercase">Step 4: Dispatch</span>
                  <span className="font-mono font-bold text-slate-200">create_task_工单</span>
                </div>
              </div>

            </div>

            <div className="flex justify-end font-bold">
              <button 
                onClick={() => setIsViewDagOpen(false)}
                className="px-4 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-750 rounded-lg"
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PopUp 7: RUNTIME SIMULATOR PREVIEW PANEL */}
      {isRunPreviewOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-3xs flex items-center justify-center z-55 animate-fade-in p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-5 space-y-4 animate-slide-up border border-slate-300">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <PlayCircle className="w-4 h-4 text-blue-600 animate-spin" />
                DRKN 实时渲染与感知预览沙箱
              </h3>
              <X className="w-4.5 h-4.5 text-slate-400 hover:text-slate-700 cursor-pointer" onClick={() => setIsRunPreviewOpen(false)} />
            </div>

            <div className="space-y-3.5 text-xs text-slate-600">
              
              <div className="bg-blue-50/50 border border-blue-150 p-3 rounded-lg leading-relaxed text-blue-800 flex items-start gap-2.5">
                <Info className="w-4.5 h-4.5 shrink-0 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-black">模拟器已与底层 Vite/Express 服务器代理接通！</p>
                  <p className="font-medium text-[11px] text-blue-700 mt-0.5">当您在此本体工作台修改任何字段、关系或动作后，无需手动重新载入图谱镜像，沙箱运行态会即时流式刷新关系链。</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-black text-slate-700 uppercase tracking-wider text-[10px]">配置快照参数</p>
                <div className="p-3 bg-slate-50 border rounded-md font-mono text-[11px] space-y-1.5 text-slate-700 font-bold">
                  <div>• Target Object ID: <span className="text-indigo-700">{activeObj.id}</span></div>
                  <div>• Attributes Listed: <span className="text-indigo-700">{activeObj.properties.length} 项</span></div>
                  <div>• Active Links Associated: <span className="text-indigo-700">{activeObj.links.length} 条</span></div>
                  <div>• Action Methods Connected: <span className="text-indigo-700">{activeObj.actions.length} 种</span></div>
                </div>
              </div>

              <div className="p-3 bg-yellow-50/50 border border-yellow-200 rounded-lg text-yellow-805 text-[11px] font-semibold">
                ⚠️ 注意：当前沙箱沙箱与物理库处于离线对齐状态。若要将修改推送到生产物理表实例，请使用右上角“发布模型”按钮进行一键容器更新。
              </div>

            </div>

            <div className="flex justify-end font-bold pt-2">
              <button 
                onClick={() => setIsRunPreviewOpen(false)}
                className="px-4 py-2 text-xs text-white bg-blue-605 bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                关闭预览沙箱
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
