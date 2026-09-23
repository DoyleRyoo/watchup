import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { Session } from '@supabase/supabase-js'
import { ToastHost } from '../components/ToastHost'
import { useToastStore, getToastSessionVersion } from '../stores/toastStore'
import { useAuthStore } from '../stores/authStore'
import { ApiError, createContractError } from '../api/errors'
import { messageFor } from '../features/paper/errorMessages'
beforeEach(()=>{vi.restoreAllMocks();useToastStore.getState().clear();vi.useFakeTimers()})
afterEach(()=>{useToastStore.getState().clear();vi.useRealTimers()})
it('오류는 한 번 알리고 10초 뒤에도 수동 닫기까지 유지한다', ()=>{
 render(<ToastHost />)
 act(()=>{useToastStore.getState().show('error','보유 현금이 부족합니다.')})
 expect(screen.getAllByRole('alert')).toHaveLength(1)
 act(()=>vi.advanceTimersByTime(10000))
 expect(screen.getByRole('alert')).toHaveTextContent('보유 현금이 부족합니다.')
 fireEvent.click(screen.getByRole('button',{name:'닫기'}))
 expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})
it('성공은 4초 후 사라지며 수동 닫기·unmount 시 타이머를 해제한다', ()=>{
 const {unmount}=render(<ToastHost />)
 act(()=>{useToastStore.getState().show('success','구매 완료')})
 expect(screen.getByRole('status')).toHaveTextContent('구매 완료')
 act(()=>vi.advanceTimersByTime(3999))
 expect(screen.getByRole('status')).toBeInTheDocument()
 act(()=>vi.advanceTimersByTime(1))
 expect(screen.queryByRole('status')).not.toBeInTheDocument()
 act(()=>{useToastStore.getState().show('success','판매 완료')})
 fireEvent.click(screen.getByRole('button',{name:'닫기'}))
 expect(vi.getTimerCount()).toBe(0)
 act(()=>{useToastStore.getState().show('success','충전 완료')})
 expect(vi.getTimerCount()).toBe(1)
 unmount()
 expect(vi.getTimerCount()).toBe(0)
})
it('새 알림이 세 번째이면 가장 오래된 알림과 타이머를 제거한다', ()=>{
 render(<ToastHost />)
 act(()=>{useToastStore.getState().show('success','첫 알림')})
 act(()=>{useToastStore.getState().show('error','둘째 알림');useToastStore.getState().show('error','셋째 알림')})
 expect(screen.getAllByRole('alert')).toHaveLength(2)
 expect(screen.queryByText('첫 알림')).not.toBeInTheDocument()
 expect(vi.getTimerCount()).toBe(0)
})
it('계정이 A→B→A로 바뀌어도 세션 세대가 변하고 과거 알림은 제거된다', ()=>{
 const session=(id:string)=>({user:{id}}) as Session
 useAuthStore.getState().setSession(session('A'))
 const start=getToastSessionVersion()
 useToastStore.getState().show('error','이전 계정 알림')
 useAuthStore.getState().setSession(session('B'))
 useAuthStore.getState().setSession(session('A'))
 expect(getToastSessionVersion()).toBe(start+2)
 expect(useToastStore.getState().toasts).toEqual([])
})
it.each([
 ['INSUFFICIENT_CASH_BALANCE','보유 현금이 부족합니다.'],
 ['INSUFFICIENT_HOLDING_QUANTITY','보유 수량이 부족합니다.'],
 ['MARKET_NOT_TRADABLE','현재 거래할 수 없는 마켓입니다.'],
 ['INVALID_REQUEST','주문 정보를 다시 확인해주세요.'],
 ['INVALID_MARKET_CODE','코인 정보를 다시 확인해주세요.'],
 ['IDEMPOTENCY_KEY_REQUIRED','요청을 처리하지 못했습니다. 다시 시도해주세요.'],
 ['IDEMPOTENCY_KEY_REUSED','이미 처리된 주문입니다. 거래 내역을 확인해주세요.'],
 ['TOP_UP_AMOUNT_OUT_OF_RANGE','1회 충전 가능 금액 범위를 벗어났습니다.'],
 ['TOP_UP_LIFETIME_LIMIT_EXCEEDED','평생 누적 충전 한도를 초과했습니다.'],
 ['UPBIT_UNAVAILABLE','시세를 불러올 수 없어 주문하지 못했습니다. 잠시 후 다시 시도해주세요.'],
 ['UPBIT_RATE_LIMITED','시세를 불러올 수 없어 주문하지 못했습니다. 잠시 후 다시 시도해주세요.'],
 ['UPBIT_TEMPORARILY_BLOCKED','시세를 불러올 수 없어 주문하지 못했습니다. 잠시 후 다시 시도해주세요.'],
 ['DATABASE_UNAVAILABLE','일시적으로 요청을 처리할 수 없습니다. 잠시 후 다시 시도해주세요.'],
 ['AUTH_REQUIRED','로그인이 필요합니다.'], ['AUTH_TOKEN_EXPIRED','로그인이 필요합니다.'],
])('%s를 한국어 안내로 바꾼다', (code,message)=>expect(messageFor(new ApiError(400,code,'raw message'))).toBe(message))
it('알 수 없는 한국어 안내만 보존하고 영문·코드·빈 값·일반 예외는 숨긴다', ()=>{
 expect(messageFor(new ApiError(400,'UNKNOWN','다시 확인해주세요.'))).toBe('다시 확인해주세요.')
 for(const error of [new TypeError('x'),new ApiError(500,'INTERNAL_SERVER_ERROR','Internal error'),new ApiError(400,'UNKNOWN','RAW_CODE'),new ApiError(400,'UNKNOWN',''),null]) expect(messageFor(error)).toBe(createContractError().message)
})
