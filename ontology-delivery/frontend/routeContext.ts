import type {ViewReference} from './types.generated';
export const tabs=['overview','object-types','relations','actions','implementations','workflows','validation','release'] as const;
export type OntologyTab=typeof tabs[number];
export interface OntologyRoute {modelId:string; tab:OntologyTab; view:ViewReference; selectedId?:string}
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
