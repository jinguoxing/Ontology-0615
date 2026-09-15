/**
 * Demo HTTP client for the ontology-v1 contract.
 *
 * MOCK ONLY — 未连接任何 Semovix 生产服务：
 * - baseUrl 为空串时走同源 Vite 代理（vite.config.ts 中 /api/v1/ontology → 127.0.0.1:4310），
 *   由 ontology-delivery/mock-server 提供契约参考实现，所有响应 meta.dataMode=MOCK。
 * - 身份是演示 Token（demo-maintainer / ws-demo），不是真实登录态；
 *   生产接入需替换为现有身份服务签发的凭证（见 IMPLEMENTATION_SPEC.md §15）。
 * - Node 环境冒烟测试可用 ONTOLOGY_API_BASE=http://127.0.0.1:4310 覆盖 baseUrl。
 */

import {createOntologyClient} from './ontologyClient';
import {getDemoToken} from '../../ontology/identity';

const baseUrl =
  (typeof process !== 'undefined' && process.env?.ONTOLOGY_API_BASE) || '';

/** 演示工作区。生产接入需替换为真实租户上下文。 */
export const DEMO_WORKSPACE_ID = 'ws-demo';

export const ontologyV1 = createOntologyClient({
  baseUrl,
  // 演示身份由会话层（src/ontology/identity.ts）提供，可在界面中切换 maintainer/viewer。
  getToken: () => getDemoToken(),
  getWorkspaceId: () => DEMO_WORKSPACE_ID,
});
