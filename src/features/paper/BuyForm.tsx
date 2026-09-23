import { getToastSessionVersion, useToastStore } from '../../stores/toastStore'
import { messageFor } from './errorMessages'
import type { CoinChart } from '../watchup/types'
import { estimateAmountFromQuantity, estimateQuantityFromAmount } from './estimate'
import { sanitizeDecimalInput, sanitizeIntegerInput } from './numericInput'
import { useState, type FormEvent } from 'react'
import { usePaperStore } from '../../stores/paperStore'
import { groupDigits, formatKrw, formatQuantity } from './format'

type Props = { currentPrice: string | null; priceStatus: CoinChart['priceStatus']; marketCode: string; disabled: boolean; onSuccess: () => void }

// Quantity BUY sends exact input; reference-price estimates are display-only.
export function BuyForm({ marketCode, disabled, onSuccess, currentPrice, priceStatus }: Props) {
  const [mode, setMode] = useState<'amount' | 'quantity'>('amount')
  const [values, setValues] = useState({ amount: '', quantity: '' })
  const value = values[mode]
  const [focused, setFocused] = useState(false)
  const submitting = usePaperStore((state) => state.tradeSubmitting)
  const postTrade = usePaperStore((state) => state.postTrade)
  const cash = usePaperStore((state) => state.cashBalanceKrw)
  const account = usePaperStore((state) => state.account)
  const valid = mode === 'amount' ? /^[1-9][0-9]*$/.test(value) : /^(?:0|[1-9][0-9]*)(?:\.[0-9]{1,18})?$/.test(value) && /[1-9]/.test(value)
  const estimate = valid && currentPrice !== null && priceStatus !== 'PRICE_ERROR'
    ? mode === 'amount' ? estimateQuantityFromAmount(value, currentPrice) : estimateAmountFromQuantity(value, currentPrice)
    : null
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!valid || disabled || submitting) return
    const sessionVersion = getToastSessionVersion()
    try {
      await postTrade(mode === 'amount' ? { marketCode, side: 'BUY', amountKrw: value } : { marketCode, side: 'BUY', quantity: value }, crypto.randomUUID())
      if (sessionVersion !== getToastSessionVersion()) return
      setValues({ amount: '', quantity: '' })
      onSuccess()
    } catch (error) {
      if (sessionVersion === getToastSessionVersion()) useToastStore.getState().show('error', messageFor(error))
    }
  }
  return <form className="trade-form buy-form" onSubmit={(event) => void submit(event)}>
    <div className="trade-input-group">
      <p className="trade-side-chip">구매</p>
      <div className="trade-mode" role="group" aria-label="구매 입력 단위">
        <button type="button" aria-pressed={mode === 'quantity'} onClick={() => setMode('quantity')} disabled={submitting}>수량</button><span aria-hidden="true">|</span><button type="button" aria-pressed={mode === 'amount'} onClick={() => setMode('amount')} disabled={submitting}>금액</button>
      </div>
      <label className="trade-value-field">
        <span className="sr-only">{mode === 'amount' ? '매수 금액 (원)' : '매수 수량'}</span>
        <input name={mode === 'amount' ? 'amountKrw' : 'quantity'} type="text" inputMode={mode === 'amount' ? 'numeric' : 'decimal'} placeholder={mode === 'amount' ? '얼마나 구매할까요?' : '몇 코인 구매할까요?'} value={focused || !valid ? value : `${groupDigits(value)}${mode === 'amount' ? '원' : '개'}`} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onChange={(event) => setValues({ ...values, [mode]: (mode === 'amount' ? sanitizeIntegerInput : sanitizeDecimalInput)(event.target.value) })} disabled={disabled || submitting} autoComplete="off" />
      </label>
      <p className="trade-hint">구매 가능 {formatKrw(cash ?? account?.cashBalanceKrw ?? null, '조회 중')}</p>
      {estimate !== null && <p className="trade-estimate" aria-live="polite">{mode === 'amount' ? `약 ${formatQuantity(estimate)}개 구매 가능` : `약 ${formatKrw(estimate)} 필요`}</p>}
      <p className="trade-note">{priceStatus === 'STALE' && '지연된 시세 기준. '}실제 체결 수량은 주문 시점 시세로 서버가 계산합니다.</p>
    </div>
    <button type="submit" aria-current="true" className="trade-submit buy" disabled={disabled || submitting || !valid}>{submitting ? '구매 중' : '구매하기'}</button>
  </form>
}
