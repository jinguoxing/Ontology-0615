# 九页接口与行为矩阵

| 页面 | 仓库组件 | 页面实际接口 | 行为 |
|---|---|---|---|
| 01 本体列表 | OntologyModelsList.tsx | GET models；POST models；GET/POST changesets | 创建业务本体、继续草稿、进入指定版本；系统模型默认存在 |
| 02 模型总览 | Overview.tsx | GET model；GET view；GET graph | 图表统一读取同一contentHash；只有显式编辑才创建草稿 |
| 03 对象类型 | ObjectModel.tsx | GET object-types / view；POST operations | 属性与类型定义UPSERT；外部类型不能改权威内容 |
| 04 关系与约束 | RelationModel.tsx | GET relations / constraints / graph；POST operations | 图/表/Inspector一致；双端基数；删除引用影响可定位 |
| 05 行动契约 | ActionModel.tsx | GET actions；GET registry / action-fixtures；POST operations / action-tests | 维护契约；只在内置fixture上模拟，不启动真实操作 |
| 06 实现绑定 | CapabilityBinding.tsx | GET implementation-bindings；GET registry；POST operations | 选择固定实现版本，检查IO和副作用 |
| 07 流程关联 | WorkflowOrchestrator.tsx | GET workflow-refs；GET registry；POST operations | 维护引用、不编辑流程内部、不运行真实工作流 |
| 08 校验与影响 | 新增OntologyValidation.tsx | POST validation-runs / impact-analyses；GET jobs；POST operations | 真实校验阻断、依赖修复、重算；绑定修订与Hash |
| 09 变更与发布 | ChangeRelease.tsx | GET changeset / diff / versions / audit-events；POST publications | 同一变更集Diff与报告；原子新版本；历史不变 |

## 完整HTTP接口（30个操作）

前缀不会隐藏在组件内。下面均为本轮定义并有Mock HTTP实现的路由，非已存在生产路由的宣称。所有操作的参数、错误与响应以OpenAPI为准。

