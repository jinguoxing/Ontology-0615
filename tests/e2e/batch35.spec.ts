/**
 * Batch 3.5 最小浏览器 E2E（交互回归，会真实写 Mock 服务）。
 *
 * 覆盖第十节清单：深链接和刷新、Tab 切换、selected 保留、revision 保存、
 * 412 冲突、viewer 只读、关系视图切换、Fixture 抽屉、Implementation 筛选、
 * Workflow 切换、诊断信息抽屉（Batch 4.5：入口在「更多」菜单，仅开发
 * 配置 VITE_ENABLE_ONTOLOGY_DIAGNOSTICS=true 下可见）。
 *
 * 运行前提：mock(4310, 全新 MOCK_DB_PATH) + vite dev(3000,
 * VITE_ENABLE_ONTOLOGY_DIAGNOSTICS=true) 已在外部启动。
 * 本 spec 会把 cs-drkn-demo 从 r12 推进（保存 ×2）；截图 spec 之前需重启
 * mock 恢复种子。
 */
import {expect, test, type Page} from '@playwright/test';

const DRAFT_BASE = '/business-semantics/ontologies/drkn-core';

async function openDraft(page: Page, tab: string) {
  await page.goto(`${DRAFT_BASE}/${tab}`);
  await expect(page.getByTestId('semovix-main')).toBeVisible();
  await expect(page.getByTestId('status-band')).toBeVisible();
}

/** 打开第 index 行关系的编辑弹层，改名并保存。 */
async function editFirstRelationName(page: Page, suffix: string) {
  const row = page.getByTestId('relation-table').locator('tbody tr').first();
  await row.click();
  await page.locator('button[title="编辑关系"]').first().click();
  const nameInput = page.getByLabel('名称（中文）');
  await nameInput.fill(`E2E ${suffix}`);
  await page.getByRole('button', {name: '保存关系'}).click();
}

/** 从当前 URL 读取解析后的草稿修订号（ModelContext 已 replace 进查询参数）。 */
function revisionOf(url: string): number {
  const m = url.match(/revision=(\d+)/);
  if (!m) throw new Error(`URL 中没有 revision: ${url}`);
  return Number(m[1]);
}

/**
 * 进入草稿头部修订：无视图参数的 URL 解析为正式版本（只读），
 * 通过状态带「继续草稿」走真实产品路径（读取 ChangeSet 头部修订后跳转）。
 */
async function enterDraftHead(page: Page) {
  await page.goto(`${DRAFT_BASE}/relations`);
  // Batch 4.5：状态带主操作只显示「继续草稿」（完整 ChangeSet ID 在诊断信息）。
  await page.getByTestId('status-continue-draft').click();
  await expect(page.getByTestId('relation-table')).toBeVisible();
  await expect(page.getByTestId('status-band')).toContainText('草稿');
  await expect(page.locator('button[title="编辑关系"]').first()).toBeVisible();
  return revisionOf(page.url());
}

