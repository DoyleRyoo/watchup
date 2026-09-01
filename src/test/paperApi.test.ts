import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAccount, getTrades, topUp } from "../features/paper/api";

const apiRequest = vi.hoisted(() => vi.fn());
vi.mock("../api/client", () => ({ apiRequest }));

beforeEach(() => apiRequest.mockReset());

describe("paper API", () => {
  it("계좌를 인증 API client로 조회한다", async () => {
    const response = { data: { cashBalanceKrw: "1000000" }, meta: null };
    apiRequest.mockResolvedValue(response);
    await expect(getAccount()).resolves.toBe(response);
    expect(apiRequest).toHaveBeenCalledWith("/paper/account", {
      signal: undefined,
    });
  });

  it("충전 금액과 Idempotency-Key를 전달한다", async () => {
    apiRequest.mockResolvedValue({ data: { id: "2" }, meta: null });
    await topUp("1000", "key-value");
    expect(apiRequest).toHaveBeenCalledWith("/paper/top-ups", {
      method: "POST",
      body: { amountKrw: "1000" },
      headers: { "Idempotency-Key": "key-value" },
      signal: undefined,
    });
  });

  it("거래 body와 Idempotency-Key를 전달하고 표시 가격은 보내지 않는다", async () => {
    apiRequest.mockResolvedValue({ data: { id: "3" }, meta: null });
    const { postTrade } = await import("../features/paper/api");
    await postTrade(
      { marketCode: "KRW-BTC", side: "BUY", amountKrw: "1000" },
      "trade-key",
    );
    expect(apiRequest).toHaveBeenCalledWith("/paper/trades", {
      method: "POST",
      body: { marketCode: "KRW-BTC", side: "BUY", amountKrw: "1000" },
      headers: { "Idempotency-Key": "trade-key" },
      signal: undefined,
    });
    expect(JSON.stringify(apiRequest.mock.calls[0])).not.toContain(
      "executionPrice",
    );
  });

  it("거래 내역 cursor를 쿼리로 전달하고 watchlist를 호출하지 않는다", async () => {
    const response = { data: [], meta: { count: 0, hasMore: false } };
    apiRequest.mockResolvedValue(response);

    await expect(getTrades({ limit: 20, beforeId: "123" })).resolves.toBe(
      response,
    );
    expect(apiRequest).toHaveBeenCalledWith(
      "/paper/trades?limit=20&beforeId=123",
      { signal: undefined },
    );
    expect(apiRequest.mock.calls.flat().join(" ")).not.toContain("/watchlist");
  });
});
