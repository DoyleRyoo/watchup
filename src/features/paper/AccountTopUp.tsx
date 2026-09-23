import type { ApiError } from '../../api/errors'
import { getToastSessionVersion, useToastStore } from '../../stores/toastStore'
import { messageFor } from './errorMessages'
import { sanitizeIntegerInput } from "./numericInput";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { usePaperStore } from "../../stores/paperStore";

/**
 * Top-up form (FE-BE-05). The balance readout the mockup shows lives in
 * `AccountSummary`; this component owns the `GET /api/paper/account` fetch that
 * feeds it, so the numbers are not duplicated on screen.
 */
export function AccountTopUp() {
  const [amountKrw, setAmountKrw] = useState("");
  const [mutationError, setMutationError] = useState<ApiError | null>(null);
  const [pendingMutation, setPendingMutation] = useState(false);
  const loading = usePaperStore((state) => state.loading);
  const error = usePaperStore((state) => state.error);
  const loadAccount = usePaperStore((state) => state.loadAccount);
  const topUp = usePaperStore((state) => state.topUp);

  useEffect(() => {
    void loadAccount();
  }, [loadAccount]);

  const valid = /^[1-9][0-9]*$/.test(amountKrw);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!valid || loading || pendingMutation) return;
    const key = crypto.randomUUID();
    const sessionVersion = getToastSessionVersion();
    setPendingMutation(true);
    setMutationError(null);
    try {
      await topUp(amountKrw, key);
      if (sessionVersion !== getToastSessionVersion()) return;
      setAmountKrw("");
      await usePaperStore.getState().refreshPortfolio();
      if (sessionVersion === getToastSessionVersion()) useToastStore.getState().show("success", "충전 완료");
    } catch (requestError) {
      if (sessionVersion === getToastSessionVersion()) {
        setMutationError(usePaperStore.getState().error);
        useToastStore.getState().show("error", messageFor(requestError));
      }
    } finally {
      setPendingMutation(false);
    }
  };

  return (
    <section
      className="dashboard-panel account-panel"
      aria-labelledby="paper-account-heading"
    >
      <h2 id="paper-account-heading">모의투자 충전</h2>
      {error && <div role={pendingMutation || error === mutationError ? undefined : "alert"}><p>{pendingMutation || error === mutationError ? messageFor(error) : error.message}</p><button type="button" className="text-button" onClick={() => void loadAccount()}>계좌 다시 조회</button></div>}
      <form className="top-up-form" onSubmit={(event) => void submit(event)}>
        <label htmlFor="top-up-amount">충전 금액</label>
        <div className="top-up-controls">
          <input
            id="top-up-amount"
            name="amountKrw"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            enterKeyHint="done"
            placeholder="충전할 금액을 입력하세요"
            value={amountKrw}
            onChange={(event) => setAmountKrw(sanitizeIntegerInput(event.target.value))}
            disabled={loading}
          />
          <button type="submit" disabled={loading || pendingMutation || !valid}>
            {loading ? "처리 중" : "충전"}
          </button>
        </div>
      </form>
    </section>
  );
}
