# Feature Specification: Accounting Event Entity

**Feature Branch**: `006-accounting-event-entity`
**Created**: 2026-02-06
**Status**: Draft
**Input**: User description: "Introduce accounting event as a first-class domain entity. Currently event names exist as loose varchar fields on journal_rules and analysis_entries tables. Promote this to a dedicated accounting_events table (per-scenario, with name, description, type/classification). Add foreign key references from journal_rules and analysis_entries. Backfill existing eventName strings into the new table. Add UI grouping of rules and entries by event. Add a composable for event CRUD. The AI parsing layer should create/link events when processing analysis results."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Analysis Results Grouped by Event (Priority: P1)

When a user runs AI analysis on a business scenario, the resulting accounting rules and journal entries are displayed grouped by their accounting event (e.g., "Payment Received", "Invoice Issued", "Goods Shipped"). Each event group shows its name, description, and all associated rules and entries underneath. This replaces the current flat list of rules.

**Why this priority**: Grouping by event is the primary user-facing improvement. Without it, promoting event to a first-class entity has no visible impact. This is the core value delivery.

**Independent Test**: Can be fully tested by running an AI analysis on any scenario and verifying the results pane shows rules and entries organized under labeled event groups.

**Acceptance Scenarios**:

1. **Given** an AI analysis has completed for a scenario, **When** the user views the analysis results, **Then** rules and entries are grouped under their respective event names with event descriptions visible.
2. **Given** an AI analysis returns 3 events with 2 rules each, **When** the user views the results, **Then** they see 3 distinct event groups, each containing its 2 rules.
3. **Given** a rule has no associated event, **When** the user views the results, **Then** the rule appears in an "Uncategorized" group at the bottom.

---

### User Story 2 - AI Automatically Creates Events During Analysis (Priority: P1)

When the AI analyzes a business scenario and identifies accounting events, the system automatically creates event records and links the generated rules and entries to them. The user does not need to manually create events — they emerge naturally from AI analysis. If the AI identifies an event that already exists for the scenario (same name), the system reuses the existing event rather than creating a duplicate.

**Why this priority**: This is the data foundation. Without automatic event creation and linking during AI processing, events would need manual creation, defeating the purpose of AI-assisted analysis.

**Independent Test**: Can be tested by running an AI analysis and verifying that event records are created in the system, with rules and entries properly linked to them.

**Acceptance Scenarios**:

1. **Given** the AI returns analysis results containing 3 distinct events, **When** the results are saved, **Then** 3 event records are created and each rule/entry is linked to its corresponding event.
2. **Given** a scenario already has an event named "Payment Received" from a previous analysis, **When** a new analysis also identifies "Payment Received", **Then** the existing event record is reused (no duplicate created) and new rules are linked to it.
3. **Given** the AI returns a rule without an event identifier, **When** the results are saved, **Then** the rule is saved without an event link (nullable foreign key).

---

### User Story 3 - Browse and Manage Events Per Scenario (Priority: P2)

Users can view a list of all accounting events identified for a given scenario. Each event shows its name, description, type classification, and a count of linked rules and entries. Users can edit event descriptions or merge duplicate events.

**Why this priority**: Gives users oversight and control over the events the AI has created. Important for audit and accuracy, but secondary to the core analysis flow.

**Independent Test**: Can be tested by navigating to a scenario's event list, verifying events are displayed with correct metadata, and editing an event's description.

**Acceptance Scenarios**:

1. **Given** a scenario has 5 events from past analyses, **When** the user opens the scenario's event list, **Then** all 5 events are displayed with their names, descriptions, and linked rule/entry counts.
2. **Given** an event named "Payment Processing", **When** the user edits its description, **Then** the updated description is saved and visible immediately.
3. **Given** two events with similar names exist (e.g., "Payment Received" and "Payment Receipt"), **When** the user merges them, **Then** all rules and entries from the merged event are reassigned to the target event, and the merged event is removed.

---

### User Story 4 - Backward Compatibility with Existing Data (Priority: P1)

Existing scenarios that have rules and entries with event name strings (but no event entity) continue to work without interruption. A one-time data migration creates event records from existing `eventName` strings and links existing rules and entries to them. Users see no degradation in existing functionality.

