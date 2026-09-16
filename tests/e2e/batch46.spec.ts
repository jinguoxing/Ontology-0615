/**
 * Batch 4.6 产品基线收口 浏览器 E2E（本组 vite 以 DIAG_OFF 启动）。
 *
 * 覆盖第十三节补充测试：
 * 1. 系统模型草稿状态：列表页呈现「当前版本 v1.3.0 / 存在编辑草稿」，
 *    主操作「继续草稿」进入 cs-drkn-demo r12，「查看正式版本」进入 v1.3.0。
 * 2. 无版本无草稿 → 「重新开始建模」创建新的 OPEN ChangeSet
 *    （放弃草稿走测试侧直接 API：If-Match + Idempotency-Key，不改 Mock）。
 * 3. Overview 草稿横幅基线来自 ChangeSet.baseVersionId（基于 v1.3.0），
 *    无基线时才显示「初始草稿」。
 * 4. 摘要条 SYSTEM ≠ LOCAL：21 系统定义 + 10 外部引用，禁止「本地」计数。
 * 5. 产品页巡检：不出现 API Path、完整 UUID、ChangeSet ID、批次工程字样。
 * 6. 诊断关闭：更多菜单与抽屉均不渲染（maintainer 与 viewer 一致）。
 * 7. 语义区域图上限：网络层注入 8 个分组 → 只展示前 6 个 + 其他区域汇总。
 *
 * 运行前提：mock(4310, 全新 MOCK_DB_PATH) + vite dev(3000，DIAG_OFF)
 * 已由 scripts/e2e-ontology.mjs ui 模式对应组启动。
 */
import {expect, test, type Page} from '@playwright/test';

const LIST_PATH = '/business-semantics/ontologies';
const DRAFT_BASE = '/business-semantics/ontologies/drkn-core';
const draftUrl = (tab: string) => `${DRAFT_BASE}/${tab}?changeSetId=cs-drkn-demo&revision=12`;

/** 完整 UUID（Mock 服务 uid 生成的 job-/pub-/audit-/cs- 后缀形态）。 */
const FULL_UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

/** 测试侧直接调用 Mock API 的演示身份（与 App 内一致）。 */
const API_HEADERS = {
  authorization: 'Bearer demo-maintainer',
  'x-workspace-id': 'ws-demo',
};

/** 产品层可见文本（本体产品区域 = SemovixShell 的 main 子树）。 */
async function productText(page: Page): Promise<string> {
  return page.getByTestId('semovix-main').innerText();
}

/** 从对象类型草稿 URL 解析 {modelId, changeSetId}（App 创建后跳转的目标）。 */
function parseDraftUrl(page: Page): {modelId: string; changeSetId: string} {
  const m = page.url().match(/\/ontologies\/([^/]+)\/object-types\?changeSetId=([^&]+)&revision=/);
  expect(m, `应跳转到草稿对象类型页（实际 ${page.url()}）`).not.toBeNull();
  return {modelId: m![1], changeSetId: m![2]};
}

