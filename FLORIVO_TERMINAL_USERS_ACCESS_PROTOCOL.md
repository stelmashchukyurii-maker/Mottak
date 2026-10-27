# FLORIVO TERMINAL — USERS / ACCESS / NFC PROTOCOL

Status: ACTIVE RULE
Updated: 2026-10-27 Europe/Oslo

## Canonical flow

1. User administration is a web function opened from **UT Kontor → BRUKERE / TILGANGER**.
2. User/card administration remains a controlled pilot.
3. Admin creates a user with first name, last name and role.
4. Admin presses **KOBLE KORT**.
5. Server creates a device-scoped pending card-link request valid for 5 minutes.
6. Florivo/SpekiAndi Android terminal receives the next card presentation through its normal NFC lookup call.
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

## Current roles

- `lager`
- `produksjon`
- `admin`
- `test`

Fine-grained permissions may be added separately; role remains the canonical starting point.

## Role change — protected server path

Existing users may have their role changed from **BRUKERE / TILGANGER**.

Security rules:
- changing a role is a privileged action;
- the browser must never receive `SUPABASE_SERVICE_ROLE_KEY`;
- role mutation must not be a browser-callable public SECURITY DEFINER RPC;
- role mutation goes through dedicated Edge Function `florivo-terminal-user-admin`;
- the Edge Function requires the same server-verified Admin code mechanism as Lager Admin via `x-admin-key`;
- plaintext Admin code is never stored in repository/HTML/database;
- browser may keep the entered Admin code only in `sessionStorage` for the current tab/session;
- accepted target roles are exactly `lager`, `produksjon`, `admin`, `test`;
- user id must already exist;
- changing role does not change card binding, identity, historical events or active flag;
- no-op role change creates no audit event;
- every real role change writes durable audit history with old role, new role, user id, source and timestamp;
- if audit write fails after the user update, server performs compensating rollback to the previous role.

Role changes take effect for the Android terminal on the user's next NFC login/session because `florivo_terminal_resolve_nfc` reads the current server-side role.

## Current implementation

Web page: `florivo-terminal-users.html`

UT Kontor entry point: `bestilling.html` → `BRUKERE / TILGANGER`

Relevant existing RPCs:
- `florivo_terminal_admin_create_user`
- `florivo_terminal_admin_list_users`
- `florivo_terminal_admin_request_card_link`
- `florivo_terminal_admin_link_status`
- `florivo_terminal_try_link_card`
- `florivo_terminal_resolve_nfc`

Protected role mutation:
- Edge Function: `florivo-terminal-user-admin`
- audit table: `public.florivo_terminal_user_admin_events`

`florivo_terminal_resolve_nfc` first consumes an active pending card-link request for the device and, when linked, returns the new user session; otherwise it performs normal card lookup.

## Security boundary

Role-change security is stronger than the older controlled-pilot create/link flow: role elevation requires the Admin code and server-side Edge Function.

This does NOT claim that the entire user administration page has completed production hardening. Existing create-user/card-link RPCs remain legacy controlled-pilot paths until separately hardened.

Do not weaken the protected role-change path merely to match those older pilot RPCs.
