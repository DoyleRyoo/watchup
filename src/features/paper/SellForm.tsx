import { useState } from "react";
import type { FormEvent } from "react";
import { usePaperStore } from "../../stores/paperStore";

type Props = { marketCode: string; disabled: boolean; onSuccess: () => void };

export function SellForm({ marketCode, disabled, onSuccess }: Props) {
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
    <form onSubmit={(event) => void submit(event)}>
      <label>
        매도 수량
        <input
          aria-label="매도 수량"
          name="quantity"
          type="text"
          inputMode="decimal"
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          disabled={disabled || submitting}
        />
      </label>
      <button type="submit" disabled={disabled || submitting || !quantity}>
        매도
      </button>
    </form>
  );
}
