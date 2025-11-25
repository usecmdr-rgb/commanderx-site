-- Create aloha_profiles table for user-configurable Aloha agent settings
-- Each user/account has one Aloha profile with display_name and voice_id

CREATE TABLE IF NOT EXISTS aloha_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT DEFAULT 'Aloha',
  voice_id TEXT NOT NULL DEFAULT 'aloha_voice_1',
  voice_options JSONB DEFAULT NULL, -- Optional cache of available voices
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create index for fast lookups by user_id
CREATE INDEX IF NOT EXISTS idx_aloha_profiles_user_id ON aloha_profiles(user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE aloha_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only read/update their own Aloha profile
CREATE POLICY "Users can view their own Aloha profile"
  ON aloha_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Aloha profile"
  ON aloha_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Aloha profile"
  ON aloha_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_aloha_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_aloha_profiles_updated_at
  BEFORE UPDATE ON aloha_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_aloha_profiles_updated_at();

-- Add comment
COMMENT ON TABLE aloha_profiles IS 'User-configurable settings for Aloha voice agent (display name and voice selection)';

