// This entry is served only by verification/server.mjs. Production main.tsx is unchanged.
import type { Session } from '@supabase/supabase-js'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from '../src/App'
import '../src/index.css'
import { getSupabaseClient } from '../src/lib/supabase'
import { useAuthStore } from '../src/stores/authStore'
import { useThemeStore } from '../src/stores/themeStore'

const session: Session = {
  access_token: 'verification-only-access-token',
  refresh_token: 'verification-only-refresh-token',
  token_type: 'bearer',
  expires_in: 3600,
  user: {
    id: '00000000-0000-4000-8000-000000000001',
    app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: '2026-09-01T00:00:00Z',
  },
}

const auth = getSupabaseClient().auth
auth.getSession = async () => ({ data: { session: useAuthStore.getState().session }, error: null })
auth.signOut = async () => {
  useAuthStore.getState().setSession(null)
  return { error: null }
}
useAuthStore.getState().completeInitialization(location.pathname === '/login' ? null : session)
useThemeStore.getState().reset()
createRoot(document.getElementById('root')!).render(<BrowserRouter><AppRoutes /></BrowserRouter>)
