# 可直接交给代码 Agent 的仓库改造任务

你正在修改 `jinguoxing/Ontology-0615`，用户已指定 `v2026.6.22`。先检查 git status，不覆盖用户未提交修改。核对基线提交 `f5a87f76850d0c393b5709b8f69bd5af13f13ca9`；如分支前移，先对本文列出的文件做增量核对，不自动 reset，不强推，不静默退回旧提交。

本任务不是再生成设计图片或重写产品规划，而是将现有 DRKN 本体管理原型改造成可重复演示的真实 HTTP 交互应用。

## 输入

- `ontology-delivery/docs/IMPLEMENTATION_SPEC.md`：主改造合同。
- `ontology-delivery/docs/CAPABILITY_ALIGNMENT.md`：Semovix 类型/关系/行动边界。
- `ontology-delivery/docs/PAGE_API_MATRIX.md`：九页与接口对应。
- `ontology-delivery/contracts/openapi.yaml`：HTTP合同。
- `ontology-delivery/contracts/model.schema.json`：领域与请求响应Schema。
- `ontology-delivery/contracts/operation-io.schema.json`：外部行动/计算的输入输出类型合同；不是已联调生产API。
- `ontology-delivery/seed/*.json`：共享种子，不能每页拷贝一份。
- `ontology-delivery/mock-server/*.mjs`：已测试的独立Mock HTTP参考实现。
- `ontology-delivery/frontend/*.ts`：已类型检查的客户端、类型、查询Key及路由解析。
- 最近一轮九张修正版图：Models、Overview、ObjectTypes、RelationsConstraints、ActionContracts、ImplementationBindings、WorkflowReferences、ValidationImpact、Release。

## 不可变约束

1. 保留原仓库React/Vite/TS/React Query/Zustand技术栈；不降级React，不搭第二个独立应用覆盖现有代码。
2. 九页在同一功能内；不新增“治理中心”等菜单。不移动现有数据语义/业务域/业务术语，不修改不相关知识网络/数据助手模块。
3. UI只经HTTP读写；禁止import seed到组件；禁止以alert、setTimeout和本地数组冒充创建、校验、发布。
4. 正式版本不可变；编辑只进ChangeSet；所有页面共用workspace、actor、modelId和版本/草稿修订。
5. 保留Field、DataQualityRule、DataIssue、Evidence稳定ID，不再造同义对象。
6. Run、GovernanceTask、BusinessObject、Grounding、Metric为外部类型引用；不复制其权威记录。
7. 本体行动契约、能力实现绑定、流程引用保留；不在本体页编排或启动真实治理流程。
8. UNKNOWN是语义值、IGNORE是字段角色、queue是处理队列，均非生命周期。
9. 校验/影响来自当前精确修订，保存后旧报告失效；发布必须服务端重查基线和报告。
10. Mock模式必须可辨。无法实际调用的外部服务显示未连接，不造生产URL，不隐藏失败，不伪称已执行。

## 逐批实施

### Batch 1：本地启动与数据层

- 将交付包放入仓库根目录 `ontology-delivery/`。
- 可先用 `git apply --check ontology-delivery/integration.patch` 验证最小启动补丁，若上游改动导致不适用，按主合同手工合并package scripts及Vite proxy，保留DISABLE_HMR逻辑。
- 启动Node Mock服务，确认health和测试；不要先改UI。
- 将客户端/类型拷贝到命名空间明确的模块，例如 `src/api/ontology-v1/`，不立即删除旧类型导致所有页面无法编译。
- 把原 `src/api/ontology.ts` 的 mock数组读取逐步换成适配器。

### Batch 2：模型上下文与前三页

- 建立 `OntologyLayout / ModelContextProvider`；规范URL并兼容旧/object-model、/relation-model等入口。
- 模型内路由以URL为唯一领域上下文；UI Store只保留抽屉/选择/布局。
- 接入列表、总览、对象类型；新建模型和创建草稿回写服务。
- 检查切模型、切版本、刷新、深链接；不再硬编码Field或CS-2026-012。

### Batch 3：编辑面

- 关系、约束、行动、实现绑定全部通过operations写当前ChangeSet。
- 属性表与Inspector的选择、编辑、取消、保存应真实可用。
- 支持空态、loading、error、readonly、unsaved、stale-ETag状态。
- 实现绑定只引用Registry版本，流程关联只引用外部流程；未实现的操作禁用并说明原因。

### Batch 4：校验→发布闭环

- 新增 `OntologyValidation.tsx`；校验202后轮询，区分任务成功与校验通过。
- 修复runtime依赖，r12保存到r13，重新计算报告。
- ChangeRelease只读当前草稿真实Diff/报告/影响，禁止组件自建changes数组。
- 发布成功生成v1.4.0；刷新后当前版本与历史记录一致。
- 展示失败：旧ETag、旧报告、未锁依赖、viewer写入、重复发布、模拟行动拒绝。

### Batch 5：可演示与回归

- 逐页对照本轮九张修正版图；保留字体、信息密度和图/表分工，不恢复旧的九个功能域拼页。
- 完成 `npm run lint`、`npm run build`；运行本包API tests；补浏览器端Playwright用例。
- 不用截图代替功能验收。记录一次完整演示视频/测试轨迹（本轮你实际能产出哪种就写哪种，不能伪造）。

## 每批必须汇报

- 修改的具体文件。
- 已执行命令与真实结果。
- 哪些接口是HTTP Mock，哪些真实服务尚未连接。
- 尚未完成项和下一批任务，不得把缺失功能描述为“已支持”。

最终交付应是当前仓库的增量改造，不是另一份独立静态HTML、设计图片集或新架构PPT。
