#!/usr/bin/env node
/**
 * Batch 3.6 E2E 编排脚本（第五节）。
 *
 * 两个入口（package.json）：
 * - test:e2e:ontology-ui           → batch35 + batch36 + batch4（校验/影响/发布闭环，会写 Mock 并发布版本）
 * - test:e2e:ontology-screenshots  → screenshots（batch-3.6 7 张 + batch-4 2 张 1920×1080 截图）
 *
 * 每个用例组使用独立的一次性 MOCK_DB_PATH（mock 首次启动自动落种子）：
 * ui 模式分两组——batch35+36 共用一个库（batch36 依赖 batch35 推进后的
 * revision），batch4 单独一个库（演示闭环必须从 r12 种子态开始：batch35
 * 的两次保存会把 cs-drkn-demo 推到 r14+）；screenshots 模式整组一个库。
 * 组间在同一端口重启 mock（vite 代理端口不变，只起一次）。
 * 步骤：起 vite → 每组：全新库起 mock → 端口可达后跑 Playwright → 杀 mock
 * 删临时库；无论成败都杀掉子进程树；任何一步失败以非零码退出。
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
// 每组一次全新 mock DB（组内共享状态演进，组间互不影响）。
const MODES = {
  ui: [
    ['tests/e2e/batch35.spec.ts', 'tests/e2e/batch36.spec.ts'],
    ['tests/e2e/batch4.spec.ts'],
  ],
  screenshots: [['tests/e2e/screenshots.spec.ts']],
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

/** 监听子进程提前退出；组间重启 mock 前先置 plannedStop 再杀，不算失败。 */
function watchChild(child, label) {
  child.once('exit', (code) => {
    if (!cleanedUp && !child.plannedStop) {
      console.error(`[e2e] ${label} 提前退出（code=${code}），中止。`);
      cleanup();
      process.exit(1);
    }
  });
}

/** 计划内停止一个 mock：杀进程组 → 等端口释放 → 删该组临时 DB。 */
function stopMock(mock, tmpDir) {
  mock.plannedStop = true;
  try {
    process.kill(-mock.pid, 'SIGTERM');
  } catch {
    try {mock.kill('SIGTERM');} catch {}
  }
  return new Promise((resolve) => {
    const deadline = Date.now() + 5000;
    const attempt = () => {
      isPortOpen(MOCK_PORT).then((open) => {
        if (!open || Date.now() > deadline) {
          try {fs.rmSync(tmpDir, {recursive: true, force: true});} catch {}
          resolve();
        } else {
          setTimeout(attempt, 200);
        }
      });
    };
    attempt();
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

const tmpDirs = [];

try {
  // 0) 预检 vite 端口（mock 端口在每组启动前单独预检）。
  if (await isPortOpen(VITE_PORT)) {
    throw new Error(
      `[e2e] 127.0.0.1:${VITE_PORT}（vite）已被其它进程占用。` +
      `请释放该端口，或用 SEMOVIX_E2E_VITE_PORT 指定其它端口后重试。`,
    );
  }

  // 1) Vite dev 只起一次（strictPort；代理目标固定指向 mock 端口，
  //    组间重启 mock 不影响代理）。baseURL 由脚本统一指向该端口。
  const vite = spawn('npx', ['vite', '--port', String(VITE_PORT), '--strictPort', '--host', '127.0.0.1'], {
    cwd: ROOT,
    env: {...process.env, SEMOVIX_MOCK_ORIGIN: `http://127.0.0.1:${MOCK_PORT}`},
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  });
  children.push(vite);
  watchChild(vite, 'vite');
  vite.stdout.on('data', (d) => process.stdout.write(`[vite] ${d}`));
  vite.stderr.on('data', (d) => process.stderr.write(`[vite] ${d}`));
  await waitForPort(VITE_PORT, 'vite');

  // 2) 逐组：全新临时 DB 起 mock（首次启动写入种子）→ 跑该组 Playwright →
  //    杀 mock 删库。任何一组失败即停止（fail fast，退出码透传）。
  for (const specs of MODES[mode]) {
    if (await isPortOpen(MOCK_PORT)) {
      throw new Error(
        `[e2e] 127.0.0.1:${MOCK_PORT}（mock API）已被其它进程占用。` +
        `请释放该端口，或用 SEMOVIX_E2E_MOCK_PORT 指定其它端口后重试。`,
      );
    }
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'semovix-e2e-db-'));
    tmpDirs.push(tmpDir);
    const dbPath = path.join(tmpDir, 'db.json');
    const mock = spawn('node', ['ontology-delivery/mock-server/server.mjs'], {
      cwd: ROOT,
      env: {...process.env, PORT: String(MOCK_PORT), MOCK_DB_PATH: dbPath},
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true,
    });
    children.push(mock);
    watchChild(mock, 'mock-server');
    mock.stdout.on('data', (d) => process.stdout.write(`[mock] ${d}`));
    mock.stderr.on('data', (d) => process.stderr.write(`[mock] ${d}`));
    await waitForPort(MOCK_PORT, 'mock API');
    console.log(`[e2e] mock(${MOCK_PORT}) + vite(${VITE_PORT}) 就绪，db=${dbPath} → ${specs.join(' + ')}`);

    const code = await runPlaywright(specs);
    await stopMock(mock, tmpDir);
    if (code !== 0) {
      process.exitCode = code;
      break;
    }
  }
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
} finally {
  cleanup();
  // 杀完进程再清残留临时 DB（正常路径已在 stopMock 内删除）。
  setTimeout(() => {
    for (const dir of tmpDirs) {
      try {fs.rmSync(dir, {recursive: true, force: true});} catch {}
    }
  }, 500);
}
