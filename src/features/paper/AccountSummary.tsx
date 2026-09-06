import { usePaperStore } from "../../stores/paperStore";
import {
  formatKrw,
  formatPnlWithRate,
  signClass,
} from "./format";

/**
 * Mockup asset-summary block ("내 자산" / "누적 충전" / "보유 현금").
 *
 * Presentational: it reads the store only. `GET /api/paper/account` is issued
 * by the header `AccountTopUp` and `GET /api/paper/portfolio` by `HoldingsArea`, both
 * mounted in the shared dashboard — no duplicate request is added.
 *
 * The mockup's "첫 투자금" has no backing field in FE-BE-04/07 (principal would
 * need INITIAL_GRANT + lifetimeTopUp arithmetic on money, which §5 forbids), so
 * the slot renders `account.lifetimeTopUpKrw` under its true label, 누적 충전.
 */
export function AccountSummary() {
  const account = usePaperStore((state) => state.account);
  const cash = usePaperStore((state) => state.cashBalanceKrw);
  const totals = usePaperStore((state) => state.totals);
  const valuationStatus = usePaperStore((state) => state.valuationStatus);

  const pending = totals === null && account === null;

  return (
    <section className="account-summary" aria-labelledby="summary-title">
      <h2 id="summary-title" className="sr-only">
        자산 요약
      </h2>
      {pending && <p className="status-message">자산을 불러오는 중입니다.</p>}
      <dl className="summary-primary">
        <dt>내 자산</dt>
        <dd>{formatKrw(totals?.totalAssetsKrw ?? null, "평가 중")}</dd>
      </dl>
      <p className={`summary-pnl ${signClass(totals?.totalPnlKrw ?? null)}`}>
        {formatPnlWithRate(
          totals?.totalPnlKrw ?? null,
          totals?.totalReturnRate ?? null,
          "평가 중",
        )}
      </p>
      {valuationStatus === "PARTIAL" && (
        <p className="summary-status">일부 가격을 조회할 수 없어 총액을 계산하지 못했습니다.</p>
      )}
      <dl className="summary-secondary">
        <div>
          <dt>누적 충전</dt>
          <dd>{formatKrw(account?.lifetimeTopUpKrw ?? null, "조회 중")}</dd>
        </div>
        <div>
          <dt>보유 현금</dt>
          <dd>{formatKrw(cash ?? account?.cashBalanceKrw ?? null, "조회 중")}</dd>
        </div>

      </dl>
    </section>
  );
}
