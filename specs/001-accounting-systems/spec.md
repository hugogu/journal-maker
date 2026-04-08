# Feature Specification: Multi-Accounting System Support

**Feature Branch**: `001-accounting-systems`  
**Created**: 2026-03-26  
**Status**: Draft  
**Input**: User description: "会计科目及记账规则的设计，按需求使用方不同，会有不同的体系，不同体系中，会计科目、记账规则、记账偏好都是不同的。需要在系统中引入体系这个概念，同时在分析页面中，也需要明确当前是基于哪个体系去做评估和分析的。目前已知的体系包括财报和管报两个体系。需要能添加自定义的体系。他们共享同样的业务背景和会计事件，但是有各有各的关注的事件及规则。"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create and Configure Accounting System (Priority: P1)

As a system administrator, I want to create and configure different accounting systems (e.g., Financial Reporting, Management Reporting) so that different departments can use accounting rules tailored to their specific needs.

**Why this priority**: This is the foundational feature that enables all other multi-system functionality. Without the ability to define systems, no other scenarios are possible.

**Independent Test**: Can be fully tested by creating a new accounting system with a unique name, description, and system type, and verifying it appears in the system list.

**Acceptance Scenarios**:

1. **Given** the systems management page, **When** I create a new system with name "Management Reporting 2024" and type "custom", **Then** the system is created and appears in the active systems list
2. **Given** an existing system, **When** I update its description and preferences, **Then** the changes are saved and reflected immediately
3. **Given** a system with no associated scenarios, **When** I delete the system, **Then** the system is removed from the list and cannot be selected for new analyses
4. **Given** the system list, **When** I view the default systems (Financial Reporting, Management Reporting), **Then** both systems are present and marked as built-in

---

### User Story 2 - System-Aware Analysis (Priority: P1)

As a business analyst, I want to select which accounting system to use when analyzing a business scenario so that the AI generates journal entries and rules appropriate for that system's requirements.

**Why this priority**: This is the primary user-facing value of the feature - ensuring analysis results match the intended accounting framework.

**Independent Test**: Can be fully tested by selecting a system before analysis and verifying that generated journal rules reference accounts and rules specific to that system.

**Acceptance Scenarios**:

1. **Given** a business scenario description, **When** I select "Financial Reporting" system and start analysis, **Then** the AI uses Financial Reporting accounts and rules for generating journal entries
2. **Given** the same scenario description, **When** I switch to "Management Reporting" system and re-analyze, **Then** the AI generates different journal entries appropriate for management reporting purposes
3. **Given** an active analysis session, **When** I view the analysis page, **Then** the currently selected system is prominently displayed with an option to change it
4. **Given** an analysis completed with one system, **When** I view the results, **Then** I can see which system was used and can compare with results from other systems

---

### User Story 3 - System-Specific Account Management (Priority: P2)

As a system administrator, I want to define different chart of accounts for each accounting system so that each system has accounts relevant to its reporting requirements.

**Why this priority**: Different accounting frameworks require different account structures. This enables proper financial vs management reporting differentiation.

**Independent Test**: Can be fully tested by creating accounts specific to one system and verifying they don't appear when another system is selected.

**Acceptance Scenarios**:

1. **Given** the account management page, **When** I create an account "Internal Cost Center" and assign it only to "Management Reporting" system, **Then** this account appears in Management Reporting but not in Financial Reporting
2. **Given** an account assigned to multiple systems, **When** I view the account details, **Then** I can see all systems it belongs to
3. **Given** a shared business event, **When** different systems analyze it, **Then** each system maps the event to its own appropriate accounts

---

### User Story 4 - System-Specific Journal Rules (Priority: P2)

As a business analyst, I want journal rules to be scoped to specific accounting systems so that each system maintains its own set of accounting policies and preferences.

**Why this priority**: Financial and management reporting have different recognition criteria, timing rules, and policy preferences that must be maintained separately.

**Independent Test**: Can be fully tested by creating a journal rule in one system and verifying it doesn't affect or appear in another system.

**Acceptance Scenarios**:

1. **Given** the journal rules page, **When** I create a rule for "Revenue Recognition" in the Financial Reporting system, **Then** the rule is only applied to Financial Reporting analyses
2. **Given** the same business event, **When** Financial Reporting and Management Reporting systems process it, **Then** each system applies its own set of rules, potentially generating different journal entries
3. **Given** a journal rule, **When** I edit its parameters, **Then** the changes only affect future analyses in that specific system

---

### User Story 5 - Cross-System Comparison (Priority: P3)

As a financial controller, I want to compare how the same business event is treated across different accounting systems so that I can understand the differences between financial and management reporting.

**Why this priority**: This provides analytical value by highlighting differences between accounting frameworks, aiding in reconciliation and understanding.

**Independent Test**: Can be fully tested by analyzing the same scenario with multiple systems and viewing a side-by-side comparison of the results.

