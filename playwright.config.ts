/**
 * Batch 3.5 浏览器验证配置。
 *
 * - viewport 1920×1080（第九节视觉目标）。
 * - baseURL http://localhost:3000（vite dev，代理 /api/v1/ontology → 127.0.0.1:4310）。
 * - 两个 spec：batch35（交互回归）与 screenshots（7 张 1920×1080 截图）。
 *   截图 spec 假定 mock 以全新 MOCK_DB_PATH 重启（revision 回到 r12 的种子态）。
 * - 不启动内置 webServer：由外部脚本先起 mock(4310) + vite(3000)，
 *   便于在交互用例与截图用例之间重启 mock 恢复种子数据。
 */
import {defineConfig} from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:3000',
    viewport: {width: 1920, height: 1080},
    locale: 'zh-CN',
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
});
