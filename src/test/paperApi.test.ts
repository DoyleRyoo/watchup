import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAccount, topUp } from "../features/paper/api";

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
});
