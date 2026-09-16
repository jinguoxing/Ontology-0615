#!/usr/bin/env node
/**
 * Batch 3.6 / 4.5 / 4.6 E2E 编排脚本。
 *
 * 两个入口（package.json）：
 * - test:e2e:ontology-ui           → batch35 + batch36 + batch4 + final-polish
 *                                    + batch46 + diagnostics-security
 * - test:e2e:ontology-screenshots  → screenshots（01-09 正式截图 + 诊断截图组）
 *
 * 每个用例组 = {specs, grep?, viteEnv?}：
 * - 每组使用独立的一次性 MOCK_DB_PATH（mock 首次启动自动落种子）。
 * - viteEnv 按组注入（import.meta.env 在 dev server 启动时固化，env 变化
 *   必须重启 vite）：batch35/36、batch4 与 diagnostics-security 的诊断用例
 *   需要 DIAG_ON；final-polish、batch46 与 01-09 正式截图必须 DIAG_OFF。
 *   Batch 4.6 第八节：关闭必须显式写 'false'——空对象 {} 只表示“未设置”，
 *   不能保证关闭（防止未来默认值变化引入误开）。诊断截图（10-diagnostics）
 *   单独开旗标重跑。
 *
 * ui 模式分组说明：batch35+36 共用一个库（batch36 依赖 batch35 推进后的
 * revision），batch4 单独一个库（演示闭环必须从 r12 种子态开始），
 * final-polish / batch46 / diagnostics-security 各自一个库（batch46 会创建
 * 并放弃业务本体草稿，diagnostics-security 只在网络层注入敏感字段）。
 * screenshots 模式两组：01-09 一个库；诊断截图重开旗标 + grep 只跑诊断用例。
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

// 诊断旗标必须显式开 / 显式关；空对象 {} 不再用于表达“关闭”（Batch 4.6 第八节）。
const DIAG_ON = {VITE_ENABLE_ONTOLOGY_DIAGNOSTICS: 'true'};
const DIAG_OFF = {VITE_ENABLE_ONTOLOGY_DIAGNOSTICS: 'false'};

const mode = process.argv[2];
// 每组一次全新 mock DB + 按组 vite env（env 变化时重启 vite）。
const MODES = {
  ui: [
    {specs: ['tests/e2e/batch35.spec.ts', 'tests/e2e/batch36.spec.ts'], viteEnv: DIAG_ON},
    {specs: ['tests/e2e/batch4.spec.ts'], viteEnv: DIAG_ON},
    {specs: ['tests/e2e/final-polish.spec.ts'], viteEnv: DIAG_OFF},
    {specs: ['tests/e2e/batch46.spec.ts'], viteEnv: DIAG_OFF},
    {specs: ['tests/e2e/diagnostics-security.spec.ts'], viteEnv: DIAG_ON},
  ],
  screenshots: [
    {specs: ['tests/e2e/screenshots.spec.ts'], viteEnv: DIAG_OFF},
    {specs: ['tests/e2e/screenshots.spec.ts'], grep: '诊断信息', viteEnv: DIAG_ON},
  ],
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

/** 监听子进程提前退出；组间重启前先置 plannedStop 再杀，不算失败。 */
function watchChild(child, label) {
  child.once('exit', (code) => {
    if (!cleanedUp && !child.plannedStop) {
      console.error(`[e2e] ${label} 提前退出（code=${code}），中止。`);
      cleanup();
      process.exit(1);
    }
  });
}

/** 计划内停止一个 detached 子进程：杀进程组 → 等端口释放 → 删该组临时 DB。 */
function stopServer(proc, port, label, tmpDir) {
  proc.plannedStop = true;
  try {
    process.kill(-proc.pid, 'SIGTERM');
  } catch {
    try {proc.kill('SIGTERM');} catch {}
  }
  return new Promise((resolve) => {
    const deadline = Date.now() + 5000;
    const attempt = () => {
      isPortOpen(port).then((open) => {
        if (!open || Date.now() > deadline) {
          if (tmpDir) {
            try {fs.rmSync(tmpDir, {recursive: true, force: true});} catch {}
          }
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

function runPlaywright(specs, grep) {
  return new Promise((resolve) => {
    const args = grep ? ['playwright', 'test', '--grep', grep, ...specs] : ['playwright', 'test', ...specs];
    const pw = spawn('npx', args, {
      cwd: ROOT,
      env: {...process.env, E2E_BASE_URL: BASE_URL},
      stdio: 'inherit',
    });
    children.push(pw);
    pw.on('exit', (code) => resolve(code ?? 1));
  });
}

const tmpDirs = [];

/** 当前 vite 进程与其 env 指纹（import.meta.env 在启动时固化，变化需重启）。 */
let vite = null;
let viteEnvKey = null;

async function ensureVite(envObj) {
  const key = JSON.stringify(Object.entries(envObj).sort(([a], [b]) => a.localeCompare(b)));
  if (vite && viteEnvKey === key) return;
  if (vite) {
    console.log('[e2e] vite env 变化，重启 dev server…');
    await stopServer(vite, VITE_PORT, 'vite', null);
    vite = null;
  }
  if (await isPortOpen(VITE_PORT)) {
    throw new Error(
      `[e2e] 127.0.0.1:${VITE_PORT}（vite）已被其它进程占用。` +
      `请释放该端口，或用 SEMOVIX_E2E_VITE_PORT 指定其它端口后重试。`,
    );
  }
  // strictPort；代理目标固定指向 mock 端口（组间重启 mock 不影响代理）。
  vite = spawn('npx', ['vite', '--port', String(VITE_PORT), '--strictPort', '--host', '127.0.0.1'], {
    cwd: ROOT,
    env: {...process.env, ...envObj, SEMOVIX_MOCK_ORIGIN: `http://127.0.0.1:${MOCK_PORT}`},
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  });
  children.push(vite);
  watchChild(vite, 'vite');
  vite.stdout.on('data', (d) => process.stdout.write(`[vite] ${d}`));
  vite.stderr.on('data', (d) => process.stderr.write(`[vite] ${d}`));
  await waitForPort(VITE_PORT, 'vite');
  viteEnvKey = key;
}

try {
  // 逐组：按需（重新）启动 vite（env 指纹变化时）→ 全新临时 DB 起 mock
  // （首次启动写入种子）→ 跑该组 Playwright → 杀 mock 删库。
  // 任何一组失败即停止（fail fast，退出码透传）。
  for (const group of MODES[mode]) {
    // 诊断旗标必须显式声明（DIAG_ON / DIAG_OFF）；未声明的组直接报错，
    // 防止以“未设置”悄悄进入不确定的默认态（Batch 4.6 第八节）。
    if (!group.viteEnv) throw new Error('[e2e] 用例组缺少显式 viteEnv（DIAG_ON / DIAG_OFF）');
    await ensureVite(group.viteEnv);
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
    const label = group.grep ? `${group.specs.join(' + ')} (grep: ${group.grep})` : group.specs.join(' + ');
    console.log(`[e2e] mock(${MOCK_PORT}) + vite(${VITE_PORT}, env=${viteEnvKey}) 就绪，db=${dbPath} → ${label}`);

    const code = await runPlaywright(group.specs, group.grep);
    await stopServer(mock, MOCK_PORT, 'mock-server', tmpDir);
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
  // 杀完进程再清残留临时 DB（正常路径已在 stopServer 内删除）。
  setTimeout(() => {
    for (const dir of tmpDirs) {
      try {fs.rmSync(dir, {recursive: true, force: true});} catch {}
    }
  }, 500);
}
