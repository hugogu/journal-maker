# API Contracts: Accounting Events

**Feature**: 006-accounting-event-entity
**Date**: 2026-02-06

All endpoints follow existing Nuxt API route conventions. Base path: `/api/scenarios/:scenarioId/events`

---

## GET /api/scenarios/:scenarioId/events

**Description**: List all accounting events for a scenario with linked artifact counts.

**Path Parameters**:
- `scenarioId` (integer, required)

**Response** `200 OK`:
```json
{
  "events": [
    {
      "id": 1,
      "scenarioId": 42,
      "eventName": "Payment Received",
      "description": "Customer payment credited to bank account",
      "eventType": "revenue",
      "isConfirmed": true,
      "ruleCount": 3,
      "entryCount": 2,
      "createdAt": "2026-02-06T10:00:00.000Z",
      "updatedAt": "2026-02-06T10:00:00.000Z"
    }
  ]
}
```

**Response** `404`: Scenario not found.

---

## PUT /api/scenarios/:scenarioId/events/:eventId

**Description**: Update an event's name, description, or type.

**Path Parameters**:
- `scenarioId` (integer, required)
- `eventId` (integer, required)

**Request Body**:
```json
{
  "eventName": "Payment Received (Updated)",
  "description": "Updated description",
  "eventType": "revenue"
}
```
All fields optional. At least one must be provided.

**Response** `200 OK`:
```json
{
  "id": 1,
  "scenarioId": 42,
  "eventName": "Payment Received (Updated)",
  "description": "Updated description",
  "eventType": "revenue",
  "isConfirmed": true,
  "createdAt": "2026-02-06T10:00:00.000Z",
  "updatedAt": "2026-02-06T11:00:00.000Z"
}
```

**Response** `404`: Event not found or doesn't belong to scenario.
**Response** `409`: Event name conflicts with an existing event in the same scenario.

---

## POST /api/scenarios/:scenarioId/events/merge

**Description**: Merge source event into target event. Reassigns all linked rules and entries from source to target, then deletes the source event.

**Request Body**:
```json
{
  "sourceEventId": 2,
  "targetEventId": 1
}
```

**Response** `200 OK`:
```json
{
  "targetEvent": {
    "id": 1,
    "eventName": "Payment Received",
    "ruleCount": 5,
    "entryCount": 4
  },
  "reassigned": {
    "rules": 2,
    "entries": 1
  }
}
```

**Response** `404`: Source or target event not found.
**Response** `400`: Source and target are the same event, or events belong to different scenarios.

---

## Modified: POST /api/scenarios/:scenarioId/analysis-artifacts

**Change**: The existing endpoint is modified to create/link accounting events during the analysis save flow.

**Behavior change**:
1. For each rule/entry with an `event` field, find-or-create an `accounting_events` record.
2. Set `event_id` on the rule/entry before insertion.
3. No changes to request/response schema — event linking is transparent to the caller.

---

## Modified: GET /api/scenarios/:scenarioId/journal-rules

**Change**: Response now includes `eventId` and `event` object for each rule.

**Updated response shape** (per rule):
```json
{
  "id": 1,
  "ruleKey": "payment-received",
  "eventName": "Payment Received",
  "eventId": 5,
  "event": {
    "id": 5,
    "eventName": "Payment Received",
    "description": "Customer payment credited",
    "eventType": "revenue"
  },
  "...existing fields..."
}
```

The `event` field is `null` if the rule has no linked event.
