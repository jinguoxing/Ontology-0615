# Semovix Ontology-0615｜仓库定向改造与可演示交付合同 V1

- 仓库：`jinguoxing/Ontology-0615`
- 分支基线：`v2026.6.22`
- 已核对提交：`f5a87f76850d0c393b5709b8f69bd5af13f13ca9`
- 目标：保留现有页面骨架，完成“模型选择 → 草稿编辑 → 实际校验 → 影响解释 → 版本发布”的闭环。
- 接口策略：真实 HTTP 路由、正式请求响应合同、可持久化 Mock 数据。不是在 React 组件里伪造成功。
- 本包状态：已提供并测试 API Mock 服务及独立客户端模块；原仓库九个页面仍需按本文接入。未提交远端代码，未联调 Semovix 生产服务。

## 1. 本轮只做什么

本轮建设“本体定义管理”的可演示纵向闭环，不重写 Semovix 整个平台。当前代码使用 React 19、Vite 6、TypeScript、React Query 5、Zustand 5；以仓库 package.json / lockfile 为准，不因早期方案提到 React 18 就降级依赖。

**保留九个页面：**本体列表、模型总览、对象类型、关系与约束、行动契约、实现绑定、流程关联、校验与影响、变更与发布。九页属于一个功能，不是九个一级菜单。

**不得借本次改造新增：**数据治理本体管理中心、第二个工作流编排器、指标定义编辑器、数据支撑映射器、权限策略编辑器、自由知识图谱编辑器、全量数据治理 UI。

## 2. 输入资料的优先顺序

1. 本次用户明确目标和最新仓库审查结论。
2. 指定提交中的真实实现；用于定位改造点，不能把硬编码示例等同于生产规则。
3. Semovix 已有数据连接、数据语义、质量、业务对象数据支撑和服务超市能力边界。
4. 最近九张修正版图/HTML：作为视觉与状态参考，不把其中示例数字硬编码进新页面。
5. 本文的新 Schema、接口 ID、测试种子：本轮工程设计，不声称它们已经是线上接口。

历史资料中旧品牌、旧导航、OpenClaw、GKN 晋升和强制审批不在本轮恢复。源文档中的示例算法权重不直接升级为经验证的生产算法。出处和明确修正见 `SOURCE_LEDGER.md`。

## 3. 必须分开的三个层级

| 层级 | 例子 | 本轮职责 |
|---|---|---|
| 本体管理元模型 | Model、ChangeSet、Version、ObjectTypeDefinition、RelationDefinition | 本轮 API 是其权威读写入口 |
| 数据治理领域类型 | DataSource、Field、SemanticAssertion、QualityMeasurement | 在类型页面定义其属性/关系/行动 |
| 具体治理记录 | 热线业务库连接、close_time、某次画像、某条待确认断言 | 来源于原服务；本轮只用受控演示 fixture 说明行为 |

创建 `Field` 类型不等于扫描出某个字段；确认一条字段语义不等于发布本体版本。扫描生成资产结构版本，不能自动修改本体类型定义。

### 三种 Binding 不能共用一个含混实体

- **ImplementationBinding（本轮实现绑定页）**：某行动/计算契约对应哪个已注册实现版本。
- **数据支撑/Grounding（外部能力）**：业务对象/属性/关系/指标对应哪些数据实现。
- **PackageDependency**：本体引用哪个外部类型包及版本。

不得在“实现绑定”页编辑 `服务工单.办结时间 → close_time`；那是现有业务对象数据支撑能力。

## 4. 与 Semovix 数据治理能力的对齐范围

具体机器可读模型：`seed/data-governance-model.json`。完整清单：`CAPABILITY_ALIGNMENT.md`。

本轮载入 **21 个治理类型 + 10 个外部类型契约引用、39 条关系、25 个行动契约、28 个实现引用、6 个流程引用**。这些是交付包的种子规模，不是客户数据量，也不是页面 KPI。

