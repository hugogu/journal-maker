-- Migration: Add confirmation status to conversation messages
-- Created: 2026-02-05
-- Feature: Add confirmation tracking

-- Add confirmation status field
ALTER TABLE conversation_messages 
ADD COLUMN confirmed_at TIMESTAMP WITH TIME ZONE;

-- Add comment
COMMENT ON COLUMN conversation_messages.confirmed_at IS 'Timestamp when message was confirmed by user (null means not confirmed)';

-- Create index for confirmed messages
CREATE INDEX idx_conversation_messages_confirmed_at ON conversation_messages(confirmed_at) WHERE confirmed_at IS NOT NULL;
