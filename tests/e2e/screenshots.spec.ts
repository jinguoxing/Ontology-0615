/**
 * 浏览器截图（第七节视觉验证；Batch 4.5 后收口）。
 *
 * batch-3.6：7 张独立 1920×1080 viewport 截图（不拼接、非 fullPage）：
 * 01 Models / 02 Overview / 03 Object Types / 04 Relations / 05 Actions /
 * 06 Implementations / 07 Workflows。
 *
 * batch-4：08 校验与影响（r12 阻断报告 + Inspector 定位修复）、
 * 09 版本与发布（r12 草稿 Diff + 发布表单前置检查）。两张都停在 r12
 * 草稿态（运行报告不推进修订），种子 diff（类型 + 外部依赖两组）完整可见。
 *
 * batch-4（Batch 4.5 新增）：10 诊断信息抽屉（开发配置专用）。
 * 01~09 正式截图在诊断旗标关闭的 vite 下拍摄（不打开诊断抽屉）；
 * 10 由编排脚本以 VITE_ENABLE_ONTOLOGY_DIAGNOSTICS=true 重启 vite 后
 * 单独（--grep 诊断信息）拍摄；旗标关闭时该用例自动跳过。
 *
 * 每张截图共享的 Semovix 外壳元素逐张断言后再截图：
 * 官方 Semovix Logo、七项一级导航（业务语义高亮）、业务语义完整左侧
 * 子菜单（业务本体高亮）；模型详情页另断言当前本体 Tab、页面主标题与
 * 草稿/正式状态带。
 *
 * 运行前提：截图前以全新 MOCK_DB_PATH 重启 mock(4310)，保证 cs-drkn-demo
 * 回到 r12 种子态；vite dev(3000) 运行中（诊断旗标分组由
 * scripts/e2e-ontology.mjs 管理）。
 */
import {expect, test, type Page} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

// Playwright 以 ESM 编译 spec，无 __dirname；从 import.meta.url 推导仓库根。
const OUT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../docs/screenshots/batch-3.6');
const OUT_DIR_B4 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../docs/screenshots/batch-4');
// 无视图参数的 URL 解析为正式版本（只读）；截图要呈现草稿工作态，
// 直接深链接到种子修订 r12（spec 前已用全新 MOCK_DB_PATH 重启 mock）。
// tab 是路径段：/business-semantics/ontologies/:modelId/:tab?changeSetId&revision。
const draftUrl = (tab: string) =>
  `/business-semantics/ontologies/drkn-core/${tab}?changeSetId=cs-drkn-demo&revision=12`;

mkdirSync(OUT_DIR, {recursive: true});
mkdirSync(OUT_DIR_B4, {recursive: true});

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

/** 外壳断言：官方 Logo + 七项一级导航（业务语义高亮）+ 完整左侧子菜单。 */
async function assertShell(page: Page) {
  await expect(page.getByTestId('semovix-logo')).toBeVisible();
  const nav = page.getByTestId('semovix-top-nav');
  expect(await nav.getByRole('button').allInnerTexts()).toEqual(TOP_NAV_LABELS);
  await expect(nav.getByRole('button', {name: '业务语义', exact: true})).toHaveClass(/bg-blue-50/);
  const subNav = page.getByTestId('semovix-sub-nav');
  expect(await subNav.getByRole('button').allInnerTexts()).toEqual(SEMANTICS_SUB_LABELS);
  await expect(subNav.getByRole('button', {name: '业务本体', exact: true})).toHaveClass(/bg-blue-50/);
}

/** 详情页断言：当前本体 Tab 高亮 + 页面主标题 + 草稿状态带。 */
async function assertDetail(page: Page, tabLabel: string) {
  await expect(page.getByTestId('semovix-main')).toBeVisible();
  await expect(
    page.getByTestId('ontology-tabs').getByRole('button', {name: tabLabel, exact: true}),
  ).toHaveClass(/border-blue-600/);
  await expect(page.getByRole('heading', {name: tabLabel, exact: true, level: 1})).toBeVisible();
  await expect(page.getByTestId('status-band')).toContainText('草稿');
}

