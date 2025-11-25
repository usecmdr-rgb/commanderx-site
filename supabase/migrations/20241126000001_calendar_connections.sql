-- Migration: Create Calendar connections and event notes tables

-- Calendar connections table (stores OAuth tokens)
CREATE TABLE IF NOT EXISTS calendar_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Calendar event notes table (stores custom notes, memos, reminders, and Aloha integration)
CREATE TABLE IF NOT EXISTS calendar_event_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL, -- Google Calendar event ID
  notes TEXT,
  memo TEXT,
  reminder TEXT,
  created_by_aloha BOOLEAN DEFAULT FALSE,
  aloha_call_id TEXT, -- Reference to the call that created this event
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_calendar_connections_user_id ON calendar_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_event_notes_user_id ON calendar_event_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_event_notes_event_id ON calendar_event_notes(event_id);
CREATE INDEX IF NOT EXISTS idx_calendar_event_notes_aloha_call_id ON calendar_event_notes(aloha_call_id);

-- Enable RLS
ALTER TABLE calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_event_notes ENABLE ROW LEVEL SECURITY;

-- Calendar connections policies
CREATE POLICY "Users can view own calendar connections"
  ON calendar_connections
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calendar connections"
  ON calendar_connections
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar connections"
  ON calendar_connections
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own calendar connections"
  ON calendar_connections
  FOR DELETE
  USING (auth.uid() = user_id);

-- Calendar event notes policies
CREATE POLICY "Users can view own event notes"
  ON calendar_event_notes
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own event notes"
  ON calendar_event_notes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own event notes"
  ON calendar_event_notes
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own event notes"
  ON calendar_event_notes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_calendar_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_calendar_event_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_calendar_connections_updated_at
  BEFORE UPDATE ON calendar_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_calendar_connections_updated_at();

CREATE TRIGGER update_calendar_event_notes_updated_at
  BEFORE UPDATE ON calendar_event_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_calendar_event_notes_updated_at();

