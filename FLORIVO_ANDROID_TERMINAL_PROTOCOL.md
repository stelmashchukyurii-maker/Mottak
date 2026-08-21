# FLORIVO ANDROID TERMINAL PROTOCOL

Status: STABLE TEST BASELINE + CONTROLLED LIVE PILOT
Prepared: 2026-08-17 Europe/Oslo
Updated: 2026-08-21 Europe/Oslo

## Goal
Native Android warehouse terminal for finished-product registration on a shared warehouse phone.

## Read first
- `PROJECT_CANONICAL_RULES.md`
- `BAMAVAREMOTTAK_TEST_LIVE_PROTOCOL.md`
- `FLORIVO_NUMBER_PROTOCOL.md`
- `FLORIVO_TERMINAL_USERS_ACCESS_PROTOCOL.md`
- `FLORIVO_ANDROID_V071_STABLE_2026-08-21.md`

## Stable Android baseline
Canonical stable build for further physical testing:
- version: `v0.7.1`
- branch: `florivo-v07-role-quantity-autologout`
- commit: `9ed66f1bce18e90957e8d8c4eff3ad1911c3f14d`
- workflow run: `32525627283`
- Drive APK id: `197aIDwnhH3ypp2_J4aC41BdwiVLEBPN_`

Do not modify this stable source in place. New Android changes must use a new version/branch.

## Canonical identity
- `florivo_number` = permanent internal Florivo sequence number.
- `scanner_code` = real long RFID/EPC when known.
- `lower_number` = last 6 chars of real RFID/EPC only.
- Never store Florivo number in `lower_number`.

## User / card access
Users and card permissions live on the Florivo server, not on a particular phone installation.
Therefore registered users/cards survive reinstall and work on another Florivo terminal connected to the same backend.

Admin UI never displays card UID, even partially.
Android computes SHA-256 of `Tag.id` locally and sends the hash to server.
Current pilot rule: one active card per user; new binding replaces old active card.

Web administration:
- page: `florivo-terminal-users.html`
- UT Kontor button: `BRUKERE / TILGANGER`
- flow: create user -> role -> KOBLE KORT -> tap card on terminal -> KORT TILKOBLET.

## Roles
- `lager`: +1 product registration only; no manual quantity field.
- `produksjon`: may use manual `ANTALL`.
- `admin`: may use manual `ANTALL` and administrative functions.
- `test`: reserved for isolated test behavior.

Server also enforces that quantity >1 is allowed only for `produksjon` or `admin`.

## Android stock registration
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

`produksjon` and `admin`:
- quantity field `ANTALL` 1..500;
- empty field means 1;
- bulk operation uses `florivo_terminal_register_stock_qty`;
- normal tagged products create real stock rows/F-numbers;
- `forlengere_plast` remains quantity-ledger based.

Backend compatibility updates already applied:
- `mottak_scans.registration_method` accepts `android_bulk`;
- finished-event quantity accepts non-zero values from -500 through 500.

## Session behavior
The terminal is intentionally short-session for shared use:
- login by NFC card;
- if no useful action after login: automatic logout after 12 seconds;
- after successful registration: result shown for 8 seconds;
- then 4-second grace period;
- if no next product action: automatic logout to `VENTER PÅ KORT`;
- relevant interaction resets inactivity;
- `BYTT` = immediate logout.

This supports the physical pattern: approach -> tap card -> choose product -> receive F-number -> leave terminal safe for next worker.

## Current backend RPC family
- `florivo_terminal_admin_create_user`
- `florivo_terminal_admin_list_users`
- `florivo_terminal_admin_request_card_link`
- `florivo_terminal_try_link_card`
- `florivo_terminal_admin_link_status`
- `florivo_terminal_resolve_nfc`
- `florivo_terminal_register_stock_qty`
- `florivo_terminal_register_stock`
- `florivo_terminal_bind_rfid_fifo`

## LIVE baseline history
On 2026-08-21 obsolete WORK physical baseline was audit-reset with history preserved under reset key `2026-08-21-live-baseline-reset` in `public.bama_reset_audit`.
No historical tag/EPC rows were deleted.

## Frozen Nordic isolation
Stable Nordic TIL RAMPE V2.9.7 RFID/scanning behavior and TIL LAGER frozen behavior remain protected.
Any no-scan / bulk movement option must be implemented as an explicit separate path and must not silently rewrite frozen scanning logic.

## Next development areas
- dedicated Device Owner / Lock Task kiosk mode;
- user photo capture/upload;
- stronger terminal enrollment / production authorization;
- no-scan bulk move-to-ramp option as a separate controlled web action;
- further physical testing of v0.7.1.