| Method | Path | operationId | 请求Schema | 响应data Schema | HTTP | If-Match | 幂等键 |
|---|---|---|---|---|---|---|---|
| GET | `/health` | health | — | Health | 200 | — | — |
| GET | `/api/v1/ontology/session` | getSession | — | Session | 200 | — | — |
| GET | `/api/v1/ontology/models` | listModels | — | ModelsList | 200 | — | — |
| POST | `/api/v1/ontology/models` | createModel | CreateModelRequest | CreateModelResult | 201 | — | 必须 |
| GET | `/api/v1/ontology/models/{modelId}` | getModel | — | ModelSummary | 200 | — | — |
| GET | `/api/v1/ontology/models/{modelId}/view` | getView | — | ResolvedView | 200 | — | — |
| GET | `/api/v1/ontology/models/{modelId}/graph` | getGraph | — | Graph | 200 | — | — |
| GET | `/api/v1/ontology/models/{modelId}/object-types` | listObjectTypes | — | ObjectTypesList | 200 | — | — |
| GET | `/api/v1/ontology/models/{modelId}/relations` | listRelations | — | RelationsList | 200 | — | — |
| GET | `/api/v1/ontology/models/{modelId}/constraints` | listConstraints | — | ConstraintsList | 200 | — | — |
| GET | `/api/v1/ontology/models/{modelId}/actions` | listActions | — | ActionsList | 200 | — | — |
| GET | `/api/v1/ontology/models/{modelId}/implementation-bindings` | listImplementationBindings | — | ImplementationBindingsList | 200 | — | — |
| GET | `/api/v1/ontology/models/{modelId}/workflow-refs` | listWorkflowRefs | — | WorkflowRefsList | 200 | — | — |
| GET | `/api/v1/ontology/models/{modelId}/changesets` | listChangeSets | — | ChangesetsList | 200 | — | — |
| POST | `/api/v1/ontology/models/{modelId}/changesets` | createChangeSet | CreateChangeSetRequest | ChangeSet | 201 | — | 必须 |
| GET | `/api/v1/ontology/models/{modelId}/changesets/{changeSetId}` | getChangeSet | — | ChangeSet | 200 | — | — |
| POST | `/api/v1/ontology/models/{modelId}/changesets/{changeSetId}/operations` | applyOperations | ApplyOperationsRequest | ChangeSet | 200 | 必须 | 必须 |
| POST | `/api/v1/ontology/models/{modelId}/changesets/{changeSetId}/abandon` | abandonChangeSet | AbandonRequest | ChangeSet | 200 | 必须 | 必须 |
| GET | `/api/v1/ontology/models/{modelId}/changesets/{changeSetId}/diff` | getDiff | — | DiffResult | 200 | — | — |
| POST | `/api/v1/ontology/models/{modelId}/changesets/{changeSetId}/validation-runs` | startValidation | RevisionRequest | AsyncJob | 202 | 必须 | 必须 |
| POST | `/api/v1/ontology/models/{modelId}/changesets/{changeSetId}/impact-analyses` | startImpact | RevisionRequest | AsyncJob | 202 | 必须 | 必须 |
| GET | `/api/v1/ontology/models/{modelId}/jobs/{jobId}` | getJob | — | AsyncJob | 200 | — | — |
| POST | `/api/v1/ontology/models/{modelId}/changesets/{changeSetId}/publications` | publishVersion | PublishRequest | Publication | 201 | 必须 | 必须 |
| GET | `/api/v1/ontology/models/{modelId}/versions` | listVersions | — | VersionsList | 200 | — | — |
| GET | `/api/v1/ontology/models/{modelId}/versions/{versionId}` | getVersion | — | VersionRecord | 200 | — | — |
| GET | `/api/v1/ontology/models/{modelId}/audit-events` | listAuditEvents | — | AuditEventsList | 200 | — | — |
| GET | `/api/v1/ontology/registry` | getRegistry | — | Registry | 200 | — | — |
| GET | `/api/v1/ontology/action-fixtures` | listActionFixtures | — | ActionFixturesList | 200 | — | — |
| POST | `/api/v1/ontology/models/{modelId}/action-tests` | testAction | ActionTestRequest | ActionTestResult | 200 | — | 必须 |
| POST | `/__demo/reset` | resetDemo | ResetRequest | ResetResult | 200 | — | — |

## 视图选择

所有页面读取接口必须指定：`versionId=v1.3.0`，或`changeSetId=cs-drkn-demo&revision=12`，两者互斥。`getDiff`也必须指定revision。只用DRKN/DKN标签或selectedObjectId不构成数据隔离。

## 草稿写入例子

```http
POST /api/v1/ontology/models/drkn-core/changesets/cs-drkn-demo/operations
Authorization: Bearer demo-maintainer
X-Workspace-Id: ws-demo
Content-Type: application/json
If-Match: "cs-drkn-demo:r12"
Idempotency-Key: fix-runtime-dependency-001

{"operations":[{"op":"UPSERT","collection":"dependencies","id":"runtime","value":{"id":"runtime","packageId":"runtime","versionId":"v1.0.0"}}]}
```

返回的ChangeSet.revision为13；新的ETag来自响应。正式v1.3.0和历史r12保持不变。

## 错误必须落到页面

| HTTP/Code | 页面处理 |
|---|---|
| 401 | 回到现有登录流程，不静默换demo身份 |
| 403 | 显示无权操作，保留已有只读结果 |
| 404 | 说明模型/版本/构件不存在，不显示默认Field替代 |
| 409 BASE_VERSION_ADVANCED | 显示正式基线前移，停止发布，不覆盖 |
| 409 REPORT_STALE | 明确要求对当前修订重新计算 |
| 409 VALIDATION_BLOCKED | 定位具体阻断，不提示通用失败 |
| 412 REVISION_CONFLICT | 保存输入、提示重新加载并处理并发差异 |
| 422 | 字段级显示Schema错误 |
| 428 | 视为接线错误，补If-Match，不用重试掩盖 |
| 5xx/断网 | 明确错误及重试，不回退静态数组 |
