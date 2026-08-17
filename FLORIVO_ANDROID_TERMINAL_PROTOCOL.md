# FLORIVO ANDROID TERMINAL PROTOCOL

Status: TEST preparation
Prepared: 2026-08-17 Europe/Oslo

## Goal
Native Android warehouse terminal for finished-product registration on one shared warehouse phone.

Core flow:
1. Waiting screen: `Legg kortet mot telefonen`.
2. Native NFC reads the card UID using Android NFC reader mode. Do not depend on Web NFC/NDEF.
3. Server maps UID to employee. Badge UID is an identifier, not a password/security credential.
4. Show employee name + product screen.
5. Worker presses one product once.
6. Server creates immutable +1 TEST event and returns a global human-readable running number.
7. Show confirmation/number for about 3 seconds.
8. Return to full waiting-for-next-card screen. No persistent worker session.
9. `UTEN KORT` remains a fallback path.

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

Current browser prototype visual direction:
- yellow 3D product buttons
- dark/olive background
- red 3D VRAK/AVVIK buttons
- NO / UK language switch during TEST
- large touch targets for standing warehouse use

Browser prototype source:
- `florivo-terminal-products-test.html`

## Native NFC
Use Android `NfcAdapter.enableReaderMode` in the foreground.
Recommended first TEST flags:
- `FLAG_READER_NFC_A`
- `FLAG_READER_SKIP_NDEF_CHECK`
- optional `FLAG_READER_NO_PLATFORM_SOUNDS`

Read UID from `Tag.id` / `Tag.getId()` and tech list from `Tag.techList`.
Known physical badge test showed stable UID across repeated reads and technologies including NfcA/IsoDep. Exact UID should not be displayed in normal worker-facing UI after commissioning.

## TEST backend prepared 2026-08-17
Supabase project: BaMavaremottak.

Separate TEST tables only:
- `public.florivo_terminal_test_employees`
- `public.florivo_terminal_test_employee_nfc`
- `public.florivo_terminal_test_finished_events`
- existing diagnostics: `public.florivo_terminal_test_log`

Narrow TEST RPCs:
- `florivo_terminal_test_lookup_uid(p_uid text)`
- `florivo_terminal_test_register_employee(p_first_name text, p_last_name text, p_uid text)`
- `florivo_terminal_test_register_finished(p_uid text, p_product_key text, p_device_id text, p_employee_name text)`

`register_finished` returns:
- event_id
- display_number, zero-padded to 6 digits
- employee_name

A TEST employee mapping for the physically tested badge is seeded for tomorrow's native UID test. No production employee data is created.

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

Android terminal remains TEST until physical PASS is explicitly confirmed.

## Security
- Never put service-role/admin secrets in APK.
- Publishable/anon access may be used only against intentionally exposed narrow TEST RPCs during prototype phase.
- Before WORK: add proper terminal enrollment/device token or authenticated backend/Edge Function and remove broad prototype access.
- Corporate badge UID is identification metadata only, not authorization proof.

## Kiosk
Do not implement kiosk before NFC + server + product UX physical PASS.
Final kiosk direction: Android dedicated-device / Lock Task Mode, not merely fullscreen.

## Tomorrow first milestone
`ANDROID NFC UID READ — PHYSICAL PASS`

Success criteria:
- install/open native TEST app on warehouse Android phone;
- page is waiting for badge;
- tap same corporate badge repeatedly;
- app gets the same UID each time using native Android NFC;
- no browser/Web NFC dependency;
- app can look up TEST ANSATT from server;
- no WORK data changes.
