import { SupabaseClient } from '@supabase/supabase-js'
import { Meeting } from './types'

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
   * List upcoming or past meetings based on date.
   *
   * @param status - Whether to list `upcoming` or `past` meetings
   * @returns Array of meeting records
   */
  async list(status: 'upcoming' | 'past'): Promise<Meeting[]> {
    const today = new Date().toISOString().split('T')[0]
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
}
