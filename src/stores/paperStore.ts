import { create } from "zustand";
import { useAuthStore } from "./authStore";
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
let sessionGeneration = 0;
let portfolioSequence = 0;
let portfolioController: AbortController | null = null;

export const usePaperStore = create<PaperState>((set, get) => ({
  ...initialState,
  loadAccount: async () => {
    const generation = sessionGeneration;
    set({ loading: true, error: null });
    try {
      const response = await getAccount();
      if (generation !== sessionGeneration) return;
      set({ account: response.data, loading: false });
    } catch (error) {
      if (generation !== sessionGeneration) return;
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
    const generation = sessionGeneration;
    set({ loading: true, error: null });
    try {
      try {
        await requestTopUp(amountKrw, idempotencyKey);
      } catch (error) {
        if (generation !== sessionGeneration) return;
        if (
          !(error instanceof ApiError) ||
          error.code !== "DATABASE_UNAVAILABLE"
        )
          throw error;
        await requestTopUp(amountKrw, idempotencyKey);
      }
      const response = await getAccount();
      if (generation !== sessionGeneration) return;
      set({ account: response.data, loading: false });
    } catch (error) {
      if (generation !== sessionGeneration) return;
      set({ error: asApiError(error), loading: false });
      throw error;
    }
  },
  postTrade: async (body, idempotencyKey) => {
    const generation = sessionGeneration;
    set({ tradeSubmitting: true, tradeError: null });
    try {
      try {
        await requestTrade(body, idempotencyKey);
      } catch (error) {
        if (generation !== sessionGeneration) return;
        if (
          !(error instanceof ApiError) ||
          error.code !== "DATABASE_UNAVAILABLE"
        )
          throw error;
        await requestTrade(body, idempotencyKey);
      }
      if (generation !== sessionGeneration) return;
      set({ tradeSubmitting: false });
      await get().refreshPortfolio();
    } catch (error) {
      if (generation !== sessionGeneration) return;
      set({ tradeError: asApiError(error), tradeSubmitting: false });
      throw error;
    }
  },
  reset: () => {
    sessionGeneration += 1;
    portfolioSequence += 1;
    portfolioController?.abort();
    portfolioController = null;
    set(initialState);
  },
}));

// Clear account-specific state for logout and identity changes, including 401 logout.
useAuthStore.subscribe((state, previous) => {
  if (state.session?.user.id !== previous.session?.user.id) usePaperStore.getState().reset();
});
