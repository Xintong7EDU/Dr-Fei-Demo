export interface Meeting {
  meeting_id: number
  meeting_date: string
  start_time: string
  end_time: string
  topic_overview: string
}

export interface MeetingNote {
  note_id: number
  meeting_id: number
  note_content: string
}

export interface QnAEntry {
  qna_id: number
  meeting_id: number | null
  note_id?: number | null
  term_or_question: string
  gpt4_response: string
}

export interface Note {
  note_id: number
  title: string | null
  html_content: string
  meeting_date: string | null
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  session_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  tokens: number | null
  metadata: Record<string, unknown> | null
  created_at: string
}
