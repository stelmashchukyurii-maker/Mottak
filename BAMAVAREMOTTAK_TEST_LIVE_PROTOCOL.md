# BaMavaremottak — TEST / LIVE MODE PROTOCOL

Status: ACTIVE RULE
Fixed: 2026-08-21 Europe/Oslo

## Purpose
This rule is project-wide and must be used consistently to distinguish test data from live/production data.

## 1. Whole form / order / workflow
For switching an entire form, order, or working process between test and live operation, use the column:

`mode`

Allowed values:
- `mode = 'test'` — test mode
- `mode = 'live'` — live/working mode

Use `mode` for the state of the whole form, order, workflow, terminal process, or equivalent process-level record.

## 2. Individual tags / products in mottak_scans
For a specific tag/product record in `public.mottak_scans`, use the separate column:

`is_test`

Allowed values:
- `is_test = true` — test tag/product
- `is_test = false` — real/live tag/product

## 3. Do not mix the meanings
- form / order / workflow / process -> `mode = 'test' | 'live'`
- specific tag / product in `mottak_scans` -> `is_test = true | false`

`mode` and `is_test` are not interchangeable.

## 4. Production isolation rule
Test data must never affect:
- real stock balances;
- production statistics;
- production orders;
- Nordic WORK flows;
- other live/production calculations or mutations.

All queries, RPCs, reports, counters, stock calculations, and production mutations must explicitly respect the TEST/LIVE distinction.

## 5. Default safety rule
During development or physical testing, the safe default is TEST:
- process-level records -> `mode = 'test'`
- test tag/product rows in `mottak_scans` -> `is_test = true`

Switch to LIVE only after the relevant physical/functional PASS is explicitly confirmed.
