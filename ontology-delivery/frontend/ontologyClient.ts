import type {
  Envelope, ErrorResponse, ModelSummary, ModelsList, ResolvedView, Graph,
  ChangeSet, CreateModelRequest, CreateModelResult, CreateChangeSetRequest,
  ApplyOperationsRequest, AsyncJob, DiffResult, PublishRequest, Publication,
  VersionRecord, VersionsList, ChangesetsList, AuditEventsList, Registry,
  ActionFixturesList, ActionTestRequest, ActionTestResult, ViewReference, Session,
  ObjectTypesList, RelationsList, ConstraintsList, ActionsList,
  ImplementationBindingsList, WorkflowRefsList,
} from './types.generated';
export class OntologyApiError extends Error {
  constructor(public status: number, public code: string, message: string,
    public details: Record<string, unknown>, public requestId: string) {super(message);}
}
export interface ClientOptions {
  /** Empty string means same-origin Vite proxy. NEVER include a production secret. */
  baseUrl: string;
  getToken(): string;
  getWorkspaceId(): string;
}
export interface HttpResult<T> {data: T; etag: string | null; requestId: string; dataMode: 'MOCK' | 'LIVE'}
export type PageFilter = {q?: string; offset?: number; limit?: number};
const enc=encodeURIComponent;
export const newIdempotencyKey=()=>crypto.randomUUID();
export function viewQuery(view: ViewReference, filters: PageFilter = {}): string {
  const q=new URLSearchParams();
  for (const [k,v] of Object.entries({...view,...filters})) if(v!==undefined)q.set(k,String(v));
  return q.toString();
}
export function createOntologyClient(options:ClientOptions) {
 const root='/api/v1/ontology';
 const model=(id:string)=>`${root}/models/${enc(id)}`;
 const cs=(id:string,changeSetId:string)=>`${model(id)}/changesets/${enc(changeSetId)}`;
 async function call<T>(method:string,url:string,body?:unknown,write?:{etag?:string;key?:string},signal?:AbortSignal):Promise<HttpResult<T>> {
   const headers: Record<string,string>={Authorization:`Bearer ${options.getToken()}`,'X-Workspace-Id':options.getWorkspaceId()};
   if(body!==undefined)headers['Content-Type']='application/json';
   if(write?.key)headers['Idempotency-Key']=write.key;
   if(write?.etag)headers['If-Match']=write.etag;
   const response=await fetch(options.baseUrl.replace(/\/$/,'')+url,{method,headers,body:body===undefined?undefined:JSON.stringify(body),signal});
   const payload=await response.json() as Envelope<T>|ErrorResponse;
   if(!response.ok || 'error' in payload){
     const e=payload as ErrorResponse;
     throw new OntologyApiError(response.status,e.error?.code||'HTTP_ERROR',e.error?.message||'接口请求失败',e.error?.details||{},e.meta?.requestId||'');
   }
   const p=payload as Envelope<T>;return {data:p.data,etag:response.headers.get('etag'),requestId:p.meta.requestId,dataMode:p.meta.dataMode};
 }
 function page<T>(id:string,suffix:string,view:ViewReference,filters:PageFilter={},signal?:AbortSignal){return call<T>('GET',model(id)+'/'+suffix+'?'+viewQuery(view,filters),undefined,undefined,signal);}
 return {
  session:()=>call<Session>('GET',root+'/session'),
  listModels:(filters:PageFilter={},signal?:AbortSignal)=>call<ModelsList>('GET',root+'/models?'+new URLSearchParams(Object.entries(filters).map(([k,v])=>[k,String(v)])),undefined,undefined,signal),
  getModel:(id:string,signal?:AbortSignal)=>call<ModelSummary>('GET',model(id),undefined,undefined,signal),
  createModel:(body:CreateModelRequest,key:string)=>call<CreateModelResult>('POST',root+'/models',body,{key}),
  getView:(id:string,view:ViewReference,signal?:AbortSignal)=>page<ResolvedView>(id,'view',view,{},signal),
  getGraph:(id:string,view:ViewReference,signal?:AbortSignal)=>page<Graph>(id,'graph',view,{},signal),
  objectTypes:(id:string,view:ViewReference,f:PageFilter={},signal?:AbortSignal)=>page<ObjectTypesList>(id,'object-types',view,f,signal),
  relations:(id:string,view:ViewReference,f:PageFilter={},signal?:AbortSignal)=>page<RelationsList>(id,'relations',view,f,signal),
  constraints:(id:string,view:ViewReference,f:PageFilter={},signal?:AbortSignal)=>page<ConstraintsList>(id,'constraints',view,f,signal),
  actions:(id:string,view:ViewReference,f:PageFilter={},signal?:AbortSignal)=>page<ActionsList>(id,'actions',view,f,signal),
  implementationBindings:(id:string,view:ViewReference,f:PageFilter={},signal?:AbortSignal)=>page<ImplementationBindingsList>(id,'implementation-bindings',view,f,signal),
  workflowRefs:(id:string,view:ViewReference,f:PageFilter={},signal?:AbortSignal)=>page<WorkflowRefsList>(id,'workflow-refs',view,f,signal),
  listChangeSets:(id:string)=>call<ChangesetsList>('GET',model(id)+'/changesets'),
  createChangeSet:(id:string,body:CreateChangeSetRequest,key:string)=>call<ChangeSet>('POST',model(id)+'/changesets',body,{key}),
  getChangeSet:(id:string,cid:string,signal?:AbortSignal)=>call<ChangeSet>('GET',cs(id,cid),undefined,undefined,signal),
  applyOperations:(id:string,cid:string,body:ApplyOperationsRequest,etag:string,key:string)=>call<ChangeSet>('POST',cs(id,cid)+'/operations',body,{etag,key}),
  abandon:(id:string,cid:string,reason:string,etag:string,key:string)=>call<ChangeSet>('POST',cs(id,cid)+'/abandon',{reason},{etag,key}),
  diff:(id:string,cid:string,revision:number)=>call<DiffResult>('GET',cs(id,cid)+`/diff?revision=${revision}`),
  validate:(id:string,cid:string,revision:number,etag:string,key:string)=>call<AsyncJob>('POST',cs(id,cid)+'/validation-runs',{revision},{etag,key}),
  analyzeImpact:(id:string,cid:string,revision:number,etag:string,key:string)=>call<AsyncJob>('POST',cs(id,cid)+'/impact-analyses',{revision},{etag,key}),
  getJob:(id:string,jobId:string,signal?:AbortSignal)=>call<AsyncJob>('GET',model(id)+'/jobs/'+enc(jobId),undefined,undefined,signal),
  publish:(id:string,cid:string,body:PublishRequest,etag:string,key:string)=>call<Publication>('POST',cs(id,cid)+'/publications',body,{etag,key}),
  listVersions:(id:string)=>call<VersionsList>('GET',model(id)+'/versions'),
  getVersion:(id:string,versionId:string)=>call<VersionRecord>('GET',model(id)+'/versions/'+enc(versionId)),
  audit:(id:string)=>call<AuditEventsList>('GET',model(id)+'/audit-events?limit=200'),
  registry:()=>call<Registry>('GET',root+'/registry'),
  actionFixtures:()=>call<ActionFixturesList>('GET',root+'/action-fixtures'),
  testAction:(id:string,body:ActionTestRequest,key:string)=>call<ActionTestResult>('POST',model(id)+'/action-tests',body,{key}),
  resetDemo:()=>call<{reset:true;scenario:'dependency-blocked'}>('POST','/__demo/reset',{confirmation:'RESET_DEMO_DATA'}),
 };
}
