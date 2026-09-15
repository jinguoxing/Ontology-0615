/** Stateful localhost-only reference server. NOT a production backend.
 * Run: node mock-server/server.mjs
 * No third-party runtime dependencies. Single process + atomic JSON replacement.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {makeValidator} from './schema.mjs';
import {clone,now,uid,hash,etag,emptyDocument,diff,validateModel,analyzeImpact,simulateAction} from './domain.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
const schemas=read('contracts/model.schema.json'), validate=makeValidator(schemas);
const routes=read('contracts/routes.json').map(r=>({...r,names:[...r.path.matchAll(/{(\w+)}/g)].map(x=>x[1]),regex:new RegExp('^'+r.path.replace(/{\w+}/g,'([^/]+)')+'$')}));
const registry=read('seed/registry.json');
const fixtures=read('seed/action-fixtures.json');
const modelDoc=read('seed/data-governance-model.json');
const dbPath=path.resolve(process.env.MOCK_DB_PATH||path.join(ROOT,'mock-server/.data/db.json'));
const lockPath=dbPath+'.lock';fs.mkdirSync(path.dirname(dbPath),{recursive:true});
// Refuse two processes writing one JSON store; dead process locks are recoverable.
try {const fd=fs.openSync(lockPath,'wx');fs.writeFileSync(fd,String(process.pid));fs.closeSync(fd);}
catch(e) {
  if(e.code!=='EEXIST')throw e;
  const pid=Number(fs.readFileSync(lockPath,'utf8'));let live=false;
  try{process.kill(pid,0);live=true;}catch(err){if(err.code!=='ESRCH')live=true;}
  if(live)throw new Error('Mock database is in use by PID '+pid);
  fs.unlinkSync(lockPath);fs.writeFileSync(lockPath,String(process.pid),{flag:'wx'});
}
function releaseLock(){try{if(fs.readFileSync(lockPath,'utf8')===String(process.pid))fs.unlinkSync(lockPath);}catch{}}
process.on('exit',releaseLock);
class ApiError extends Error {constructor(status,code,message,details={}){super(message);Object.assign(this,{status,code,details});}}
const fail=(status,code,message,details)=>{throw new ApiError(status,code,message,details);};
function createWorkspace(isolation=false) {
  const document=clone(modelDoc);
  const date='2026-09-15T00:00:00.000Z';
  const core={id:'drkn-core',name:isolation?'隔离测试数据治理模型':'数据治理本体',profile:'DATA_GOVERNANCE',origin:'SYSTEM',ownerRef:'platform-team',currentVersionId:'v1.3.0',versions:{},changeSets:{}};
  core.versions['v1.3.0']={id:'v1.3.0',modelId:core.id,document:clone(document),contentHash:hash(document),publishedAt:date,releaseNotes:'演示基线，非线上真实模型版本。',baseVersionId:null};
  const draft=clone(document);
  draft.objectTypes.find(t=>t.id==='SemanticAssertion').definition+=' 当前草稿明确 UNKNOWN、队列与生命周期边界。';
  draft.dependencies.find(d=>d.packageId==='runtime').versionId=null;
  const cs={id:'cs-drkn-demo',modelId:core.id,name:'断言契约与外部依赖对齐',reason:'演示模型修订与运行事实分离',baseVersionId:'v1.3.0',targetVersionId:'v1.4.0',revision:12,status:'OPEN',createdAt:date,revisions:{'12':draft},events:[]};
  core.changeSets[cs.id]=cs;
  // A second real model proves model isolation without duplicating business definitions.
  const businessDoc=emptyDocument();
  businessDoc.objectTypes=[{id:'BusinessObject',code:'BusinessObject',nameCn:'业务对象引用',group:'外部契约引用',ownerService:'business-object',origin:'EXTERNAL',definition:'引用现有业务对象注册表，不在本体再造对象副本。',properties:[],externalContract:{packageId:'business',typeId:'BusinessObject',versionId:'v1.0.0'}}];
  businessDoc.dependencies=[{id:'business',packageId:'business',versionId:'v1.0.0'}];
  const business={id:'public-service',name:'公共服务业务本体',profile:'BUSINESS',origin:'TENANT',ownerRef:'public-service-team',currentVersionId:'v1.0.0',versions:{},changeSets:{}};
  business.versions['v1.0.0']={id:'v1.0.0',modelId:business.id,document:businessDoc,contentHash:hash(businessDoc),publishedAt:date,releaseNotes:'最小业务引用模型，验证模型隔离。',baseVersionId:null};
  return {models:{[core.id]:core,[business.id]:business},jobs:{},audits:[],publications:{},idempotency:{},outbox:[]};
}
let db=fs.existsSync(dbPath)?JSON.parse(fs.readFileSync(dbPath,'utf8')):{formatVersion:1,workspaces:{'ws-demo':createWorkspace(),'ws-isolation':createWorkspace(true)}};
if(db.formatVersion!==1)throw new Error('Unsupported DB version; use a new MOCK_DB_PATH.');
function persist(){const tmp=dbPath+'.tmp-'+process.pid;const fd=fs.openSync(tmp,'w');try{fs.writeFileSync(fd,JSON.stringify(db));fs.fsyncSync(fd);}finally{fs.closeSync(fd);}fs.renameSync(tmp,dbPath);}
if(!fs.existsSync(dbPath))persist();
function transaction(fn){const old=clone(db);try{const result=fn();persist();return result;}catch(e){db=old;throw e;}}
function audit(ws,actor,modelId,eventType,targetId,summary){ws.audits.push({id:uid('audit'),actorId:actor.id,modelId,eventType,targetId,summary,occurredAt:now()});}
const accounts={
 'demo-maintainer':{id:'demo-maintainer',write:true,workspaces:['ws-demo','ws-isolation']},
 'demo-viewer':{id:'demo-viewer',write:false,workspaces:['ws-demo']}
};
function auth(req) {
  const account=accounts[(req.headers.authorization||'').replace(/^Bearer /,'')];
  if(!account)fail(401,'UNAUTHENTICATED','演示身份无效');
  const workspaceId=req.headers['x-workspace-id'];
  if(!workspaceId||!account.workspaces.includes(workspaceId))fail(403,'WORKSPACE_DENIED','无权访问工作空间');
  return {actor:account,workspaceId};
}
function model(ws,id){const x=Object.hasOwn(ws.models,id)?ws.models[id]:null;if(!x)fail(404,'MODEL_NOT_FOUND','当前工作空间找不到该模型');return x;}
function changeset(m,id){const x=Object.hasOwn(m.changeSets,id)?m.changeSets[id]:null;if(!x)fail(404,'CHANGESET_NOT_FOUND','当前模型找不到该草稿');return x;}
function revisionDoc(cs,revision){if(!Number.isInteger(revision)||revision<0||!Object.hasOwn(cs.revisions,String(revision)))fail(404,'REVISION_NOT_FOUND','草稿修订不存在');return cs.revisions[String(revision)];}
function version(m,id){const v=Object.hasOwn(m.versions,id)?m.versions[id]:null;if(!v)fail(404,'VERSION_NOT_FOUND','版本不存在');return v;}
function changeSummary(cs){return {id:cs.id,modelId:cs.modelId,name:cs.name,reason:cs.reason,baseVersionId:cs.baseVersionId,targetVersionId:cs.targetVersionId,revision:cs.revision,status:cs.status,etag:etag(cs),contentHash:hash(revisionDoc(cs,cs.revision)),createdAt:cs.createdAt};}
function modelSummary(m){return {id:m.id,name:m.name,profile:m.profile,origin:m.origin,ownerRef:m.ownerRef,currentVersionId:m.currentVersionId,currentVersionHash:m.currentVersionId?version(m,m.currentVersionId).contentHash:null,activeChangeSetId:Object.values(m.changeSets).find(c=>c.status==='OPEN')?.id||null};}
function getView(m,q,actor) {
  const v=q.get('versionId'), c=q.get('changeSetId'),r=q.get('revision');
  if((!!v===!!c)||(v&&r!==null)||(c&&r===null))fail(400,'INVALID_VIEW','versionId 与 changeSetId 二选一，草稿必须明确 revision');
  if(v){const ver=version(m,v);return {modelId:m.id,mode:'VERSION',versionId:v,changeSetId:null,revision:0,contentHash:ver.contentHash,document:clone(ver.document),readOnly:true,etag:`"version:${m.id}:${v}:${ver.contentHash}"`,currentVersionId:m.currentVersionId};}
  if(!/^\d+$/.test(r))fail(400,'INVALID_REVISION','revision 必须为非负整数');
  const cs=changeset(m,c),rev=Number(r),doc=revisionDoc(cs,rev);
  return {modelId:m.id,mode:'DRAFT',versionId:null,changeSetId:c,revision:rev,contentHash:hash(doc),document:clone(doc),readOnly:!actor.write||cs.status!=='OPEN'||cs.revision!==rev,etag:`"${cs.id}:r${rev}"`,currentVersionId:m.currentVersionId};
}
function list(rows,q){const offset=Number(q.get('offset')??0),limit=Number(q.get('limit')??50);if(!Number.isInteger(offset)||offset<0||!Number.isInteger(limit)||limit<1||limit>200)fail(400,'INVALID_PAGE','offset / limit 不合法');const query=(q.get('q')||'').toLowerCase();const filtered=rows.filter(x=>JSON.stringify(x).toLowerCase().includes(query)).sort((a,b)=>a.id.localeCompare(b.id));return {items:filtered.slice(offset,offset+limit),total:filtered.length,offset,limit};}
function ensureOpen(cs){if(cs.status!=='OPEN')fail(409,'CHANGESET_NOT_OPEN','该草稿不允许继续修改');}
function matchEtag(req,cs){if(!req.headers['if-match'])fail(428,'PRECONDITION_REQUIRED','必须提交 If-Match');if(req.headers['if-match']!==etag(cs))fail(412,'REVISION_CONFLICT','草稿已变化，请重新加载',{currentEtag:etag(cs),currentRevision:cs.revision});}
function baseDoc(m,cs){return cs.baseVersionId?version(m,cs.baseVersionId).document:emptyDocument();}
function jobView(ws,m,job){const cs=changeset(m,job.changeSetId);return {id:job.id,kind:job.kind,modelId:job.modelId,changeSetId:job.changeSetId,revision:job.revision,contentHash:job.contentHash,dependencyDigest:job.dependencyDigest,status:job.status,createdAt:job.createdAt,completedAt:job.completedAt,isCurrent:cs.revision===job.revision&&hash(revisionDoc(cs,cs.revision))===job.contentHash&&hash(registry)===job.dependencyDigest,result:job.result,error:job.error};}
function settleJobs(){
 const due=[];for(const [wid,ws] of Object.entries(db.workspaces))for(const j of Object.values(ws.jobs))if(j.status==='RUNNING'&&Date.now()>=j.readyAt)due.push([wid,j.id]);
 if(!due.length)return;
 transaction(()=>{for(const [wid,id] of due){const ws=db.workspaces[wid],j=ws.jobs[id],m=model(ws,j.modelId),cs=changeset(m,j.changeSetId);try{const doc=revisionDoc(cs,j.revision);j.result=j.kind==='VALIDATION'?validateModel(doc,registry):analyzeImpact(baseDoc(m,cs),doc,registry,m.id);j.status='SUCCEEDED';}catch(e){j.status='FAILED';j.error='任务计算失败';}j.completedAt=now();}});
}
function dispatch(ctx,r,p,q,b,req){
 const {workspaceId,actor}=ctx,ws=db.workspaces[workspaceId];
 const m=p.modelId?model(ws,p.modelId):null;
 const cs=p.changeSetId?changeset(m,p.changeSetId):null;
 if(r.cas){matchEtag(req,cs);ensureOpen(cs);}
 switch(r.operationId){
  case 'getSession':return {actorId:actor.id,workspaceId,capabilities:actor.write?['ontology.read','ontology.edit','ontology.publish','ontology.simulate']:['ontology.read'],mode:'DEMO'};
  case 'listModels':return list(Object.values(ws.models).map(modelSummary),q);
  case 'getModel':return modelSummary(m);
  case 'getView':return getView(m,q,actor);
  case 'getGraph':{const view=getView(m,q,actor);return {modelId:m.id,contentHash:view.contentHash,nodes:view.document.objectTypes.map(t=>({id:t.id,nameCn:t.nameCn,origin:t.origin})),edges:view.document.relations};}
  case 'listObjectTypes':case 'listRelations':case 'listConstraints':case 'listActions':case 'listImplementationBindings':case 'listWorkflowRefs':{
    const key=r.operationId.slice(4);const collection=key[0].toLowerCase()+key.slice(1);return list(getView(m,q,actor).document[collection],q);
  }
  case 'listChangeSets':return list(Object.values(m.changeSets).map(changeSummary),q);
  case 'getChangeSet':return changeSummary(cs);
  case 'createModel':{
    if(Object.hasOwn(ws.models,b.id))fail(409,'MODEL_EXISTS','模型 ID 已存在');
    const x={id:b.id,name:b.name,profile:'BUSINESS',origin:'TENANT',ownerRef:b.ownerRef,currentVersionId:null,versions:{},changeSets:{}};
    const c={id:uid('cs'),modelId:x.id,name:'初始模型草稿',reason:'新建业务本体',baseVersionId:null,targetVersionId:'v1.0.0',revision:0,status:'OPEN',createdAt:now(),revisions:{'0':emptyDocument()},events:[]};
    x.changeSets[c.id]=c;ws.models[x.id]=x;audit(ws,actor,x.id,'MODEL_CREATED',x.id,'创建模型及初始草稿');return {model:modelSummary(x),changeSet:changeSummary(c)};
  }
  case 'createChangeSet':{
    if(b.baseVersionId!==m.currentVersionId)fail(409,'BASE_VERSION_ADVANCED','创建草稿的基线必须是当前正式版本');
    if(m.versions[b.targetVersionId])fail(409,'VERSION_EXISTS','目标版本已存在');
    if(Object.values(m.changeSets).some(x=>x.status==='OPEN'))fail(409,'OPEN_CHANGESET_EXISTS','演示版每模型只允许一个活动草稿');
    const doc=b.restoreFromVersionId?clone(version(m,b.restoreFromVersionId).document):b.baseVersionId?clone(version(m,b.baseVersionId).document):emptyDocument();
    const c={id:uid('cs'),modelId:m.id,name:b.name,reason:b.reason,baseVersionId:b.baseVersionId,targetVersionId:b.targetVersionId,revision:0,status:'OPEN',createdAt:now(),revisions:{'0':doc},events:[]};
    m.changeSets[c.id]=c;audit(ws,actor,m.id,'CHANGESET_CREATED',c.id,'基于明确版本创建草稿');return changeSummary(c);
  }
  case 'applyOperations':{
    const doc=clone(revisionDoc(cs,cs.revision));
    for(const op of b.operations){const arr=doc[op.collection],index=arr.findIndex(x=>x.id===op.id);
      if(op.op==='REMOVE'){if(index<0)fail(404,'COMPONENT_NOT_FOUND','待移除构件不存在');arr.splice(index,1);}
      else {if(op.value.id!==op.id)fail(422,'ID_MISMATCH','操作 ID 与构件 ID 不一致');
        if(index>=0&&op.collection==='objectTypes'&&arr[index].origin==='EXTERNAL'){
          const protectedFields=x=>({...x,externalContract:{...x.externalContract,versionId:null}});
          if(hash(protectedFields(arr[index]))!==hash(protectedFields(op.value)))fail(409,'EXTERNAL_READ_ONLY','外部类型只能升级固定版本引用，不允许改写定义或属性');
        }
        if(index<0)arr.push(clone(op.value));else arr[index]=clone(op.value);
      }
    }
    const errors=validate('ModelDocument',doc);if(errors.length)fail(422,'INVALID_MODEL_DOCUMENT','草稿结构不符合合同',{errors});
    cs.revision++;cs.revisions[String(cs.revision)]=doc;cs.events.push({revision:cs.revision,operations:clone(b.operations),actorId:actor.id,at:now()});
    audit(ws,actor,m.id,'MODEL_DRAFT_CHANGED',cs.id,`保存草稿 r${cs.revision}，正式版本未变化`);return changeSummary(cs);
  }
  case 'abandonChangeSet':cs.status='ABANDONED';audit(ws,actor,m.id,'CHANGESET_ABANDONED',cs.id,b.reason);return changeSummary(cs);
  case 'getDiff':{const rv=q.get('revision');if(rv===null||!/^\d+$/.test(rv))fail(400,'REVISION_REQUIRED','必须指定 revision');const rev=Number(rv),doc=revisionDoc(cs,rev);return {modelId:m.id,changeSetId:cs.id,revision:rev,contentHash:hash(doc),items:diff(baseDoc(m,cs),doc)};}
  case 'startValidation':case 'startImpact':{
    if(b.revision!==cs.revision)fail(412,'REVISION_CONFLICT','只对当前活动修订启动新的校验');
    const j={id:uid('job'),kind:r.operationId==='startValidation'?'VALIDATION':'IMPACT',modelId:m.id,changeSetId:cs.id,revision:cs.revision,contentHash:hash(revisionDoc(cs,cs.revision)),dependencyDigest:hash(registry),status:'RUNNING',createdAt:now(),completedAt:null,readyAt:Date.now()+Number(process.env.MOCK_JOB_DELAY_MS||600),result:null,error:null};
    ws.jobs[j.id]=j;audit(ws,actor,m.id,r.operationId==='startValidation'?'VALIDATION_STARTED':'IMPACT_STARTED',j.id,`针对 r${cs.revision} 计算`);return jobView(ws,m,j);
  }
  case 'getJob':{const j=Object.hasOwn(ws.jobs,p.jobId)?ws.jobs[p.jobId]:null;if(!j||j.modelId!==m.id)fail(404,'JOB_NOT_FOUND','当前模型下找不到该报告');return jobView(ws,m,j);}
  case 'publishVersion':{
    if(b.revision!==cs.revision)fail(412,'REVISION_CONFLICT','发布修订已变化');
    if(m.currentVersionId!==cs.baseVersionId)fail(409,'BASE_VERSION_ADVANCED','当前正式基线已前移，必须重新处理草稿');
    const doc=revisionDoc(cs,cs.revision),h=hash(doc);
    const v=ws.jobs[b.validationRunId],i=ws.jobs[b.impactAnalysisId];
    for(const [j,kind] of [[v,'VALIDATION'],[i,'IMPACT']]) {
      if(!j||j.kind!==kind||j.modelId!==m.id||j.changeSetId!==cs.id||j.revision!==cs.revision||j.contentHash!==h||j.dependencyDigest!==hash(registry))fail(409,'REPORT_STALE','报告不属于当前模型/草稿/修订或依赖已变化');
      if(j.status!=='SUCCEEDED')fail(409,'REPORT_NOT_READY','报告尚未成功完成');
    }
    if(!v.result.passed)fail(409,'VALIDATION_BLOCKED','存在未修复的模型定义阻断',{issues:v.result.issues});
    if(!validateModel(doc,registry).passed)fail(409,'FINAL_VALIDATION_FAILED','发布事务重检未通过');
    if(i.result.inventoryCompleteness==='PARTIAL'&&!b.acknowledgePartialCoverage)fail(409,'IMPACT_ACK_REQUIRED','需要知悉已登记依赖以外的影响未知');
    if(m.versions[cs.targetVersionId])fail(409,'VERSION_EXISTS','目标版本已存在');
    const date=now(),pub={id:uid('pub'),modelId:m.id,changeSetId:cs.id,versionId:cs.targetVersionId,contentHash:h,publishedAt:date,workflowStarted:false,consumerPinsUpdated:false,outboxEventId:uid('event')};
    m.versions[pub.versionId]={id:pub.versionId,modelId:m.id,document:clone(doc),contentHash:h,publishedAt:date,releaseNotes:b.releaseNotes,baseVersionId:cs.baseVersionId};
    m.currentVersionId=pub.versionId;cs.status='PUBLISHED';ws.publications[pub.id]=pub;
    ws.outbox.push({id:pub.outboxEventId,type:'ontology.version.published',modelId:m.id,versionId:pub.versionId,contentHash:h,at:date,status:'PENDING_EXTERNAL_DELIVERY'});
    audit(ws,actor,m.id,'ONTOLOGY_VERSION_PUBLISHED',pub.versionId,b.releaseNotes);return pub;
  }
  case 'listVersions':return list(Object.values(m.versions),q);
  case 'getVersion':return clone(version(m,p.versionId));
  case 'listAuditEvents':return list(ws.audits.filter(x=>x.modelId===m.id),q);
  case 'getRegistry':return clone(registry);
  case 'listActionFixtures':return list(fixtures,q);
  case 'testAction':{
    const view=getView(m,new URLSearchParams(Object.entries(b.view).map(([k,v])=>[k,String(v)])),actor),action=view.document.actions.find(a=>a.id===b.actionId),fixture=fixtures.find(f=>f.id===b.fixtureId&&f.actionId===b.actionId);
    if(!action)fail(404,'ACTION_NOT_FOUND','该修订中没有行动契约');if(!fixture)fail(404,'FIXTURE_NOT_FOUND','没有对应演示用例');
    const original=modelDoc.actions.find(a=>a.id===action.id);
    const sameGuards=original&&hash(original.sideEffects)===hash(action.sideEffects)&&hash(original.preconditions)===hash(action.preconditions)&&original.inputContractRef===action.inputContractRef&&original.outputContractRef===action.outputContractRef;
    const simulation=sameGuards?simulateAction(action,fixture):{decision:'NOT_IMPLEMENTED',checks:[],expectedEffects:[],realExecution:false,modelChanged:false,simulatedAfterState:null};
    const result={id:uid('simulation'),modelId:m.id,contentHash:view.contentHash,actionId:action.id,fixtureId:fixture.id,...simulation,limitations:['仅验证交付包内置fixture和守卫，不等于真实业务执行。','自定义前置条件尚未实现动态求值；被修改的守卫返回NOT_IMPLEMENTED。']};
    audit(ws,actor,m.id,'ACTION_CONTRACT_SIMULATED',action.id,'仅内置用例验证，未访问真实服务');return result;
  }
  case 'resetDemo':{
    if(process.env.ENABLE_DEMO_RESET!=='true')fail(403,'DEMO_RESET_DISABLED','演示重置默认关闭');
    db.workspaces[workspaceId]=createWorkspace(workspaceId==='ws-isolation');return {reset:true,scenario:'dependency-blocked'};
  }
  default:fail(404,'NOT_IMPLEMENTED','路由未实现');
 }
}
async function body(req){
 if(!['POST','PATCH','PUT'].includes(req.method))return null;
 if(!(req.headers['content-type']||'').startsWith('application/json'))fail(415,'JSON_REQUIRED','请求必须使用 application/json');
 let size=0,chunks=[];for await(const chunk of req){size+=chunk.length;if(size>2*1024*1024)fail(413,'BODY_TOO_LARGE','最大 2 MB');chunks.push(chunk);}
 try{const text=Buffer.concat(chunks).toString('utf8');return JSON.parse(text||'{}',(k,v)=>{if(['__proto__','constructor','prototype'].includes(k))throw Error('reserved key');return v;});}catch{fail(400,'INVALID_JSON','请求 JSON 无效或使用保留键');}
}
function send(res,status,data,headers={}){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers});res.end(JSON.stringify(data));}
const server=http.createServer(async(req,res)=>{
 const requestId=uid('req'),meta={requestId,dataMode:'MOCK',contractVersion:'1.0.0'};
 try {
   const u=new URL(req.url,'http://127.0.0.1');let r=null,match=null;
   for(const route of routes)if(route.method===req.method&&(match=u.pathname.match(route.regex))){r=route;break;}
   if(!r)fail(404,'ROUTE_NOT_FOUND','接口不存在');
   if(r.operationId==='health'){send(res,200,{data:{status:'ok',mode:'MOCK',contractVersion:'1.0.0'},meta});return;}
   const ctx=auth(req);if(r.write&&!ctx.actor.write)fail(403,'ACTION_DENIED','当前演示身份只有读取权限');
   const p=Object.fromEntries(r.names.map((n,i)=>[n,decodeURIComponent(match[i+1])]));
   for(const [k,v] of Object.entries(p))if(!/^[A-Za-z][A-Za-z0-9_.:-]*$/.test(v)||v.length>140)fail(400,'INVALID_PATH_PARAMETER','路径参数不合法');
   const b=await body(req);
   if(r.requestSchema){const errors=validate(r.requestSchema,b);if(errors.length)fail(422,'SCHEMA_VALIDATION_FAILED','请求不符合接口合同',{errors:errors.slice(0,12)});}
   settleJobs();
   const idem=req.headers['idempotency-key'];
   if(r.idempotency&&(!idem||idem.length>128))fail(400,'IDEMPOTENCY_KEY_REQUIRED','必须提供长度 1–128 的 Idempotency-Key');
   const ik=r.idempotency?`${ctx.actor.id}|${r.method}|${u.pathname}|${idem}`:null,bodyHash=hash(b);
   const cached=ik?db.workspaces[ctx.workspaceId].idempotency[ik]:null;
   if(cached){if(cached.bodyHash!==bodyHash)fail(409,'IDEMPOTENCY_CONFLICT','同一幂等键不能携带不同请求');send(res,cached.status,{data:cached.data,meta},{...cached.headers,'Idempotent-Replayed':'true'});return;}
   let result,headers={};
   const work=()=>{
     const output=dispatch(ctx,r,p,u.searchParams,b,req);
     const errors=validate(r.responseSchema,output);if(errors.length)throw new Error('Response contract violation: '+JSON.stringify(errors.slice(0,4)));
     if(output.etag)headers.ETag=output.etag;
     if(r.status===202){headers.Location=`/api/v1/ontology/models/${p.modelId}/jobs/${output.id}`;headers['Retry-After']='1';}
     if(ik)db.workspaces[ctx.workspaceId].idempotency[ik]={bodyHash,data:clone(output),status:r.status,headers:clone(headers)};
     return output;
   };
   result=r.write?transaction(work):work();
   send(res,r.status,{data:result,meta},headers);
 } catch(e) {
   const known=e instanceof ApiError;if(!known)console.error(e);
   send(res,known?e.status:500,{error:{code:known?e.code:'INTERNAL_ERROR',message:known?e.message:'Mock 服务内部错误',details:known?e.details:{}},meta});
 }
});
const timer=setInterval(()=>{try{settleJobs();}catch(e){console.error(e);}},100);timer.unref();
const port=Number(process.env.PORT||4310);
server.listen(port,'127.0.0.1',()=>console.log(`SEMOVIX_MOCK_READY http://127.0.0.1:${server.address().port} db=${dbPath}`));
function stop(){clearInterval(timer);server.close(()=>{releaseLock();process.exit(0);});setTimeout(()=>process.exit(0),2000).unref();}
process.on('SIGTERM',stop);process.on('SIGINT',stop);
