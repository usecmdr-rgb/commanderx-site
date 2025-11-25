-- User Phone Numbers and Twilio Integration
-- Supports one active Twilio number per user, voicemail, and call forwarding

-- Create user_phone_numbers table
CREATE TABLE IF NOT EXISTS user_phone_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  twilio_phone_sid TEXT NOT NULL, -- Twilio IncomingPhoneNumber SID (or "SIMULATED_SID_*" in mock mode)
  phone_number TEXT NOT NULL, -- Twilio number in E.164 format
  country TEXT NOT NULL DEFAULT 'US',
  area_code TEXT, -- Nullable area code
  is_active BOOLEAN DEFAULT true, -- Only ONE active per user
  voicemail_enabled BOOLEAN DEFAULT false,
  voicemail_mode TEXT DEFAULT 'none' CHECK (voicemail_mode IN ('none', 'voicemail_only', 'receptionist')),
  external_phone_number TEXT, -- User's real SIM/carrier number
  forwarding_enabled BOOLEAN DEFAULT false,
  forwarding_confirmed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: One active number per user is enforced at the application level
-- When setting a new number to active, the application will deactivate existing active numbers

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_phone_numbers_user_id ON user_phone_numbers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_phone_numbers_phone_number ON user_phone_numbers(phone_number);
CREATE INDEX IF NOT EXISTS idx_user_phone_numbers_is_active ON user_phone_numbers(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_phone_numbers_twilio_sid ON user_phone_numbers(twilio_phone_sid);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_user_phone_numbers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_phone_numbers_updated_at ON user_phone_numbers;
CREATE TRIGGER trigger_update_user_phone_numbers_updated_at
  BEFORE UPDATE ON user_phone_numbers
  FOR EACH ROW
  EXECUTE FUNCTION update_user_phone_numbers_updated_at();

-- Enable RLS
ALTER TABLE user_phone_numbers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own phone numbers" ON user_phone_numbers;
CREATE POLICY "Users can view their own phone numbers"
  ON user_phone_numbers FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own phone numbers" ON user_phone_numbers;
CREATE POLICY "Users can insert their own phone numbers"
  ON user_phone_numbers FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own phone numbers" ON user_phone_numbers;
CREATE POLICY "Users can update their own phone numbers"
  ON user_phone_numbers FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own phone numbers" ON user_phone_numbers;
CREATE POLICY "Users can delete their own phone numbers"
  ON user_phone_numbers FOR DELETE
  USING (user_id = auth.uid());

-- Comments
COMMENT ON TABLE user_phone_numbers IS 'Stores Twilio phone numbers assigned to users. Only one active number per user.';
COMMENT ON COLUMN user_phone_numbers.twilio_phone_sid IS 'Twilio IncomingPhoneNumber SID, or "SIMULATED_SID_*" in mock mode';
COMMENT ON COLUMN user_phone_numbers.phone_number IS 'Phone number in E.164 format (e.g., +14155551234)';
COMMENT ON COLUMN user_phone_numbers.is_active IS 'Only one active number per user. When setting a new number to active, deactivate others.';
COMMENT ON COLUMN user_phone_numbers.voicemail_enabled IS 'Whether Aloha should act as voicemail for this number';
COMMENT ON COLUMN user_phone_numbers.voicemail_mode IS 'Voicemail mode: none, voicemail_only, or receptionist';
COMMENT ON COLUMN user_phone_numbers.external_phone_number IS 'User''s real SIM/carrier phone number for call forwarding';
COMMENT ON COLUMN user_phone_numbers.forwarding_enabled IS 'User has chosen to use carrier call forwarding to this Twilio number';
COMMENT ON COLUMN user_phone_numbers.forwarding_confirmed IS 'User clicked "I''ve set up forwarding" in the UI';

