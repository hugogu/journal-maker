-- Migration: Add Conversation Shares table
-- Created: 2026-02-02
-- Feature: 002-prompt-ai-management

-- Create conversation_shares table
CREATE TABLE conversation_shares (
  id SERIAL PRIMARY KEY,
  scenario_id INTEGER NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  share_token VARCHAR(64) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  revoked_at TIMESTAMP WITH TIME ZONE,
  is_revoked BOOLEAN DEFAULT FALSE NOT NULL
);

-- Create indexes
CREATE INDEX idx_conversation_shares_scenario_id ON conversation_shares(scenario_id);
CREATE INDEX idx_conversation_shares_token ON conversation_shares(share_token);
CREATE INDEX idx_conversation_shares_is_revoked ON conversation_shares(is_revoked);

-- Add comment
COMMENT ON TABLE conversation_shares IS 'Public share links for conversation access';
