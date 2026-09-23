import { useEffect } from 'react'
import { useToastStore, type Toast } from '../stores/toastStore'

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useToastStore(state => state.dismiss)
  useEffect(() => {
    if (toast.tone !== 'success') return
    const timer = window.setTimeout(() => dismiss(toast.id), 4000)
    return () => window.clearTimeout(timer)
  }, [dismiss, toast.id, toast.tone])
  return <div className={`toast ${toast.tone}`} role={toast.tone === 'error' ? 'alert' : 'status'}>
    <p>{toast.message}</p>
    <button type="button" className="toast-dismiss" aria-label="닫기" onClick={() => dismiss(toast.id)}>닫기</button>
  </div>
}

export function ToastHost() {
  const toasts = useToastStore(state => state.toasts)
  return <div className="toast-host" aria-label="거래 알림">
    {toasts.map(toast => <ToastItem key={toast.id} toast={toast} />)}
  </div>
}
