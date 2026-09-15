# Semovix 数据治理能力—本体契约对齐表

这里列出的稳定ID、字段和契约路径是本轮工程设计。能力依据来自既有Semovix功能；具体生产DTO与服务URL尚未核实。所有实例值均为演示数据。

## 1. 类型目录

| 稳定类型ID | 中文名 | 所属能力 | 权威职责 | 类型来源 | 关键属性 |
|---|---|---|---|---|---|
| `DataSystem` | 数据系统 | 来源与结构 | `data-connection` | SYSTEM | systemId、name、ownerRef |
| `DataSource` | 数据源 | 来源与结构 | `data-connection` | SYSTEM | dataSourceId、name、connectorId、secretRef、lifecycleStatus、healthStatus、lastCheckedAt |
| `Namespace` | 命名空间 | 来源与结构 | `data-connection` | SYSTEM | namespaceId、qualifiedName、kind |
| `DataAsset` | 数据资产 | 来源与结构 | `asset-service` | SYSTEM | assetId、technicalName、businessName、assetType、currentVersionId、lifecycleStatus |
| `Field` | 字段 | 来源与结构 | `asset-service` | SYSTEM | fieldId、technicalName、dataType、nullable、currentVersionId |
| `AssetVersion` | 资产结构版本 | 来源与结构 | `asset-service` | SYSTEM | versionId、schemaHash、observedAt、previousVersionId |
| `ProfileSnapshot` | 画像快照 | 画像与观测 | `profiling` | SYSTEM | profileId、assetVersionId、samplingPolicy、observedAt、availability、freshness |
| `ProfileObservation` | 画像观测项 | 画像与观测 | `profiling` | SYSTEM | observationId、measureCode、value、unit |
| `DataQualityRule` | 质量规则 | 数据质量 | `quality` | SYSTEM | ruleId、name、dimensionCode、condition、expectation、status、version |
| `QualityPlan` | 质量监测方案 | 数据质量 | `quality` | SYSTEM | planId、name、targetScope、scheduleRef、status |
| `QualityMeasurement` | 质量测量 | 数据质量 | `quality` | SYSTEM | measurementId、ruleVersionId、assetVersionId、measuredValue、evaluatedCount、failedCount、result、observedAt |
| `DataIssue` | 质量问题 | 数据质量 | `quality` | SYSTEM | issueId、title、status、severity、dedupKey |
| `Remediation` | 问题处置记录 | 数据质量 | `quality` | SYSTEM | remediationId、description、status、verificationRef |
| `SemanticAssertion` | 语义断言 | 数据语义 | `data-semantics` | SYSTEM | assertionId、subjectRef、subjectVersionRef、predicate、candidateValue、lifecycleStatus、resolutionQueue、confidence、evidenceCompleteness、decisionRef |
| `SemanticType` | 语义类型字典项 | 数据语义 | `semantic-config` | SYSTEM | typeId、code、name、definition |
| `FieldRole` | 字段角色字典项 | 数据语义 | `semantic-config` | SYSTEM | roleId、code、name、definition |
| `SemanticPolicy` | 语义理解配置版本 | 数据语义 | `semantic-config` | SYSTEM | policyId、version、scope、configurationRef |
| `Evidence` | 证据 | 证据与责任 | `evidence` | SYSTEM | evidenceId、dimension、summary、rawRef、targetVersionRef、observedAt |
| `GovernanceAssignment` | 责任归属 | 证据与责任 | `governance` | SYSTEM | assignmentId、targetRef、principalRef、role、effectiveFrom |
| `Classification` | 分类标记 | 证据与责任 | `governance` | SYSTEM | classificationId、code、name、schemeRef |
| `TrustReport` | 质量可信报告 | 数据质量 | `quality` | SYSTEM | reportId、targetVersionRef、dimensions、limitations、observedAt |
| `Run` | 运行引用 | 外部契约引用 | `runtime` | EXTERNAL | 引用 runtime / v1.0.0 |
| `GovernanceTask` | 治理任务引用 | 外部契约引用 | `task-center` | EXTERNAL | 引用 runtime / v1.0.0 |
| `BusinessObject` | 业务对象引用 | 外部契约引用 | `business-object` | EXTERNAL | 引用 business / v1.0.0 |
| `BusinessProperty` | 业务属性引用 | 外部契约引用 | `business-object` | EXTERNAL | 引用 business / v1.0.0 |
| `AlignmentCandidate` | 数据支撑候选引用 | 外部契约引用 | `data-support` | EXTERNAL | 引用 grounding / v1.0.0 |
| `DataImplementation` | 对象数据实现引用 | 外部契约引用 | `data-support` | EXTERNAL | 引用 grounding / v1.0.0 |
| `PropertyGrounding` | 属性对应引用 | 外部契约引用 | `data-support` | EXTERNAL | 引用 grounding / v1.0.0 |
| `RelationshipGrounding` | 关系对应引用 | 外部契约引用 | `data-support` | EXTERNAL | 引用 grounding / v1.0.0 |
| `MetricImplementation` | 指标实现引用 | 外部契约引用 | `metrics` | EXTERNAL | 引用 grounding / v1.0.0 |
| `Metric` | 指标定义引用 | 外部契约引用 | `metrics` | EXTERNAL | 引用 business / v1.0.0 |

