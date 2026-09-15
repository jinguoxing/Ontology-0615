#!/usr/bin/env node
/**
 * Batch 3.6 E2E 编排脚本（第五节）。
 *
 * 两个入口（package.json）：
 * - test:e2e:ontology-ui           → batch35（交互回归，会写 Mock）+ batch36（IA/品牌收口）
 * - test:e2e:ontology-screenshots  → screenshots（第七节 7 张 1920×1080 截图）
 *
 * 每次运行都使用独立的一次性 MOCK_DB_PATH（mock 首次启动自动落种子），
 * 因此 ui 用例推进的 revision 不会污染截图用例假定的 r12 种子态。
 * 步骤：起 mock(4310) → 起 vite(3000, strictPort) → 两端口可达后跑
 * Playwright → 无论成败都杀掉子进程树并删除临时 DB；任何一步失败以
 * 非零码退出。
 *
 * 端口默认 4310 / 3000；本机端口被其它软件（如 Docker 端口转发）占用时，
 * 可用 SEMOVIX_E2E_MOCK_PORT / SEMOVIX_E2E_VITE_PORT 覆盖（vite 代理与
 * Playwright baseURL 由脚本经环境变量同步指向同一对端口）。
 */
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MOCK_PORT = Number(process.env.SEMOVIX_E2E_MOCK_PORT || 4310);
const VITE_PORT = Number(process.env.SEMOVIX_E2E_VITE_PORT || 3000);
const BASE_URL = `http://127.0.0.1:${VITE_PORT}`;
const READY_TIMEOUT_MS = 90_000;

const mode = process.argv[2];
const MODES = {
  ui: ['tests/e2e/batch35.spec.ts', 'tests/e2e/batch36.spec.ts'],
  screenshots: ['tests/e2e/screenshots.spec.ts'],
};
if (!mode || !MODES[mode]) {
  console.error(`用法: node scripts/e2e-ontology.mjs <ui|screenshots>`);
  process.exit(2);
}

/** 顺序执行，前一步失败立即抛出（fail fast）。 */
const children = [];
let cleanedUp = false;

function cleanup() {
  if (cleanedUp) return;
  cleanedUp = true;
  for (const child of children) {
    try {
      // detached 进程组：杀整个树（vite 会再派生 esbuild 子进程）。
      process.kill(-child.pid, 'SIGTERM');
    } catch {
      try {child.kill('SIGTERM');} catch {}
    }
  }
}
process.on('exit', cleanup);
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    cleanup();
    process.exit(130);
  });
}

function waitForExitOrThrow(child, label) {
  child.once('exit', (code) => {
    if (!cleanedUp) {
      console.error(`[e2e] ${label} 提前退出（code=${code}），中止。`);
      cleanup();
      process.exit(1);
    }
  });
}

/** 端口当前是否已被占用（spawn 前预检，给出可读报错而不是子进程 EADDRINUSE）。 */
function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = net.connect({port, host: '127.0.0.1'}, () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('error', () => resolve(false));
  });
}

/** TCP 端口可达探测（250ms 轮询）。 */
function waitForPort(port, label) {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const socket = net.connect({port, host: '127.0.0.1'}, () => {
        socket.destroy();
        resolve();
      });
      socket.on('error', () => {
        if (Date.now() > deadline) {
          reject(new Error(`[e2e] 等待 ${label} (127.0.0.1:${port}) 可达超时（${READY_TIMEOUT_MS / 1000}s）`));
        } else {
          setTimeout(attempt, 250);
        }
      });
    };
    attempt();
  });
}

function runPlaywright(specs) {
  return new Promise((resolve) => {
    const pw = spawn('npx', ['playwright', 'test', ...specs], {
      cwd: ROOT,
      env: {...process.env, E2E_BASE_URL: BASE_URL},
      stdio: 'inherit',
    });
    children.push(pw);
    pw.on('exit', (code) => resolve(code ?? 1));
  });
}

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'semovix-e2e-db-'));
const dbPath = path.join(tmpDir, 'db.json');

try {
  // 0) 预检：目标端口若已被其它进程占用（Docker 转发 / 残留服务），
  //    立即失败并给出改端口的方法，避免子进程报 EADDRINUSE 难以定位。
  for (const [port, label] of [[MOCK_PORT, 'mock API'], [VITE_PORT, 'vite']]) {
    if (await isPortOpen(port)) {
      throw new Error(
        `[e2e] 127.0.0.1:${port}（${label}）已被其它进程占用。` +
        `请释放该端口，或用 SEMOVIX_E2E_${label === 'vite' ? 'VITE' : 'MOCK'}_PORT 指定其它端口后重试。`,
      );
    }
  }

  // 1) Mock API：独立临时 DB，首次启动写入种子（r12 草稿态）。
  const mock = spawn('node', ['ontology-delivery/mock-server/server.mjs'], {
    cwd: ROOT,
    env: {...process.env, PORT: String(MOCK_PORT), MOCK_DB_PATH: dbPath},
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  });
  children.push(mock);
  waitForExitOrThrow(mock, 'mock-server');
  mock.stdout.on('data', (d) => process.stdout.write(`[mock] ${d}`));
  mock.stderr.on('data', (d) => process.stderr.write(`[mock] ${d}`));

  // 2) Vite dev（strictPort：端口被占用时立即失败，而不是静默换端口）。
  //    代理目标与 baseURL 都由脚本统一指向同一对端口。
  const vite = spawn('npx', ['vite', '--port', String(VITE_PORT), '--strictPort', '--host', '127.0.0.1'], {
    cwd: ROOT,
    env: {...process.env, SEMOVIX_MOCK_ORIGIN: `http://127.0.0.1:${MOCK_PORT}`},
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  });
  children.push(vite);
  waitForExitOrThrow(vite, 'vite');
  vite.stdout.on('data', (d) => process.stdout.write(`[vite] ${d}`));
  vite.stderr.on('data', (d) => process.stderr.write(`[vite] ${d}`));

  // 3) 两个端口都可达后才开始跑用例。
  await waitForPort(MOCK_PORT, 'mock API');
  await waitForPort(VITE_PORT, 'vite');
  console.log(`[e2e] mock(${MOCK_PORT}) + vite(${VITE_PORT}) 就绪，db=${dbPath}`);

  // 4) Playwright（stdio 直通；退出码透传）。
  const code = await runPlaywright(MODES[mode]);
  process.exitCode = code;
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
} finally {
  cleanup();
  // 杀完进程再删临时 DB（mock 进程持有 .lock 与 db.json）。
  setTimeout(() => {
    try {fs.rmSync(tmpDir, {recursive: true, force: true});} catch {}
  }, 500);
}
