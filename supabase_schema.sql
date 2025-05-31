-- Schema for Supabase tables
CREATE TABLE IF NOT EXISTS meetings (
  meeting_id serial PRIMARY KEY,
  meeting_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  topic_overview text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS meeting_notes (
  note_id serial PRIMARY KEY,
  meeting_id integer REFERENCES meetings(meeting_id) ON DELETE CASCADE,
  note_content text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS qna_entries (
  qna_id serial PRIMARY KEY,
  meeting_id integer REFERENCES meetings(meeting_id) ON DELETE CASCADE,
  term_or_question text NOT NULL,
  gpt4_response text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);
