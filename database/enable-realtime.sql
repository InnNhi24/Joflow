-- Enable real-time for messages table
-- Run this in Supabase SQL Editor to enable real-time subscriptions for messages

-- Add messages table to real-time publication
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Verify real-time is enabled
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';