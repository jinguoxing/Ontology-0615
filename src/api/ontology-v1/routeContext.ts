import type {ViewReference} from './types.generated';
export const tabs=['overview','object-types','relations','actions','implementations','workflows','validation','release'] as const;
export type OntologyTab=typeof tabs[number];
export interface OntologyRoute {modelId:string; tab:OntologyTab; view:ViewReference; selectedId?:string}
/** 规范本体列表入口（无 modelId，不属于 OntologyRoute）。 */
export const ONTOLOGY_LIST_PATH='/business-semantics/ontologies';
export function isOntologyUrl(pathname:string):boolean {
 return pathname===ONTOLOGY_LIST_PATH||pathname.startsWith(ONTOLOGY_LIST_PATH+'/');
}
/** 不含视图参数的路径解析：URL 可能还未携带 versionId/changeSetId（由 ModelContext 补齐）。 */
export interface OntologyPath {modelId:string; tab:OntologyTab; selectedId?:string}
export function parseOntologyPath(pathname:string,search:string):OntologyPath|null {
 const p=pathname.match(/^\/business-semantics\/ontologies\/([^/]+)\/([^/]+)$/);
 if(!p||!tabs.includes(p[2] as OntologyTab))return null;
 const selectedId=new URLSearchParams(search).get('selected')||undefined;
 return {modelId:decodeURIComponent(p[1]),tab:p[2] as OntologyTab,selectedId};
}
export function parseOntologyRoute(pathname:string,search:string):OntologyRoute|null {
 const p=pathname.match(/^\/business-semantics\/ontologies\/([^/]+)\/([^/]+)$/);
 if(!p||!tabs.includes(p[2] as OntologyTab))return null;
 const q=new URLSearchParams(search),versionId=q.get('versionId'),changeSetId=q.get('changeSetId'),rv=q.get('revision');
 if(Boolean(versionId)===Boolean(changeSetId)|| (versionId&&rv!==null))return null;
 const revision=rv===null?NaN:Number(rv);
 if(changeSetId&&(!/^\d+$/.test(rv||'')||!Number.isSafeInteger(revision)))return null;
 const view:ViewReference=versionId?{versionId}:{changeSetId:changeSetId!,revision};
 return {modelId:decodeURIComponent(p[1]),tab:p[2] as OntologyTab,view,selectedId:q.get('selected')||undefined};
}
export function ontologyLocation(r:OntologyRoute):string {
 const q=new URLSearchParams(Object.entries(r.view).map(([k,v])=>[k,String(v)]));
 if(r.selectedId)q.set('selected',r.selectedId);
 return `/business-semantics/ontologies/${encodeURIComponent(r.modelId)}/${r.tab}?${q}`;
}
