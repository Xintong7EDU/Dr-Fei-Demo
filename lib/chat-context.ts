import { SupabaseClient } from '@supabase/supabase-js'
import type { MeetingContext } from './types'
import { MeetingsService } from './meetings'
import { MeetingNotesService } from './meeting-notes'

// Type for database meeting with nested notes
interface MeetingWithNotes {
  meeting_id: number
  meeting_date: string
  start_time: string
  end_time: string
  topic_overview: string
  meeting_link?: string
  meeting_notes: Array<{
    note_id: number
    note_content: string
    summary?: string
    summary_generated_at?: string
  }>
}

/**
 * Service for preparing meeting context for AI chat
 * Combines meeting data and notes for optimal AI consumption
 */
export class ChatContextService {
  private supabase: SupabaseClient
  private meetingsService: MeetingsService
  private meetingNotesService: MeetingNotesService

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
    this.meetingsService = new MeetingsService(supabase)
    this.meetingNotesService = new MeetingNotesService(supabase)
  }

  /**
   * Prepare meeting context for a single meeting
   * @param meetingId - The ID of the meeting
   * @returns Meeting context with notes and summary
   */
  async prepareSingleMeetingContext(meetingId: number): Promise<MeetingContext | null> {
    try {
      const [meeting, notes] = await Promise.all([
        this.meetingsService.getById(meetingId),
        this.meetingNotesService.getByMeetingId(meetingId)
      ])

      if (!meeting) return null

      return {
        meeting,
        notes: notes || undefined,
        summary: notes?.summary || undefined
      }
    } catch (error) {
      console.error('Error preparing single meeting context:', error)
      return null
    }
  }

  /**
   * Prepare context for multiple meetings
   * @param meetingIds - Array of meeting IDs to include
   * @returns Array of meeting contexts
   */
  async prepareMeetingContexts(meetingIds: number[]): Promise<MeetingContext[]> {
    if (meetingIds.length === 0) return []

    try {
      const contexts = await Promise.all(
        meetingIds.map(id => this.prepareSingleMeetingContext(id))
      )

      // Filter out null results and return valid contexts
      return contexts.filter((context): context is MeetingContext => context !== null)
    } catch (error) {
      console.error('Error preparing meeting contexts:', error)
      return []
    }
  }

  /**
   * Get recent meetings with notes for context suggestions
   * @param limit - Number of recent meetings to fetch
   * @returns Array of meeting contexts sorted by date
   */
  async getRecentMeetingsWithNotes(limit: number = 10): Promise<MeetingContext[]> {
    try {
      const { data: recentMeetings, error } = await this.supabase
        .from('meetings')
        .select(`
          *,
          meeting_notes (
            note_id,
            note_content,
            summary,
            summary_generated_at
          )
        `)
        .order('meeting_date', { ascending: false })
        .order('start_time', { ascending: false })
        .limit(limit)

      if (error) throw error
      if (!recentMeetings) return []

      return recentMeetings.map((meeting: MeetingWithNotes) => ({
        meeting: {
          meeting_id: meeting.meeting_id,
          meeting_date: meeting.meeting_date,
          start_time: meeting.start_time,
          end_time: meeting.end_time,
          topic_overview: meeting.topic_overview,
          meeting_link: meeting.meeting_link
        },
        notes: meeting.meeting_notes[0] || undefined,
        summary: meeting.meeting_notes[0]?.summary || undefined
      }))
    } catch (error) {
      console.error('Error getting recent meetings with notes:', error)
      return []
    }
  }

  /**
   * Search meetings by topic or content
   * @param searchQuery - Search term
   * @param limit - Maximum number of results
   * @returns Array of matching meeting contexts
   */
  async searchMeetingsForContext(searchQuery: string, limit: number = 5): Promise<MeetingContext[]> {
    if (!searchQuery.trim()) return []

    try {
      // Search in meeting topics and note content
      const { data: searchResults, error } = await this.supabase
        .from('meetings')
        .select(`
          *,
          meeting_notes (
            note_id,
            note_content,
            summary,
            summary_generated_at
          )
        `)
        .or(`topic_overview.ilike.%${searchQuery}%,meeting_notes.note_content.ilike.%${searchQuery}%`)
        .order('meeting_date', { ascending: false })
        .limit(limit)

      if (error) throw error
      if (!searchResults) return []

      return searchResults.map((meeting: MeetingWithNotes) => ({
        meeting: {
          meeting_id: meeting.meeting_id,
          meeting_date: meeting.meeting_date,
          start_time: meeting.start_time,
          end_time: meeting.end_time,
          topic_overview: meeting.topic_overview,
          meeting_link: meeting.meeting_link
        },
        notes: meeting.meeting_notes[0] || undefined,
        summary: meeting.meeting_notes[0]?.summary || undefined
      }))
    } catch (error) {
      console.error('Error searching meetings for context:', error)
      return []
    }
  }

  /**
   * Calculate the total token count estimate for context
   * @param contexts - Array of meeting contexts
   * @returns Estimated token count
   */
  estimateContextTokens(contexts: MeetingContext[]): number {
    let totalEstimate = 0

    for (const context of contexts) {
      // Basic meeting info tokens
      totalEstimate += this.estimateTextTokens(
        `${context.meeting.topic_overview} ${context.meeting.meeting_date}`
      )

      // Summary or notes tokens
      if (context.summary) {
        totalEstimate += this.estimateTextTokens(context.summary)
      } else if (context.notes?.note_content) {
        totalEstimate += this.estimateTextTokens(context.notes.note_content)
      }
    }

    return totalEstimate
  }

  /**
   * Optimize context for token limits
   * @param contexts - Array of meeting contexts
   * @param maxTokens - Maximum allowed tokens
   * @returns Optimized array of contexts
   */
  optimizeContextForTokens(contexts: MeetingContext[], maxTokens: number = 3000): MeetingContext[] {
    const optimized: MeetingContext[] = []
    let currentTokens = 0

    // Sort by date (most recent first) to prioritize recent meetings
    const sortedContexts = contexts.sort((a, b) => 
      new Date(b.meeting.meeting_date).getTime() - new Date(a.meeting.meeting_date).getTime()
    )

    for (const context of sortedContexts) {
      const contextTokens = this.estimateContextTokens([context])
      
      if (currentTokens + contextTokens <= maxTokens) {
        optimized.push(context)
        currentTokens += contextTokens
      } else {
        // Try to include truncated version if it's the first context
        if (optimized.length === 0) {
          const truncatedContext = this.truncateContext(context, maxTokens)
          optimized.push(truncatedContext)
          break
        } else {
          break
        }
      }
    }

    return optimized
  }

  /**
   * Get meeting contexts for a specific date range
   * @param startDate - Start date (YYYY-MM-DD)
   * @param endDate - End date (YYYY-MM-DD)
   * @returns Array of meeting contexts in date range
   */
  async getMeetingContextsByDateRange(startDate: string, endDate: string): Promise<MeetingContext[]> {
    try {
      const { data: meetings, error } = await this.supabase
        .from('meetings')
        .select(`
          *,
          meeting_notes (
            note_id,
            note_content,
            summary,
            summary_generated_at
          )
        `)
        .gte('meeting_date', startDate)
        .lte('meeting_date', endDate)
        .order('meeting_date', { ascending: false })

      if (error) throw error
      if (!meetings) return []

      return meetings.map((meeting: MeetingWithNotes) => ({
        meeting: {
          meeting_id: meeting.meeting_id,
          meeting_date: meeting.meeting_date,
          start_time: meeting.start_time,
          end_time: meeting.end_time,
          topic_overview: meeting.topic_overview,
          meeting_link: meeting.meeting_link
        },
        notes: meeting.meeting_notes[0] || undefined,
        summary: meeting.meeting_notes[0]?.summary || undefined
      }))
    } catch (error) {
      console.error('Error getting meetings by date range:', error)
      return []
    }
  }

  /**
   * Simple token estimation (rough approximation)
   * @param text - Text to estimate
   * @returns Estimated token count
   */
  private estimateTextTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4)
  }

  /**
   * Truncate context to fit within token limits
   * @param context - Meeting context to truncate
   * @param maxTokens - Maximum allowed tokens
   * @returns Truncated context
   */
  private truncateContext(context: MeetingContext, maxTokens: number): MeetingContext {
    const truncatedContext = { ...context }

    // Always keep the meeting basic info
    const basicInfoTokens = this.estimateTextTokens(
      `${context.meeting.topic_overview} ${context.meeting.meeting_date}`
    )

    const availableTokens = maxTokens - basicInfoTokens

    if (context.summary) {
      const summaryTokens = this.estimateTextTokens(context.summary)
      if (summaryTokens <= availableTokens) {
        // Keep full summary
        return truncatedContext
      } else {
        // Truncate summary
        const maxChars = availableTokens * 4
        truncatedContext.summary = context.summary.substring(0, maxChars) + '...'
        truncatedContext.notes = undefined
      }
    } else if (context.notes?.note_content) {
      const maxChars = availableTokens * 4
      truncatedContext.notes = {
        ...context.notes,
        note_content: context.notes.note_content.substring(0, maxChars) + '...'
      }
    }

    return truncatedContext
  }
} 