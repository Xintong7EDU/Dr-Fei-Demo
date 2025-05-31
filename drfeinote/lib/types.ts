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
  term_or_question: string
  gpt4_response: string
}
