import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  formatQuantity,
  formatKrw,
  formatSignedKrw,
  signClass,
} from "../paper/format";
import { usePaperStore } from "../../stores/paperStore";

/**
 * Mockup coin list. Row spec: 코인명(16) + 심볼(10, sub) on one line, 보유
 * 수량(10, sub) below; right-aligned 평가금액(16) over 평가손익(10, up-red /
 * down-blue). Length is whatever `GET /api/paper/portfolio` returns.
 *
 * The mockup's "(2.03%)" beside the row PnL has no per-holding rate field in
 * FE-BE-07, and deriving one needs avgPrice/currentPrice arithmetic on money,
 * so the row shows the contract-backed `unrealizedPnlKrw` amount only.
 *
 * Portfolio totals are rendered once, by `AccountSummary`.
 */
export function HoldingsArea({ selectedMarketCode, onSelect }: { selectedMarketCode?: string; onSelect?: () => void }) {
  const navigate = useNavigate();
  const holdings = usePaperStore((state) => state.holdings);
  const status = usePaperStore((state) => state.valuationStatus);
  const loading = usePaperStore((state) => state.portfolioLoading);
  const error = usePaperStore((state) => state.portfolioError);
  const refresh = usePaperStore((state) => state.refreshPortfolio);

  useEffect(() => {
    void refresh();
  }, [refresh, selectedMarketCode]);

  return (
    <section
      className="dashboard-panel holdings-area"
      aria-labelledby="holdings-title"
    >
      <div className="section-heading">
        <h2 id="holdings-title">코인</h2>

      </div>
      {loading && holdings.length === 0 && (
        <p role="status" className="status-message">
          보유 자산을 불러오는 중입니다.
        </p>
      )}
      {error && (
        <div role="alert">
          <p>보유 자산을 불러오지 못했습니다. 기존 정보를 표시합니다.</p>
          <button type="button" className="text-button" onClick={() => void refresh()}>
            다시 시도
          </button>
        </div>
      )}
      {status === "STALE" && <p role="status" className="status-message">지연된 가격으로 평가한 자산입니다.</p>}
      {status === "PARTIAL" && (
        <p role="status" className="status-message">
          일부 가격을 조회할 수 없습니다.
        </p>
      )}
      {!loading && holdings.length === 0 && !error && (
        <div className="empty-state">
          <p>보유 중인 자산이 없습니다.</p>
        </div>
      )}
      {holdings.length > 0 && (
        <ul className="holdings-list">
          {holdings.map((holding) => (
            <li key={holding.marketCode}>
              <button
                type="button"
                className={`coin-row${selectedMarketCode === holding.marketCode ? ' selected' : ''}`}
                aria-current={selectedMarketCode === holding.marketCode ? 'page' : undefined}
                onClick={() => { navigate(`/coins/${holding.marketCode}`); onSelect?.(); }}
              >
                <span className="coin-row-main">
                  <span className="coin-row-title">
                    <span className="coin-name">
                      {holding.koreanName || holding.marketCode}
                    </span>
                    <span className="coin-symbol">{holding.marketCode}</span>
                  </span>
                  <span className="coin-row-sub">
                    {formatQuantity(holding.quantity)}코인
                    {holding.priceStatus === "STALE" && " · 지연 가격"}
                  </span>
                </span>
                <span className="coin-row-side">
                  <span className="coin-row-value">
                    {formatKrw(holding.valueKrw, "평가 불가")}
                  </span>
                  <span
                    className={`coin-row-change ${signClass(holding.unrealizedPnlKrw)}`}
                  >
                    {formatSignedKrw(holding.unrealizedPnlKrw, "-")}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
