import { SupabaseClient } from '@supabase/supabase-js'
import { Meeting } from './types'
import { getCurrentDateStringPST } from './utils'

/**
 * Provides CRUD operations for the `meetings` table.
 */
export class MeetingsService {
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
   * Create a new meeting record.
   *
   * @param meeting - Meeting fields excluding the id
   * @returns The newly created meeting
   */
  async create(
    meeting: Omit<Meeting, 'meeting_id'>
  ): Promise<Meeting> {
    const { data, error } = await this.supabase
      .from('meetings')
      .insert(meeting)
      .select()
      .single()

    if (error) throw error
    return data as Meeting
  }

  /**
   * List upcoming or past meetings based on date in PST timezone.
   *
   * @param status - Whether to list `upcoming` or `past` meetings
   * @returns Array of meeting records
   */
  async list(status: 'upcoming' | 'past'): Promise<Meeting[]> {
    const today = getCurrentDateStringPST()
    let query = this.supabase
      .from('meetings')
      .select('*')
      .order('meeting_date', { ascending: status === 'upcoming' })

    if (status === 'upcoming') {
      query = query.gte('meeting_date', today)
    } else {
      query = query.lt('meeting_date', today)
    }

    const { data, error } = await query
    if (error) throw error
    return data ?? []
  }

  /**
   * Get a single meeting by id.
   *
   * @param meetingId - Meeting identifier
   */
  async getById(meetingId: number): Promise<Meeting | null> {
    const { data, error } = await this.supabase
      .from('meetings')
      .select('*')
      .eq('meeting_id', meetingId)
      .maybeSingle()

    if (error) throw error
    return data ?? null
  }

  /**
   * Update an existing meeting record.
   *
   * @param meetingId - Identifier of the meeting to update
   * @param updates - Fields to update
   * @returns The updated meeting
   */
  async update(
    meetingId: number,
    updates: Partial<Omit<Meeting, 'meeting_id'>>
  ): Promise<Meeting> {
    const { data, error } = await this.supabase
      .from('meetings')
      .update(updates)
      .eq('meeting_id', meetingId)
      .select()
      .single()

    if (error) throw error
    return data as Meeting
  }
}
