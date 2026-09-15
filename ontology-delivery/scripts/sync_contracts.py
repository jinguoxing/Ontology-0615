#!/usr/bin/env python3
"""Regenerate OpenAPI and TS from the checked-in Schema and route table.
Optional developer command: python scripts/sync_contracts.py
Requires PyYAML; not required to run the Node Mock service.
"""
from pathlib import Path
import json,re,yaml
P=Path(__file__).resolve().parents[1]
Defs=json.loads((P/'contracts/model.schema.json').read_text())['$defs']
routes=json.loads((P/'contracts/routes.json').read_text())
def s(**kw): return {'type':'string',**kw}
def integer(minimum=0,**kw): return {'type':'integer','minimum':minimum,**kw}
def ob(props,required=None): return {'type':'object','properties':props,'required':list(props) if required is None else required,'additionalProperties':False}
code={'type':'string','minLength':1,'maxLength':128,'pattern':'^[A-Za-z0-9][A-Za-z0-9_.:-]*$'}
def deref_text(o):
 return json.loads(json.dumps(o).replace('#/$defs/','#/components/schemas/'))
api=dict(openapi='3.1.0',info={'title':'Semovix Ontology Management API','version':'1.0.0','description':'新定义的页面 HTTP 合同；Mock 服务实现模型管理状态流，不声称连接 Semovix 生产服务。'},servers=[{'url':'http://127.0.0.1:4310','description':'本地契约 Mock（非生产地址）'}],security=[{'bearerAuth':[]}],paths={},components={'securitySchemes':{'bearerAuth':{'type':'http','scheme':'bearer','description':'Mock: demo-maintainer 或 demo-viewer。生产接入现有身份服务，禁止使用这些演示 Token。'}},'schemas':deref_text(Defs)})
errcodes={400:'请求不合法',401:'缺少或错误身份',403:'无操作权限',404:'资源不在当前范围或不存在',409:'幂等冲突/基线变化/发布条件不成立',412:'If-Match 修订不匹配',413:'请求体过大',415:'请求媒体类型错误',422:'请求 Schema 不符合合同',428:'缺少 If-Match 前置条件',500:'内部错误'}
for r in routes:
 params=[]
 for key in re.findall(r'{(\w+)}',r['path']): params.append(dict(name=key,**{'in':'path'},required=True,schema=code))
 if r['operationId']!='health': params.append(dict(name='X-Workspace-Id',**{'in':'header'},required=True,schema={'type':'string','minLength':1},description='工作空间标识；服务端验证身份授权。Mock 仅提供 ws-demo 与 ws-isolation。'))
 if r['cas']:params.append(dict(name='If-Match',**{'in':'header'},required=True,schema=s(),description='当前变更集强 ETag，例如 "cs-drkn-demo:r12"。不接受 *。'))
 if r['idempotency']:params.append(dict(name='Idempotency-Key',**{'in':'header'},required=True,schema=s(minLength=1,maxLength=128)))
 if r['view']:
  for key,sch in [('versionId',s()),('changeSetId',s()),('revision',integer())]:params.append(dict(name=key,**{'in':'query'},required=False,schema=sch))
 if r['operationId']=='getDiff':params.append(dict(name='revision',**{'in':'query'},required=True,schema=integer()))
 if r['list']:
  for key,sch in [('q',s()),('offset',integer()),('limit',integer(1,maximum=200))]:params.append(dict(name=key,**{'in':'query'},required=False,schema=sch))
 opname=r['operationId']; respname=opname+'Response'
 api['components']['schemas'][respname]=ob({'data':{'$ref':'#/components/schemas/'+r['responseSchema']},'meta':{'$ref':'#/components/schemas/ApiMeta'}})
 op={'operationId':opname,'summary':opname,'parameters':params,'responses':{str(r['status']):{'description':'成功；Mock 数据会带 meta.dataMode=MOCK','content':{'application/json':{'schema':{'$ref':'#/components/schemas/'+respname}}},'headers':{'ETag':{'schema':s(),'description':'ChangeSet 响应返回强 ETag'},'Location':{'schema':s(),'description':'异步任务轮询位置'},'Retry-After':{'schema':s(),'description':'异步任务建议轮询秒数'}}}}}
 if r['view']:op['description']='versionId 与 changeSetId 二选一；指定 changeSetId 时 revision 必填。返回精确快照；不隐式读 latest。'
 if r['requestSchema']:op['requestBody']={'required':True,'content':{'application/json':{'schema':{'$ref':'#/components/schemas/'+r['requestSchema']}}}}
 for ec,desc in errcodes.items():op['responses'][str(ec)]={'description':desc,'content':{'application/json':{'schema':{'$ref':'#/components/schemas/ErrorResponse'}}}}
 if opname=='health':op['security']=[]
 api['paths'].setdefault(r['path'],{})[r['method'].lower()]=op
(P/'contracts/openapi.yaml').write_text(yaml.safe_dump(api,allow_unicode=True,sort_keys=False))
(P/'contracts/openapi.json').write_text(json.dumps(api,ensure_ascii=False,indent=2)+'\n')
print('contracts',len(Defs),'schemas',len(routes),'operations')
# Generate portable TypeScript types; root schema remains source of truth.
def ts(x):
 if '$ref' in x:return x['$ref'].split('/')[-1]
 if 'const' in x:return json.dumps(x['const'])
 if 'enum' in x:return ' | '.join(json.dumps(v,ensure_ascii=False) for v in x['enum'])
 for union in ['oneOf','anyOf']:
  if union in x:return '('+' | '.join(ts(y) for y in x[union])+')'
 t=x.get('type')
 if t=='object':
  props=x.get('properties',{}); req=x.get('required',[])
  if not props:return 'Record<string, unknown>'
  return '{ '+ '; '.join(json.dumps(k)+('' if k in req else '?')+': '+ts(v) for k,v in props.items())+' }'
 if t=='array':return 'Array<'+ts(x['items'])+'>'
 return {'string':'string','boolean':'boolean','number':'number','integer':'number','null':'null'}.get(t,'unknown')
(P/'frontend/types.generated.ts').write_text('// Generated from contracts/model.schema.json. Regenerate instead of editing.\n'+ '\n'.join('export type '+k+' = '+ts(v)+';' for k,v in Defs.items())+'\nexport type Envelope<T> = {data: T; meta: ApiMeta};\n')
