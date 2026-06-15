import { ObjectType, LinkType, Capability, DRKNWorkflow, ChangeSet, ValidationItem } from './types';

export const INITIAL_OBJECT_TYPES: ObjectType[] = [
  {
    id: "DataSource",
    nameCn: "数据源对象",
    description: "数据源注册单元，表示计算引擎或物理存储的顶级治理边界，承载连接细节与元数据扫描配置。",
    group: "核心数据对象",
    instanceCount: 142,
    status: "Published",
    owner: "数据平台组",
    lifecycle: ["Registered", "Connected", "Scanned", "Active", "Deprecated"],
    properties: [
      { name: "ds_name", dataType: "string", semanticType: "SystemName", confidence: 1.0, owner: "数据平台组", status: "Published", description: "数据源物理唯一标识符" },
      { name: "conn_type", dataType: "string", semanticType: "TechnologyType", confidence: 1.0, owner: "数据平台组", status: "Published", description: "连接协议类型，如 ClickHouse, Hive, PostgreSQL" },
      { name: "host", dataType: "string", semanticType: "NetworkIp/Host", confidence: 1.0, owner: "安全合规部", status: "Published", description: "服务器主机物理地址域" },
      { name: "db_name", dataType: "string", semanticType: "DatabaseName", confidence: 1.0, owner: "数据平台组", status: "Published", description: "关联的物理数据库主名称" },
      { name: "owner", dataType: "string", semanticType: "UserAccount", confidence: 1.0, owner: "资产归属科", status: "Published", description: "数据源的主责任接口人" }
    ]
  },
  {
    id: "DataAsset",
    nameCn: "数据资产表",
    description: "对应底层的物理表、视图或主题分区，是血缘脉络和属性传播的基础物理承载层。",
    group: "核心数据对象",
    instanceCount: 3450,
    status: "Published",
    owner: "数仓治理部",
    lifecycle: ["Catalogued", "Classified", "LineageTracked", "Governed", "Deprecated"],
    properties: [
      { name: "table_name", dataType: "string", semanticType: "TableName", confidence: 1.0, owner: "数仓研发组", status: "Published", description: "物理资产的全名称" },
      { name: "row_count", dataType: "long", semanticType: "ScaleMetrics", confidence: 0.99, owner: "系统探测器", status: "Published", description: "记录行总容量统计值" },
      { name: "table_type", dataType: "string", semanticType: "StorageClassification", confidence: 1.0, owner: "数仓治理部", status: "Published", description: "表结构形态分类，如 Dimension, Fact, ODS" },
      { name: "asset_path", dataType: "string", semanticType: "FileUrl", confidence: 0.98, owner: "基础架构组", status: "Published", description: "在分布式文件系统或对象存储中的物理存储全路径" },
      { name: "owner", dataType: "string", semanticType: "UserAccount", confidence: 1.0, owner: "数仓治理部", status: "Published", description: "该物理资产的业务接口人" }
    ]
  },
  {
    id: "Field",
    nameCn: "字段对象",
    description: "数据资产表中的逻辑/物理构成列，是关系映射、语义分类及断言验证的最小治理原子单元。",
    group: "核心数据对象",
    instanceCount: 12356,
    status: "Published",
    owner: "数据治理团队",
    lifecycle: ["Discovered", "Profiled", "Asserted", "Confirmed", "Published", "Deprecated"],
    properties: [
      { name: "field_name", dataType: "string", semanticType: "FieldName", confidence: 1.0, owner: "数据治理团队", status: "Published", description: "数据库字段原物理名称" },
      { name: "data_type", dataType: "string", semanticType: "SystemType", confidence: 1.0, owner: "核心引擎组", status: "Published", description: "底层物理存储类型，如 Text, BigInt, Decimal" },
      { name: "semantic_type", dataType: "string", semanticType: "OntologyClass", confidence: 0.94, owner: "AI 词法引擎", status: "Published", description: "模型预测匹配的语义概念类型，例如 IDCard, MobileNo, Money" },
      { name: "confidence", dataType: "double", semanticType: "ProbabilityScore", confidence: 0.95, owner: "算法策略组", status: "Published", description: "当前预测结果的关联置信分数指数" },
      { name: "owner", dataType: "string", semanticType: "UserAccount", confidence: 1.0, owner: "数据治理团队", status: "Published", description: "本子段数据的安全与语义总接口人" },
      { name: "status", dataType: "string", semanticType: "CategoryCode", confidence: 1.0, owner: "流程审核室", status: "Published", description: "当前生命周期运行阶段状态代码" }
    ]
  },
  {
    id: "SemanticAssertion",
    nameCn: "语义断言",
    description: "针对 Field 对象类型的语义归属判定声明（如: 字段field_a是身份证号），需经过证据累积和流程判定确认。",
    group: "语义治理对象",
    instanceCount: 8940,
    status: "Published",
    owner: "语义网络架构组",
    lifecycle: ["Proposed", "Analyzing", "Contradictory", "Confirmed", "Rejected"],
    properties: [
      { name: "assertion_type", dataType: "string", semanticType: "GovernanceCategory", confidence: 1.0, owner: "语义网络组", status: "Published", description: "断言具体的语义实体形态，如 TypeMatch, RelationMatch" },
      { name: "confidence_score", dataType: "double", semanticType: "ProbabilityScore", confidence: 0.99, owner: "推理执行引擎", status: "Published", description: "根据关联证据网计算的最佳综合置信得分" },
      { name: "verified_by", dataType: "string", semanticType: "ReviewerIdent", confidence: 1.0, owner: "安全合规部", status: "Published", description: "终审审核记录操作者的账号" },
      { name: "assert_date", dataType: "datetime", semanticType: "TimestampInstant", confidence: 1.0, owner: "治理审计科", status: "Published", description: "断言生效生成的精确系统时钟时间" },
      { name: "status", dataType: "string", semanticType: "CategoryCode", confidence: 1.0, owner: "治理审计科", status: "Published", description: "断言状态，如 已认领、冲突中、待复核" }
    ]
  },
  {
    id: "Evidence",
    nameCn: "证据对象",
    description: "支撑或证伪某个语义断言的具体物理/逻辑凭证，例如采样数据的正则识别匹配比例、字段血缘等。",
    group: "语义治理对象",
    instanceCount: 24900,
    status: "Published",
    owner: "特征采集引擎组",
    lifecycle: ["Extracted", "Normalized", "Evaluated", "Archived"],
    properties: [
      { name: "evidence_type", dataType: "string", semanticType: "ProofCategory", confidence: 1.0, owner: "特征采集组", status: "Published", description: "证据模式，例如 RegexProfile, ValueDistribution, LineageSource" },
      { name: "extracted_val", dataType: "string", semanticType: "GenericValue", confidence: 0.99, owner: "探测器", status: "Published", description: "分析后得出的定性度量表达，如 98.2% 格式正则匹配" },
      { name: "conf_weight", dataType: "double", semanticType: "ProbabilityScore", confidence: 0.95, owner: "质量校验层", status: "Published", description: "说明该证据在推导全局断言时分配的影响力比重因子" },
      { name: "source_file", dataType: "string", semanticType: "SystemPath", confidence: 1.0, owner: "分析服务", status: "Published", description: "证据产出的底层日志或是中间计算快照链接" }
    ]
  },
  {
    id: "DataQualityRule",
    nameCn: "数据质量规则",
    description: "作用于特定语义治理对象的校验准则（如：非空约束、业务范围判断、外键关系探测），其结构随本体层模型联动。",
    group: "质量治理对象",
    instanceCount: 450,
    status: "Published",
    owner: "数据质量保障组",
    lifecycle: ["Created", "Tested", "Enabled", "Disabled"],
    properties: [
      { name: "rule_name", dataType: "string", semanticType: "RuleConfigName", confidence: 1.0, owner: "质量工程师", status: "Published", description: "质量判断准则的可读名称" },
      { name: "rule_type", dataType: "string", semanticType: "ClassificationCode", confidence: 1.0, owner: "质量策略室", status: "Published", description: "规则分类，如 NullCheck, BoundsCheck, CrossTableReferential" },
      { name: "check_sql", dataType: "text", semanticType: "SqlClause", confidence: 1.0, owner: "质量工程师", status: "Published", description: "物理执行层面的 SQL 断言校验片段文本" },
      { name: "severity", dataType: "string", semanticType: "LevelCode", confidence: 1.0, owner: "质量策略室", status: "Published", description: "触发熔断或报错的预警层级，如 High, Medium, Low" }
    ]
  },
  {
    id: "DataIssue",
    nameCn: "数据问题",
    description: "执行数据质量校验后生成的异常实体，与数据对象及相关断言强关联，是主动性语义纠偏的行动线索。",
    group: "质量治理对象",
    instanceCount: 86,
    status: "Published",
    owner: "运维监控中心",
    lifecycle: ["Identified", "Assigned", "Resolved", "Reverified", "Closed"],
    properties: [
      { name: "issue_title", dataType: "string", semanticType: "TextSummary", confidence: 1.0, owner: "数据监控系统", status: "Published", description: "数据质量问题的概要异常文本" },
      { name: "severity_level", dataType: "string", semanticType: "LevelCode", confidence: 1.0, owner: "质量监控组", status: "Published", description: "问题严重等级分类，高频阻断或次要预警" },
      { name: "created_at", dataType: "datetime", semanticType: "TimestampInstant", confidence: 1.0, owner: "审计网网关", status: "Published", description: "质量实体发生的完整硬件时钟时刻" }
    ]
  },
  {
    id: "GovernanceTask",
    nameCn: "治理任务",
    description: "数据质量问题、冲突断言或变更升级触发的任务实例，驱动人工在 AI 的辅助下完成多层语义复查。",
    group: "运行治理对象",
    instanceCount: 322,
    status: "Published",
    owner: "治理流程管控科",
    lifecycle: ["Created", "InProgress", "UnderReview", "Completed", "Cancelled"],
    properties: [
      { name: "task_title", dataType: "string", semanticType: "TextSummary", confidence: 1.0, owner: "流程管理岗", status: "Published", description: "治理审查工作的可读工作项标题" },
      { name: "assignee", dataType: "string", semanticType: "UserAccount", confidence: 1.0, owner: "治理主管", status: "Published", description: "指派承办当前处理责任的人员账户" },
      { name: "due_date", dataType: "date", semanticType: "DateCalendar", confidence: 1.0, owner: "流程管理岗", status: "Published", description: "任务计划要求结办关闭的限定截止时间" }
    ]
  },
  {
    id: "Run",
    nameCn: "运行实例",
    description: "本体扫描、校验或发布工作流的具体调度执行，记录任务运行时长及其元数据输出。",
    group: "运行治理对象",
    instanceCount: 15403,
    status: "Published",
    owner: "运维工程组",
    lifecycle: ["Scheduled", "Running", "Completed", "Failed", "Aborted"],
    properties: [
      { name: "run_id", dataType: "string", semanticType: "SystemUuid", confidence: 1.0, owner: "运维平台", status: "Published", description: "当前实例生成的分布式全局物理追踪符" },
      { name: "start_time", dataType: "datetime", semanticType: "TimestampInstant", confidence: 1.0, owner: "审计模块", status: "Published", description: "流程开跑触发的初始化物理瞬间" },
      { name: "duration", dataType: "long", semanticType: "ScaleMetrics", confidence: 1.0, owner: "运行追踪器", status: "Published", description: "任务从启动到结界完毕的总消耗微秒/毫秒时长" }
    ]
  },
  {
    id: "Snapshot",
    nameCn: "模型快照",
    description: "由治理人员核准发布的 DRKN 全量或增量语义模型结构定义与规则集，代表整个语义层的特定稳定版本。",
    group: "运行治理对象",
    instanceCount: 15,
    status: "Published",
    owner: "架构演进委员会",
    lifecycle: ["Staged", "Validating", "Approved", "Published", "Deprecated"],
    properties: [
      { name: "snapshot_version", dataType: "string", semanticType: "SemVerCode", confidence: 1.0, owner: "配置治理组", status: "Published", description: "语义快照的规范版本迭代标识，如 v1.3.0" },
      { name: "snapshot_desc", dataType: "string", semanticType: "NotesParagraph", confidence: 1.0, owner: "配置治理组", status: "Published", description: "记录本版本发布的重要增量特性和审计要点" },
      { name: "created_at", dataType: "datetime", semanticType: "TimestampInstant", confidence: 1.0, owner: "架构演进会", status: "Published", description: "快照完成数字签名合并的确死时刻" }
    ]
  }
];

