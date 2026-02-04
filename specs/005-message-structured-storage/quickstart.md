# Quickstart: 消息与结构化产出分离存储

## Goal
Validate that conversation messages store structured payloads, analysis artifacts are extracted, and journal rules accept structured debit/credit definitions.

## Prerequisites
- Database migrated to include new columns and artifact tables
- App running from `apps/accountflow`

## Smoke Test Checklist

1) **Create a message with structured payload**
- Call `POST /api/scenarios/{scenarioId}/conversation-messages` with `content` and `structuredData/requestLog/responseStats`.
- Verify `GET /api/scenarios/{scenarioId}/conversation-messages?includeStructured=true` returns those fields.

2) **Extract analysis artifacts**
- Call `POST /api/scenarios/{scenarioId}/analysis-artifacts` with `subjects`, `entries`, and `diagrams` tied to `sourceMessageId`.
- Verify `GET /api/scenarios/{scenarioId}/analysis-artifacts` returns the stored artifacts.

3) **Update journal rule with structured sides**
- Call `PATCH /api/journal-rules/{ruleId}` with `debitSide`, `creditSide`, `triggerType`, `status`, and optional `amountFormula`.
- Verify returned rule preserves `amountFormula` but execution rules use structured sides.

## Expected Outcomes
- Messages persist both text and structured payload.
- Artifacts can be queried by scenario and message.
- Journal rules accept structured definitions and enforce status validation.
