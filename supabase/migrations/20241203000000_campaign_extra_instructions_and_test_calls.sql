-- Campaign Extra Instructions and Test Calls
-- Adds extra_instructions field and test call support

-- Add extra_instructions column to call_campaigns
ALTER TABLE call_campaigns
  ADD COLUMN IF NOT EXISTS extra_instructions TEXT;

-- Add comment
COMMENT ON COLUMN call_campaigns.extra_instructions IS 'User-provided additional instructions for Aloha behavior. Combined with internal script_template at runtime.';

-- Note: script_template remains in the table but is now internal-only (not exposed to users)

-- Check if calls table exists (may be in a different migration)
-- If calls table doesn't exist, we'll need to create it or add is_test_call to existing call logs
DO $$
BEGIN
  -- Check if calls table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'calls'
  ) THEN
    -- Add is_test_call flag if calls table exists
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'calls' AND column_name = 'is_test_call'
    ) THEN
      ALTER TABLE calls ADD COLUMN is_test_call BOOLEAN DEFAULT false;
      CREATE INDEX IF NOT EXISTS idx_calls_is_test_call ON calls(is_test_call);
      COMMENT ON COLUMN calls.is_test_call IS 'True if this call was a test call initiated by the user to preview campaign behavior';
    END IF;
  ELSE
    -- If calls table doesn't exist, create a minimal structure for test calls
    -- Note: This assumes calls table structure from app/api/brain/route.ts
    CREATE TABLE IF NOT EXISTS calls (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      agent_id UUID REFERENCES agents(id),
      summary TEXT,
      outcome TEXT,
      started_at TIMESTAMPTZ,
      ended_at TIMESTAMPTZ,
      is_test_call BOOLEAN DEFAULT false,
      test_campaign_id UUID REFERENCES call_campaigns(id), -- Link to campaign if test call
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_calls_user_id ON calls(user_id);
    CREATE INDEX IF NOT EXISTS idx_calls_is_test_call ON calls(is_test_call);
    CREATE INDEX IF NOT EXISTS idx_calls_test_campaign_id ON calls(test_campaign_id);
    
    COMMENT ON TABLE calls IS 'Call logs for Aloha agent. Includes both real campaign calls and test calls.';
    COMMENT ON COLUMN calls.is_test_call IS 'True if this call was a test call initiated by the user to preview campaign behavior';
    COMMENT ON COLUMN calls.test_campaign_id IS 'If is_test_call is true, links to the campaign being tested';
  END IF;
END $$;

-- Add rate limiting for test calls (optional, can be enforced at application level)
-- We'll track test calls per user per hour in application code