export const INITIAL_LINK_TYPES: LinkType[] = [
  {
    id: "contains_ds_da",
    nameCn: "数据源包含资产表",
    sourceObjId: "DataSource",
    targetObjId: "DataAsset",
    direction: "DataSource → contains → DataAsset",
    cardinality: "1:N",
    isLineage: true,
    isAiVisible: true,
    requiresAuth: false,
    description: "描述物理存储与其内部目录加载出的表资产归属关联结构，参与主数据治理血缘判定。"
  },
  {
    id: "contains_da_fi",
    nameCn: "资产表包含数据字段",
    sourceObjId: "DataAsset",
    targetObjId: "Field",
    direction: "DataAsset → contains → Field",
    cardinality: "1:N",
    isLineage: true,
    isAiVisible: true,
    requiresAuth: false,
    description: "数据表资产包含的物理属性字段，是主数据分发、语义打标的底层定位核心链路。"
  },
  {
    id: "has_assertion",
    nameCn: "字段拥有语义断言",
    sourceObjId: "Field",
    targetObjId: "SemanticAssertion",
    direction: "Field → has_assertion → SemanticAssertion",
    cardinality: "1:N",
    isLineage: false,
    isAiVisible: true,
    requiresAuth: true,
    description: "表示特定数据字段对象上由于物理特征相似度，挂接产生的未审或已审语义断言声明。"
  },
  {
    id: "supported_by",
    nameCn: "断言支撑证据链路",
    sourceObjId: "SemanticAssertion",
    targetObjId: "Evidence",
    direction: "SemanticAssertion → supported_by → Evidence",
    cardinality: "1:N",
    isLineage: false,
    isAiVisible: true,
    requiresAuth: false,
    description: "连接语义断言声明与其背后探测推算所产生的直接物证，提供给安全主管追溯决策依据。"
  },
  {
    id: "checked_by",
    nameCn: "字段受到质量规则校正",
    sourceObjId: "Field",
    targetObjId: "DataQualityRule",
    direction: "Field → checked_by → DataQualityRule",
    cardinality: "1:N",
    isLineage: false,
    isAiVisible: false,
    requiresAuth: false,
    description: "描述质量检验层面的具体规则是如何根据字段的语义标识绑定到具体物理字段上去的。"
  },
  {
    id: "produces",
    nameCn: "规则触发质量问题",
    sourceObjId: "DataQualityRule",
    targetObjId: "DataIssue",
    direction: "DataQualityRule → produces → DataIssue",
    cardinality: "1:N",
    isLineage: true,
    isAiVisible: true,
    requiresAuth: true,
    description: "当特定数据发生空值、异常区间分布时，相应检测规则会派生出来的数据质量故障，支持直接追溯至数据源。"
  },
  {
    id: "assigned_to",
    nameCn: "语义审查分配至任务",
    sourceObjId: "SemanticAssertion",
    targetObjId: "GovernanceTask",
    direction: "SemanticAssertion → assigned_to → GovernanceTask",
    cardinality: "1:1",
    isLineage: false,
    isAiVisible: false,
    requiresAuth: true,
    description: "当本体识别到规则冲突（如同一个字段触发两套不相容语义）时，分配给指定安全分析室的审核事务。"
  },
  {
    id: "includes_version",
    nameCn: "快照包含语义断言版本",
    sourceObjId: "Snapshot",
    targetObjId: "SemanticAssertion",
    direction: "Snapshot → includes → SemanticAssertion",
    cardinality: "N:M",
    isLineage: false,
    isAiVisible: true,
    requiresAuth: true,
    description: "已经锁定的发布全量或裁剪语义层，将其包含的活跃断言节点打底标记，提供 AI 工作应用作一致性推导。"
  }
];

