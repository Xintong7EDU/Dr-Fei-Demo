"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, useAuthLoading } from '@/contexts/auth-context'

interface PublicRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
  requireUnauth?: boolean
}

export function PublicRoute({ 
  children, 
  fallback = <div>Loading...</div>,
  redirectTo = '/',
  requireUnauth = false
}: PublicRouteProps) {
  const { user } = useAuth()
  const loading = useAuthLoading()
  const router = useRouter()

  useEffect(() => {
    // If requireUnauth is true, redirect authenticated users
    if (!loading && requireUnauth && user) {
      router.push(redirectTo)
    }
  }, [user, loading, router, redirectTo, requireUnauth])

  // Show loading while checking auth state
  if (loading) {
    return <>{fallback}</>
  }

  // If requireUnauth is true and user is authenticated, show fallback (while redirecting)
  if (requireUnauth && user) {
    return <>{fallback}</>
  }

  // Render children for public routes
  return <>{children}</>
}

// Higher-order component version for wrapping auth pages
export function withPublicRoute<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    fallback?: React.ReactNode
    redirectTo?: string
    requireUnauth?: boolean
  }
) {
  const displayName = Component.displayName || Component.name || 'Component'
  
  const WrappedComponent = (props: P) => (
    <PublicRoute {...options}>
      <Component {...props} />
    </PublicRoute>
  )
  
  WrappedComponent.displayName = `withPublicRoute(${displayName})`
  
  return WrappedComponent
} 