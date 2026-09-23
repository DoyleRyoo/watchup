import { act } from '@testing-library/react'
import type { Session } from '@supabase/supabase-js'
import { ApiError } from '../api/errors'
import { ToastHost } from '../components/ToastHost'
import { useToastStore } from '../stores/toastStore'
import { useAuthStore } from '../stores/authStore'
import { SellForm } from '../features/paper/SellForm'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { BuyForm } from '../features/paper/BuyForm'
import { usePaperStore } from '../stores/paperStore'
const api = vi.hoisted(() => ({ postTrade: vi.fn(), getPortfolio: vi.fn(), getAccount: vi.fn(), topUp: vi.fn() }))
vi.mock('../features/paper/api', () => api)
beforeEach(() => {
  useToastStore.getState().clear()
  usePaperStore.getState().reset()
  api.postTrade.mockReset().mockResolvedValue({data:{id:'1'},meta:null})
  api.getPortfolio.mockResolvedValue({data:{holdings:[],cashBalanceKrw:'1000',valuationStatus:'FRESH'},meta:{count:0}})
})
it('입력 단위를 전환하고 수량 BUY만 전달하며 표시 가격을 보내지 않는다', async () => {
  const onSuccess=vi.fn()
  render(<BuyForm currentPrice="150000000" priceStatus="FRESH" marketCode="KRW-BTC" disabled={false} onSuccess={onSuccess} />)
  fireEvent.change(screen.getByRole('textbox'), {target:{value:'1000'}})
  fireEvent.click(screen.getByRole('button',{name:'수량'}))
  expect(screen.getByRole('button',{name:'구매하기'})).toBeDisabled()
  fireEvent.change(screen.getByRole('textbox'), {target:{value:'0.1234567890123456789'}})
  expect(screen.getByRole('textbox')).toHaveValue('0.123456789012345678개')
  expect(screen.getByRole('button',{name:'구매하기'})).toBeEnabled()
  fireEvent.change(screen.getByRole('textbox'), {target:{value:'0.123456789012345678'}})
  fireEvent.click(screen.getByRole('button',{name:'구매하기'}))
  await waitFor(()=>expect(api.postTrade).toHaveBeenCalledWith({marketCode:'KRW-BTC',side:'BUY',quantity:'0.123456789012345678'},expect.any(String)))
  await waitFor(()=>expect(onSuccess).toHaveBeenCalledOnce())
})

it('18자리 수량 입력은 blur 에코와 제출에서 그대로 유지된다', async () => {
  render(<BuyForm currentPrice="150000000" priceStatus="FRESH" marketCode="KRW-BTC" disabled={false} onSuccess={vi.fn()} />)
  fireEvent.click(screen.getByRole('button', {name:'수량'}))
  const input=screen.getByRole('textbox')
  fireEvent.focus(input)
  fireEvent.change(input, {target:{value:'0.123456789012345678'}})
  fireEvent.blur(input)
  expect(input).toHaveValue('0.123456789012345678개')
  fireEvent.click(screen.getByRole('button', {name:'구매하기'}))
  await waitFor(()=>expect(api.postTrade).toHaveBeenCalledWith({marketCode:'KRW-BTC',side:'BUY',quantity:'0.123456789012345678'},expect.any(String)))
})

it('숫자 입력 경계에서 붙여넣기·한글·여러 소수점을 정리하고 모드 값을 보존한다', () => {
  render(<BuyForm currentPrice="150000000" priceStatus="FRESH" marketCode="KRW-BTC" disabled={false} onSuccess={vi.fn()} />)
  const input=screen.getByRole('textbox')
  fireEvent.focus(input)
  fireEvent.change(input,{target:{value:'12가3'}})
  expect(input).toHaveValue('123')
  fireEvent.click(screen.getByRole('button',{name:'수량'}))
  fireEvent.change(input,{target:{value:'1.2.3'}})
  expect(input).toHaveValue('1.2')
  fireEvent.change(input,{target:{value:'수량1'}})
  expect(input).toHaveValue('1')
  fireEvent.click(screen.getByRole('button',{name:'금액'}))
  expect(input).toHaveValue('123')
})
it('판매 입력은 글자·0·불완전한 소수의 제출을 막고 유효 수량만 보낸다', async () => {
  render(<SellForm currentPrice="150000000" priceStatus="FRESH" marketCode="KRW-BTC" disabled={false} availableQuantity="1" onSuccess={vi.fn()} />)
  const input=screen.getByRole('textbox',{name:'매도 수량'}), button=screen.getByRole('button',{name:'판매하기'})
  for(const raw of ['가나다','0','0.','0.000']) {
    fireEvent.change(input,{target:{value:raw}})
    expect(button).toBeDisabled()
    fireEvent.submit(input.closest('form')!)
    expect(api.postTrade).not.toHaveBeenCalled()
  }
  fireEvent.change(input,{target:{value:'0.5'}})
  expect(button).toBeEnabled()
  fireEvent.click(button)
  await waitFor(()=>expect(api.postTrade).toHaveBeenCalledWith({marketCode:'KRW-BTC',side:'SELL',quantity:'0.5'},expect.any(String)))
})

