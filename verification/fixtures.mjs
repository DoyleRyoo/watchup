// Visual-only API examples. They do not implement or replace service trading rules.
export const account = {
  cashBalanceKrw: '999999999', lifetimeTopUpKrw: '999999999',
  topUpMinKrw: '10000', topUpMaxKrw: '10000000', topUpLifetimeCapKrw: '9999999999',
}

export const holding = {
  marketCode: 'KRW-BTC', koreanName: '비트코인', englishName: 'Bitcoin',
  quantity: '1.234', costBasisKrw: '100000000', avgPriceKrw: '50000000',
  currentPrice: '999999999', priceStatus: 'FRESH',
  unrealizedPnlKrw: '999999999', valueKrw: '999999999',
}

export function portfolio({ empty = false, single = false } = {}) {
  return {
    cashBalanceKrw: account.cashBalanceKrw,
    holdings: empty ? [] : (single ? ['KRW-BTC'] : ['KRW-BTC', 'KRW-BCH', 'KRW-BTG', 'KRW-BSV']).map((marketCode, index) => ({
      ...holding, marketCode, unrealizedPnlKrw: index === 0 && !single ? '-999999999' : '999999999',
    })),
    totalHoldingsValueKrw: '999999999', totalUnrealizedPnlKrw: '999999999',
    totalRealizedPnlKrw: '0', totalAssetsKrw: '999999999',
    totalPnlKrw: '999999999', totalReturnRate: '10.0001', valuationStatus: 'FRESH',
  }
}

export const searchResults = [
  { marketCode: 'KRW-BTC', koreanName: '비트코인', englishName: 'Bitcoin', status: 'ACTIVE' },
  { marketCode: 'KRW-BCH', koreanName: '비트코인캐시', englishName: 'Bitcoin Cash', status: 'ACTIVE' },
  { marketCode: 'KRW-BTG', koreanName: '비트코인골드', englishName: 'Bitcoin Gold', status: 'ACTIVE' },
]

export function chart(marketCode = 'KRW-BTC', marketStatus = 'ACTIVE') {
  return {
    marketCode, koreanName: '비트코인', englishName: 'Bitcoin', marketStatus,
    currentPrice: '999999999', priceStatus: 'FRESH', period: '30d',
    candles: Array.from({ length: 30 }, (_, index) => ({
      date: `2026-08-${String(index + 1).padStart(2, '0')}`,
      closingPrice: String(980000000 + index * 400000 + (index % 4) * 2300000),
    })),
  }
}

export async function installVisualApi(page, { empty = false, single = false, unavailable = false } = {}) {
  const requests = []
  await page.route('**/api/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    if (!url.pathname.startsWith('/api/')) return route.continue()
    requests.push({ method: request.method(), path: url.pathname, query: url.search, body: request.postDataJSON() })
    let data
    let meta = null
    if (url.pathname.endsWith('/paper/account')) data = account
    else if (url.pathname.endsWith('/paper/portfolio')) {
      data = portfolio({ empty, single })
      meta = { count: data.holdings.length }
    } else if (url.pathname.endsWith('/paper/trades') && request.method() === 'GET') {
      data = []
      meta = { count: 0, hasMore: false }
    } else if (url.pathname.endsWith('/coins/search')) {
      data = searchResults
      meta = { count: data.length }
    } else if (/\/coins\/[^/]+\/chart$/.test(url.pathname)) {
      data = chart(decodeURIComponent(url.pathname.split('/').at(-2)), unavailable ? 'UNAVAILABLE' : 'ACTIVE')
      meta = { count: data.candles.length }
    } else {
      await route.fulfill({ status: 501, contentType: 'application/json', body: JSON.stringify({ error: { code: 'VERIFICATION_UNHANDLED', message: 'No fixture for this operation.', details: null } }) })
      return
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data, meta }) })
  })
  return requests
}
