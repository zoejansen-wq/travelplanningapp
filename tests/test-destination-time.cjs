#!/usr/bin/env node
const assert=require('node:assert/strict');
const {scenes,regionOf,localHour,timeBand}=require('../destination-stage.js');
assert.deepEqual(Object.keys(scenes).sort(),['ibiza','lisbon','nyc','sint_maarten']);
for(const [hour,band] of [[0,'night'],[4,'night'],[5,'morning'],[10,'morning'],[11,'midday'],[17,'midday'],[18,'night'],[23,'night']])assert.equal(timeBand(hour),band);
const at=new Date('2026-10-27T12:00:00Z');
for(const [zone,hour] of [['Europe/Madrid',13],['Europe/Lisbon',12],['America/New_York',8],['America/Lower_Princes',8]])assert.equal(localHour(at,zone),hour,zone);
for(const [region,scene] of Object.entries(scenes)){
 assert.ok(scene.tz,'Missing timezone '+region);
 assert.deepEqual(Object.keys(scene.photos).sort(),['midday','morning','night']);
 const names=new Set();
 for(const [band,p] of Object.entries(scene.photos)){
  for(const k of ['filename','creator','license','licenseUrl','page'])assert.ok(p[k],region+' '+band+' missing '+k);
  assert.ok(p.page.startsWith('https://commons.wikimedia.org/wiki/File:'));
  assert.ok(p.licenseUrl.startsWith('https://'));
  names.add(p.filename);
 }
 assert.equal(names.size,3,region+' should have three distinct period images');
}
assert.equal(regionOf('New York City'),'nyc');
assert.equal(regionOf('Sint Maarten'),'sint_maarten');
console.log('Passed: four destination clocks, twelve photo sources, eight hour boundaries');
