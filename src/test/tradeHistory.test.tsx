import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TradeHistory } from "../features/paper/TradeHistory";
import type { PaperTransaction } from "../features/paper/api";

const api = vi.hoisted(() => ({ getTrades: vi.fn() }));
vi.mock("../features/paper/api", () => api);

function item(id: string, type: PaperTransaction["type"]): PaperTransaction {
  return {
    id,
    type,
    assetClass: type === "BUY" || type === "SELL" ? "CRYPTO" : null,
    marketCode: type === "BUY" || type === "SELL" ? "KRW-BTC" : null,
    executionPrice: null,
    quantity: null,
    cashDeltaKrw: "1000",
    balanceAfterKrw: "1001000",
    disposedCostBasisKrw: null,
    realizedPnlKrw: null,
    quotedAt: null,
    createdAt: "2026-09-01T00:00:00Z",
  };
}

beforeEach(() => api.getTrades.mockReset());

describe("거래 내역", () => {
  it("네 거래 유형을 cursor 순서로 누적하고 hasMore가 끝나면 버튼을 숨긴다", async () => {
    api.getTrades
      .mockResolvedValueOnce({
        data: [item("4", "INITIAL_GRANT"), item("3", "TOP_UP")],
        meta: { count: 2, hasMore: true },
      })
      .mockResolvedValueOnce({
        data: [item("2", "BUY"), item("1", "SELL")],
        meta: { count: 2, hasMore: false },
      });

    render(<TradeHistory />);

    expect(await screen.findByText("초기 지급")).toBeInTheDocument();
    expect(screen.getByText("충전")).toBeInTheDocument();
    expect(api.getTrades).toHaveBeenNthCalledWith(
      1,
      { limit: 20 },
      expect.any(AbortSignal),
    );

    fireEvent.click(screen.getByRole("button", { name: "이전 내역 더 보기" }));

    expect(await screen.findByText("매수")).toBeInTheDocument();
    expect(screen.getByText("매도")).toBeInTheDocument();
    expect(api.getTrades).toHaveBeenNthCalledWith(
      2,
      {
        limit: 20,
        beforeId: "3",
      },
      undefined,
    );
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "이전 내역 더 보기" }),
      ).not.toBeInTheDocument(),
    );
  });

  it("이전 페이지 조회 실패 시 기존 내역을 유지하고 같은 cursor로 재시도한다", async () => {
    api.getTrades
      .mockResolvedValueOnce({
        data: [item("2", "BUY")],
        meta: { count: 1, hasMore: true },
      })
      .mockRejectedValueOnce(new Error("secret"))
      .mockResolvedValueOnce({
        data: [item("1", "SELL")],
        meta: { count: 1, hasMore: false },
      });

    render(<TradeHistory />);
    expect(await screen.findByText("매수")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "이전 내역 더 보기" }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("매수")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(await screen.findByText("매도")).toBeInTheDocument();
    expect(api.getTrades).toHaveBeenLastCalledWith(
      {
        limit: 20,
        beforeId: "2",
      },
      undefined,
    );
  });
});
