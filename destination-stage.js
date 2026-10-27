/* Destination photography is editorial atmosphere, never activity availability evidence. */
(() => {
  'use strict';
  const scenes = {
    ibiza: {label:'Ibiza', filename:'Ibiza City Dalt Vila from seaport asv2023-04.jpg', creator:'A.Savin, Wikipedia', licence:'Free Art License', licenceUrl:'https://artlibre.org/licence/lal/en/', page:'https://commons.wikimedia.org/wiki/File:Ibiza_City_Dalt_Vila_from_seaport_asv2023-04.jpg', focal:'center 48%'},
    lisbon: {label:'Lisbon', filename:'The rooftops of Lisbon.jpg', creator:'Bert K.', licence:'CC BY 2.0', licenceUrl:'https://creativecommons.org/licenses/by/2.0/', page:'https://commons.wikimedia.org/wiki/File:The_rooftops_of_Lisbon.jpg', focal:'center 52%'},
    sint_maarten: {label:'Sint Maarten / Saint-Martin', filename:'St. Maarten Philipsburg Great Bay Beach.jpg', creator:'Dr. Thomas Liptak', licence:'CC BY-SA 4.0', licenceUrl:'https://creativecommons.org/licenses/by-sa/4.0/', page:'https://commons.wikimedia.org/wiki/File:St._Maarten_Philipsburg_Great_Bay_Beach.jpg', focal:'center 54%'},
    nyc: {label:'New York City', filename:'Midtown Manhattan Skyline 2026 095.jpg', creator:'Kidfly182', licence:'CC BY 4.0', licenceUrl:'https://creativecommons.org/licenses/by/4.0/', page:'https://commons.wikimedia.org/wiki/File:Midtown_Manhattan_Skyline_2026_095.jpg', focal:'center 55%'}
  };
  const keyFor = value => {
    const text=(value||'').toLowerCase();
    if(/ibiza|eivissa/.test(text))return 'ibiza';
    if(/lisbon|lisboa/.test(text))return 'lisbon';
    if(/maarten|saint.martin|st. martin/.test(text))return 'sint_maarten';
    if(/new york|nyc/.test(text))return 'nyc';
    return null;
  };
  const fileURL = filename => 'https://commons.wikimedia.org/wiki/Special:FilePath/' + encodeURIComponent(filename) + '?width=1920';
  function initialize(){
    const select=document.getElementById('destinationInput');
    const app=document.getElementById('appShell');
    const credit=document.getElementById('destinationImageCredit');
    if(!select||!app||!credit)return;
    let request=0;
    function activate(){
      const key=keyFor(select.value);
      if(!key)return;
      const scene=scenes[key], ticket=++request;
      const img=new Image(); img.decoding='async';
      img.onload=()=>{
        if(ticket!==request)return;
        document.body.style.setProperty('--destination-photo','url("'+fileURL(scene.filename)+'")');
        document.body.style.setProperty('--destination-focal',scene.focal);
        document.body.dataset.destination=key;
        document.body.classList.add('destination-active');
      };
      img.onerror=()=>{
        if(ticket!==request)return;
        document.body.style.removeProperty('--destination-photo');
        document.body.classList.add('destination-active');
        document.body.dataset.destination=key;
      };
      credit.replaceChildren();
      const link=document.createElement('a');
      link.href=scene.page;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Background: '+scene.creator;
      const licence=document.createElement('a');
      licence.href=scene.licenceUrl;licence.target='_blank';licence.rel='noopener noreferrer';licence.textContent=scene.licence;
      credit.append(link,document.createTextNode(' · '),licence);
      img.src=fileURL(scene.filename);
    }
    // The image is introduced as soon as a city is chosen; no artificial transition screen.
    select.addEventListener('change',activate);
    const observer=new MutationObserver(()=>{
      if(!app.hidden)activate();
    });
    observer.observe(app,{attributes:true,attributeFilter:['hidden']});
    if(!app.hidden)activate();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});
  else initialize();
})();