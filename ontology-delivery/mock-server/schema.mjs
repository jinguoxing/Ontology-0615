/** Restricted schema checker for the bundled Mock contract only.
 * Not a general JSON Schema implementation. Production MUST use its normal
 * schema validator. The contract is also validated with Python jsonschema in tests.
 */
export function makeValidator(root) {
  function check(schema, value, path = '$', depth = 0) {
    if (depth > 100) return [{path, message:'JSON nesting exceeds 100'}];
    if (schema.$ref) return check(root.$defs[schema.$ref.split('/').at(-1)],value,path,depth+1);
    for (const key of ['oneOf','anyOf']) {
      if (schema[key]) {
        const results=schema[key].map(x=>check(x,value,path,depth+1));
        const count=results.filter(x=>x.length===0).length;
        if ((key==='oneOf' && count!==1)||(key==='anyOf' && count===0))
          return [{path,message:`${key} mismatch`},...results.sort((a,b)=>a.length-b.length)[0].slice(0,5)];
        return [];
      }
    }
    const errors=[]; const add=message=>errors.push({path,message});
    if ('const' in schema && value!==schema.const) add('const mismatch');
    if (schema.enum && !schema.enum.includes(value)) add('enum mismatch');
    const t=schema.type;
    if (t==='null') {if(value!==null)add('expected null');return errors;}
    if(t==='object') {
      if(!value||typeof value!=='object'||Array.isArray(value)){add('expected object');return errors;}
      const props=schema.properties||{};
      for(const k of schema.required||[]) if(!Object.hasOwn(value,k))errors.push({path:path+'.'+k,message:'required'});
      for(const [k,v] of Object.entries(value)) {
        if(['__proto__','prototype','constructor'].includes(k)){errors.push({path:path+'.'+k,message:'reserved key'});continue;}
        if(props[k]) errors.push(...check(props[k],v,path+'.'+k,depth+1));
        else if(schema.additionalProperties===false) errors.push({path:path+'.'+k,message:'unknown property'});
      }
    } else if(t==='array') {
      if(!Array.isArray(value)){add('expected array');return errors;}
      if(schema.minItems!==undefined && value.length<schema.minItems)add('too few items');
      if(schema.maxItems!==undefined && value.length>schema.maxItems)add('too many items');
      value.forEach((v,i)=>errors.push(...check(schema.items||{},v,`${path}[${i}]`,depth+1)));
    } else if(t==='string') {
      if(typeof value!=='string'){add('expected string');return errors;}
      if(schema.minLength!==undefined && value.length<schema.minLength)add('too short');
      if(schema.maxLength!==undefined && value.length>schema.maxLength)add('too long');
      if(schema.pattern && !new RegExp(schema.pattern).test(value))add('pattern mismatch');
      if(schema.format==='date-time' && (!/^\d{4}-\d\d-\d\dT/.test(value)||!Number.isFinite(Date.parse(value))))add('invalid date-time');
    } else if(t==='number'||t==='integer') {
      if(typeof value!=='number'||!Number.isFinite(value)||(t==='integer'&&!Number.isInteger(value)))add(`expected ${t}`);
      if(schema.minimum!==undefined && value<schema.minimum)add('below minimum');
      if(schema.maximum!==undefined && value>schema.maximum)add('above maximum');
    } else if(t==='boolean' && typeof value!=='boolean')add('expected boolean');
    return errors;
  }
  return (name, value)=>check(root.$defs[name],value);
}
