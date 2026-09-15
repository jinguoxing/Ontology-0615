# 依据与设计来源账本

## A. 当前代码事实（已读取）

基线：jinguoxing/Ontology-0615 / v2026.6.22 / f5a87f76850d0c393b5709b8f69bd5af13f13ca9。

- package.json：React19、Vite6、ReactQuery5、Zustand5、TypeScript及既有dev/build/lint命令。
- src/api/ontology.ts：模块级mock数组、250ms模拟延迟、固定CS-2026-012、全量替换关系和能力。
- src/hooks/useRouteSync.ts：UI store和URL双向同步，当前只携带view/objectId。
- src/lib/routeMap.ts：/object-model、/relation-model等路径未携带独立modelId和版本。
- vite.config.ts：保留DISABLE_HMR设置，现状无本轮HTTP Mock代理。
- 上轮仓库审查报告：src/components/*的主要占位写法、模型/运行发布混合、关系图重复数据等。

这些只能证明源码当前行为及改造位置，不能证明线上系统实现。

## B. Semovix 项目资料（能力依据）

1. 《数据连接能力分析.txt》：连接生命周期、扫描、画像、Direct/Federated/Native Search、异步执行和连接器能力差异。是DataSource、AssetVersion、Profile等类型和操作的能力依据；不是本包modelId或API路径的来源。
2. 《0225 · AI语义理解流程优化.txt》：UNKNOWN、IGNORE、D1–D8证据、分流队列和语义配置。采用术语和边界，不把示例权重说成经过评测的标准。
3. 《业务对象合并.txt》：问题→治理任务、去重、证据和推荐动作。Run/Task以外部契约引用，不重建任务引擎。
4. 《0813-服务超市.txt》：领域权威源与搜索投影分离，扫描/语义更新不等于Marketplace发布，修改仍回各权威服务。
5. 当前会话业务对象数据支撑：对象定义、DataImplementation、Property/RelationshipGrounding修订的边界。此轮仅外部引用。
6. 上传《第二篇｜正文V5发布版》：候选≠正式定义，身份、依据、范围、责任、版本；对象复用与本体包不能复制正式语义。

## C. 本轮明确作出的工程设计

- 路由 `/api/v1/ontology/*`、31个种子类型的精确字段、39关系、25行动代码、输入输出Schema、错误码均为本轮新合同。
- ownerService是职责标签，不是已核实的线上服务发现名。
- QualityPlan/TrustReport等字段是根据既有功能需要拟定的最小契约，不声称来自生产DDL。
- NONE队列表示“无待处理项”；不是既有语义类型新增。
- ProfileSnapshot不保存运行状态；Run作为外部运行记录引用。
- Field/DataQualityRule/DataIssue/Evidence保留仓库ID；历史别名不形成重复类型。
- 原文“role≠UNKNOWN”在当前实现中不能照抄：UNKNOWN在语义类型维度，IGNORE在角色维度。此处是明确纠偏，不是无声更改原文。
- 模型版本发布、语义断言确认、业务对象发布、服务超市可见性、消费方升级分别处理。
- 数据治理内置类型由平台维护者治理；扫描更新实例，不自动修改类型定义。

## D. 技术机制的一手依据

- OpenAPI 3.1.0：https://spec.openapis.org/oas/v3.1.0
  用于描述HTTP接口、请求响应与Schema；本包使用3.1.0，不宣称它是最新版本。
- TanStack Query v5 Query Keys：https://tanstack.com/query/v5/docs/framework/react/guides/query-keys
  查询依赖变量应进入key，支撑模型/修订/权限上下文隔离。
- RFC 9110：https://www.rfc-editor.org/rfc/rfc9110.html
  If-Match和412条件请求语义。
- RFC 6585：https://www.rfc-editor.org/rfc/rfc6585.html
  428 Precondition Required。

## E. 未核实/未完成

- Semovix各真实治理服务的线上URL、认证方式、生产DTO和数据库DDL。
- 连接器实际覆盖能力和生产性能；种子只表达能力契约。
- 原仓库九页最终代码接入和浏览器回归。
- 自由规则执行、完整JSONSchema兼容判断、OWL推理、分布式持久任务、生产权限系统。

不能从本包测试通过推导这些已完成。
