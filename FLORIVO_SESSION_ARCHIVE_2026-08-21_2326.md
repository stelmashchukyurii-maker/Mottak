# FLORIVO SESSION ARCHIVE — 2026-08-21 23:26 Europe/Oslo

Status: SESSION READY TO CLOSE / NEXT CHAT PREPARED

## 1. Stable Android baseline
Canonical stable test baseline:
- Florivo Android v0.7.1
- role-aware NFC login
- Lager: fixed +1 flow, no ANTALL field
- Produksjon/Admin: ANTALL 1–500
- successful registration confirmation: 8 seconds
- grace period after confirmation: 4 seconds, then logout unless next product is selected
- idle login timeout before any action: 12 seconds
- card identity: Android reads Tag.id locally and sends SHA-256 identifier only
- user/card permissions are server-side and survive reinstall/other phones connected to the same Florivo backend

v0.7.1 is now a stable TEST baseline. Do not modify it in place; future Android changes require a new version.

## 2. Users / roles / card linking
UT Kontor page:
- `florivo-terminal-users.html`
- button in `bestilling.html`: BRUKERE / TILGANGER

Roles:
- lager
- produksjon
- admin
- test

Current card registration flow:
UT Kontor → KOBLE KORT → Android terminal reads next card → server binds SHA-256 card identifier → web shows KORT TILKOBLET.

Raw UID/card number is intentionally not shown in the active admin UI.

## 3. NFC security cleanup
Read:
`FLORIVO_NFC_SECURITY_AUDIT_2026-08-21.md`

Completed:
- legacy browser raw-UID prototype archived/inert;
- legacy raw UID mapping rows deleted;
- legacy log UID values cleared;
- legacy raw-UID RPC access revoked for anon/authenticated;
- direct anon/authenticated table access to live card bindings revoked;
- active live bindings verified as SHA-256 identifiers.

Historical Git commits are not rewritten; current active branch and database no longer expose the legacy raw UID path.

## 4. UT Kontor one-button transfer to ramp — option A only
User explicitly accepted ONLY option A:

`FLYTT HELE ORDREN TIL RAMPE · UTEN SKANNING`

Meaning:
- never move the whole warehouse;
- move only the exact quantities belonging to one selected NEW order/ramp;
- no unrelated stock may be touched;
- this is an alternative fallback when RFID scanning is not used;
- frozen Nordic TIL RAMPE V2.9.7 scanning flow remains untouched.

Implemented backend RPC:
`office_stage_order_without_scanning(uuid)`

Safety rules:
- only a NEW order can use no-scan staging;
- if the order already has scans/confirmations, no-scan path refuses and user must continue scanner flow or cancel first;
- validates all required stock before mutation;
- selects oldest available in-stock rows of each ordered product;
- stages exactly order quantities;
- plastic quantity stock is handled through the existing quantity architecture;
- completes through existing `stage_ut_order(...)` validation;
- operation is atomic.

UT Kontor module:
`ut-kontor-stage-all-no-scan.js`

UT Kontor wrapper promoted to:
- `bestilling.html`
- WORKING v37.3
- module injected for the one-button no-scan option
- malformed opening HTML tag from v37.2 fixed.

This UI/backend feature is implemented but NOT YET PHYSICAL PASS. First next-chat test must use one controlled NEW order and verify exact stock/ramp deltas.

## 5. Frozen boundaries
Do not modify Nordic TIL RAMPE V2.9.7 scanning logic while testing the UT Kontor no-scan fallback.
Do not modify Android v0.7.1 stable baseline in place.
Do not expose raw NFC UID in web, logs, documentation, examples, or Git commits.

## 6. Next physical test
`UT KONTOR NO-SCAN WHOLE ORDER — PHYSICAL PASS`

Test one small NEW order only:
1. note warehouse counts before;
2. open active order in UT Kontor;
3. press `FLYTT HELE ORDREN TIL RAMPE · UTEN SKANNING`;
4. confirm preview/order quantities;
5. verify order becomes På rampe;
6. verify exactly ordered quantities leave in_stock and become staged for that order;
7. verify no unrelated product/order changes;
8. verify stock summary and ramp summary agree.

Only after this exact test may the feature be called PHYSICAL PASS.
