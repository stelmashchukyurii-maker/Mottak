# WORK stock baseline reset — 11.08.2026

**Project:** BaMavaremottak / AI Scanner Mottak  
**Time:** 11.08.2026 ~14:47 Europe/Oslo  
**Environment:** WORK only

## User decision
User confirmed that all goods currently shown as WORK warehouse stock had already been physically shipped manually. The database therefore needed to reflect reality before starting new stock intake with Nordic ID.

## Pre-change WORK state
`bama_stock_summary()` before correction:
- Bunner: 14
- Hyller x30: 7
- Hyller x60: 14
- Forlengere korte: 0
- Forlengere lange: 0
- Forlengere plast: 0
- Vrak bunner: 0
- Vrak hyller: 0
- Active WORK orders: 0
- WORK quantity ledger: Forlengere plast = 0; no other WORK manual overlay.

Total WORK RFID units moved: **35**.

## Operation performed
All WORK rows matching:
- `environment='work'`
- `status='verified'`
- `stock_status='in_stock'`

were changed to:
- `stock_status='dispatched'`
- `dispatched_at=now()`
- `updated_at=now()`

For every moved row, an audit event was written to `public.mottak_stock_events`:
- `action='mark_dispatched'`
- `from_status='in_stock'`
- `to_status='dispatched'`
- `created_by='chatgpt_admin_bulk_2026-08-11'`
- note: physical manual shipment had already happened and DB status was being corrected to reality.

## Verification
- Exact audit rows with batch marker: **35**.
- `bama_stock_summary()` after correction returns for all 8 products:
  - `physical_count=0`
  - `on_ramp_count=0`
  - `order_remaining=0`
  - `available_count=0`
- TEST environment was not modified.

## New WORK baseline
**WORK warehouse is intentionally empty (0 across all 8 products).**

This is the new baseline for real receiving. New incoming goods should be registered from this point using **Nordic ID – Til lager** (or Camera fallback when RFID cannot be read).

## Deferred work
`Lager Admin` remains DEV / TEST-only and is postponed by user decision. Do not use it for WORK manual corrections until user explicitly resumes that task.