test.describe('Batch 3.5 交互回归', () => {
  test('01 深链接与刷新：草稿 URL 直接可达且刷新可复现', async ({page}) => {
    await page.goto(`${DRAFT_BASE}/relations?changeSetId=cs-drkn-demo&revision=12`);
    await expect(page.getByTestId('semovix-main')).toBeVisible();
    await expect(page.getByTestId('status-band')).toContainText('草稿');
    // Batch 4.5：草稿状态带显示「编辑草稿 · rN」，不再出现完整 ChangeSet ID。
    await expect(page.getByTestId('status-band')).toContainText('编辑草稿');
    await expect(page.getByTestId('status-band')).not.toContainText('cs-drkn-demo');
    await page.reload();
    await expect(page.getByTestId('relation-table')).toBeVisible();
    await expect(page.getByTestId('status-band')).toContainText('r12');
  });

  test('02 Tab 切换：本体八项能力在详情页内切换并写入 URL', async ({page}) => {
    await openDraft(page, 'overview');
    await page.getByTestId('ontology-tabs').getByRole('button', {name: '关系与约束'}).click();
    await expect(page).toHaveURL(/\/relations\?/);
    await page.getByTestId('ontology-tabs').getByRole('button', {name: '行动契约'}).click();
    await expect(page).toHaveURL(/\/actions\?/);
    await expect(page.getByRole('heading', {name: '行动契约', exact: true})).toBeVisible();
  });

  test('03 selected 保留：选择关系后刷新仍选中', async ({page}) => {
    await page.goto(`${DRAFT_BASE}/relations?changeSetId=cs-drkn-demo&revision=12`);
    const row = page.getByTestId('relation-table').locator('tbody tr').first();
    const rowName = (await row.locator('td p').first().textContent())?.trim() ?? '';
    await row.click();
    await expect(page).toHaveURL(/selected=/);
    await page.reload();
    await expect(page.getByTestId('relation-table')).toBeVisible();
    await expect(page.locator('aside').getByText(rowName).first()).toBeVisible();
  });

  test('04 revision 保存：修改经 If-Match 提交，URL revision 前进', async ({page}) => {
    const from = await enterDraftHead(page);
    // 成功横幅会在视图重解析（revision 前进）后随组件卸载消失；
    // 持久信号是 URL revision 与服务端数据里的新名称。
    await editFirstRelationName(page, `bump-from-r${from}`);
    await expect(page).toHaveURL(new RegExp(`revision=${from + 1}`));
    await expect(page.getByTestId('relation-table').getByText(`E2E bump-from-r${from}`).first()).toBeVisible();
    await expect(page.getByTestId('status-band')).toContainText(`r${from + 1}`);
  });

  test('05 412 冲突：陈旧修订保存被服务端拒绝并显示冲突横幅', async ({browser}) => {
    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    const a = await ctxA.newPage();
    const b = await ctxB.newPage();
    // B 先载入当前头部修订，持有旧 ETag。
    const from = await enterDraftHead(b);
    // A 后载入同一修订并保存成功（r{from} → r{from+1}）。
    await enterDraftHead(a);
    await editFirstRelationName(a, `conflict-a-r${from}`);
    await expect(a).toHaveURL(new RegExp(`revision=${from + 1}`));
    // B 用陈旧 ETag 保存 → 服务端 412 冲突，表单保留。
    await editFirstRelationName(b, 'stale-view');
    await expect(b.getByText('保存冲突（草稿已被他人更新）')).toBeVisible();
    await expect(b.getByText(/草稿已被更新到/)).toBeVisible();
    await expect(b.getByRole('button', {name: '载入最新修订'})).toBeVisible();
    await ctxA.close();
    await ctxB.close();
  });

  test('06 viewer 只读：demo-viewer 无编辑入口，仅提示权限原因', async ({page}) => {
    await enterDraftHead(page);
    await page.getByTestId('identity-select').selectOption('demo-viewer');
    await expect(page.getByText('当前演示身份仅具备')).toBeVisible();
    await expect(page.getByRole('button', {name: /新增关系/})).toHaveCount(0);
    await expect(page.getByTestId('relation-table')).toBeVisible();
  });

  test('07 关系视图切换：表格 ↔ 结构共用同一主区域', async ({page}) => {
    await page.goto(`${DRAFT_BASE}/relations`);
    await expect(page.getByTestId('relation-table')).toBeVisible();
    await page.getByTestId('relation-view-toggle').getByRole('button', {name: '结构视图'}).click();
    await expect(page.getByTestId('relation-graph')).toBeVisible();
    await expect(page.getByTestId('relation-table')).toHaveCount(0);
    await page.getByTestId('relation-view-toggle').getByRole('button', {name: '表格视图'}).click();
    await expect(page.getByTestId('relation-table')).toBeVisible();
    await expect(page.getByTestId('relation-graph')).toHaveCount(0);
  });

  test('08 Fixture 抽屉：次级入口运行只读模拟验证（不改变 revision）', async ({page}) => {
    await page.goto(`${DRAFT_BASE}/actions`);
    await expect(page.getByText('confirmAssertion', {exact: false}).first()).toBeVisible();
    const urlBefore = page.url();
    await page.getByRole('button', {name: /验证用例（\d+）/}).click();
    await expect(page.getByRole('heading', {name: /验证用例 · /})).toBeVisible();
    await page.getByRole('button', {name: '运行验证用例'}).first().click();
    await expect(page.getByText('模拟验证（演示实现）')).toBeVisible();
    await expect(page.getByText('不产生修订（只读模拟）')).toBeVisible();
    expect(page.url()).toBe(urlBefore);
  });

  test('09 Implementation 筛选：ACTION / FUNCTION 顶部筛选单表', async ({page}) => {
    await page.goto(`${DRAFT_BASE}/implementations`);
    await expect(page.getByTestId('binding-kind-filter')).toBeVisible();
    await page.getByTestId('binding-kind-filter').getByRole('button', {name: /函数实现/}).click();
    const rows = page.locator('table tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(rows.nth(i)).toContainText('函数实现');
    }
    await page.getByTestId('binding-kind-filter').getByRole('button', {name: /行动实现/}).click();
    await expect(page.locator('table tbody tr').first()).toContainText('行动实现');
  });

  test('10 Workflow 切换：左侧选择驱动中间步骤预览', async ({page}) => {
    await page.goto(`${DRAFT_BASE}/workflows`);
    await expect(page.getByRole('heading', {name: /流程引用/})).toBeVisible();
    // 默认未选中：中间列为空态。选择 SemanticReview 后出现只读步骤预览。
    await page.getByRole('button', {name: /SemanticReview/}).first().click();
    await expect(page.getByText('只读步骤预览')).toBeVisible();
    const heading = (await page.getByRole('heading', {name: /.+/}).allInnerTexts());
    expect(heading.length).toBeGreaterThan(0);
    await expect(page).toHaveURL(/selected=/);
    await expect(page.getByText('发布本体不等于启动流程')).toBeVisible();
    // 切换到另一个流程，中间预览跟随变化。
    await page.getByRole('button', {name: /QualityMonitoring/}).first().click();
    await expect(page.getByText('只读步骤预览')).toBeVisible();
    await expect(page.getByText('所需对象')).toBeVisible();
  });

  test('11 诊断信息抽屉：入口在「更多」菜单，工程原始值集中呈现', async ({page}) => {
    // 草稿视图：诊断信息里的视图引用包含完整 ChangeSet ID（与产品层形成对照）。
    await page.goto(`${DRAFT_BASE}/relations?changeSetId=cs-drkn-demo&revision=12`);
    await expect(page.getByTestId('relation-table')).toBeVisible();
    // Batch 4.5：右上角不再常驻「技术详情」按钮，入口收进「更多」菜单。
    await page.getByTestId('ontology-more-menu').click();
    await page.getByTestId('diagnostics-entry').click();
    await expect(page.getByRole('heading', {name: '诊断信息'})).toBeVisible();
    await expect(page.getByText('视图引用（URL 为唯一事实来源）')).toBeVisible();
    await expect(page.getByText('Registry 原始值（GET /registry）')).toBeVisible();
    await expect(page.getByText(/生产端点尚未验证/).first()).toBeVisible();
    // 完整 ChangeSet ID 只出现在诊断信息，不在产品层。
    await expect(page.getByTestId('diagnostics-drawer')).toContainText('cs-drkn-demo');
  });
});
