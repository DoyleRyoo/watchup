import { useState } from "react";
import type { FormEvent } from "react";
import { usePaperStore } from "../../stores/paperStore";

type Props = { marketCode: string; disabled: boolean; onSuccess: () => void };

export function BuyForm({ marketCode, disabled, onSuccess }: Props) {
  const [amountKrw, setAmountKrw] = useState("");
  const submitting = usePaperStore((state) => state.tradeSubmitting);
  const postTrade = usePaperStore((state) => state.postTrade);
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
    <form onSubmit={(event) => void submit(event)}>
      <label>
        매수 금액 (원)
        <input
          aria-label="매수 금액 (원)"
          name="amountKrw"
          type="text"
          inputMode="numeric"
          value={amountKrw}
          onChange={(event) => setAmountKrw(event.target.value)}
          disabled={disabled || submitting}
        />
      </label>
      <button type="submit" disabled={disabled || submitting || !amountKrw}>
        매수
      </button>
    </form>
  );
}
