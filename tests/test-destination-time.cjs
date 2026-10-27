#!/usr/bin/env node
const assert=require('node:assert/strict');
const {scenes,regionOf,localHour,timeBand}=require('../destination-stage.js');
assert.deepEqual(Object.keys(scenes).sort(),['ibiza','lisbon','nyc','sint_maarten']);
for(const [region,scene] of Object.entries(scenes)){
 assert.ok(scene.tz,'Missing timezone '+region);
 assert.deepEqual(Object.keys(scene.photos).sort(),['golden','midday','morning','night']);
 for(const [band,photo] of Object.entries(scene.photos)){
   for(const field of ['filename','creator','license','licenseUrl','page'])assert.ok(photo[field],region+'/'+band+' lacks '+field);
   assert.ok(photo.licenseUrl.startsWith('https://'));
   assert.ok(photo.page.startsWith('https://commons.wikimedia.org/wiki/File:'));
 }
}
assert.equal(regionOf('New York City'),'nyc');
assert.equal(regionOf('Saint-Martin'),'sint_maarten');
assert.equal(regionOf('Lisboa'),'lisbon');
assert.equal(regionOf('Ibiza Town'),'ibiza');
for(const [h,band] of [[0,'night'],[4,'night'],[5,'morning'],[9,'morning'],[10,'midday'],[16,'midday'],[17,'golden'],[19,'golden'],[20,'night'],[23,'night']])assert.equal(timeBand(h),band);
const oct=new Date('2026-10-27T18:00:00Z');
assert.equal(localHour(oct,scenes.lisbon.tz),18);
assert.equal(localHour(oct,scenes.ibiza.tz),19);
assert.equal(localHour(oct,scenes.nyc.tz),14);
assert.equal(localHour(oct,scenes.sint_maarten.tz),14);
const summer=new Date('2026-07-10T18:00:00Z');
assert.equal(localHour(summer,scenes.lisbon.tz),19);
assert.equal(localHour(summer,scenes.ibiza.tz),20);
assert.equal(timeBand(localHour(summer,scenes.ibiza.tz)),'night');
console.log('Time-of-day destination atmosphere checks passed: 4 regions x 4 licensed scene records');