**Acceptance Scenarios**:

1. **Given** a completed analysis in one system, **When** I choose to compare with another system, **Then** both results are displayed side-by-side with highlighted differences
2. **Given** a comparison view, **When** I examine the journal entries, **Then** differences in accounts, amounts, or timing are visually highlighted
3. **Given** a comparison view, **When** I select a specific difference, **Then** I can see the underlying rule or preference that caused the difference

---

### Edge Cases

- What happens when a system is deleted but has existing analyses? (Analyses remain viewable but system cannot be used for new analyses)
- How does the system handle shared accounts across multiple systems? (Accounts can belong to multiple systems; changes affect all linked systems)
- What happens when switching systems mid-analysis? (Current analysis results are preserved; user can start a new analysis with the new system or view existing results)
- How are default systems protected? (Built-in systems cannot be deleted; only custom systems can be removed)
- What happens when no system is selected? (System defaults to a designated primary system or prompts user to select one)
- How are naming conflicts handled when creating custom systems? (System names must be unique; validation prevents duplicate names)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support multiple accounting systems, with at least two built-in systems: "Financial Reporting" (财报) and "Management Reporting" (管报)
- **FR-002**: Users MUST be able to create custom accounting systems with unique names, descriptions, and system types
- **FR-003**: Each accounting system MUST maintain its own independent set of accounts (会计科目)
- **FR-004**: Each accounting system MUST maintain its own independent set of journal rules (记账规则)
- **FR-005**: Each accounting system MUST maintain its own preferences and configuration (记账偏好)
- **FR-006**: Business scenarios and accounting events MUST be shared across all systems (shared business context)
- **FR-007**: The analysis page MUST prominently display the currently selected accounting system
- **FR-008**: Users MUST be able to switch between accounting systems when viewing or analyzing scenarios
- **FR-009**: When analyzing a scenario, the system MUST use only the accounts and rules associated with the selected accounting system
- **FR-010**: Built-in systems (Financial Reporting, Management Reporting) MUST not be deletable
- **FR-011**: Custom systems without associated analyses MUST be deletable by administrators
- **FR-012**: System MUST provide a side-by-side comparison view showing how the same event is treated differently across systems

### Key Entities *(include if feature involves data)*

- **Accounting System (体系)**: Represents a distinct accounting framework with its own accounts, rules, and preferences. Key attributes: name, description, type (built-in/custom), status (active/archived)
- **Account (会计科目)**: Chart of accounts entry. Key attributes: code, name, type (asset/liability/equity/revenue/expense), associated systems (many-to-many relationship)
- **Journal Rule (记账规则)**: Accounting policy rule defining how events are recorded. Key attributes: name, description, triggering conditions, debit/credit accounts, associated system
- **System Preference (记账偏好)**: Configuration settings specific to an accounting system. Key attributes: recognition criteria, timing rules, policy flags, associated system
- **Business Scenario (业务场景)**: Description of a business situation requiring accounting analysis. Key attributes: description, context, status (shared across all systems)
- **Accounting Event (会计事件)**: Specific event within a scenario. Key attributes: event type, description, amount, timing (shared across all systems)
- **Analysis Result (分析结果)**: The output of analyzing a scenario with a specific system. Key attributes: generated journal entries, applied rules, target system reference

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create a new custom accounting system and configure it for use in under 5 minutes
- **SC-002**: Analysis results correctly reflect the selected accounting system's accounts and rules 100% of the time
- **SC-003**: Users can identify which system is being used for analysis at a glance (visibility indicator present and prominent)
- **SC-004**: Switching between systems takes less than 3 seconds with no data loss
- **SC-005**: System administrators can manage (create, update, delete) custom systems without technical assistance
- **SC-006**: Side-by-side comparison clearly highlights differences between systems with 90%+ user comprehension rate
- **SC-007**: Financial Reporting and Management Reporting systems are pre-configured and ready to use immediately after deployment

## Assumptions

- Users understand the conceptual difference between Financial Reporting and Management Reporting
- Each accounting system will have a manageable number of accounts (hundreds, not millions)
- Business scenarios are shared but can be analyzed independently by different systems
- Users will primarily work within one system at a time, with occasional cross-system comparison needs
- System switching is an intentional user action, not an automatic process

## Scope

### In Scope

- Creating and managing multiple accounting systems
- System-specific account management (assignment and filtering)
- System-specific journal rule management
- System-specific preferences and configuration
- UI indicators showing current system selection
- Cross-system comparison capabilities
- Built-in Financial Reporting and Management Reporting systems

### Out of Scope

- Automatic system selection based on scenario content
- Real-time synchronization of shared data across systems
- Complex reconciliation workflows between systems
- Historical data migration between systems
- Multi-tenant or multi-company support (this is about accounting frameworks, not organizational separation)
