import { useState, type FormEvent } from 'react'
import { usePaperStore } from '../../stores/paperStore'
import { formatDecimalString, formatKrw } from './format'

type Props = { marketCode: string; disabled: boolean; onSuccess: () => void }

// Quantity BUY uses the explicitly approved server contract; no client price math.
export function BuyForm({ marketCode, disabled, onSuccess }: Props) {
  const [mode, setMode] = useState<'amount' | 'quantity'>('amount')
  const [values, setValues] = useState({ amount: '', quantity: '' })
  const value = values[mode]
  const [focused, setFocused] = useState(false)
  const submitting = usePaperStore((state) => state.tradeSubmitting)
  const postTrade = usePaperStore((state) => state.postTrade)
  const cash = usePaperStore((state) => state.cashBalanceKrw)
  const account = usePaperStore((state) => state.account)
  const valid = mode === 'amount' ? /^[1-9][0-9]*$/.test(value) : /^(?:0|[1-9][0-9]*)(?:\.[0-9]{1,18})?$/.test(value) && /[1-9]/.test(value)
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!valid || disabled || submitting) return
    try {
      await postTrade(mode === 'amount' ? { marketCode, side: 'BUY', amountKrw: value } : { marketCode, side: 'BUY', quantity: value }, crypto.randomUUID())
      setValues({ amount: '', quantity: '' })
      onSuccess()
    } catch { /* The store exposes the server error; keep input for retry. */ }
  }
  return <form className="trade-form buy-form" onSubmit={(event) => void submit(event)}>
    <div className="trade-input-group">
      <div className="trade-mode" role="group" aria-label="구매 입력 단위">
        <button type="button" aria-pressed={mode === 'quantity'} onClick={() => setMode('quantity')} disabled={submitting}>수량</button><span aria-hidden="true">|</span><button type="button" aria-pressed={mode === 'amount'} onClick={() => setMode('amount')} disabled={submitting}>금액</button>
      </div>
      <label className="trade-value-field">
        <span className="sr-only">{mode === 'amount' ? '매수 금액 (원)' : '매수 수량'}</span>
        <input name={mode === 'amount' ? 'amountKrw' : 'quantity'} type="text" inputMode={mode === 'amount' ? 'numeric' : 'decimal'} placeholder={mode === 'amount' ? '얼마나 구매할까요?' : '몇 코인 구매할까요?'} value={focused || !valid ? value : `${formatDecimalString(value)}${mode === 'amount' ? '원' : '개'}`} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onChange={(event) => setValues({ ...values, [mode]: event.target.value.replace(/[,원개]/g, '') })} disabled={disabled || submitting} autoComplete="off" />
      </label>
      <p className="trade-hint">구매 가능 {formatKrw(cash ?? account?.cashBalanceKrw ?? null, '조회 중')}</p>
    </div>
    <button type="submit" className="trade-submit buy" disabled={disabled || submitting || !valid}>{submitting ? '구매 중' : '구매하기'}</button>
  </form>
}
