#!/usr/bin/env node
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('destination-glass.css','utf8');
const stage=fs.readFileSync('destination-stage.js','utf8');
const credits=fs.readFileSync('credits.html','utf8');
for(const file of ['destination-glass.css','destination-stage.js','golden-city.css'])
 assert.ok(html.includes(file),'Missing design asset '+file);
for(const city of ['ibiza','lisbon','sint_maarten','nyc'])assert.match(stage,new RegExp(city+':\\s*\\{'),'Missing destination '+city);
assert.match(stage,/new Image\(\)/,'Missing image preload / fallback');
assert.match(stage,/preview\.onerror/,'Destination images require a graceful failure state');
assert.match(css,/prefers-reduced-transparency:reduce/,'Reduced transparency preference must be supported');
assert.match(css,/prefers-reduced-motion:reduce/,'Reduced motion preference must be supported');
assert.match(css,/backdrop-filter/,'Glass treatment must have a fallback');
assert.match(css,/destination-active::before/,'Missing full viewport image layer');
assert.ok(credits.includes('Destination backgrounds'),'Photograph provenance missing');
assert.ok(credits.includes('Time-of-day destination photography'),'Time-band credits missing');
for(const removed of ['Surprise me','finishDay','dayProgress','progressValue','plan-complete','item.done','aria-label="Your profile"'])
 assert.ok(!html.includes(removed),'Unproven feature returned: '+removed);
assert.match(html,/id="destinationImageCredit"/,'Photo credit must be visible');
assert.match(html,/textContent = destination/,'Hero must reflect selected destination');
assert.ok(!html.includes('other.style.order = "-1"'),'Old permanent sort must remain removed');
assert.match(html,/id="planPartsProgress"/,'Planner progress must represent real scheduled slots');
assert.ok(html.includes('id="heroChangeDestination"'),'Missing change destination control');
assert.equal((html.match(/id="calendarPrev"/g)||[]).length,1);
assert.equal((html.match(/id="calendarNext"/g)||[]).length,1);
console.log('Destination-first purposeful UI checks passed');
