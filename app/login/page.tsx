"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { PublicRoute } from '@/components/auth/public-route'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

function LoginPageContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { signIn, loading } = useAuth()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast({ 
        title: 'Validation Error', 
        description: 'Please fill in all fields', 
        variant: 'destructive' 
      })
      return
    }

    const { error } = await signIn(email, password)
    
    if (error) {
      toast({ 
        title: 'Sign in failed', 
        description: error.message, 
        variant: 'destructive' 
      })
    } else {
      toast({ 
        title: 'Welcome back!', 
        description: 'You have successfully signed in.' 
      })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your email below to sign in to your account
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
        <p className="px-8 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="underline underline-offset-4 hover:text-primary">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <PublicRoute requireUnauth={true}>
      <LoginPageContent />
    </PublicRoute>
  )
}
