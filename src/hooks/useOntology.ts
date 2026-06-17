/**
 * React Query hooks for DRKN ontology domain entities.
 *
 * Server-state layer of the three-tier model. Components consume these hooks
 * instead of receiving data via props — queries own reads, mutations own writes,
 * and invalidation keeps related caches consistent.
 */

import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {
  fetchCapabilities,
  fetchChangeSets,
  fetchLinkTypes,
  fetchObjectTypes,
  fetchValidationItems,
  fetchWorkflows,
  activateDraftChangeSet,
  addObjectType,
  replaceCapabilities,
  replaceLinkTypes,
  updateObjectType,
} from '../api/ontology';
import type {Capability, ChangeSet, LinkType, ObjectType} from '../types';

export const ontologyKeys = {
  all: ['ontology'] as const,
  objectTypes: () => [...ontologyKeys.all, 'objectTypes'] as const,
  linkTypes: () => [...ontologyKeys.all, 'linkTypes'] as const,
  capabilities: () => [...ontologyKeys.all, 'capabilities'] as const,
  workflows: () => [...ontologyKeys.all, 'workflows'] as const,
  changeSets: () => [...ontologyKeys.all, 'changeSets'] as const,
  validationItems: () => [...ontologyKeys.all, 'validationItems'] as const,
};

// ---- Reads ----

export function useObjectTypes() {
  return useQuery({queryKey: ontologyKeys.objectTypes(), queryFn: fetchObjectTypes});
}

export function useLinkTypes() {
  return useQuery({queryKey: ontologyKeys.linkTypes(), queryFn: fetchLinkTypes});
}

export function useCapabilities() {
  return useQuery({queryKey: ontologyKeys.capabilities(), queryFn: fetchCapabilities});
}

export function useWorkflows() {
  return useQuery({queryKey: ontologyKeys.workflows(), queryFn: fetchWorkflows});
}

export function useChangeSets() {
  return useQuery({queryKey: ontologyKeys.changeSets(), queryFn: fetchChangeSets});
}

export function useValidationItems() {
  return useQuery({queryKey: ontologyKeys.validationItems(), queryFn: fetchValidationItems});
}

// ---- Writes ----

export function useUpdateObjectType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (updated: ObjectType) => updateObjectType(updated),
    onSuccess: () => qc.invalidateQueries({queryKey: ontologyKeys.objectTypes()}),
  });
}

export function useAddObjectType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (newObj: ObjectType) => addObjectType(newObj),
    onSuccess: () => {
      qc.invalidateQueries({queryKey: ontologyKeys.objectTypes()});
      qc.invalidateQueries({queryKey: ontologyKeys.changeSets()});
    },
  });
}

export function useReplaceLinkTypes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (next: LinkType[]) => replaceLinkTypes(next),
    onSuccess: () => {
      qc.invalidateQueries({queryKey: ontologyKeys.linkTypes()});
      qc.invalidateQueries({queryKey: ontologyKeys.changeSets()});
    },
  });
}

export function useReplaceCapabilities() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (next: Capability[]) => replaceCapabilities(next),
    onSuccess: () => {
      qc.invalidateQueries({queryKey: ontologyKeys.capabilities()});
      qc.invalidateQueries({queryKey: ontologyKeys.changeSets()});
    },
  });
}

export function useActivateDraftChangeSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => activateDraftChangeSet(),
    onSuccess: () => qc.invalidateQueries({queryKey: ontologyKeys.changeSets()}),
  });
}
