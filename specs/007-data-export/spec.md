# Feature Specification: Data Export (Excel/CSV)

**Feature Branch**: `007-data-export`
**Created**: 2026-02-09
**Status**: Draft
**Input**: User description: "Support data exporting as Excel/CSV for the confirmed Accounts, Accounting Rules for the selected Scenarios."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Export Confirmed Rules for a Single Scenario (Priority: P1)

As an accountant reviewing a scenario, I want to export the confirmed accounting rules to Excel or CSV so that I can share them with colleagues, archive them offline, or import them into other accounting systems.

**Why this priority**: This is the core use case. Users need to extract confirmed rules from individual scenarios for external consumption — whether for review, compliance documentation, or integration with other tools.

**Independent Test**: Can be fully tested by confirming rules in a scenario, clicking export, and verifying the downloaded file contains all confirmed rules with correct data.

**Acceptance Scenarios**:

1. **Given** a scenario with 5 confirmed accounting rules, **When** the user clicks "Export as Excel" from the scenario page, **Then** an Excel file downloads containing all 5 confirmed rules with event name, debit/credit accounts, conditions, and amount formula.
2. **Given** a scenario with 3 confirmed and 2 proposed rules, **When** the user exports, **Then** only the 3 confirmed rules appear in the export (proposed rules are excluded).
3. **Given** a scenario with no confirmed rules, **When** the user attempts to export, **Then** the system informs the user that there are no confirmed rules to export.
4. **Given** a scenario with confirmed rules, **When** the user chooses CSV format, **Then** a CSV file downloads with the same data in a flat tabular format.

---

### User Story 2 - Export Confirmed Accounts (Priority: P1)

As an accountant, I want to export the chart of accounts referenced by confirmed rules so that I have a complete picture of the accounting structure alongside the rules.

**Why this priority**: Accounts provide essential context for understanding rules. Exporting rules without their associated accounts would leave recipients unable to fully interpret the data.

**Independent Test**: Can be tested by exporting from a scenario and verifying the accounts sheet/section contains all accounts referenced in the confirmed rules with their code, name, type, and direction.

**Acceptance Scenarios**:

1. **Given** a scenario with confirmed rules referencing 8 distinct accounts, **When** the user exports, **Then** the export includes all 8 accounts with code, name, type, direction, and description.
2. **Given** an Excel export, **When** the user opens the file, **Then** accounts and rules appear on separate worksheets within the same workbook.
3. **Given** a CSV export, **When** the user opens the file, **Then** accounts and rules are exported as separate CSV files bundled in a single ZIP archive.

---

### User Story 3 - Export from Multiple Selected Scenarios (Priority: P2)

As a finance manager overseeing multiple business scenarios, I want to select several scenarios and export their confirmed rules and accounts together so that I can consolidate the data for reporting or audit purposes.

**Why this priority**: Multi-scenario export saves time for users managing multiple scenarios. It builds on the single-scenario export and adds batch capability.

**Independent Test**: Can be tested by selecting 2+ scenarios from the scenario list page, triggering a combined export, and verifying all selected scenarios' confirmed data is included.

**Acceptance Scenarios**:

1. **Given** the scenario list page with multiple scenarios, **When** the user selects 3 scenarios and clicks "Export Selected", **Then** the export includes confirmed rules and referenced accounts from all 3 scenarios.
2. **Given** an Excel export of multiple scenarios, **When** the user opens the file, **Then** each scenario's rules appear on a separate worksheet, with a shared accounts worksheet that unions all referenced accounts (deduplicated by account code).
3. **Given** a selection that includes a scenario with no confirmed rules, **When** the user exports, **Then** the system includes only scenarios that have confirmed data, and informs the user if any selected scenarios were skipped.

---

### User Story 4 - Choose Export Format (Priority: P2)

As a user, I want to choose between Excel and CSV formats before downloading so that I can pick the format that best fits my downstream use.

**Why this priority**: Format flexibility ensures the feature serves users with different tooling preferences. Some prefer Excel for its multi-sheet support; others need CSV for programmatic ingestion.

**Independent Test**: Can be tested by triggering an export and verifying the format selection dialog appears with Excel and CSV options, and each produces the correct file type.

**Acceptance Scenarios**:

1. **Given** the user clicks an export action, **When** the format selection appears, **Then** the user sees "Excel (.xlsx)" and "CSV (.csv)" as options.
2. **Given** the user selects Excel, **Then** the downloaded file has `.xlsx` extension and opens correctly in spreadsheet applications.
3. **Given** the user selects CSV for a multi-scenario export, **Then** the downloaded file is a `.zip` archive containing separate CSV files per data type.

