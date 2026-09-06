import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ApiError, createContractError } from "../api/errors";
import { DashboardLayout } from "../components/DashboardLayout";
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

export function CoinDetailPage() {
  const { marketCode } = useParams<{ marketCode: string }>();
  const [result, setResult] = useState<DetailResult | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [tradeView, setTradeView] = useState<{ marketCode: string; side: 'BUY' | 'SELL' } | null>(null);
  const side = tradeView && tradeView.marketCode === marketCode ? tradeView.side : null;
  const cashBalanceKrw = usePaperStore((state) => state.cashBalanceKrw);
  const account = usePaperStore((state) => state.account);
  const holdings = usePaperStore((state) => state.holdings);
  const portfolioError = usePaperStore((state) => state.portfolioError);
  const tradeError = usePaperStore((state) => state.tradeError);
  const refreshPortfolio = usePaperStore((state) => state.refreshPortfolio);

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

  const openTrade = (side: 'BUY' | 'SELL') => {
    if (!chart || chart.marketStatus === 'UNAVAILABLE') return;
    setTradeView({ marketCode: chart.marketCode, side });
  };
  const tradeSuccess = () => {
    setTradeView(null);
    setRefreshNonce((value) => value + 1);
  };
  return (
    <DashboardLayout marketCode={marketCode} trading={side !== null} onBack={side ? () => setTradeView(null) : undefined}>
      <section className="dashboard-panel detail-area" aria-labelledby="detail-title">
        <h2 id="detail-title" className="sr-only">코인 상세</h2>
        {loading && <p role="status" className="status-message">코인 정보를 불러오는 중입니다.</p>}
        {error && <div role="alert" className="status-message error-message">
          {DETAIL_ERROR_LINES.map((line) => <p key={line}>{line}</p>)}
          <button type="button" className="text-button" onClick={() => setRefreshNonce((value) => value + 1)}>다시 시도</button>
        </div>}
        {!loading && !error && chart && <div className="coin-detail">
          <div className="coin-visual">
            <div className="coin-headline">
              <h3 className="coin-row-title"><span className="coin-name">{chart.koreanName}</span><span className="coin-symbol">{chart.marketCode}</span></h3>
              <p className="coin-price">{chart.currentPrice === null ? '조회 불가' : formatKrw(chart.currentPrice)}</p>
              {holding && <p className={`coin-pnl ${signClass(holding.unrealizedPnlKrw)}`}>{formatSignedKrw(holding.unrealizedPnlKrw, '평가 불가')}</p>}
              {chart.marketStatus !== 'ACTIVE' && <span className={`status-badge ${chart.marketStatus === 'CAUTION' ? 'caution-badge' : ''}`}>{marketStatusLabel(chart.marketStatus)}</span>}
              {chart.priceStatus !== 'FRESH' && <span className="status-badge">{priceStatusLabel(chart.priceStatus)}</span>}
            </div>
            <div className="chart-area" aria-label="최근 30일 가격">
              {chart.candles.length === 0 ? <p className="chart-empty">차트를 이용할 수 없습니다.</p> : <PriceChart chart={chart} />}
            </div>
          </div>
          <div className={`trade-panel${side === 'SELL' ? ' selling' : ''}`} aria-label="거래 입력">
            <div className="trade-launch">
              {holding && <button type="button" className="trade-submit sell" disabled={chart.marketStatus === 'UNAVAILABLE'} onClick={() => openTrade('SELL')}>판매하기</button>}
              <button type="button" className="trade-submit buy" disabled={chart.marketStatus === 'UNAVAILABLE'} onClick={() => openTrade('BUY')}>구매하기</button>
            </div>
            <div className="trade-entry">
              {side === 'SELL' && holding
                ? <SellForm key={chart.marketCode} marketCode={chart.marketCode} disabled={chart.marketStatus === 'UNAVAILABLE'} availableQuantity={holding.quantity} onSuccess={tradeSuccess} />
                : <BuyForm key={chart.marketCode} marketCode={chart.marketCode} disabled={chart.marketStatus === 'UNAVAILABLE'} onSuccess={tradeSuccess} />}
              {holding && <button type="button" className={`trade-submit desktop-trade-switch ${side === 'SELL' ? 'buy' : 'sell'}`} disabled={chart.marketStatus === 'UNAVAILABLE'} onClick={() => openTrade(side === 'SELL' ? 'BUY' : 'SELL')}>{side === 'SELL' ? '구매하기' : '판매하기'}</button>}
              {tradeError && <p role="alert">{tradeError.message}</p>}
            </div>
          </div>
          {portfolioError && <div role="alert" className="detail-refresh-error"><p>보유 자산을 갱신하지 못했습니다.</p><button type="button" className="text-button" onClick={() => void refreshPortfolio()}>다시 시도</button></div>}
          <details className="detail-info">
            <summary>코인 정보</summary>
            <dl className="detail-metrics">
              <div><dt>영문명</dt><dd>{chart.englishName}</dd></div>
              <div><dt>마켓 상태</dt><dd>{marketStatusLabel(chart.marketStatus)}</dd></div>
              <div><dt>가격 상태</dt><dd>{priceStatusLabel(chart.priceStatus)} ({chart.priceStatus})</dd></div>
              <div><dt>사용 가능 현금</dt><dd>{formatKrw(cashBalanceKrw ?? account?.cashBalanceKrw ?? null, '조회 중')}</dd></div>
              <div><dt>보유 수량</dt><dd>{formatDecimalString(holding?.quantity ?? '0')}</dd></div>
            </dl>
          </details>
        </div>}
      </section>
    </DashboardLayout>
  );
}