/** 等待主区域与状态带渲染完成后再截图（避免 loading 态入图）。 */
async function settled(page: Page) {
  await expect(page.getByTestId('semovix-main')).toBeVisible();
  await expect(page.getByTestId('status-band')).toContainText('草稿');
}

test.describe('Batch 3.6 截图（1920×1080）', () => {
  test('01 Models — 业务本体列表', async ({page}) => {
    await page.goto('/business-semantics/ontologies');
    await expect(page.getByRole('heading', {name: '系统模型', exact: true})).toBeVisible();
    await expect(page.getByRole('heading', {name: '业务本体', exact: true, level: 2})).toBeVisible();
    // Batch 4.5：系统模型紧凑区域 + 业务本体紧凑表格。
    await expect(page.getByTestId('system-model-strip')).toBeVisible();
    await expect(page.getByTestId('ontology-models-table')).toBeVisible();
    await assertShell(page);
    await page.screenshot({path: path.join(OUT_DIR, '01-models.png')});
  });

  test('02 Overview — 模型总览（草稿状态带）', async ({page}) => {
    await page.goto(draftUrl('overview'));
    await settled(page);
    await assertShell(page);
    await assertDetail(page, '模型总览');
    // Batch 4.5：紧凑摘要条 + 语义区域图（不再有 KPI 卡与全量节点图）。
    await expect(page.getByTestId('model-summary-strip')).toBeVisible();
    await expect(page.getByTestId('region-map')).toBeVisible();
    await page.screenshot({path: path.join(OUT_DIR, '02-overview.png')});
  });

  test('03 Object Types — 对象类型', async ({page}) => {
    await page.goto(draftUrl('object-types'));
    await settled(page);
    await assertShell(page);
    await assertDetail(page, '对象类型');
    // 选中首个对象类型，展示右侧属性/详情面板而非空态。
    // 列表项按钮带「· N 属性」副标题，借此避开「新增对象类型」按钮。
    await page.getByRole('button', {name: /·\s*\d+\s*属性/}).first().click();
    await expect(page).toHaveURL(/selected=/);
    await page.screenshot({path: path.join(OUT_DIR, '03-object-types.png')});
  });

  test('04 Relations — 关系与约束（表格视图 + Inspector + 相关约束）', async ({page}) => {
    await page.goto(draftUrl('relations'));
    await settled(page);
    await assertShell(page);
    await assertDetail(page, '关系与约束');
    await page.getByTestId('relation-table').locator('tbody tr').first().click();
    await page.screenshot({path: path.join(OUT_DIR, '04-relations.png')});
  });

  test('05 Actions — 行动契约三栏', async ({page}) => {
    await page.goto(draftUrl('actions'));
    await settled(page);
    await assertShell(page);
    await assertDetail(page, '行动契约');
    await expect(page.getByText('confirmAssertion', {exact: false}).first()).toBeVisible();
    await page.screenshot({path: path.join(OUT_DIR, '05-actions.png')});
  });

  test('06 Implementations — 实现绑定（主表 + Inspector + 兼容性对照）', async ({page}) => {
    await page.goto(draftUrl('implementations'));
    await settled(page);
    await assertShell(page);
    await assertDetail(page, '实现绑定');
    await page.locator('table tbody tr').first().click();
    await expect(page.getByText('兼容性对照')).toBeVisible();
    await page.screenshot({path: path.join(OUT_DIR, '06-implementations.png')});
  });

  test('07 Workflows — 流程关联（步骤预览 + 依赖汇总）', async ({page}) => {
    await page.goto(draftUrl('workflows'));
    await settled(page);
    await assertShell(page);
    await assertDetail(page, '流程关联');
    await page.getByRole('button', {name: /SemanticReview/}).first().click();
    await expect(page.getByText('所需对象')).toBeVisible();
    await page.screenshot({path: path.join(OUT_DIR, '07-workflows.png')});
  });
});

