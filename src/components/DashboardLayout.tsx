import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AccountSummary } from '../features/paper/AccountSummary'
import { HoldingsArea } from '../features/watchup/HoldingsArea'
import { SEARCH_INPUT_ID, SearchArea } from '../features/watchup/SearchArea'
import { useWatchupStore } from '../stores/watchupStore'
import { AppHeader } from './AppHeader'
import { BackIcon } from './BackIcon'

type Props = { children?: ReactNode; marketCode?: string; onBack?: () => void; trading?: boolean }

export function DashboardLayout({ children, marketCode, onBack, trading = false }: Props) {
  const [searchOpen, setSearchOpen] = useState(false)
  const shell = useRef<HTMLElement>(null)
  const searchQuery = useWatchupStore((state) => state.searchQuery)
  useEffect(() => () => useWatchupStore.getState().cancelPendingRequests(), [])
  const openSearch = () => {
    setSearchOpen(true)
    requestAnimationFrame(() => document.getElementById(SEARCH_INPUT_ID)?.focus())
  }
  const closeSearch = () => {
    setSearchOpen(false)
    useWatchupStore.getState().setSearchQuery('')
    shell.current?.querySelector<HTMLButtonElement>('.header-search')?.focus()
  }
  const selectCoin = () => { closeSearch(); onBack?.() }
  return <main ref={shell} className={`app-shell${marketCode ? ' detail-shell' : ''}${searchOpen ? ' search-active' : ''}${trading ? ' trading-active' : ''}`}>
    <AppHeader onSearch={openSearch} detail={Boolean(marketCode)} onBack={onBack} />
    <div className="dashboard-search">
      <button type="button" className="icon-button search-back" aria-label="검색 닫기" onClick={closeSearch}><BackIcon /></button>
      <SearchArea onClose={closeSearch} onSelect={selectCoin} />
    </div>
    <AccountSummary />
    <div className={`dashboard-grid${searchOpen && searchQuery.trim() ? ' has-search-query' : ''}`}>
      <HoldingsArea selectedMarketCode={marketCode} onSelect={selectCoin} />
      {children}
    </div>
  </main>
}
