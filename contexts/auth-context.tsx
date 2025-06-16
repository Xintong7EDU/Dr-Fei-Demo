"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { User, Session, AuthChangeEvent } from '@supabase/auth-js'
import { supabase } from '@/lib/supabase'
import type { AuthContextType, AuthState } from '@/types/auth'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  })
  const router = useRouter()

  // Initialize auth state and set up listener
  useEffect(() => {
    let mounted = true

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (mounted) {
          if (error) {
            console.error('Error getting initial session:', error)
            setAuthState({
              user: null,
              session: null,
              loading: false,
            })
          } else {
            setAuthState({
              user: session?.user ?? null,
              session,
              loading: false,
            })
          }
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
        if (mounted) {
          setAuthState({
            user: null,
            session: null,
            loading: false,
          })
        }
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (mounted) {
          setAuthState({
            user: session?.user ?? null,
            session,
            loading: false,
          })

          // Handle auth events
          switch (event) {
            case 'SIGNED_IN':
              // Redirect to dashboard after successful sign in
              router.push('/')
              break
            case 'SIGNED_OUT':
              // Ensure complete state cleanup
              setAuthState({
                user: null,
                session: null,
                loading: false,
              })
              // Redirect to login after sign out
              router.push('/login')
              break
            case 'TOKEN_REFRESHED':
              // Session refreshed successfully
              break
            case 'USER_UPDATED':
              // User metadata updated
              break
          }
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router])

  // Sign in function with error handling
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }))
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setAuthState(prev => ({ ...prev, loading: false }))
        return { error: new Error(error.message) }
      }

      // Success - state will be updated by the auth listener
      return { error: null }
    } catch (error) {
      setAuthState(prev => ({ ...prev, loading: false }))
      return { 
        error: error instanceof Error ? error : new Error('An unexpected error occurred')
      }
    }
  }, [])

  // Sign up function with error handling
  const signUp = useCallback(async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }))
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        setAuthState(prev => ({ ...prev, loading: false }))
        return { error: new Error(error.message) }
      }

      // Success - state will be updated by the auth listener
      setAuthState(prev => ({ ...prev, loading: false }))
      return { error: null }
    } catch (error) {
      setAuthState(prev => ({ ...prev, loading: false }))
      return { 
        error: error instanceof Error ? error : new Error('An unexpected error occurred')
      }
    }
  }, [])

  // Sign out function
  const signOut = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }))
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Error signing out:', error)
        // Even if Supabase sign out fails, clear local state for security
        setAuthState({
          user: null,
          session: null,
          loading: false,
        })
        // Still redirect to login for security
        router.push('/login')
        return { error: new Error(error.message) }
      }

      // Success - state will be updated by the auth listener
      return { error: null }
    } catch (error) {
      console.error('Error signing out:', error)
      // Force clear local state even on exceptions for security
      setAuthState({
        user: null,
        session: null,
        loading: false,
      })
      // Still redirect to login for security
      router.push('/login')
      return { 
        error: error instanceof Error ? error : new Error('An unexpected error occurred during sign out')
      }
    }
  }, [router])

  // Refresh session function
  const refreshSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession()
      
      if (error) {
        console.error('Error refreshing session:', error)
        return
      }

      setAuthState({
        user: session?.user ?? null,
        session,
        loading: false,
      })
    } catch (error) {
      console.error('Error refreshing session:', error)
    }
  }, [])

  const contextValue: AuthContextType = {
    ...authState,
    signIn,
    signUp,
    signOut,
    refreshSession,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}

// Helper hooks for common use cases
export function useUser(): User | null {
  const { user } = useAuth()
  return user
}

export function useSession(): Session | null {
  const { session } = useAuth()
  return session
}

export function useAuthLoading(): boolean {
  const { loading } = useAuth()
  return loading
} 