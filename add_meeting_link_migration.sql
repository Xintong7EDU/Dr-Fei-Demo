-- Migration to add meeting_link column to meetings table
-- Run this script on your Supabase database to add the meeting link functionality

ALTER TABLE meetings 
ADD COLUMN IF NOT EXISTS meeting_link text;

-- Add a comment to document the column
COMMENT ON COLUMN meetings.meeting_link IS 'Optional URL for the meeting (Zoom, Teams, etc.)'; 