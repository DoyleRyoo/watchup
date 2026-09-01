import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useParams } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HomePage } from "../pages/HomePage";
import type { PaperHolding, PaperPortfolio } from "../features/paper/api";
import { usePaperStore } from "../stores/paperStore";
import { useWatchupStore } from "../stores/watchupStore";

const paperApi = vi.hoisted(() => ({
  getAccount: vi.fn(),
  getPortfolio: vi.fn(),
  getTrades: vi.fn(),
  topUp: vi.fn(),
  postTrade: vi.fn(),
}));
vi.mock("../features/paper/api", () => paperApi);

const watchupApi = vi.hoisted(() => ({ searchCoins: vi.fn() }));
vi.mock("../features/watchup/api", () => watchupApi);

vi.mock("../lib/supabase", () => ({
  getSupabaseClient: () => ({ auth: { signOut: vi.fn() } }),
}));

const account = {
  cashBalanceKrw: "400000",
  lifetimeTopUpKrw: "1500000",
  topUpMinKrw: "1",
  topUpMaxKrw: "2100000000",
  topUpLifetimeCapKrw: "100000000000",
};

function holding(marketCode: string, koreanName: string): PaperHolding {
  return {
    marketCode,
    koreanName,
    englishName: marketCode,
    quantity: "1.234000000000000000",
    costBasisKrw: "1000000.000000000000000000",
    avgPriceKrw: "810372.771474878444084278",
    currentPrice: "900000.000000000000000000",
    priceStatus: "FRESH",
    unrealizedPnlKrw: "-99999.000000000000000000",
    valueKrw: "1110600.000000000000000000",
  };
}

function portfolio(holdings: PaperHolding[]): PaperPortfolio {
  return {
    cashBalanceKrw: "400000",
    holdings,
    totalHoldingsValueKrw: "1110600.000000000000000000",
    totalUnrealizedPnlKrw: "-99999.000000000000000000",
    totalRealizedPnlKrw: "0.000000000000000000",
    totalAssetsKrw: "1510600.000000000000000000",
    totalPnlKrw: "-99999.000000000000000000",
    totalReturnRate: "-0.062028000000000000",
    valuationStatus: "FRESH",
  };
}

function renderHome() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/coins/:marketCode" element={<Destination />} />
      </Routes>
    </MemoryRouter>,
  );
}

function Destination() {
  const { marketCode } = useParams();
  return <p>도착: {marketCode}</p>;
}

beforeEach(() => {
  paperApi.getAccount.mockReset().mockResolvedValue({
    data: account,
    meta: null,
  });
  paperApi.getPortfolio
    .mockReset()
    .mockResolvedValue({ data: portfolio([holding("KRW-BTC", "비트코인")]), meta: { count: 1 } });
  paperApi.getTrades
    .mockReset()
    .mockResolvedValue({ data: [], meta: { count: 0, hasMore: false } });
  watchupApi.searchCoins.mockReset().mockResolvedValue({
    data: [],
    meta: { count: 0 },
  });
  usePaperStore.getState().reset();
  useWatchupStore.getState().reset();
});

describe("메인 화면 디자인 + 계약 연결", () => {
  it("헤더는 워드마크 · 검색 아이콘 · 로그아웃을 함께 노출한다", async () => {
    renderHome();

    expect(
      screen.getByRole("heading", { level: 1, name: "WatchUp" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "코인 검색으로 이동" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "로그아웃" })).toBeInTheDocument();
    await waitFor(() => expect(paperApi.getPortfolio).toHaveBeenCalled());
  });

  it("검색 아이콘은 새 라우트 없이 기존 검색 입력으로 포커스를 옮긴다", async () => {
    renderHome();

    fireEvent.click(screen.getByRole("button", { name: "코인 검색으로 이동" }));

    expect(screen.getByRole("searchbox", { name: "코인명" })).toHaveFocus();
    expect(screen.queryByText(/도착:/)).not.toBeInTheDocument();
    await waitFor(() => expect(paperApi.getPortfolio).toHaveBeenCalled());
  });

  it("자산 요약은 account + portfolio 실제 응답만으로 렌더링한다", async () => {
    renderHome();

    // 내 자산 = totalAssetsKrw, 손익 = totalPnlKrw (totalReturnRate)
    expect(await screen.findByText("1,510,600원")).toBeInTheDocument();
    expect(await screen.findByText("-99,999원 (-6.20%)")).toBeInTheDocument();
    // 첫 투자금 슬롯은 계약에 있는 lifetimeTopUpKrw를 제 이름으로 표시
    expect(await screen.findByText("1,500,000원")).toBeInTheDocument();
    expect(await screen.findByText("400,000원")).toBeInTheDocument();
  });

  it("보유 코인 행은 이름 · 심볼 · 수량 · 평가금액 · 손익을 목업 배치로 렌더링한다", async () => {
    renderHome();

    const row = await screen.findByRole("button", { name: /비트코인/ });
    expect(row).toHaveClass("coin-row");
    expect(row).toHaveTextContent("비트코인");
    expect(row).toHaveTextContent("KRW-BTC");
    expect(row).toHaveTextContent("1.234코인");
    expect(row).toHaveTextContent("1,110,600원");
    const change = row.querySelector(".coin-row-change");
    expect(change).toHaveTextContent("-99,999원");
    expect(change).toHaveClass("change-down");
  });

  it("행을 누르면 응답의 marketCode로 차트 페이지에 이동한다", async () => {
    renderHome();

    fireEvent.click(await screen.findByRole("button", { name: /비트코인/ }));

    expect(await screen.findByText("도착: KRW-BTC")).toBeInTheDocument();
  });

  it("보유 0개와 10개 모두 레이아웃을 유지한다", async () => {
    paperApi.getPortfolio.mockResolvedValue({
      data: portfolio([]),
      meta: { count: 0 },
    });
    const empty = renderHome();
    expect(await screen.findByText("보유 중인 자산이 없습니다.")).toBeInTheDocument();
    empty.unmount();

    usePaperStore.getState().reset();
    const many = Array.from({ length: 10 }, (_, index) =>
      holding(`KRW-C${index}`, `코인${index}`),
    );
    paperApi.getPortfolio.mockResolvedValue({
      data: portfolio(many),
      meta: { count: 10 },
    });
    renderHome();
    await waitFor(() =>
      expect(document.querySelectorAll(".holdings-list .coin-row")).toHaveLength(
        10,
      ),
    );
  });

  it("관심코인 · 하트 · 즐겨찾기 UI와 watchlist 호출이 존재하지 않는다", async () => {
    renderHome();
    await screen.findByRole("button", { name: /비트코인/ });

    expect(document.body.innerHTML).not.toMatch(/관심|하트|즐겨찾기|favorite|watchlist/i);
    expect(screen.queryByRole("button", { name: /삭제|추가/ })).not.toBeInTheDocument();
  });

  it("거래 내역을 beforeId 커서 계약대로 함께 마운트한다", async () => {
    renderHome();

    await waitFor(() =>
      expect(paperApi.getTrades).toHaveBeenCalledWith(
        { limit: 20 },
        expect.any(AbortSignal),
      ),
    );
    expect(await screen.findByText("거래 내역이 없습니다.")).toBeInTheDocument();
  });
});
