-- Seed: Create built-in accounting systems
-- Description: Insert Financial Reporting and Management Reporting systems
-- Note: This should be run after company_profile is seeded (assuming company_id = 1)

-- Financial Reporting (财报)
INSERT INTO accounting_systems (company_id, name, description, type, status, created_at, updated_at)
VALUES (
  1,
  'Financial Reporting',
  'Standard financial reporting framework for external stakeholders, regulatory compliance, and statutory financial statements. Follows GAAP/IFRS principles.',
  'builtin',
  'active',
  NOW(),
  NOW()
)
ON CONFLICT (company_id, lower(name)) DO NOTHING;

-- Management Reporting (管报)
INSERT INTO accounting_systems (company_id, name, description, type, status, created_at, updated_at)
VALUES (
  1,
  'Management Reporting',
  'Internal management accounting framework for decision-making, cost analysis, budgeting, and operational performance tracking. Focuses on actionable insights.',
  'builtin',
  'active',
  NOW(),
  NOW()
)
ON CONFLICT (company_id, lower(name)) DO NOTHING;

-- Verify insertion
SELECT id, name, type, status FROM accounting_systems WHERE type = 'builtin' ORDER BY id;
