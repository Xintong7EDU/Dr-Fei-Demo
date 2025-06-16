"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, useAuthLoading } from '@/contexts/auth-context'

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
}

export function ProtectedRoute({ 
  children, 
  fallback = <div>Loading...</div>,
  redirectTo = '/login' 
}: ProtectedRouteProps) {
  const { user } = useAuth()
  const loading = useAuthLoading()
  const router = useRouter()

  useEffect(() => {
    // Only redirect if we're done loading and there's no user
    if (!loading && !user) {
      router.push(redirectTo)
    }
  }, [user, loading, router, redirectTo])

  // Show loading while checking auth state
  if (loading) {
    return <>{fallback}</>
  }

  // Show fallback if no user (while redirecting)
  if (!user) {
    return <>{fallback}</>
  }

  // User is authenticated, render children
  return <>{children}</>
}

// Higher-order component version for wrapping pages
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    fallback?: React.ReactNode
    redirectTo?: string
  }
) {
  const displayName = Component.displayName || Component.name || 'Component'
  
  const WrappedComponent = (props: P) => (
    <ProtectedRoute {...options}>
      <Component {...props} />
    </ProtectedRoute>
  )
  
  WrappedComponent.displayName = `withAuth(${displayName})`
  
  return WrappedComponent
} 