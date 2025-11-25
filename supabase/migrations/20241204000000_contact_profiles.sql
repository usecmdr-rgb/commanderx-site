-- Contact Profiles and Call Memory
-- Adds lightweight contact memory per phone number for Aloha

-- Create contact_profiles table
CREATE TABLE IF NOT EXISTS contact_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  name TEXT,
  notes TEXT,
  do_not_call BOOLEAN DEFAULT false,
  preferred_call_window JSONB, -- Optional: can mirror campaign time window shape
  last_called_at TIMESTAMPTZ,
  last_campaign_id UUID REFERENCES call_campaigns(id) ON DELETE SET NULL,
  last_outcome TEXT, -- e.g. 'feedback_collected', 'rescheduled', 'not_interested', 'asked_for_email', 'do_not_call', 'no_answer'
  times_contacted INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique phone number per user
  CONSTRAINT contact_profiles_user_phone_unique UNIQUE (user_id, phone_number)
);

-- Create indexes for contact_profiles
CREATE INDEX IF NOT EXISTS idx_contact_profiles_user_id ON contact_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_profiles_phone_number ON contact_profiles(phone_number);
CREATE INDEX IF NOT EXISTS idx_contact_profiles_do_not_call ON contact_profiles(do_not_call);
CREATE INDEX IF NOT EXISTS idx_contact_profiles_last_called_at ON contact_profiles(last_called_at);
CREATE INDEX IF NOT EXISTS idx_contact_profiles_user_phone ON contact_profiles(user_id, phone_number);

-- Comments
COMMENT ON TABLE contact_profiles IS 'Lightweight contact memory per phone number for Aloha. Stores basic info about callers and past calls.';
COMMENT ON COLUMN contact_profiles.phone_number IS 'Normalized phone number (E.164 format recommended)';
COMMENT ON COLUMN contact_profiles.name IS 'Caller preferred name, if learned';
COMMENT ON COLUMN contact_profiles.notes IS 'Short internal notes like "prefers evenings" or "likes short calls". Keep non-sensitive.';
COMMENT ON COLUMN contact_profiles.do_not_call IS 'If true, do not call this contact for outbound campaigns';
COMMENT ON COLUMN contact_profiles.preferred_call_window IS 'Optional preferred call time window (future use)';
COMMENT ON COLUMN contact_profiles.last_outcome IS 'Last call outcome: feedback_collected, rescheduled, not_interested, asked_for_email, do_not_call, no_answer, etc.';

-- Update calls table to link to contact_profiles
DO $$
BEGIN
  -- Add contact_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'calls' AND column_name = 'contact_id'
  ) THEN
    ALTER TABLE calls ADD COLUMN contact_id UUID REFERENCES contact_profiles(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_calls_contact_id ON calls(contact_id);
    COMMENT ON COLUMN calls.contact_id IS 'Link to contact_profiles if caller is known';
  END IF;

  -- Add sentiment column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'calls' AND column_name = 'sentiment'
  ) THEN
    ALTER TABLE calls ADD COLUMN sentiment TEXT;
    CREATE INDEX IF NOT EXISTS idx_calls_sentiment ON calls(sentiment);
    COMMENT ON COLUMN calls.sentiment IS 'Call sentiment: angry, neutral, happy, upset, frustrated, confused, stressed';
  END IF;

  -- Add direction column if it doesn't exist (inbound vs outbound)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'calls' AND column_name = 'direction'
  ) THEN
    ALTER TABLE calls ADD COLUMN direction TEXT CHECK (direction IN ('inbound', 'outbound'));
    CREATE INDEX IF NOT EXISTS idx_calls_direction ON calls(direction);
    COMMENT ON COLUMN calls.direction IS 'Call direction: inbound or outbound';
  END IF;

  -- Add campaign_id column if it doesn't exist (for outbound campaigns)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'calls' AND column_name = 'campaign_id'
  ) THEN
    ALTER TABLE calls ADD COLUMN campaign_id UUID REFERENCES call_campaigns(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_calls_campaign_id ON calls(campaign_id);
    COMMENT ON COLUMN calls.campaign_id IS 'Link to call_campaigns if this is a campaign call';
  END IF;

  -- Add phone_number column if it doesn't exist (for quick lookup)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'calls' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE calls ADD COLUMN phone_number TEXT;
    CREATE INDEX IF NOT EXISTS idx_calls_phone_number ON calls(phone_number);
    COMMENT ON COLUMN calls.phone_number IS 'Normalized phone number for this call';
  END IF;
END $$;

-- Create updated_at trigger for contact_profiles
CREATE OR REPLACE FUNCTION update_contact_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_contact_profiles_updated_at ON contact_profiles;
CREATE TRIGGER trigger_update_contact_profiles_updated_at
  BEFORE UPDATE ON contact_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_profiles_updated_at();

-- Enable RLS on contact_profiles
ALTER TABLE contact_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contact_profiles
DROP POLICY IF EXISTS "Users can view their own contact profiles" ON contact_profiles;
CREATE POLICY "Users can view their own contact profiles"
  ON contact_profiles FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own contact profiles" ON contact_profiles;
CREATE POLICY "Users can insert their own contact profiles"
  ON contact_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own contact profiles" ON contact_profiles;
CREATE POLICY "Users can update their own contact profiles"
  ON contact_profiles FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own contact profiles" ON contact_profiles;
CREATE POLICY "Users can delete their own contact profiles"
  ON contact_profiles FOR DELETE
  USING (user_id = auth.uid());

-- Helper function to normalize phone number (basic E.164 normalization)
CREATE OR REPLACE FUNCTION normalize_phone_number(phone TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Remove all non-digit characters except +
  phone := regexp_replace(phone, '[^0-9+]', '', 'g');
  
  -- If doesn't start with +, assume US number and add +1
  IF NOT phone LIKE '+%' THEN
    -- If starts with 1 and has 11 digits total, add +
    IF length(phone) = 11 AND phone LIKE '1%' THEN
      phone := '+' || phone;
    -- If has 10 digits, assume US and add +1
    ELSIF length(phone) = 10 THEN
      phone := '+1' || phone;
    END IF;
  END IF;
  
  RETURN phone;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION normalize_phone_number IS 'Normalizes phone number to E.164 format (basic implementation)';

