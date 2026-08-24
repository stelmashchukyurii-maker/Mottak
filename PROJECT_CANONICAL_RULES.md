# BaMavaremottak — CANONICAL RULES / PROTOCOL GOVERNANCE

Status: ACTIVE
Fixed: 2026-08-21 Europe/Oslo
Updated: 2026-08-24 Europe/Oslo

## Purpose
This file defines which project documents win when multiple protocols, archives, DEV notes, audit snapshots, or old implementation details disagree.

## 1. Precedence order
When there is a conflict, use this order:
1. `PROJECT_CANONICAL_RULES.md` — project-wide governance and precedence.
2. `BAMAVAREMOTTAK_TEST_LIVE_PROTOCOL.md` — canonical TEST/LIVE semantics.
3. `PROTOCOLS.md` — current project index and current-state map.
4. The active feature protocol for the exact subsystem being changed.
5. The feature progress log / NEXT_CHAT handoff.
6. Audit records — factual snapshots of schema/data/dependencies at a specific time; useful evidence, but they do not override a newer canonical rule.
7. Archived protocols and old session snapshots — history only, never authoritative for current behavior.

A newer explicit user decision recorded in a canonical protocol supersedes an older conflicting protocol line.

## 2. Protocol status labels
Every active protocol should use one of these labels near the top:
- `ACTIVE RULE` — current rule that must be followed.
- `ACTIVE DEV` — current development contract; may still be under test.
- `ACTIVE AUDIT RECORD` — factual snapshot/check of current implementation; not a policy override.
- `FROZEN / PHYSICAL PASS` — working behavior; do not change without explicit authorization.
- `CONCEPT` — design only; not implemented or approved for WORK.
- `ARCHIVE / HISTORICAL` — context only; must not override active rules.
- `DEPRECATED` — intentionally superseded; keep only for migration/history.

## 3. TEST / LIVE canonical rule
For whole forms, orders, sessions, or workflows use:
- `mode = 'test'`
- `mode = 'live'`

For a concrete tag/product row in `public.mottak_scans` use:
- `is_test = true`
- `is_test = false`

Do not use these meanings interchangeably.

`environment=test/work` is now a LEGACY implementation pattern. Existing production tables/functions that still physically contain `environment` must NOT be renamed or migrated casually. Any migration from legacy `environment` to canonical `mode` requires a separate audited migration plan and physical regression test so WORK data is not damaged.

Current legacy audit reference:
- `TEST_LIVE_LEGACY_AUDIT_2026-08-21.md`

## 4. Production isolation
TEST data must never affect:
- live warehouse balances;
- live statistics;
- production orders;
- Nordic WORK flows;
- production mutations, dispatch, reservation, or availability calculations.

## 5. No silent protocol drift
Whenever a user decision changes an architecture rule:
1. update the canonical protocol first;
2. update `PROTOCOLS.md` if the project map/status changes;
3. update the affected subsystem protocol;
4. only then change code/database behavior.

Do not leave a new rule only in chat.

## 6. Database reality vs protocol target
Documentation must distinguish:
- **canonical target semantics** — what new code must use;
- **legacy physical schema** — old columns/functions still present in production;
- **audit snapshot** — what was verified at a specific date/time.

Never assume that because the canonical name is `mode`, every existing table has already been migrated. Verify the live schema before writes.

## 7. Start-of-task rule
Before changing an existing subsystem:
1. read `PROJECT_CANONICAL_RULES.md`;
2. read `BAMAVAREMOTTAK_TEST_LIVE_PROTOCOL.md` when TEST/LIVE is relevant;
3. read `PROTOCOLS.md`;
4. read the subsystem protocol + progress log/NEXT_CHAT;
5. read the latest relevant audit record when schema/migration is involved;
6. query live DB state when the task depends on current stock/schema.

This is mandatory specifically to prevent old archived decisions from overriding newer project-wide rules.

## 8. Technical development log maintenance — ACTIVE RULE
The public technical development log is governed by:
`FLORIVO_TECHNICAL_VERSION_LOG_PROTOCOL.md`.

After every significant new version or technical milestone, the change must be evaluated for inclusion in the technical development log.

Rules:
- do not rebuild the entire history from scratch for every update;
- append/update the existing curated history incrementally using current protocols + Git evidence;
- update Norwegian and Ukrainian log content together;
- do not create separate entries for every small commit, cache bust, text correction, color/spacing change, or deployment-only rebuild;
- group nearby versions when they represent the same development direction;
- never mark a version `STABIL` / `PHYSICAL PASS` without explicit evidence;
- visible technical log remains neutral: no old project/company name, no current product/project brand, no calendar dates, no clock times, and no presentation/analytics history.

The stable public entry remains:
`teknisk-versjonslogg.html`.

The same log is linked from both the normal main page and the presentation main page, so one log-content update serves both entry points.
