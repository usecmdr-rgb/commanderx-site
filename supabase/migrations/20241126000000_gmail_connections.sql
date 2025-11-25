-- Migration: Create Gmail connections table
-- This table stores Gmail OAuth tokens for users

CREATE TABLE IF NOT EXISTS gmail_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_gmail_connections_user_id ON gmail_connections(user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE gmail_connections ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own Gmail connections
CREATE POLICY "Users can view own Gmail connections"
  ON gmail_connections
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: Users can insert their own Gmail connections
CREATE POLICY "Users can insert own Gmail connections"
  ON gmail_connections
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can update their own Gmail connections
CREATE POLICY "Users can update own Gmail connections"
  ON gmail_connections
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policy: Users can delete their own Gmail connections
CREATE POLICY "Users can delete own Gmail connections"
  ON gmail_connections
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_gmail_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_gmail_connections_updated_at
  BEFORE UPDATE ON gmail_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_gmail_connections_updated_at();

