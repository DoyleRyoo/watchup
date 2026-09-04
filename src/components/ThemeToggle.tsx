import { nextMode, useThemeStore, type ThemeMode } from '../stores/themeStore'

const MODE_LABEL: Record<ThemeMode, string> = {
  system: '시스템',
  light: '라이트',
  dark: '다크',
}

/** Icons follow the header pattern: inline SVG, currentColor, no icon library. */
function ModeIcon({ mode }: { mode: ThemeMode }) {
  const shared = { width: 22, height: 22, viewBox: '0 0 22 22', 'aria-hidden': true, focusable: 'false' } as const

  if (mode === 'light')
    return (
      <svg {...shared}>
        <circle cx="11" cy="11" r="4.2" fill="none" stroke="currentColor" strokeWidth="2" />
        <path
          d="M11 1.8v2.2M11 18v2.2M1.8 11H4M18 11h2.2M4.5 4.5 6 6M16 16l1.5 1.5M17.5 4.5 16 6M6 16l-1.5 1.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    )

  if (mode === 'dark')
    return (
      <svg {...shared}>
        <path
          d="M18.2 13.4A7.8 7.8 0 0 1 8.6 3.8a7.8 7.8 0 1 0 9.6 9.6Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    )

  return (
    <svg {...shared}>
      <rect x="2.5" y="4" width="17" height="11.5" rx="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M7.5 19h7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

/**
 * Three-state cycle: system → light → dark → system.
 * Shows the *selected mode*, not the resolved theme, so the button never has to
 * ask the OS what `system` currently means.
 */
export function ThemeToggle() {
  const mode = useThemeStore((state) => state.mode)
  const cycleMode = useThemeStore((state) => state.cycleMode)

  return (
    <button
      type="button"
      className="icon-button"
      aria-label={`테마: ${MODE_LABEL[mode]} (클릭하면 ${MODE_LABEL[nextMode(mode)]})`}
      onClick={cycleMode}
    >
      <ModeIcon mode={mode} />
    </button>
  )
}
