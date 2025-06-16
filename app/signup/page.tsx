"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { PublicRoute } from '@/components/auth/public-route'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

function SignUpPageContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const { signUp, loading } = useAuth()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password || !confirmPassword) {
      toast({ 
        title: 'Validation Error', 
        description: 'Please fill in all fields', 
        variant: 'destructive' 
      })
      return
    }

    if (password !== confirmPassword) {
      toast({ 
        title: 'Validation Error', 
        description: 'Passwords do not match', 
        variant: 'destructive' 
      })
      return
    }

    if (password.length < 6) {
      toast({ 
        title: 'Validation Error', 
        description: 'Password must be at least 6 characters', 
        variant: 'destructive' 
      })
      return
    }

    const { error } = await signUp(email, password)
    
    if (error) {
      toast({ 
        title: 'Sign up failed', 
        description: error.message, 
        variant: 'destructive' 
      })
    } else {
      toast({ 
        title: 'Success!', 
        description: 'Please check your email to confirm your account.' 
      })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Create an account
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your details below to create your account
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
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>
        <p className="px-8 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="underline underline-offset-4 hover:text-primary">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <PublicRoute requireUnauth={true}>
      <SignUpPageContent />
    </PublicRoute>
  )
}