| 已有能力 | 本体中需要表达的内容 | 本轮不复制 |
|---|---|---|
| 数据源接入与连接检测 | DataSystem、DataSource、Namespace；连接检测、创建、更新、停用 | 密码、驱动、网络探测真实实现 |
| 扫描与结构变化 | DataAsset、Field、AssetVersion、Run 引用；扫描、取消、重试 | 扫描调度器、Work Item、租约实现 |
| Profiling | ProfileSnapshot、ProfileObservation；画像、重新画像 | 源数据样本库、真实采样引擎 |
| 数据质量 | DataQualityRule、QualityPlan、QualityMeasurement、DataIssue、Remediation、TrustReport | Rule Studio、SQL/DSL 引擎、另一套评分体系 |
| 数据语义 | SemanticAssertion、SemanticType、FieldRole、SemanticPolicy、Evidence | 另一套字段字典、真实 LLM 算法 |
| 责任与分类 | GovernanceAssignment、Classification | 授权策略 Source of Truth |
| 对象数据支撑 | BusinessObject/Property、AlignmentCandidate、DataImplementation、Property/RelationshipGrounding、MetricImplementation 的引用 | 重建 BO Registry 或正式绑定库 |
| 任务与运行 | Run、GovernanceTask 的外部类型引用 | Task Engine 和 Runtime 状态库 |

### 命名兼容

保留仓库已有 `Field / DataQualityRule / DataIssue / Evidence` 稳定 ID。`DataField / QualityRule / QualityIssue / EvidenceItem` 只列为输入兼容别名，UI 中文统一“字段 / 质量规则 / 质量问题 / 证据”。不可在种子中同时创建两套同义类型。

旧 `Snapshot` 如指本体发布版本，迁入管理元模型 `VersionRecord`；不与 `ProfileSnapshot`、`AssetVersion` 混用。旧拼写 `Sanpshot` 必须列为历史异常引用，不能悄悄替换所有来源。

### 语义状态精确约束

- `semanticType = UNKNOWN`：证据不足的语义值。
- `fieldRole = IGNORE`：经确认的角色处置；默认排除业务对象生成和找数召回，技术查询仍受原权限控制。
- `resolutionQueue`：AUTO_PASS / NEEDS_CONFIRM / CONFLICT / ANOMALY / IGNORE_CANDIDATE / NONE。
- `lifecycleStatus`：CANDIDATE / CONFIRMED / REJECTED / SUPERSEDED。

`NONE` 是本轮增加的“当前无待处理项”，不是一种新语义类型。高置信不自动等于可发布；低置信有充分业务依据可以确认。Mock 不实现源文档里的评分公式，也不宣称评分已校准。

本体中的 `DataSource.lifecycleStatus` 与 `healthStatus` 分离；ProfileSnapshot 表达结果/时效，排队与运行状态由 Run 提供。质量规则、测量、问题、复核和报告必须可区分。

## 5. 目标实现架构

```text
现有页面组件
    → React Query hooks（模型/权限/修订隔离）
    → 类型化 HTTP Client
    → /api/v1/ontology/*
    → Controller / 校验 / ChangeSet / Version / Impact 逻辑
    → Repository
        ├ 本轮：单进程持久化 Mock JSON
        └ 后续：原后端持久化与真实能力适配器
```

前端在 Mock 与真实后端模式下都必须走 HTTP。后续替换 Repository 或接入真实服务，不允许改回组件内数据数组。实际生产服务路径未知的能力在 Registry 标记 `liveEndpointVerified=false`、`transport=MOCK`；禁止编造 `data-connection` 线上 URL。

原仓库虽然有 express 依赖，本交付的 Mock 服务使用 Node 22 内建 HTTP 和文件 API，可无第三方依赖启动。它是演示参考实现，不是拟定正式后端技术栈；后续 Go/go-zero 可按同一 OpenAPI 实现。

## 6. 统一模型上下文和缓存

所有模型内页面共用：

```ts
type ViewReference =
  | { versionId: string }
  | { changeSetId: string; revision: number };

type ModelContext = {
  workspaceId: string;
  actorId: string; // 缓存隔离使用，不能代替后端身份
  modelId: string;
  view: ViewReference;
  selectedId?: string;
};
```

- `DRKN | DKN` 是模型类别，不是模型 ID。
- `isLocked` 只能是界面读写状态的派生值，不能承担后端权限或并发锁。
- 页面首次进入无视图参数时：读取 ModelSummary，再将明确的 currentVersionId 写回 URL。后续禁止隐式读 latest。
- URL 示例：`/business-semantics/ontologies/drkn-core/object-types?changeSetId=cs-drkn-demo&revision=12&selected=SemanticAssertion`。
- 编辑保存成功后再将 revision 更新至服务器返回值；失败保留编辑内容，不先解锁/先切页。
- Query Key 包含 workspace、actor、model、view、collection、filters。换身份清空旧缓存，切模型不能先闪现旧模型的结果。
- 图、表、计数、Inspector 都来自同一 ModelDocument 和 contentHash。不得再声明另一份 `localLinkTypes`。
- Zustand 只保存 drawer、选择、布局等 UI 状态。领域模型由 React Query 管理，发布基线由服务器管理。

