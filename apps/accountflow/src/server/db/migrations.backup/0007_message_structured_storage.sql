-- Migration: message structured storage and journal rule structure
-- Created: 2026-02-04
-- Feature: 005-message-structured-storage

-- Add structured payload column to conversation_messages
ALTER TABLE conversation_messages
	ADD COLUMN structured_data JSONB;

-- Create enums for journal rule status and analysis diagram types
CREATE TYPE journal_rule_status AS ENUM ('proposal', 'confirmed');
CREATE TYPE analysis_diagram_type AS ENUM ('mermaid', 'chart', 'table');

-- Extend journal_rules with executable structure
ALTER TABLE journal_rules
	ADD COLUMN debit_side JSONB,
	ADD COLUMN credit_side JSONB,
	ADD COLUMN trigger_type VARCHAR(50),
	ADD COLUMN status journal_rule_status NOT NULL DEFAULT 'proposal';

-- Create analysis_subjects table
CREATE TABLE analysis_subjects (
	id SERIAL PRIMARY KEY,
	scenario_id INTEGER NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
	source_message_id INTEGER REFERENCES conversation_messages(id) ON DELETE SET NULL,
	code VARCHAR(20) NOT NULL,
	name VARCHAR(100) NOT NULL,
	direction account_direction NOT NULL,
	description TEXT,
	metadata JSONB,
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create analysis_entries table
CREATE TABLE analysis_entries (
	id SERIAL PRIMARY KEY,
	scenario_id INTEGER NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
	source_message_id INTEGER REFERENCES conversation_messages(id) ON DELETE SET NULL,
	lines JSONB NOT NULL,
	description TEXT,
	amount NUMERIC(18,2),
	currency VARCHAR(10),
	metadata JSONB,
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create analysis_diagrams table
CREATE TABLE analysis_diagrams (
	id SERIAL PRIMARY KEY,
	scenario_id INTEGER NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
	source_message_id INTEGER REFERENCES conversation_messages(id) ON DELETE SET NULL,
	diagram_type analysis_diagram_type NOT NULL,
	payload JSONB NOT NULL,
	metadata JSONB,
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for analysis artifacts
CREATE INDEX idx_analysis_subjects_scenario_id ON analysis_subjects(scenario_id);
CREATE INDEX idx_analysis_subjects_source_message_id ON analysis_subjects(source_message_id);

CREATE INDEX idx_analysis_entries_scenario_id ON analysis_entries(scenario_id);
CREATE INDEX idx_analysis_entries_source_message_id ON analysis_entries(source_message_id);

CREATE INDEX idx_analysis_diagrams_scenario_id ON analysis_diagrams(scenario_id);
CREATE INDEX idx_analysis_diagrams_source_message_id ON analysis_diagrams(source_message_id);
