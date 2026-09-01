import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AccountTopUp } from "../features/paper/AccountTopUp";
import { HoldingsArea } from "../features/watchup/HoldingsArea";
import { SearchArea } from "../features/watchup/SearchArea";
import { getSupabaseClient } from "../lib/supabase";
import { useAuthStore } from "../stores/authStore";
import { useWatchupStore } from "../stores/watchupStore";

const SAFE_ERROR = "로그아웃에 실패했습니다. 다시 시도해주세요.";
let dashboardMountCount = 0;

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
        <h1>WatchUp</h1>
        <button type="button" disabled={loading} onClick={() => void logout()}>
          {loading ? "로그아웃 중입니다." : "로그아웃"}
        </button>
      </header>
      {error && <p role="alert">{error}</p>}
      <AccountTopUp />
      <HoldingsArea />
      <SearchArea />
    </main>
  );
}
