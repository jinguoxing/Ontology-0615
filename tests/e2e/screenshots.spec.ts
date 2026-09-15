/**
 * Batch 3.5 浏览器截图（第九节视觉验证）。
 *
 * 7 张独立 1920×1080 viewport 截图（不拼接、非 fullPage）：
 * 01 Models / 02 Overview / 03 Object Types / 04 Relations / 05 Actions /
 * 06 Implementations / 07 Workflows。
 *
 * 运行前提：截图前以全新 MOCK_DB_PATH 重启 mock(4310)，保证 cs-drkn-demo
 * 回到 r12 种子态；vite dev(3000) 运行中。
 */
import {expect, test, type Page} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

// Playwright 以 ESM 编译 spec，无 __dirname；从 import.meta.url 推导仓库根。
const OUT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../docs/screenshots/batch-3.5');
// 无视图参数的 URL 解析为正式版本（只读）；截图要呈现草稿工作态，
// 直接深链接到种子修订 r12（spec 前已用全新 MOCK_DB_PATH 重启 mock）。
// tab 是路径段：/business-semantics/ontologies/:modelId/:tab?changeSetId&revision。
const draftUrl = (tab: string) =>
  `/business-semantics/ontologies/drkn-core/${tab}?changeSetId=cs-drkn-demo&revision=12`;

mkdirSync(OUT_DIR, {recursive: true});

/** 等待主区域与状态带渲染完成后再截图（避免 loading 态入图）。 */
async function settled(page: Page) {
  await expect(page.getByTestId('semovix-main')).toBeVisible();
  await expect(page.getByTestId('status-band')).toContainText('草稿');
}

test.describe('Batch 3.5 截图（1920×1080）', () => {
  test('01 Models — 业务本体列表', async ({page}) => {
    await page.goto('/business-semantics/ontologies');
    await expect(page.getByRole('heading', {name: '系统模型', exact: true})).toBeVisible();
    await expect(page.getByRole('heading', {name: '业务本体', exact: true, level: 2})).toBeVisible();
    await page.screenshot({path: path.join(OUT_DIR, '01-models.png')});
  });

  test('02 Overview — 模型总览（草稿状态带）', async ({page}) => {
    await page.goto(draftUrl('overview'));
    await settled(page);
    await page.screenshot({path: path.join(OUT_DIR, '02-overview.png')});
  });

  test('03 Object Types — 对象类型', async ({page}) => {
    await page.goto(draftUrl('object-types'));
    await settled(page);
    // 选中首个对象类型，展示右侧属性/详情面板而非空态。
    // 列表项按钮带「· N 属性」副标题，借此避开「新增对象类型」按钮。
    await page.getByRole('button', {name: /·\s*\d+\s*属性/}).first().click();
    await expect(page).toHaveURL(/selected=/);
    await page.screenshot({path: path.join(OUT_DIR, '03-object-types.png')});
  });

  test('04 Relations — 关系与约束（表格视图 + Inspector + 相关约束）', async ({page}) => {
    await page.goto(draftUrl('relations'));
    await settled(page);
    await page.getByTestId('relation-table').locator('tbody tr').first().click();
    await page.screenshot({path: path.join(OUT_DIR, '04-relations.png')});
  });

  test('05 Actions — 行动契约三栏', async ({page}) => {
    await page.goto(draftUrl('actions'));
    await settled(page);
    await expect(page.getByText('confirmAssertion', {exact: false}).first()).toBeVisible();
    await page.screenshot({path: path.join(OUT_DIR, '05-actions.png')});
  });

  test('06 Implementations — 实现绑定（主表 + Inspector + 兼容性对照）', async ({page}) => {
    await page.goto(draftUrl('implementations'));
    await settled(page);
    await page.locator('table tbody tr').first().click();
    await expect(page.getByText('兼容性对照')).toBeVisible();
    await page.screenshot({path: path.join(OUT_DIR, '06-implementations.png')});
  });

  test('07 Workflows — 流程关联（步骤预览 + 依赖汇总）', async ({page}) => {
    await page.goto(draftUrl('workflows'));
    await settled(page);
    await page.getByRole('button', {name: /SemanticReview/}).first().click();
    await expect(page.getByText('所需对象')).toBeVisible();
    await page.screenshot({path: path.join(OUT_DIR, '07-workflows.png')});
  });
});
