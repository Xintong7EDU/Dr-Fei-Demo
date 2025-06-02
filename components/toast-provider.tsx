"use client"

import { ToastProvider as ToastContextProvider } from "@/hooks/use-toast-context"
import { useToastContext } from "@/hooks/use-toast-context"
import { ToastContainer } from "@/components/ui/toast"

export function ToastContent() {
  const { toasts, dismiss } = useToastContext()
  return <ToastContainer toasts={toasts} onDismiss={dismiss} />
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <ToastContextProvider>
      {children}
      <ToastContent />
    </ToastContextProvider>
  )
} 