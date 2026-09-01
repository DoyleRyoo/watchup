import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ApiError, createContractError } from "../api/errors";
import { BuyForm } from "../features/paper/BuyForm";
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

export function CoinDetailPage() {
  const { marketCode } = useParams<{ marketCode: string }>();
  const [result, setResult] = useState<DetailResult | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const account = usePaperStore((state) => state.account);
  const tradeError = usePaperStore((state) => state.tradeError);
  const loadAccount = usePaperStore((state) => state.loadAccount);

  useEffect(() => {
    void loadAccount();
  }, [loadAccount]);

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

  return (
    <main className="app-shell">
      <header className="app-header">
        <h1>WatchUp</h1>
        <Link className="back-link" to="/">
          검색으로 돌아가기
        </Link>
      </header>

      <section
        className="dashboard-panel detail-area"
        aria-labelledby="detail-title"
      >
        <h2 id="detail-title">코인 상세</h2>
        {loading && <p role="status">코인 정보를 불러오는 중입니다.</p>}
        {error && (
          <div role="alert" className="status-message error-message">
            {DETAIL_ERROR_LINES.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        )}

        {!loading && !error && chart && (
          <div className="coin-detail">
            <div className="detail-heading">
              <div>
                <h3>
                  {chart.koreanName} <span>{chart.englishName}</span>
                </h3>
                <p>{chart.marketCode}</p>
              </div>
              <span
                className={`status-badge ${chart.marketStatus === "CAUTION" ? "caution-badge" : ""}`}
              >
                {marketStatusLabel(chart.marketStatus)}
              </span>
            </div>

            <dl className="detail-metrics">
              <div>
                <dt>현재가</dt>
                <dd>
                  {chart.currentPrice === null
                    ? "조회 불가"
                    : `${chart.currentPrice}원`}
                </dd>
              </div>
              <div>
                <dt>가격 상태</dt>
                <dd>
                  {priceStatusLabel(chart.priceStatus)} ({chart.priceStatus})
                </dd>
              </div>
              <div>
                <dt>사용 가능 현금</dt>
                <dd>{account ? `${account.cashBalanceKrw}원` : "조회 중"}</dd>
              </div>
              <div>
                <dt>보유 수량</dt>
                <dd>0</dd>
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

            <div className="trade-placeholders" aria-label="거래 입력">
              <BuyForm
                marketCode={chart.marketCode}
                disabled={chart.marketStatus === "UNAVAILABLE"}
                onSuccess={() => setRefreshNonce((value) => value + 1)}
              />
              <SellForm
                marketCode={chart.marketCode}
                disabled={true}
                onSuccess={() => setRefreshNonce((value) => value + 1)}
              />
            </div>
            {tradeError && <p role="alert">{tradeError.message}</p>}
          </div>
        )}
      </section>
    </main>
  );
}
