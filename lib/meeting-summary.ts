import { SupabaseClient } from '@supabase/supabase-js'
import type { MeetingNote } from './types'
import { AIService } from './ai-service'
import { MeetingNotesService } from './meeting-notes'

/**
 * Service for managing AI-generated summaries of meeting notes
 * Integrates with existing MeetingNotesService and AIService
 */
export class MeetingSummaryService {
  private supabase: SupabaseClient
  private aiService: AIService
  private meetingNotesService: MeetingNotesService

  constructor(supabase: SupabaseClient, apiKey?: string) {
    this.supabase = supabase
    this.aiService = new AIService(apiKey)
    this.meetingNotesService = new MeetingNotesService(supabase)
  }

  /**
   * Generate and store a summary for a meeting note
   * @param noteId - The ID of the meeting note to summarize
   * @returns The updated meeting note with summary
   */
  async generateAndStoreSummary(noteId: number): Promise<MeetingNote> {
    // Get the existing note
    const note = await this.meetingNotesService.getById(noteId)
    if (!note) {
      throw new Error(`Meeting note with ID ${noteId} not found`)
    }

    // Skip if note content is too short
    if (note.note_content.length < 100) {
      console.log('Note content too short for summarization')
      return note
    }

    try {
      // Generate summary using AI service
      const summary = await this.aiService.generateMeetingSummary(note.note_content)
      
      // Update the note with the summary
      const { data, error } = await this.supabase
        .from('meeting_notes')
        .update({ 
          summary: summary,
          summary_generated_at: new Date().toISOString()
        })
        .eq('note_id', noteId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error generating summary:', error)
      throw new Error('Failed to generate meeting summary')
    }
  }

  /**
   * Generate summaries for all notes that don't have one
   * @param minContentLength - Minimum content length to trigger summarization
   * @returns Array of updated notes with summaries
   */
  async generateBatchSummaries(minContentLength: number = 100): Promise<MeetingNote[]> {
    try {
      // Get all notes without summaries that meet minimum length
      const { data: notes, error } = await this.supabase
        .from('meeting_notes')
        .select('*')
        .is('summary', null)
        .gte('length(note_content)', minContentLength)

      if (error) throw error
      if (!notes || notes.length === 0) {
        console.log('No notes found that need summarization')
        return []
      }

      const updatedNotes: MeetingNote[] = []

      // Process notes one by one to avoid rate limiting
      for (const note of notes) {
        try {
          const updatedNote = await this.generateAndStoreSummary(note.note_id)
          updatedNotes.push(updatedNote)
          
          // Add a small delay to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 1000))
        } catch (error) {
          console.error(`Failed to summarize note ${note.note_id}:`, error)
          // Continue with other notes
        }
      }

      return updatedNotes
    } catch (error) {
      console.error('Error in batch summarization:', error)
      throw new Error('Failed to generate batch summaries')
    }
  }

  /**
   * Check if a note needs summarization based on content length and existing summary
   * @param note - The meeting note to check
   * @param minContentLength - Minimum content length threshold
   * @returns Whether the note should be summarized
   */
  shouldSummarize(note: MeetingNote, minContentLength: number = 200): boolean {
    return (
      !note.summary && // No existing summary
      note.note_content.length >= minContentLength && // Meets minimum length
      note.note_content.trim().length > 0 // Has actual content
    )
  }

  /**
   * Auto-generate summary when note is created or updated
   * This can be called from the note update workflow
   * @param noteId - The ID of the note that was updated
   * @returns The note with summary if generated, null if skipped
   */
  async autoGenerateSummary(noteId: number): Promise<MeetingNote | null> {
    try {
      const note = await this.meetingNotesService.getById(noteId)
      if (!note) return null

      if (this.shouldSummarize(note)) {
        return await this.generateAndStoreSummary(noteId)
      }

      return note
    } catch (error) {
      console.error('Error in auto-generate summary:', error)
      // Don't throw here to avoid breaking the main note update flow
      return null
    }
  }

  /**
   * Regenerate summary for an existing note (force update)
   * @param noteId - The ID of the meeting note
   * @returns The updated meeting note with new summary
   */
  async regenerateSummary(noteId: number): Promise<MeetingNote> {
    const note = await this.meetingNotesService.getById(noteId)
    if (!note) {
      throw new Error(`Meeting note with ID ${noteId} not found`)
    }

    try {
      const summary = await this.aiService.generateMeetingSummary(note.note_content)
      
      const { data, error } = await this.supabase
        .from('meeting_notes')
        .update({ 
          summary: summary,
          summary_generated_at: new Date().toISOString()
        })
        .eq('note_id', noteId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error regenerating summary:', error)
      throw new Error('Failed to regenerate meeting summary')
    }
  }

  /**
   * Get all notes with summaries for a specific meeting
   * @param meetingId - The meeting ID
   * @returns Array of notes with summaries
   */
  async getNotesWithSummaries(meetingId: number): Promise<MeetingNote[]> {
    const { data, error } = await this.supabase
      .from('meeting_notes')
      .select('*')
      .eq('meeting_id', meetingId)
      .not('summary', 'is', null)

    if (error) throw error
    return data || []
  }

  /**
   * Get summary statistics
   * @returns Object with summary statistics
   */
  async getSummaryStats(): Promise<{
    total_notes: number
    notes_with_summaries: number
    notes_needing_summaries: number
  }> {
    try {
      const [totalResult, withSummaryResult, needingSummaryResult] = await Promise.all([
        this.supabase.from('meeting_notes').select('note_id', { count: 'exact' }),
        this.supabase.from('meeting_notes').select('note_id', { count: 'exact' }).not('summary', 'is', null),
        this.supabase.from('meeting_notes').select('note_id', { count: 'exact' })
          .is('summary', null)
          .gte('length(note_content)', 100)
      ])

      return {
        total_notes: totalResult.count || 0,
        notes_with_summaries: withSummaryResult.count || 0,
        notes_needing_summaries: needingSummaryResult.count || 0
      }
    } catch (error) {
      console.error('Error getting summary stats:', error)
      return {
        total_notes: 0,
        notes_with_summaries: 0,
        notes_needing_summaries: 0
      }
    }
  }
} 