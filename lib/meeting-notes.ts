
import { SupabaseClient } from '@supabase/supabase-js'
import type { MeetingNote } from './types'

/**
 * Manages `meeting_notes` records in Supabase.
 *
 * Each method wraps the corresponding database operation and
 * returns strongly typed results.
 */
export class MeetingNotesService {
  private supabase: SupabaseClient
  /**
   * Create a new service instance.
   *
   * @param supabase - Initialized Supabase client
   */
  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  /**
   * Create a meeting note for a meeting.
   *
   * @param meetingId - Identifier of the meeting
   * @param content - Text content of the note
   * @returns The newly created meeting note
   */
  async create(meetingId: number, content: string): Promise<MeetingNote> {
    const { data, error } = await this.supabase
      .from('meeting_notes')
      .insert({ meeting_id: meetingId, note_content: content })
      .select()
      .single()

    if (error) throw error
    return data
  }
  /**
   * Get a meeting note by its id.
   *
   * @param noteId - Note identifier
   */
  async getById(noteId: number): Promise<MeetingNote | null> {
    const { data, error } = await this.supabase
      .from('meeting_notes')
      .select('*')
      .eq('note_id', noteId)
      .maybeSingle()

    if (error) throw error
    return data
  }

  /**
   * Get the note attached to a specific meeting.
   *
   * @param meetingId - Meeting identifier
   */
  async getByMeetingId(meetingId: number): Promise<MeetingNote | null> {
    const { data, error } = await this.supabase
      .from('meeting_notes')
      .select('*')
      .eq('meeting_id', meetingId)
      .maybeSingle()

    if (error) throw error
    return data
  }

  /**
   * Update the content of a meeting note.
   *
   * @param noteId - Note identifier
   * @param content - New note text
   * @returns The updated note record
   */

  async update(noteId: number, content: string): Promise<MeetingNote> {
    const { data, error } = await this.supabase
      .from('meeting_notes')
      .update({ note_content: content })
      .eq('note_id', noteId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Delete a meeting note.
   *
   * @param noteId - Identifier of the note to delete
   */

  async delete(noteId: number): Promise<void> {
    const { error } = await this.supabase
      .from('meeting_notes')
      .delete()
      .eq('note_id', noteId)

    if (error) throw error
  }
}
