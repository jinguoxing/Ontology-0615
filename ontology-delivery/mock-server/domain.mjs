import crypto from 'node:crypto';
export const clone=x=>structuredClone(x);
export const now=()=>new Date().toISOString();
export const uid=prefix=>prefix+'-'+crypto.randomUUID();
export const canonical=x=> Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
export const hash=x=>crypto.createHash('sha256').update(JSON.stringify(canonical(x))).digest('hex');
export const etag=cs=>`"${cs.id}:r${cs.revision}"`;
export const collectionNames=['objectTypes','relations','constraints','actions','implementationBindings','workflowRefs','dependencies'];
export function emptyDocument(){return Object.fromEntries(collectionNames.map(k=>[k,[]]));}
export function diff(before,after) {
  const items=[];
  for(const collection of collectionNames) {
    const a=new Map(before[collection].map(v=>[v.id,v]));
    const b=new Map(after[collection].map(v=>[v.id,v]));
    for(const id of [...new Set([...a.keys(),...b.keys()])].sort()) {
      const av=a.get(id),bv=b.get(id);
      if(hash(av??null)!==hash(bv??null))items.push({collection,id,change:!av?'ADD':!bv?'REMOVE':'MODIFY',before:av??null,after:bv??null});
    }
  }
  return items;
}
export function validateModel(doc,registry) {
  const issues=[];
  const issue=(code,message,path,targetId,remediation,severity='ERROR')=>issues.push({code,message,path,targetId,remediation,severity});
  for(const k of collectionNames) {
    const seen=new Set();
    for(const [i,v] of doc[k].entries()) {
      if(seen.has(v.id))issue('DUPLICATE_ID','构件 ID 重复',`${k}/${i}`,v.id,'使用同一构件或新的稳定 ID');
      seen.add(v.id);
    }
  }
  if(doc.objectTypes.length===0)issue('MODEL_EMPTY','本体尚未包含类型','objectTypes','model','添加类型或引用既有业务对象');
  const ts=new Map(doc.objectTypes.map(t=>[t.id,t]));
  const rs=new Map(doc.relations.map(r=>[r.id,r]));
  for(const [i,t] of doc.objectTypes.entries()) {
    const names=new Set();
    for(const [j,p] of t.properties.entries()) {
      if(names.has(p.code))issue('DUPLICATE_PROPERTY_CODE','同类型属性编码重复',`objectTypes/${i}/properties/${j}`,t.id,'为属性选择唯一编码');
      names.add(p.code);
    }
    if(t.origin!=='EXTERNAL' && !t.properties.some(p=>p.isIdentity&&p.required))
      issue('IDENTITY_REQUIRED','类型缺少必填稳定标识',`objectTypes/${i}/properties`,t.id,'明确标识属性并设为必填');
    if(t.origin==='EXTERNAL') {
      const ext=t.externalContract;
      if(!ext){issue('EXTERNAL_CONTRACT_REQUIRED','外部类型缺少契约引用',`objectTypes/${i}`,t.id,'选择既有类型契约');continue;}
      const dep=doc.dependencies.find(d=>d.packageId===ext.packageId);
      if(!dep?.versionId)issue('DEPENDENCY_VERSION_REQUIRED',`外部 ${ext.packageId} 依赖尚未锁定版本`,`dependencies/${ext.packageId}`,ext.packageId,'选择已注册的固定依赖版本');
      else {
        const version=registry.packages.find(p=>p.id===ext.packageId)?.versions.find(v=>v.versionId===dep.versionId);
        if(!version?.typeIds.includes(ext.typeId))issue('EXTERNAL_TYPE_NOT_FOUND','外部包中找不到类型',`objectTypes/${i}/externalContract`,t.id,'修正类型与依赖版本引用');
        if(ext.versionId!==dep.versionId)issue('DEPENDENCY_VERSION_MISMATCH','类型引用版本与包依赖版本不一致',`objectTypes/${i}/externalContract/versionId`,t.id,'显式锁定同一版本');
      }
      if(t.properties.length)issue('EXTERNAL_TYPE_COPIED','外部类型不得在本模型复制可编辑属性',`objectTypes/${i}/properties`,t.id,'从权威类型服务读取属性，不复制为本地定义');
    }
  }
  for(const [i,r] of doc.relations.entries()) {
    for(const f of ['sourceTypeId','targetTypeId']) if(!ts.has(r[f]))issue('RELATION_TARGET_NOT_FOUND','关系引用不存在的类型',`relations/${i}/${f}`,r.id,'选择当前模型或已导入的类型');
    for(const f of ['sourceCardinality','targetCardinality'])if(r[f].max!==null&&r[f].min>r[f].max)issue('CARDINALITY_INVALID','基数最小值大于最大值',`relations/${i}/${f}`,r.id,'修正基数范围');
    if(r.id==='generated_by'&&(r.sourceTypeId==='Run'||r.targetTypeId!=='Run'))issue('PROVENANCE_DIRECTION','generated_by 应由产物指向 Run',`relations/${i}`,r.id,'修正为 SemanticAssertion → Run');
  }
  for(const [i,c] of doc.constraints.entries()) {
    if(c.scope==='MODEL_DEFINITION')issue('UNSUPPORTED_CUSTOM_MODEL_RULE','V1不执行自定义模型规则，仅支持内置结构检查',`constraints/${i}`,c.id,'使用已有内置检查或在规则服务实现并注册求值器');
    if(!ts.has(c.targetTypeId))issue('CONSTRAINT_TARGET_NOT_FOUND','约束目标类型不存在',`constraints/${i}`,c.id,'选择有效类型');
    if(c.expression.requiresRelation&&!rs.has(c.expression.requiresRelation))issue('RULE_RELATION_NOT_FOUND','约束引用的关系不存在',`constraints/${i}/expression`,c.id,'补充或修改关系引用');
    if(c.expression.inverseRelation&&!rs.has(c.expression.inverseRelation))issue('RULE_RELATION_NOT_FOUND','约束引用的反向关系不存在',`constraints/${i}/expression`,c.id,'补充或修改关系引用');
  }
  const acts=new Map(doc.actions.map(a=>[a.id,a]));
  for(const [i,a] of doc.actions.entries()) {
    for(const t of [...a.inputTypeIds,...a.outputTypeIds])if(!ts.has(t))issue('ACTION_TYPE_NOT_FOUND',`行动引用未知类型 ${t}`,`actions/${i}`,a.id,'导入类型或修正契约');
    if(a.id==='confirmAssertion'&&a.preconditions.some(p=>/confidence\s*[>=]/i.test(p)))issue('CONFIDENCE_AUTHORITY_ERROR','不得只用模型分数作为语义权威',`actions/${i}/preconditions`,a.id,'按证据、冲突、版本与权限判定');
    if(a.sideEffects.includes('SOURCE_WRITE'))issue('SOURCE_WRITE_REQUIRES_REVIEW','源数据写入不属于当前演示范围',`actions/${i}/sideEffects`,a.id,'转交原业务系统评审，不在本体演示执行');
  }
  for(const [i,b] of doc.implementationBindings.entries()) {
    const impl=registry.implementations.find(x=>x.id===b.implementationId&&x.versionId===b.implementationVersionId);
    if(!impl){issue('IMPLEMENTATION_NOT_FOUND','实现或固定版本未注册',`implementationBindings/${i}`,b.id,'选择已注册实现版本');continue;}
    const action=b.kind==='ACTION'?acts.get(b.actionId):null;
    if(b.kind==='ACTION'&&!action)issue('ACTION_NOT_FOUND','实现绑定缺少行动契约',`implementationBindings/${i}`,b.id,'选择当前行动');
    if(b.kind!==impl.kind||b.inputContractRef!==impl.inputContractRef||b.outputContractRef!==impl.outputContractRef||hash([...b.expectedSideEffects].sort())!==hash([...impl.sideEffects].sort()))issue('IMPLEMENTATION_CONTRACT_MISMATCH','实现输入/输出/副作用不符合绑定契约',`implementationBindings/${i}`,b.id,'选择兼容实现，不能只比较显示名称');
    if(action&&(action.inputContractRef!==b.inputContractRef||action.outputContractRef!==b.outputContractRef||hash([...action.sideEffects].sort())!==hash([...b.expectedSideEffects].sort())))issue('ACTION_BINDING_MISMATCH','行动与实现绑定的契约不一致',`implementationBindings/${i}`,b.id,'对齐行动接口和副作用');
  }
  for(const [i,w] of doc.workflowRefs.entries()) {
    const registered=registry.workflows.find(x=>x.id===w.workflowId&&x.versionId===w.workflowVersionId);
    if(!registered)issue('WORKFLOW_NOT_FOUND','流程引用版本不存在',`workflowRefs/${i}`,w.id,'选择已注册流程版本');
    else if(hash([...registered.requiredActionIds].sort())!==hash([...w.requiredActionIds].sort()))issue('WORKFLOW_REQUIREMENTS_MISMATCH','流程需求被本体侧擅自改写',`workflowRefs/${i}`,w.id,'采用原流程声明的需求');
    for(const aid of w.requiredActionIds)if(!acts.has(aid))issue('WORKFLOW_ACTION_NOT_FOUND',`流程需要行动 ${aid}`,`workflowRefs/${i}`,w.id,'补齐行动契约或解除不适用的流程关联');
  }
  const unique=[...new Map(issues.map(i=>[i.code+'|'+i.targetId+'|'+i.path,i])).values()];
  return {passed:!unique.some(i=>i.severity==='ERROR'),issues:unique,evaluatedChecks:['schema','stable_identity','reference_integrity','dependency_pin','cardinality','action_contract','implementation_compatibility','workflow_reference'],notExecuted:['未检查真实源数据的唯一性、空值率或质量','未执行实际连接器、AI 模型或工作流','未验证未登记消费方；影响范围不保证完整','GOVERNANCE_RECORD 规则仅检查定义和引用，不冒充实例校验结果']};
}
export function analyzeImpact(base,doc,registry,modelId) {
  const changes=diff(base,doc), items=[];
  const affectedTypes=new Set();
  const edges=new Map();
  const edge=(a,b)=>{const v=edges.get(a)||[];v.push(b);edges.set(a,v);};
  const names=new Map();
  for(const t of doc.objectTypes)names.set('type:'+t.id,{id:t.id,name:t.nameCn,kind:'TYPE'});
  for(const r of doc.relations){const k='relation:'+r.id;names.set(k,{id:r.id,name:r.nameCn,kind:'RELATION'});edge('type:'+r.sourceTypeId,k);edge('type:'+r.targetTypeId,k);}
  for(const a of doc.actions){const k='action:'+a.id;names.set(k,{id:a.id,name:a.nameCn,kind:'ACTION'});for(const t of [...a.inputTypeIds,...a.outputTypeIds])edge('type:'+t,k);}
  for(const b of doc.implementationBindings){const k='binding:'+b.id;names.set(k,{id:b.id,name:b.implementationId,kind:'IMPLEMENTATION'});if(b.actionId)edge('action:'+b.actionId,k);}
  for(const w of doc.workflowRefs){const k='workflow:'+w.id;names.set(k,{id:w.id,name:w.workflowId,kind:'WORKFLOW'});for(const a of w.requiredActionIds)edge('action:'+a,k);}
  for(const c of registry.consumers.filter(c=>c.modelId===modelId)){const k='consumer:'+c.id;names.set(k,{id:c.id,name:c.nameCn,kind:'CONSUMER'});for(const t of c.typeIds)edge('type:'+t,k);}
  const roots=[];
  for(const c of changes){
    if(c.collection==='objectTypes'){roots.push('type:'+c.id);affectedTypes.add(c.id);}
    if(c.collection==='relations')for(const t of [c.before?.sourceTypeId,c.before?.targetTypeId,c.after?.sourceTypeId,c.after?.targetTypeId].filter(Boolean))roots.push('type:'+t);
    if(c.collection==='actions')roots.push('action:'+c.id);
    if(c.collection==='implementationBindings')roots.push('binding:'+c.id);
    if(c.collection==='workflowRefs')roots.push('workflow:'+c.id);
    if(c.collection==='constraints')for(const t of [c.before?.targetTypeId,c.after?.targetTypeId].filter(Boolean))roots.push('type:'+t);
    if(c.collection==='dependencies')for(const t of doc.objectTypes.filter(t=>t.externalContract?.packageId===c.id))roots.push('type:'+t.id);
  }
  const seen=new Set(),queue=[...new Set(roots)].map(x=>[x]);
  while(queue.length){const path=queue.shift(),key=path.at(-1);if(seen.has(key))continue;seen.add(key);const n=names.get(key);if(n)items.push({...n,path,reason:path.length===1?'本次直接变更或其关联类型':'由显式依赖路径推导'});for(const to of edges.get(key)||[])if(!seen.has(to))queue.push([...path,to]);}
  return {items,inventoryCompleteness:registry.inventoryCompleteness,limitations:['仅计算当前模型、固定依赖和演示注册消费方的显式路径。','未登记的使用关系未知；不把未发现依赖解释为没有影响。'],consumerPinUpdates:0};
}
export function simulateAction(action,fixture) {
  const checks=[]; const check=(name,passed)=>checks.push({name,passed:!!passed});
  let state=clone(fixture.state);
  if(action.id==='confirmAssertion') {
    check('候选尚未正式确认',state.lifecycleStatus==='CANDIDATE');
    check('存在非 LLM 依据或可追溯人工决定',state.hasNonLlmEvidence);
    check('语义冲突已解决',state.conflictResolved);
    check('目标结构版本仍有效',state.targetVersionCurrent);
    if(checks.every(c=>c.passed))state.lifecycleStatus='CONFIRMED';
  } else if(action.id==='startMetadataScan') {
    check('连接器支持扫描',state.connectorSupportsScan);check('数据源已启用',state.sourceActive);
    if(checks.every(c=>c.passed))state.simulatedRunStatus='QUEUED';
  } else if(action.id==='createDataSource') {
    check('连接验证有效',state.verified);check('用户明确确认',state.explicitConfirmation);
    if(checks.every(c=>c.passed)){state.simulatedDataSourceStatus='ACTIVE';state.scanStarted=false;}
  } else return {decision:'NOT_IMPLEMENTED',checks,expectedEffects:action.sideEffects,realExecution:false,modelChanged:false,simulatedAfterState:null};
  const ok=checks.every(c=>c.passed);
  return {decision:ok?'ALLOW':'DENY',checks,expectedEffects:ok?action.sideEffects:[],realExecution:false,modelChanged:false,simulatedAfterState:ok?state:null};
}
