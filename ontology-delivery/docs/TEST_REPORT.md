# 实测报告｜2026-09-15

## 交付状态

本报告针对本包的 Node HTTP 参考实现和独立前端协议模块，不代表原仓库九页已经改造完毕。

## 环境

- Node.js：v22.16.0。
- TypeScript：5.8.3；仓库声明~5.8.2，本包只做独立模块检查，没有修改原lockfile。
- Python JSON Schema：jsonschema 4.26.0；PyYAML 6.0.3。
- 无第三方 Node 运行依赖。

## 已实际执行

| 检查 | 结果 | 范围 |
|---|---|---|
| `node --test tests/api.test.mjs` | PASS | 26个场景子测试；Node输出含父测试共27，0失败 |
| HTTP操作覆盖 | PASS | 定义30个操作，30个均有真实HTTP请求 |
| 实际响应Schema验证 | PASS | 独立jsonschema验证125条HTTP响应 |
| 成功请求体Schema验证 | PASS | 28个实际成功请求体 |
| Seed/Registry/Fixture校验 | PASS | 31类型、39关系、25行动、28实现、6流程 |
| IO引用一致性 | PASS | 25行动+3计算，56个输入/输出Schema均可解析 |
| OpenAPI内部引用 | PASS | 475个内部引用解析；YAML/JSON一致 |
| 独立TS模块严格检查 | PASS | generated types、client、query keys、route context |
| `node scripts/demo.mjs` | DEMO_PASS | r12阻断→r13修复→发布v1.4.0→历史不变→行动模拟 |
| `git apply --check` | PASS | 针对已读取的package.json、vite.config.ts基线文本检查启动补丁 |

Schema检查是离线结构、引用和真实交换校验，**不是完整OpenAPI规范认证**。Mock里的内建Schema校验器只支持本包使用的子集，不是通用JSON Schema引擎。

## 自动场景的重点

- 模型、工作空间和权限隔离。
- 明确版本/修订、历史草稿与正式版本不可变。
- If-Match缺失428、过期412、请求结构422。
- operations批次失败回滚，不留下部分修改。
- 当前草稿缺失依赖导致真实阻断；修复后真正通过。
- 旧报告不得发布新修订，正式基线前移需要重新处理。
- 影响清单标记PARTIAL，不伪装全企业覆盖。
- 发布幂等、固定版本消费方不变、工作流不启动。
- 重启保留数据；历史恢复经过新草稿，不直接回拨指针。
- 低分有依据与高分LLM-only的相反模拟结果。
- 系统内置模型不能通过新建业务模型接口重复创建。

## 可查看的真实结果

- `tests/test-results.tap`
- `tests/http-exchanges.json`
- `tests/contract-audit.json`
- `tests/demo-results.txt`
- `tests/startup-patch-check.txt`
- `tests/typescript-check.txt`：tsc成功时无标准输出。

## 尚未执行 / 不得声称完成

- 原仓库九个React页面逐个接线、整体npm build / lint。
- `frontend/useOntology.example.tsx` 在原依赖树中的编译与运行。
- 浏览器端Playwright的14项UI验收。
- Semovix生产服务、实际连接测试、扫描、Profiling、质量计算。
- 全功能规则推理、自然语言规则执行、分布式并发压力及生产安全审计。
- 真实业务对象/指标/Grounding接口联调。

原仓库改造完成后，必须另行提交changed-files列表、整体构建结果、UI测试和演示轨迹。不能引用本报告把尚未完成的UI或生产联调标记为已通过。
