import { chromium } from '/tmp/watchup-ui-tools/node_modules/playwright/index.mjs'
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { account, holding, portfolio, chart, searchResults } from './fixtures.mjs'

const out = 'verification/artifacts'
await mkdir(out, {recursive:true})
const browser = await chromium.launch({executablePath:'/tmp/watchup-ui-tools/browsers/chromium-1243/chrome-linux64/chrome',args:['--no-sandbox']})
const context = await browser.newContext({viewport:{width:375,height:812},deviceScaleFactor:2,locale:'ko-KR',colorScheme:'light'})
const page = await context.newPage()
const checks = [], requests = [], errors = []
let owned = false, failTrade = false, failPortfolio = false, failChart = false, unavailable = false, topped = false
const record = (name, details = '') => checks.push({name, result:'pass', evidence:details})
page.on('pageerror', e => errors.push(e.message))
await page.route('**/api/**', async route => {
  const req=route.request(), u=new URL(req.url())
  if(!u.pathname.startsWith('/api/')) return route.continue()
  const body=req.postDataJSON()
  requests.push({path:u.pathname,method:req.method(),body,key:req.headers()['idempotency-key']})
  const respond=(data,meta=null)=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({data,meta})})
  const error=(code,message)=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:{code,message,details:null}})})
  if(u.pathname.endsWith('/paper/account')) return respond({...account,cashBalanceKrw:topped?'1000000999':account.cashBalanceKrw})
  if(u.pathname.endsWith('/paper/portfolio')) {
    if(failPortfolio) return error('DATABASE_UNAVAILABLE','조회 실패')
    return respond({...portfolio({empty:!owned,single:true}),cashBalanceKrw:topped?'1000000999':account.cashBalanceKrw,holdings:owned?[{...holding,quantity:'1.234'}]:[]},{count:owned?1:0})
  }
  if(u.pathname.endsWith('/coins/search')) {
    const data=u.searchParams.get('query')==='없음'?[]:searchResults
    return respond(data,{count:data.length})
  }
  if(u.pathname.endsWith('/chart')) {
    if(failChart) return error('UPBIT_UNAVAILABLE','가격 조회 실패')
    return respond(chart(u.pathname.split('/').at(-2),unavailable?'UNAVAILABLE':'ACTIVE'),{count:30})
  }
  if(u.pathname.endsWith('/paper/trades') && req.method()==='GET') return respond([],{count:0,hasMore:false})
  if(u.pathname.endsWith('/paper/trades')) {
    if(failTrade) return error('UPBIT_UNAVAILABLE','현재가 조회에 실패했습니다. 다시 시도해주세요.')
    assert.match(req.headers()['idempotency-key'],/^[0-9a-f-]{36}$/)
    assert.ok(!('price' in body) && !('currentPrice' in body))
    owned=body.side==='BUY'
    return respond({id:'7',type:body.side,marketCode:body.marketCode,quantity:'1.234',cashDeltaKrw:'-100000',balanceAfterKrw:'999899999'})
  }
  if(u.pathname.endsWith('/paper/top-ups')) { topped=true; return respond({id:'8',type:'TOP_UP',cashDeltaKrw:'1000',balanceAfterKrw:'1000000999'}) }
  return error('INVALID_REQUEST','예상하지 않은 검증 요청')
})
try {
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'})
  await page.getByText('보유 중인 자산이 없습니다.').waitFor()
  await page.getByRole('button',{name:'코인 검색으로 이동'}).click()
  await page.getByRole('searchbox').fill('없음')
  await page.getByText('검색 결과가 없습니다.').waitFor()
  await page.getByRole('searchbox').press('Enter')
  assert.equal(new URL(page.url()).pathname,'/')
  record('빈 검색 결과 + Enter 무동작')
  await page.getByRole('searchbox').fill('비트')
  await page.getByRole('option').first().waitFor()
  assert.equal(await page.getByRole('option').first().getAttribute('aria-selected'),'true')
  await page.getByRole('searchbox').press('ArrowDown')
  assert.equal(await page.getByRole('option').nth(1).getAttribute('aria-selected'),'true')
  await page.getByRole('searchbox').press('ArrowUp')
  await page.getByRole('searchbox').press('Enter')
  await page.locator('.coin-headline').waitFor()
  assert.equal(new URL(page.url()).pathname,'/coins/KRW-BTC')
  record('검색 → 기본 선택 → 방향키 → Enter → 응답 marketCode 상세')
  for (const index of [0, 1, 0]) {
    await page.getByRole('button',{name:'코인 검색으로 이동'}).click()
    await page.getByRole('searchbox').fill('비트')
    await page.getByRole('option').nth(index).click()
    await page.locator('.coin-headline').waitFor()
    assert.equal(new URL(page.url()).pathname,index===1?'/coins/KRW-BCH':'/coins/KRW-BTC')
    assert.equal(await page.locator('.search-active').count(),0)
  }
  record('상세에서 재검색 → 같은 종목·다른 종목 선택 시 검색 닫힘 + 차트 표시')
  await page.getByRole('button',{name:'구매하기',exact:true}).click()
  await page.getByRole('textbox',{name:'매수 금액 (원)'}).fill('100000')
  failTrade=true
  await page.getByRole('button',{name:'구매하기',exact:true}).click()
  await page.getByRole('alert').filter({hasText:'시세를 불러올 수 없어 주문하지 못했습니다.'}).waitFor()
  assert.equal(owned,false)
  record('구매 실패 시 오류 + 보유 상태 무변경 + 입력 유지')
  failTrade=false
  await page.getByRole('button',{name:'구매하기',exact:true}).click()
  await page.getByRole('button',{name:'판매하기',exact:true}).waitFor()
  assert.equal(owned,true)
  const buy=requests.filter(r=>r.method==='POST'&&r.body?.side==='BUY').at(-1)
  assert.deepEqual(buy.body,{marketCode:'KRW-BTC',side:'BUY',amountKrw:'100000'})
  record('금액 구매 → 성공 후 portfolio 재조회 → 판매 가능 상태',buy.body)
  await page.reload({waitUntil:'networkidle'})
  await page.getByRole('button',{name:'판매하기',exact:true}).waitFor()
  record('새로고침 → 서버 응답으로 보유 상태 재구성','모의 API 상태 유지 검증; 실제 DB 영속성은 미검증')
  await page.getByRole('button',{name:'구매하기',exact:true}).click()
  await page.getByRole('button',{name:'코인 검색으로 이동'}).click()
  await page.locator('.holdings-list .coin-row').first().click()
  await page.locator('.chart-area').waitFor()
  assert.equal(await page.locator('.search-active, .trading-active').count(),0)
  record('구매 입력에서 검색 → 보유 중인 동일 종목 클릭 → 차트 복귀')
  await page.getByRole('link',{name:'검색으로 돌아가기'}).click()
  await page.locator('.holdings-list .coin-row').first().click()
  await page.getByRole('button',{name:'판매하기',exact:true}).click()
  await page.getByRole('textbox',{name:'매도 수량'}).fill('1.234')
  failPortfolio=true
  await page.getByRole('button',{name:'판매하기',exact:true}).click()
  await page.getByText('보유 자산을 갱신하지 못했습니다.').waitFor()
  assert.equal(owned,false)
  assert.equal(await page.getByRole('button',{name:'판매하기',exact:true}).count(),1)
  record('전량 판매 후 refetch 실패 → 마지막 보유 상태 유지 + 오류')
  failPortfolio=false
  await page.locator('.detail-refresh-error').getByRole('button',{name:'다시 시도'}).click()
  await page.getByRole('button',{name:'판매하기',exact:true}).waitFor({state:'hidden'})
  await page.getByRole('link',{name:'검색으로 돌아가기'}).click()
  await page.getByText('보유 중인 자산이 없습니다.').waitFor()
  record('재조회 재시도 성공 → 전량 판매 종목이 목록에서 제거')
  await page.goto('http://127.0.0.1:4173/coins/KRW-BTC',{waitUntil:'networkidle'})
  await page.getByRole('button',{name:'구매하기',exact:true}).click()
  await page.getByRole('button',{name:'수량',exact:true}).click()
  await page.getByRole('textbox',{name:'매수 수량'}).fill('0.001')
  await page.getByRole('button',{name:'구매하기',exact:true}).click()
  await page.getByRole('button',{name:'판매하기',exact:true}).waitFor()
  assert.deepEqual(requests.filter(r=>r.method==='POST'&&r.body?.side==='BUY').at(-1).body,{marketCode:'KRW-BTC',side:'BUY',quantity:'0.001'})
  record('수량 구매 → BUY quantity 문자열만 전달 → 재조회')
  unavailable=true
  await page.reload({waitUntil:'networkidle'})
  assert.ok(await page.getByRole('button',{name:'구매하기',exact:true}).isDisabled())
  assert.ok(await page.getByRole('button',{name:'판매하기',exact:true}).isDisabled())
  record('UNAVAILABLE 마켓 BUY·SELL 차단, FRESH 가격과 독립')
  unavailable=false;failChart=true
  await page.reload({waitUntil:'networkidle'})
  await page.getByText('코인 정보를 불러오지 못했습니다.').waitFor()
  failChart=false
  await page.getByRole('button',{name:'다시 시도',exact:true}).click()
  await page.locator('.coin-headline').waitFor()
  record('차트 조회 오류 → 재시도 복구')
  await page.getByRole('button',{name:'모의투자 충전 열기'}).click()
  await page.getByLabel('충전 금액').fill('1000')
  await page.getByRole('button',{name:'충전',exact:true}).click()
  await page.waitForResponse(r=>r.url().endsWith('/paper/portfolio'))
  await page.getByRole('dialog').getByRole('button',{name:'닫기',exact:true}).click()
  await page.getByRole('button',{name:'거래 내역 열기'}).click()
  await page.getByText('거래 내역이 없습니다.').waitFor()
  await page.getByRole('dialog').getByRole('button',{name:'닫기',exact:true}).click()
  record('헤더 충전 → 계좌·portfolio 갱신, 내역 열기·닫기')
  await page.getByRole('button',{name:/테마:/}).click()
  const theme=await page.locator('html').getAttribute('data-theme')
  await page.reload({waitUntil:'networkidle'})
  assert.equal(await page.locator('html').getAttribute('data-theme'),theme)
  record('테마 전환 + 새로고침 지속')
  for (const width of [320,375,600,768,1024,1275,1440]) {
    await page.setViewportSize({width,height:900})
    await page.evaluate(()=>document.fonts.ready)
    await page.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth, null, { timeout: 2000 })
    const metrics=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}))
    assert.ok(metrics.scroll<=width,JSON.stringify(metrics))
    record(`반응형 ${width}px 가로 스크롤 없음`)
  }
  await page.getByRole('button',{name:'로그아웃',exact:true}).click()
  await page.getByRole('button',{name:'Google로 로그인'}).waitFor()
  record('로그아웃 → 보호 경로 종료','검증용 Supabase 응답; 실제 OAuth 미검증')
  assert.equal(errors.length,0,errors.join('\n'))
  assert.ok(requests.every(r=>!r.path.includes('watchlist')))
  record('브라우저 예외 0건·watchlist 요청 0건')
} catch(e) {
  checks.push({name:'흐름 중단',result:'fail',error:e.stack})
  await page.screenshot({path:`${out}/flow-failure.png`,fullPage:true})
  process.exitCode=1
} finally {
  await writeFile(`${out}/browser-flows.json`,JSON.stringify({environment:'isolated Vite + Chromium; network responses mocked, no live account or DB writes',checks,requests,errors},null,2))
  console.log(JSON.stringify(checks,null,2))
  await browser.close()
}
