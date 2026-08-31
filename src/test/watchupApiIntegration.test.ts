import type { Session } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { searchCoins } from '../features/watchup/api'

const auth = vi.hoisted(() => ({ getSession: vi.fn(), refreshSession: vi.fn(), signOut: vi.fn() }))
vi.mock('../lib/supabase', () => ({ getSupabaseClient: () => ({ auth }) }))

const session = {
  access_token: 'fake-feature-access',
  refresh_token: 'fake-refresh',
  user: { id: 'fake-user' },
} as Session

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

beforeEach(() => {
  vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8000/api')
  auth.getSession.mockReset().mockResolvedValue({ data: { session }, error: null })
  auth.refreshSession.mockReset()
  auth.signOut.mockReset()
  vi.stubGlobal('fetch', vi.fn())
})

describe('WatchUp feature API와 공통 Client 연결', () => {
  it('검색을 최종 /api/coins/search URL과 보호된 GET으로 호출한다', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, {
      data: [{ marketCode: 'KRW-BTC', koreanName: '비트코인', englishName: 'Bitcoin', status: 'ACTIVE' }],
      meta: { count: 1 },
    }))

    const response = await searchCoins('비트 코인&원화')

    const [requestUrl, init] = vi.mocked(fetch).mock.calls[0]
    const url = new URL(String(requestUrl), 'https://watchup.test')
    expect(url.pathname).toBe('/api/coins/search')
    expect(url.searchParams.get('query')).toBe('비트 코인&원화')
    expect(String(requestUrl)).not.toContain('/api/api')
    expect(init?.method).toBe('GET')
    expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer fake-feature-access')
    expect(response).toEqual({
      data: [{ marketCode: 'KRW-BTC', koreanName: '비트코인', englishName: 'Bitcoin', status: 'ACTIVE' }],
      meta: { count: 1 },
    })
  })
})
