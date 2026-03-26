-- Migration: Add system_id to analysis_entries
-- Description: Track which accounting system was used for each analysis

ALTER TABLE analysis_entries
ADD COLUMN system_id INTEGER REFERENCES accounting_systems(id) ON DELETE SET NULL;

-- Index for filtering analyses by system
CREATE INDEX idx_analysis_entries_system_id ON analysis_entries(system_id);

-- Comment
COMMENT ON COLUMN analysis_entries.system_id IS 'Reference to the accounting system used for this analysis';
