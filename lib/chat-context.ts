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
  }>
}

/**
 * Service for preparing meeting context for AI chat
 * Fetches and formats meeting data for AI consumption
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
   * @returns Meeting context with notes
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
        notes: notes || undefined
      }
    } catch (error) {
      console.error('Error preparing single meeting context:', error)
      return null
    }
  }

  /**
   * Prepare meeting context for multiple meetings
   * @param meetingIds - Array of meeting IDs
   * @returns Array of meeting contexts
   */
  async prepareMultipleMeetingContexts(meetingIds: number[]): Promise<MeetingContext[]> {
    try {
      const contexts: MeetingContext[] = []
      
      for (const meetingId of meetingIds) {
        const context = await this.prepareSingleMeetingContext(meetingId)
        if (context) {
          contexts.push(context)
        }
      }

      return contexts
    } catch (error) {
      console.error('Error preparing multiple meeting contexts:', error)
      return []
    }
  }

  /**
   * Prepare context from recent meetings (default: last 5)
   * @param limit - Number of recent meetings to include
   * @returns Array of meeting contexts from recent meetings
   */
  async prepareRecentMeetingContexts(limit: number = 5): Promise<MeetingContext[]> {
    try {
      // Get recent meetings with notes using joins for efficiency
      const { data: meetingsWithNotes, error } = await this.supabase
        .from('meetings')
        .select(`
          meeting_id,
          meeting_date,
          start_time,
          end_time,
          topic_overview,
          meeting_link,
          meeting_notes!inner (
            note_id,
            note_content
          )
        `)
        .order('meeting_date', { ascending: false })
        .limit(limit)

      if (error) throw error

      const meetings = meetingsWithNotes as MeetingWithNotes[]
      
      return meetings.map((meeting) => ({
        meeting: {
          meeting_id: meeting.meeting_id,
          meeting_date: meeting.meeting_date,
          start_time: meeting.start_time,
          end_time: meeting.end_time,
          topic_overview: meeting.topic_overview,
          meeting_link: meeting.meeting_link
        },
        notes: meeting.meeting_notes[0] ? {
          note_id: meeting.meeting_notes[0].note_id,
          meeting_id: meeting.meeting_id,
          note_content: meeting.meeting_notes[0].note_content
        } : undefined
      }))
    } catch (error) {
      console.error('Error preparing recent meeting contexts:', error)
      return []
    }
  }

  /**
   * Prepare smart context based on query relevance
   * Uses simple keyword matching to find relevant meetings
   * @param query - The user's query to match against
   * @param limit - Maximum number of meetings to return
   * @returns Array of relevant meeting contexts
   */
  async prepareSmartContext(query: string, limit: number = 3): Promise<MeetingContext[]> {
    try {
      const keywords = query.toLowerCase().split(' ').filter(word => word.length > 2)
      
      if (keywords.length === 0) {
        return this.prepareRecentMeetingContexts(limit)
      }

      // Search meetings by topic and notes content
      const { data: meetingsWithNotes, error } = await this.supabase
        .from('meetings')
        .select(`
          meeting_id,
          meeting_date,
          start_time,
          end_time,
          topic_overview,
          meeting_link,
          meeting_notes (
            note_id,
            note_content
          )
        `)
        .order('meeting_date', { ascending: false })

      if (error) throw error

      const meetings = meetingsWithNotes as MeetingWithNotes[]

      // Score meetings based on keyword matches
      const scoredMeetings = meetings
        .map((meeting) => {
          let score = 0
          const searchText = `${meeting.topic_overview} ${meeting.meeting_notes[0]?.note_content || ''}`.toLowerCase()
          
          keywords.forEach(keyword => {
            const matches = (searchText.match(new RegExp(keyword, 'g')) || []).length
            score += matches
          })

          return { meeting, score }
        })
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)

      return scoredMeetings.map(({ meeting }) => ({
        meeting: {
          meeting_id: meeting.meeting_id,
          meeting_date: meeting.meeting_date,
          start_time: meeting.start_time,
          end_time: meeting.end_time,
          topic_overview: meeting.topic_overview,
          meeting_link: meeting.meeting_link
        },
        notes: meeting.meeting_notes[0] ? {
          note_id: meeting.meeting_notes[0].note_id,
          meeting_id: meeting.meeting_id,
          note_content: meeting.meeting_notes[0].note_content
        } : undefined
      }))
    } catch (error) {
      console.error('Error preparing smart context:', error)
      return this.prepareRecentMeetingContexts(limit)
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

      // Notes tokens
      if (context.notes?.note_content) {
        totalEstimate += this.estimateTextTokens(context.notes.note_content)
      }
    }

    return totalEstimate
  }

  /**
   * Prepare meeting context with token limits
   * @param meetingIds - Array of meeting IDs
   * @param maxTokens - Maximum tokens to include (approximate)
   * @returns Optimized meeting contexts within token limit
   */
  async prepareOptimizedContext(
    meetingIds: number[], 
    maxTokens: number = 8000
  ): Promise<MeetingContext[]> {
    try {
      // Get meetings with notes using joins
      const { data: meetingsWithNotes, error } = await this.supabase
        .from('meetings')
        .select(`
          meeting_id,
          meeting_date,
          start_time,
          end_time,
          topic_overview,
          meeting_link,
          meeting_notes (
            note_id,
            note_content
          )
        `)
        .in('meeting_id', meetingIds)
        .order('meeting_date', { ascending: false })

      if (error) throw error

      const meetings = meetingsWithNotes as MeetingWithNotes[]
      const contexts: MeetingContext[] = []
      let currentTokens = 0

      for (const meeting of meetings) {
        const context: MeetingContext = {
          meeting: {
            meeting_id: meeting.meeting_id,
            meeting_date: meeting.meeting_date,
            start_time: meeting.start_time,
            end_time: meeting.end_time,
            topic_overview: meeting.topic_overview,
            meeting_link: meeting.meeting_link
          },
          notes: meeting.meeting_notes[0] ? {
            note_id: meeting.meeting_notes[0].note_id,
            meeting_id: meeting.meeting_id,
            note_content: meeting.meeting_notes[0].note_content
          } : undefined
        }

        const contextTokens = this.estimateContextTokens([context])
        
        if (currentTokens + contextTokens <= maxTokens) {
          contexts.push(context)
          currentTokens += contextTokens
        } else {
          // Try to include a truncated version
          const truncatedContext = this.truncateContext(context, maxTokens - currentTokens)
          if (truncatedContext) {
            contexts.push(truncatedContext)
          }
          break
        }
      }

      return contexts
    } catch (error) {
      console.error('Error preparing optimized context:', error)
      return []
    }
  }

  /**
   * Truncate a meeting context to fit within token limits
   * @param context - Original meeting context
   * @param availableTokens - Available token budget
   * @returns Truncated context or null if can't fit
   */
  private truncateContext(context: MeetingContext, availableTokens: number): MeetingContext | null {
    // Always include basic meeting info
    const basicInfo = {
      meeting: context.meeting,
      notes: undefined
    }
    
    const basicTokens = this.estimateContextTokens([basicInfo])
    if (basicTokens > availableTokens) {
      return null // Can't even fit basic info
    }

    const remainingTokens = availableTokens - basicTokens
    const truncatedContext = { ...context }

    if (context.notes?.note_content) {
      const noteTokens = this.estimateTextTokens(context.notes.note_content)
      if (noteTokens <= remainingTokens) {
        // Keep full notes
        return truncatedContext
      } else {
        // Truncate notes
        const maxChars = Math.floor((context.notes.note_content.length * remainingTokens) / noteTokens)
        truncatedContext.notes = {
          ...context.notes,
          note_content: context.notes.note_content.substring(0, maxChars) + '...'
        }
      }
    }

    return truncatedContext
  }

  /**
   * Simple token estimation (roughly 3.5 characters per token for better accuracy)
   * @param text - Text to estimate tokens for
   * @returns Estimated token count
   */
  private estimateTextTokens(text: string): number {
    return Math.ceil(text.length / 3.5)
  }
} 