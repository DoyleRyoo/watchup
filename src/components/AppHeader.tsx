import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { History, LogOut, Search, Wallet, X } from 'lucide-react'
import { AccountTopUp } from '../features/paper/AccountTopUp'
import { TradeHistory } from '../features/paper/TradeHistory'
import { getSupabaseClient } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useWatchupStore } from '../stores/watchupStore'
import { ThemeToggle } from './ThemeToggle'
import { usePaperStore } from '../stores/paperStore'
import { formatSignedKrw } from '../features/paper/format'
import { BackIcon } from './BackIcon'

type Props = { onSearch: () => void; detail?: boolean; onBack?: () => void }

export function AppHeader({ onSearch, detail = false, onBack }: Props) {
  const navigate = useNavigate()
  const realizedPnl = usePaperStore((state) => state.totals?.totalRealizedPnlKrw ?? null)
  const dialog = useRef<HTMLDialogElement>(null)
  const [panel, setPanel] = useState<'account' | 'history'>('account')
  const [historyRevision, setHistoryRevision] = useState(0)
  const loading = useAuthStore((state) => state.logoutLoading)
  const error = useAuthStore((state) => state.authError)
  const openPanel = (next: typeof panel) => {
    setPanel(next)
    if (next === 'history') setHistoryRevision((value) => value + 1)
    dialog.current?.showModal()
  }
  const logout = async () => {
    const store = useAuthStore.getState()
    if (store.logoutLoading) return
    store.setLogoutLoading(true)
    store.setAuthError(null)
    try {
      const result = await getSupabaseClient().auth.signOut()
      if (result.error) throw result.error
      useWatchupStore.getState().cancelPendingRequests()
      store.setSession(null)
      navigate('/login', { replace: true })
    } catch {
      store.setAuthError('로그아웃에 실패했습니다. 다시 시도해주세요.')
    } finally {
      store.setLogoutLoading(false)
    }
  }
  return <>
    <header className={`app-header${detail ? ' detail-header' : ''}`}>
      <Link to="/" className="brand" aria-label="WatchUp 홈">
        <span className="brand-mark"><img src="/icons/android-icon-192x192.png" alt="" /></span>
        <h1><span className="sr-only">W</span>atchUp</h1>
      </Link>
      {detail && (onBack
        ? <button className="icon-button back-link" aria-label="차트로 돌아가기" onClick={onBack}><BackIcon /></button>
        : <Link className="icon-button back-link" to="/" aria-label="검색으로 돌아가기"><BackIcon /></Link>)}
      <div className="header-actions">
        <button type="button" className="icon-button" title="모의투자 충전" aria-label="모의투자 충전 열기" onClick={() => openPanel('account')}><Wallet size={18} /></button>
        <button type="button" className="icon-button" title="거래 내역" aria-label="거래 내역 열기" onClick={() => openPanel('history')}><History size={18} /></button>
        <ThemeToggle />
        <button type="button" className="icon-button" title="로그아웃" aria-label={loading ? '로그아웃 중입니다.' : '로그아웃'} disabled={loading} onClick={() => void logout()}><LogOut size={18} /></button>
        <button type="button" className="icon-button header-search" aria-label="코인 검색으로 이동" onClick={onSearch}><Search size={29} strokeWidth={2} /></button>
      </div>
    </header>
    {error && <p role="alert">{error}</p>}
    <dialog ref={dialog} className="account-dialog" aria-label={panel === 'account' ? '모의투자 충전' : '거래 내역'}>
      <button type="button" className="icon-button dialog-close" aria-label="닫기" onClick={() => dialog.current?.close()}><X size={20} /></button>
      <div hidden={panel !== 'account'}><AccountTopUp /><dl className="detail-metrics"><div><dt>누적 실현 손익</dt><dd>{formatSignedKrw(realizedPnl)}</dd></div></dl></div>
      {panel === 'history' && <TradeHistory key={historyRevision} />}
    </dialog>
  </>
}
