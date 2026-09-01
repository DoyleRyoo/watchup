import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { usePaperStore } from "../../stores/paperStore";

export function AccountTopUp() {
  const [amountKrw, setAmountKrw] = useState("");
  const account = usePaperStore((state) => state.account);
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
    } catch {
      // Store exposes the API error in the rendered alert.
    }
  };

  return (
    <section
      className="dashboard-panel account-panel"
      aria-labelledby="paper-account-heading"
    >
      <h2 id="paper-account-heading">모의투자 계좌</h2>
      {account && (
        <dl className="account-summary">
          <div>
            <dt>보유 현금</dt>
            <dd>{account.cashBalanceKrw}원</dd>
          </div>
          <div>
            <dt>누적 충전</dt>
            <dd>{account.lifetimeTopUpKrw}원</dd>
          </div>
        </dl>
      )}
      {!account && loading && (
        <p className="status-message">계좌를 불러오는 중입니다.</p>
      )}
      {error && <p role="alert">{error.message}</p>}
      <form className="top-up-form" onSubmit={(event) => void submit(event)}>
        <label htmlFor="top-up-amount">충전 금액</label>
        <div className="search-controls">
          <input
            id="top-up-amount"
            name="amountKrw"
            type="text"
            inputMode="numeric"
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
