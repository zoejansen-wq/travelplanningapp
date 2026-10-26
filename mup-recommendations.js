/* Dayfolk MUP: explainable, bounded, private-session recommendation ranking. */
(function(root) {
  'use strict';
  const VERSION = '1.0.0';
  const CATEGORIES = ['walk','nature','beach','water','food','nightlife','shopping','wellness','culture'];
  const clamp = (n,lo,hi) => Math.max(lo, Math.min(hi,n));
  function hash(value) {
    let h=2166136261;
    for(const c of String(value)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}
    return h>>>0;
  }
  function random(seed,key) {
    let x=hash(String(seed)+'|'+String(key));
    x+=0x6D2B79F5;x=Math.imul(x^(x>>>15),x|1);
    x^=x+Math.imul(x^(x>>>7),x|61);
    return ((x^(x>>>14))>>>0)/4294967296;
  }
  function features(item) {
    const text=(item.reason||'').toLowerCase();
    const tags=[];
    if(/free|budget|price|expensive|value/.test(text))tags.push('budget');
    if(/self.guided|without a guide|own pace|guide/.test(text))tags.push('self_guided');
    if(/local|touristy|quiet|crowd/.test(text))tags.push('local');
    if(/short|duration|long|time/.test(text))tags.push('duration');
    return tags;
  }
  function model(votes) {
    const category={};const attributes={};const counts={like:0,dislike:0,save:0};
    for(const vote of votes||[]) {
      if(!vote || !CATEGORIES.includes(vote.category) || !['like','dislike','save'].includes(vote.kind))continue;
      const direction=vote.kind==='dislike'?-1:vote.kind==='like'?1:.35;
      category[vote.category]=clamp((category[vote.category]||0)+direction,-3,3);
      for(const tag of features(vote)) attributes[tag]=clamp((attributes[tag]||0)+direction*.5,-2,2);
      counts[vote.kind]++;
    }
    return {version:VERSION,category,attributes,counts};
  }
  function score(item,preferences,seed) {
    const c=preferences.category[item.kind]||0;
    let match=0;
    const tags=preferences.attributes;
    if(item.cost===0)match+=(tags.budget||0)*.5;
    if(item.guidance==='self_guided')match+=(tags.self_guided||0)*.5;
    if(item.localSignal===true)match+=(tags.local||0)*.5;
    const stable=clamp(.3*c+.25*match,-1.25,1.25);
    return stable+(random(seed,item.id)-.5)*1.5;
  }
  function rank(items,votes,seed) {
    const prefs=model(votes);
    const seen=new Set();
    const list=[];
    for(const item of items||[]) {
      if(!item||!item.id||!CATEGORIES.includes(item.kind)||seen.has(item.id))continue;
      seen.add(item.id);
      list.push({...item,rankScore:score(item,prefs,seed)});
    }
    list.sort((a,b)=>b.rankScore-a.rankScore || String(a.id).localeCompare(String(b.id)));
    // Diversify the first screen: one per category before repeating any.
    const fresh=[],repeat=[],used=new Set();
    for(const item of list) {
      if(!used.has(item.kind)){fresh.push(item);used.add(item.kind);}
      else repeat.push(item);
    }
    return fresh.concat(repeat).map(x=>x.id);
  }
  function activityVotes(feedback,cards) {
    const lookup=new Map(cards.map(c=>[c.id,c]));
    return [...feedback].map(([id,value])=>({id,kind:value.kind,reason:value.reason,
      category:lookup.get(id)?.kind})).filter(x=>x.category);
  }
  root.DayfolkMUP=Object.freeze({VERSION,CATEGORIES,hash,random,features,model,rank,activityVotes});
})(typeof window!=='undefined'?window:globalThis);
