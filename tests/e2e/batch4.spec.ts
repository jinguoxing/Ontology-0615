/**
 * Batch 4 浏览器 E2E：校验与影响 / 版本与发布的真实 UI 演示闭环。
 *
 * 覆盖：202+轮询三态、阻断项/未执行检查呈现、影响 PARTIAL、Inspector 定位修复
 * （锁定 runtime → r13）、旧报告失效横幅、重新校验、报告携带到发布页、
 * 前置检查与 PARTIAL 风险知悉、发布成功切换只读版本视图（未自动启动流程 /
 * 消费方固定版本未自动升级）、旧版本保留、审计记录、刷新可复现、正式版本只读、
 * viewer 禁用、技术详情真实端点。
 *
 * 服务端错误码（REPORT_STALE / IMPACT_ACK_REQUIRED / 412 / 403 / 幂等重放等）
 * 由 scripts/smoke-batch4.ts 在 HTTP 层覆盖——UI 前置检查使按钮不可达是设计行为。
 *
 * 运行前提：mock(4310, 全新 MOCK_DB_PATH) + vite dev(3000) 已在外部启动；
 * 本 spec 会把 cs-drkn-demo 从 r12 推进到 r13 并发布 v1.4.0。
 */
import {expect, test, type Page} from '@playwright/test';

const DRAFT_BASE = '/business-semantics/ontologies/drkn-core';
const draftUrl = (tab: string, revision = 12) =>
  `${DRAFT_BASE}/${tab}?changeSetId=cs-drkn-demo&revision=${revision}`;

/** 等待校验 / 影响任务从 RUNNING 轮询到终态（600ms 计算 + 400ms 轮询）。 */
async function waitForDone(page: Page, testid: string) {
  await expect(page.getByTestId(testid)).toHaveText(/已完成|失败/, {timeout: 15_000});
}

