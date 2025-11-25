-- Migration: Add data retention windows for trial and canceled subscriptions
-- This migration adds fields to track data retention periods and implements
-- the logic for 30-day retention after trial expiration and 60-day retention
-- after paid subscription cancellation

-- ============================================================================
-- 1. ADD DATA RETENTION FIELDS TO SUBSCRIPTIONS TABLE
-- ============================================================================

-- Add trial_ended_at to track when trial actually ended
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'trial_ended_at'
  ) THEN
    ALTER TABLE public.subscriptions ADD COLUMN trial_ended_at TIMESTAMPTZ;
  END IF;
END $$;

-- Add data_retention_expires_at to track when interaction data should be deleted
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'data_retention_expires_at'
  ) THEN
    ALTER TABLE public.subscriptions ADD COLUMN data_retention_expires_at TIMESTAMPTZ;
  END IF;
END $$;

-- Add data_retention_reason to track why retention window was set
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'data_retention_reason'
  ) THEN
    ALTER TABLE public.subscriptions ADD COLUMN data_retention_reason TEXT 
      CHECK (data_retention_reason IN ('trial_expired', 'paid_canceled', 'paid_paused') OR data_retention_reason IS NULL);
  END IF;
END $$;

-- Add paid_canceled_at to track when paid subscription was canceled
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'paid_canceled_at'
  ) THEN
    ALTER TABLE public.subscriptions ADD COLUMN paid_canceled_at TIMESTAMPTZ;
  END IF;
END $$;

-- Add 'data_cleared' tier and 'inactive' status to support post-retention state
ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_tier_check;

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_tier_check 
  CHECK (tier IN ('free', 'trial', 'trial_expired', 'data_cleared', 'basic', 'advanced', 'elite'));

ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_status_check;

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_status_check 
  CHECK (status IN ('active', 'trialing', 'expired', 'canceled', 'paused', 'past_due', 'incomplete', 'incomplete_expired', 'unpaid', 'inactive'));

-- Create indexes for retention queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_retention_expires 
  ON public.subscriptions(data_retention_expires_at) 
  WHERE data_retention_expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_subscriptions_retention_reason 
  ON public.subscriptions(data_retention_reason) 
  WHERE data_retention_reason IS NOT NULL;

-- ============================================================================
-- 2. UPDATE PROFILES TABLE (for backward compatibility)
-- ============================================================================

-- Add same fields to profiles for sync
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'trial_ended_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN trial_ended_at TIMESTAMPTZ;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'data_retention_expires_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN data_retention_expires_at TIMESTAMPTZ;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'data_retention_reason'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN data_retention_reason TEXT;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'paid_canceled_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN paid_canceled_at TIMESTAMPTZ;
  END IF;
END $$;

-- Update profile tier/status constraints
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_subscription_tier_check 
  CHECK (subscription_tier IN ('free', 'trial', 'trial_expired', 'data_cleared', 'basic', 'advanced', 'elite') OR subscription_tier IS NULL);

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_subscription_status_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_subscription_status_check 
  CHECK (subscription_status IN ('active', 'trialing', 'expired', 'canceled', 'paused', 'past_due', 'incomplete', 'incomplete_expired', 'unpaid', 'inactive') OR subscription_status IS NULL);

-- ============================================================================
-- 3. UPDATE TRIAL EXPIRATION FUNCTION TO SET RETENTION WINDOW
-- ============================================================================