it('금액·수량 예상치를 전환하고 가격은 요청에 포함하지 않는다', async () => {
  const {rerender}=render(<BuyForm currentPrice="150000000" priceStatus="FRESH" marketCode="KRW-BTC" disabled={false} onSuccess={vi.fn()} />)
  fireEvent.change(screen.getByRole('textbox'),{target:{value:'50000'}})
  expect(screen.getByText('약 0.0003333개 구매 가능')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button',{name:'구매하기'}))
  await waitFor(()=>expect(api.postTrade).toHaveBeenCalledWith({marketCode:'KRW-BTC',side:'BUY',amountKrw:'50000'},expect.any(String)))
  await waitFor(()=>expect(screen.getByRole('textbox')).toHaveValue(''))
  rerender(<BuyForm currentPrice="4" priceStatus="FRESH" marketCode="KRW-BTC" disabled={false} onSuccess={vi.fn()} />)
  fireEvent.click(screen.getByRole('button',{name:'수량'}))
  fireEvent.change(screen.getByRole('textbox'),{target:{value:'2.5'}})
  expect(screen.getByText('약 10원 필요')).toBeInTheDocument()
})
it('예상치를 숨기는 조건과 지연 가격을 구분하며 버튼 상태를 가격으로 막지 않는다', () => {
  const props={marketCode:'KRW-BTC',disabled:false,onSuccess:vi.fn()}
  const {container,rerender}=render(<BuyForm {...props} currentPrice="4" priceStatus="FRESH" />)
  expect(container.querySelector('.trade-estimate')).toBeNull()
  fireEvent.change(screen.getByRole('textbox'),{target:{value:'10'}})
  expect(screen.getByText('약 2개 구매 가능')).toBeInTheDocument()
  rerender(<BuyForm {...props} currentPrice="4" priceStatus="STALE" />)
  expect(screen.getByText('약 2개 구매 가능')).toBeInTheDocument()
  expect(screen.getByText(/지연된 시세 기준/)).toBeInTheDocument()
  for(const price of [null,'0','100000000000000000000']) {
    rerender(<BuyForm {...props} currentPrice={price} priceStatus="FRESH" />)
    expect(container.querySelector('.trade-estimate')).toBeNull()
  }
  rerender(<BuyForm {...props} currentPrice="4" priceStatus="PRICE_ERROR" />)
  expect(container.querySelector('.trade-estimate')).toBeNull()
  expect(screen.getByRole('button',{name:'구매하기'})).toBeEnabled()
  rerender(<BuyForm {...props} currentPrice="4" priceStatus="FRESH" />)
  fireEvent.change(screen.getByRole('textbox'),{target:{value:''}})
  expect(container.querySelector('.trade-estimate')).toBeNull()
  fireEvent.click(screen.getByRole('button',{name:'수량'}))
  fireEvent.change(screen.getByRole('textbox'),{target:{value:'0.'}})
  expect(container.querySelector('.trade-estimate')).toBeNull()
})

it('구매 실패는 알림 하나로 표시하고 입력값을 유지한다', async ()=>{
 api.postTrade.mockRejectedValue(new ApiError(400,'INSUFFICIENT_CASH_BALANCE','raw message'))
 render(<><ToastHost /><BuyForm marketCode="KRW-BTC" currentPrice="100" priceStatus="FRESH" disabled={false} onSuccess={vi.fn()} /></>)
 const input=screen.getByRole('textbox')
 fireEvent.focus(input);fireEvent.change(input,{target:{value:'1000'}})
 fireEvent.click(screen.getByRole('button',{name:'구매하기'}))
 expect(await screen.findByRole('alert')).toHaveTextContent('보유 현금이 부족합니다.')
 expect(input).toHaveValue('1000')
 expect(screen.getAllByRole('alert')).toHaveLength(1)
})
it.each(['request','refresh'] as const)('진행 중인 %s에서 세션 변경은 성공 콜백·알림을 억제한다', async phase=>{
 const session=(id:string)=>({user:{id},access_token:'test'}) as Session
 useAuthStore.getState().setSession(session('A'))
 let resolve!: (value:unknown)=>void
 const pending=new Promise(done=>{resolve=done})
 if(phase==='request') api.postTrade.mockReturnValueOnce(pending)
 else api.getPortfolio.mockReturnValueOnce(pending)
 const onSuccess=vi.fn()
 render(<><ToastHost /><BuyForm marketCode="KRW-BTC" currentPrice="100" priceStatus="FRESH" disabled={false} onSuccess={onSuccess} /></>)
 fireEvent.change(screen.getByRole('textbox'),{target:{value:'1000'}})
 fireEvent.click(screen.getByRole('button',{name:'구매하기'}))
 await waitFor(()=>expect(phase==='request'?api.postTrade:api.getPortfolio).toHaveBeenCalled())
 act(()=>{useAuthStore.getState().setSession(session('B'));useAuthStore.getState().setSession(session('A'))})
 await act(async()=>{resolve({data:{holdings:[],cashBalanceKrw:'1000',valuationStatus:'FRESH'},meta:null});await pending})
 expect(onSuccess).not.toHaveBeenCalled()
 expect(useToastStore.getState().toasts).toEqual([])
})
