# Semovix Ontology-0615｜仓库定向改造包 V1

**目标仓库**：`jinguoxing/Ontology-0615`  
**基线分支**：`v2026.6.22`  
**已核对提交**：`f5a87f76850d0c393b5709b8f69bd5af13f13ca9`

## 先看交付状态

本包提供：可直接交给代码 Agent 的逐文件改造任务、Semovix 数据治理本体种子、OpenAPI、真正监听 HTTP 的有状态 Mock 服务、类型化客户端、测试和演示脚本。

**已经可运行**：本体模型/草稿读写、确定性校验、影响路径、版本发布与历史、审计、并发冲突、重启持久化、固定行动用例模拟。

**尚未完成**：把这些 API 接入原仓库的九个 React 页面。本包没有修改或提交远端仓库，没有完成原仓库整体构建或浏览器 UI 测试。`integration.patch` 只添加本地服务启动命令与 Vite 代理，不能被当成九页改造补丁。

真实 HTTP 接口不等于已经连接生产服务。数据源扫描、真实 Profiling、质量计算、LLM 推理、正式数据支撑等由原服务实现；本包仅对这些能力定义类型/关系/行动/IO及实现引用，不伪造生产调用成功。

## 使用顺序

| 使用者 | 首先阅读 | 用途 |
|---|---|---|
| 研发 / 代码 Agent | [CODE_AGENT_TASK.md](docs/CODE_AGENT_TASK.md) | 按仓库文件和5批步骤完成增量修改 |
| 产品与架构 | [IMPLEMENTATION_SPEC.md](docs/IMPLEMENTATION_SPEC.md) | 功能边界、数据状态、九页行为、发布合同 |
| 数据治理负责人 | [CAPABILITY_ALIGNMENT.md](docs/CAPABILITY_ALIGNMENT.md) | 31类型、39关系、25行动和6流程引用 |
| 前后端 | [PAGE_API_MATRIX.md](docs/PAGE_API_MATRIX.md) | 九页与30个HTTP操作对应 |
| 测试与演示 | [DEMO_ACCEPTANCE.md](docs/DEMO_ACCEPTANCE.md) | 可重复演示和14项待补UI测试 |
| 审查 | [TEST_REPORT.md](docs/TEST_REPORT.md)、[SOURCE_LEDGER.md](docs/SOURCE_LEDGER.md) | 实测范围、证据与未验证内容 |

## 立即运行 HTTP 演示

需要 Node.js 22 或以上。本包的 Mock 服务不需要 `npm install`。

在交付包根目录，终端1：

```bash
ENABLE_DEMO_RESET=true node mock-server/server.mjs
```

终端2：

```bash
node scripts/demo.mjs
node --test tests/api.test.mjs
```

演示脚本会明确重置 `ws-demo`，依次执行：正式 v1.3.0 → r12 阻断 → 修复 r13 → 校验与影响 → 发布 v1.4.0 → 查历史 → 模拟行动用例。

服务只监听 `127.0.0.1:4310`。Mock身份：`Bearer demo-maintainer` / `Bearer demo-viewer`。不要向公网部署，禁止用这些身份代替生产鉴权。

```bash
curl http://127.0.0.1:4310/api/v1/ontology/models \
  -H 'Authorization: Bearer demo-maintainer' \
  -H 'X-Workspace-Id: ws-demo'
```

默认状态文件：`mock-server/.data/db.json`；重启保持。`MOCK_DB_PATH` 可指定隔离文件；`PORT` 可改端口，`API_BASE` 可指定演示脚本访问地址。演示重置默认关闭，只在显式 `ENABLE_DEMO_RESET=true` 时开放。

自动测试会独立启动随机端口的服务、使用临时数据库，不复用正在运行的演示库；测试完成保存HTTP交换记录并清理临时库。

## 接入原仓库

ZIP 顶层目录已经是 `ontology-delivery/`。将其放在原仓库根目录，然后先检查未提交改动，不执行 reset 或强推。

```bash
git status
git apply --check ontology-delivery/integration.patch
git apply ontology-delivery/integration.patch
```

如果当前分支已变化，按主规格手动合并补丁，不覆盖用户修改。补丁仅增加：

```text
npm run dev:mock-api
npm run test:ontology-contract
Vite /api/v1/ontology 和 /__demo 到 localhost:4310 的代理
```

原仓库两个终端分别运行：

```bash
ENABLE_DEMO_RESET=true npm run dev:mock-api
npm run dev
```

此时还需依据 `docs/CODE_AGENT_TASK.md` 改造组件，让它们使用 `frontend/ontologyClient.ts`。客户端 `baseUrl` 设为 `''`，页面通过同源代理请求服务。禁止直接从组件 import seed。

保留当前九页：本体列表、模型总览、对象类型、关系与约束、行动契约、实现绑定、流程关联、校验与影响、变更与发布。优先打通数据与状态，再对照上一轮设计图修页面，不重建另一套应用。

## 文件目录

```text
ontology-delivery/
  README.md
  integration.patch                 # 仅启动脚本和代理
  docs/                             # 改造、能力、页面、验收、证据
  contracts/
    model.schema.json               # 模型与请求/响应结构源定义
    routes.json                     # HTTP操作元数据，服务/生成脚本共用
    openapi.yaml / openapi.json      # OpenAPI 3.1.0
    operation-io.schema.json         # 25行动+3计算的56个IO结构
  seed/
    data-governance-model.json       # 21系统类型+10外部引用
    registry.json                   # 包版本、实现、IO、流程、消费方
    action-fixtures.json            # 6个固定用例，无真实调用
    legacy-aliases.json              # 稳定ID兼容与待人工处理项
  mock-server/                      # Node标准库HTTP+持久Mock
  frontend/                         # 客户端/类型/key/route；hook示例待接入
  scripts/
    demo.mjs                        # 可重复HTTP演示
    sync_contracts.py                # 可选：生成OpenAPI和TypeScript
    check_contracts.py               # 可选：独立JSON Schema/HTTP记录校验
  tests/                            # 自动测试、HTTP记录与实际结果
```

## 接口维护

修改模型/请求响应结构时更新 `contracts/model.schema.json`；增加路由时同步 `routes.json` 和服务 dispatch。

可选开发工具需要 Python 的 `PyYAML`、`jsonschema`；不是启动 Node Mock 的依赖：

```bash
python scripts/sync_contracts.py
node --test tests/api.test.mjs
python scripts/check_contracts.py
```

行动/计算的IO定义以 `operation-io.schema.json` 为准。调整后需要同步 Registry 的 ioContracts，再运行 `check_contracts.py`，它会检查两者完全一致。本包不实现任意自然语言前置条件的动态求值；非内置测试守卫返回 `NOT_IMPLEMENTED`。

正式后端可以用 Semovix 原技术栈按同一合同实现；生产接入前仍需核实各原业务服务 DTO、身份权限、外部依赖和执行结果，不能因为 Mock 能跑就省略联调。
