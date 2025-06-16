export interface Meeting {
  meeting_id: number
  meeting_date: string
  start_time: string
  end_time: string
  topic_overview: string
  meeting_link?: string
}

export interface MeetingNote {
  note_id: number
  meeting_id: number
  note_content: string
  summary?: string
  summary_generated_at?: string
}

export interface QnAEntry {
  qna_id: number
  meeting_id: number | null
  term_or_question: string
  gpt4_response: string
}

// New types for AI Chat functionality
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  context_meetings?: number[]
}

export interface ChatSession {
  session_id: string
  user_id?: string
  created_at: Date
  updated_at: Date
  title?: string
  messages: ChatMessage[]
}

export interface MeetingContext {
  meeting: Meeting
  notes?: MeetingNote
  summary?: string
}
