import { beforeEach, describe, expect, it, vi } from 'vitest'
import { searchCoins } from '../features/watchup/api'

const apiRequest = vi.hoisted(() => vi.fn())
vi.mock('../api/client', () => ({ apiRequest }))

beforeEach(() => {
  apiRequest.mockReset()
})

describe('WatchUp feature API', () => {
  it.each(['비트 코인&원화', 'bitcoin', 'KRW-BTC'])('검색어 %s를 query로 안전하게 전달한다', async (query) => {
    const response = {
      data: [
        { marketCode: 'KRW-XRP', koreanName: '리플', englishName: 'XRP', status: 'CAUTION' },
        { marketCode: 'KRW-BTC', koreanName: '비트코인', englishName: 'Bitcoin', status: 'ACTIVE' },
      ],
      meta: { count: 2 },
    }
    apiRequest.mockResolvedValue(response)

    await expect(searchCoins(query)).resolves.toBe(response)

    const [endpoint, options] = apiRequest.mock.calls[0]
    const url = new URL(endpoint, 'https://watchup.test')
    expect(url.pathname).toBe('/coins/search')
    expect(url.searchParams.get('query')).toBe(query)
    expect(endpoint).not.toContain('/api/api')
    expect(options).toEqual({ signal: undefined })
    expect(response.data.map((item) => item.marketCode)).toEqual(['KRW-XRP', 'KRW-BTC'])
    expect(response.meta.count).toBe(2)
  })
})
