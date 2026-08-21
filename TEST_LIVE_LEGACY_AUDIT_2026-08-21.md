# BaMavaremottak — TEST/LIVE LEGACY AUDIT

Status: ACTIVE AUDIT RECORD
Audited: 2026-08-21 Europe/Oslo

## Scope
Read-only audit of the current Supabase TEST/LIVE separation before further migration work.

Canonical rule remains:
- process/form/order/workflow -> `mode = 'test' | 'live'`
- concrete tag/product row in `public.mottak_scans` -> `is_test = true | false`
- TEST must never affect LIVE stock/statistics/orders/Nordic WORK.

## 1. Current canonical implementation already present
`public.florivo_terminal_finished_events`
- has `mode`
- allowed values constrained to `test` / `live`
- Android TEST registration RPC writes `mode='test'`
- table is the shared future event table for Florivo Terminal finished-product events.

## 2. Legacy `environment=test/work` still physically exists
These production-era tables still contain `environment` and must NOT be renamed casually:
- `mottak_quantity_stock`
- `mottak_quantity_stock_events`
- `mottak_scans`
- `mottak_stock_events`
- `ut_extra_confirmations`
- `ut_order_items`
- `ut_order_scans`
- `ut_orders`
- `florivo_terminal_test_log` (diagnostic legacy table)

Current row counts by legacy environment at audit time:
- `mottak_scans`: 55 test / 253 work
- `mottak_quantity_stock`: 1 test / 2 work
- `mottak_quantity_stock_events`: 0 test / 3 work
- `mottak_stock_events`: 0 test / 150 work
- `ut_orders`: 12 test / 44 work
- `ut_order_items`: 35 test / 85 work
- `ut_order_scans`: 31 test / 249 work
- `ut_extra_confirmations`: 12 test / 16 work
- `florivo_terminal_test_log`: 10 test

These are audit snapshots only, not stock truth. Current stock must still be queried live through the canonical stock RPC.

## 3. `mottak_scans` consistency check
At audit time:
- all 55 `environment='test'` rows also had `is_test=true`
- all 253 `environment='work'` rows had `is_test=false`
- no contradictory combinations were found.

This table therefore already matches the new tag-level semantic rule, even though the legacy `environment` column is still physically present.

## 4. `ut_orders` legacy semantic warning
`ut_orders` currently contains both `environment` and `is_test`.

Audit found:
- 12 rows: `environment='test'` + `is_test=true`
- 44 rows: `environment='work'` + `is_test=true`

Therefore `ut_orders.is_test` is NOT safe to interpret as the new canonical process-mode flag. It is legacy data/semantics and must not be mass-corrected or used for new TEST/LIVE decisions without a dedicated migration analysis.

For new process-level architecture use `mode`; existing UT WORK logic remains frozen on its current `environment` implementation until separately migrated and regression-tested.

## 5. Function dependency audit
Many current WORK/UT/stock functions still explicitly use legacy `environment`. Examples include:
- `bama_stock_summary`
- `bama_order_product_progress`
- `bama_request_environment`
- `bama_set_order_child_environment`
- `bama_set_root_environment`
- `register_and_reserve_ut_scan`
- `register_ut_scan_only`
- `reserve_ut_scan*`
- `stage_ut_order`
- `confirm_ut_dispatch`
- `save_ut_order_with_items`
- `receive_mottak_quantity_stock`
- stock/admin validation helpers.

Conclusion: `environment` is not only a column-name issue; it is embedded in the current frozen WORK behavior. A blind rename would be high risk.

## 6. Migration policy
Do NOT perform a global `environment -> mode` rename.

Migration must be subsystem-by-subsystem:
1. identify table + functions + triggers + views + UI using `environment`;
2. document current PHYSICAL PASS behavior;
3. add canonical `mode` compatibility without changing WORK result;
4. test TEST isolation;
5. regression-test LIVE/WORK physically;
6. only then deprecate/remove legacy `environment` for that subsystem.

Until that happens, legacy `environment` remains valid only inside already-existing frozen code paths.

## 7. New-code rule
From 2026-08-21 forward:
- do not introduce new `environment` columns for new process-level features;
- use `mode='test'|'live'` for new form/order/workflow/process records;
- use `mottak_scans.is_test` only for concrete tags/products;
- old tables with `environment` are compatibility islands, not a template for new code.

## 8. Safety outcome
No production rows were modified by this audit.
No legacy `environment` column was renamed or dropped.
No frozen Nordic/UT WORK function was rewritten.

The audit exists to prevent protocol/schema drift while allowing gradual, tested migration.