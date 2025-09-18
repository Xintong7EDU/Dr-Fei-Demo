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

-- qna_entries removed

-- Standalone notes (non-meeting) for home timeline
CREATE TABLE IF NOT EXISTS notes (
  note_id serial PRIMARY KEY,
  title text,
  html_content text NOT NULL,
  meeting_date date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notes_created_at_idx ON notes (created_at DESC);

-- Maintain updated_at automatically
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notes_set_updated_at ON notes;
CREATE TRIGGER notes_set_updated_at
BEFORE UPDATE ON notes
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
