# FLORIVO ANDROID TERMINAL PROTOCOL

Status: ACTIVE DEV
Prepared: 2026-08-17 Europe/Oslo
Updated: 2026-08-21 Europe/Oslo

## Goal
Native Android warehouse terminal for finished-product registration on one shared warehouse phone.

Core flow:
1. Waiting screen: `Legg kortet mot telefonen`.
2. Native NFC reads the card UID using Android NFC reader mode. Do not depend on Web NFC/NDEF.
3. Server maps UID to employee. Badge UID is an identifier, not a password/security credential.
4. Show employee name + product screen.
5. Worker presses one product once.
6. Server creates immutable +1 event and returns a global human-readable running number.
7. Show confirmation/number for about 8 seconds during current UI TEST.
8. Return to full waiting-for-next-card screen. No persistent worker session.
9. `UTEN KORT` remains a fallback path.

## Project-wide TEST / LIVE rule — ACTIVE
Canonical rule: `BAMAVAREMOTTAK_TEST_LIVE_PROTOCOL.md`.

For a whole form, order, workflow, terminal process, or equivalent process-level record use:
- `mode = 'test'` — test mode
- `mode = 'live'` — live/working mode

For a specific tag/product record in `public.mottak_scans` use:
- `is_test = true` — test tag/product
- `is_test = false` — real/live tag/product

Do not mix the meanings:
- form / order / process -> `mode`
- specific tag / product in `mottak_scans` -> `is_test`

Test data must not affect real stock balances, production statistics, production orders, Nordic WORK flows, or other live production calculations/mutations.

## Current finished-event backend
Canonical table for Florivo Terminal finished-product events:
- `public.florivo_terminal_finished_events`

The table is shared for future TEST/LIVE use and contains:
- `mode = 'test' | 'live'`
- immutable `qty = +1` normal event or compensating `qty = -1` correction
- product key
- employee metadata when available
- device/source/detail metadata
- server-generated human-readable running number derived from event id.

Current Android TEST RPC:
- `florivo_terminal_test_register_finished(...)`

Despite its legacy TEST name, the RPC now writes to the canonical shared table with `mode='test'`. It must not write LIVE during this phase.

## Accepted product UX
Main products:
- bunner
- hyller30
- hyller60
- forlengere_korte
- forlengere_lange
- forlengere_plast

Separate VRAK / AVVIK screen:
- vrak_bunner
- vrak_hyller
- bunner_uten_brikk

Current browser prototype source:
- `florivo-terminal-products-test.html`

Current native TEST UI direction:
- compact single-screen terminal layout;
- green product buttons;
- red VRAK/AVVIK;
- no scroll on target terminal screen;
- TEST marker visible;
- sequential confirmation number visible about 8 seconds.

## Native NFC
Use Android `NfcAdapter.enableReaderMode` in the foreground.
Recommended first TEST flags:
- `FLAG_READER_NFC_A`
- `FLAG_READER_SKIP_NDEF_CHECK`
- optional `FLAG_READER_NO_PLATFORM_SOUNDS`

Read UID from `Tag.id` / `Tag.getId()` and tech list from `Tag.techList`.
Known physical badge test showed stable UID across repeated reads and technologies including NfcA/IsoDep. Exact UID should not be displayed in normal worker-facing UI after commissioning.

## Legacy prototype infrastructure
The following were created during initial prototype preparation and are now legacy support/identity/diagnostic infrastructure:
- `public.florivo_terminal_test_employees`
- `public.florivo_terminal_test_employee_nfc`
- `public.florivo_terminal_test_log`

The old finished-events table name `public.florivo_terminal_test_finished_events` has been migrated to the canonical shared name `public.florivo_terminal_finished_events`.

Legacy-named RPCs may remain temporarily for compatibility, but new architecture decisions must follow canonical `mode=test/live` semantics.

## Event rules
- Finished production event is immutable +1.
- Do not reuse Lager Admin adjustment source/action.
- Later correction must be a compensating -1 linked to original event, not deletion.
- Employee may be unknown/null when `UTEN KORT` is used.
- Mandatory final facts: product, qty, time, device/location; employee metadata optional.
- Current TEST device id: `android-terminal-test-01`.

## Production isolation
Do NOT touch or reuse these frozen flows while developing Android terminal:
- Nordic TIL LAGER WORK
- Nordic TIL RAMPE WORK / V2.9.7 logic
- UT Kontor production order flow
- production stock ledger mutation functions

Android terminal remains `mode = 'test'` until physical PASS is explicitly confirmed.

## Security
- Never put service-role/admin secrets in APK.
- Publishable access may be used only against intentionally exposed narrow prototype endpoints during TEST.
- Before LIVE: add proper terminal enrollment/device token or authenticated backend/Edge Function and remove broad prototype access.
- Corporate badge UID is identification metadata only, not authorization proof.

## Kiosk
Do not implement kiosk before NFC + server + product UX physical PASS.
Final kiosk direction: Android dedicated-device / Lock Task Mode, not merely fullscreen.

## Next physical milestones
1. Android product event -> backend in `mode = 'test'` -> server running number -> confirmation visible about 8 seconds.
2. Native NFC UID READ — PHYSICAL PASS.
3. Only after explicit PASS may the relevant process be switched to `mode = 'live'`.
