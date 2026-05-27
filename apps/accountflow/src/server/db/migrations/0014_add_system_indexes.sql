-- Migration: Add indexes for system queries
-- Description: Optimize queries related to accounting systems
-- Created: 2026-03-26

-- Index for system name lookups
CREATE INDEX IF NOT EXISTS idx_accounting_systems_name 
ON accounting_systems(name);

-- Index for system type and status filtering
CREATE INDEX IF NOT EXISTS idx_accounting_systems_type_status 
ON accounting_systems(type, status);

-- Index for company-based system queries
CREATE INDEX IF NOT EXISTS idx_accounting_systems_company_id 
ON accounting_systems(company_id);

-- Index for system_accounts junction table
CREATE INDEX IF NOT EXISTS idx_system_accounts_system_id 
ON system_accounts(system_id);

CREATE INDEX IF NOT EXISTS idx_system_accounts_account_id 
ON system_accounts(account_id);

-- Composite index for system-account lookups
CREATE INDEX IF NOT EXISTS idx_system_accounts_system_account 
ON system_accounts(system_id, account_id);

-- Index for system_rules junction table
CREATE INDEX IF NOT EXISTS idx_system_rules_system_id 
ON system_rules(system_id);

CREATE INDEX IF NOT EXISTS idx_system_rules_rule_id 
ON system_rules(rule_id);

-- Composite index for system-rule lookups
CREATE INDEX IF NOT EXISTS idx_system_rules_system_rule 
ON system_rules(system_id, rule_id);

-- Index for analysis entries by system
CREATE INDEX IF NOT EXISTS idx_analysis_entries_system_id 
ON analysis_entries(system_id);

-- Composite index for scenario-system analysis lookups
CREATE INDEX IF NOT EXISTS idx_analysis_entries_scenario_system 
ON analysis_entries(scenario_id, system_id);

-- Index for system preferences
CREATE INDEX IF NOT EXISTS idx_system_preferences_system_id 
ON system_preferences(system_id);

-- Composite index for system preference lookups
CREATE INDEX IF NOT EXISTS idx_system_preferences_system_key 
ON system_preferences(system_id, key);

-- Add comments
COMMENT ON INDEX idx_accounting_systems_name IS 'Optimize system name lookups';
COMMENT ON INDEX idx_system_accounts_system_id IS 'Optimize account queries by system';
COMMENT ON INDEX idx_system_rules_system_id IS 'Optimize rule queries by system';
COMMENT ON INDEX idx_analysis_entries_system_id IS 'Optimize analysis queries by system';
