# FLORIVO ANDROID TERMINAL — PROGRESS LOG

## 2026-08-17 — PREP FOR NATIVE APP

### Physical facts already confirmed
- Corporate badge repeatedly reads the same UID in native Android NFC Tools.
- Badge technologies include NFC-A / IsoDep and is a MIFARE Plus card.
- Web prototype can detect a tag interaction but Web NFC cannot read the badge as required; browser route is not the final NFC implementation.

### Browser UX prepared
- `florivo-terminal-web-test.html`: Web NFC diagnostics + server TEST log.
- `florivo-terminal-products-test.html`: initial product UX.
- Main products: BUNNER, HYLLER x30, HYLLER x60, FORLENGERE KORTE, FORLENGERE LANGE, FORLENGERE PLAST.
- Separate red VRAK/AVVIK: VRAK BUNNER, VRAK HYLLER, BUNNER UTEN BRIKK.

### Initial TEST server prepared
Prototype identity/diagnostic tables:
- `florivo_terminal_test_employees`
- `florivo_terminal_test_employee_nfc`
- `florivo_terminal_test_log`

Initial TEST RPCs created for UID/employee and finished-product TEST events.

## 2026-08-21 — NATIVE UI + CANONICAL TEST/LIVE

### Native app
- Kotlin/Jetpack Compose app builds and was physically viewed on Android phone.
- Compact one-screen direction accepted.
- Confirmation duration = about 8 seconds.
- NFC employee gate intentionally postponed until stock registration path passes.

### APK packaging/signing findings
- Failed v0.2 Drive file was a GitHub artifact ZIP incorrectly named `.apk`.
- v0.3 used the extracted real `app-debug.apk`.
- A temporary signing key used around v0.3 was removed from the repository; secure permanent CI signing is still pending.
- Until secure signing is configured, some test APK changes may require uninstall/reinstall.

### Canonical governance
Active rules:
- `PROJECT_CANONICAL_RULES.md`
- `BAMAVAREMOTTAK_TEST_LIVE_PROTOCOL.md`
- `TEST_LIVE_LEGACY_AUDIT_2026-08-21.md`
- `FLORIVO_NUMBER_PROTOCOL.md`

Canonical semantics:
- process/form/order/workflow -> `mode='test'|'live'`
- concrete `mottak_scans` item -> `is_test=true|false`
- `florivo_number` = permanent internal sequence
- `scanner_code` = long physical RFID/EPC
- `lower_number` = final 6 chars of physical EPC only

## 2026-08-21 — CONTROLLED LIVE STOCK BASELINE + v0.4

### User decision
User confirmed all previously recorded goods shown on WORK warehouse/ramp had physically left long ago and authorized clearing the obsolete current WORK baseline, preserving history, then trying Android as a real stock intake path.

### LIVE baseline reset completed
Reset key:
- `2026-08-21-live-baseline-reset`

Audit table:
- `public.bama_reset_audit`

Method:
- snapshot saved before mutation;
- all active WORK orders cancelled through existing `cancel_ut_order(...)` logic;
- all remaining verified WORK `in_stock/staged` RFID rows received stock audit events and were changed to `dispatched`;
- WORK quantity stock was audit-adjusted to zero;
- no historical tag/EPC rows were deleted.

Verified after reset:
- `bama_stock_summary()` returns physical_count=0 for every product;
- on_ramp_count=0 for every product;
- order_remaining=0 for every product.

### Florivo number schema implemented
`public.mottak_scans` now includes:
- `florivo_number bigint`
- `registration_method text`

Old tag fields remain unchanged.
Rows with a Florivo number are allowed to exist before RFID is bound.
The WORK unique-tag index was adjusted so multiple new rows with empty RFID fields are valid; real non-empty RFID uniqueness remains protected.

### New LIVE stock RPC
`florivo_terminal_register_stock(p_mode,p_product_key,p_device_id,p_employee_name)`

For tagged products and `p_mode='live'`:
- creates verified WORK `mottak_scans` row;
- `is_test=false`;
- `stock_status='in_stock'`;
- allocates `florivo_number`;
- `registration_method='android_button'`;
- no fake RFID is generated;
- shared finished-event audit records `mode='live'`.

For `forlengere_plast`:
- keeps quantity-only architecture;
- adds +1 to quantity stock/events;
- still receives a Florivo display number;
- no fake `mottak_scans` RFID row.

### Prepared later RFID FIFO binding
RPC:
- `florivo_terminal_bind_rfid_fifo(p_mode,p_product_key,p_scanner_code)`

Rule:
- validates 24-HEX EPC;
- binds only to oldest unbound row of same product/environment;
- writes full EPC to `scanner_code`;
- writes final 6 to `lower_number`;
- never changes `florivo_number`.

### Android v0.4 LIVE STOCK
Branch:
- `florivo-android-ui-v01`

Version:
- versionCode 4
- versionName `0.4-live-stock`

Behavior:
- clearly shows LIVE state;
- normal product button calls `florivo_terminal_register_stock` with `mode='live'`;
- success shows `F-000001` style number for about 8 seconds;
- app states RFID is not yet bound;
- `bunner_uten_brikk` is intentionally not stock-mutating in v0.4.

### Next physical PASS
`ANDROID LIVE STOCK + FLORIVO NUMBER — PHYSICAL PASS`

Test exactly one normal product first and verify:
1. phone shows F-number;
2. stock summary +1 only for that product;
3. new row has same Florivo number, no invented RFID, `registration_method='android_button'`;
4. no unrelated stock/order/ramp mutation.
