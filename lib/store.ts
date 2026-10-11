import fs from'node:fs';import path from'node:path';import{Business,seed}from'./core';
const file=process.env.MUNSHI_DATA_FILE||path.join(process.cwd(),'data','businesses.json');
let cache:Business[]|null=null;
export function loadBusinesses():Business[]{if(cache)return cache;try{const parsed=JSON.parse(fs.readFileSync(file,'utf8'));if(Array.isArray(parsed)&&parsed.every(x=>x&&typeof x.id==='string'))return cache=parsed}catch{}return cache=seed()}
export function saveBusinesses(businesses:Business[]){fs.mkdirSync(path.dirname(file),{recursive:true});const temp=`${file}.${process.pid}.tmp`;fs.writeFileSync(temp,JSON.stringify(businesses));fs.renameSync(temp,file);cache=businesses}
export function resetBusinesses(){const businesses=seed();saveBusinesses(businesses);return businesses}
