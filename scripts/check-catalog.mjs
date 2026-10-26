#!/usr/bin/env node
// Read-only CI verification for the public Dayfolk snapshot.
// Source records are candidates, never inferred to be open from snapshot timestamps.
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const data=JSON.parse(readFileSync('collections.json','utf8'));
const html=readFileSync('index.html','utf8');
const match=html.match(/<script type="application\/json" id="pipelineCatalog">([\s\S]*?)<\/script>/);
assert.ok(match,'Missing embedded collections JSON');
assert.deepEqual(JSON.parse(match[1]),data,'Embedded and downloadable collections differ');
assert.deepEqual(Object.keys(data.regions).sort(),['ibiza','lisbon','nyc','sint_maarten']);
assert.match(html,/card\.dataset\.photoApproved==='true'/,'Photo publication gate missing');
assert.match(html,/card\.dataset\.status!==\"review_required\"/,'Editorial quarantine missing');
let total=0, eligible=0, noPhoto=0, errors=[], warnings=[];
for(const [region,set] of Object.entries(data.regions)){
 const ids=new Set(),names=new Map(),bbox=set.region.bbox;
 for(const a of set.activities){
  total++;
  for(const key of ['id','title','kind','regionId','sourceUrl','sourceLabel','checkedAt']){
    if(!a[key])errors.push(region+': '+(a.title||a.id)+' missing '+key);
  }
  if(a.regionId!==region)errors.push(region+': mismatched region for '+a.title);
  if(!Number.isFinite(a.lat)||!Number.isFinite(a.lon)||Math.abs(a.lat)>90||Math.abs(a.lon)>180)errors.push(region+': invalid coords for '+a.title);
  if(ids.has(a.id))errors.push(region+': duplicate id '+a.id);ids.add(a.id);
  if(bbox && (a.lat<bbox[0]||a.lat>bbox[2]||a.lon<bbox[1]||a.lon>bbox[3]))warnings.push(region+': bbox review '+a.title);
  const normalized=a.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
  if(names.has(normalized))warnings.push(region+': same-name candidate '+a.title);names.set(normalized,true);
  if(a.photo){
    const p=a.photo;
    if(!p.url||!p.credit||!p.license||!p.sourceUrl)errors.push(region+': incomplete photo metadata for '+a.title);
    if(p.url&&!p.url.startsWith('https://'))errors.push(region+': non HTTPS image for '+a.title);
    if(p.licenseUrl && !p.licenseUrl.startsWith('https://'))errors.push(region+': invalid license link '+a.title);
  }
  const publishable=Boolean(a.photo?.url&&a.photo?.credit&&a.photo?.license&&a.photo?.sourceUrl&&a.photo?.licenseUrl&&a.status!=='review_required');
  if(publishable)eligible++;else noPhoto++;
 }
}
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}
console.log(JSON.stringify({total,photoEligible:eligible,notPhotoEligible:noPhoto,warnings,errors},null,2));
