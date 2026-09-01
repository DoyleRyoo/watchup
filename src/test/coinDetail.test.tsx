import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../api/errors";
import { CoinDetailPage } from "../pages/CoinDetailPage";
import type { CoinChartResponse } from "../features/watchup/types";
import { usePaperStore } from "../stores/paperStore";

const featureApi = vi.hoisted(() => ({ getCoinChart: vi.fn() }));
vi.mock("../features/watchup/api", () => featureApi);

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

function renderDetail(path = "/coins/KRW-BTC") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/coins/:marketCode" element={<CoinDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  featureApi.getCoinChart.mockReset().mockResolvedValue(chartResponse);
  usePaperStore.setState({
    account: {
      cashBalanceKrw: "1000000",
      lifetimeTopUpKrw: "0",
      topUpMinKrw: "1",
      topUpMaxKrw: "2100000000",
      topUpLifetimeCapKrw: "100000000000",
    },
    error: null,
    tradeError: null,
  });
});

describe("차트 페이지 직접 진입", () => {
  it("이전 검색 상태 없이 URL만으로 모든 Step 3 필드를 표시한다", async () => {
    renderDetail();

    expect(
      await screen.findByRole("heading", { name: /비트코인 Bitcoin/ }),
    ).toBeInTheDocument();
    expect(featureApi.getCoinChart).toHaveBeenCalledWith(
      "KRW-BTC",
      expect.any(AbortSignal),
    );
    expect(screen.getByText("KRW-BTC")).toBeInTheDocument();
    expect(screen.getByText("거래 가능")).toBeInTheDocument();
    expect(screen.getByText("142300000.25원")).toBeInTheDocument();
    expect(screen.getByText(/FRESH/)).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: /KRW-BTC 최근 30일 종가 차트/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("1000000원")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "매수 금액 (원)" }),
    ).toBeEnabled();
    expect(screen.getByRole("textbox", { name: "매도 수량" })).toBeDisabled();
  });

  it("빈 일봉은 0 가격을 만들지 않고 차트 이용 불가를 안내한다", async () => {
    featureApi.getCoinChart.mockResolvedValue({
      ...chartResponse,
      data: {
        ...chartResponse.data,
        currentPrice: null,
        priceStatus: "PRICE_ERROR",
        candles: [],
      },
      meta: { count: 0 },
    });
    renderDetail();

    expect(
      await screen.findByText("차트를 이용할 수 없습니다."),
    ).toBeInTheDocument();
    expect(screen.getByText("조회 불가")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("잘못된 코드도 변환하지 않고 그대로 API에 전달해 기존 오류 UI를 표시한다", async () => {
    featureApi.getCoinChart.mockRejectedValue(
      new ApiError(
        400,
        "INVALID_MARKET_CODE",
        "유효하지 않은 마켓 코드입니다.",
      ),
    );
    renderDetail("/coins/krw-btc");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "코인 정보를 불러오지 못했습니다.",
    );
    expect(featureApi.getCoinChart).toHaveBeenCalledWith(
      "krw-btc",
      expect.any(AbortSignal),
    );
    expect(screen.queryByText("KRW-BTC")).not.toBeInTheDocument();
  });
});
