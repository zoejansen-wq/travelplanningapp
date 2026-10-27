/* Destination photography is selected by destination-local clock at page opening.
   Scenes are attributed Wikimedia Commons originals, not live conditions. */
(() => {
  'use strict';
  const scenes={
  "ibiza": {
    "timezone": "Europe/Madrid",
    "morning": {
      "filename": "Sunrise Ibiza.JPG",
      "creator": "Juliahoffmann27",
      "licence": "CC BY-SA 3.0",
      "licenceUrl": "https://creativecommons.org/licenses/by-sa/3.0/",
      "page": "https://commons.wikimedia.org/wiki/File:Sunrise_Ibiza.JPG",
      "focal": "center 55%"
    },
    "midday": {
      "filename": "Ibiza City Dalt Vila from seaport asv2023-04.jpg",
      "creator": "A.Savin, Wikipedia",
      "licence": "Free Art License",
      "licenceUrl": "https://artlibre.org/licence/lal/en/",
      "page": "https://commons.wikimedia.org/wiki/File:Ibiza_City_Dalt_Vila_from_seaport_asv2023-04.jpg",
      "focal": "center 48%"
    },
    "night": {
      "filename": "Ibiza night.JPG",
      "creator": "Vwpolonia75 (Jens K. Müller)",
      "licence": "CC BY-SA 3.0",
      "licenceUrl": "https://creativecommons.org/licenses/by-sa/3.0/",
      "page": "https://commons.wikimedia.org/wiki/File:Ibiza_night.JPG",
      "focal": "center 55%"
    }
  },
  "lisbon": {
    "timezone": "Europe/Lisbon",
    "morning": {
      "filename": "Lisbon Sunrise (16910916059).jpg",
      "creator": "mhx (Marcus Holland-Moritz)",
      "licence": "CC BY-SA 2.0",
      "licenceUrl": "https://creativecommons.org/licenses/by-sa/2.0/",
      "page": "https://commons.wikimedia.org/wiki/File:Lisbon_Sunrise_(16910916059).jpg",
      "focal": "center 53%"
    },
    "midday": {
      "filename": "The rooftops of Lisbon.jpg",
      "creator": "Bert K.",
      "licence": "CC BY 2.0",
      "licenceUrl": "https://creativecommons.org/licenses/by/2.0/",
      "page": "https://commons.wikimedia.org/wiki/File:The_rooftops_of_Lisbon.jpg",
      "focal": "center 52%"
    },
    "night": {
      "filename": "Lisbon at night (24553104372).jpg",
      "creator": "Boris Dzhingarov",
      "licence": "CC BY 2.0",
      "licenceUrl": "https://creativecommons.org/licenses/by/2.0/",
      "page": "https://commons.wikimedia.org/wiki/File:Lisbon_at_night_(24553104372).jpg",
      "focal": "center 53%"
    }
  },
  "sint_maarten": {
    "timezone": "America/Lower_Princes",
    "morning": {
      "filename": "St. Maarten Philipsburg Great Bay Beach.jpg",
      "creator": "Dr. Thomas Liptak",
      "licence": "CC BY-SA 4.0",
      "licenceUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
      "page": "https://commons.wikimedia.org/wiki/File:St._Maarten_Philipsburg_Great_Bay_Beach.jpg",
      "focal": "center 54%"
    },
    "midday": {
      "filename": "St. Maarten Philipsburg Great Bay Beach.jpg",
      "creator": "Dr. Thomas Liptak",
      "licence": "CC BY-SA 4.0",
      "licenceUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
      "page": "https://commons.wikimedia.org/wiki/File:St._Maarten_Philipsburg_Great_Bay_Beach.jpg",
      "focal": "center 54%"
    },
    "night": {
      "filename": "Saint Martin at night in January 2012 - panoramio.jpg",
      "creator": "Michael A. Orlando",
      "licence": "CC BY-SA 3.0",
      "licenceUrl": "https://creativecommons.org/licenses/by-sa/3.0/",
      "page": "https://commons.wikimedia.org/wiki/File:Saint_Martin_at_night_in_January_2012_-_panoramio.jpg",
      "focal": "center 50%"
    }
  },
  "nyc": {
    "timezone": "America/New_York",
    "morning": {
      "filename": "Hudson River Panorama of Manhattan.jpg",
      "creator": "ChoiChoi4life",
      "licence": "CC BY-SA 4.0",
      "licenceUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
      "page": "https://commons.wikimedia.org/wiki/File:Hudson_River_Panorama_of_Manhattan.jpg",
      "focal": "center 47%"
    },
    "midday": {
      "filename": "Midtown Manhattan Skyline 2026 095.jpg",
      "creator": "Kidfly182",
      "licence": "CC BY 4.0",
      "licenceUrl": "https://creativecommons.org/licenses/by/4.0/",
      "page": "https://commons.wikimedia.org/wiki/File:Midtown_Manhattan_Skyline_2026_095.jpg",
      "focal": "center 55%"
    },
    "night": {
      "filename": "Manhattan Skyline night.jpg",
      "creator": "Kai Pilger",
      "licence": "CC BY-SA 4.0",
      "licenceUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
      "page": "https://commons.wikimedia.org/wiki/File:Manhattan_Skyline_night.jpg",
      "focal": "center 55%"
    }
  }
};
  const keyFor = value => {
    const text=(value||'').toLowerCase();
    if(/ibiza|eivissa/.test(text))return 'ibiza';
    if(/lisbon|lisboa/.test(text))return 'lisbon';
    if(/maarten|saint.martin|st. martin/.test(text))return 'sint_maarten';
    if(/new york|nyc/.test(text))return 'nyc';
    return null;
  };
  const slotForHour = hour => hour>=5&&hour<11?'morning':hour>=11&&hour<18?'midday':'night';
  function localHour(timezone,at=new Date()) {
    const parts = new Intl.DateTimeFormat('en-GB',{timeZone:timezone,hour:'2-digit',hourCycle:'h23'}).formatToParts(at);
    return Number(parts.find(p=>p.type==='hour').value)%24;
  }
  const fileURL = filename => 'https://commons.wikimedia.org/wiki/Special:FilePath/'+encodeURIComponent(filename)+'?width=1920';
  // Expose a pure selector so regressions can test all local clock boundaries without network access.
  const selectScene=(key,at=new Date())=>{
    const config=scenes[key];
    if(!config)return null;
    const hour=localHour(config.timezone,at);
    const slot=slotForHour(hour);
    return {key,slot,hour,scene:config[slot],fallback:config.midday};
  };
  window.DayfolkDestinationTime=Object.freeze({keyFor,slotForHour,localHour,selectScene});
  function initialize(){
    const select=document.getElementById('destinationInput');
    const app=document.getElementById('appShell');
    const credit=document.getElementById('destinationImageCredit');
    if(!select||!app||!credit)return;
    const openedAt=new Date();
    let request=0,active='';
    function activate(){
      const selected=selectScene(keyFor(select.value),openedAt);
      if(!selected)return;
      const identity=selected.key+'|'+selected.slot;
      if(identity===active)return;
      active=identity;
      const ticket=++request;
      document.body.dataset.destination=selected.key;
      document.body.dataset.destinationTime=selected.slot;
      document.body.classList.add('destination-active');
      document.body.style.setProperty('--destination-focal',selected.scene.focal);
      const updateCredit=scene=>{
        credit.replaceChildren();
        const link=document.createElement('a');
        link.href=scene.page;link.target='_blank';link.rel='noopener noreferrer';
        link.textContent='Background · '+selected.slot+': '+scene.creator;
        const license=document.createElement('a');
        license.href=scene.licenceUrl;license.target='_blank';license.rel='noopener noreferrer';
        license.textContent=scene.licence;
        credit.append(link,document.createTextNode(' · '),license);
      };
      const load=(scene,mayFallback)=>{
        const image=new Image();image.decoding='async';
        image.onload=()=>{
          if(ticket!==request)return;
          document.body.style.setProperty('--destination-photo','url("'+fileURL(scene.filename)+'")');
          document.body.style.setProperty('--destination-focal',scene.focal);
          updateCredit(scene);
        };
        image.onerror=()=>{
          if(ticket!==request)return;
          if(mayFallback&&scene.filename!==selected.fallback.filename)load(selected.fallback,false);
          else{document.body.style.removeProperty('--destination-photo');credit.replaceChildren();}
        };
        image.src=fileURL(scene.filename);
      };
      // Keep existing photo while the next scene loads; prevent a flash of the fallback gradient.
      load(selected.scene,true);
    }
    select.addEventListener('change',activate);
    const observer=new MutationObserver(()=>{if(!app.hidden)activate();});
    observer.observe(app,{attributes:true,attributeFilter:['hidden']});
    if(!app.hidden)activate();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});
  else initialize();
})();