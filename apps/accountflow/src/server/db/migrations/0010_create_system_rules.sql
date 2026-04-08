-- Migration: Create system_rules junction table
-- Description: Many-to-many relationship between accounting systems and journal rules

CREATE TABLE system_rules (
  system_id INTEGER NOT NULL REFERENCES accounting_systems(id) ON DELETE CASCADE,
  rule_id INTEGER NOT NULL REFERENCES journal_rules(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  PRIMARY KEY (system_id, rule_id)
);

-- Indexes
CREATE INDEX idx_system_rules_system_id ON system_rules(system_id);
CREATE INDEX idx_system_rules_rule_id ON system_rules(rule_id);

-- Comments
COMMENT ON TABLE system_rules IS 'Junction table linking accounting systems to journal rules (many-to-many)';
