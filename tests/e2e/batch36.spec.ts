/**
 * Batch 3.6 浏览器 E2E（IA / 品牌 / 演示收口回归，只读，不写 Mock 服务）。
 *
 * 覆盖第一节 / 第二节 / 第三节要求：
 * - 顶部一级导航严格七项且顺序固定；“知识网络”不出现于一级导航。
 * - 业务语义左侧子菜单六项；本体页内高亮“业务本体”。
 * - 官方 Semovix Logo 原图引用渲染；产品定位为“企业 AI 原生语义智能平台”。
 * - 未实现模块（一级 + 业务语义子能力）走规划路由并诚实呈现“当前演示范围外”，
 *   不切换到任何遗留页面。
 * - 知识网络以业务语义内部能力运行在规范路由 /business-semantics/knowledge-network。
 * - Batch 1～3.5 既有交互不回退：应用根路径与“业务语义”一级点击仍进入业务本体列表。
 *
 * 运行前提：mock(4310, 全新 MOCK_DB_PATH) + vite dev(3000) 已在外部启动。
 */
import {expect, test, type Page} from '@playwright/test';

const TOP_NAV_LABELS = [
  'Xino 智能伙伴',
  '任务中心',
  '智能体中心',
  '业务语义',
  '数据服务超市',
  '数据治理',
  '管理中心',
];

const SEMANTICS_SUB_LABELS = ['概览', '业务域', '业务本体', '业务术语', '指标', '知识网络'];

/** 断言外壳：Logo + 七项一级导航 + 高亮项 + 左侧子菜单。 */
async function assertShell(page: Page, {top, sub}: {top: string; sub?: string}) {
  await expect(page.getByTestId('semovix-logo')).toBeVisible();
  const nav = page.getByTestId('semovix-top-nav');
  await expect(nav).toBeVisible();
  const labels = await nav.getByRole('button').allInnerTexts();
  expect(labels).toEqual(TOP_NAV_LABELS);
  await expect(nav.getByRole('button', {name: top, exact: true})).toHaveClass(/bg-blue-50/);
  await expect(page.getByText('企业 AI 原生', {exact: false}).first()).toBeVisible();
  if (sub) {
    const subNav = page.getByTestId('semovix-sub-nav');
    await expect(subNav).toBeVisible();
    await expect(subNav.getByRole('button', {name: sub, exact: true})).toHaveClass(/bg-blue-50/);
  }
}

test.describe('Batch 3.6 IA / 品牌收口', () => {
  test('01 顶部一级导航：严格七项、顺序固定、知识网络不在其中', async ({page}) => {
    await page.goto('/business-semantics/ontologies');
    await expect(page.getByRole('heading', {name: '业务本体', exact: true, level: 1})).toBeVisible();
    await assertShell(page, {top: '业务语义', sub: '业务本体'});
    // “知识网络”是业务语义的内部能力，不得成为一级菜单。
    const topLabels = await page.getByTestId('semovix-top-nav').getByRole('button').allInnerTexts();
    expect(topLabels).not.toContain('知识网络');
  });

  test('02 业务语义左侧子菜单：六项完整且顺序固定', async ({page}) => {
    await page.goto('/business-semantics/ontologies');
    const labels = await page.getByTestId('semovix-sub-nav').getByRole('button').allInnerTexts();
    expect(labels).toEqual(SEMANTICS_SUB_LABELS);
  });

  test('03 一级菜单点击：业务语义统一走 item.path（/business-semantics/overview）', async ({page}) => {
    await page.goto('/tasks');
    await page.getByTestId('semovix-top-nav').getByRole('button', {name: '业务语义', exact: true}).click();
    await expect(page).toHaveURL(/\/business-semantics\/overview$/);
    await assertShell(page, {top: '业务语义', sub: '概览'});
    await expect(page.getByTestId('out-of-scope')).toBeVisible();
  });

  test('04 未实现一级模块：规划路由 + 当前演示范围外（不切换遗留页面）', async ({page}) => {
    await page.goto('/tasks');
    await assertShell(page, {top: '任务中心'});
    await expect(page.getByTestId('out-of-scope')).toBeVisible();
    await expect(page.getByTestId('out-of-scope').getByText('当前演示范围外')).toBeVisible();
    await expect(page.getByRole('heading', {name: '任务中心', exact: true})).toBeVisible();
    // 其余规划模块同样为诚实占位。
    for (const [path, label] of [
      ['/xino', 'Xino 智能伙伴'],
      ['/agents', '智能体中心'],
      ['/data-services', '数据服务超市'],
      ['/data-governance', '数据治理'],
      ['/admin', '管理中心'],
    ] as const) {
      await page.goto(path);
      await expect(page.getByTestId('out-of-scope')).toBeVisible();
      await expect(page.getByRole('heading', {name: label, exact: true})).toBeVisible();
    }
  });

  test('05 业务语义未实现子能力：规划路由 + 占位，左侧保持该项高亮', async ({page}) => {
    await page.goto('/business-semantics/terms');
    await assertShell(page, {top: '业务语义', sub: '业务术语'});
    await expect(page.getByTestId('out-of-scope')).toBeVisible();
    await expect(page.getByRole('heading', {name: '业务语义 · 业务术语', exact: true})).toBeVisible();
    await page.goto('/business-semantics/overview');
    await assertShell(page, {top: '业务语义', sub: '概览'});
    await expect(page.getByTestId('out-of-scope')).toBeVisible();
  });

  test('06 知识网络：业务语义内部能力运行于规范路由', async ({page}) => {
    await page.goto('/business-semantics/knowledge-network');
    await assertShell(page, {top: '业务语义', sub: '知识网络'});
    await expect(page.getByRole('heading', {name: '知识网络', exact: true})).toBeVisible();
    await expect(page.getByTestId('out-of-scope')).toHaveCount(0);
  });

  test('07 应用根路径：重定向到业务本体列表', async ({page}) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/business-semantics\/ontologies$/);
    await expect(page.getByRole('heading', {name: '业务本体', exact: true, level: 1})).toBeVisible();
  });

  test('08 本体详情页：八项能力以 Tabs 呈现（不进入左侧产品菜单）', async ({page}) => {
    await page.goto('/business-semantics/ontologies/drkn-core/relations?changeSetId=cs-drkn-demo&revision=12');
    await expect(page.getByTestId('status-band')).toContainText('草稿');
    await assertShell(page, {top: '业务语义', sub: '业务本体'});
    const tabLabels = await page.getByTestId('ontology-tabs').getByRole('button').allInnerTexts();
    expect(tabLabels).toEqual([
      '模型总览', '对象类型', '关系与约束', '行动契约', '实现绑定', '流程关联', '校验与影响', '版本与发布',
    ]);
    const subLabels = await page.getByTestId('semovix-sub-nav').getByRole('button').allInnerTexts();
    for (const tab of ['模型总览', '对象类型', '关系与约束', '行动契约', '实现绑定', '流程关联', '校验与影响', '版本与发布']) {
      expect(subLabels, `八项能力「${tab}」不得进入左侧产品菜单`).not.toContain(tab);
    }
  });
});
