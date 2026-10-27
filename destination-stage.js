/* Dayfolk destination atmosphere.
   Photographs are licensed archive images, not real-time conditions.
   A scene is selected once per destination selection using the destination's local clock. */
(() => {
 'use strict';
 const L={by2:'https://creativecommons.org/licenses/by/2.0/',by3:'https://creativecommons.org/licenses/by/3.0/',by4:'https://creativecommons.org/licenses/by/4.0/',sa2:'https://creativecommons.org/licenses/by-sa/2.0/',sa3:'https://creativecommons.org/licenses/by-sa/3.0/',sa4:'https://creativecommons.org/licenses/by-sa/4.0/',cc0:'https://creativecommons.org/publicdomain/zero/1.0/'};
 const img=(filename,creator,license,licenseUrl,focal='center')=>({filename,creator,license,licenseUrl,page:'https://commons.wikimedia.org/wiki/File:'+encodeURIComponent(filename).replaceAll('%20','_'),focal});
 const scenes={
  ibiza:{name:'Ibiza',tz:'Europe/Madrid',photos:{
   morning:img('Sunrise Ibiza.JPG','Juliahoffmann27','CC BY-SA 3.0',L.sa3,'center 49%'),
   midday:img('Ibiza City Dalt Vila from seaport asv2023-04.jpg','A.Savin, Wikipedia','Free Art License','https://artlibre.org/licence/lal/en/','center 48%'),
   golden:img('Ibiza-Sunset.jpg','acediscovery','CC BY 4.0',L.by4,'center 48%'),
   night:img('Ibiza night.JPG','Vwpolonia75','CC BY-SA 3.0',L.sa3,'center 52%')
  }},
  lisbon:{name:'Lisbon',tz:'Europe/Lisbon',photos:{
   morning:img('Early morning in Lisbon (34983167855).jpg','Susanne Nilsson','CC BY-SA 2.0',L.sa2,'center 45%'),
   midday:img('The rooftops of Lisbon.jpg','Bert K.','CC BY 2.0',L.by2,'center 52%'),
   golden:img('Lisbon sunset.jpg','Eurico Craveiro','CC BY-SA 4.0',L.sa4,'center 49%'),
   night:img('Lisbon (Alfama Graça) photographed by night (27542313670).jpg','Pedro Ribeiro Simões','CC BY 2.0',L.by2,'center 52%')
  }},
  sint_maarten:{name:'Sint Maarten / Saint-Martin',tz:'America/Lower_Princes',photos:{
   morning:img('Sunrise over Simpson Bay, St Maarten, Oct 2014 (15571250198).jpg','alljengi','CC BY-SA 2.0',L.sa2,'center 55%'),
   midday:img('St. Maarten Philipsburg Great Bay Beach.jpg','Dr. Thomas Liptak','CC BY-SA 4.0',L.sa4,'center 54%'),
   golden:img('Sunset on Maho Beach, St Maarten, Oct 2014 (15732989042).jpg','alljengi','CC BY-SA 2.0',L.sa2,'center 55%'),
   night:img('On The Night Shift - Flickr - A Guy Named Nyal.jpg','A Guy Named Nyal','CC BY 2.0',L.by2,'center 50%')
  }},
  nyc:{name:'New York City',tz:'America/New_York',photos:{
   morning:img('Sunrise over Manhattan, New York (49270363953).jpg','Pierre Blaché','CC0 1.0',L.cc0,'center 52%'),
   midday:img('Midtown Manhattan Skyline 2026 095.jpg','Kidfly182','CC BY 4.0',L.by4,'center 55%'),
   golden:img('New york city sunset.jpg','Jpaul10','CC BY 3.0',L.by3,'center 53%'),
   night:img('New York City Skyline at night.jpg','Jerry Steinfield','CC BY-SA 4.0',L.sa4,'center 49%')
  }}
 };
 function regionOf(value){
  const s=String(value||'').toLowerCase();
  if(/ibiza|eivissa/.test(s))return 'ibiza';
  if(/lisbon|lisboa/.test(s))return 'lisbon';
  if(/maarten|saint.martin|st. martin/.test(s))return 'sint_maarten';
  if(/new york|nyc/.test(s))return 'nyc';
  return null;
 }
 function localHour(date,tz){
  const hour=new Intl.DateTimeFormat('en-GB',{timeZone:tz,hour:'2-digit',hourCycle:'h23'}).formatToParts(date).find(p=>p.type==='hour');
  return Number(hour.value);
 }
 function timeBand(hour){
  // Editorial bands, NOT astronomy-derived sunset times. Four distinct photographed moods.
  if(hour>=5&&hour<10)return 'morning';
  if(hour>=10&&hour<17)return 'midday';
  if(hour>=17&&hour<20)return 'golden';
  return 'night';
 }
 function imageURL(file){return 'https://commons.wikimedia.org/wiki/Special:FilePath/'+encodeURIComponent(file)+'?width=1920'}
 function initialize(){
  const select=document.getElementById('destinationInput'),app=document.getElementById('appShell'),
   credit=document.getElementById('destinationImageCredit');
  if(!select||!app||!credit)return;
  let request=0,active='';
  function activate(force=false){
   if(app.hidden)return;
   const region=regionOf(select.value);if(!region)return;
   if(!force&&region===active)return;
   active=region;
   const scene=scenes[region], band=timeBand(localHour(new Date(),scene.tz));
   const photo=scene.photos[band],fallback=scene.photos.midday,ticket=++request;
   const copy=(item,actualBand)=>{
    credit.replaceChildren();
    const original=document.createElement('a');
    original.href=item.page;original.target='_blank';original.rel='noopener noreferrer';
    original.textContent=scene.name+' · '+actualBand+' scene · '+item.creator;
    const rights=document.createElement('a');
    rights.href=item.licenseUrl;rights.target='_blank';rights.rel='noopener noreferrer';
    rights.textContent=item.license;
    credit.append(original,document.createTextNode(' · '),rights);
    document.body.dataset.photoTime=actualBand;
   };
   function apply(item,actualBand){
    if(ticket!==request)return;
    document.body.style.setProperty('--destination-photo','url("'+imageURL(item.filename)+'")');
    document.body.style.setProperty('--destination-focal',item.focal);
    copy(item,actualBand);
   }
   function load(item,actualBand,onFailure){
    const preview=new Image();preview.decoding='async';
    preview.onload=()=>apply(item,actualBand);
    preview.onerror=()=>{if(ticket===request&&onFailure)onFailure();};
    preview.src=imageURL(item.filename);
   }
   document.body.dataset.destination=region;
   document.body.classList.add('destination-active');
   document.body.style.removeProperty('--destination-photo');
   copy(photo,band);
   load(photo,band,()=>{if(photo.filename!==fallback.filename)load(fallback,'midday',()=>{document.body.style.removeProperty('--destination-photo');copy(photo,band);});});
  }
  select.addEventListener('change',()=>activate(true));
  const observer=new MutationObserver(()=>{if(!app.hidden)activate();else active='';});
  observer.observe(app,{attributes:true,attributeFilter:['hidden']});
  if(!app.hidden)activate();
 }
 // Pure helpers exposed only for isolated regression tests.
 const exported={scenes,regionOf,localHour,timeBand};
 if(typeof module!=='undefined'&&module.exports)module.exports=exported;
 if(typeof document==='undefined')return;
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});
 else initialize();
})();