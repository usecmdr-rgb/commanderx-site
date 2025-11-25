-- Campaign Purpose System
-- Extends call_campaigns table to support purpose-aware behavior

-- Add new columns to call_campaigns table
ALTER TABLE call_campaigns
  ADD COLUMN IF NOT EXISTS purpose TEXT,
  ADD COLUMN IF NOT EXISTS purpose_details TEXT,
  ADD COLUMN IF NOT EXISTS script_style TEXT CHECK (script_style IN ('friendly', 'professional', 'energetic', 'calm', 'casual')),
  ADD COLUMN IF NOT EXISTS business_context_required BOOLEAN DEFAULT true;

-- Update the type column to support new purpose categories
-- First, drop the existing CHECK constraint
ALTER TABLE call_campaigns
  DROP CONSTRAINT IF EXISTS call_campaigns_type_check;

-- Add new CHECK constraint with expanded type values
-- Note: We keep 'type' for backward compatibility, but 'purpose' is the new primary field
ALTER TABLE call_campaigns
  ADD CONSTRAINT call_campaigns_type_check 
  CHECK (type IN (
    'cold_call', 
    'feedback', 
    'appointment_reminder',
    -- Legacy types kept for backward compatibility
    'lead_generation',
    'feedback_satisfaction',
    'appointment_management',
    'order_updates',
    'administrative',
    'loyalty_relationship',
    'urgent_notification',
    'custom'
  ));

-- Add CHECK constraint for purpose field
ALTER TABLE call_campaigns
  ADD CONSTRAINT call_campaigns_purpose_check
  CHECK (purpose IN (
    'lead_generation_sales',
    'feedback_satisfaction',
    'appointment_management',
    'order_project_updates',
    'administrative_operations',
    'loyalty_relationship',
    'urgent_notifications',
    'custom'
  ) OR purpose IS NULL);

-- Create index for purpose lookups
CREATE INDEX IF NOT EXISTS idx_call_campaigns_purpose ON call_campaigns(purpose);

-- Update comments
COMMENT ON COLUMN call_campaigns.purpose IS 'Campaign purpose category (lead_generation_sales, feedback_satisfaction, appointment_management, order_project_updates, administrative_operations, loyalty_relationship, urgent_notifications, custom)';
COMMENT ON COLUMN call_campaigns.purpose_details IS 'Optional specific instructions or custom messaging for the campaign purpose';
COMMENT ON COLUMN call_campaigns.script_style IS 'Tone/style for Aloha: friendly, professional, energetic, calm, casual';
COMMENT ON COLUMN call_campaigns.business_context_required IS 'Whether this campaign requires business context information to execute properly';

-- Migration note: For existing campaigns, purpose will be NULL
-- They can be updated via the UI or API

