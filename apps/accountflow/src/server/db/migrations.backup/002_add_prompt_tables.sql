-- Migration: Add Prompt Template and Version tables
-- Created: 2026-02-02
-- Feature: 002-prompt-ai-management

-- Create enum for prompt scenario types
CREATE TYPE prompt_scenario_type AS ENUM (
  'scenario_analysis',
  'sample_generation',
  'prompt_generation',
  'flowchart_generation'
);

-- Create prompt_templates table
CREATE TABLE prompt_templates (
  id SERIAL PRIMARY KEY,
  scenario_type prompt_scenario_type NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  active_version_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create prompt_versions table
CREATE TABLE prompt_versions (
  id SERIAL PRIMARY KEY,
  template_id INTEGER NOT NULL REFERENCES prompt_templates(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE (template_id, version_number)
);

-- Add foreign key from prompt_templates to prompt_versions (for active_version_id)
ALTER TABLE prompt_templates
  ADD CONSTRAINT fk_active_version
  FOREIGN KEY (active_version_id) REFERENCES prompt_versions(id)
  ON DELETE SET NULL;

-- Create indexes
CREATE INDEX idx_prompt_versions_template_id ON prompt_versions(template_id);
CREATE INDEX idx_prompt_versions_created_by ON prompt_versions(created_by);

-- Add comment
COMMENT ON TABLE prompt_templates IS 'Prompt templates for different AI analysis scenarios';
COMMENT ON TABLE prompt_versions IS 'Version history for prompt templates';