export const INITIAL_CAPABILITIES: Capability[] = [
  {
    id: "profileField",
    name: "profileField()",
    type: "function",
    inputObject: "Field",
    outputObjectOrStatus: "FieldProfileResult (采样直方图及异常极值分布)",
    isAiEnabled: "是",
    workflows: ["MetadataScanWorkflow", "SemanticReviewWorkflow"],
    permissions: "系统自动化服务 / 数据质量工程团",
    description: "对目标物理字段进行极速采样，抓取非空率、值长度矩、分布频率等纯物理属性，不修改模型状态。"
  },
  {
    id: "classifyFieldSemantic",
    name: "classifyFieldSemantic()",
    type: "function",
    inputObject: "Field",
    outputObjectOrStatus: "SemanticClassification (预测分类概念项)",
    isAiEnabled: "是",
    workflows: ["SemanticReviewWorkflow"],
    permissions: "AI 识别大模型 / 规则库匹配服务",
    description: "核心大模型及正则扫描引擎，解析采样得到的特征值并投递候选语义，输出推荐归属及匹配度数值。"
  },
  {
    id: "computeSemanticScore",
    name: "computeSemanticScore()",
    type: "function",
    inputObject: "Evidence Set",
    outputObjectOrStatus: "Score (精确置信概率值百分比)",
    isAiEnabled: "是",
    workflows: ["SemanticReviewWorkflow", "DQAssessmentWorkflow"],
    permissions: "系统底层决策树推理服务",
    description: "综合该字段所连的多方证据（字段名称相似、血缘溯源推荐、样本正则），利用权重算式推导出最终置信概率。"
  },
  {
    id: "detectPrimaryKey",
    name: "detectPrimaryKey()",
    type: "function",
    inputObject: "Field",
    outputObjectOrStatus: "Boolean (是否符合物理主键唯一分布)",
    isAiEnabled: "是",
    workflows: ["MetadataScanWorkflow"],
    permissions: "数据资产探测专员",
    description: "扫描数据表列集，自动识别具备绝对高密、零空值及唯一规律性的物理列作为潜在候选关联主键。"
  },
  {
    id: "detectForeignKey",
    name: "detectForeignKey()",
    type: "function",
    inputObject: "Field",
    outputObjectOrStatus: "ForeignKeyMatch (可能指向的目标主表字段)",
    isAiEnabled: "可建议",
    workflows: ["SemanticReviewWorkflow", "DQAssessmentWorkflow"],
    permissions: "关系网络演进专家",
    description: "根据值域重合度、前缀继承和元数据血缘交叉计算，研判该字段与其他表中物理主键的强对应结构可能性。"
  },
  {
    id: "createSemanticAssertion",
    name: "createSemanticAssertion",
    type: "action",
    inputObject: "Field",
    outputObjectOrStatus: "新建 SemanticAssertion 实体 (状态: Proposed)",
    isAiEnabled: "否",
    workflows: ["SemanticReviewWorkflow"],
    permissions: "算法识别套件 / 数据治理审核员",
    description: "写入一个全新的语义断言实例，将其以 has_assertion 关系跟字段勾连。这是引发审核的业务前置。"
  },
  {
    id: "markUnknown",
    name: "markUnknown",
    type: "action",
    inputObject: "SemanticAssertion",
    outputObjectOrStatus: "更新断言状态归属 → 'Unknown / Deprecated'",
    isAiEnabled: "可建议",
    workflows: ["SemanticReviewWorkflow"],
    permissions: "数据安全运营人员 / 终决审核主管",
    description: "如果系统判定一个推荐断言在最近三次采样测试中全不合规，则执行修改，标记为未知垃圾语义断言。"
  },
  {
    id: "createGovernanceTask",
    name: "createGovernanceTask",
    type: "action",
    inputObject: "Field",
    outputObjectOrStatus: "新建 GovernanceTask 实体且分配协办",
    isAiEnabled: "否",
    workflows: ["DQAssessmentWorkflow", "SemanticReviewWorkflow"],
    permissions: "质量与语义监测网关",
    description: "当预测置信度太低，或者检测出与历史确证有绝对不协调冲突时，派发人工治理任务，中断一键发布。"
  }
];

