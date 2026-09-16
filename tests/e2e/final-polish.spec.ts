/**
 * Batch 4.5 Final Polish 浏览器 E2E（只读巡检，不写 Mock 服务）。
 *
 * 覆盖第九节新增断言：
 * - 全新演示库只显示两个种子模型（数据治理本体 / 公共服务业务本体），
 *   不出现临时 test / hello 模型（演示数据只靠全新 MOCK_DB_PATH，不在
 *   服务端按名称过滤）。
 * - 业务本体列表：系统模型紧凑区域 + 业务本体紧凑表格，主操作按状态唯一
 *   （继续草稿 / 创建变更 / 继续建模），产品层不显示 modelId / changeSetId /
 *   ownerRef 原始值。
 * - 模型总览：紧凑摘要条取代六张 KPI 统计卡；默认不渲染全量节点交叉图
 *   （31 节点 / 39 关系的节点级图保留在「关系与约束」页）。
 * - 语义区域图：点击区域进入对象类型页并应用 group 过滤，可清除。
 * - 产品层（各 Tab 巡检）不出现完整 ChangeSet ID、完整 UUID、API Path。
 * - 诊断信息入口在关闭 VITE_ENABLE_ONTOLOGY_DIAGNOSTICS 时不可见
 *   （maintainer 与 viewer 一致；本组 vite 以关闭旗标启动）。
 * - Batch 1~4 能力不回退：草稿状态带、关系表、校验运行入口仍存在。
 *
 * 运行前提：mock(4310, 全新 MOCK_DB_PATH) + vite dev(3000，诊断旗标关闭)
 * 已由 scripts/e2e-ontology.mjs ui 模式第三组启动。
 */
import {expect, test} from '@playwright/test';

const LIST_PATH = '/business-semantics/ontologies';
const DRAFT_BASE = '/business-semantics/ontologies/drkn-core';
const draftUrl = (tab: string) => `${DRAFT_BASE}/${tab}?changeSetId=cs-drkn-demo&revision=12`;

/** 完整 UUID（Mock 服务 uid 生成的 job-/pub-/audit- 后缀形态）。 */
const FULL_UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

/** 产品层可见文本（本体产品区域 = SemovixShell 的 main 子树，含页面头/状态带/Tab/内容）。 */
async function productText(page: import('@playwright/test').Page): Promise<string> {
  return page.getByTestId('semovix-main').innerText();
}