## 7. 状态与并发合同

### ChangeSet

`OPEN → PUBLISHED` 或 `OPEN → ABANDONED`。校验通过是报告结果，不是草稿永久状态。保存任何内容后旧报告保持历史可读，但不再满足当前发布门禁。

### Version

已发布文档不可变。`Model.currentVersionId` 是当前选择指针。历史版本仍可被固定引用；不把旧版本物理删除或自动改写。

### 异步任务

校验和影响：`RUNNING → SUCCEEDED / FAILED`。`SUCCEEDED` 表示计算完成，`result.passed=false` 仍然可能存在阻断。不得将“任务完成”当作“校验通过”。

### 写入

修改、放弃、启动校验、影响和发布需要强 ETag：`If-Match: "cs-drkn-demo:r12"`。缺失返回428，不匹配返回412。创建和所有状态写入（演示 reset 除外）需要 Idempotency-Key。同键同请求返回原结果，同键不同请求409。

每次保存整个 operations 批次原子成功或失败。`UPSERT` 对目标构件整体替换，不是模糊 deep merge；属性编辑需基于当前修订取完整对象定义再提交。一次批次成功只增加一次 revision。

演示版每个模型最多一个 OPEN ChangeSet；可以同时编辑不同模型。不是多人分支与合并系统。后续多分支是额外能力，不应本轮偷加。

## 8. 真实校验与影响分析

当前 Mock 服务实际计算：Schema 结构、稳定标识、重复 ID/属性编码、关系端点、基数、外部依赖锁版、行动类型引用、实现输入输出与副作用、流程固定版本及依赖行动。

**明确不宣称：**已验证生产记录的唯一性、执行真实 SQL、完成 OWL 推理、全企业依赖覆盖、真实业务场景成功。

约束分 `MODEL_DEFINITION` 与 `GOVERNANCE_RECORD`。后者可以在本体声明，但没有实际记录评估服务时，只检验其定义和引用；页面展示“规则定义有效／实例校验未执行”。

影响分析从具体变更构件出发，沿显式关系形成类型 → 行动 → 实现／流程／已登记消费方路径。演示清单为 `PARTIAL`，必须展示未登记使用关系未知。报告包含具体路径，不输出无依据的“影响 99 个对象”。

报告绑定：workspace/model/changeSet/revision/contentHash/dependencyDigest。保存后、基线变化后、依赖变化后旧报告不得用于发布。

## 9. 发布事务

一次发布应在同一事务内：

1. 重新鉴权并检查 If-Match。
2. 检查草稿 OPEN、目标版本未存在、当前正式版本仍等于 baseVersionId。
3. 验证校验/影响报告属于同一修订、Hash、依赖摘要，且计算成功。
4. 校验结果没有阻断；必要警告或不完整影响范围已明确知悉。
5. 重新执行确定性门禁。
6. 写不可变新 VersionRecord，更新 currentVersionId，标记草稿 PUBLISHED。
7. 同步写发布审计与待发送 outbox 事件。

本地实现通过单进程临界区、内存回滚与单文件原子替换演示；不将其宣传为分布式事务。真实后端应使用数据库事务、持久任务和现有鉴权系统。

发布**不**启动扫描、质量、工作流；不确认字段语义；不发布业务对象/知识网络；不改变服务超市可发现状态；不自动升级消费方固定版本。

历史恢复：基于“当前版本”开新草稿，显式选择 restoreFromVersionId 复制历史结构，重新 Diff、校验和发布。不能直接把指针拨回旧版本冒充零影响回滚。

## 10. HTTP 合同原则

完整30个操作见 `contracts/openapi.yaml` 与 `PAGE_API_MATRIX.md`。

- 成功：`{ data, meta: { requestId, dataMode, contractVersion } }`。
- 失败：`{ error: { code, message, details }, meta }`，不得 HTTP200 装失败。
- Mock 响应 `dataMode=MOCK`；正式合同允许 LIVE，当前服务不会伪装 LIVE。
- 身份：Authorization Bearer，工作空间：X-Workspace-Id；生产中工作空间必须由可信身份校验，不能仅相信客户端 Header。
- 所有列表使用 q/offset/limit；页面不声明更多假筛选。如果增加 profile/status 等筛选，先改 OpenAPI、服务、测试，再显示控件。
- ModelDocument 是受控小规模定义快照；返回所有构件供图/表一致显示，不包含生产实例。
- 接口数据来源、服务错误和无数据三者区分。网络错误禁止自动回退旧静态 mock。

