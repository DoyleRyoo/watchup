import { create } from "zustand";
import { ApiError, createContractError } from "../api/errors";
import {
  getAccount,
  getPortfolio,
  postTrade as requestTrade,
  topUp as requestTopUp,
} from "../features/paper/api";
import type {
  PaperAccount,
  PaperHolding,
  PaperPortfolio,
  TradeBody,
  ValuationStatus,
} from "../features/paper/api";

type PortfolioTotals = Omit<
  PaperPortfolio,
  "cashBalanceKrw" | "holdings" | "valuationStatus"
>;

type PaperState = {
  account: PaperAccount | null;
  loading: boolean;
  error: ApiError | null;
  holdings: PaperHolding[];
  cashBalanceKrw: string | null;
  totals: PortfolioTotals | null;
  valuationStatus: ValuationStatus | null;
  portfolioLoading: boolean;
  portfolioError: ApiError | null;
  tradeSubmitting: boolean;
  tradeError: ApiError | null;
  loadAccount: () => Promise<void>;
  refreshPortfolio: () => Promise<void>;
  topUp: (amountKrw: string, idempotencyKey: string) => Promise<void>;
  postTrade: (body: TradeBody, idempotencyKey: string) => Promise<void>;
  reset: () => void;
};

const initialState = {
  account: null,
  loading: false,
  error: null,
  holdings: [] as PaperHolding[],
  cashBalanceKrw: null,
  totals: null,
  valuationStatus: null,
  portfolioLoading: false,
  portfolioError: null,
  tradeSubmitting: false,
  tradeError: null,
};
const asApiError = (error: unknown) =>
  error instanceof ApiError ? error : createContractError();
let portfolioSequence = 0;
let portfolioController: AbortController | null = null;

export const usePaperStore = create<PaperState>((set, get) => ({
  ...initialState,
  loadAccount: async () => {
    set({ loading: true, error: null });
    try {
      const response = await getAccount();
      set({ account: response.data, loading: false });
    } catch (error) {
      set({ error: asApiError(error), loading: false });
    }
  },
  refreshPortfolio: async () => {
    const sequence = ++portfolioSequence;
    portfolioController?.abort();
    const controller = new AbortController();
    portfolioController = controller;
    set({ portfolioLoading: true, portfolioError: null });
    try {
      const { data } = await getPortfolio(controller.signal);
      if (sequence !== portfolioSequence || controller.signal.aborted) return;
      const { cashBalanceKrw, holdings, valuationStatus, ...totals } = data;
      set({
        cashBalanceKrw,
        holdings,
        totals,
        valuationStatus,
        portfolioLoading: false,
      });
    } catch (error) {
      if (sequence !== portfolioSequence || controller.signal.aborted) return;
      set({ portfolioError: asApiError(error), portfolioLoading: false });
    }
  },
  topUp: async (amountKrw, idempotencyKey) => {
    set({ loading: true, error: null });
    try {
      try {
        await requestTopUp(amountKrw, idempotencyKey);
      } catch (error) {
        if (
          !(error instanceof ApiError) ||
          error.code !== "DATABASE_UNAVAILABLE"
        )
          throw error;
        await requestTopUp(amountKrw, idempotencyKey);
      }
      const response = await getAccount();
      set({ account: response.data, loading: false });
    } catch (error) {
      set({ error: asApiError(error), loading: false });
      throw error;
    }
  },
  postTrade: async (body, idempotencyKey) => {
    set({ tradeSubmitting: true, tradeError: null });
    try {
      try {
        await requestTrade(body, idempotencyKey);
      } catch (error) {
        if (
          !(error instanceof ApiError) ||
          error.code !== "DATABASE_UNAVAILABLE"
        )
          throw error;
        await requestTrade(body, idempotencyKey);
      }
      set({ tradeSubmitting: false });
      await get().refreshPortfolio();
    } catch (error) {
      set({ tradeError: asApiError(error), tradeSubmitting: false });
      throw error;
    }
  },
  reset: () => {
    portfolioSequence += 1;
    portfolioController?.abort();
    portfolioController = null;
    set(initialState);
  },
}));