---

### Edge Cases

- What happens when a scenario has confirmed rules but the referenced accounts have been deactivated? The export still includes these accounts, marked with their active/inactive status.
- What happens when the same account is referenced across multiple selected scenarios? The accounts sheet deduplicates by account code, listing each account once.
- What happens when a rule has complex debit/credit sides with multiple entry lines? Each entry line is flattened into its own row in the export, with the parent rule information repeated.
- What happens when the export contains special characters (Unicode, commas in CSV fields, newlines in descriptions)? The export properly encodes/escapes these characters per the file format specification.
- What happens when no scenarios are selected for bulk export? The export action is disabled until at least one scenario is selected.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST export confirmed accounting rules for one or more selected scenarios in Excel (.xlsx) format.
- **FR-002**: System MUST export confirmed accounting rules for one or more selected scenarios in CSV format.
- **FR-003**: System MUST export accounts referenced by confirmed rules alongside the rules themselves.
- **FR-004**: System MUST only include rules with "confirmed" status in the export; proposed rules MUST be excluded.
- **FR-005**: System MUST allow the user to select the export format (Excel or CSV) before downloading.
- **FR-006**: For Excel exports, the system MUST organize data into separate worksheets: one for accounts and one for rules per scenario.
- **FR-007**: For CSV exports with multiple data sets, the system MUST bundle multiple CSV files into a single ZIP archive.
- **FR-008**: Each exported rule row MUST include: scenario name, event name, event description, entry line account code, entry line account name, debit/credit side, amount formula, conditions, and rule status.
- **FR-009**: Each exported account row MUST include: account code, account name, account type, normal direction, description, and active/inactive status.
- **FR-010**: System MUST deduplicate accounts when exporting from multiple scenarios, listing each unique account (by code) once.
- **FR-011**: System MUST flatten multi-line journal entries so that each debit/credit entry line appears as its own row, with rule-level fields repeated.
- **FR-012**: System MUST provide an export action on the individual scenario page for single-scenario export.
- **FR-013**: System MUST provide a bulk export action on the scenario list page for multi-scenario export.
- **FR-014**: System MUST generate a meaningful filename for exports (e.g., `{scenario-name}-export.xlsx` for single, `scenarios-export-{date}.xlsx` for multi).
- **FR-015**: System MUST display a user-friendly message when no confirmed data exists for the selected scenario(s).

### Key Entities

- **Scenario**: A business scenario that groups accounting events and rules. Has a status (draft/confirmed/archived) and belongs to a company.
- **Account**: An entry in the chart of accounts with a code, name, type (asset/liability/equity/revenue/expense), normal direction (debit/credit/both), and active flag. Belongs to a company. Hierarchical via parent reference.
- **Journal Rule**: An accounting rule tied to a scenario and an accounting event. Has a status (proposal/confirmed). Contains structured debit/credit sides with multiple entry lines, each referencing an account with an amount formula.
- **Accounting Event**: A business event within a scenario that triggers journal entries. Rules and entries are linked to events.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can export confirmed rules and accounts from a single scenario in under 5 seconds (for scenarios with up to 50 rules).
- **SC-002**: Exported Excel files open without errors in common spreadsheet applications (Excel, Google Sheets, LibreOffice Calc).
- **SC-003**: Exported CSV files parse correctly with standard CSV parsers without data corruption or encoding issues.
- **SC-004**: 100% of confirmed rules and their referenced accounts are included in the export (no data loss).
- **SC-005**: Users can complete the full export workflow (select scenario(s), choose format, download) in under 3 clicks.
- **SC-006**: Multi-scenario exports correctly deduplicate accounts and separate rules by scenario.

## Assumptions

- The export is generated server-side and downloaded via the browser's standard file download mechanism.
- Excel generation will require a server-side library. This is an implementation detail to be decided during planning.
- CSV files use UTF-8 encoding with BOM for compatibility with Excel's CSV import.
- The existing "Export Data" button on the scenario detail page will be enhanced to support format selection (currently only exports JSON).
- Account hierarchy (parent-child relationships) is not represented in the flat export; only the individual account rows are exported.
- The export includes a header row with column names for both Excel and CSV formats.
- No authentication or authorization changes are needed — export access follows existing scenario access rules.
