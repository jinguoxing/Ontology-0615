#!/usr/bin/env python3
"""Offline structural + JSON Schema audit. NOT a full OpenAPI certification.
Requires jsonschema and PyYAML. The Mock itself remains dependency-free.
"""
import json,re
from pathlib import Path
from urllib.parse import urlsplit
import yaml
from jsonschema import Draft202012Validator,FormatChecker
P=Path(__file__).resolve().parents[1]
load=lambda name:json.loads((P/name).read_text())
root=load('contracts/model.schema.json'); api=load('contracts/openapi.json')
routes=load('contracts/routes.json'); io=load('contracts/operation-io.schema.json')
seed=load('seed/data-governance-model.json');registry=load('seed/registry.json')
fixtures=load('seed/action-fixtures.json');exchanges=load('tests/http-exchanges.json')
assert yaml.safe_load((P/'contracts/openapi.yaml').read_text())==api
Draft202012Validator.check_schema(root)
Draft202012Validator.check_schema(io)
for schema in root['$defs'].values(): Draft202012Validator.check_schema(schema)
for schema in io['$defs'].values(): Draft202012Validator.check_schema(schema)
def check_definition(name,value):
 Draft202012Validator({**root,'$ref':'#/$defs/'+name},format_checker=FormatChecker()).validate(value)
check_definition('ModelDocument',seed);check_definition('Registry',registry)
for fixture in fixtures:check_definition('ActionFixture',fixture)
# All local JSON references in OpenAPI must resolve, without downloading anything.
ref_count=0
def refs(value):
 global ref_count
 if isinstance(value,dict):
  for k,v in value.items():
   if k=='$ref':
    assert v.startswith('#/'),f'External ref not audited: {v}'
    x=api
    for key in v[2:].split('/'):x=x[key.replace('~1','/').replace('~0','~')]
    ref_count+=1
   else:refs(v)
 elif isinstance(value,list):
  for item in value:refs(item)
refs(api)
seen=set(); compiled=[]
for r in routes:
 assert r['operationId'] not in seen;seen.add(r['operationId'])
 op=api['paths'][r['path']][r['method'].lower()]
 assert op['operationId']==r['operationId']
 expected=set(re.findall(r'{(\w+)}',r['path']))
 actual={p['name'] for p in op.get('parameters',[]) if p['in']=='path' and p.get('required')}
 assert expected==actual
 pattern='^'+re.escape(r['path'])+'$'
 pattern=re.sub(r'\\\{\w+\\\}',r'[^/]+',pattern)
 compiled.append((r,re.compile(pattern)))
# This independently verifies real recorded responses; it does not trust our
# deliberately limited reference-server request validator.
covered=set(); counts={};schema_checks=0;request_checks=0
validators={}
for e in exchanges:
 pathname=urlsplit(e['url']).path
 matches=[r for r,rx in compiled if r['method']==e['method'] and rx.fullmatch(pathname)]
 assert len(matches)==1,(e['method'],pathname,matches)
 r=matches[0];op=api['paths'][r['path']][r['method'].lower()];covered.add(r['operationId'])
 status=str(e['status']);counts[status]=counts.get(status,0)+1
 assert status in op['responses'],(r['operationId'],status)
 response_schema=op['responses'][status]['content']['application/json']['schema']
 key=(r['operationId'],status)
 if key not in validators:
  validators[key]=Draft202012Validator({'components':api['components'],**response_schema},format_checker=FormatChecker())
 validators[key].validate(e['response']);schema_checks+=1
 if e['status']<300 and r['requestSchema']:
  check_definition(r['requestSchema'],e['request']);request_checks+=1
# Every declared action and function IO reference resolves to the same schema
# that the Registry returns to the UI.
iomap={x['id']:x['schema'] for x in registry['ioContracts']}
assert len(iomap)==len(registry['ioContracts'])
assert iomap==io['$defs']
for action in seed['actions']:
 assert action['inputContractRef'] in iomap
 assert action['outputContractRef'] in iomap
for impl in registry['implementations']:
 assert impl['inputContractRef'] in iomap and impl['outputContractRef'] in iomap
result={
 'result':'PASS','scope':'离线结构、引用与实际HTTP交换的JSON Schema校验；不是完整OpenAPI规范认证',
 'modelSchemas':len(root['$defs']),'operationIOSchemas':len(io['$defs']),
 'operationsDefined':len(routes),'operationsExercised':len(covered),
 'unexercisedOperations':sorted(seen-covered),'openapiInternalReferencesChecked':ref_count,
 'httpResponsesValidated':schema_checks,'successfulRequestBodiesValidated':request_checks,
 'responseStatuses':counts,
 'seedCounts':{k:len(v) for k,v in seed.items()},
 'notValidated':['原仓库九页React UI接入','原仓库整体构建','实际生产服务与真实数据扫描','所有JSON Schema关键词的一致性实现']}
(P/'tests/contract-audit.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(result,ensure_ascii=False,indent=2))
