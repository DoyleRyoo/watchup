import { useState } from "react";
import type { FormEvent } from "react";
import { usePaperStore } from "../../stores/paperStore";
import { formatKrw } from "./format";

type Props = { marketCode: string; disabled: boolean; onSuccess: () => void };

/**
 * Mockup "구매하기" (red). FE-BE-06 BUY takes `amountKrw` only — the mockup's
 * 수량|금액 toggle has no quantity-side contract, and converting a quantity
 * with the displayed price would send a reference price into a trade (§5), so
 * BUY stays amount-only and SELL stays quantity-only.
 */
export function BuyForm({ marketCode, disabled, onSuccess }: Props) {
  const [amountKrw, setAmountKrw] = useState("");
  const submitting = usePaperStore((state) => state.tradeSubmitting);
  const postTrade = usePaperStore((state) => state.postTrade);
  const cashBalanceKrw = usePaperStore((state) => state.cashBalanceKrw);
  const account = usePaperStore((state) => state.account);
  const available = cashBalanceKrw ?? account?.cashBalanceKrw ?? null;
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!amountKrw || disabled || submitting) return;
    try {
      await postTrade(
        { marketCode, side: "BUY", amountKrw },
        crypto.randomUUID(),
      );
      setAmountKrw("");
      onSuccess();
    } catch {
      /* store renders the error */
    }
  };
  return (
    <form className="trade-form buy-form" onSubmit={(event) => void submit(event)}>
      <label>
        매수 금액 (원)
        <input
          aria-label="매수 금액 (원)"
          name="amountKrw"
          type="text"
          inputMode="numeric"
          placeholder="얼마나 구매할까요?"
          value={amountKrw}
          onChange={(event) => setAmountKrw(event.target.value)}
          disabled={disabled || submitting}
        />
      </label>
      <p className="trade-hint">구매 가능 {formatKrw(available, "조회 중")}</p>
      <button
        type="submit"
        className="trade-submit buy"
        disabled={disabled || submitting || !amountKrw}
      >
        구매하기
      </button>
    </form>
  );
}