test.describe('Batch 4 截图（1920×1080）', () => {
  test('08 Validation & Impact — r12 阻断报告 + Inspector 定位修复', async ({page}) => {
    await page.goto(draftUrl('validation'));
    await settled(page);
    await assertShell(page);
    await assertDetail(page, '校验与影响');
    // 运行两份报告（只读计算任务，不推进修订），等待轮询完成。
    await page.getByTestId('start-validation').click();
    await expect(page.getByTestId('validation-status')).toHaveText(/已完成/, {timeout: 15_000});
    await page.getByTestId('start-impact').click();
    await expect(page.getByTestId('impact-status')).toHaveText(/已完成/, {timeout: 15_000});
    await expect(page.getByTestId('validation-report')).toContainText('存在 1 个阻断项');
    await expect(page.getByTestId('impact-completeness')).toContainText('PARTIAL');
    // 打开阻断项 Inspector（定位修复入口）。
    await page.getByTestId('issue-list').locator('button').first().click();
    await expect(page.getByTestId('issue-inspector')).toContainText('DEPENDENCY_VERSION_REQUIRED');
    await expect(page.getByTestId('issue-inspector')).toContainText('锁定 runtime @ v1.0.0');
    await page.screenshot({path: path.join(OUT_DIR_B4, '08-validation-impact.png')});
  });

  test('09 Release — r12 草稿 Diff + 发布表单前置检查', async ({page}) => {
    // 沿用上一张截图运行好的两份报告（任务不推进修订，r12 种子 diff 完整）。
    await page.goto(draftUrl('release'));
    await settled(page);
    await assertShell(page);
    await assertDetail(page, '版本与发布');
    await expect(page.getByTestId('diff-panel')).toContainText('对象类型');
    await expect(page.getByTestId('diff-panel')).toContainText('外部依赖');
    await expect(page.getByTestId('diff-panel')).toContainText('SemanticAssertion');
    await expect(page.getByTestId('versions-panel')).toContainText('目标版本');
    await expect(page.getByTestId('versions-panel')).toContainText('v1.3.0');
    // 未选报告时呈现引导与前置检查（真实禁用态，不伪造可发布）。
    await expect(page.getByTestId('publish-button')).toBeDisabled();
    await expect(page.getByTestId('publish-form')).toContainText('前往「校验与影响」运行');
    await page.screenshot({path: path.join(OUT_DIR_B4, '09-release.png')});
  });

  test('10 Diagnostics — 诊断信息抽屉（仅开发配置可见）', async ({page}) => {
    await page.goto(draftUrl('relations'));
    await settled(page);
    await assertShell(page);
    await assertDetail(page, '关系与约束');
    // 入口只在开发配置（VITE_ENABLE_ONTOLOGY_DIAGNOSTICS=true）或诊断能力下
    // 可见；01~09 正式截图组（旗标关闭）运行时本用例跳过——正式截图不打开
    // 诊断抽屉。10 号截图由编排脚本开旗标单独重跑本用例产出。
    // Batch 4.6 第九节：旗标关闭时「更多」菜单整体不渲染（无空入口），
    // 因此以菜单是否存在作为跳过判据，而不是点击后再看入口。
    const moreMenu = page.getByTestId('ontology-more-menu');
    if ((await moreMenu.count()) === 0) {
      test.skip(true, '诊断入口在关闭配置的运行中不可见（正式截图组不拍诊断页）');
    }
    await moreMenu.click();
    await page.getByTestId('diagnostics-entry').click();
    await expect(page.getByRole('heading', {name: '诊断信息'})).toBeVisible();
    await expect(page.getByTestId('diagnostics-drawer')).toContainText('cs-drkn-demo');
    await expect(page.getByTestId('diagnostics-drawer')).toContainText('API Path');
    await expect(page.getByTestId('diagnostics-drawer')).toContainText('Registry 原始值');
    await page.screenshot({path: path.join(OUT_DIR_B4, '10-diagnostics-development-only.png')});
  });
});
