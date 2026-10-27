#!/usr/bin/env node
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const h=fs.readFileSync('index.html','utf8'),css=fs.readFileSync('golden-city.css','utf8');
for(const id of ['discover','plan','saved','calendarPrev','calendarNext','calendarScreen','ideasList','openQuickAdd','reviewPlan','heroChangeDestination','budgetGuide','destinationImageCredit','plannerPartProgress'])
 assert.equal((h.match(new RegExp('id="'+id+'"','g'))||[]).length,1,'Missing/duplicate ID '+id);
for(const needle of ['golden-city.css','class="destination-hero"','class="planner-view-tools"','Add your own idea','class="hero-provenance"'])
 assert.ok(h.includes(needle),'Missing '+needle);
assert.ok(h.includes('quiet-feedback'));
for(const needle of ['--space-m:34px','1.618fr','rgba(255,248,238,.96)','@media(max-width:767px)','prefers-reduced-motion'])
 assert.ok(css.includes(needle),'Missing CSS '+needle);
assert.ok(!h.includes('Surprise me'));
for(const script of h.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)){
 if(script[1].includes('application/json'))JSON.parse(script[2]);
 else if(script[2].trim())new vm.Script(script[2]);
}
console.log('Passed: golden city structure, preserved hooks and executable script syntax');