## 11. 仓库逐文件改造清单

| 现有文件 | 必须修改的内容 | 可验证结果 |
|---|---|---|
| `src/types.ts` | 旧 Property/ObjectType/Capability 不再混装实例数、预测置信度、生命周期；引入本包 generated types，暂留兼容别名以分阶段迁移 | 类型对象不会把12,842实例数或0.94预测写入模型定义 |
| `src/api/ontology.ts` | 删除模块级可变数组、sleep和固定草稿ID；对接类型化 HTTP Client | DevTools出现真实请求，刷新仍读服务状态 |
| `src/hooks/useOntology.ts` | 查询/修改带 ModelContext；mutation成功后刷新相应模型查询；处理401/403/409/412 | 切模型、切版本、修订不会串数据 |
| `src/store/uiStore.ts` | 移除由全局modelType推导领域数据的逻辑；isLocked派生；不存第二份模型 | UI状态不决定正式模型是否可写 |
| `src/lib/routeMap.ts` | 增加带modelId、版本/草稿的规范路径；旧路径兼容跳转，不丢当前模型 | 深链接、刷新、后退可恢复 |
| `src/hooks/useRouteSync.ts` | 避免URL和Store双向抢写；领域路由以URL为准，保留selected参数 | 切tab始终相同modelId/view |
| `src/App.tsx` | 接入ModelContextProvider、共享页头；创建草稿提交真实payload，成功后切换；保留非本体模块 | 创建不是仅setActiveView/setLocked |
| `src/components/OntologyModelsList.tsx` | 读取模型接口；真实搜索、创建业务模型、继续草稿；不写死校验成功 | 新模型真实出现，系统模型标识清楚 |
| `src/components/Overview.tsx` | 同一快照投影；显示正式与编辑基线；按需类型关系图 | 不再复用独立大图节点数组 |
| `src/components/ObjectModel.tsx` | 读取对象类型；属性编辑UPSERT进入草稿；外部类型只读；批量规则清楚 | 字段保存改变rN，不改变正式版本 |
| `src/components/RelationModel.tsx` | 删除localLinkTypes；graph/table共享；端点、方向、双端min/max、分类和约束 | 消除Sanpshot和generated_by方向歧义 |
| `src/components/ActionModel.tsx` | 行动契约来自模型；IO从Registry的ioContracts读取；用例测试必须标为模拟 | 低分有依据可通过；高分仅LLM拒绝 |
| `src/components/CapabilityBinding.tsx` | 删除写死Field与函数本地state；引用注册实现/固定版本/IO/副作用 | 换选中类型后详情同步，兼容错误可校验 |
| `src/components/WorkflowOrchestrator.tsx` | 收敛为流程关联；不编排/启动真实流程；删除publish_model语义运行出口 | 当前本体与流程引用不丢上下文 |
| `src/components/ChangeRelease.tsx` | 删除静态changeSets/changes；同一草稿Diff、报告、发布；成功后读版本列表 | 发布内容等于保存的内容 |
| `src/components/CreateModelWizard.tsx` | 改为轻量创建业务本体表单；系统内置不反复新建；POST成功返回初始草稿 | 不再固定五步状态或无参数onComplete |
| `src/components/CreateChangeSetDrawer.tsx` | 真实name/reason/baseVersionId/targetVersionId；去强制reviewer/关联任务 | 失败保留表单，成功进入新草稿 |
| `vite.config.ts`、`package.json` | 添加本轮API代理和启动/测试脚本；保留HMR设置和现有依赖版本 | 两终端可运行，不改现有生产API入口 |

**新增组件建议：** `OntologyLayout.tsx`、`OntologyValidation.tsx`、`OntologyInspector.tsx`、`DraftStatusBar.tsx`。只在消除重复时抽取，不重建通用页面框架。不要一次覆盖巨大 DknObjectModel 文件；本轮先保证它原功能不受影响。

## 12. 页面与交互验收

### 01 本体列表

初始读取两份模型，区分系统内置/业务本体。点击核心模型进入正式版本；“继续草稿”进入cs-drkn-demo/r12。新建只创建业务本体，基线currentVersionId=null且有r0草稿。无选择不显示无归属右侧详情。

### 02 模型总览

正式v1.3.0与草稿r12同时可辨；不能显示“锁定（发布中）”这种含混状态。图默认局部1跳，可按对象类型组筛选。不将31个类型一口气堆成不可读全图。统计数字由快照数组/可见过滤派生。

