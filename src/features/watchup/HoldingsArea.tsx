import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePaperStore } from "../../stores/paperStore";

export function HoldingsArea() {
  const navigate = useNavigate();
  const holdings = usePaperStore((state) => state.holdings);
  const totals = usePaperStore((state) => state.totals);
  const status = usePaperStore((state) => state.valuationStatus);
  const loading = usePaperStore((state) => state.portfolioLoading);
  const error = usePaperStore((state) => state.portfolioError);
  const refresh = usePaperStore((state) => state.refreshPortfolio);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <section
      className="dashboard-panel holdings-area"
      aria-labelledby="holdings-title"
    >
      <div className="section-heading">
        <h2 id="holdings-title">보유 자산</h2>
        {status && <span>{status}</span>}
      </div>
      {loading && holdings.length === 0 && (
        <p role="status">보유 자산을 불러오는 중입니다.</p>
      )}
      {error && (
        <div role="alert">
          <p>보유 자산을 불러오지 못했습니다. 기존 정보를 표시합니다.</p>
          <button type="button" onClick={() => void refresh()}>
            다시 시도
          </button>
        </div>
      )}
      {status === "PARTIAL" && (
        <p role="status">일부 가격을 조회할 수 없습니다.</p>
      )}
      {!loading && holdings.length === 0 && !error && (
        <p>보유 중인 자산이 없습니다.</p>
      )}
      {holdings.length > 0 && (
        <ul className="holdings-list">
          {holdings.map((holding) => (
            <li key={holding.marketCode}>
              <button
                type="button"
                onClick={() => navigate(`/coins/${holding.marketCode}`)}
              >
                <span>{holding.koreanName || holding.marketCode}</span>
                <span>{holding.quantity}</span>
                <span>
                  {holding.valueKrw === null
                    ? "평가 불가"
                    : `${holding.valueKrw}원`}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <dl className="holdings-totals">
        <div>
          <dt>총 자산</dt>
          <dd>
            {totals?.totalAssetsKrw == null
              ? "-"
              : `${totals.totalAssetsKrw}원`}
          </dd>
        </div>
        <div>
          <dt>총 손익</dt>
          <dd>
            {totals?.totalPnlKrw == null ? "-" : `${totals.totalPnlKrw}원`}
          </dd>
        </div>
        <div>
          <dt>누적 실현 손익</dt>
          <dd>{totals ? `${totals.totalRealizedPnlKrw}원` : "-"}</dd>
        </div>
      </dl>
    </section>
  );
}