export const INITIAL_WORKFLOWS: DRKNWorkflow[] = [
  {
    id: "MetadataScanWorkflow",
    name: "MetadataScanWorkflow",
    description: "定时物理数据源大扫盲，自动爬取表元数据、探查主键和空值矩阵。",
    status: "Active",
    runCount: 5210,
    successRate: 99.4,
    nodes: [
      { id: "W1-N1", label: "物理源元数据爬取", type: "Trigger", description: "触发定时器或者人工强制触发，绑定 DataSource 范围。" },
      { id: "W1-N2", label: "detectPrimaryKey()", type: "Function", description: "逐表对全字段评估，判定物理主/备候选健状态。" },
      { id: "W1-N3", label: "字段基础基数轮廓提取", type: "Function", description: "调起 profileField 函数统计物理极限值及分布特性。" },
      { id: "W1-N4", label: "更新 DataAsset 实例规模", type: "Action", description: "根据最近跑批规模，刷新物理资产规模统计。" }
    ]
  },
  {
    id: "SemanticReviewWorkflow",
    name: "SemanticReviewWorkflow",
    description: "对新探明字段进行全自动大模型语义映射、信度折算与冲突断语提审判定流程。",
    status: "Active",
    runCount: 12803,
    successRate: 98.6,
    nodes: [
      { id: "W2-N1", label: "Field 新入驻/结构修正", type: "Trigger", description: "检测到 Field 包含关系新注册生效事件。" },
      { id: "W2-N2", label: "classifyFieldSemantic()", type: "Function", description: "借助正则引擎与语义编码分类寻找最匹配归属于哪个本体类。" },
      { id: "W2-N3", label: "computeSemanticScore()", type: "Function", description: "依据采样的各色证据比对，计算最后的折合置信指数得分。" },
      { id: "W2-N4", label: "createSemanticAssertion", type: "Action", description: "如果计算出的最高概率语义得分突破 55%，自动构建语义断言草稿。" },
      { id: "W2-N5", label: "判别信度是否极其笃信", type: "Condition", description: "阈值判断，如果概率 > 90% 且证据网无冲突，直达快照，否则走向人工流。" },
      { id: "W2-N6", label: "治理责任室人工审查", type: "HumanReview", description: "由绑定的业务 Owner 确认，在工作台上提供纠偏。可以执行 confirmAssertion。" },
      { id: "W2-N7", label: "异常记录审计归档", type: "Audit", description: "系统日志化归档该字段语义治理路径，刷新知识网络对该节点的权重标记。" }
    ]
  },
  {
    id: "DQAssessmentWorkflow",
    name: "DQAssessmentWorkflow",
    description: "基于底层已打上的语义类型标识，自动拉起挂载的最佳实践数据质量套件模板检测。",
    status: "Active",
    runCount: 4230,
    successRate: 97.2,
    nodes: [
      { id: "W3-N1", label: "断言被确认/更改事件", type: "Trigger", description: "语义类型由 Proposed 升迁至 Confirmed 时自动派生执行。" },
      { id: "W3-N2", label: "拉取质量断言判定绑定规则", type: "Function", description: "关联 Field matched DataQualityRule，例如检测身份证号是否都是18位。" },
      { id: "W3-N3", label: "执行校验 SQL 或算式匹配", type: "Action", description: "下发至生产或预生产引擎跑质检，产生问题分析结果。" },
      { id: "W3-N4", label: "异常量触碰断开阈值？", type: "Condition", description: "判断异常行数是否过多，过多直接创建 DataIssue 实例纠纷。" },
      { id: "W3-N5", label: "createGovernanceTask", type: "Action", description: "如果是超限阻断级事故，立刻生成人工治理工作任务分拨主管。" }
    ]
  }
];

