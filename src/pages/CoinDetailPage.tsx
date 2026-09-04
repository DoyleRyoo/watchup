import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ApiError, createContractError } from "../api/errors";
import { ThemeToggle } from "../components/ThemeToggle";
import { BuyForm } from "../features/paper/BuyForm";
import {
  formatDecimalString,
  formatKrw,
  formatSignedKrw,
  signClass,
} from "../features/paper/format";
import { SellForm } from "../features/paper/SellForm";
import { getCoinChart } from "../features/watchup/api";
import { PriceChart } from "../features/watchup/PriceChart";
import type { CoinChart } from "../features/watchup/types";
import { usePaperStore } from "../stores/paperStore";

const DETAIL_ERROR_LINES = [
  "코인 정보를 불러오지 못했습니다.",
  "잠시 후 다시 시도해주세요.",
];

type DetailResult = {
  marketCode: string;
  chart: CoinChart | null;
  error: ApiError | null;
};

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function asApiError(error: unknown): ApiError {
  return error instanceof ApiError ? error : createContractError();
}

function marketStatusLabel(status: CoinChart["marketStatus"]): string {
  if (status === "CAUTION") return "투자 유의";
  if (status === "UNAVAILABLE") return "거래 불가";
  return "거래 가능";
}

function priceStatusLabel(status: CoinChart["priceStatus"]): string {
  if (status === "STALE") return "지연 가격";
  if (status === "PRICE_ERROR") return "가격 조회 실패";
  return "최신 가격";
}

function displaySymbol(marketCode: string): string {
  return marketCode.startsWith("KRW-") && marketCode.length > 4
    ? marketCode.slice(4)
    : marketCode;
}

export function CoinDetailPage() {
  const { marketCode } = useParams<{ marketCode: string }>();
  const [result, setResult] = useState<DetailResult | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const cashBalanceKrw = usePaperStore((state) => state.cashBalanceKrw);
  const account = usePaperStore((state) => state.account);
  const holdings = usePaperStore((state) => state.holdings);
  const portfolioError = usePaperStore((state) => state.portfolioError);
  const tradeError = usePaperStore((state) => state.tradeError);
  const refreshPortfolio = usePaperStore((state) => state.refreshPortfolio);

  useEffect(() => {
    void refreshPortfolio();
  }, [marketCode, refreshPortfolio]);
  useEffect(() => {
    if (!marketCode) return;
    const controller = new AbortController();

    void getCoinChart(marketCode, controller.signal)
      .then((response) => {
        if (controller.signal.aborted) return;
        if (response.data.marketCode !== marketCode) {
          setResult({ marketCode, chart: null, error: createContractError() });
          return;
        }
        setResult({ marketCode, chart: response.data, error: null });
      })
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted && !isAbortError(requestError)) {
          setResult({
            marketCode,
            chart: null,
            error: asApiError(requestError),
          });
        }
      });

    return () => controller.abort();
  }, [marketCode, refreshNonce]);

  const activeResult = result?.marketCode === marketCode ? result : null;
  const loading = Boolean(marketCode) && activeResult === null;
  const error = marketCode
    ? (activeResult?.error ?? null)
    : createContractError();
  const chart = activeResult?.chart ?? null;
  const holding = holdings.find((item) => item.marketCode === marketCode);

  return (
    <main className="app-shell">
      <header className="app-header detail-header">
        <Link className="icon-button back-link" to="/" aria-label="검색으로 돌아가기">
          <svg width="23" height="18" viewBox="0 0 23 18" aria-hidden="true" focusable="false">
            <path
              d="M9 1 1 9l8 8M1 9h21"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
        <div className="header-actions">
          <ThemeToggle />
        </div>
      </header>

      <section
        className="dashboard-panel detail-area"
        aria-labelledby="detail-title"
      >
        <h2 id="detail-title">코인 상세</h2>
        {loading && <p role="status" className="status-message">코인 정보를 불러오는 중입니다.</p>}
        {error && (
          <div role="alert" className="status-message error-message">
            {DETAIL_ERROR_LINES.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        )}

        {!loading && !error && chart && (
          <div className="coin-detail">
            <div className="coin-headline">
              <h3 className="coin-row-title">
                <span className="coin-name">{chart.koreanName}</span>
                <span className="coin-symbol">
                  {displaySymbol(chart.marketCode)}
                </span>
              </h3>
              <p className="coin-price">
                {chart.currentPrice === null
                  ? "조회 불가"
                  : formatKrw(chart.currentPrice)}
              </p>
              {holding && (
                <p
                  className={`coin-pnl ${signClass(holding.unrealizedPnlKrw)}`}
                >
                  {formatSignedKrw(holding.unrealizedPnlKrw, "평가 불가")}
                </p>
              )}
              <span
                className={`status-badge ${chart.marketStatus === "CAUTION" ? "caution-badge" : ""}`}
              >
                {marketStatusLabel(chart.marketStatus)}
              </span>
            </div>

            <dl className="detail-metrics">
              <div>
                <dt>영문명</dt>
                <dd>{chart.englishName}</dd>
              </div>
              <div>
                <dt>마켓 코드</dt>
                <dd>{chart.marketCode}</dd>
              </div>
              <div>
                <dt>가격 상태</dt>
                <dd>
                  {priceStatusLabel(chart.priceStatus)} ({chart.priceStatus})
                </dd>
              </div>
              <div>
                <dt>사용 가능 현금</dt>
                <dd>{formatKrw(cashBalanceKrw ?? account?.cashBalanceKrw ?? null, "조회 중")}</dd>
              </div>
              <div>
                <dt>보유 수량</dt>
                <dd>{formatDecimalString(holding?.quantity ?? "0")}</dd>
              </div>
            </dl>

            <div className="chart-area" aria-labelledby="chart-title">
              <h3 id="chart-title">최근 30일 가격</h3>
              {chart.candles.length === 0 ? (
                <p className="chart-empty">차트를 이용할 수 없습니다.</p>
              ) : (
                <PriceChart chart={chart} />
              )}
            </div>

            <div className="trade-panel" aria-label="거래 입력">
              <BuyForm
                marketCode={chart.marketCode}
                disabled={chart.marketStatus === "UNAVAILABLE"}
                onSuccess={() => setRefreshNonce((value) => value + 1)}
              />
              {holding && (
                <SellForm
                  marketCode={chart.marketCode}
                  disabled={chart.marketStatus === "UNAVAILABLE"}
                  availableQuantity={holding.quantity}
                  onSuccess={() => setRefreshNonce((value) => value + 1)}
                />
              )}
            </div>
            {portfolioError && (
              <p role="alert">보유 자산을 갱신하지 못했습니다.</p>
            )}
            {tradeError && <p role="alert">{tradeError.message}</p>}
          </div>
        )}
      </section>
    </main>
  );
}
