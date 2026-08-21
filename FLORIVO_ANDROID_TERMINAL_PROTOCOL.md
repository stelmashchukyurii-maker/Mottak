# FLORIVO ANDROID TERMINAL PROTOCOL

Status: ACTIVE DEV — CONTROLLED LIVE STOCK TRIAL
Prepared: 2026-08-17 Europe/Oslo
Updated: 2026-08-21 Europe/Oslo

## Goal
Native Android warehouse terminal for finished-product registration on one shared warehouse phone.

## Project-wide rules
Read first:
- `PROJECT_CANONICAL_RULES.md`
- `BAMAVAREMOTTAK_TEST_LIVE_PROTOCOL.md`
- `FLORIVO_NUMBER_PROTOCOL.md`

TEST/LIVE:
- whole form/order/process -> `mode='test'|'live'`
- concrete item/tag in `mottak_scans` -> `is_test=true|false`

Item identity:
- `florivo_number` is the permanent internal Florivo sequence number;
- `scanner_code` is the real long RFID/EPC when known;
- `lower_number` remains only the last 6 characters of real RFID/EPC;
- never store Florivo number in `lower_number`.

## Current controlled LIVE stock trial — 21.08.2026
User explicitly authorized clearing the obsolete WORK physical baseline because all previously recorded warehouse/ramp goods had already physically left, then using the Android terminal to put new finished product on the real stock ledger.

This is a limited LIVE stock trial, not a full production/kiosk/NFC promotion.

LIVE baseline reset was performed without deleting history:
- all active WORK orders were cancelled through the existing cancellation logic;
- active `mottak_scans` rows were audit-marked dispatched;
- WORK quantity stock was audit-adjusted to zero;
- pre-reset state was saved in `public.bama_reset_audit` under reset key `2026-08-21-live-baseline-reset`.

Post-reset canonical `bama_stock_summary()` = zero for all product groups, zero ramp demand and zero active order demand.

## Android LIVE intake
Current v0.4 design:
1. Worker presses a product button.
2. Android calls `florivo_terminal_register_stock(...)` with `p_mode='live'`.
3. Server allocates permanent `florivo_number` from `florivo_number_seq`.
4. For tagged product types, server creates a verified `mottak_scans` row with:
   - `environment='work'` legacy compatibility;
   - `is_test=false`;
   - `stock_status='in_stock'`;
   - `scanner_code=''` and `lower_number=''` until RFID is later bound;
   - `registration_method='android_button'`.
5. Shared finished-event audit is also written to `florivo_terminal_finished_events` with `mode='live'`.
6. Android displays `F-000001` style confirmation for about 8 seconds.

`forlengere_plast` remains quantity-only and does not create a fake RFID row. Its +1 is written to the quantity ledger and still receives a Florivo display number from the shared sequence/event flow.

## Later RFID binding
Prepared RPC:
`florivo_terminal_bind_rfid_fifo(p_mode, p_product_key, p_scanner_code)`.

It binds a validated 24-HEX EPC to the oldest unbound Florivo row of the same product and same TEST/LIVE environment. It writes full EPC to `scanner_code`, its final 6 chars to `lower_number`, and never changes `florivo_number`.

## Accepted product UX
Main products:
- bunner
- hyller30
- hyller60
- forlengere_korte
- forlengere_lange
- forlengere_plast

VRAK / AVVIK:
- vrak_bunner
- vrak_hyller
- bunner_uten_brikk

`bunner_uten_brikk` is not stock-mutating in Android v0.4 yet; it remains an AVVIK path to finish separately.

## Native NFC
NFC employee gate is still postponed until the product -> stock -> server-number path has physical PASS.
Future native reader mode remains:
- `NfcAdapter.enableReaderMode`
- NFC-A
- skip NDEF check

## Security
- No service-role/admin secret in APK.
- Current LIVE trial uses a narrow publishable-key RPC and is temporary development exposure.
- Before operational LIVE use, replace this with terminal enrollment/device authorization or an authenticated Edge Function/backend gate.
- Corporate badge UID is identification metadata only, not authorization proof.

## Frozen production isolation
This Android trial does not authorize arbitrary changes to frozen Nordic WORK forms/logic.
Do not modify:
- Nordic TIL LAGER frozen operator behavior;
- Nordic TIL RAMPE V2.9.7 frozen behavior;
- unrelated UT Kontor production logic.

## Next physical PASS
`ANDROID LIVE STOCK + FLORIVO NUMBER — PHYSICAL PASS`

Success:
- install v0.4 on real phone;
- press one normal product once;
- Android displays F-number;
- `bama_stock_summary()` increases by exactly +1 for that product;
- `mottak_scans` row has same `florivo_number`, `registration_method='android_button'`, no invented RFID;
- no unrelated product/order/ramp mutation.
