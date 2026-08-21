# FLORIVO ANDROID v0.7.1 — STABLE TEST BASELINE

Date: 2026-08-21 Europe/Oslo
Status: STABLE FOR PHYSICAL TESTING

## Canonical source
Branch: `florivo-v07-role-quantity-autologout`
Stable commit: `9ed66f1bce18e90957e8d8c4eff3ad1911c3f14d`
Workflow run: `32525627283`
APK Drive file id: `197aIDwnhH3ypp2_J4aC41BdwiVLEBPN_`
APK name: `Florivo-Android-v0.7.1.apk`

## Confirmed physical behavior
- Registered NFC card resolves the same user from server.
- Card/user access is server-side and survives app reinstall / another phone using the same Florivo backend.
- Admin user physically entered the terminal and the app displayed user name, role and `KORT GODKJENT`.
- Web user page showed `KORT TILKOBLET` after terminal card binding.

## Roles
- `lager`: normal +1 registration only; no quantity field.
- `produksjon`: quantity field enabled.
- `admin`: quantity field enabled and administrative role.
- `test`: reserved for isolated test behavior; must not be treated as LIVE production authority.

## Quantity registration
- `produksjon` and `admin` may enter `ANTALL` 1..500.
- Empty quantity means 1.
- `lager` cannot register quantity >1; server enforces this too.
- Bulk registration records real stock rows/F-numbers for normal tagged product types.
- `forlengere_plast` remains quantity-ledger based.
- Server constraints were updated to allow `registration_method='android_bulk'` and finished-event qty within -500..500 excluding 0.

## Session / logout behavior
- Normal result overlay: 8 seconds.
- After result: 4-second grace period.
- If no new product action during grace: logout to `VENTER PÅ KORT`.
- If user logs in and does nothing: 12-second inactivity logout.
- Relevant interaction resets inactivity timer.
- `BYTT` remains immediate manual logout.

## NFC / privacy
- Raw card UID is never shown in admin UI.
- Android hashes `Tag.id` with SHA-256 locally; server stores/compares hash.
- One active card per user in current pilot; binding a new card replaces the previous active card.
- A card cannot be active for two users.

## User administration
Web page: `florivo-terminal-users.html`
UT Kontor button: `BRUKERE / TILGANGER`.
Flow: create user -> choose role -> `KOBLE KORT` -> terminal reads card -> server binds -> page shows `KORT TILKOBLET`.

## Backend RPCs in active pilot
- `florivo_terminal_admin_create_user`
- `florivo_terminal_admin_list_users`
- `florivo_terminal_admin_request_card_link`
- `florivo_terminal_try_link_card`
- `florivo_terminal_admin_link_status`
- `florivo_terminal_resolve_nfc`
- `florivo_terminal_register_stock_qty`
- earlier `florivo_terminal_register_stock`
- `florivo_terminal_bind_rfid_fifo`

## Stability rule
This v0.7.1 build is the normal stable Android baseline to be physically tested further. Do not modify this stable source in place. New Android changes must go to a new version/branch, preserving v0.7.1 as rollback reference.

## Not yet complete
- Dedicated Device / Device Owner kiosk mode.
- Photo capture/user photo flow.
- Fine-grained server authorization beyond current controlled pilot.
- Dedicated per-terminal enrollment/device identity for multi-terminal production.
