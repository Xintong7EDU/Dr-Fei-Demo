"use client"

import { useState, useEffect } from "react"

export type ToastVariant = "default" | "destructive" | "success"

export interface Toast {
  id: string
  title: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

interface ToastOptions {
  title: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = ({ title, description, variant = "default", duration = 5000 }: ToastOptions) => {
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
  }

  const dismiss = (id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id))
  }

  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => {
        setToasts((prevToasts) => {
          const [, ...rest] = prevToasts
          return rest
        })
      }, toasts[0].duration)

      return () => clearTimeout(timer)
    }
  }, [toasts])

  return {
    toast,
    dismiss,
    toasts,
  }
}

export default useToast 