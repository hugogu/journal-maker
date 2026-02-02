-- Migration: Add Company Profile table
-- Created: 2026-02-02
-- Feature: 002-prompt-ai-management

-- Create company_profile table (extends existing companies table concept)
CREATE TABLE company_profile (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  business_model TEXT,
  industry VARCHAR(50),
  accounting_preference TEXT,
  notes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Insert default record (id=1)
INSERT INTO company_profile (id, name) VALUES (1, 'Default Company');

-- Create index
CREATE INDEX idx_company_profile_updated_at ON company_profile(updated_at);

-- Add comment
COMMENT ON TABLE company_profile IS 'Company information for AI context injection';