export const INITIAL_CHANGE_SETS: ChangeSet[] = [
  {
    id: "CS-2026-012",
    title: "语义字段模型优化与多域映射定义",
    description: "近期金融监管及敏感个人信息存储规定收紧，对 Field 上的 semantic_type 定义做补充释义，并新增 DomainMapping 的跨层 Link Type。优化字段主备外键推演的 detectForeignKey 属性，使其具备高敏感度，并在流程条件进行阈值卡点，保障模型完整输出。",
    date: "2026-06-14",
    status: "editing",
    changes: [
      { type: "modify_property", target: "Field.semantic_type", description: "修改属性格式，增加国际身份证与外派员工手机号掩码等复杂安全标签说明。" },
      { type: "add_link", target: "Field maps_to DomainMapping", description: "全新定义一个名为 maps_to 的 Link Type，支持物理字段节点到核心业务域本体映射。" },
      { type: "bind_capability", target: "Field ↔ detectForeignKey()", description: "为 Field 对象多绑定一个外键自动发现计算函数，用以探测跨数据库主外依赖关系。" },
      { type: "modify_workflow", target: "SemanticReviewWorkflow 阈值调高", description: "将 SemanticReviewWorkflow 条件节点的机器自动决策概率直发阈值从 85% 上提至 90% 严苛度。" }
    ]
  },
  {
    id: "CS-2026-011",
    title: "高敏感核心数据资产数据质量自动熔断规则集成",
    description: "在 DataAsset 及 DataQualityRule 对象属性中新增熔断标志，用以在血缘追溯断裂、字段语义归宿出现颠覆式冲突时，能触发自动中断业务。",
    date: "2026-06-08",
    status: "approved",
    changes: [
      { type: "add_object", target: "IncidentReport", description: "新增事故报告实体，用来归结和持久化质量中断过程中的现场抓包快照。" },
      { type: "add_link", target: "DataIssue produces IncidentReport", description: "将超限额度的数据问题自动升级封装，派生正式的熔断事态追踪单。" }
    ]
  },
  {
    id: "CS-2026-010",
    title: "Snapshot 发布通道隔离配置调整",
    description: "为支持业务系统轻量化挂载，特解耦模型快照 (Snapshot) 中包含的语义边界。优化发布模型时的自动校验，排除无主表对检验的影响，降低系统误报频率。",
    date: "2026-05-20",
    status: "published",
    changes: [
      { type: "modify_property", target: "Snapshot.snapshot_desc", description: "加入发布说明最大字符限制，支持上传发布人身份数字签名，保证链条追溯防抵赖。" }
    ]
  }
];

export const INITIAL_VALIDATION_ITEMS: ValidationItem[] = [
  {
    type: "warning",
    message: "检测到绑定的 detectForeignKey() 计算函数被 2 个核心治理 Workflow 依赖，对其修改可能导致流程参数类型未匹配警告。",
    source: "Field.detectForeignKey()"
  },
  {
    type: "warning",
    message: "新增字段 maps_to 关联行为目前包含 3 个下游 DKN 语义层跨系统视图在使用，修改此映射关系会导致 DKN 知识图谱发生关系重定向。",
    source: "LinkType: maps_to"
  },
  {
    type: "info",
    message: "DataSource 中定义的所有 properties 已全部完成与 ClickHouse 及 MySQL 物理字段属性解析协议的安全挂接测试。",
    source: "ObjectType: DataSource"
  }
];
