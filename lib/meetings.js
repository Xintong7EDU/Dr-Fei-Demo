import type { SupabaseClient } from '@supabase/supabase-js'
import type { Meeting } from './types'

/** Service for meeting CRUD operations */
export class MeetingsService {
  constructor(private supabase: SupabaseClient) {}

  /** List upcoming or past meetings based on date */
  async list(status: 'upcoming' | 'past'): Promise<Meeting[]> {
    const today = new Date().toISOString().split('T')[0]
    let query = this.supabase
      .from('meetings')
      .select('*')
      .order('meeting_date', { ascending: true })

    if (status === 'upcoming') {
      query = query.gte('meeting_date', today)
    } else {
      query = query.lt('meeting_date', today)
    }

    const { data, error } = await query
    if (error) throw error
    return (data ?? []) as Meeting[]
  }

  /** Get a single meeting by id */
  async getById(meetingId: number): Promise<Meeting | null> {
    const { data, error } = await this.supabase
      .from('meetings')
      .select('*')
      .eq('meeting_id', meetingId)
      .maybeSingle()

    if (error) throw error
    return data as Meeting | null
  }
}
