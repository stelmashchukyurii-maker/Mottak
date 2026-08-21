# FLORIVO TERMINAL — USERS / ACCESS / NFC PROTOCOL

Updated: 2026-08-21 21:34 Europe/Oslo

## Canonical flow

1. User administration is a web function opened from **UT Kontor → BRUKERE / TILGANGER**.
2. The administration button/page is not additionally password-protected in the current controlled pilot.
3. Admin creates a user with first name, last name and role.
4. Admin presses **KOBLE KORT**.
5. Server creates a device-scoped pending card-link request valid for 5 minutes.
6. Florivo Android terminal receives the next card presentation through its normal NFC lookup call.
7. If a pending link request exists for that terminal, the server binds the presented card to the selected user and returns that user session.
8. If no pending link request exists, the same card presentation is treated as a normal login/lookup.
9. Unknown cards without a pending link request remain blocked with **KORT IKKE REGISTRERT**.

## Card privacy

- Raw NFC UID/card number is never shown in the admin UI.
- Admin UI shows only states such as `KORT TILKOBLET`, `INGEN KORT`, `VENTER PÅ KORT`.
- Android computes SHA-256 from the NFC tag ID and sends only the hash to the server.
- The live card table stores the card hash, not the raw UID.

## Photos

- User profile supports an optional `photo_url`.
- Photo capture/upload is a planned next step: offer camera after first card enrollment and allow adding/replacing photo later from admin web.

## Current pilot roles

- `lager`
- `produksjon`
- `admin`
- `test`

Fine-grained permissions will be added separately; role is the canonical starting point.

## Current implementation

Web page: `florivo-terminal-users.html`

UT Kontor entry point: `bestilling.html` → `BRUKERE / TILGANGER`

Android baseline: Florivo Android v0.6 NFC LIVE.

Relevant RPCs:
- `florivo_terminal_admin_create_user`
- `florivo_terminal_admin_list_users`
- `florivo_terminal_admin_request_card_link`
- `florivo_terminal_admin_link_status`
- `florivo_terminal_try_link_card`
- `florivo_terminal_resolve_nfc`

`florivo_terminal_resolve_nfc` first consumes an active pending card-link request for the device and, when linked, returns the new user session; otherwise it performs normal card lookup.

## Security note

This is a controlled pilot. The public/publishable client path does not use a Supabase service-role secret. Strong admin authentication/device enrollment is deferred to the production hardening phase.
