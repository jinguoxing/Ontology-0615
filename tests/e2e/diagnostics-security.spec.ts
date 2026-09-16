/**
 * 诊断信息安全 浏览器 E2E（本组 vite 以 DIAG_ON 启动）。
 *
 * 覆盖 Batch 4.6 第七节：
 * - 诊断开关显式开启时入口可见（与 DIAG_OFF 组形成开关对照）。
 * - Raw JSON 的 workflows 白名单（id / versionId / ownerService /
 *   requiredActionIds / executable）：在网络层向 Registry 响应注入
 *   internalEndpoint / secretRef 一类敏感登记值（Mock 数据结构不变，
 *   仅测试注入），断言它们不出现在诊断抽屉；白名单字段正常呈现。
 *
 * 运行前提：mock(4310, 全新 MOCK_DB_PATH) + vite dev(3000，DIAG_ON)
 * 已由 scripts/e2e-ontology.mjs ui 模式对应组启动。
 */
import {expect, test} from '@playwright/test';

const DRAFT_URL = '/business-semantics/ontologies/drkn-core/workflows?changeSetId=cs-drkn-demo&revision=12';

/** 打开「更多」菜单 → 诊断信息抽屉。 */
async function openDiagnostics(page: import('@playwright/test').Page) {
  await page.getByTestId('ontology-more-menu').click();
  await page.getByTestId('diagnostics-entry').click();
  await expect(page.getByRole('heading', {name: '诊断信息'})).toBeVisible();
}

test.describe('诊断信息安全（Batch 4.6 第七节）', () => {
  test('01 开关开启：更多菜单与诊断抽屉可见', async ({page}) => {
    await page.goto(DRAFT_URL);
    await expect(page.getByTestId('semovix-main')).toBeVisible();
    // 与 DIAG_OFF 组对照：显式开启时入口存在且可用。
    await expect(page.getByTestId('ontology-more-menu')).toBeVisible();
    await openDiagnostics(page);
    await expect(page.getByTestId('diagnostics-drawer')).toContainText('Registry 原始值（GET /registry）');
  });

  test('02 workflows 白名单：注入的 internalEndpoint / secretRef 不进入诊断信息', async ({page}) => {
    // 网络层注入敏感登记值（仅本测试的响应改写，不改 Mock 种子结构）。
    const INTERNAL_HOST = 'internal-7.corp.local';
    const SECRET_PREFIX = 'secret-e2e-injected';
    await page.route('**/api/v1/ontology/registry', async (route) => {
      const response = await route.fetch();
      const body = await response.json();
      body.data.workflows = body.data.workflows.map((w: Record<string, unknown>, i: number) => ({
        ...w,
        internalEndpoint: `https://${INTERNAL_HOST}:8443/ontology/workflow/${i}`,
        secretRef: `${SECRET_PREFIX}-${i}`,
        apiToken: `tok-e2e-${i}`,
      }));
      body.data.implementations = body.data.implementations.map((impl: Record<string, unknown>, i: number) => ({
        ...impl,
        internalEndpoint: `https://${INTERNAL_HOST}:8443/ontology/impl/${i}`,
        secretRef: `${SECRET_PREFIX}-impl-${i}`,
      }));
      await route.fulfill({response, json: body});
    });

    await page.goto(DRAFT_URL);
    await openDiagnostics(page);

    const drawer = page.getByTestId('diagnostics-drawer');
    // 展开原始 JSON（details 折叠块）后再取全量文本。
    const details = drawer.locator('details summary');
    await expect(details).toBeVisible();
    await details.click();

    const text = await drawer.innerText();
    // 敏感登记值不出现（端点、密钥引用、令牌）。
    expect(text).not.toContain('internalEndpoint');
    expect(text).not.toContain('.corp.local');
    expect(text).not.toContain('secretRef');
    expect(text).not.toContain(SECRET_PREFIX);
    expect(text).not.toContain('apiToken');
    expect(text).not.toContain('tok-e2e');
    // 白名单字段正常呈现（workflows 投影）。
    expect(text).toContain('ownerService');
    expect(text).toContain('requiredActionIds');
    expect(text).toContain('executable');
  });
});
