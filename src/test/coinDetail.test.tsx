import { ToastHost } from "../components/ToastHost";
import { useToastStore } from "../stores/toastStore";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../api/errors";
import { CoinDetailPage } from "../pages/CoinDetailPage";
import type { CoinChartResponse } from "../features/watchup/types";
import { usePaperStore } from "../stores/paperStore";

const featureApi = vi.hoisted(() => ({ getCoinChart: vi.fn() }));
vi.mock("../features/watchup/api", () => featureApi);

const paperApi = vi.hoisted(() => ({
  getAccount: vi.fn(),
  getPortfolio: vi.fn(),
  getTrades: vi.fn(),
  postTrade: vi.fn(),
  topUp: vi.fn(),
}));
vi.mock("../features/paper/api", () => paperApi);

const btcHolding = {
  marketCode: "KRW-BTC",
  koreanName: "비트코인",
  englishName: "Bitcoin",
  quantity: "0.500000000000000000",
  costBasisKrw: "70000000.000000000000000000",
  avgPriceKrw: "140000000.000000000000000000",
  currentPrice: "142300000.250000000000000000",
  priceStatus: "FRESH" as const,
  unrealizedPnlKrw: "1150000.000000000000000000",
  valueKrw: "71150000.125000000000000000",
};

function portfolioResponse(holdings: (typeof btcHolding)[]) {
  return {
    data: {
      cashBalanceKrw: "1000000",
      holdings,
      totalHoldingsValueKrw: "71150000.125000000000000000",
      totalUnrealizedPnlKrw: "1150000.000000000000000000",
      totalRealizedPnlKrw: "0.000000000000000000",
      totalAssetsKrw: "72150000.125000000000000000",
      totalPnlKrw: "1150000.000000000000000000",
      totalReturnRate: "0.016200000000000000",
      valuationStatus: "FRESH" as const,
    },
    meta: { count: holdings.length },
  };
}

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
      <ToastHost />
      <Routes>
        <Route path="/coins/:marketCode" element={<CoinDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  useToastStore.getState().clear();
  featureApi.getCoinChart.mockReset().mockResolvedValue(chartResponse);
  paperApi.getPortfolio
    .mockReset()
    .mockResolvedValue(portfolioResponse([]));
  paperApi.postTrade
    .mockReset()
    .mockResolvedValue({ data: { id: "9" }, meta: null });
  paperApi.getAccount.mockReset();
  vi.spyOn(crypto, "randomUUID").mockReturnValueOnce(
    "22222222-2222-4222-8222-222222222222",
  );
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
      await screen.findByRole("heading", { name: /비트코인\s*KRW-BTC/ }),
    ).toBeInTheDocument();
    expect(featureApi.getCoinChart).toHaveBeenCalledWith(
      "KRW-BTC",
      expect.any(AbortSignal),
    );
    expect(screen.getAllByText("KRW-BTC").length).toBeGreaterThan(0);
    expect(screen.getByText("Bitcoin")).toBeInTheDocument();
    expect(screen.getByText("거래 가능")).toBeInTheDocument();
    expect(screen.getByText("142,300,000원")).toBeInTheDocument();
    expect(screen.getByText(/FRESH/)).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: /KRW-BTC 최근 30일 종가 차트/ }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("1,000,000원").length).toBeGreaterThan(0);
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "매수 금액 (원)" }),
    ).toBeEnabled();
    // chart_not_have: no position → the SELL control is absent, not just off.
    expect(
      screen.queryByRole("textbox", { name: "매도 수량" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "판매하기" }),
    ).not.toBeInTheDocument();
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

