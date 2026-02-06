-- Migration: Drop deprecated ai_configs table
-- Created: 2026-02-02
-- Reason: Consolidated into ai_providers table

DROP TABLE IF EXISTS ai_configs;

-- Drop related indexes if any
DROP INDEX IF EXISTS idx_ai_configs_company_id;
