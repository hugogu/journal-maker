# Backfill Verification Queries (T016)

Run these queries after migration to verify backfill completeness.

## 1. Check all journal_rules with event_name have event_id

```sql
SELECT COUNT(*) AS orphaned_rules
FROM journal_rules
WHERE event_name IS NOT NULL
  AND event_id IS NULL;
```

Expected: `0` orphaned rules.

## 2. Check all analysis_entries with event_name have event_id

```sql
SELECT COUNT(*) AS orphaned_entries
FROM analysis_entries
WHERE event_name IS NOT NULL
  AND event_id IS NULL;
```

Expected: `0` orphaned entries.

## 3. Verify accounting_events were created for each unique event_name per scenario

```sql
SELECT jr.scenario_id, jr.event_name, ae.id AS event_id
FROM (
  SELECT DISTINCT scenario_id, LOWER(event_name) AS event_name
  FROM journal_rules
  WHERE event_name IS NOT NULL
  UNION
  SELECT DISTINCT scenario_id, LOWER(event_name) AS event_name
  FROM analysis_entries
  WHERE event_name IS NOT NULL
) jr
LEFT JOIN accounting_events ae
  ON ae.scenario_id = jr.scenario_id
  AND LOWER(ae.event_name) = jr.event_name
WHERE ae.id IS NULL;
```

Expected: `0` rows (no unmatched event names).
