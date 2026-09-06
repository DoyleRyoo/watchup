import { useState } from "react";
import type { FormEvent } from "react";
import { usePaperStore } from "../../stores/paperStore";
import { formatDecimalString } from "./format";

type Props = {
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
  onSuccess,
}: Props) {
  const [quantity, setQuantity] = useState("");
  const submitting = usePaperStore((state) => state.tradeSubmitting);
  const postTrade = usePaperStore((state) => state.postTrade);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!quantity || disabled || submitting) return;
    try {
      await postTrade(
        { marketCode, side: "SELL", quantity },
        crypto.randomUUID(),
      );
      setQuantity("");
      onSuccess();
    } catch {
      /* store renders the error */
    }
  };
  return (
    <form className="trade-form sell-form" onSubmit={(event) => void submit(event)}>
      <div className="trade-input-group"><label>
        매도 수량
        <input
          aria-label="매도 수량"
          name="quantity"
          type="text"
          inputMode="decimal"
          placeholder="몇 코인 판매할까요?"
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          disabled={disabled || submitting}
        />
      </label>
      <p className="trade-hint">
        판매 가능 {formatDecimalString(availableQuantity)}개
      </p>
      </div>
      <button
        type="submit"
        className="trade-submit sell"
        disabled={disabled || submitting || !quantity}
      >
        판매하기
      </button>
    </form>
  );
}