test.describe('Batch 4.6 产品基线收口', () => {
  test('01 系统模型草稿状态：版本与草稿并列呈现，主操作「继续草稿」', async ({page}) => {
    await page.goto(LIST_PATH);
    const row = page.getByTestId('system-model-row');
    await expect(row).toHaveCount(1);
    await expect(row).toContainText('数据治理领域本体');
    // 状态并列：当前版本 v1.3.0 + 存在编辑草稿（不再只有「继续建模」）。
    await expect(row).toContainText('当前版本 v1.3.0');
    await expect(row).toContainText('存在编辑草稿');
    await expect(row).toContainText('责任方 平台团队');

    // 主操作「继续草稿」：读取草稿最新修订后进入对象类型页（r12）。
    await row.getByRole('button', {name: '继续草稿'}).click();
    await expect(page).toHaveURL(/\/object-types\?changeSetId=cs-drkn-demo&revision=12$/);
    await expect(page.getByTestId('status-band')).toContainText('编辑草稿');
    await expect(page.getByTestId('status-band')).toContainText('r12');

    // 次操作「查看正式版本」：进入 v1.3.0 只读总览。
    await page.goto(LIST_PATH);
    await page.getByTestId('system-model-row').getByRole('button', {name: '查看正式版本'}).click();
    await expect(page).toHaveURL(/\/overview\?versionId=v1\.3\.0$/);
    await expect(page.getByTestId('status-band')).toContainText('正式版本');
  });

  test('02 无版本无草稿：放弃草稿后列表提供「重新开始建模」，创建新的 OPEN ChangeSet', async ({page}) => {
    // 新建业务本体：创建表单只呈现产品字段（名称 / 责任归属标识）。
    await page.goto(LIST_PATH);
    await page.getByRole('button', {name: /新建业务本体/}).click();
    await page.getByLabel('本体名称').fill('供应链业务本体');
    await page.getByLabel('责任归属').fill('supply-chain-team');
    await page.getByRole('button', {name: '创建并进入草稿'}).click();
    await expect(page.getByTestId('status-band')).toContainText('编辑草稿');
    const {modelId, changeSetId: firstCsId} = parseDraftUrl(page);

    // 测试侧直接放弃草稿（App 未提供放弃入口；If-Match + Idempotency-Key）。
    const getRes = await page.request.get(
      `/api/v1/ontology/models/${modelId}/changesets/${firstCsId}`,
      {headers: API_HEADERS},
    );
    expect(getRes.ok()).toBeTruthy();
    const etag = (await getRes.json()).data.etag;
    const abandonRes = await page.request.post(
      `/api/v1/ontology/models/${modelId}/changesets/${firstCsId}/abandon`,
      {
        headers: {...API_HEADERS, 'if-match': etag, 'idempotency-key': `e2e-batch46-abandon-${firstCsId}`},
        data: {reason: '演示验收：放弃初始草稿后验证重新开始建模'},
      },
    );
    expect(abandonRes.ok()).toBeTruthy();

    // 回到列表：无版本无草稿 → 表格行「尚未发布」且无草稿徽章。
    await page.goto(LIST_PATH);
    const row = page.getByTestId('ontology-model-row').filter({hasText: '供应链业务本体'});
    await expect(row).toBeVisible();
    await expect(row).toContainText('尚未发布');
    await expect(row).not.toContainText('编辑草稿中');
    await expect(row.getByRole('button', {name: '重新开始建模'})).toBeVisible();
    await expect(row.getByRole('button', {name: '继续草稿'})).toHaveCount(0);
    await expect(row.getByRole('button', {name: '创建变更', exact: true})).toHaveCount(0);
    await row.getByRole('button', {name: '重新开始建模'}).click();

    // 创建新的 OPEN ChangeSet（不同于被放弃的草稿）并进入对象类型页。
    await expect(page.getByTestId('status-band')).toContainText('编辑草稿');
    const {changeSetId: secondCsId} = parseDraftUrl(page);
    expect(secondCsId).not.toBe(firstCsId);

    // 该草稿无基线版本：Overview 横幅回落到「初始草稿」，且不误称基于任何 vN。
    await page.goto(`/business-semantics/ontologies/${modelId}/overview?changeSetId=${secondCsId}&revision=0`);
    const banner = page.getByTestId('draft-banner');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('基于 初始草稿');
    await expect(banner).not.toContainText('基于 v');
    await expect(banner).toContainText('尚无正式发布版本');
  });

  test('03 Overview 草稿基线：来自 ChangeSet.baseVersionId，不再误称「初始草稿」', async ({page}) => {
    await page.goto(draftUrl('overview'));
    const banner = page.getByTestId('draft-banner');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('编辑草稿 · r12');
    await expect(banner).toContainText('基于 v1.3.0 的未发布内容');
    await expect(banner).not.toContainText('初始草稿');
    await expect(banner).toContainText('正式版本 v1.3.0 未受草稿影响');
    // 空状态文案：公共能力页不再宣称发布流程在演示范围外。
    await expect(page.getByText('正式发布流程在当前演示范围外')).toHaveCount(0);
  });

  test('04 摘要条来源语义：21 系统定义 + 10 外部引用，SYSTEM 不计入「本地」', async ({page}) => {
    await page.goto(draftUrl('overview'));
    const strip = page.getByTestId('model-summary-strip');
    await expect(strip).toBeVisible();
    await expect(strip).toContainText('21 系统定义 + 10 外部引用');
    // 种子契约无 LOCAL 类型：摘要条禁止出现任何「本地」计数。
    await expect(strip).not.toContainText('本地');
  });

  test('05 产品页语言巡检：无 API Path / 完整 UUID / ChangeSet ID / 批次与工程标识字样', async ({page}) => {
    const targets = [LIST_PATH, draftUrl('overview'), draftUrl('object-types'), draftUrl('relations'),
      draftUrl('actions'), draftUrl('implementations'), draftUrl('workflows'),
      draftUrl('validation'), draftUrl('release')];
    for (const target of targets) {
      await page.goto(target);
      await expect(page.getByTestId('semovix-main')).toBeVisible();
      const text = await productText(page);
      expect(text, `${target} 不应出现 API Path`).not.toContain('/api/v1/');
      expect(text, `${target} 不应出现完整 UUID`).not.toMatch(FULL_UUID);
      expect(text, `${target} 不应出现完整 ChangeSet ID`).not.toContain('cs-drkn-demo');
      expect(text, `${target} 不应出现批次工程字样`).not.toMatch(/Batch/);
      // 第五节工程词：原始字段名不进入产品层（原始值只在诊断信息）。
      expect(text, `${target} 不应出现工程字段名`).not.toMatch(/modelId|changeSetId|ownerRef|eventType|actorId/);
    }
  });

  test('06 诊断关闭：更多菜单与抽屉均不渲染（maintainer 与 viewer 一致）', async ({page}) => {
    await page.goto(draftUrl('overview'));
    await expect(page.getByTestId('semovix-main')).toBeVisible();
    // 第八 / 九节：显式关闭时入口与空菜单都不出现（{} 语义不再用于表达关闭）。
    await expect(page.getByTestId('ontology-more-menu')).toHaveCount(0);
    await expect(page.getByTestId('diagnostics-drawer')).toHaveCount(0);
    await page.getByTestId('identity-select').selectOption('demo-viewer');
    await expect(page.getByTestId('ontology-more-menu')).toHaveCount(0);
    await expect(page.getByTestId('diagnostics-drawer')).toHaveCount(0);
  });

  test('07 语义区域图上限：超过 6 个区域折叠为「其他区域」汇总', async ({page}) => {
    // 网络层把 31 个类型的分组改写为 8 个桶（Mock 数据结构不变，仅测试注入）。
    await page.route('**/api/v1/ontology/models/drkn-core/view**', async (route) => {
      const response = await route.fetch();
      const body = await response.json();
      body.data.document.objectTypes = body.data.document.objectTypes.map(
        (t: {group?: string}, i: number) => ({...t, group: `区域分组${i % 8}`}),
      );
      await route.fulfill({response, json: body});
    });
    await page.goto(draftUrl('overview'));
    // 只展示类型数量最多的前 6 个区域。
    await expect(page.getByTestId('region-card')).toHaveCount(6);
    // 其余 2 个区域折叠汇总：7 个类型（4 + 3），不再逐格渲染。
    const others = page.getByTestId('region-others');
    await expect(others).toBeVisible();
    await expect(others).toContainText('其他 2 个区域');
    await expect(others).toContainText('共 7 个类型');
  });
});