-- Function to expire trial and set 30-day retention window
CREATE OR REPLACE FUNCTION public.expire_trial_with_retention(user_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.subscriptions
  SET 
    tier = 'trial_expired',
    status = 'expired',
    trial_ended_at = COALESCE(trial_ended_at, NOW()),
    data_retention_expires_at = COALESCE(
      data_retention_expires_at, 
      NOW() + INTERVAL '30 days'
    ),
    data_retention_reason = COALESCE(data_retention_reason, 'trial_expired'),
    updated_at = NOW()
  WHERE 
    user_id = user_id_param
    AND tier = 'trial'
    AND status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing check_trial_expiration to use retention
CREATE OR REPLACE FUNCTION public.check_trial_expiration()
RETURNS void AS $$
BEGIN
  -- Update subscriptions where trial has expired and no paid subscription exists
  UPDATE public.subscriptions
  SET 
    tier = 'trial_expired',
    status = 'expired',
    trial_ended_at = COALESCE(trial_ended_at, NOW()),
    data_retention_expires_at = COALESCE(
      data_retention_expires_at,
      NOW() + INTERVAL '30 days'
    ),
    data_retention_reason = COALESCE(data_retention_reason, 'trial_expired'),
    updated_at = NOW()
  WHERE 
    tier = 'trial'
    AND status = 'active'
    AND trial_ends_at IS NOT NULL
    AND trial_ends_at < NOW()
    AND (stripe_subscription_id IS NULL OR stripe_subscription_id = '');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. FUNCTION TO SET RETENTION WINDOW FOR CANCELED PAID SUBSCRIPTIONS
-- ============================================================================

-- Function to set 60-day retention window when paid subscription is canceled/paused
CREATE OR REPLACE FUNCTION public.set_paid_cancellation_retention(user_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.subscriptions
  SET 
    paid_canceled_at = COALESCE(paid_canceled_at, NOW()),
    data_retention_expires_at = COALESCE(
      data_retention_expires_at,
      NOW() + INTERVAL '60 days'
    ),
    data_retention_reason = CASE
      WHEN status = 'paused' THEN 'paid_paused'
      ELSE 'paid_canceled'
    END,
    updated_at = NOW()
  WHERE 
    user_id = user_id_param
    AND tier IN ('basic', 'advanced', 'elite')
    AND status IN ('canceled', 'paused')
    AND stripe_subscription_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. FUNCTION TO CLEAR INTERACTION DATA FOR EXPIRED RETENTION
-- ============================================================================

-- Function to safely delete all interaction/memory data for a user
-- This preserves: auth.users, profiles, subscriptions, agents, has_used_trial flags, connections
-- 
-- DELETES (interaction/memory data):
-- - agent_messages: All chat messages
-- - agent_conversations: All conversations
-- - business_knowledge_chunks: AI knowledge/memory chunks (if exists)
-- - calendar_event_notes: Event notes/interactions (if exists)
--
-- PRESERVES (identity, config, history):
-- - auth.users: User authentication
-- - profiles: User profile
-- - subscriptions: Subscription history
-- - agents: Agent definitions/configurations
-- - has_used_trial: Trial usage flag
-- - gmail_connections: Connection configs (not interaction data)
-- - calendar_connections: Connection configs (not interaction data)
CREATE OR REPLACE FUNCTION public.clear_user_interaction_data(user_id_param UUID)
RETURNS void AS $$
BEGIN
  -- Delete agent messages (cascades from conversations, but explicit for clarity)
  DELETE FROM public.agent_messages
  WHERE user_id = user_id_param;

  -- Delete agent conversations
  DELETE FROM public.agent_conversations
  WHERE user_id = user_id_param;

  -- Delete business knowledge chunks (AI memory/knowledge)
  -- Linked via business_profile_id -> business_profiles -> user_id
  -- Only delete if tables exist
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'business_knowledge_chunks'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'business_profiles'
  ) THEN
    DELETE FROM public.business_knowledge_chunks
    WHERE business_profile_id IN (
      SELECT id FROM public.business_profiles WHERE user_id = user_id_param
    );
  END IF;

  -- Delete calendar event notes (interaction data)
  -- Only delete if table exists and has user_id column
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'calendar_event_notes'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'calendar_event_notes' 
      AND column_name = 'user_id'
    ) THEN
      DELETE FROM public.calendar_event_notes
      WHERE user_id = user_id_param;
    END IF;
  END IF;

  -- Note: We do NOT delete:
  -- - auth.users (preserved)
  -- - profiles (preserved)
  -- - subscriptions (preserved, updated below)
  -- - agents (preserved - these are definitions/configs)
  -- - has_used_trial flags (preserved in profiles)
  -- - gmail_connections (preserved - connection configs, not interaction data)
  -- - calendar_connections (preserved - connection configs, not interaction data)

  -- Update subscription to reflect data has been cleared
  UPDATE public.subscriptions
  SET 
    tier = 'data_cleared',
    status = 'inactive',
    updated_at = NOW()
  WHERE 
    user_id = user_id_param
    AND data_retention_expires_at IS NOT NULL
    AND NOW() > data_retention_expires_at;

  -- Also update profile for backward compatibility
  UPDATE public.profiles
  SET 
    subscription_tier = 'data_cleared',
    subscription_status = 'inactive',
    updated_at = NOW()
  WHERE 
    id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. FUNCTION TO RUN DAILY CLEANUP JOB