### 类型职责说明

**DataSystem**：产生或承载数据的系统登记信息；不等于连接配置。

**DataSource**：Semovix 可连接、扫描或查询的入口。凭证仅为引用，不存密码。

**Namespace**：兼容数据库、Catalog、Schema，允许层级但不强制每种连接器具备每层。

**DataAsset**：可治理的数据资源；具体类型支持程度由连接器能力决定。

**Field**：保留原仓库 Field 稳定类型 ID；不把本轮 AI 置信度写入字段定义。

**AssetVersion**：扫描形成的结构快照；不是本体模型发布版本。

**ProfileSnapshot**：一次画像产物；运行状态由 Run 维护，快照保留时间和采样边界。

**ProfileObservation**：空值率、唯一率、模式等观测值；真实 Top Values 只能受控引用。

**DataQualityRule**：保留旧 DataQualityRule ID；具体 IF/THEN、SQL/DSL 编辑属于质量模块。

**QualityPlan**：组织目标范围和多个质量规则；本体只定义其结构和关联。

**QualityMeasurement**：检测结果与问题分离；测量值不自动成为质量问题。

**DataIssue**：保留旧 DataIssue ID；违反规则后形成的问题，不等于执行任务。

**Remediation**：记录处置与复核；不代表默认可以修改源业务数据。

**SemanticAssertion**：表、字段、数据关系的语义判断。UNKNOWN 是语义值，IGNORE 是角色值，二者都不是生命周期。

**SemanticType**：语义类型配置引用。既有 UNKNOWN 等枚举由原字典维护，不在本体另造字典编辑器。

**FieldRole**：字段的结构/业务作用；保留 IGNORE 与 TECHNICAL、AUDIT_FIELD 的区别。

**SemanticPolicy**：引用表/字段理解规则、字典和分流配置；不把算法阈值散落在本体关系上。

**Evidence**：D1–D8 为既有证据信号；人工决定单列来源。证据摘要不复制真实敏感样本。

**GovernanceAssignment**：记录谁维护，不替代授权判定。

**Classification**：敏感分类、主题分类等既有治理标签的类型契约；不自行授予权限。

**TrustReport**：在给定范围与时间上汇总测量和问题；没有测量不得生成虚构满分。

**Run**：引用 runtime 的 Run 类型契约；不在本体复制实例或管理其运行状态。

**GovernanceTask**：引用 task-center 的 GovernanceTask 类型契约；不在本体复制实例或管理其运行状态。

**BusinessObject**：引用 business-object 的 BusinessObject 类型契约；不在本体复制实例或管理其运行状态。

**BusinessProperty**：引用 business-object 的 BusinessProperty 类型契约；不在本体复制实例或管理其运行状态。

**AlignmentCandidate**：引用 data-support 的 AlignmentCandidate 类型契约；不在本体复制实例或管理其运行状态。

**DataImplementation**：引用 data-support 的 DataImplementation 类型契约；不在本体复制实例或管理其运行状态。

