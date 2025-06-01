import { MeetingsService } from '../../dist/lib/meetings.js'
import assert from 'node:assert/strict'
import { test } from 'node:test'

const today = new Date().toISOString().split('T')[0]

test('list calls correct query for upcoming', async () => {
  const calls = []
  const supabase = {
    from: (table) => ({
      select: () => ({
        order: (field, opts) => {
          calls.push({ stage: 'order', table, field, opts })
          return {
            gte: (f, val) => {
              calls.push({ stage: 'gte', field: f, val })
              return { data: [], error: null }
            },
            lt: (f, val) => {
              calls.push({ stage: 'lt', field: f, val })
              return { data: [], error: null }
            }
          }
        }
      })
    })
  }
  const svc = new MeetingsService(supabase)
  await svc.list('upcoming')
  assert.deepEqual(calls[0], { stage: 'order', table: 'meetings', field: 'meeting_date', opts: { ascending: true } })
  assert.deepEqual(calls[1], { stage: 'gte', field: 'meeting_date', val: today })
})

test('getById selects a meeting by id', async () => {
  const calls = []
  const supabase = {
    from: (table) => ({
      select: () => ({
        eq: (field, value) => {
          calls.push({ table, field, value })
          return { maybeSingle: () => ({ data: null, error: null }) }
        }
      })
    })
  }
  const svc = new MeetingsService(supabase)
  await svc.getById(3)
  assert.deepEqual(calls[0], { table: 'meetings', field: 'meeting_id', value: 3 })
})

test('create inserts a meeting', async () => {
  const calls = []
  const supabase = {
    from: (table) => ({
      insert: (vals) => {
        calls.push({ table, vals })
        return {
          select: () => ({
            single: async () => ({ data: { meeting_id: 1, ...vals }, error: null })
          })
        }
      }
    })
  }
  const svc = new MeetingsService(supabase)
  const meeting = await svc.create({
    meeting_date: '2024-01-01',
    start_time: '10:00',
    end_time: '11:00',
    topic_overview: 'Topic'
  })
  assert.deepEqual(calls[0], {
    table: 'meetings',
    vals: {
      meeting_date: '2024-01-01',
      start_time: '10:00',
      end_time: '11:00',
      topic_overview: 'Topic'
    }
  })
  assert.equal(meeting.topic_overview, 'Topic')
})