-- ============================================================================

-- Main cleanup function to be called by scheduled job
-- Finds all users past retention period and clears their interaction data
CREATE OR REPLACE FUNCTION public.run_data_retention_cleanup()
RETURNS TABLE(
  user_id UUID,
  cleared_at TIMESTAMPTZ,
  retention_reason TEXT
) AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Find all users where:
  -- 1. data_retention_expires_at is set
  -- 2. Current time is past the expiration
  -- 3. User does NOT have an active paid subscription
  FOR user_record IN
    SELECT 
      s.user_id,
      s.data_retention_reason
    FROM public.subscriptions s
    WHERE 
      s.data_retention_expires_at IS NOT NULL
      AND NOW() > s.data_retention_expires_at
      AND s.tier NOT IN ('basic', 'advanced', 'elite')
      AND s.status NOT IN ('active', 'trialing')
      AND (s.stripe_subscription_id IS NULL OR s.stripe_subscription_id = '')
  LOOP
    -- Clear interaction data for this user
    PERFORM public.clear_user_interaction_data(user_record.user_id);
    
    -- Return record of what was cleared
    user_id := user_record.user_id;
    cleared_at := NOW();
    retention_reason := user_record.data_retention_reason;
    RETURN NEXT;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. UPDATE SYNC TRIGGER TO INCLUDE RETENTION FIELDS
-- ============================================================================

-- Update the sync function to include retention fields
CREATE OR REPLACE FUNCTION public.sync_profile_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- Update profile subscription fields when subscription changes
  UPDATE public.profiles
  SET
    subscription_tier = NEW.tier,
    subscription_status = NEW.status,
    stripe_customer_id = COALESCE(NEW.stripe_customer_id, profiles.stripe_customer_id),
    stripe_subscription_id = COALESCE(NEW.stripe_subscription_id, profiles.stripe_subscription_id),
    trial_ends_at = NEW.trial_ends_at,
    trial_started_at = NEW.trial_started_at,
    trial_ended_at = NEW.trial_ended_at,
    data_retention_expires_at = NEW.data_retention_expires_at,
    data_retention_reason = NEW.data_retention_reason,
    paid_canceled_at = NEW.paid_canceled_at,
    updated_at = NOW()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. FUNCTION TO CLEAR RETENTION WHEN USER REACTIVATES
-- ============================================================================

-- Function to clear retention window when user upgrades/reactivates
-- This preserves all data since user is reactivating within retention period
CREATE OR REPLACE FUNCTION public.clear_retention_on_reactivation(user_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.subscriptions
  SET 
    data_retention_expires_at = NULL,
    data_retention_reason = NULL,
    -- Keep trial_ended_at and paid_canceled_at for history
    updated_at = NOW()
  WHERE 
    user_id = user_id_param
    AND tier IN ('basic', 'advanced', 'elite')
    AND status IN ('active', 'trialing');
    
  -- Also update profile
  UPDATE public.profiles
  SET 
    data_retention_expires_at = NULL,
    data_retention_reason = NULL,
    updated_at = NOW()
  WHERE 
    id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