**PropertyGrounding**：引用 data-support 的 PropertyGrounding 类型契约；不在本体复制实例或管理其运行状态。

**RelationshipGrounding**：引用 data-support 的 RelationshipGrounding 类型契约；不在本体复制实例或管理其运行状态。

**MetricImplementation**：引用 metrics 的 MetricImplementation 类型契约；不在本体复制实例或管理其运行状态。

**Metric**：引用 metrics 的 Metric 类型契约；不在本体复制实例或管理其运行状态。

## 2. 关系目录

基数均有方向：targetCardinality是“每个源对象关联多少目标”，sourceCardinality是反向。`max=null`表示不设上限；不能把N:1反写成1:N。包含、证据、质量、来源和数据支撑分类独立，不统一标成lineage。

| 关系ID | 关系含义 | 源 → 目标 | 分类 | 每源目标数 |
|---|---|---|---|---|
| `source_of_system` | 归属系统 | `DataSource → DataSystem` | CONTAINMENT | 0..1 |
| `exposes_namespace` | 暴露命名空间 | `DataSource → Namespace` | CONTAINMENT | 0..N |
| `namespace_parent` | 上级命名空间 | `Namespace → Namespace` | CONTAINMENT | 0..1 |
| `contains_asset` | 包含资产 | `Namespace → DataAsset` | CONTAINMENT | 0..N |
| `has_field` | 包含字段 | `DataAsset → Field` | CONTAINMENT | 0..N |
| `has_asset_version` | 具有结构版本 | `DataAsset → AssetVersion` | PROVENANCE | 0..N |
| `profile_of` | 画像针对结构版本 | `ProfileSnapshot → AssetVersion` | PROVENANCE | 1..1 |
| `has_observation` | 包含观测 | `ProfileSnapshot → ProfileObservation` | PROVENANCE | 0..N |
| `field_observed_by` | 字段被观测 | `Field → ProfileObservation` | PROVENANCE | 0..N |
| `plan_uses_rule` | 方案采用规则 | `QualityPlan → DataQualityRule` | QUALITY | 0..N |
| `plan_targets_asset` | 方案检测资产 | `QualityPlan → DataAsset` | QUALITY | 0..N |
| `measurement_uses_rule` | 测量采用规则 | `QualityMeasurement → DataQualityRule` | QUALITY | 1..1 |
| `measurement_of_version` | 测量针对结构版本 | `QualityMeasurement → AssetVersion` | QUALITY | 1..1 |
| `issue_from_measurement` | 问题源自测量 | `DataIssue → QualityMeasurement` | QUALITY | 1..N |
| `issue_affects_field` | 问题影响字段 | `DataIssue → Field` | QUALITY | 0..N |
| `resolved_by` | 由处置记录处理 | `DataIssue → Remediation` | QUALITY | 0..N |
| `has_assertion` | 具有语义断言 | `Field → SemanticAssertion` | SEMANTIC | 0..N |
| `asset_has_assertion` | 表级语义断言 | `DataAsset → SemanticAssertion` | SEMANTIC | 0..N |
| `assertion_of_version` | 断言引用结构版本 | `SemanticAssertion → AssetVersion` | PROVENANCE | 1..1 |
| `supported_by` | 由证据支持 | `SemanticAssertion → Evidence` | EVIDENCE | 0..N |
| `uses_semantic_type` | 采用语义类型 | `SemanticAssertion → SemanticType` | SEMANTIC | 0..1 |
| `uses_field_role` | 采用字段角色 | `SemanticAssertion → FieldRole` | SEMANTIC | 0..1 |
| `generated_by` | 由运行生成 | `SemanticAssertion → Run` | PROVENANCE | 0..1 |
| `profile_generated_by` | 画像由运行生成 | `ProfileSnapshot → Run` | PROVENANCE | 1..1 |
| `measurement_generated_by` | 测量由运行生成 | `QualityMeasurement → Run` | PROVENANCE | 1..1 |
| `uses_semantic_policy` | 使用语义配置版本 | `Run → SemanticPolicy` | PROVENANCE | 0..1 |
| `handled_by_task` | 由治理任务处理 | `DataIssue → GovernanceTask` | PROVENANCE | 0..1 |
| `report_uses_measurement` | 报告引用测量 | `TrustReport → QualityMeasurement` | QUALITY | 0..N |
| `classified_as` | 分类为 | `DataAsset → Classification` | OWNERSHIP | 0..N |
| `assigned_to` | 具有责任归属 | `DataAsset → GovernanceAssignment` | OWNERSHIP | 0..N |
| `candidate_for_object` | 候选支撑对象 | `AlignmentCandidate → BusinessObject` | DATA_GROUNDING | 1..1 |
| `candidate_uses_asset` | 候选引用资产 | `AlignmentCandidate → DataAsset` | DATA_GROUNDING | 1..N |
| `implementation_of` | 数据实现支撑对象 | `DataImplementation → BusinessObject` | DATA_GROUNDING | 1..1 |
| `implementation_uses_asset` | 数据实现引用资产 | `DataImplementation → DataAsset` | DATA_GROUNDING | 1..N |
| `implementation_has_property_grounding` | 实现具有属性对应 | `DataImplementation → PropertyGrounding` | DATA_GROUNDING | 0..N |
| `property_grounding_uses_field` | 属性对应引用字段 | `PropertyGrounding → Field` | DATA_GROUNDING | 1..N |
| `property_grounding_of` | 对应业务属性 | `PropertyGrounding → BusinessProperty` | DATA_GROUNDING | 1..1 |
| `implementation_has_relation_grounding` | 实现具有关系对应 | `DataImplementation → RelationshipGrounding` | DATA_GROUNDING | 0..N |
| `metric_implemented_by` | 指标由实现支撑 | `Metric → MetricImplementation` | DATA_GROUNDING | 0..N |

