# Florivo NFC security audit — 2026-08-21

Status: COMPLETED CLEANUP / ACTIVE LIVE CARD FLOW PRESERVED

## Scope
Audit whether Florivo web/admin/backend exposes raw NFC card UID values that could help clone a physical access card for use outside Florivo.

## Current Android baseline
Florivo Android v0.7.1 reads Android `Tag.id` locally, immediately computes SHA-256, and sends only the hash to the Florivo server. Raw UID is not displayed in the active app UI.

Stable test baseline remains v0.7.1. This cleanup did not change the APK or stock-registration behavior.

## Active UT Kontor user/card page
`florivo-terminal-users.html` does not request or display raw UID or card hash. It only shows card-link state such as KORT TILKOBLET / INGEN KORT.

## Finding
Legacy browser prototype `florivo-terminal-web-test.html` contained old raw-UID diagnostic functionality, including manual UID entry/copy behavior. That prototype was not the current Android card flow.

## Cleanup performed
1. Replaced `florivo-terminal-web-test.html` with an inert archived notice. Raw UID diagnostics and manual UID controls are no longer present on the active branch page.
2. Removed all rows from legacy `florivo_terminal_test_employee_nfc` raw-UID mapping table.
3. Cleared any non-null `uid` values from legacy `florivo_terminal_test_log`.
4. Revoked anon/authenticated access to the legacy raw-UID table.
5. Revoked anon/authenticated EXECUTE on legacy raw-UID RPCs:
   - `florivo_terminal_test_lookup_uid(text)`
   - `florivo_terminal_test_register_employee(text,text,text)`
6. Revoked direct anon/authenticated table privileges on `florivo_terminal_user_cards`; active access remains through narrow SECURITY DEFINER RPCs.
7. Verified live card bindings are stored as 64-character SHA-256 identifiers.

## Verification after cleanup
- legacy raw UID mapping rows: 0
- legacy test-log raw UID rows: 0
- active live SHA-256 card bindings: present
- anon legacy UID lookup execute: false
- anon legacy UID register execute: false

## Important history note
Deleting a raw UID from the current branch does not rewrite old public Git commit history. Historical commits may still contain values that were previously committed. Current active code/database no longer exposes or requires the legacy raw-UID flow.

If a card whose raw UID appeared in public Git history protects a real external access-control system and that external system authenticates only by UID, replacing/re-enrolling that physical card is the only way to eliminate historical exposure completely.

## Canonical rule going forward
- Never render raw UID in Florivo web UI.
- Never add raw UID to example placeholders, screenshots, logs, documentation, or Git commits.
- Never store raw UID in live Florivo card tables.
- Android may read Tag.id only locally to derive the card identifier.
- Server-side live card identity uses SHA-256 card identifier.
- Any future stronger anti-clone design is a separate project; it must not reintroduce raw UID exposure in web/admin surfaces.
