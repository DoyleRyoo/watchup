import { apiRequest } from "../../api/client";
import type { ApiSuccess } from "../../api/types";

export type PaperAccount = {
  cashBalanceKrw: string;
  lifetimeTopUpKrw: string;
  topUpMinKrw: string;
  topUpMaxKrw: string;
  topUpLifetimeCapKrw: string;
};

export type PaperTransaction = {
  id: string;
  type: "INITIAL_GRANT" | "TOP_UP" | "BUY" | "SELL";
  assetClass: "CRYPTO" | null;
  marketCode: string | null;
  executionPrice: string | null;
  quantity: string | null;
  cashDeltaKrw: string;
  balanceAfterKrw: string;
  disposedCostBasisKrw: string | null;
  realizedPnlKrw: string | null;
  quotedAt: string | null;
  createdAt: string;
};

export function getAccount(
  signal?: AbortSignal,
): Promise<ApiSuccess<PaperAccount>> {
  return apiRequest<PaperAccount>("/paper/account", { signal });
}

export function topUp(
  amountKrw: string,
  idempotencyKey: string,
  signal?: AbortSignal,
): Promise<ApiSuccess<PaperTransaction>> {
  return apiRequest<PaperTransaction>("/paper/top-ups", {
    method: "POST",
    body: { amountKrw },
    headers: { "Idempotency-Key": idempotencyKey },
    signal,
  });
}

export type BuyTradeBody = {
  marketCode: string;
  side: "BUY";
  amountKrw: string;
  quantity?: never;
} | { marketCode: string; side: "BUY"; quantity: string; amountKrw?: never };
export type SellTradeBody = {
  marketCode: string;
  side: "SELL";
  quantity: string;
};
export type TradeBody = BuyTradeBody | SellTradeBody;

export function postTrade(
  body: TradeBody,
  idempotencyKey: string,
  signal?: AbortSignal,
): Promise<ApiSuccess<PaperTransaction>> {
  return apiRequest<PaperTransaction>("/paper/trades", {
    method: "POST",
    body,
    headers: { "Idempotency-Key": idempotencyKey },
    signal,
  });
}

export type PortfolioPriceStatus = "FRESH" | "STALE" | "PRICE_ERROR";
export type ValuationStatus = "FRESH" | "STALE" | "PARTIAL";

export type PaperHolding = {
  marketCode: string;
  koreanName: string;
  englishName: string;
  quantity: string;
  costBasisKrw: string;
  avgPriceKrw: string | null;
  currentPrice: string | null;
  priceStatus: PortfolioPriceStatus;
  unrealizedPnlKrw: string | null;
  valueKrw: string | null;
};

export type PaperPortfolio = {
  cashBalanceKrw: string;
  holdings: PaperHolding[];
  totalHoldingsValueKrw: string | null;
  totalUnrealizedPnlKrw: string | null;
  totalRealizedPnlKrw: string;
  totalAssetsKrw: string | null;
  totalPnlKrw: string | null;
  totalReturnRate: string | null;
  valuationStatus: ValuationStatus;
};

export function getPortfolio(
  signal?: AbortSignal,
): Promise<ApiSuccess<PaperPortfolio, { count: number }>> {
  return apiRequest<PaperPortfolio, { count: number }>("/paper/portfolio", {
    signal,
  }) as Promise<ApiSuccess<PaperPortfolio, { count: number }>>;
}

export type TradeHistoryParams = {
  limit?: number;
  beforeId?: string;
};

export type TradeHistoryMeta = {
  count: number;
  hasMore: boolean;
};

export function getTrades(
  params: TradeHistoryParams = {},
  signal?: AbortSignal,
): Promise<ApiSuccess<PaperTransaction[], TradeHistoryMeta>> {
  const query = new URLSearchParams();
  if (params.limit !== undefined) query.set("limit", String(params.limit));
  if (params.beforeId !== undefined) query.set("beforeId", params.beforeId);
  const suffix = query.size === 0 ? "" : `?${query.toString()}`;
  return apiRequest<PaperTransaction[], TradeHistoryMeta>(
    `/paper/trades${suffix}`,
    { signal },
  );
}