describe("거래 컨트롤 상태", () => {
  it("보유 수량이 있으면 판매 컨트롤이 나타나고 판매 가능 수량을 보여준다", async () => {
    paperApi.getPortfolio.mockResolvedValue(portfolioResponse([btcHolding]));
    renderDetail();

    fireEvent.click((await screen.findAllByRole('button', { name: '판매하기' })).at(-1)!);
    expect(
      await screen.findByRole("textbox", { name: "매도 수량" }),
    ).toBeEnabled();
    expect(
      screen.getAllByRole("button", { name: "판매하기" }).at(-1)!,
    ).toBeInTheDocument();
    expect(screen.getByText("판매 가능 0.5개")).toBeInTheDocument();
    expect(document.querySelector(".coin-pnl")).toHaveTextContent("+1,150,000원");
  });

  it("UNAVAILABLE 마켓은 구매·판매 컨트롤을 모두 비활성화한다", async () => {
    paperApi.getPortfolio.mockResolvedValue(portfolioResponse([btcHolding]));
    featureApi.getCoinChart.mockResolvedValue({
      ...chartResponse,
      data: { ...chartResponse.data, marketStatus: "UNAVAILABLE" as const },
    });
    renderDetail();

    expect(
      await screen.findByRole("textbox", { name: "매수 금액 (원)" }),
    ).toBeDisabled();
    expect(screen.queryByRole("textbox", { name: "매도 수량" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "구매하기" }).every((b) => b.hasAttribute("disabled"))).toBe(true);
    expect(screen.getAllByRole("button", { name: "판매하기" }).every((b) => b.hasAttribute("disabled"))).toBe(true);
  });

  it("구매 성공 시 낙관적 갱신 없이 portfolio를 다시 조회한다 (REFRESH-01)", async () => {
    renderDetail();

    const amount = await screen.findByRole("textbox", {
      name: "매수 금액 (원)",
    });
    fireEvent.change(amount, { target: { value: "100000" } });
    fireEvent.click(screen.getAllByRole("button", { name: "구매하기" }).at(-1)!);

    await waitFor(() =>
      expect(paperApi.postTrade).toHaveBeenCalledWith(
        { marketCode: "KRW-BTC", side: "BUY", amountKrw: "100000" },
        "22222222-2222-4222-8222-222222222222",
      ),
    );
    await waitFor(() =>
      expect(paperApi.getPortfolio).toHaveBeenCalledTimes(2),
    );
  });

  it("구매 실패 시 목록을 바꾸지 않고 오류만 노출한다", async () => {
    paperApi.getPortfolio.mockResolvedValue(portfolioResponse([btcHolding]));
    paperApi.postTrade.mockRejectedValue(
      new ApiError(400, "INSUFFICIENT_CASH_BALANCE", "잔액이 부족합니다."),
    );
    renderDetail();

    const amount = await screen.findByRole("textbox", {
      name: "매수 금액 (원)",
    });
    fireEvent.change(amount, { target: { value: "100000" } });
    fireEvent.click(screen.getAllByRole("button", { name: "구매하기" }).at(-1)!);

    expect(await screen.findByRole("alert")).toHaveTextContent("보유 현금이 부족합니다.");
    expect(screen.getByText("0.5")).toBeInTheDocument();
    expect(paperApi.getPortfolio).toHaveBeenCalledTimes(1);
  });
});

it("판매 예상 금액과 서버 체결 안내는 한 번 표시한다", async () => {
  paperApi.getPortfolio.mockResolvedValue(portfolioResponse([btcHolding]));
  renderDetail();
  fireEvent.click((await screen.findAllByRole('button',{name:'판매하기'})).at(-1)!);
  fireEvent.change(screen.getByRole('textbox',{name:'매도 수량'}),{target:{value:'0.5'}});
  expect(screen.getByText('약 71,150,000원 수령 예상')).toBeInTheDocument();
  expect(screen.getAllByText('실제 체결 수량은 주문 시점 시세로 서버가 계산합니다.')).toHaveLength(1);
});

