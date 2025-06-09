"use server"

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Meeting, MeetingNote, QnAEntry } from '@/lib/types'
import { MeetingNotesService } from '@/lib/meeting-notes'
import { MeetingsService } from '@/lib/meetings'
import { revalidatePath, revalidateTag } from 'next/cache'
import { getCurrentDateStringPST, getCurrentDatePST, getLastWeekDatePST, parseDatePST } from '@/lib/utils'

async function createSupabaseServer() {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}

export async function getMeetings(status: 'upcoming' | 'past'): Promise<Meeting[]> {
  const supabase = await createSupabaseServer()
  const meetingsSvc = new MeetingsService(supabase)
  return meetingsSvc.list(status)
}

/**
 * Get recent meetings with enhanced filtering and sorting options
 * Syncs with database and provides real-time data
 */
export async function getRecentMeetings(options?: {
  limit?: number
  searchQuery?: string
  dateFrom?: string
  dateTo?: string
  sortBy?: 'meeting_date' | 'topic_overview' | 'created_at'
  sortOrder?: 'asc' | 'desc'
}): Promise<Meeting[]> {
  const supabase = await createSupabaseServer()
  const {
    limit = 50,
    searchQuery = '',
    dateFrom,
    dateTo,
    sortBy = 'meeting_date',
    sortOrder = 'desc'
  } = options || {}

  let query = supabase
    .from('meetings')
    .select('*')
    .lt('meeting_date', getCurrentDateStringPST()) // Only past meetings in PST

  // Apply search filter
  if (searchQuery) {
    query = query.ilike('topic_overview', `%${searchQuery}%`)
  }

  // Apply date range filters
  if (dateFrom) {
    query = query.gte('meeting_date', dateFrom)
  }
  if (dateTo) {
    query = query.lte('meeting_date', dateTo)
  }

  // Apply sorting and limiting
  query = query.order(sortBy, { ascending: sortOrder === 'asc' }).limit(limit)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as Meeting[]
}

/**
 * Get meeting statistics for analytics
 * Provides real-time metrics from database using PST timezone
 */
export async function getMeetingStats(): Promise<{
  totalMeetings: number
  thisMonthMeetings: number
  lastWeekMeetings: number
  averageDuration: number
  totalHours: number
  mostActiveMonth: string
}> {
  const supabase = await createSupabaseServer()
  
  // Get all past meetings (using PST timezone)
  const { data: meetings, error } = await supabase
    .from('meetings')
    .select('*')
    .lt('meeting_date', getCurrentDateStringPST())
    .order('meeting_date', { ascending: false })

  if (error) throw error

  const meetingsData = meetings as Meeting[]
  const totalMeetings = meetingsData.length

  // Calculate current month meetings (using PST timezone)
  const currentDate = getCurrentDatePST()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()
  const thisMonthMeetings = meetingsData.filter((meeting) => {
    const meetingDate = parseDatePST(meeting.meeting_date)
    return meetingDate.getMonth() === currentMonth && meetingDate.getFullYear() === currentYear
  }).length

  // Calculate last week meetings (using PST timezone)
  const lastWeekDate = getLastWeekDatePST()
  const lastWeekMeetings = meetingsData.filter((meeting) => {
    const meetingDate = parseDatePST(meeting.meeting_date)
    return meetingDate >= lastWeekDate
  }).length

  // Calculate total hours and average duration
  const totalHours = meetingsData.reduce((total, meeting) => {
    const startTime = new Date(`1970-01-01 ${meeting.start_time}`)
    const endTime = new Date(`1970-01-01 ${meeting.end_time}`)
    const durationMs = endTime.getTime() - startTime.getTime()
    const durationHours = durationMs / (1000 * 60 * 60)
    return total + durationHours
  }, 0)

  const averageDuration = totalMeetings > 0 ? totalHours / totalMeetings : 0

  // Find most active month
  const monthCounts = meetingsData.reduce((acc, meeting) => {
    const date = parseDatePST(meeting.meeting_date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    acc[monthKey] = (acc[monthKey] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const mostActiveMonth = Object.entries(monthCounts).reduce(
    (max, [month, count]) => count > max.count ? { month, count } : max,
    { month: '', count: 0 }
  ).month

  return {
    totalMeetings,
    thisMonthMeetings,
    lastWeekMeetings,
    averageDuration,
    totalHours,
    mostActiveMonth
  }
}

export async function getMeeting(id: number): Promise<Meeting | null> {
  const supabase = await createSupabaseServer()
  const meetingsSvc = new MeetingsService(supabase)
  return meetingsSvc.getById(id)
}

export async function createMeeting(
  meeting: Omit<Meeting, 'meeting_id'>
): Promise<Meeting> {
  const supabase = await createSupabaseServer()
  const meetingsSvc = new MeetingsService(supabase)
  return meetingsSvc.create(meeting)
}

export async function updateMeeting(
  id: number,
  updates: Partial<Omit<Meeting, 'meeting_id'>>
): Promise<Meeting> {
  const supabase = await createSupabaseServer()
  const meetingsSvc = new MeetingsService(supabase)
  return meetingsSvc.update(id, updates)
}

export async function getMeetingNotes(meetingId: number): Promise<MeetingNote | null> {
  const supabase = await createSupabaseServer()
  const notesSvc = new MeetingNotesService(supabase)
  return notesSvc.getByMeetingId(meetingId)
}

export async function saveNotes(meetingId: number, content: string): Promise<MeetingNote> {
  const supabase = await createSupabaseServer()
  const notesSvc = new MeetingNotesService(supabase)
  const existing = await notesSvc.getByMeetingId(meetingId)
  if (existing) {
    return notesSvc.update(existing.note_id, content)
  }
  return notesSvc.create(meetingId, content)
}

export async function getQnAForMeeting(meetingId: number): Promise<QnAEntry[]> {
  const supabase = await createSupabaseServer()
  const { data, error } = await supabase
    .from('qna_entries')
    .select('*')
    .eq('meeting_id', meetingId)
    .order('qna_id', { ascending: false })

  if (error) throw error
  return (data ?? []) as QnAEntry[]
}

export async function getAllQnA(): Promise<QnAEntry[]> {
  const supabase = await createSupabaseServer()
  const { data, error } = await supabase
    .from('qna_entries')
    .select('*')
    .order('qna_id', { ascending: false })

  if (error) throw error
  return (data ?? []) as QnAEntry[]
}

export async function askQuestion(question: string, meetingId?: number): Promise<QnAEntry> {
  const supabase = await createSupabaseServer()
  const mockResponse = `This is a simulated response for the question: "${question}". In a real implementation, this would be generated by GPT-4.1 with accurate information about supply chain terminology.`

  const { data, error } = await supabase
    .from('qna_entries')
    .insert({ meeting_id: meetingId ?? null, term_or_question: question, gpt4_response: mockResponse })
    .select()
    .single()

  if (error) throw error
  return data as QnAEntry
}

/**
 * Revalidate meetings data across the application
 * Forces fresh data fetch on next request
 */
export async function revalidateMeetings() {
  try {
    // Revalidate specific paths that display meetings data
    revalidatePath('/recent')
    revalidatePath('/meetings')
    revalidatePath('/archive')
    revalidatePath('/')
    
    // Revalidate any cached meeting data
    revalidateTag('meetings')
    
    return { success: true }
  } catch (error) {
    console.error('Error revalidating meetings data:', error)
    return { success: false, error: 'Failed to refresh data' }
  }
}
