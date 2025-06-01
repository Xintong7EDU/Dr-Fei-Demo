"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from "react"
import { Toast, ToastVariant } from "@/hooks/use-toast"

interface ToastOptions {
  title: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

interface ToastContextType {
  toast: (options: ToastOptions) => string
  dismiss: (id: string) => void
  toasts: Toast[]
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback(({ title, description, variant = "default", duration = 5000 }: ToastOptions) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast: Toast = {
      id,
      title,
      description,
      variant,
      duration,
    }

    setToasts((prevToasts) => [...prevToasts, newToast])
    return id
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id))
  }, [])

  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => {
        setToasts((prevToasts) => {
          if (prevToasts.length === 0) return prevToasts
          const [firstToast, ...rest] = prevToasts
          return rest
        })
      }, toasts[0].duration)

      return () => clearTimeout(timer)
    }
  }, [toasts])

  return (
    <ToastContext.Provider value={{ toast, dismiss, toasts }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToastContext() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error("useToastContext must be used within a ToastProvider")
  }
  return context
} 