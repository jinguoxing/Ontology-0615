/**
 * Mapping between internal view ids (uiStore.activeView) and URL paths.
 *
 * The workbench renders by view id, while react-router owns the URL. This module
 * is the single source of truth for the bidirectional translation, so neither
 * the router nor the UI store needs to know about the other's vocabulary.
 *
 * Views that target a specific ObjectType (object_model, capability_binding,
 * action_model) carry the selection as a `?id=` query param rather than a path
 * segment, keeping the URL stable across the three.
 */

export type ViewId = string;

interface RouteDef {
  path: string;
  /** Whether this view tracks the selected object id via the ?id= query param. */
  hasObjectId?: boolean;
}

const VIEW_TO_ROUTE: Record<string, RouteDef> = {
  // 知识网络是业务语义的内部能力（Batch 3.6 起）：规范路径在
  // /business-semantics/knowledge-network 下，不再占据一级菜单或根路径。
  knowledge_network: {path: '/business-semantics/knowledge-network'},
  knowledge_network_assets: {path: '/business-semantics/knowledge-network/assets'},
  knowledge_network_explorer: {path: '/business-semantics/knowledge-network/explorer'},
  ontology_models: {path: '/ontology'},
  drkn_models: {path: '/ontology/drkn'},
  dkn_models: {path: '/ontology/dkn'},
  overview: {path: '/overview'},
  dkn_overview: {path: '/dkn-overview', hasObjectId: true},
  object_model: {path: '/object-model', hasObjectId: true},
  dkn_object_model: {path: '/dkn-object-model', hasObjectId: true},
  relation_model: {path: '/relation-model'},
  capability_binding: {path: '/capability-binding', hasObjectId: true},
  action_model: {path: '/action-model', hasObjectId: true},
  workflow_orchestration: {path: '/workflow'},
  change_release: {path: '/change-release'},
  create_model: {path: '/create-model'},
};

/**
 * Resolve a view id + optional object id into a router location path + search.
 * 未知视图回落到业务语义根（App 会重定向到业务本体列表）。
 */
export function viewToLocation(view: ViewId, objectId?: string): {pathname: string; search: string} {
  const def = VIEW_TO_ROUTE[view] ?? {path: '/'};
  const search = def.hasObjectId && objectId ? `?id=${encodeURIComponent(objectId)}` : '';
  return {pathname: def.path, search};
}

/** Resolve a router location (pathname + search) back into a view id. */
export function locationToView(pathname: string, search: string): {view: ViewId; objectId?: string} {
  const entry = Object.entries(VIEW_TO_ROUTE).find(([, def]) => def.path === pathname);
  if (!entry) return {view: 'knowledge_network'};
  const [view, def] = entry;
  const objectId = def.hasObjectId
    ? new URLSearchParams(search).get('id') ?? undefined
    : undefined;
  return {view, objectId};
}
