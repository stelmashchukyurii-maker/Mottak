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

## 2026-08-21 — LIVE BASELINE / F-NUMBER
- Obsolete WORK physical baseline was audit-reset with history preserved.
- `florivo_number` and `registration_method` added to `mottak_scans`.
- LIVE Android stock registration RPC created.
- FIFO later RFID binding prepared.
- Android v0.4 physically registered real stock/F-number successfully.

## 2026-08-21 — NFC USER ACCESS PASS
- Native v0.6 physically read an NFC access card.
- Unknown-card path reached server correctly.
- Web user administration page `florivo-terminal-users.html` created and linked from UT Kontor via `BRUKERE / TILGANGER`.
- User creation + role + pending card-link flow implemented server-side.
- Card UID is never shown in admin UI.
- Android sends SHA-256 card identifier, not displayed raw UID.
- Existing v0.6 was made compatible with pending card-link by server-side `florivo_terminal_resolve_nfc` integration.
- Physical PASS: admin user card was linked; terminal displayed user name, `admin`, `KORT GODKJENT`; web displayed `KORT TILKOBLET`.
- User/card mapping is server-side and therefore survives reinstall / another terminal using same backend.

## 2026-08-21 — ROLES + QUANTITY + SHORT SESSION
Accepted role behavior:
- `lager`: no manual quantity, each product action = +1.
- `produksjon`: manual quantity allowed.
- `admin`: manual quantity allowed.
- `test`: isolated test role reserved.

Android v0.7 introduced `ANTALL` 1..500 for produksjon/admin and a server-enforced role check.
Bulk normal-product registration creates actual stock units/F-numbers; quantity-only plastic extenders stay on the quantity ledger.

Server fixes after physical test:
- allow `registration_method='android_bulk'` in `mottak_scans`;
- allow finished-event qty non-zero -500..500;
- fix visible quantity field colors so entered digits are readable.

Session policy accepted:
- successful result visible 8 seconds;
- 4-second grace after result, then logout if no next product action;
- user who logs in and does nothing is logged out after 12 seconds;
- interaction resets inactivity;
- `BYTT` remains immediate logout.

## 2026-08-21 — v0.7.1 STABLE TEST BASELINE
User accepted latest Android build as normal stable baseline for ongoing testing.

Canonical stable reference:
- branch `florivo-v07-role-quantity-autologout`
- commit `9ed66f1bce18e90957e8d8c4eff3ad1911c3f14d`
- workflow run `32525627283`
- APK `Florivo-Android-v0.7.1.apk`
- Drive id `197aIDwnhH3ypp2_J4aC41BdwiVLEBPN_`
- protocol `FLORIVO_ANDROID_V071_STABLE_2026-08-21.md`

Rule: do not edit stable v0.7.1 in place. New features go to a later version/branch; preserve v0.7.1 for rollback/testing comparison.

## 2026-08-24 — v0.8.0 PREPARED / BUILD COMPLETE
Accepted UX changes for the next Android version:
- after a successful stock registration, show Florivo number to the worker without `F-` prefix and without leading zeros, e.g. `93` instead of `F-000093`;
- each logged-in user sees only their own last three registrations for the current Oslo day;
- compact format example: `18:23 · VRAK BUNNER · +1 · 93`;
- bulk registration example uses a plain number range, e.g. `63–92`;
- history is server-backed, not local-phone-only, and refreshes after a successful registration.

Completed technical work:
- new branch: `florivo-v08-last3-plain-number`;
- Android version bumped to `v0.8.0` / versionCode 8;
- new read-only server RPC `florivo_terminal_last3_today` added and verified against real current-day data;
- GitHub Actions workflow for v0.8.0 corrected and build completed successfully;
- successful workflow run: `32754428199`;
- artifact: `Florivo-Android-v0.8.0`;
- APK uploaded to Google Drive folder `Florivo Android App` as `Florivo-Android-v0.8.0.apk`;
- Drive file id: `1OSuRF9R2kNdEMVIWoJxzhjpq-1Fn7Gm-`.

Important status:
- v0.8.0 is NOT PHYSICAL PASS yet.
- Installation attempt on the test phone reached Android package install / Play Protect, but ended with `Program not installed`.
- Most likely cause is debug-signing mismatch with an already installed older Florivo Terminal build; this is not yet confirmed as final root cause.
- Next test: uninstall old Florivo Terminal from the phone, then install v0.8.0 cleanly. Server-side users/card bindings survive reinstall.
- Long-term fix: use one persistent signing key for future APK updates so newer versions can install over older ones.

## Next idea accepted for design
Add a separate web option for moving goods from warehouse to ramp without RFID scanning: one-button bulk move. This must remain an explicit alternative path and must not modify frozen Nordic TIL RAMPE V2.9.7 scan behavior.
Open design point: button scope should be the current/selected order or ramp requirement, not blindly the whole warehouse, unless explicitly chosen.
