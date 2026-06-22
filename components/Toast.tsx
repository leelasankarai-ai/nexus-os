import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react'

interface ToastItem {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

interface ToastContextType {
  toast: (message: string, type?: ToastItem['type']) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

let toastId = 0
const MAX_TOASTS = 5
const TOAST_DURATION = 3500

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const toast = useCallback((message: string, type: ToastItem['type'] = 'info') => {
    const id = ++toastId
    setToasts(prev => [...prev.slice(-(MAX_TOASTS - 1)), { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), TOAST_DURATION)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none" role="status" aria-live="polite" aria-label="Notifications">
        {toasts.map(t => (
          <div key={t.id}
            className={`pointer-events-auto px-4 py-3 rounded-xl text-sm font-mono shadow-2xl border backdrop-blur-md animate-slide-up ${
              t.type === 'success' ? 'bg-emerald-500/90 border-emerald-400/30 text-white' :
              t.type === 'error' ? 'bg-red-500/90 border-red-400/30 text-white' :
              'bg-nexus-700/90 border-nexus-500/30 text-nexus-100'
            }`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be inside ToastProvider')
  return ctx
}
