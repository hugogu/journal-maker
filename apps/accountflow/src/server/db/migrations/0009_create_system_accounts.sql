-- Migration: Create system_accounts junction table
-- Description: Many-to-many relationship between accounting systems and accounts

CREATE TABLE system_accounts (
  system_id INTEGER NOT NULL REFERENCES accounting_systems(id) ON DELETE CASCADE,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  PRIMARY KEY (system_id, account_id)
);

-- Indexes
CREATE INDEX idx_system_accounts_system_id ON system_accounts(system_id);
CREATE INDEX idx_system_accounts_account_id ON system_accounts(account_id);

-- Comments
COMMENT ON TABLE system_accounts IS 'Junction table linking accounting systems to accounts (many-to-many)';
