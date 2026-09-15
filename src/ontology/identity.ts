import {create} from 'zustand';

/**
 * 演示身份（Mock 会话层）。
 *
 * 契约 Mock 服务用 Bearer Token 区分两个演示身份（GET /session 返回各自 capabilities）：
 * - demo-maintainer：ontology.read / ontology.edit / ontology.publish / ontology.simulate
 * - demo-viewer：仅 ontology.read（所有写接口返回 403 ACTION_DENIED）
 *
 * 这不是真实登录态；生产接入需替换为现有身份服务签发的凭证
 * （见 ontology-delivery/docs/IMPLEMENTATION_SPEC.md §15）。
 * actorId 同时进入 React Query 的 CacheScope，保证两个身份/模型的缓存互不串用。
 */
export type DemoActor = 'demo-maintainer' | 'demo-viewer';

export const DEMO_ACTORS: ReadonlyArray<{id: DemoActor; label: string; description: string}> = [
  {id: 'demo-maintainer', label: 'demo-maintainer（可编辑）', description: 'ontology.read / edit / publish / simulate'},
  {id: 'demo-viewer', label: 'demo-viewer（只读）', description: 'ontology.read'},
];

interface DemoIdentityState {
  actor: DemoActor;
  setActor: (actor: DemoActor) => void;
}

export const useDemoIdentity = create<DemoIdentityState>((set) => ({
  actor: 'demo-maintainer',
  setActor: (actor) => set({actor}),
}));

/** 供 HTTP client 在每次请求时读取当前演示 Token（非响应式）。 */
export const getDemoToken = (): string => useDemoIdentity.getState().actor;
