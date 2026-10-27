const {chromium}=require('playwright');
const path=require('node:path'),fs=require('node:fs');
const sizes=[[375,812],[768,1024],[1024,768],[1366,860],[1440,900]];
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const metrics=[];
 for(const variant of ['before','after']){
  for(const [width,height] of sizes){
   const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
   const url='file://'+path.resolve(variant,'index.html');
   try{
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:25000});
    await page.locator('#destinationInput').selectOption('Lisbon');
    for(let i=0;i<2;i++)await page.locator('#setupNext:visible').click();
    await page.locator('#startPlanning:visible').click();
    await page.waitForSelector('#appShell:not([hidden])',{timeout:10000});
    await page.waitForTimeout(650);
    fs.mkdirSync(path.join('screenshots',variant),{recursive:true});
    await page.screenshot({path:path.join('screenshots',variant,width+'x'+height+'.png'),fullPage:false});
    const metric=await page.evaluate(()=>{
      const cards=[...document.querySelectorAll('#ideasList .idea-card')].filter(el=>el.getClientRects().length && getComputedStyle(el).display!=='none');
      return {cardTop:cards[0]?.getBoundingClientRect().top ?? null,horizontalOverflow:document.documentElement.scrollWidth>innerWidth,visibleCards:cards.length};
    });
    metrics.push({variant,width,height,...metric});
   }catch(e){metrics.push({variant,width,height,error:String(e).slice(0,300)});}
   await page.close();
  }
 }
 await browser.close();
 fs.mkdirSync('screenshots',{recursive:true});
 fs.writeFileSync('screenshots/metrics.json',JSON.stringify(metrics,null,2));
 console.log(JSON.stringify(metrics,null,2));
 if(metrics.some(x=>x.error))process.exitCode=1;
})();