## 3. 行动目录

以下是治理能力契约，不等于25个真实治理接口已经接通。当前Mock只提供3类行动的6个模拟fixture；其他行动可维护契约、查看IO、绑定实现，但不能伪造执行。

| 行动ID | 中文 | 责任方 | 输入类型 → 产物类型 | 前置条件 |
|---|---|---|---|---|
| `testDataSourceConnection` | 验证连接 | `data-connection` | DataSource → Evidence | 凭证只能经 secretRef 解析；遵守连接器只读检测能力 |
| `createDataSource` | 创建数据源 | `data-connection` | 连接/规则草稿参数 → DataSource | 连接草稿验证有效；用户明确确认创建 |
| `updateDataSource` | 更新数据源 | `data-connection` | DataSource → DataSource | 目标修订未变化；变更前完成必要连接检测 |
| `disableDataSource` | 停用数据源 | `data-connection` | DataSource → DataSource | 说明对后续扫描和查询的影响 |
| `startMetadataScan` | 启动元数据扫描 | `data-connection` | DataSource → Run | 连接器支持扫描；范围合法且数据源可用 |
| `cancelRun` | 取消运行 | `runtime` | Run → Run | 运行未进入终态；仅取消指定运行 |
| `retryRun` | 重试失败运行 | `runtime` | Run → Run | 原运行失败且可重试；保留原运行与新尝试关系 |
| `startProfiling` | 执行数据画像 | `profiling` | DataAsset → Run | 限定资产结构版本与采样范围；样本权限在原服务判定 |
| `rerunProfiling` | 重新画像 | `profiling` | ProfileSnapshot → Run | 明确观察范围；不覆盖历史画像 |
| `createQualityRuleDraft` | 创建质量规则草稿 | `quality` | DataAsset → DataQualityRule | 规则条件与期望可解析 |
| `trialQualityRule` | 试跑质量规则 | `quality` | DataQualityRule → Run | 固定规则版本和采样范围 |
| `activateQualityRule` | 启用质量规则 | `quality` | DataQualityRule → DataQualityRule | 必要试跑已完成；用户确认启用范围 |
| `runQualityPlan` | 运行质量监测方案 | `quality` | QualityPlan → Run | 方案使用有效规则版本；目标连接器具备执行能力 |
| `recordRemediation` | 登记问题处置 | `quality` | DataIssue → Remediation | 处置说明与责任归属明确 |
| `verifyRemediation` | 复核问题处置 | `quality` | Remediation → Run | 依据同一规则重测或明确规则版本差异 |
| `generateTrustReport` | 生成可信报告 | `quality` | DataAsset → TrustReport | 仅引用现有测量；明确时效和局限 |
| `startSemanticUnderstanding` | 发起表/字段语义理解 | `data-semantics` | DataAsset → Run | 引用当前画像和结构版本；未知允许 UNKNOWN |
| `recomputeSemanticCandidates` | 补证据并重算候选 | `data-semantics` | SemanticAssertion → Run | 保留当前有效语义；新结果不直接覆盖正式语义 |
| `confirmAssertion` | 确认语义断言 | `data-semantics` | SemanticAssertion → SemanticAssertion | 目标仍为 CANDIDATE；目标结构版本未变化；有非 LLM 依据或可追溯业务确认；冲突已解决；当前用户有确认权限 |
| `rejectAssertion` | 拒绝候选断言 | `data-semantics` | SemanticAssertion → SemanticAssertion | 填写拒绝理由 |
| `confirmIgnoreRole` | 确认忽略字段角色 | `data-semantics` | Field → SemanticAssertion | 保护主体标识及关键关联字段；说明为何可忽略 |
| `assignSteward` | 设置责任归属 | `governance` | DataAsset → GovernanceAssignment | 主体引用可解析；不改变授权策略 |
| `proposeObjectAlignment` | 发现业务对象候选 | `business-object` | DataAsset → AlignmentCandidate | 只生成候选；同表不等于同对象 |
| `confirmObjectSupport` | 确认对象数据支撑 | `data-support` | AlignmentCandidate → DataImplementation | 对象定义有效；范围/粒度/主体标识明确；依据与版本齐全 |
| `correctPropertyGrounding` | 修正属性对应 | `data-support` | PropertyGrounding → PropertyGrounding | 只修改对应修订；不改业务对象定义或资产结构 |

