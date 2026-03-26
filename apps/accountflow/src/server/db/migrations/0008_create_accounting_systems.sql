-- Migration: Create accounting_systems table
-- Description: Core table for accounting frameworks (体系)

CREATE TABLE accounting_systems (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES company_profile(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL CHECK (type IN ('builtin', 'custom')),
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_accounting_systems_company_id ON accounting_systems(company_id);
CREATE INDEX idx_accounting_systems_name ON accounting_systems(name);
CREATE INDEX idx_accounting_systems_type_status ON accounting_systems(type, status);

-- Unique constraint: System name must be unique per company
CREATE UNIQUE INDEX idx_accounting_systems_company_name ON accounting_systems(company_id, LOWER(name));

-- Comments
COMMENT ON TABLE accounting_systems IS 'Accounting systems (体系) - different accounting frameworks like Financial Reporting and Management Reporting';
COMMENT ON COLUMN accounting_systems.type IS 'builtin: Pre-configured systems (cannot delete), custom: User-created systems';
COMMENT ON COLUMN accounting_systems.status IS 'active: Available for analysis, archived: No longer available for new analyses';