### 03 对象类型

左类型列表、中属性表、右选中属性Inspector。明确类型定义，不出现真实字段样本。保存完整类型定义进入当前修订；取消只丢本地未保存项；切类型有未保存内容时提示。外部引用只允许升级固定版本，不允许改写权威属性。

### 04 关系与约束

保留表/图切换，统一端点和基数。`Field → has_assertion → SemanticAssertion`；`SemanticAssertion → generated_by → Run`。关系分类不用isLineage一项覆盖全部。关系删除留草稿，校验提示仍引用它的约束，不自动级联删除下游。

### 05 行动契约

默认confirmAssertion；展示调用对象、参数、前置条件、输出、副作用与执行责任方。行动定义不会因按钮点击而直接触发实例操作。“验证用例”只跑已命名fixture，显示MOCK与未真实执行。未实现的契约不得显示“运行成功”。

### 06 实现绑定

从registry选择实现及明确版本，显示IO及副作用；修改写入同一草稿。FUNCTION仅产生计算结果；ACTION可以申请治理状态改变或外部任务。JSON Schema IO是本轮契约，不等于线上URL已验证。

### 07 流程关联

查看6个已注册流程引用；只读展现依赖行动和兼容状态。未有真实外部入口时显示“演示环境未连接运行系统”，不做空按钮、alert成功、假跳转。修改本体关联需进入草稿，流程内部条件/重试仍由原Runtime管理。

### 08 校验与影响

POST后202轮询job；在运行、失败、完成不通过、通过四态中明确区分。r12缺runtime版本，应返回可定位阻断；修复只提交dependency项。重新计算r13通过。保存后历史报告提示过期，不能沿用发布按钮可用态。

### 09 变更与发布

从真实Diff读取新增/修改/移除。展示基线/目标/草稿/校验Hash/依赖/影响范围。发布前v1.4.0不能显示为当前正式版；成功后重新读取模型指针与版本。旧v1.3.0仍可查，consumer的固定版本不自动变化。

## 13. 演示标准不是九张页面能打开

至少完整演示：

1. 打开系统内置模型，查看正式v1.3.0。
2. 继续r12草稿；查验31类型及核心关系。
3. 运行校验，定位runtime依赖未锁版。
4. 选择v1.0.0保存，产生r13；确认正式v1.3.0未改。
5. 重新校验与影响，展示真实差异和已知依赖路径。
6. 发布v1.4.0，再查v1.3.0与新版本。
7. 切换公共服务本体，证明不是同一数据换标题。
8. 重启服务/刷新页面，状态保持。
9. 验证confirmAssertion三个fixture，解释UNKNOWN、证据和冲突边界。
10. 重置演示，重复上述操作得到同样逻辑结果。

还应现场展示一次412：两标签同时读r12，A保存到r13，B不能用旧ETag覆盖。展示一次权限不足：viewer只能看，服务端拒绝其POST。

## 14. 工程执行顺序与停止条件

### R1：契约、种子、Mock

先运行本包测试。将新增目录置入仓库，应用可选启动代理patch，建立HTTP入口。不接前端时先用脚本验证完整发布闭环。

### R2：路由、上下文、统一数据读取

接入列表、总览、对象类型；所有模型页面不再读页面内mock。保证URL、缓存、权限上下文一致，不能先改页面外观掩盖数据问题。

### R3：草稿编辑

对象、关系、行动、实现绑定统一operations入口。端点引用可暂时不完整地保存草稿，但必须阻止未修复发布。外部类型引用和本地类型定义权限区分。

### R4：校验、影响、发布

完成最后两页和r12→r13→v1.4.0贯通。报告不能通过前端手工改结果。处理409/412，审计、历史与发布结果真实读取。

### R5：视觉和演示验收

使用最近九张修正版HTML作视觉参照，保留可读字体、白底蓝色重点、有限图形。完整跑Playwright UI用例与本包API测试。不得只提交截图。

每阶段交付changed-files列表、命令结果、未完成项。遇到契约不满足的需求应记录差异，不擅自增加大平台模块。

## 15. 生产替换边界

真实生产接入还需要：现有身份/权限/审计服务、数据库事务、可靠任务执行与故障恢复、密钥引用与连接器能力注册、真实依赖清单/Graph投影、治理实例API、业务对象和指标权威接口、生产容量/安全测试。

本轮代码没有这些接入，不能声称已经完成。Mock内的能力目录和6个fixture只证明接口与状态流程，不证明算法效果、真实扫描、质量检测或业务决策正确。