## 4. 计算能力与流程引用

计算能力：classifyFieldSemantic、inferTableSemantics、detectRelationshipCandidates。仅返回候选与解释，不直接生效正式定义。语义关系识别纳入表/字段现有处理，不新造关系理解入口。

25个行动和3个计算的具体输入/输出Schema位于 `contracts/operation-io.schema.json`；Registry.ioContracts与其引用一一对应。25个行动均给出明确输入Schema；这些是本轮新增的规范请求，实际接入原服务时由Adapter对齐生产DTO，不宣称已等同现网参数。

| 流程引用 | 场景 | 消费行动 |
|---|---|---|
| `DataSourceSetup@v1.0.0` | 数据源接入 | testDataSourceConnection, createDataSource |
| `MetadataScan@v1.0.0` | 元数据扫描 | startMetadataScan |
| `Profiling@v1.0.0` | 画像采集 | startProfiling |
| `SemanticReview@v1.0.0` | 语义理解与例外处理 | startSemanticUnderstanding, recomputeSemanticCandidates, confirmAssertion, rejectAssertion |
| `QualityMonitoring@v1.0.0` | 质量监测与复核 | trialQualityRule, runQualityPlan, recordRemediation, verifyRemediation |
| `DataSupportResolution@v1.0.0` | 业务对象数据支撑 | proposeObjectAlignment, confirmObjectSupport, correctPropertyGrounding |

## 5. 必须删除或迁移的旧表达

- `confidence > 0.8 → publish_model`：删除。分流不是本体版本发布。
- 字段状态 `UNKNOWN`：改为语义值；生命周期单独。
- 关系上的 `isAiVisible` / `requiresAuth`：不能代替真实鉴权；保留原权限能力引用，不新建策略编辑页。
- `Snapshot`：先识别其是本体版本还是画像结果，分别迁移，不能仅改显示名。
- `instanceCount`、本轮confidence：从ObjectTypeDefinition剥离，不能按真实生产数展示。
- `check_sql`：具体规则实现由质量模块维护；本体只管理其规则类型合同。
- 真实样本、密码、连接器凭证：不进入本体模型文档或搜索投影。
- 业务对象数据支撑：引用已有DataImplementation/Grounding，不混入实现绑定页面。
