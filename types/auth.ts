import type { User, Session } from '@supabase/auth-js'

export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
}

export interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

export interface SignInCredentials {
  email: string
  password: string
}

export interface SignUpCredentials extends SignInCredentials {
  confirmPassword?: string
}

export interface AuthError {
  message: string
  code?: string
} 