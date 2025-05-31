import type { SupabaseClient } from '@supabase/supabase-js'
import type { MeetingNote } from './types'

/**
 * Service class for CRUD operations on meeting notes using Supabase.
 */
export class MeetingNotesService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Create a meeting note for a meeting.
   */
  async create(meetingId: number, content: string): Promise<MeetingNote> {
    const { data, error } = await this.supabase
      .from('meeting_notes')
      .insert({ meeting_id: meetingId, note_content: content })
      .select()
      .single()

    if (error) throw error
    return data as MeetingNote
  }

  /** Get a meeting note by its id. */
  async getById(noteId: number): Promise<MeetingNote | null> {
    const { data, error } = await this.supabase
      .from('meeting_notes')
      .select('*')
      .eq('note_id', noteId)
      .maybeSingle()

    if (error) throw error
    return data as MeetingNote | null
  }

  /** Get the meeting note for a specific meeting. */
  async getByMeetingId(meetingId: number): Promise<MeetingNote | null> {
    const { data, error } = await this.supabase
      .from('meeting_notes')
      .select('*')
      .eq('meeting_id', meetingId)
      .maybeSingle()

    if (error) throw error
    return data as MeetingNote | null
  }

  /** Update the content of a meeting note. */
  async update(noteId: number, content: string): Promise<MeetingNote> {
    const { data, error } = await this.supabase
      .from('meeting_notes')
      .update({ note_content: content })
      .eq('note_id', noteId)
      .select()
      .single()

    if (error) throw error
    return data as MeetingNote
  }

  /** Delete a meeting note. */
  async delete(noteId: number): Promise<void> {
    const { error } = await this.supabase
      .from('meeting_notes')
      .delete()
      .eq('note_id', noteId)

    if (error) throw error
  }
}
