# Semovix Ontology UI Final Polish（Batch 4.5）

基线：`d38031e`（Batch 4 · 校验 / 影响分析 / 发布）。
范围：只做企业级视觉、产品语言、演示数据与诊断能力收口；
**不修改** Batch 1～4 已完成的 HTTP 契约消费、领域模型、草稿写入、
校验 / 影响分析与发布逻辑（OpenAPI、Mock 状态机、seed 与 generated types
均未改动）。

## 一、演示数据

- `scripts/reset-ontology-demo.mjs`（`npm run demo:reset`）：只重置默认本地
  Mock DB（`ontology-delivery/mock-server/.data/db.json`），服务端重启后
  自动落回种子（2 个模型：数据治理本体 `drkn-core` + 公共服务业务本体
  `public-service`）。服务端运行中会拒绝执行并提示先停止。
- **不在服务端按模型名称过滤 test / hello**：全新演示库的干净来自全新
  `MOCK_DB_PATH`（截图与 E2E 沿用临时库机制），不是名称黑名单。

## 二、设计系统（src/styles/semovix-tokens.css）

- 令牌：页面主标题 22px / 区块标题 16px / 正文与表格 ≥13px / 辅助 ≥12px /
  表格行高 ≥44px / 卡片圆角 12px / Semovix Blue `#2563eb`。
- 组件类：`.semovix-page-title` `.semovix-section-title` `.semovix-card`
  `.semovix-btn-primary` `.semovix-btn-outline` `.semovix-btn-text`
  `.semovix-table`。
- 下限覆盖只作用于本体产品区域（`[data-testid='semovix-main']` 子树，
  属性+类选择器优先级高于 Tailwind 工具类）：9~11.5px → 12px、
  12/12.5/13.5px 与 `text-xs` → 13px、表格 `td` padding-block 12px
  （≈44px 行高）、`rounded-2xl` → 12px、`bg-slate-800/700` → Semovix Blue。
  区域外的 DKN 页面不受影响。
- 普通操作禁用黑色按钮：RelationsPage 视图切换 / 类别筛选、
  ImplementationsPage 类型筛选、WorkflowsPage 步骤序号等已改为品牌蓝
  （源码级替换，CSS 覆盖兜底其余历史类名）。

## 三、业务本体列表（OntologyModelsList + OntologyModelsTable）

- 系统模型 → 紧凑基础模型区域（`system-model-strip`，一行一条）。
- 业务本体 → 紧凑表格（`ontology-models-table`）：业务本体 / 责任方 /
  当前版本 / 草稿 / 操作。
- 默认隐藏 `modelId`、`changeSetId`、`ownerRef` 原始值（责任方经
  `ownerDisplayName` 显示展示名称；完整值在模型内页诊断信息）。
- 新建按钮 →「新建业务本体」；主操作按状态唯一：有草稿 → 继续草稿；
  有正式版本无草稿 → 创建变更；尚未发布 → 继续建模。次操作（查看版本）
  为文本按钮。
- 不伪造更新时间、业务域、健康评分（契约未提供这些字段）。

## 四、模型总览（Overview）

- 删除六张大 KPI 统计卡 → `ModelSummaryStrip`（对象类型 / 关系 / 约束 /
  行动契约 / 实现绑定 / 流程引用，点击进入对应能力页）。
- 删除默认全量 31 节点 / 39 关系交叉图 → `SemanticRegionMap`：按
  `ObjectTypeDefinition.group` 聚合为语义区域；只显示区域级关系摘要与
  类型摘要。点击区域卡片 → 对象类型页并应用 `group` URL 过滤；
  点击关系摘要 → 关系与约束页。完整节点级关系图保留在关系页结构视图。
- 数量仍来自当前 `ResolvedView.document` 的实时计算。

## 五、对象类型（ObjectModel）

- 搜索占位符 →「搜索类型名称或标识」。
- SYSTEM 是常态不再重复显示系统 Badge；LOCAL / EXTERNAL 作为例外状态
  显示（`OriginBadge`）。
