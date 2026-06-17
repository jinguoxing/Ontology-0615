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
  knowledge_network: {path: '/'},
  knowledge_network_assets: {path: '/assets'},
  knowledge_network_explorer: {path: '/explorer'},
  ontology_models: {path: '/ontology'},
  overview: {path: '/overview'},
  object_model: {path: '/object-model', hasObjectId: true},
  relation_model: {path: '/relation-model'},
  capability_binding: {path: '/capability-binding', hasObjectId: true},
  action_model: {path: '/action-model', hasObjectId: true},
  workflow_orchestration: {path: '/workflow'},
  change_release: {path: '/change-release'},
  create_model: {path: '/create-model'},
};

/**
 * Top-level nav entries (sidebar groups that are not real routes) map onto
 * their first child view. Kept separate so VIEW_TO_ROUTE keys stay unique.
 */
const NAV_ALIASES: Record<string, ViewId> = {
  desktop: 'knowledge_network',
  tasks: 'knowledge_network',
  semantics: 'ontology_models',
  knowledge_network_group: 'knowledge_network',
  admin: 'knowledge_network',
};

/** Resolve a view id + optional object id into a router location path + search. */
export function viewToLocation(view: ViewId, objectId?: string): {pathname: string; search: string} {
  const resolved = VIEW_TO_ROUTE[view] ? view : NAV_ALIASES[view];
  const def = VIEW_TO_ROUTE[resolved ?? ''] ?? {path: '/'};
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
