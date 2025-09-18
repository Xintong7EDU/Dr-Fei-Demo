import { SupabaseClient } from '@supabase/supabase-js'
import type { Note } from './types'

/**
 * Service for CRUD operations on standalone `notes`.
 * Notes represent HTML content pasted from sources like Google Docs.
 */
export class NotesService {
  private supabase: SupabaseClient

  /** Create service instance bound to a Supabase client */
  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  /** List recent notes ordered by created_at desc */
  async list(limit = 50): Promise<Note[]> {
    const { data, error } = await this.supabase
      .from('notes')
      .select('*')
      // Sort by meeting_date DESC (nulls last), then created_at DESC
      .order('meeting_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return (data ?? []) as Note[]
  }

  /** Get a note by id */
  async getById(noteId: number): Promise<Note | null> {
    const { data, error } = await this.supabase
      .from('notes')
      .select('*')
      .eq('note_id', noteId)
      .maybeSingle()

    if (error) throw error
    return data as Note | null
  }

  /** Create a new note */
  async create(params: { title?: string | null; html_content: string; meeting_date?: string | null }): Promise<Note> {
    const { title = null, html_content, meeting_date = null } = params
    const { data, error } = await this.supabase
      .from('notes')
      .insert({ title, html_content, meeting_date })
      .select()
      .single()

    if (error) throw error
    return data as Note
  }

  /** Update an existing note */
  async update(noteId: number, updates: Partial<Pick<Note, 'title' | 'html_content' | 'meeting_date'>>): Promise<Note> {
    const { data, error } = await this.supabase
      .from('notes')
      .update(updates)
      .eq('note_id', noteId)
      .select()
      .single()

    if (error) throw error
    return data as Note
  }

  /** Delete a note by id */
  async delete(noteId: number): Promise<void> {
    const { error } = await this.supabase
      .from('notes')
      .delete()
      .eq('note_id', noteId)

    if (error) throw error
  }
}


