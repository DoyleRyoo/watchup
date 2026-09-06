import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { BuyForm } from '../features/paper/BuyForm'
import { usePaperStore } from '../stores/paperStore'
const api = vi.hoisted(() => ({ postTrade: vi.fn(), getPortfolio: vi.fn(), getAccount: vi.fn(), topUp: vi.fn() }))
vi.mock('../features/paper/api', () => api)
beforeEach(() => {
  usePaperStore.getState().reset()
  api.postTrade.mockReset().mockResolvedValue({data:{id:'1'},meta:null})
  api.getPortfolio.mockResolvedValue({data:{holdings:[],cashBalanceKrw:'1000',valuationStatus:'FRESH'},meta:{count:0}})
})
it('입력 단위를 전환하고 수량 BUY만 전달하며 표시 가격을 보내지 않는다', async () => {
  const onSuccess=vi.fn()
  render(<BuyForm marketCode="KRW-BTC" disabled={false} onSuccess={onSuccess} />)
  fireEvent.change(screen.getByRole('textbox'), {target:{value:'1000'}})
  fireEvent.click(screen.getByRole('button',{name:'수량'}))
  expect(screen.getByRole('button',{name:'구매하기'})).toBeDisabled()
  fireEvent.change(screen.getByRole('textbox'), {target:{value:'0.1234567890123456789'}})
  expect(screen.getByRole('button',{name:'구매하기'})).toBeDisabled()
  fireEvent.change(screen.getByRole('textbox'), {target:{value:'0.123456789012345678'}})
  fireEvent.click(screen.getByRole('button',{name:'구매하기'}))
  await waitFor(()=>expect(api.postTrade).toHaveBeenCalledWith({marketCode:'KRW-BTC',side:'BUY',quantity:'0.123456789012345678'},expect.any(String)))
  await waitFor(()=>expect(onSuccess).toHaveBeenCalledOnce())
})