- 新增 `TypeUsageSummary`：用当前 document 计算 incoming / outgoing
  relations、constraints、actions、workflow references、implementation
  bindings（不新增接口、不伪造数据）。
- 正式版本只读、草稿保存、If-Match、412 冲突与 EXTERNAL 只读链路不变。

## 六、模型头与状态带（OntologyLayout）

- 产品层默认隐藏 `model.id`；ownerRef 显示展示名称。
- 草稿状态 →「编辑草稿 · rN」；完整 ChangeSet ID 移入诊断信息。
- 基线版本 / 目标版本 /「正式版本未受草稿影响」说明保留。
- 运行控制、目标版本卡、保存横幅、审计行等处的任务 / 发布 / 审计标识
  统一 `shortId()`（8 字符 + …，title 提示完整值见诊断信息）。

## 七、诊断信息（TechnicalDetails + presentation.ts）

- 右上角不再常驻「技术详情」按钮 → 「更多」菜单中的「查看诊断信息」。
- 可见性：`import.meta.env.DEV && VITE_ENABLE_ONTOLOGY_DIAGNOSTICS === 'true'`
  或 capability `ontology.diagnostics.read`（当前演示身份均不具备该
  capability，故仅开发配置可见；viewer 一律不可见）。
- 更名「诊断信息」；支持复制页面链接、contentHash、ETag（剪贴板 API
  失败时降级选区复制）。
- Raw JSON 字段白名单（implementations / workflows / ioContracts），不显示
  Token、Secret、连接地址与凭证。

## 八、group URL 参数（routeContext + ModelContext）

- `group` 是纯客户端路由参数（不属于 HTTP 契约），用于语义区域图下钻：
  `navigateToView(view, {group})`；`null` 显式清除、`undefined` 在停留在
  object-types Tab 时继承。刷新 / 分享可复现，清除按钮
  （`clear-group-filter`）回到全部分组。

## 九、测试与截图

- `tests/e2e/final-polish.spec.ts`：全新演示库只有种子模型、列表产品语言、
  总览无 KPI 卡与全量节点图、区域图下钻、产品层无完整
  ChangeSet ID / UUID / API Path、诊断入口关闭配置时不可见
  （maintainer 与 viewer）、Batch 1~4 能力不回退。
- `scripts/e2e-ontology.mjs`：分组改为 `{specs, grep?, viteEnv?}`；诊断
  相关组以 `VITE_ENABLE_ONTOLOGY_DIAGNOSTICS=true` 启动 vite，final-polish
  与正式截图组关闭旗标；env 指纹变化时自动重启 vite
  （`import.meta.env` 在 dev server 启动时固化）。
- 截图：01～09 正式截图（诊断旗标关闭，不打开诊断抽屉）+
  `10-diagnostics-development-only.png`（开旗标单独拍摄）。
- batch35 / batch4 中「技术详情」入口断言更新为「更多」菜单 → 诊断信息。

## 十、运行

```bash
npm run lint              # tsc --noEmit
npm run lint:ontology     # tsconfig.ontology.json（含 Batch 4.5 新组件）
npm run build
npm run test:ontology-contract
npm run test:e2e:ontology-ui           # batch35+36 → batch4 → final-polish
npm run test:e2e:ontology-screenshots  # 01-09 → 10-diagnostics（开旗标）
npm run demo:reset         # 重置默认本地 Mock DB（服务端运行中会拒绝）

# 冒烟脚本（Batch 1~4 回归，真实写库）：需先以独立端口 + 全新临时库起 Mock，例如
PORT=4311 MOCK_DB_PATH=$(mktemp -d)/db.json node ontology-delivery/mock-server/server.mjs &
ONTOLOGY_API_BASE=http://127.0.0.1:4311 npx tsx scripts/smoke-adapter.ts
# smoke-batch2 / smoke-batch3 / smoke-batch4 同法（每次运行都要全新库）。
```

> 演示数据全部来自本地契约 Mock 服务；未连接任何生产后端、真实治理
> 运行时或真实下游系统。
