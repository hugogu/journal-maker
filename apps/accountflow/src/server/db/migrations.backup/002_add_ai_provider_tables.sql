-- Migration: Add AI Provider and Model tables
-- Created: 2026-02-02
-- Feature: 002-prompt-ai-management

-- Create enum for provider types
CREATE TYPE provider_type AS ENUM ('openai', 'azure', 'ollama', 'custom');

-- Create enum for provider status
CREATE TYPE provider_status AS ENUM ('active', 'inactive', 'error');

-- Create ai_providers table
CREATE TABLE ai_providers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type provider_type NOT NULL,
  api_endpoint VARCHAR(500) NOT NULL,
  api_key VARCHAR(500) NOT NULL,
  is_default BOOLEAN DEFAULT FALSE NOT NULL,
  status provider_status DEFAULT 'active' NOT NULL,
  last_model_fetch TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Ensure only one default provider
CREATE UNIQUE INDEX idx_ai_providers_single_default 
  ON ai_providers(is_default) 
  WHERE is_default = TRUE;

-- Create ai_models table (cache for provider model lists)
CREATE TABLE ai_models (
  id SERIAL PRIMARY KEY,
  provider_id INTEGER NOT NULL REFERENCES ai_providers(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  capabilities JSONB DEFAULT '{}'::jsonb,
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE (provider_id, name)
);

-- Create indexes
CREATE INDEX idx_ai_models_provider_id ON ai_models(provider_id);
CREATE INDEX idx_ai_providers_status ON ai_providers(status);

-- Add comments
COMMENT ON TABLE ai_providers IS 'AI service provider configurations';
COMMENT ON TABLE ai_models IS 'Cached model lists from AI providers';
