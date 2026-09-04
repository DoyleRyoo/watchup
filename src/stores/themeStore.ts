import { create } from 'zustand'

/** Shared with the pre-paint stamp in index.html — change both together. */
export const THEME_STORAGE_KEY = 'watchup.theme'

export type ThemeMode = 'system' | 'light' | 'dark'

/** Cycle order of the header toggle. */
const MODES: readonly ThemeMode[] = ['system', 'light', 'dark']

const isThemeMode = (value: unknown): value is ThemeMode =>
  typeof value === 'string' && MODES.includes(value as ThemeMode)

export function nextMode(mode: ThemeMode): ThemeMode {
  return MODES[(MODES.indexOf(mode) + 1) % MODES.length]
}

/** Whitelist read — anything missing or corrupted falls back to `system`. */
export function readStoredMode(): ThemeMode {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY)
    return isThemeMode(raw) ? raw : 'system'
  } catch {
    return 'system' // storage blocked (private mode) — memory only
  }
}

function writeStoredMode(mode: ThemeMode): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode)
  } catch {
    // storage blocked — the choice still applies for this session
  }
}

/**
 * The single place that touches the DOM. `system` removes the attribute so
 * `@media (prefers-color-scheme: dark)` decides and tracks OS changes on its
 * own — no matchMedia listener needed.
 */
export function applyThemeMode(mode: ThemeMode): void {
  const root = document.documentElement
  if (mode === 'system') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', mode)
}

type ThemeState = {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  cycleMode: () => void
  reset: () => void
}

/**
 * Initial state comes from storage, matching what the index.html stamp already
 * put on <html> before first paint — so no mount-time effect re-applies it.
 */
export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: readStoredMode(),
  setMode: (mode) => {
    writeStoredMode(mode)
    applyThemeMode(mode)
    set({ mode })
  },
  cycleMode: () => get().setMode(nextMode(get().mode)),
  reset: () => {
    const mode = readStoredMode()
    applyThemeMode(mode)
    set({ mode })
  },
}))
