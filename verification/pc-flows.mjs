import { chromium } from '/tmp/watchup-ui-tools/node_modules/playwright/index.mjs'
import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'
import { account, holding, portfolio, chart, searchResults } from './fixtures.mjs'

const browser = await chromium.launch({ executablePath: '/tmp/watchup-ui-tools/browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] })
const checks = [], requests = [], errors = []
try {
  for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({ viewport: { width: 1275, height: 900 }, deviceScaleFactor: 2, colorScheme: theme })
    await context.addInitScript(mode => localStorage.setItem('watchup.theme', mode), theme)
    const page = await context.newPage()
    page.on('pageerror', e => errors.push(e.message))
    let owned = false, rejectTrade = false
    await page.route('**/api/**', route => {
      const req = route.request(), p = new URL(req.url()).pathname, body = req.postDataJSON()
      if (!p.startsWith('/api/')) return route.continue()
      requests.push({ theme, path: p, method: req.method(), body })
      const respond = (data, meta = null) => route.fulfill({ json: { data, meta } })
      if (p.endsWith('/paper/account')) return respond(account)
      if (p.endsWith('/paper/portfolio')) return respond({ ...portfolio(), holdings: owned ? [holding] : [] }, { count: owned ? 1 : 0 })
      if (p.endsWith('/coins/search')) return respond(searchResults, { count: searchResults.length })
      if (p.endsWith('/chart')) return respond(chart(p.split('/').at(-2)), { count: 30 })
      if (p.endsWith('/paper/trades') && req.method() === 'POST') {
        if (rejectTrade) return route.fulfill({ status: 400, json: { error: { code: 'INSUFFICIENT_CASH_BALANCE', message: '보유 현금이 부족합니다.', details: null } } })
        assert.match(req.headers()['idempotency-key'], /^[0-9a-f-]{36}$/)
        owned = body.side === 'BUY'
        return respond({ id: '9', type: body.side, marketCode: body.marketCode, quantity: '1.234', cashDeltaKrw: '1000', balanceAfterKrw: '999999999' })
      }
      return respond([], { count: 0, hasMore: false })
    })
    const record = name => checks.push({ theme, name, result: 'pass' })
    await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' })
    await page.getByRole('searchbox').fill('비트')
    await page.getByRole('option').first().click()
    await page.locator('.coin-headline').waitFor()
    assert.equal(new URL(page.url()).pathname, '/coins/KRW-BTC')
    record('PC 검색 → 결과 클릭 → 상세 3열 표시')
    await page.getByRole('textbox', { name: '매수 금액 (원)' }).fill('1000')
    rejectTrade = true
    await page.getByRole('button', { name: '구매하기', exact: true }).click()
    await page.getByRole('alert').filter({ hasText: '보유 현금이 부족합니다.' }).waitFor()
    assert.equal(owned, false)
    rejectTrade = false
    await page.getByRole('button', { name: '구매하기', exact: true }).click()
    await page.locator('.holdings-list .coin-row').waitFor()
    record('PC 금액 구매 실패 → 재시도 성공 → 보유 행 반영')
    await page.reload({ waitUntil: 'networkidle' })
    await page.locator('.holdings-list .coin-row').waitFor()
    record('PC 새로고침 → 모의 API 보유 재구성')
    await page.getByRole('button', { name: '판매하기', exact: true }).click()
    await page.getByRole('textbox', { name: '매도 수량' }).fill('1.234')
    await page.getByRole('button', { name: '판매하기', exact: true }).click()
    await page.getByText('보유 중인 자산이 없습니다.').waitFor()
    assert.equal(owned, false)
    record('PC 판매 입력 전환 → 전량 판매 → 보유 행 제거')
    await page.getByRole('button', { name: '수량', exact: true }).click()
    await page.getByRole('textbox', { name: '매수 수량' }).fill('0.001')
    await page.getByRole('button', { name: '구매하기', exact: true }).click()
    await page.locator('.holdings-list .coin-row').waitFor()
    assert.deepEqual(requests.filter(r => r.theme === theme && r.method === 'POST').at(-1).body, { marketCode: 'KRW-BTC', side: 'BUY', quantity: '0.001' })
    record('PC 수량 구매 → quantity-only 요청 → 보유 재조회')
    await context.close()
  }
  assert.equal(errors.length, 0, errors.join('\n'))
} catch (e) {
  checks.push({ result: 'fail', error: e.stack })
  process.exitCode = 1
} finally {
  await writeFile('verification/artifacts/pc-flows.json', JSON.stringify({ environment: 'mocked API, no real account or DB changes', checks, requests, errors }, null, 2))
  console.log(JSON.stringify(checks, null, 2))
  await browser.close()
}
