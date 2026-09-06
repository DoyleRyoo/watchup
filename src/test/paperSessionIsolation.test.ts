import type { Session } from '@supabase/supabase-js'
import { beforeEach, expect, it, vi } from 'vitest'
import { useAuthStore } from '../stores/authStore'
import { usePaperStore } from '../stores/paperStore'

const api = vi.hoisted(() => ({ getAccount: vi.fn(), getPortfolio: vi.fn(), postTrade: vi.fn(), topUp: vi.fn() }))
vi.mock('../features/paper/api', () => api)
const session = (id: string) => ({ user: { id }, access_token: 'test' }) as Session
beforeEach(() => { usePaperStore.getState().reset(); useAuthStore.getState().setSession(session('first')) })

it('로그아웃은 현금과 포트폴리오를 지우고 늦은 계좌 응답을 무시한다', async () => {
  let resolve!: (value: unknown) => void
  api.getAccount.mockReturnValue(new Promise(done => { resolve = done }))
  usePaperStore.setState({ cashBalanceKrw: '1000000' })
  const pending = usePaperStore.getState().loadAccount()
  useAuthStore.getState().setSession(null)
  expect(usePaperStore.getState().cashBalanceKrw).toBeNull()
  resolve({ data: { cashBalanceKrw: '999999' }, meta: null })
  await pending
  expect(usePaperStore.getState().account).toBeNull()
})

it('사용자 변경 후 이전 거래 응답은 새 계정 포트폴리오를 갱신하지 않는다', async () => {
  let resolve!: (value: unknown) => void
  api.postTrade.mockReturnValue(new Promise(done => { resolve = done }))
  api.getPortfolio.mockClear()
  const pending = usePaperStore.getState().postTrade({ marketCode: 'KRW-BTC', side: 'BUY', quantity: '0.1' }, 'test-key')
  useAuthStore.getState().setSession(session('second'))
  resolve({ data: { id: '9' }, meta: null })
  await pending
  expect(api.getPortfolio).not.toHaveBeenCalled()
  expect(usePaperStore.getState().holdings).toEqual([])
})
