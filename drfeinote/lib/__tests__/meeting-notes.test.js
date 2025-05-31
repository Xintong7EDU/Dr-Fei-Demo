import { MeetingNotesService } from '../meeting-notes'
import assert from 'node:assert/strict'
import { test } from 'node:test'

test('create inserts a meeting note', async () => {
  const calls: any[] = []
  const supabase = {
    from: (table: string) => ({
      insert: (vals: any) => {
        calls.push({ table, vals })
        return {
          select: () => ({
            single: async () => ({ data: { note_id: 1, ...vals }, error: null })
          })
        }
      }
    })
  }

  const svc = new MeetingNotesService(supabase as any)
  const note = await svc.create(1, 'text')
  assert.deepEqual(calls[0], { table: 'meeting_notes', vals: { meeting_id: 1, note_content: 'text' } })
  assert.equal(note.note_content, 'text')
})

test('getById selects a note by id', async () => {
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

  const svc = new MeetingNotesService(supabase as any)
  await svc.getById(5)
  assert.deepEqual(calls[0], { table: 'meeting_notes', field: 'note_id', value: 5 })
})

test('update changes note content', async () => {
  const calls: any[] = []
  const supabase = {
    from: (table: string) => ({
      update: (vals: any) => ({
        eq: (field: string, value: any) => {
          calls.push({ table, field, value, vals })
          return {
            select: () => ({
              single: async () => ({ data: { note_id: value, ...vals }, error: null })
            })
          }
        }
      })
    })
  }

  const svc = new MeetingNotesService(supabase as any)
  const note = await svc.update(3, 'updated')
  assert.deepEqual(calls[0], { table: 'meeting_notes', field: 'note_id', value: 3, vals: { note_content: 'updated' } })
  assert.equal(note.note_content, 'updated')
})

test('delete removes a note', async () => {
  const calls: any[] = []
  const supabase = {
    from: (table: string) => ({
      delete: () => ({
        eq: (field: string, value: any) => {
          calls.push({ table, field, value })
          return { error: null }
        }
      })
    })
  }

  const svc = new MeetingNotesService(supabase as any)
  await svc.delete(2)
  assert.deepEqual(calls[0], { table: 'meeting_notes', field: 'note_id', value: 2 })
})
