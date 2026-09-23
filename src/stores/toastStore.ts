import { create } from 'zustand'
import { useAuthStore } from './authStore'

export type ToastTone = 'error' | 'success'
export type Toast = { id: string; tone: ToastTone; message: string }
type ToastState = {
  toasts: Toast[]
  show: (tone: ToastTone, message: string) => string
  dismiss: (id: string) => void
  clear: () => void
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  show: (tone, message) => {
    const id = crypto.randomUUID()
    set(state => ({ toasts: [...state.toasts, { id, tone, message }].slice(-2) }))
    return id
  },
  dismiss: id => set(state => ({ toasts: state.toasts.filter(toast => toast.id !== id) })),
  clear: () => set({ toasts: [] }),
}))

// A request abandoned by any identity transition must stay silent, even A→B→A.
let sessionVersion = 0
export const getToastSessionVersion = () => sessionVersion
useAuthStore.subscribe((state, previous) => {
  if (state.session?.user.id !== previous.session?.user.id) {
    sessionVersion += 1
    useToastStore.getState().clear()
  }
})
