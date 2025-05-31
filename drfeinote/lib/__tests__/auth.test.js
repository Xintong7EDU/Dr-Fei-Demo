import { signIn, signUp } from '../auth'
import assert from 'node:assert/strict'
import { test } from 'node:test'

test('signIn calls supabase.auth.signInWithPassword', async () => {
  const calls: any[] = []
  const supabase = {
    auth: {
      signInWithPassword: async (opts: any) => {
        calls.push(opts)
        return { data: {}, error: null }
      }
    }
  }
  await signIn(supabase as any, 'a@b.com', 'pass')
  assert.deepEqual(calls[0], { email: 'a@b.com', password: 'pass' })
})

test('signUp calls supabase.auth.signUp', async () => {
  const calls: any[] = []
  const supabase = {
    auth: {
      signUp: async (opts: any) => {
        calls.push(opts)
        return { data: {}, error: null }
      }
    }
  }
  await signUp(supabase as any, 'a@b.com', 'pass')
  assert.deepEqual(calls[0], { email: 'a@b.com', password: 'pass' })
})
