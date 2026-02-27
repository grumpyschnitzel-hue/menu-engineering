'use client'

import { useState, useEffect, useCallback, createContext, useContext } from 'react'

type ToastVariant = 'success' | 'error' | 'info'

interface ToastMessage {
  id: number
  text: string
  variant: ToastVariant
  exiting?: boolean
}

interface ToastContextType {
  showToast: (text: string, variant?: ToastVariant) => void
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

let nextId = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showToast = useCallback((text: string, variant: ToastVariant = 'success') => {
    const id = nextId++
    setToasts(prev => [...prev, { id, text, variant }])

    // Start exit animation after 2.5s, then remove after animation completes
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t))
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, 300)
    }, 2500)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`toast ${toast.exiting ? 'toast-exit' : ''} toast-${toast.variant}`}
          >
            {toast.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
