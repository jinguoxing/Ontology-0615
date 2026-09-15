# 演示流程与验收

## 启动

服务无第三方运行依赖，需要Node 22及以上。以下在交付包根目录执行：

```bash
ENABLE_DEMO_RESET=true node mock-server/server.mjs
```

另一个终端：

```bash
node --test tests/api.test.mjs
node scripts/demo.mjs
```

默认地址 `http://127.0.0.1:4310`，只监听回环地址。身份为 `Bearer demo-maintainer` 或 `Bearer demo-viewer`，工作空间为 `ws-demo`。这些是演示身份，不是生产凭证。不要向公网部署此Mock。

状态保存于 `mock-server/.data/db.json`；改变 `MOCK_DB_PATH` 可隔离不同测试。重启不会自动重置。只能通过显式启用的 `/__demo/reset` 重置本工作空间；默认关闭。

## 将HTTP服务接到原仓库

1. 将完整交付包放到仓库根目录 `ontology-delivery/`。
2. 检查并应用 `integration.patch`（只添加script和API代理，不改页面）。
3. 在仓库运行 `npm run dev:mock-api` 和 `npm run dev`。
4. 让现有页面使用本包client，baseUrl设为空字符串，经Vite proxy访问。
5. 九页组件按主合同逐步改造；这个补丁不会自动完成九页业务接线。

## 推荐8–12分钟演示

| 步骤 | 操作 | 必须看到 | 不能出现 |
|---|---|---|---|
| 1 | 本体列表打开数据治理本体 | 当前v1.3.0，存在r12草稿 | 新建DRKN五步向导才能开始 |
| 2 | 对象类型选SemanticAssertion | 语义值、queue、lifecycle分开 | Unknown显示为生命周期 |
| 3 | 图/表查看has_assertion | 同一关系端点和基数 | 图表两套数据 |
| 4 | 打开行动与实现绑定 | confirmAssertion契约及固定实现版本 | 启动真实源数据写入 |
| 5 | 运行r12校验 | runtime依赖缺版本，可定位 | 固定提示“完美正常” |
| 6 | 锁定runtime v1.0.0并保存 | r13；v1.3.0 Hash不变 | 保存立刻改正式版 |
| 7 | 重新校验+影响 | 通过、明确已登记依赖路径及未知范围 | 未登记范围声称零影响 |
| 8 | 发布v1.4.0 | 新版本、审计、旧版仍可访问 | 自动开始扫描或更新所有消费者 |
| 9 | 切换公共服务业务本体 | 不同模型内容 | 同一数据仅换标题 |
| 10 | 刷新/重启 | 版本持久 | 回到页面内初始mock |
| 11 | 用例验证 | 低分有依据ALLOW，高分LLM-only DENY | 分数阈值等于权威 |
| 12 | 明确重置再演示 | 重新出现r12缺依赖 | 后台自动复位丢失状态 |

## HTTP级已提供自动测试

测试覆盖：读写HTTP、模型/工作空间隔离、精确修订、权限、CAS、真实依赖阻断、原子批量、不可变版本、过期报告、影响局限、发布幂等、重启持久化、历史恢复草稿、行动fixture、创建模型、错误端点/基数/实现契约和重置。

测试不覆盖原React页面，因为本包没有声称已在原仓库完成UI改造。必须补充以下浏览器测试。

## UI端必须新增的Playwright验收

- UI-01：新建业务本体后列表和URL均返回服务分配的modelId/changeSetId。
- UI-02：从对象页切关系页，再后退/刷新，modelId和view保持。
- UI-03：切public-service模型不得闪现上个模型Field列表。
- UI-04：同一变更保存两次形成新revision，正式版不变。
- UI-05：两个标签读相同ETag，第二个旧写返回412并保留输入。
- UI-06：关系图与关系表点击定位相同Inspector，删除后都更新。
- UI-07：校验RUNNING显示进度，SUCCEEDED+passed=false仍阻止发布。
- UI-08：修复后通过，随后再次保存，原报告立即显示非当前。
- UI-09：发布成功后当前指针改变；旧固定版本可读。
- UI-10：viewer通过UI/直接HTTP均无法发布。
- UI-11：API断网显示可重试错误，不回退静态mock。
- UI-12：未保存离开、空列表、无搜索结果、找不到版本都有明确状态。
- UI-13：行动测试明确标识“模拟用例／未真实执行”；不为CONTRACT_ONLY项伪造成功。
- UI-14：所有可见按钮均有实际行为或明确禁用原因，无alert成功占位。

## 演示与生产声明

本轮证明的是本体管理的HTTP协议和状态闭环。创建数据源、扫描、Profiling、质量检测、LLM推理、正式数据支撑、真实Task/Run执行均通过契约引用表达；只有三种行动的六个固定fixture用于行为说明，不访问真实服务。

不能将此演示包装成“全部Semovix治理模块已上线/生产联调已通过”。
