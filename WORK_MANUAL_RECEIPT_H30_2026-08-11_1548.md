# WORK manual receipt — Hyller x30 — 11.08.2026 15:48 Europe/Oslo

User requested manual WORK receipt of 3 × `hyller30` with sequential lower numbers.

Inserted into `public.mottak_scans`:
- product: `hyller30`
- lower_number: `000012`
- lower_number: `000013`
- lower_number: `000014`
- `scanner_code=''` for all three because no RFID EPC was read; no fake EPC was created
- `status='verified'`
- `stock_status='in_stock'`
- `source='manual'`
- `environment='work'`
- `device_id='chatgpt_manual'`

Verification immediately after insert:
- `bama_stock_summary()` for `hyller30`: physical_count = 3, available_count = 3, on_ramp_count = 0, order_remaining = 0.

Note: the user was simultaneously receiving other new WORK stock with Nordic, so global WORK stock counts are live/changing. Query current DB before quoting totals.