test.describe('Batch 4 校验 / 影响 / 发布', () => {
  test('01 校验：202 + 轮询完成，阻断项与未执行检查分开呈现', async ({page}) => {
    await page.goto(draftUrl('validation'));
    await expect(page.getByTestId('validation-report')).toBeVisible();
    await page.getByTestId('start-validation').click();
    // 202 后任务实体进缓存，状态 pill 先呈现计算中，再轮询到已完成。
    await waitForDone(page, 'validation-status');
    await expect(page.getByTestId('validation-report')).toContainText('存在 1 个阻断项');
    await expect(page.getByTestId('issue-list')).toContainText('DEPENDENCY_VERSION_REQUIRED');
    await expect(page.getByTestId('issue-list')).toContainText('阻断');
    // 报告绑定修订与内容校验值（服务端 isCurrent 裁决）。
    await expect(page.getByTestId('validation-report')).toContainText('绑定 r12');
    await expect(page.getByTestId('validation-report')).toContainText('对当前修订有效');
    // 未执行的检查独立呈现，绝不写成通过。
    await expect(page.getByTestId('not-executed')).toContainText('未执行的检查（4）');
    await expect(page.getByTestId('not-executed')).toContainText('结果未知，不代表通过');
    await expect(page.getByTestId('validation-report')).toContainText('已执行的检查（8）');
    // 筛选：阻断项视图只剩阻断问题。
    await page.getByTestId('issue-filters').getByRole('button', {name: /阻断项/}).click();
    await expect(page.getByTestId('issue-list').locator('button')).toHaveCount(1);
    // URL 携带报告选择（刷新可复现的事实来源）。
    await expect(page).toHaveURL(/selected=job-/);
  });

  test('02 影响分析：PARTIAL 如实呈现，六类构件与依赖路径可查', async ({page}) => {
    await page.goto(draftUrl('validation'));
    await page.getByTestId('start-impact').click();
    await waitForDone(page, 'impact-status');
    await expect(page.getByTestId('impact-completeness')).toContainText('依赖登记不完整（PARTIAL）');
    await expect(page.getByTestId('impact-completeness')).toContainText('未登记依赖的影响未知');
    await expect(page.getByTestId('impact-report')).toContainText('消费方固定版本未自动升级（本次 0 项）');
    await expect(page.getByTestId('impact-report')).toContainText('未登记的使用关系未知');
    // 筛选消费方 → 列表只剩 CONSUMER 项；点击打开依赖路径 Inspector。
    await page.getByTestId('impact-filters').getByRole('button', {name: /消费方/}).click();
    const rows = page.getByTestId('impact-list').locator('button');
    await expect(rows.first()).toBeVisible();
    await rows.first().click();
    await expect(page.getByTestId('impact-inspector')).toContainText('依赖路径');
    await expect(page.getByTestId('impact-inspector')).toContainText('消费方');
  });

  test('03 viewer：草稿页运行按钮禁用并解释原因', async ({page}) => {
    // 必须在发布用例关闭草稿前执行：viewer 提示只在草稿视图仍可写时呈现
    // （发布后草稿变只读，readOnlyReason 不再是 viewer-permission）。
    await page.goto(draftUrl('validation'));
    await page.getByTestId('identity-select').selectOption('demo-viewer');
    await expect(page.getByText('当前演示身份仅具备只读权限')).toBeVisible();
    await expect(page.getByTestId('start-validation')).toBeDisabled();
    await expect(page.getByTestId('start-impact')).toBeDisabled();
    // 演示身份是前端内存态（不持久化）：整页跳转后回到默认身份，需重选 viewer。
    await page.goto(draftUrl('release'));
    await page.getByTestId('identity-select').selectOption('demo-viewer');
    await expect(page.getByText('当前演示身份仅具备只读权限')).toBeVisible();
  });

  test('04 定位修复：Inspector 锁定 runtime → r13，旧报告失效', async ({page}) => {
    await page.goto(draftUrl('validation'));
    await page.getByTestId('start-validation').click();
    await waitForDone(page, 'validation-status');
    // 点击阻断项 → Inspector 展示 code / 位置 / 原因 / 修复建议 / 定位修复。
    await page.getByTestId('issue-list').locator('button').first().click();
    await expect(page.getByTestId('issue-inspector')).toContainText('DEPENDENCY_VERSION_REQUIRED');
    await expect(page.getByTestId('issue-inspector')).toContainText('dependencies/runtime');
    await expect(page.getByTestId('issue-inspector')).toContainText('修复建议');
    await page.getByTestId('fix-dependency').click();
    // 写入走 If-Match：URL revision 前进到 13，选中报告保留并标记失效。
    await expect(page).toHaveURL(/revision=13/);
    await expect(page).toHaveURL(/selected=job-/);
    await expect(page.getByTestId('stale-banner')).toContainText('报告已失效');
    await expect(page.getByTestId('stale-banner')).toContainText('不能用于发布');
    await expect(page.getByTestId('stale-banner')).toContainText('当前草稿为 r13');
  });

  test('05 r13 重新校验通过、影响仍 PARTIAL，报告携带到发布页', async ({page}) => {
    await page.goto(draftUrl('validation', 13));
    await page.getByTestId('start-validation').click();
    await waitForDone(page, 'validation-status');
    await expect(page.getByTestId('validation-report')).toContainText('未发现阻断项');
    await expect(page.getByTestId('validation-report')).toContainText('绑定 r13');
    await page.getByTestId('start-impact').click();
    await waitForDone(page, 'impact-status');
    await expect(page.getByTestId('impact-completeness')).toContainText('PARTIAL');
    // 切到「版本与发布」：selected 携带两份报告跨 Tab 保留。
    await page.getByTestId('ontology-tabs').getByRole('button', {name: '版本与发布', exact: true}).click();
    await expect(page).toHaveURL(/\/release\?changeSetId=cs-drkn-demo&revision=13&selected=/);
    await expect(page.getByTestId('publish-form')).toContainText('当前有效');
  });

  test('06 发布页：真实 Diff 分组、前置检查与 PARTIAL 风险知悉', async ({page}) => {
    await page.goto(draftUrl('release', 13));
    await expect(page.getByTestId('diff-panel')).toBeVisible();
    // Diff 来自 GET /diff，按 collection 分组（r13 相对基线：类型定义更新；
    // runtime 已回到基线锁定值，因此不再出现在 diff 中）。
    await expect(page.getByTestId('diff-panel')).toContainText('对象类型');
    await expect(page.getByTestId('diff-panel')).toContainText('SemanticAssertion');
    await expect(page.getByTestId('diff-panel')).not.toContainText('外部依赖');
    await expect(page.getByTestId('versions-panel')).toContainText('v1.3.0');
    await expect(page.getByTestId('versions-panel')).toContainText('目标版本');
    await expect(page.getByTestId('versions-panel')).toContainText('v1.4.0');
    // 前置检查：无报告时按钮禁用。
    await expect(page.getByTestId('publish-button')).toBeDisabled();
    await expect(page.getByTestId('publish-form')).toContainText('前往「校验与影响」运行');
    await expect(page.getByTestId('audit-events')).toBeVisible();
  });

  test('07 发布闭环：知悉风险 → v1.4.0 只读视图，未自动启动流程', async ({page}) => {
    // 先在校验页运行两份报告（r13），再进入发布页。
    await page.goto(draftUrl('validation', 13));
    await page.getByTestId('start-validation').click();
    await waitForDone(page, 'validation-status');
    await page.getByTestId('start-impact').click();
    await waitForDone(page, 'impact-status');
    await page.getByTestId('ontology-tabs').getByRole('button', {name: '版本与发布', exact: true}).click();

    // PARTIAL 未勾选风险知悉 → 按钮禁用；填写说明 + 勾选后可发布。
    await expect(page.getByTestId('publish-button')).toBeDisabled();
    await page.getByTestId('release-notes').fill('锁定 runtime 依赖版本，明确断言生命周期边界。');
    await expect(page.getByTestId('publish-button')).toBeDisabled();
    await page.getByTestId('ack-partial').check();
    await expect(page.getByTestId('ack-partial').locator('..')).toContainText('未登记依赖的影响未知');
    await expect(page.getByTestId('publish-button')).toBeEnabled();

    await page.getByTestId('publish-button').click();
    // 发布成功：切换到新 versionId 只读视图 + 发布结果卡片。
    await expect(page).toHaveURL(/\/release\?versionId=v1\.4\.0/);
    await expect(page.getByTestId('publish-result')).toContainText('发布成功：v1.4.0 已成为当前正式版本');
    await expect(page.getByTestId('publish-result')).toContainText('未自动启动流程');
    await expect(page.getByTestId('publish-result')).toContainText('消费方固定版本未自动升级');
    await expect(page.getByTestId('publish-result')).toContainText(/发布记录 pub-/);
    // 状态带：正式版本；版本列表：v1.4.0 当前 + v1.3.0 保留。
    await expect(page.getByTestId('status-band')).toContainText('正式版本 v1.4.0');
    await expect(page.getByTestId('versions-panel').getByText('v1.3.0').first()).toBeVisible();
    await expect(page.getByTestId('versions-panel').getByText('当前', {exact: true}).first()).toBeVisible();
    // 审计记录包含发布事件与 releaseNotes。
    await expect(page.getByTestId('audit-events')).toContainText('ONTOLOGY_VERSION_PUBLISHED');
    await expect(page.getByTestId('audit-events')).toContainText('锁定 runtime 依赖版本，明确断言生命周期边界。');
  });

  test('08 发布后刷新可复现；旧版本可回看', async ({page}) => {
    await page.goto(`/business-semantics/ontologies/drkn-core/release?versionId=v1.4.0`);
    await expect(page.getByTestId('status-band')).toContainText('正式版本 v1.4.0');
    await page.reload();
    await expect(page.getByTestId('status-band')).toContainText('正式版本 v1.4.0');
    await expect(page.getByTestId('audit-events')).toContainText('ONTOLOGY_VERSION_PUBLISHED');
    // 左侧切回 v1.3.0：只读历史版本。
    await page.getByTestId('versions-panel').getByRole('button', {name: /v1\.3\.0/}).click();
    await expect(page).toHaveURL(/versionId=v1\.3\.0/);
    await expect(page.getByTestId('status-band')).toContainText('正式版本 v1.3.0');
  });

  test('09 正式版本只读：校验页无运行入口，发布页无表单', async ({page}) => {
    await page.goto(`/business-semantics/ontologies/drkn-core/validation?versionId=v1.4.0`);
    await expect(page.getByText('正在查看已发布正式版本（只读）')).toBeVisible();
    await expect(page.getByTestId('start-validation')).toHaveCount(0);
    await expect(page.getByTestId('start-impact')).toHaveCount(0);
    await page.goto(`/business-semantics/ontologies/drkn-core/release?versionId=v1.4.0`);
    await expect(page.getByText('正在查看已发布正式版本（只读）')).toBeVisible();
    await expect(page.getByTestId('publish-form')).toHaveCount(0);
    await expect(page.getByTestId('versions-panel')).toBeVisible();
    await expect(page.getByTestId('audit-events')).toBeVisible();
  });

  test('10 技术详情：两个新页面呈现真实端点与任务标识', async ({page}) => {
    await page.goto(draftUrl('validation'));
    await page.getByTestId('technical-details').click();
    await expect(page.getByRole('heading', {name: '技术详情'})).toBeVisible();
    await expect(page.getByText('POST /api/v1/ontology/models/{modelId}/validation-runs')).toBeVisible();
    await expect(page.getByText('POST /api/v1/ontology/models/{modelId}/impact-analyses')).toBeVisible();
    await expect(page.getByText('GET /api/v1/ontology/models/{modelId}/jobs/{jobId}')).toBeVisible();
    await page.keyboard.press('Escape');
    await page.goto(draftUrl('release'));
    await page.getByTestId('technical-details').click();
    await expect(page.getByText('POST /api/v1/ontology/models/{modelId}/publications')).toBeVisible();
    await expect(page.getByText('GET /api/v1/ontology/models/{modelId}/versions', {exact: true})).toBeVisible();
    await expect(page.getByText('GET /api/v1/ontology/models/{modelId}/audit-events')).toBeVisible();
  });
});
