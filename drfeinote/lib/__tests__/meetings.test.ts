import { MeetingsService } from '../meetings'
import assert from 'node:assert/strict'
import { test } from 'node:test'

test('getUpcoming selects upcoming meetings', async () => {
  const calls: any[] = []
  const supabase = {
    from: (table: string) => ({
      select: () => ({
        gte: (field: string, value: any) => ({
          order: (f: string, opts?: any) => {
            calls.push({ table, field, value, orderField: f, opts })
            return { data: [], error: null }
          }
        })
      })
    })
  }

  const svc = new MeetingsService(supabase as any)
  await svc.getUpcoming()
  assert.equal(calls[0].table, 'meetings')
})

test('getById selects by meeting_id', async () => {
  const calls: any[] = []
  const supabase = {
    from: (table: string) => ({
      select: () => ({
        eq: (field: string, value: any) => {
          calls.push({ table, field, value })
          return { maybeSingle: async () => ({ data: null, error: null }) }
        }
      })
    })
  }

  const svc = new MeetingsService(supabase as any)
  await svc.getById(3)
  assert.deepEqual(calls[0], { table: 'meetings', field: 'meeting_id', value: 3 })
})
