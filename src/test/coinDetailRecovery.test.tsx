import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ApiError } from "../api/errors";
import type { PaperHolding } from "../features/paper/api";
import type { CoinChartResponse } from "../features/watchup/types";
import { CoinDetailPage } from "../pages/CoinDetailPage";
import { usePaperStore } from "../stores/paperStore";

const featureApi = vi.hoisted(() => ({ getCoinChart: vi.fn() }));
vi.mock("../features/watchup/api", () => featureApi);

const originalRefreshPortfolio = usePaperStore.getState().refreshPortfolio;

const chartResponse: CoinChartResponse = {
  data: {
    marketCode: "KRW-BTC",
    koreanName: "비트코인",
    englishName: "Bitcoin",
    marketStatus: "ACTIVE",
    currentPrice: "142300000.25",
    priceStatus: "FRESH",
    period: "30d",
    candles: [{ date: "2026-06-16", closingPrice: "140000000" }],
  },
  meta: { count: 1 },
};

const holding: PaperHolding = {
  marketCode: "KRW-BTC",
  koreanName: "비트코인",
  englishName: "Bitcoin",
  quantity: "0.1",
  costBasisKrw: "100000",
  avgPriceKrw: "1000000",
  currentPrice: "142300000.25",
  priceStatus: "FRESH",
  unrealizedPnlKrw: "14130000.025",
  valueKrw: "14230000.025",
};

function renderDetail() {
  return render(
    <MemoryRouter initialEntries={["/coins/KRW-BTC"]}>
      <Routes>
        <Route path="/coins/:marketCode" element={<CoinDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  featureApi.getCoinChart.mockReset().mockResolvedValue(chartResponse);
  usePaperStore.setState({
    account: null,
    holdings: [],
    cashBalanceKrw: "1000000",
    portfolioError: null,
    tradeError: null,
  });
});

afterEach(() => {
  usePaperStore.setState({ refreshPortfolio: originalRefreshPortfolio });
  usePaperStore.getState().reset();
});

it("보유 수량이 있으면 SELL control을 활성화한다", async () => {
  const refreshPortfolio = vi.fn(async () => undefined);
  usePaperStore.setState({ holdings: [holding], refreshPortfolio });

  renderDetail();

  expect(
    await screen.findByRole("textbox", { name: "매도 수량" }),
  ).toBeEnabled();
  expect(refreshPortfolio).toHaveBeenCalledOnce();
});

it("거래 후 portfolio refetch 실패 상태를 보존하고 다시 시도한다", async () => {
  const refreshPortfolio = vi.fn(async () => undefined);
  usePaperStore.setState({
    holdings: [holding],
    portfolioError: new ApiError(503, "DATABASE_UNAVAILABLE", "일시적인 오류"),
    refreshPortfolio,
  });

  renderDetail();

  const alert = await screen.findByRole("alert");
  expect(alert).toHaveTextContent("보유 자산을 갱신하지 못했습니다.");
  expect(screen.getByText("0.1")).toBeInTheDocument();
  expect(refreshPortfolio).toHaveBeenCalledOnce();

  fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

  expect(refreshPortfolio).toHaveBeenCalledTimes(2);
  expect(screen.getByText("0.1")).toBeInTheDocument();
});
