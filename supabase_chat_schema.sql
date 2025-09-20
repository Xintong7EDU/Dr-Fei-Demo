-- Chat and RAG Schema Extensions for Supabase
-- Requires pgvector extension: CREATE EXTENSION IF NOT EXISTS vector;

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add user_id column to existing notes table (for RLS)
-- This assumes you have auth.users table from Supabase Auth
ALTER TABLE notes ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index on user_id for notes
CREATE INDEX IF NOT EXISTS notes_user_id_idx ON notes (user_id);

-- Chat threads (conversations)
CREATE TABLE IF NOT EXISTS threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Indexes for threads
CREATE INDEX IF NOT EXISTS threads_user_id_updated_at_idx ON threads (user_id, updated_at DESC);

-- Chat messages
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content jsonb NOT NULL,
  token_count integer,
  created_at timestamp with time zone DEFAULT now()
);

-- Indexes for messages
CREATE INDEX IF NOT EXISTS messages_thread_id_created_at_idx ON messages (thread_id, created_at DESC);

-- Note chunks for RAG
CREATE TABLE IF NOT EXISTS note_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id integer NOT NULL REFERENCES notes(note_id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chunk_index integer NOT NULL,
  text text NOT NULL,
  token_count integer,
  content_hash text, -- For tracking changes
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(note_id, chunk_index)
);

-- Indexes for note_chunks
CREATE INDEX IF NOT EXISTS note_chunks_note_id_idx ON note_chunks (note_id);
CREATE INDEX IF NOT EXISTS note_chunks_user_id_idx ON note_chunks (user_id);
-- Full-text search index
CREATE INDEX IF NOT EXISTS note_chunks_text_fts_idx ON note_chunks USING GIN (to_tsvector('english', text));

-- Note embeddings for vector search
CREATE TABLE IF NOT EXISTS note_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chunk_id uuid NOT NULL REFERENCES note_chunks(id) ON DELETE CASCADE,
  embedding vector(1536), -- OpenAI ada-002 dimension
  model text NOT NULL DEFAULT 'text-embedding-ada-002',
  created_at timestamp with time zone DEFAULT now()
);

-- Vector similarity index (IVFFLAT)
CREATE INDEX IF NOT EXISTS note_embeddings_embedding_idx ON note_embeddings 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Update triggers for updated_at
CREATE TRIGGER threads_set_updated_at
  BEFORE UPDATE ON threads
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER note_chunks_set_updated_at
  BEFORE UPDATE ON note_chunks
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for threads
CREATE POLICY "Users can only access their own threads"
  ON threads FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for messages
CREATE POLICY "Users can only access messages from their threads"
  ON messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM threads 
      WHERE threads.id = messages.thread_id 
      AND threads.user_id = auth.uid()
    )
  );

-- RLS Policies for notes (update existing table)
CREATE POLICY "Users can only access their own notes"
  ON notes FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for note_chunks
CREATE POLICY "Users can only access their own note chunks"
  ON note_chunks FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for note_embeddings
CREATE POLICY "Users can only access embeddings for their note chunks"
  ON note_embeddings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM note_chunks 
      WHERE note_chunks.id = note_embeddings.chunk_id 
      AND note_chunks.user_id = auth.uid()
    )
  );

-- Service role policies (for background jobs)
-- These allow the service role to bypass RLS for embedding operations
CREATE POLICY "Service role can manage all note chunks"
  ON note_chunks FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage all embeddings"
  ON note_embeddings FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Functions for hybrid search

-- Function for similarity search with user filtering
CREATE OR REPLACE FUNCTION search_notes_similarity(
  query_embedding vector(1536),
  user_id_param uuid,
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 24
)
RETURNS TABLE (
  chunk_id uuid,
  note_id integer,
  text text,
  similarity float,
  chunk_index integer
)
LANGUAGE sql STABLE
AS $$
  SELECT 
    nc.id as chunk_id,
    nc.note_id,
    nc.text,
    1 - (ne.embedding <=> query_embedding) as similarity,
    nc.chunk_index
  FROM note_chunks nc
  JOIN note_embeddings ne ON nc.id = ne.chunk_id
  WHERE nc.user_id = user_id_param
    AND 1 - (ne.embedding <=> query_embedding) > match_threshold
  ORDER BY ne.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Function for full-text search with user filtering
CREATE OR REPLACE FUNCTION search_notes_fulltext(
  query_text text,
  user_id_param uuid,
  match_count int DEFAULT 24
)
RETURNS TABLE (
  chunk_id uuid,
  note_id integer,
  text text,
  rank float,
  chunk_index integer
)
LANGUAGE sql STABLE
AS $$
  SELECT 
    nc.id as chunk_id,
    nc.note_id,
    nc.text,
    ts_rank_cd(to_tsvector('english', nc.text), plainto_tsquery('english', query_text)) as rank,
    nc.chunk_index
  FROM note_chunks nc
  WHERE nc.user_id = user_id_param
    AND to_tsvector('english', nc.text) @@ plainto_tsquery('english', query_text)
  ORDER BY ts_rank_cd(to_tsvector('english', nc.text), plainto_tsquery('english', query_text)) DESC
  LIMIT match_count;
$$;

-- Materialized view for better full-text performance (optional)
CREATE MATERIALIZED VIEW IF NOT EXISTS note_chunks_fts AS
SELECT 
  id,
  note_id,
  user_id,
  chunk_index,
  text,
  to_tsvector('english', text) as text_vector,
  token_count,
  created_at,
  updated_at
FROM note_chunks;

-- Index on materialized view
CREATE INDEX IF NOT EXISTS note_chunks_fts_vector_idx ON note_chunks_fts USING GIN (text_vector);
CREATE INDEX IF NOT EXISTS note_chunks_fts_user_id_idx ON note_chunks_fts (user_id);

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_note_chunks_fts()
RETURNS void
LANGUAGE sql
AS $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY note_chunks_fts;
$$;
