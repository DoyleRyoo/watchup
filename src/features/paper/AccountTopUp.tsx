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
  const loading = usePaperStore((state) => state.loading);
  const error = usePaperStore((state) => state.error);
  const loadAccount = usePaperStore((state) => state.loadAccount);
  const topUp = usePaperStore((state) => state.topUp);

  useEffect(() => {
    void loadAccount();
  }, [loadAccount]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!amountKrw || loading) return;
    const key = crypto.randomUUID();
    try {
      await topUp(amountKrw, key);
      setAmountKrw("");
      await usePaperStore.getState().refreshPortfolio();
    } catch {
      // Store exposes the API error in the rendered alert.
    }
  };

  return (
    <section
      className="dashboard-panel account-panel"
      aria-labelledby="paper-account-heading"
    >
      <h2 id="paper-account-heading">모의투자 충전</h2>
      {error && <div role="alert"><p>{error.message}</p><button type="button" className="text-button" onClick={() => void loadAccount()}>계좌 다시 조회</button></div>}
      <form className="top-up-form" onSubmit={(event) => void submit(event)}>
        <label htmlFor="top-up-amount">충전 금액</label>
        <div className="top-up-controls">
          <input
            id="top-up-amount"
            name="amountKrw"
            type="text"
            inputMode="numeric"
            placeholder="충전할 금액을 입력하세요"
            value={amountKrw}
            onChange={(event) => setAmountKrw(event.target.value)}
            disabled={loading}
          />
          <button type="submit" disabled={loading || !amountKrw}>
            {loading ? "처리 중" : "충전"}
          </button>
        </div>
      </form>
    </section>
  );
}
