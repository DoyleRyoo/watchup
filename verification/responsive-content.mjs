import { chromium } from '/tmp/watchup-ui-tools/node_modules/playwright/index.mjs'
import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'
import { account, holding, portfolio, chart } from './fixtures.mjs'
const browser = await chromium.launch({executablePath:'/tmp/watchup-ui-tools/browsers/chromium-1243/chrome-linux64/chrome',args:['--no-sandbox']})
const page=await browser.newPage({viewport:{width:375,height:812},deviceScaleFactor:2,locale:'ko-KR'})
const huge='9223372036854775807', quantity='99999999999999999999.999999999999999999'
const rows=Array.from({length:12},(_,i)=>({...holding,marketCode:`KRW-LONG${i}`,koreanName:'아주긴이름의코인레이아웃검증용종목',quantity,valueKrw:huge,unrealizedPnlKrw:`-${huge}`}))
await page.route('**/api/**',route=>{
 const p=new URL(route.request().url()).pathname
 if(!p.startsWith('/api/')) return route.continue()
 let data=p.endsWith('/paper/account')?{...account,cashBalanceKrw:huge,lifetimeTopUpKrw:huge}:p.endsWith('/paper/portfolio')?{...portfolio(),holdings:rows,cashBalanceKrw:huge,totalAssetsKrw:huge,totalPnlKrw:huge}:p.endsWith('/chart')?{...chart(),koreanName:rows[0].koreanName,currentPrice:huge}:[]
 return route.fulfill({json:{data,meta:null}})
})
const results=[]
try {
 for(const width of [320,375,600,768,1024,1275,1440]){
  await page.setViewportSize({width,height:900})
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'})
  await page.locator('.holdings-list .coin-row').last().waitFor()
  await page.evaluate(()=>document.fonts.ready)
  const metrics=await page.evaluate(()=>{
   const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom}}
   const a=rect('.summary-primary'),b=rect('.summary-secondary')
   return {width:innerWidth,scroll:document.documentElement.scrollWidth,rows:document.querySelectorAll('.holdings-list .coin-row').length,summaryOverlap:Math.min(a.right,b.right)>Math.max(a.x,b.x)&&Math.min(a.bottom,b.bottom)>Math.max(a.y,b.y),rowOverflow:[...document.querySelectorAll('.coin-row')].filter(e=>e.scrollWidth>e.clientWidth).length}
  })
  await page.screenshot({path:`verification/artifacts/long-content-${width}.png`,fullPage:true})
  results.push(metrics)
  assert.ok(metrics.scroll<=width,JSON.stringify(metrics))
  assert.equal(metrics.rowOverflow,0,JSON.stringify(metrics))
  assert.equal(metrics.summaryOverlap,false,JSON.stringify(metrics))
  assert.equal(metrics.rows,12)
 }
} finally {
 await writeFile('verification/artifacts/responsive-content.json',JSON.stringify(results,null,2))
 await browser.close()
}
console.log(JSON.stringify({result:'pass',checks:results.length,results}))
