import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AccountSummary } from "../features/paper/AccountSummary";
import { AccountTopUp } from "../features/paper/AccountTopUp";
import { TradeHistory } from "../features/paper/TradeHistory";
import { HoldingsArea } from "../features/watchup/HoldingsArea";
import { SEARCH_INPUT_ID, SearchArea } from "../features/watchup/SearchArea";
import { getSupabaseClient } from "../lib/supabase";
import { useAuthStore } from "../stores/authStore";
import { useWatchupStore } from "../stores/watchupStore";

const SAFE_ERROR = "로그아웃에 실패했습니다. 다시 시도해주세요.";
let dashboardMountCount = 0;

/** Header search icon — focuses the existing search form, no new route. */
function focusSearch() {
  const input = document.getElementById(SEARCH_INPUT_ID);
  if (!(input instanceof HTMLInputElement)) return;
  input.scrollIntoView?.({ block: "center", behavior: "smooth" });
  input.focus();
}

export function HomePage() {
  const navigate = useNavigate();
  const loading = useAuthStore((state) => state.logoutLoading);
  const error = useAuthStore((state) => state.authError);

  useEffect(() => {
    dashboardMountCount += 1;

    return () => {
      dashboardMountCount -= 1;
      queueMicrotask(() => {
        if (dashboardMountCount === 0)
          useWatchupStore.getState().cancelPendingRequests();
      });
    };
  }, []);

  const logout = async () => {
    if (useAuthStore.getState().logoutLoading) return;
    const store = useAuthStore.getState();
    store.setLogoutLoading(true);
    store.setAuthError(null);
    try {
      const result = await getSupabaseClient().auth.signOut();
      if (result.error) {
        store.setAuthError(SAFE_ERROR);
        return;
      }
      useWatchupStore.getState().cancelPendingRequests();
      store.setSession(null);
      navigate("/login", { replace: true });
    } catch {
      store.setAuthError(SAFE_ERROR);
    } finally {
      store.setLogoutLoading(false);
    }
  };

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="brand">
          <svg
            className="brand-mark"
            viewBox="0 0 36 36"
            aria-hidden="true"
            focusable="false"
          >
            <rect width="36" height="36" rx="10" fill="currentColor" />
            <path
              d="M8 12.5 12.6 24 18 15.2 23.4 24 28 12.5"
              fill="none"
              stroke="var(--bg)"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <h1>WatchUp</h1>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="icon-button"
            aria-label="코인 검색으로 이동"
            onClick={focusSearch}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 22 22"
              aria-hidden="true"
              focusable="false"
            >
              <circle
                cx="9.5"
                cy="9.5"
                r="7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="m15 15 5 5"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <button
            type="button"
            className="text-button"
            disabled={loading}
            onClick={() => void logout()}
          >
            {loading ? "로그아웃 중입니다." : "로그아웃"}
          </button>
        </div>
      </header>
      {error && <p role="alert">{error}</p>}
      <div className="dashboard-grid">
        <div className="dashboard-column">
          <AccountSummary />
          <SearchArea />
          <HoldingsArea />
        </div>
        <div className="dashboard-column">
          <AccountTopUp />
          <TradeHistory />
        </div>
      </div>
    </main>
  );
}
