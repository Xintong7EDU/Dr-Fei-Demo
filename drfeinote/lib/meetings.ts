import type { SupabaseClient } from '@supabase/supabase-js'
import type { Meeting } from './types'

/** Service class for reading meetings from Supabase. */
export class MeetingsService {
  constructor(private supabase: SupabaseClient) {}

  /** Get upcoming meetings (meeting_date >= today). */
  async getUpcoming(): Promise<Meeting[]> {
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await this.supabase
      .from('meetings')
      .select('*')
      .gte('meeting_date', today)
      .order('meeting_date')

    if (error) throw error
    return data as Meeting[]
  }

  /** Get past meetings (meeting_date < today). */
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

  /** Fetch a meeting by its id. */
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
