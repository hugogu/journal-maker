-- Migration: Add Conversation Messages table (replaces localStorage persistence)
-- Created: 2026-02-02
-- Feature: 002-prompt-ai-management

-- Create enum for message roles
CREATE TYPE message_role AS ENUM ('user', 'assistant', 'system');

-- Create conversation_messages table
CREATE TABLE conversation_messages (
  id SERIAL PRIMARY KEY,
  scenario_id INTEGER NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  role message_role NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  request_log JSONB, -- {systemPrompt, contextMessages, fullPrompt, variables}
  response_stats JSONB, -- {model, providerId, inputTokens, outputTokens, totalTokens, durationMs}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX idx_conversation_messages_scenario_id ON conversation_messages(scenario_id);
CREATE INDEX idx_conversation_messages_timestamp ON conversation_messages(timestamp);
CREATE INDEX idx_conversation_messages_scenario_timestamp ON conversation_messages(scenario_id, timestamp);

-- Add comment
COMMENT ON TABLE conversation_messages IS 'Individual conversation messages with request logs and stats';
