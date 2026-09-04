import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import { useAuthStore } from '../stores/authStore'
import { THEME_STORAGE_KEY, useThemeStore } from '../stores/themeStore'
afterEach(() => {
  cleanup()
  useAuthStore.getState().reset()
  // Clear storage first: reset() re-reads it, so this lands on `system`.
  try { localStorage.removeItem(THEME_STORAGE_KEY) } catch { /* storage blocked */ }
  useThemeStore.getState().reset()
})
