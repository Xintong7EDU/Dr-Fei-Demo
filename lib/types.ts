// Meeting-related interfaces removed as they're no longer used

export interface Note {
  note_id: number
  title: string | null
  html_content: string
  meeting_date: string | null
  user_id?: string
  created_at: string
  updated_at: string
}

// Chat types
export interface Thread {
  id: string
  user_id: string
  title: string | null
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  thread_id: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: MessageContent
  token_count: number | null
  created_at: string
}

export interface MessageContent {
  text: string
  citations?: Citation[]
  metadata?: Record<string, unknown>
}

export interface Citation {
  note_id: number
  chunk_id: string
  title: string | null
  text: string
  chunk_index: number
}

// RAG types
export interface NoteChunk {
  id: string
  note_id: number
  user_id: string
  chunk_index: number
  text: string
  token_count: number | null
  content_hash: string | null
  created_at: string
  updated_at: string
}

export interface NoteEmbedding {
  id: string
  chunk_id: string
  embedding: number[]
  model: string
  created_at: string
}

export interface RetrievedChunk {
  chunk_id: string
  note_id: number
  text: string
  score: number
  chunk_index: number
  note_title?: string | null
}

export interface SearchResult {
  dense: RetrievedChunk[]
  sparse: RetrievedChunk[]
  fused: RetrievedChunk[]
}

// LangGraph state
export interface ChatState {
  userId: string
  threadId: string
  messages: Message[]
  retrievedChunks: RetrievedChunk[]
  contextSummary: string
  requestId: string
}

// Legacy chat message (keep for compatibility)
export interface ChatMessage {
  id: string
  session_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  tokens: number | null
  metadata: Record<string, unknown> | null
  created_at: string
}
