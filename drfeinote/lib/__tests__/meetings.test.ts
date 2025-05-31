import { MeetingsService } from '../meetings'
import assert from 'node:assert/strict'
import { test } from 'node:test'

test('getRecent selects meetings ordered by date desc', async () => {
  const calls: any[] = []
  const supabase = {
    from: (table: string) => ({
      select: () => ({
        order: (field: string, opts: any) => ({
          limit: (n: number) => {
            calls.push({ table, field, opts, limit: n })
            return { data: [], error: null }
          }
        })
      })
    })
  }
  const svc = new MeetingsService(supabase as any)
  await svc.getRecent(3)
  assert.deepEqual(calls[0], { table: 'meetings', field: 'meeting_date', opts: { ascending: false }, limit: 3 })
})
