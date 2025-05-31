import type { SupabaseClient } from '@supabase/supabase-js'
import type { Meeting } from './types'

/**
 * Service for retrieving meetings from Supabase.
 */
export class MeetingsService {
  constructor(private supabase: SupabaseClient) {}

  /** Get the most recent meetings. */
  async getRecent(limit = 5): Promise<Meeting[]> {
    const { data, error } = await this.supabase
      .from('meetings')
      .select('*')
      .order('meeting_date', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data as Meeting[]
  }

  /** Upcoming meetings from today onward. */
  async getUpcoming(): Promise<Meeting[]> {
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await this.supabase
      .from('meetings')
      .select('*')
      .gte('meeting_date', today)
      .order('meeting_date', { ascending: true })

    if (error) throw error
    return data as Meeting[]
  }

  /** Past meetings prior to today. */
  async getPast(): Promise<Meeting[]> {
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await this.supabase
      .from('meetings')
      .select('*')
      .lt('meeting_date', today)
      .order('meeting_date', { ascending: false })

    if (error) throw error
    return data as Meeting[]
  }

  /** Get single meeting by id. */
  async getById(id: number): Promise<Meeting | null> {
    const { data, error } = await this.supabase
      .from('meetings')
      .select('*')
      .eq('meeting_id', id)
      .maybeSingle()

    if (error) throw error
    return data as Meeting | null
  }
}
