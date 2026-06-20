import React, { useState } from 'react';
import { 
  Database, Play, CheckCircle, HelpCircle, AlertTriangle,
  Sparkles, Plus, Settings, ChevronDown, Check, Layers, ShieldCheck,
  Workflow, Cpu, Network, Info, Eye, ArrowUpRight, Code, Shield, Sparkle,
  Search, Bell, ExternalLink, RefreshCw, Download, Edit2, List, Trash2, X,
  Link2, Trash, ClipboardList, BookOpen, AlertCircle, BarChart3, HelpCircle as HelpIcon,
  PlayCircle, Activity, ShieldAlert, CheckSquare, Sparkles as SparkleIcon,
  GitBranch, HelpCircle as QuestionIcon, ArrowRight, ArrowLeft, ArrowUp
} from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none" id="dkn-ontology-studio-workspace">
      
      {/* 🔮 SLICK FLOATING TOASTS */}
      {toast && (
        <div className="fixed top-16 right-6 z-50 bg-slate-900 text-white rounded-xl px-4 py-3 shadow-xl border border-slate-800 flex items-center gap-2.5 animate-fade-in text-[12.5px] font-semibold">
          <SparkleIcon className="w-4.5 h-4.5 text-amber-400 shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* ================= 1. SYSTEM NAVIGATION HEADER ================= */}
      <header className="bg-white border-b border-slate-200/80 h-14 shrink-0 flex items-center justify-between px-6 sticky top-0 z-40">
        
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
              { label: 'Ontology 建模工作台', view: 'active', active: true },
              { label: 'Object Type', view: 'object_model' },
              { label: 'Link Type', view: 'relation_model' },
              { label: 'Action Type', view: 'capability_binding' },
              { label: 'Function', view: 'capability_binding' },
              { label: 'Workflow', view: 'workflow_orchestration' },
              { label: '版本管理', view: 'change_release' }
            ].map((tab) => (
              <button
                key={tab.label}
                onClick={() => {
                  if (tab.view !== 'active') {
                    onNavigate(tab.view);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  tab.active 
                    ? 'text-blue-600 bg-blue-50/50 font-black' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Header Rightmost Actions */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => showToast('💾 成功保存当前的本体语义关系集草稿！对应 changeset 沙箱 ID: CS-2026-012')}
            className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg flex items-center gap-1.5 transition-all shadow-3xs cursor-pointer"
          >
            <ClipboardList className="w-3.5 h-3.5 text-slate-400" />
            保存草稿
          </button>

          <button 
            onClick={() => {
              showToast('✅ 模型一致性校验通过！全本体未检测出闭环死循环动作或无效阻断。', 'success');
            }}
            className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-250 rounded-lg flex items-center gap-1.5 transition-all shadow-3xs cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            校验模型
          </button>

          <button 
            onClick={() => {
              setIsRunPreviewOpen(true);
              showToast('🔬 正在调起当前语义沙箱 CS-2026-012 实体血缘关系流向图...', 'info');
            }}
            className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg flex items-center gap-1.5 transition-all shadow-3xs cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            预览工作流
          </button>

          <button 
            onClick={() => {
              alert('📦 正在提交并发布「DRKN语义治理模型」 \n目标版本：v1.0.0 Draft \n状态: 已更新。');
              showToast('🚀 本体结构生命周期已发布，元库感知重新加载！', 'success');
            }}
            className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 transition-all shadow-sm shadow-blue-500/10 cursor-pointer"
          >
            <Play className="w-3 h-3 text-white fill-white" />
            发布模型
          </button>

          <div className="h-5 w-px bg-slate-200 mx-1"></div>

          {/* Social alert indicators */}
          <div className="relative p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer transition-all">
            <Bell className="w-4 h-4 text-slate-500" />
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-[8px] text-white font-extrabold w-3.5 h-3.5 rounded-full flex items-center justify-center border border-white">
              8
            </span>
          </div>

          <p className="p-1 text-slate-450 hover:text-slate-700 cursor-pointer text-xs" title="帮助文档以及提示">
            <QuestionIcon className="w-4 h-4" />
          </p>

          <div className="flex items-center gap-1.5 pl-1 cursor-pointer">
            <div className="h-7 w-7 rounded-full bg-blue-500 text-white font-extrabold text-xs flex items-center justify-center shadow-inner">
              A
            </div>
            <span className="text-xs font-bold text-slate-700">admin</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </div>
        </div>
      </header>

      {/* ================= 2. THREE-PANEL CORE GRID WORKSPACE ================= */}
      <div className="flex-1 p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch overflow-hidden">
        
        {/* ================= COLUMN 1: LEFT SIDEBAR (Width: 2.2/12) ================= */}
        {!sidebarCollapsed && (
          <div className="lg:col-span-2.5 xl:col-span-2.2 bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-3xs">
            
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
                  const id = prompt('请输入新增对象类型编码 (如 Account, Rule, Metric):');
                  if (!id) return;
                  const nameCn = prompt('请输入新对象类型中文简称 (如 账户、标准、指标):');
                  if (!nameCn) return;

                  if (objects[id]) {
                    showToast('该对象类型已存在！', 'warn');
                    return;
                  }

                  setObjects({
                    ...objects,
                    [id]: {
                      id,
                      nameCn,
                      category: 'GOVERNANCE',
                      status: '启用',
                      lifecycle: 'Draft',
                      desc: `新增的 ${nameCn} 对象，挂载在当前 DRKN 语义治理本体下。`,
                      properties: [
                        { id: '1', name: `${nameCn}ID`, code: `${id.toLowerCase()}Id`, dataType: 'String', semanticType: 'ID', isRequired: true, defaultValue: '-', desc: '全局唯一标识' }
                      ],
                      links: [],
                      actions: [],
                      functions: [],
                      workflows: []
                    }
                  });
                  onSelectObject(id);
                  showToast(`🎉 成功创建新的对象类型 "${nameCn} (${id})"`, 'success');
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
                          isGrayState ? 'bg-slate-350' : 'bg-emerald-500 animate-pulse'
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
                    className="w-full text-left text-[11px] font-bold text-slate-600 hover:text-blue-600 bg-slate-50 border border-slate-150 p-2 rounded-lg flex items-center justify-between transition-all group cursor-pointer"
                  >
                    <span>{tmpl.title}</span>
                    <ArrowRight className="w-3 h-3 text-slate-450 group-hover:text-blue-650 transition-colors" />
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
          <div className="lg:col-span-0.5 bg-white border border-slate-200 rounded-xl flex flex-col items-center py-4 px-1 shadow-3xs cursor-pointer hover:bg-slate-50" onClick={() => setSidebarCollapsed(false)}>
            <div className="space-y-6 flex flex-col items-center">
              <ArrowRight className="w-4 h-4 text-slate-400" />
              <div className="h-4 p-px bg-slate-350"></div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest [writing-mode:vertical-lr] text-center">展开对象树</span>
            </div>
          </div>
        )}

        {/* ================= COLUMN 2: CENTER RICH ONTOLOGY VISUAL CANVAS (Width: 6.8/12) ================= */}
        <div className={`${sidebarCollapsed ? 'lg:col-span-8.5' : 'lg:col-span-7'} xl:col-span-6.8 flex flex-col justify-between space-y-4`}>
          
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-3xs flex-1 flex flex-col justify-between relative overflow-hidden">
            
            {/* Header Title inside Visual Area */}
            <div className="flex items-center justify-between z-10">
              <div>
                <h1 className="text-xl font-bold font-sans text-slate-900 tracking-tight flex items-center gap-2">
                  Ontology 建模工作台
                  <span className="text-xs font-bold text-blue-600 bg-blue-55/60 border border-blue-100 rounded-full px-2 py-0.2 font-mono">v1.0.0 Draft</span>
                </h1>
                <p className="text-[11.5px] text-slate-450 font-semibold mt-0.5">
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
              <div className="absolute top-4 left-4 w-72 bg-white border border-slate-205 rounded-xl p-3.5 shadow-xs flex flex-col justify-between min-h-[178px] hover:shadow-md hover:border-blue-200 transition-all">
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
                          <li key={idx} className="flex items-center justify-between bg-slate-50/50 hover:bg-slate-105 p-1 rounded transition-colors group">
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
                    className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-450 hover:text-slate-700 rounded-lg transition-all"
                    title="关系分布统计"
                  >
                    <GitBranch className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 2. BOTTOM-LEFT: 函数 (Functions) */}
              <div className="absolute bottom-4 left-4 w-72 bg-white border border-slate-205 rounded-xl p-3.5 shadow-xs flex flex-col justify-between min-h-[178px] hover:shadow-md hover:border-emerald-200 transition-all">
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
              <div className="absolute top-4 right-4 w-72 bg-white border border-slate-205 rounded-xl p-3.5 shadow-xs flex flex-col justify-between min-h-[178px] hover:shadow-md hover:border-violet-200 transition-all">
                
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
              <div className="absolute bottom-4 right-4 w-72 bg-white border border-slate-205 rounded-xl p-3.5 shadow-xs flex flex-col justify-between min-h-[178px] hover:shadow-md hover:border-orange-200 transition-all">
                
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
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs space-y-2.5">
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
                  <p className="text-[11px] font-semibold text-slate-650 leading-relaxed max-w-[210px] break-words">
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
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs space-y-3">
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
                  <p className="text-[8.5px] font-extrabold text-slate-450 truncate scale-95">{stat.title}</p>
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
          <div className="bg-amber-50/80 border border-amber-250 rounded-xl p-4 text-[11px] leading-relaxed text-amber-800 flex flex-col justify-between">
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
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-3xs min-h-[141px]">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-[11.5px] font-black text-slate-800 uppercase tracking-wider">
              <Shield className="text-emerald-500 w-4 h-4" />
              <span>Validation</span>
            </div>

            <ul className="space-y-1 text-[10.5px] font-bold text-slate-500">
              <li className="flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="text-slate-650">schema 校验通过</span>
              </li>
              <li className="flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="text-slate-650">关系校验通过</span>
              </li>
              <li className="flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="text-slate-650">动作绑定完整</span>
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
            className="w-full mt-2 py-1 text-center text-[10.5px] font-black text-slate-600 hover:text-slate-900 bg-slate-50 border border-slate-200 hover:border-slate-350 rounded-lg cursor-pointer"
          >
            查看详情
          </button>
        </div>

        {/* Card 2: Version Diff */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-3xs min-h-[141px]">
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
            className="w-full mt-2 py-1 text-center text-[10.5px] font-black text-slate-600 hover:text-slate-900 bg-slate-50 border border-slate-200 hover:border-slate-350 rounded-lg cursor-pointer"
          >
            查看完整差异
          </button>
        </div>

        {/* Card 3: Runtime Preview */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs min-h-[141px] flex flex-col justify-between">
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
                  <span className="font-mono font-bold text-slate-705">semantic_governance_workflow</span>
                </p>
              </div>
            </div>

            {/* A beautiful visual micro diagram scheme on the right side */}
            <div className="w-24 shrink-0 bg-slate-50 border border-slate-180 p-1.5 rounded-lg flex flex-col items-center justify-between gap-1 shadow-inner h-[86px]">
              <div className="flex items-center gap-1 text-[8px] font-extrabold text-slate-350 uppercase">
                Schema Graph
              </div>

              <div className="flex items-center gap-1.5 relative py-1">
                {/* Micro blocks */}
                <span className="w-5 h-5 rounded bg-blue-100 flex items-center justify-center text-[9px] text-blue-600 font-extrabold shadow-3xs" title="Field">田</span>
                <span className="text-[10px] text-slate-350 animate-pulse">➔</span>
                <span className="w-5 h-5 rounded bg-amber-100 flex items-center justify-center text-[9px] text-amber-600 font-extrabold shadow-3xs" title="Rule">规</span>
                <span className="text-[10px] text-slate-350">➔</span>
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
            
            <div className="bg-slate-50 p-4 border-b border-slate-150 flex items-center justify-between">
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

              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white max-h-[350px] overflow-y-auto shadow-inner">
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
                  <tbody className="divide-y divide-slate-150 font-semibold text-slate-700">
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
                        <td className="py-2.5 px-3 font-mono text-slate-450">{p.dataType}</td>
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

            <div className="bg-slate-50 p-4 border-t border-slate-150 flex items-center justify-end gap-3 font-bold">
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
            
            <div className="bg-slate-50 p-4 border-b border-slate-150 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-slate-900 flex items-center gap-1">
                  <Plus className="w-4 h-4 text-blue-600" />
                  新增物理属性
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold">为 {activeObj.nameCn} 挂载新的属性到建模树中</p>
              </div>

              <button 
                onClick={() => setIsAddPropOpen(false)}
                className="p-1 hover:bg-slate-150 rounded"
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

              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-150">
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
                <button type="button" onClick={() => setIsAddFuncOpen(false)} className="px-3 py-1.5 text-xs text-slate-650 bg-slate-50 rounded-lg">
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
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-white min-h-[200px] flex items-center justify-center relative overflow-hidden shadow-inner">
              
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-5 space-y-4 animate-slide-up border border-slate-350">
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
                <div className="p-3 bg-slate-50 border rounded-xl font-mono text-[11px] space-y-1.5 text-slate-700 font-bold">
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
