/** Run against the reference API; resets ONLY ws-demo. No production execution. */
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
const BASE=(process.env.API_BASE||'http://127.0.0.1:4310').replace(/\/$/,'');
const A='/api/v1/ontology',M=A+'/models/drkn-core',C=M+'/changesets/cs-drkn-demo';
async function request(method,url,body,etag) {
 const headers={Authorization:'Bearer demo-maintainer','X-Workspace-Id':'ws-demo'};
 if(method!=='GET'){headers['Content-Type']='application/json';headers['Idempotency-Key']=randomUUID();}
 if(etag)headers['If-Match']=etag;
 const res=await fetch(BASE+url,{method,headers,body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(10000)});
 const result=await res.json();
 if(!res.ok)throw new Error(`${method} ${url}: ${res.status} ${result.error?.code}: ${result.error?.message}`);
 return result.data;
}
async function compute(kind,revision) {
 const started=await request('POST',C+'/'+kind,{revision},`"cs-drkn-demo:r${revision}"`);
 for(let n=0;n<80;n++){
  const job=await request('GET',M+'/jobs/'+started.id);
  if(job.status==='FAILED')throw new Error('任务计算失败');
  if(job.status==='SUCCEEDED')return job;
  await new Promise(resolve=>setTimeout(resolve,150));
 }
 throw new Error('轮询任务超时');
}
try{
 console.log('演示对象：本地 Mock API；即将重置 ws-demo。服务需 ENABLE_DEMO_RESET=true。');
 await request('POST','/__demo/reset',{confirmation:'RESET_DEMO_DATA'});
 const base=await request('GET',M+'/versions/v1.3.0');
 console.log('1. 当前正式版本 v1.3.0；类型定义 '+base.document.objectTypes.length+' 个。');
 const blocked=await compute('validation-runs',12);
 assert.equal(blocked.result.passed,false);
 assert(blocked.result.issues.some(x=>x.code==='DEPENDENCY_VERSION_REQUIRED'));
 console.log('2. r12 实际校验发现：runtime 依赖未锁定版本。');
 const repaired=await request('POST',C+'/operations',{operations:[{op:'UPSERT',collection:'dependencies',id:'runtime',value:{id:'runtime',packageId:'runtime',versionId:'v1.0.0'}}]},'"cs-drkn-demo:r12"');
 assert.equal(repaired.revision,13);
 assert.equal((await request('GET',M+'/versions/v1.3.0')).contentHash,base.contentHash);
 console.log('3. 修复后生成 r13，正式 v1.3.0 内容未改变。');
 const validation=await compute('validation-runs',13),impact=await compute('impact-analyses',13);
 assert.equal(validation.result.passed,true);
 console.log('4. r13 校验通过；影响清单范围 '+impact.result.inventoryCompleteness+'，不声称全企业覆盖。');
 const publication=await request('POST',C+'/publications',{revision:13,validationRunId:validation.id,impactAnalysisId:impact.id,releaseNotes:'接口演示：断言契约与外部依赖对齐',acknowledgePartialCoverage:true},'"cs-drkn-demo:r13"');
 assert.equal(publication.versionId,'v1.4.0');
 assert.equal(publication.workflowStarted,false);assert.equal(publication.consumerPinsUpdated,false);
 assert.equal((await request('GET',M)).currentVersionId,'v1.4.0');
 console.log('5. 已发布 v1.4.0；未启动工作流、未修改消费方固定版本。');
 assert.equal((await request('GET',M+'/versions/v1.3.0')).contentHash,base.contentHash);
 const valid=await request('POST',M+'/action-tests',{view:{versionId:'v1.4.0'},actionId:'confirmAssertion',fixtureId:'assertion-good'});
 const denied=await request('POST',M+'/action-tests',{view:{versionId:'v1.4.0'},actionId:'confirmAssertion',fixtureId:'assertion-llm-only'});
 assert.equal(valid.decision,'ALLOW');assert.equal(denied.decision,'DENY');
 console.log('6. 固定用例：低分但有依据可确认；高分仅 LLM 依据被拒绝。均未执行真实动作。');
 console.log('DEMO_PASS：HTTP 模型管理链路可重复；九个 React 页面需按交付规范接入。');
}catch(error){console.error('DEMO_FAILED:',error.message);process.exitCode=1;}
