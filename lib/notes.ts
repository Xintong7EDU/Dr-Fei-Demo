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
  async create(params: { title?: string | null; html_content: string; meeting_date?: string | null; user_id?: string }): Promise<Note> {
    const { title = null, html_content, meeting_date = null } = params

    const { data, error } = await this.supabase
      .from('notes')
      .insert({ title, html_content, meeting_date, user_id: null }) // Notes are universal
      .select()
      .single()

    if (error) throw error
    
    const note = data as Note

    // Trigger embedding in background (no user_id needed for universal notes)
    this.triggerEmbedding(note.note_id)

    return note
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
    
    const note = data as Note

    // Trigger embedding if content changed
    if (updates.html_content) {
      this.triggerEmbedding(noteId)
    }

    return note
  }

  /** Delete a note by id */
  async delete(noteId: number): Promise<void> {
    const { error } = await this.supabase
      .from('notes')
      .delete()
      .eq('note_id', noteId)

    if (error) throw error
  }

  /** Trigger embedding generation for a note (non-blocking) */
  private async triggerEmbedding(noteId: number): Promise<void> {
    try {
      // Call the Supabase Edge Function to process embeddings
      const { error } = await this.supabase.functions.invoke('embed-notes', {
        body: {
          note_ids: [noteId],
          // No user_id needed for universal notes
        },
      })

      if (error) {
        console.warn('Failed to trigger embedding for note', noteId, ':', error)
      }
    } catch (error) {
      // Don't throw - embedding is background process
      console.warn('Failed to trigger embedding for note', noteId, ':', error)
    }
  }

  /** Manually trigger embedding for multiple notes */
  async embedNotes(noteIds: number[], userId?: string): Promise<void> {
    const { error } = await this.supabase.functions.invoke('embed-notes', {
      body: {
        note_ids: noteIds,
        user_id: userId,
      },
    })

    if (error) throw error
  }

  /** Trigger embedding for all user notes */
  async embedAllNotes(userId?: string): Promise<void> {
    const { error } = await this.supabase.functions.invoke('embed-notes', {
      body: {
        user_id: userId,
      },
    })

    if (error) throw error
  }
}


