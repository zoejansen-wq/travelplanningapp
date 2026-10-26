#!/usr/bin/env node
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const catalog=JSON.parse(readFileSync('collections.json','utf8'));
const evidence=JSON.parse(readFileSync('local-activity-evidence.json','utf8'));
const normalize=s=>String(s).normalize('NFKD').toLowerCase().replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const matches=[];
for(const e of evidence.items){
 assert.ok(catalog.regions[e.region], 'Unknown region '+e.region);
 assert.ok(e.source_url.startsWith('https://'));
 const found=catalog.regions[e.region].activities.filter(a=>normalize(a.title)===normalize(e.place_title));
 assert.equal(found.length,1,'No unique venue match: '+e.region+' '+e.place_title);
 matches.push({region:e.region,place_id:found[0].id,place_title:found[0].title,relationship:e.relationship,
 evidence_url:e.source_url,verified_at:e.verified_at,valid_from:e.valid_from,valid_to:e.valid_to,
 claim:e.claim,publishable:false,reason:'Schedule, source terms, licensed photo and current item validity require review'});
}
console.log(JSON.stringify({matched:matches.length,links:matches},null,2));
