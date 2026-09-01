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
