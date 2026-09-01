import { useCallback, useEffect, useState } from "react";
import { ApiError, createContractError } from "../../api/errors";
import { getTrades, type PaperTransaction, type TradeHistoryMeta } from "./api";

const TYPE_LABELS: Record<PaperTransaction["type"], string> = {
  INITIAL_GRANT: "초기 지급",
  TOP_UP: "충전",
  BUY: "매수",
  SELL: "매도",
};

const EMPTY_META: TradeHistoryMeta = { count: 0, hasMore: false };

function asApiError(error: unknown): ApiError {
  return error instanceof ApiError ? error : createContractError();
}

export function TradeHistory() {
  const [items, setItems] = useState<PaperTransaction[]>([]);
  const [meta, setMeta] = useState<TradeHistoryMeta>(EMPTY_META);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const load = useCallback(async (beforeId?: string, signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getTrades(
        { limit: 20, ...(beforeId ? { beforeId } : {}) },
        signal,
      );
      if (signal?.aborted) return;
      setItems((current) =>
        beforeId ? [...current, ...response.data] : response.data,
      );
      setMeta(response.meta);
    } catch (requestError) {
      if (signal?.aborted) return;
      setError(asApiError(requestError));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => {
      if (!controller.signal.aborted) void load(undefined, controller.signal);
    });
    return () => controller.abort();
  }, [load]);

  const lastId = items.at(-1)?.id;

  return (
    <section
      className="dashboard-panel trade-history"
      aria-labelledby="history-title"
    >
      <h2 id="history-title">거래 내역</h2>
      {loading && items.length === 0 && (
        <p role="status">거래 내역을 불러오는 중입니다.</p>
      )}
      {error && (
        <div role="alert">
          <p>거래 내역을 불러오지 못했습니다.</p>
          <button type="button" onClick={() => void load(lastId)}>
            다시 시도
          </button>
        </div>
      )}
      {!loading && !error && items.length === 0 && <p>거래 내역이 없습니다.</p>}
      {items.length > 0 && (
        <ol className="trade-history-list">
          {items.map((item) => (
            <li key={item.id}>
              <strong>{TYPE_LABELS[item.type]}</strong>
              <span>{item.marketCode ?? "원화"}</span>
              <span>{item.cashDeltaKrw}원</span>
              <time dateTime={item.createdAt}>{item.createdAt}</time>
            </li>
          ))}
        </ol>
      )}
      {!error && meta.hasMore && lastId && (
        <button
          type="button"
          disabled={loading}
          onClick={() => void load(lastId)}
        >
          {loading ? "불러오는 중" : "이전 내역 더 보기"}
        </button>
      )}
    </section>
  );
}
