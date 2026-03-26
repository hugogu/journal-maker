-- Migration: Create system_preferences table
-- Description: Configuration settings specific to each accounting system

CREATE TABLE system_preferences (
  id SERIAL PRIMARY KEY,
  system_id INTEGER NOT NULL REFERENCES accounting_systems(id) ON DELETE CASCADE,
  key VARCHAR(255) NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE (system_id, key)
);

-- Indexes
CREATE INDEX idx_system_preferences_system_id ON system_preferences(system_id);
CREATE INDEX idx_system_preferences_key ON system_preferences(key);

-- Comments
COMMENT ON TABLE system_preferences IS 'System-specific preferences and configuration (记账偏好)';
COMMENT ON COLUMN system_preferences.key IS 'Preference key (e.g., recognition_criteria, timing_rules, policy_flags)';
COMMENT ON COLUMN system_preferences.value IS 'Preference value stored as JSON for flexibility';
