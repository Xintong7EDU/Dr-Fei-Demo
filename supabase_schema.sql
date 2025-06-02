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

-- Table for capturing database errors
CREATE TABLE IF NOT EXISTS error_log (
  error_id serial PRIMARY KEY,
  message text NOT NULL,
  occurred_at timestamp with time zone DEFAULT now()
);

-- Generic function to log errors from table operations
CREATE OR REPLACE FUNCTION log_table_error() RETURNS TRIGGER AS $$
BEGIN
  RETURN NEW;
EXCEPTION WHEN others THEN
  INSERT INTO error_log(message, occurred_at) VALUES (SQLERRM, now());
  RAISE;
END;
$$ LANGUAGE plpgsql;

-- Triggers to capture errors on existing tables
CREATE TRIGGER meetings_error_log
AFTER INSERT OR UPDATE OR DELETE ON meetings
FOR EACH ROW EXECUTE FUNCTION log_table_error();

CREATE TRIGGER meeting_notes_error_log
AFTER INSERT OR UPDATE OR DELETE ON meeting_notes
FOR EACH ROW EXECUTE FUNCTION log_table_error();

CREATE TRIGGER qna_entries_error_log
AFTER INSERT OR UPDATE OR DELETE ON qna_entries
FOR EACH ROW EXECUTE FUNCTION log_table_error();
