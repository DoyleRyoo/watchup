import { getToastSessionVersion, useToastStore } from '../../stores/toastStore'
import { messageFor } from './errorMessages'
import type { CoinChart } from "../watchup/types";
import { estimateAmountFromQuantity } from "./estimate";
import { sanitizeDecimalInput } from "./numericInput";
import { useState } from "react";
import type { FormEvent } from "react";
import { usePaperStore } from "../../stores/paperStore";
import { formatQuantity, formatKrw } from "./format";

type Props = {
  currentPrice: string | null;
  priceStatus: CoinChart["priceStatus"];
  marketCode: string;
  disabled: boolean;
  availableQuantity: string;
  onSuccess: () => void;
};

/**
 * Mockup "판매하기" (blue). Rendered only while a position exists — the
 * `chart_not_have` mockup is this component absent at quantity 0, not a second
 * layout. The server re-validates regardless (INSUFFICIENT_HOLDING_QUANTITY).
 */
export function SellForm({
  marketCode,
  disabled,
  availableQuantity,
  currentPrice,
  priceStatus,
  onSuccess,
}: Props) {
  const [quantity, setQuantity] = useState("");
  const submitting = usePaperStore((state) => state.tradeSubmitting);
  const postTrade = usePaperStore((state) => state.postTrade);
  const valid = /^(?:0|[1-9][0-9]*)(?:\.[0-9]{1,18})?$/.test(quantity) && /[1-9]/.test(quantity);
  const estimate = valid && currentPrice !== null && priceStatus !== "PRICE_ERROR" ? estimateAmountFromQuantity(quantity, currentPrice) : null;
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!valid || disabled || submitting) return;
    const sessionVersion = getToastSessionVersion();
    try {
      await postTrade(
        { marketCode, side: "SELL", quantity },
        crypto.randomUUID(),
      );
      if (sessionVersion !== getToastSessionVersion()) return;
      setQuantity("");
      onSuccess();
    } catch (error) {
      if (sessionVersion === getToastSessionVersion()) useToastStore.getState().show('error', messageFor(error));
    }
  };
  return (
    <form className="trade-form sell-form" onSubmit={(event) => void submit(event)}>
      <div className="trade-input-group">
      <p className="trade-side-chip">판매</p><label>
        매도 수량
        <input
          aria-label="매도 수량"
          name="quantity"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          enterKeyHint="done"
          placeholder="몇 코인 판매할까요?"
          value={quantity}
          onChange={(event) => setQuantity(sanitizeDecimalInput(event.target.value))}
          disabled={disabled || submitting}
        />
      </label>
      <p className="trade-hint">
        판매 가능 {formatQuantity(availableQuantity)}개
      </p>
      {estimate !== null && <p className="trade-estimate" aria-live="polite">약 {formatKrw(estimate)} 수령 예상</p>}
      <p className="trade-note">{priceStatus === 'STALE' && '지연된 시세 기준. '}실제 체결 수량은 주문 시점 시세로 서버가 계산합니다.</p>
      </div>
      <button
        type="submit"
        aria-current="true"
        className="trade-submit sell"
        disabled={disabled || submitting || !valid}
      >
        판매하기
      </button>
    </form>
  );
}