it("판매 실패는 한 번 알리고 사이드 전환 시 인라인 오류를 지운다", async()=>{
 paperApi.getPortfolio.mockResolvedValue(portfolioResponse([btcHolding]));
 paperApi.postTrade.mockRejectedValue(new ApiError(400,'INSUFFICIENT_HOLDING_QUANTITY','raw error'));
 const {container}=renderDetail();
 fireEvent.click((await screen.findAllByRole('button',{name:'판매하기'})).at(-1)!);
 fireEvent.change(screen.getByRole('textbox',{name:'매도 수량'}),{target:{value:'0.5'}});
 fireEvent.click(screen.getAllByRole('button',{name:'판매하기'}).at(-1)!);
 expect(await screen.findByRole('alert')).toHaveTextContent('보유 수량이 부족합니다.');
 expect(screen.getAllByRole('alert')).toHaveLength(1);
 expect(container.querySelector('.trade-error')).toHaveTextContent('보유 수량이 부족합니다.');
 fireEvent.click(screen.getAllByRole('button',{name:'구매하기'}).at(-1)!);
 expect(container.querySelector('.trade-error')).toBeNull();
 expect(screen.getByRole('alert')).toBeInTheDocument();
});
it("전량 매도로 폼이 사라져도 판매 완료를 알린다", async()=>{
 paperApi.getPortfolio.mockResolvedValue(portfolioResponse([btcHolding]));
 renderDetail();
 fireEvent.click((await screen.findAllByRole('button',{name:'판매하기'})).at(-1)!);
 fireEvent.change(screen.getByRole('textbox',{name:'매도 수량'}),{target:{value:'0.5'}});
 paperApi.getPortfolio.mockResolvedValue(portfolioResponse([]));
 fireEvent.click(screen.getAllByRole('button',{name:'판매하기'}).at(-1)!);
 expect(await screen.findByRole('status')).toHaveTextContent('판매 완료');
 expect(screen.queryByRole('textbox',{name:'매도 수량'})).not.toBeInTheDocument();
});
it("체결 성공 뒤 포트폴리오 재조회만 실패하면 성공 안내와 기존 재시도를 함께 유지한다", async()=>{
 renderDetail();
 const input=await screen.findByRole('textbox',{name:'매수 금액 (원)'});
 fireEvent.change(input,{target:{value:'1000'}});
 paperApi.getPortfolio.mockRejectedValue(new ApiError(503,'DATABASE_UNAVAILABLE','조회 실패'));
 fireEvent.click(screen.getAllByRole('button',{name:'구매하기'}).at(-1)!);
 expect((await screen.findByText('구매 완료')).closest('[role="status"]')).toBeInTheDocument();
 expect(screen.getByText('보유 자산을 갱신하지 못했습니다.')).toBeInTheDocument();
 expect(document.querySelector('.detail-refresh-error button')).toHaveTextContent('다시 시도');
});

it("기본 구매와 판매 입력은 사이드 칩·틴트 기준·채움/외곽선 버튼으로 구분한다", async()=>{
 paperApi.getPortfolio.mockResolvedValue(portfolioResponse([btcHolding]));
 const {container}=renderDetail();
 await screen.findByRole('textbox',{name:'매수 금액 (원)'});
 await waitFor(()=>expect(container.querySelector('.desktop-trade-switch')).not.toBeNull());
 const panel=container.querySelector('.trade-panel')!;
 expect(panel).toHaveAttribute('data-side','BUY');
 expect(panel.className).toBe('trade-panel');
 expect(screen.getByText('구매',{exact:true})).toBeInTheDocument();
 expect(container.querySelector('.trade-form > button')).toHaveAttribute('aria-current','true');
 const sellSwitch=container.querySelector('.desktop-trade-switch')!;
 expect(sellSwitch).toHaveClass('trade-switch','sell');
 expect(sellSwitch).not.toHaveClass('trade-submit');
 expect(sellSwitch).toHaveTextContent('판매하기');
 fireEvent.click(sellSwitch);
 expect(panel).toHaveAttribute('data-side','SELL');
 expect(screen.getByText('판매',{exact:true})).toBeInTheDocument();
 expect(screen.getByRole('textbox',{name:'매도 수량'})).toBeInTheDocument();
 expect(container.querySelector('.trade-form > button')).toHaveAttribute('aria-current','true');
 const buySwitch=container.querySelector('.desktop-trade-switch')!;
 expect(buySwitch).toHaveClass('trade-switch','buy');
 expect(buySwitch).not.toHaveClass('trade-submit');
 fireEvent.click(buySwitch);
 expect(panel).toHaveAttribute('data-side','BUY');
 expect(screen.getByText(/구매 가능/)).toBeInTheDocument();
});
