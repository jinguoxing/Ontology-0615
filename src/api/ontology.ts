/**
 * Data access layer for DRKN ontology domain entities.
 *
 * Today this is backed by static mock data (imported from src/data.ts),
 * wrapped in simulated latency so React Query's loading/cache behavior is
 * exercised realistically. Each function has a clear swap point to a real
 * fetch/axios call once a backend exists — replace the body, keep the signature.
 */

import {
  INITIAL_OBJECT_TYPES,
  INITIAL_LINK_TYPES,
  INITIAL_CAPABILITIES,
  INITIAL_WORKFLOWS,
  INITIAL_CHANGE_SETS,
  INITIAL_VALIDATION_ITEMS,
} from '../data';
import type {
  ObjectType,
  LinkType,
  Capability,
  DRKNWorkflow,
  ChangeSet,
  ValidationItem,
} from '../types';

/** Simulated network latency (ms). */
const LATENCY = 250;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---- In-memory mutable stores (stand-in for a real database) ----

let objectTypes: ObjectType[] = [...INITIAL_OBJECT_TYPES];
let linkTypes: LinkType[] = [...INITIAL_LINK_TYPES];
let capabilities: Capability[] = [...INITIAL_CAPABILITIES];
let workflows: DRKNWorkflow[] = [...INITIAL_WORKFLOWS];
let changeSets: ChangeSet[] = [...INITIAL_CHANGE_SETS];
let validationItems: ValidationItem[] = [...INITIAL_VALIDATION_ITEMS];

const DRAFT_CHANGESET_ID = 'CS-2026-012';

// ---- Reads ----

export async function fetchObjectTypes(): Promise<ObjectType[]> {
  await sleep(LATENCY);
  return objectTypes;
}

export async function fetchLinkTypes(): Promise<LinkType[]> {
  await sleep(LATENCY);
  return linkTypes;
}

export async function fetchCapabilities(): Promise<Capability[]> {
  await sleep(LATENCY);
  return capabilities;
}

export async function fetchWorkflows(): Promise<DRKNWorkflow[]> {
  await sleep(LATENCY);
  return workflows;
}

export async function fetchChangeSets(): Promise<ChangeSet[]> {
  await sleep(LATENCY);
  return changeSets;
}

export async function fetchValidationItems(): Promise<ValidationItem[]> {
  await sleep(LATENCY);
  return validationItems;
}

// ---- Writes ----

export interface ChangeSetEntry {
  type: 'add_object' | 'modify_property' | 'add_link' | 'modify_workflow' | 'bind_capability';
  target: string;
  description: string;
}

/** Update a single ObjectType by id (upserts status to Modified). */
export async function updateObjectType(updated: ObjectType): Promise<ObjectType> {
  await sleep(LATENCY);
  objectTypes = objectTypes.map((o) => (o.id === updated.id ? updated : o));
  return updated;
}

/**
 * Add or modify an ObjectType and append an add_object entry to the draft
 * changeset. Returns the new ObjectType (status forced to Draft/Modified).
 */
export async function addObjectType(newObj: ObjectType): Promise<ObjectType> {
  await sleep(LATENCY);
  const exists = objectTypes.some((o) => o.id === newObj.id);
  const resolved: ObjectType = exists
    ? {...newObj, status: 'Modified'}
    : {...newObj, status: 'Draft'};
  objectTypes = exists
    ? objectTypes.map((o) => (o.id === resolved.id ? resolved : o))
    : [...objectTypes, resolved];

  changeSets = appendChangeEntry(
    changeSets,
    DRAFT_CHANGESET_ID,
    {
      type: 'add_object',
      target: resolved.id,
      description: `启用 / 新增了 Object Type: ${resolved.id} (${resolved.nameCn})，并注入核心属性。`,
    },
  );
  return resolved;
}

/** Replace the full LinkType set and append an add_link entry to the draft changeset. */
export async function replaceLinkTypes(next: LinkType[]): Promise<LinkType[]> {
  await sleep(LATENCY);
  linkTypes = next;
  changeSets = appendChangeEntry(changeSets, DRAFT_CHANGESET_ID, {
    type: 'add_link',
    target: 'Relation Model',
    description: '新建或解绑了特定的 Link Type 关系承载。',
  });
  return linkTypes;
}

/** Replace the full Capability set and append a bind_capability entry to the draft changeset. */
export async function replaceCapabilities(next: Capability[]): Promise<Capability[]> {
  await sleep(LATENCY);
  capabilities = next;
  changeSets = appendChangeEntry(changeSets, DRAFT_CHANGESET_ID, {
    type: 'bind_capability',
    target: 'Capability Binding',
    description: '为领域实体多级绑定了特定的 Function / Action 计算或修改决策方法。',
  });
  return capabilities;
}

/** Activate the draft changeset (editing mode) by promoting it to status 'editing'. */
export async function activateDraftChangeSet(): Promise<ChangeSet[]> {
  await sleep(LATENCY);
  changeSets = changeSets.map((cs) =>
    cs.id === DRAFT_CHANGESET_ID ? {...cs, status: 'editing' as const} : cs,
  );
  return changeSets;
}

// ---- helpers ----

function appendChangeEntry(
  list: ChangeSet[],
  csId: string,
  entry: ChangeSetEntry,
): ChangeSet[] {
  return list.map((cs) => {
    if (cs.id !== csId) return cs;
    const has = cs.changes.some((c) => c.target === entry.target && c.type === entry.type);
    if (has) return cs;
    return {...cs, changes: [...cs.changes, entry]};
  });
}
