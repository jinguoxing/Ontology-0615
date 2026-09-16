#!/usr/bin/env node
/**
 * 重置本地演示数据（Batch 4.5 第一节）。
 *
 * 只删除默认本地 Mock DB（ontology-delivery/mock-server/.data/db.json 与
 * .lock），不触碰任何其它文件：下次启动 dev:mock-api 时服务端检测到
 * DB 文件缺失会自动重新落种子（全新演示库默认只有「数据治理领域本体
 * drkn-core」与「公共服务业务本体 public-service」两个模型）。
 *
 * 不通过模型名称过滤 test/hello 数据——重置即回到种子态，无需过滤。
 * 若 Mock 服务正在运行（lock 持有存活 pid），会拒绝执行并提示先停止，
 * 避免内存态服务在退出时把旧数据写回磁盘。
 *
 * 用法：npm run demo:reset
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = path.join(ROOT, 'ontology-delivery', 'mock-server', '.data');
const DB_PATH = path.join(DATA_DIR, 'db.json');
const LOCK_PATH = `${DB_PATH}.lock`;

function pidAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    // ESRCH：进程不存在；EPERM：存在但属于其它用户（仍视为在运行）。
    return e.code === 'EPERM';
  }
}

const lockExists = fs.existsSync(LOCK_PATH);
if (lockExists) {
  const raw = fs.readFileSync(LOCK_PATH, 'utf8').trim();
  const pid = Number(raw);
  if (Number.isInteger(pid) && pid > 0 && pidAlive(pid)) {
    console.error(`[demo:reset] Mock 服务正在运行（pid ${pid}，持有 ${LOCK_PATH}）。`);
    console.error('[demo:reset] 请先停止 dev:mock-api 再重置，否则退出时会把内存数据写回磁盘。');
    process.exit(1);
  }
  console.log(`[demo:reset] 清理失效锁文件（pid ${raw || '空'} 已不存在）。`);
  fs.rmSync(LOCK_PATH, {force: true});
}

if (!fs.existsSync(DB_PATH)) {
  console.log('[demo:reset] 默认演示库不存在（ ontology-delivery/mock-server/.data/db.json ）。');
  console.log('[demo:reset] 下次启动 dev:mock-api 时会自动写入种子，无需处理。');
  process.exit(0);
}

fs.rmSync(DB_PATH, {force: true});
console.log('[demo:reset] 已删除默认演示库：ontology-delivery/mock-server/.data/db.json');
console.log('[demo:reset] 启动 npm run dev:mock-api 后将回到种子态（drkn-core + public-service 两个模型，cs-drkn-demo 回到 r12）。');
