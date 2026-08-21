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

Initial TEST RPCs created:
- lookup UID
- register employee + UID
- register finished product +1 and return 6-digit server number

A TEST mapping exists for the physically tested badge -> TEST ANSATT.
No production stock/order/Nordic data was changed.

## 2026-08-21 — NATIVE UI PHYSICAL TEST + CANONICAL BACKEND

### Native app state
- Native Kotlin/Jetpack Compose app builds successfully.
- Compact one-screen product UI installed and physically viewed on Android phone.
- Product screen direction accepted for continued testing.
- Confirmation display changed to about 8 seconds.
- Current UI still uses `UTEN KORT`; NFC gate is intentionally postponed until product/backend flow passes.

### APK packaging/install issue clarified
- The failed v0.2 Drive file was not a valid raw APK: a GitHub Actions artifact ZIP had been uploaded/renamed as `.apk` instead of extracting `app-debug.apk` first.
- The mislabeled v0.2 Drive APK was deleted.
- For v0.3 the GitHub artifact ZIP was explicitly extracted and the contained `app-debug.apk` was verified as an Android package before Drive upload.

### Signing status
- A temporary TEST signing key was used for the successful v0.3 build.
- That key material was removed from the repository immediately after the build; it must NOT be treated as the permanent production/test signing solution.
- Permanent update-safe signing must later be configured through protected CI secrets or another secure signing store; never commit private signing keys to the repository.
- Until that secure setup is complete, APK updates may require uninstall/reinstall between differently signed test builds.

### Canonical TEST/LIVE rule fixed
Project-wide rule is now documented in:
- `PROJECT_CANONICAL_RULES.md`
- `BAMAVAREMOTTAK_TEST_LIVE_PROTOCOL.md`
- `TEST_LIVE_LEGACY_AUDIT_2026-08-21.md`

Rules:
- process/form/order/workflow -> `mode='test'|'live'`
- concrete tag/product in `mottak_scans` -> `is_test=true|false`
- TEST must not affect LIVE stock/statistics/orders/Nordic WORK.

### Finished-event backend migrated
Old table name:
- `florivo_terminal_test_finished_events`

Canonical shared table now:
- `florivo_terminal_finished_events`

It contains canonical `mode` with allowed values `test/live`.
Current TEST RPC `florivo_terminal_test_register_finished(...)` now writes to the shared table with `mode='test'`.

No LIVE write path is enabled in the Android TEST app.

### Android v0.3 DB TEST
Branch:
- `florivo-android-ui-v01`

Build content:
- INTERNET permission enabled;
- product button calls narrow Supabase TEST RPC;
- server returns global event/display number;
- confirmation overlay shows server number for about 8 seconds;
- footer identifies `TEST v0.3` and server TEST connection;
- publishable Supabase key only; no service-role/admin secret in APK.

GitHub Actions build used for the physical TEST APK:
- run `32455736434`
- workflow `Florivo Android TEST`
- build result: SUCCESS
- artifact: `Florivo-Android-v0.3-db-test`

### Still NOT physically passed
- Native Android -> Supabase product +1 from the real phone is not yet PHYSICAL PASS.
- Server number display on the real phone is not yet PHYSICAL PASS.
- NFC card gate is not yet PHYSICAL PASS in this current app line.
- No LIVE/production promotion.
- No kiosk mode.

### Next physical milestone
`ANDROID PRODUCT EVENT -> mode=test -> SERVER NUMBER — PHYSICAL PASS`

Only after that pass:
1. add/restore native NFC employee gate;
2. test same badge UID repeatedly;
3. map employee and product event;
4. continue TEST until explicit promotion decision.