test.describe('Batch 4.5 Final Polish', () => {
  test('01 全新演示库：只显示种子模型，不出现临时 test/hello 模型', async ({page}) => {
    await page.goto(LIST_PATH);
    await expect(page.getByTestId('system-model-strip')).toBeVisible();
    // 系统模型一行：数据治理本体（drkn-core 种子）。
    await expect(page.getByTestId('system-model-row')).toHaveCount(1);
    await expect(page.getByTestId('system-model-row')).toContainText('数据治理本体');
    // 业务本体一行：公共服务业务本体（public-service 种子）。
    await expect(page.getByTestId('ontology-models-table')).toBeVisible();
    await expect(page.getByTestId('ontology-model-row')).toHaveCount(1);
    await expect(page.getByTestId('ontology-model-row')).toContainText('公共服务业务本体');
    // 全新库没有临时 test / hello 模型（靠全新 MOCK_DB_PATH，而非名称过滤）。
    const text = await productText(page);
    expect(text).not.toMatch(/test[-_a-z]*本体|hello/i);
  });

  test('02 列表产品语言：主操作按状态唯一，原始 ID / ownerRef 不出现在产品层', async ({page}) => {
    await page.goto(LIST_PATH);
    await expect(page.getByTestId('ontology-models-table')).toBeVisible();
    // public-service：有正式版本、无草稿 → 主操作「创建变更」，次操作「查看版本」。
    await expect(page.getByTestId('ontology-model-row').getByRole('button', {name: '创建变更'})).toBeVisible();
    await expect(page.getByTestId('ontology-model-row').getByRole('button', {name: '查看版本'})).toBeVisible();
    // 责任方用展示名称，原始 ownerRef / modelId 不显示。
    const text = await productText(page);
    expect(text).toContain('平台团队');
    expect(text).toContain('公共服务团队');
    expect(text).not.toContain('drkn-core');
    expect(text).not.toContain('public-service');
    expect(text).not.toContain('platform-team');
    expect(text).not.toContain('public-service-team');
    // 新建入口文案。
    await expect(page.getByRole('button', {name: /新建业务本体/})).toBeVisible();
  });

  test('03 模型总览：紧凑摘要条取代六张 KPI 卡，默认无全量节点交叉图', async ({page}) => {
    await page.goto(draftUrl('overview'));
    await expect(page.getByTestId('model-summary-strip')).toBeVisible();
    // 六张 KPI 统计卡与全量节点交叉图不再呈现。
    await expect(page.getByRole('heading', {name: '模型统计'})).toHaveCount(0);
    await expect(page.getByText(/个节点/)).toHaveCount(0);
    await expect(page.getByText(/条关系/)).toHaveCount(0);
    // 摘要条数字来自当前 ResolvedView.document（对象类型 / 关系等六类计数）。
    const strip = page.getByTestId('model-summary-strip');
    await expect(strip).toContainText('对象类型');
    await expect(strip).toContainText('关系');
    await expect(strip).toContainText('流程引用');
  });

  test('04 语义区域图：点击区域进入对象类型并应用分组过滤，可清除', async ({page}) => {
    await page.goto(draftUrl('overview'));
    const map = page.getByTestId('region-map');
    await expect(map).toBeVisible();
    const card = page.getByTestId('region-card').first();
    const regionName = ((await card.locator('.truncate').first().innerText()) || '').trim();
    expect(regionName.length).toBeGreaterThan(0);
    await card.click();
    // 进入对象类型页 + URL group 参数（刷新可复现的事实来源）。
    await expect(page).toHaveURL(/\/object-types\?/);
    await expect(page).toHaveURL(/group=/);
    await expect(page.getByTestId('clear-group-filter')).toBeVisible();
    // 左侧列表只保留该分组（semovix-main 内的页面对象 aside，排除外壳侧栏）。
    const pageAside = page.getByTestId('semovix-main').locator('aside');
    const groupHeaders = pageAside.locator('p.px-1');
    await expect(groupHeaders).toHaveCount(1);
    await expect(groupHeaders.first()).toContainText(regionName);
    // 清除过滤：回到全部分组，URL 不再携带 group。
    // react-router 7 的位置更新走 startTransition（URL 先变、DOM 提交可延迟），
    // 因此用重试断言等待同一次提交完成：chip 卸载与全部分组恢复同源于 group。
    await page.getByTestId('clear-group-filter').click();
    await expect(page).toHaveURL(/\/object-types\?/);
    expect(page.url()).not.toContain('group=');
    await expect(page.getByTestId('clear-group-filter')).toHaveCount(0);
    const headersAfter = await pageAside.locator('p.px-1').count();
    expect(headersAfter).toBeGreaterThan(1);
    // 关系摘要入口 → 关系与约束页（完整节点级图在那里）。
    await page.goto(draftUrl('overview'));
    await page.getByTestId('region-links').getByRole('button').first().click();
    await expect(page).toHaveURL(/\/relations\?/);
  });

  test('05 产品层不出现完整 ChangeSet ID / UUID / API Path（各 Tab 巡检）', async ({page}) => {
    // 列表页 + 七个能力 Tab（总览 / 对象类型 / 关系 / 行动 / 实现 / 流程 / 校验 / 发布）。
    const targets = [LIST_PATH, draftUrl('overview'), draftUrl('object-types'), draftUrl('relations'),
      draftUrl('actions'), draftUrl('implementations'), draftUrl('workflows'),
      draftUrl('validation'), draftUrl('release')];
    for (const target of targets) {
      await page.goto(target);
      await expect(page.getByTestId('semovix-main')).toBeVisible();
      const text = await productText(page);
      expect(text, `${target} 不应出现完整 ChangeSet ID`).not.toContain('cs-drkn-demo');
      expect(text, `${target} 不应出现 API Path`).not.toContain('/api/v1/');
      expect(text, `${target} 不应出现完整 UUID`).not.toMatch(FULL_UUID);
    }
    // 草稿状态带以产品语义呈现修订号。
    await page.goto(draftUrl('overview'));
    await expect(page.getByTestId('status-band')).toContainText('编辑草稿');
    await expect(page.getByTestId('status-band')).toContainText('r12');
  });

  test('06 诊断信息：关闭配置时入口不可见（maintainer 与 viewer 一致）', async ({page}) => {
    await page.goto(draftUrl('overview'));
    await expect(page.getByTestId('semovix-main')).toBeVisible();
    // 右上角不再常驻「技术详情」按钮；入口只在「更多」菜单且本组旗标关闭。
    await page.getByTestId('ontology-more-menu').click();
    await expect(page.getByTestId('diagnostics-entry')).toHaveCount(0);
    await expect(page.getByText('暂无更多操作')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('diagnostics-drawer')).toHaveCount(0);
    // viewer（具备 ontology.read，但无人具备 ontology.diagnostics.read）同样不可见。
    await page.getByTestId('identity-select').selectOption('demo-viewer');
    await page.getByTestId('ontology-more-menu').click();
    await expect(page.getByTestId('diagnostics-entry')).toHaveCount(0);
  });

  test('07 Batch 1~4 能力不回退：核心交互入口仍在（只读巡检）', async ({page}) => {
    // 八个能力 Tab 仍在详情页内。
    await page.goto(draftUrl('overview'));
    const tabs = page.getByTestId('ontology-tabs').getByRole('button');
    await expect(tabs).toHaveCount(8);
    // 对象类型：搜索占位符更新且列表来自当前视图。
    await page.goto(draftUrl('object-types'));
    await expect(page.getByPlaceholder('搜索类型名称或标识')).toBeVisible();
    // SYSTEM 类型不重复显示系统 Badge（常态）；LOCAL/EXTERNAL 显示例外徽章。
    // 种子契约：21 SYSTEM + 10 EXTERNAL、无 LOCAL → 列表徽章断言针对「外部引用」。
    const listAside = page.getByTestId('semovix-main').locator('aside');
    const badges = listAside.getByText('外部引用', {exact: true});
    expect(await badges.count()).toBeGreaterThan(0);
    await expect(listAside.getByText('系统', {exact: true})).toHaveCount(0);
    // 类型使用统计来自当前 document（选中类型后渲染）。
    await listAside.getByRole('button', {name: /· \d+ 属性/}).first().click();
    await expect(page.getByTestId('type-usage-summary')).toBeVisible();
    // 关系页：表格视图默认存在。
    await page.goto(draftUrl('relations'));
    await expect(page.getByTestId('relation-table')).toBeVisible();
    // 校验页：草稿下运行入口存在（Batch 4）。
    await page.goto(draftUrl('validation'));
    await expect(page.getByTestId('start-validation')).toBeVisible();
    await expect(page.getByTestId('start-impact')).toBeVisible();
    // 发布页：Diff / 版本面板 / 审计存在（Batch 4）。
    await page.goto(draftUrl('release'));
    await expect(page.getByTestId('diff-panel')).toBeVisible();
    await expect(page.getByTestId('versions-panel')).toBeVisible();
    await expect(page.getByTestId('audit-events')).toBeVisible();
  });
});
