-- Migration: Add default_model column to ai_providers
-- Created: 2026-02-02

ALTER TABLE ai_providers ADD COLUMN default_model VARCHAR(100);

COMMENT ON COLUMN ai_providers.default_model IS 'Default AI model for this provider';
