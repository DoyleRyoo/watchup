import { create } from "zustand";
import { ApiError, createContractError } from "../api/errors";
import { getAccount, topUp as requestTopUp } from "../features/paper/api";
import type { PaperAccount } from "../features/paper/api";

type PaperState = {
  account: PaperAccount | null;
  loading: boolean;
  error: ApiError | null;
  loadAccount: () => Promise<void>;
  topUp: (amountKrw: string, idempotencyKey: string) => Promise<void>;
  reset: () => void;
};

const initialState = { account: null, loading: false, error: null };
const asApiError = (error: unknown) =>
  error instanceof ApiError ? error : createContractError();

export const usePaperStore = create<PaperState>((set) => ({
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
  reset: () => set(initialState),
}));
