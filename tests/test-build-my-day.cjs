#!/usr/bin/env node
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
const app=scripts.map(m=>m[1]).find(s=>s.includes('function startPlanning()'));
assert.ok(app,'Setup click handler not found');
assert.match(app,/getElementById\("startPlanning"\)\.addEventListener\("click", startPlanning\)/,'Build my day is not wired');
assert.match(html,/id="startPlanning"/,'Build my day button is missing');
assert.match(html,/id="contextLocation"/,'Destination context element missing');
assert.ok(!app.includes('document.querySelector("#daily-context span:first-child")'),
  'Fragile positional selector would crash when budget moves ahead of location');
assert.match(app,/getElementById\("contextLocation"\)\.textContent\s*=\s*destination/,'Set destination by ID');
assert.match(app,/getElementById\("setupScreen"\)\.hidden\s*=\s*true/,'Setup never hides');
assert.match(app,/getElementById\("appShell"\)\.hidden\s*=\s*false/,'Planner never appears');
assert.match(app,/groupAges:selectedValue\("partyType"\) === "group" && minAge && maxAge/,'Group logging references must be safe');
new Function(app);
console.log('Build my day handler regression checks passed');
