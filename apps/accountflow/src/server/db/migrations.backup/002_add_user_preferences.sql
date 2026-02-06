-- Migration: Add User Preferences table
-- Created: 2026-02-02
-- Feature: 002-prompt-ai-management

-- Create user_preferences table
CREATE TABLE user_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  preferred_provider_id INTEGER REFERENCES ai_providers(id),
  preferred_model VARCHAR(100),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX idx_user_preferences_provider_id ON user_preferences(preferred_provider_id);

-- Add comment
COMMENT ON TABLE user_preferences IS 'User AI provider and model preferences';