**Why this priority**: The system already has production data with event names as strings. Breaking existing data or losing event information would be unacceptable.

**Independent Test**: Can be tested by verifying that after the migration, all existing rules and entries that had an `eventName` value now have a proper event entity link, and the UI displays them correctly.

**Acceptance Scenarios**:

1. **Given** 10 existing rules with `eventName` values across 3 scenarios, **When** the migration runs, **Then** unique event records are created per scenario and all 10 rules are linked to their respective events.
2. **Given** existing rules where `eventName` is null, **When** the migration runs, **Then** those rules remain without an event link (no error, no dummy event created).
3. **Given** two rules in the same scenario with the same `eventName` string, **When** the migration runs, **Then** a single event record is created and both rules link to it.

---

### Edge Cases

- What happens when the AI returns an event name longer than the maximum allowed length? The system truncates to the limit and logs a warning.
- What happens when two concurrent analysis sessions for the same scenario identify the same event? The system uses an upsert pattern (find-or-create by scenario + event name) to avoid race condition duplicates.
- What happens when a user deletes an event that has linked rules? The rules lose their event link (set to null) but are not deleted. They appear in the "Uncategorized" group.
- What happens when merging events across different analysis messages? All linked artifacts (rules, entries) are reassigned regardless of their source message.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST store accounting events as independent records with a name, description, and optional type classification, scoped to a specific scenario.
- **FR-002**: System MUST enforce uniqueness of event names within a single scenario (no two events with the same name in one scenario).
- **FR-003**: System MUST link journal rules to events via a reference, allowing a rule to optionally belong to one event.
- **FR-004**: System MUST link analysis entries to events via a reference, allowing an entry to optionally belong to one event.
- **FR-005**: System MUST automatically create event records when AI analysis results are processed, matching events by name within the scenario.
- **FR-006**: System MUST reuse existing event records when a subsequent analysis identifies an event with the same name in the same scenario.
- **FR-007**: System MUST display analysis results grouped by event in the results pane, with ungrouped items shown separately.
- **FR-008**: System MUST allow users to view all events for a scenario with their linked rule and entry counts.
- **FR-009**: System MUST allow users to edit event name and description.
- **FR-010**: System MUST allow users to merge two events within the same scenario, reassigning all linked rules and entries to the target event.
- **FR-011**: System MUST migrate existing `eventName` string data into proper event records during a one-time data migration.
- **FR-012**: System MUST retain the original `eventName` string fields during the transition period for backward compatibility.
- **FR-013**: System MUST handle null/missing events gracefully — rules and entries without an event link remain functional and visible.

### Key Entities

- **Accounting Event**: Represents a discrete business event that triggers accounting entries within a scenario. Key attributes: name (unique per scenario), description, type/classification. Belongs to one scenario. Has many journal rules and analysis entries.
- **Journal Rule** (existing, modified): Gains an optional reference to an Accounting Event. Existing `eventName` string field retained for backward compatibility.
- **Analysis Entry** (existing, modified): Gains an optional reference to an Accounting Event. Existing `eventName` string field retained for backward compatibility.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of existing rules and entries with non-null event names are linked to proper event records after migration, with zero data loss.
- **SC-002**: Users can identify which accounting event a rule belongs to within 2 seconds of viewing analysis results (via visual grouping).
- **SC-003**: AI analysis results are automatically organized into event groups without any manual user action.
- **SC-004**: Duplicate event detection achieves 100% accuracy for exact name matches within a scenario (no duplicate event records for the same name).
- **SC-005**: Event merge operation completes in under 3 seconds and reassigns all linked artifacts correctly.
- **SC-006**: Existing scenarios with no event data continue to display and function identically to pre-migration behavior.

## Assumptions

- Event names returned by the AI are sufficiently consistent that exact string matching (case-insensitive) is adequate for deduplication. Fuzzy matching is out of scope.
- Event type/classification values will be free-text initially, not a fixed enum. A standardized taxonomy may be introduced in a future iteration.
- The migration will run as part of the standard database migration process and does not require a separate maintenance window.
- The `eventName` varchar fields on `journal_rules` and `analysis_entries` will be retained (not dropped) in this iteration to allow rollback. They can be deprecated in a future release.
- Event management UI will be integrated into the existing scenario detail pages, not as a standalone top-level section.
