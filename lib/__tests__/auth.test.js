import { signIn, signUp } from '../auth.js'
import assert from 'node:assert/strict'
import { test } from 'node:test'

test('signIn calls supabase.auth.signInWithPassword', async () => {
  const calls = []
  const supabase = {
    auth: {
      signInWithPassword: async (opts) => {
        calls.push(opts)
        return { data: {}, error: null }
      }
    }
  }
  await signIn(supabase, 'a@b.com', 'pass')
  assert.deepEqual(calls[0], { email: 'a@b.com', password: 'pass' })
})

test('signUp calls supabase.auth.signUp', async () => {
  const calls = []
  const supabase = {
    auth: {
      signUp: async (opts) => {
        calls.push(opts)
        return { data: {}, error: null }
      }
    }
  }
  await signUp(supabase, 'a@b.com', 'pass')
  assert.deepEqual(calls[0], { email: 'a@b.com', password: 'pass' })
})
