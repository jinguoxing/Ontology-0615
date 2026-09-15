import type {ViewReference} from './types.generated';
export interface CacheScope {workspaceId:string; actorId:string; modelId:string}
export const ontologyKeys={
 root:(s:Pick<CacheScope,'workspaceId'|'actorId'>)=>['ontology-v1',s.workspaceId,s.actorId] as const,
 model:(s:CacheScope)=>['ontology-v1',s.workspaceId,s.actorId,s.modelId] as const,
 changeSet:(s:CacheScope,cid:string)=>[...ontologyKeys.model(s),'changeset',cid] as const,
 view:(s:CacheScope,v:ViewReference)=>[...ontologyKeys.model(s),'view',v] as const,
 collection:(s:CacheScope,v:ViewReference,collection:string,filters:Record<string,unknown>={})=>[...ontologyKeys.model(s),'view',v,collection,filters] as const,
 job:(s:CacheScope,id:string)=>[...ontologyKeys.model(s),'job',id] as const,
};
