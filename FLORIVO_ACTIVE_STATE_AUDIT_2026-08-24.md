# FLORIVO ACTIVE STATE AUDIT — 2026-08-24

Status: ACTIVE AUDIT RECORD
Scope: compare current GitHub `main` + current Supabase reality against project protocols. This document records only active, in-use, deployed, physically passed, or implemented-but-still-awaiting-PASS functionality. Legacy/archived prototypes are mentioned only when needed to prevent them being treated as current.

## Canonical rules preserved
- `PROJECT_CANONICAL_RULES.md` remains highest project authority.
- Process/order/workflow state uses canonical `mode='test'|'live'` for new design.
- Concrete `mottak_scans` item identity uses `is_test`.
- Existing legacy `environment=test/work` schema is not renamed casually.
- TEST must not mutate LIVE/WORK stock/orders/statistics/Nordic production.
- Frozen Nordic behavior is not modified by this documentation audit.

## Current repository / entry points verified
Repository: `stelmashchukyurii-maker/Mottak`, branch `main`, GitHub Pages active.

Current visible/active entries verified from code:
- `index.html` — Florivo main menu, v22.5 STABIL.
- `scanner-home.html` — Nordic operator home; WORK entries + active Inventory V0.12 + Inventory web report.
- `nordic-id-til-lager-v104.html` — TIL LAGER WORK-default.
- `nordic-id-til-rampe-work-default.html` — TIL RAMPE WORK-default wrapper around frozen V2.9.7 logic.
- `bestilling.html` — UT Kontor WORKING v37.6.
- `lager-admin.html` — Lager Admin WORK v2.0, direct/unlinked admin entry.
- `florivo-terminal-users.html` — terminal users / card access administration.
- `florivo-inventory-v012-dev.html` — active Inventory V0.12 scanner/manual client with server synchronization bridge.
- `florivo-inventeringer.html` — Inventory PC/web visualization, table and printable A4 report.
- `camera-live-v4.html` — current camera entry redirects to its working camera implementation.
- `presentasjon-hovedmeny.html` + `florivo-besok-oversikt.html` — presentation and internal visit/click analytics.

## Nordic / RFID — current verified state
- TIL RAMPE V2.9.7 production scanning logic remains FROZEN and PHYSICAL PASS.
- WORK-default TIL RAMPE wrapper is PHYSICAL PASS.
- Forlengere actual `NNN stk.` display is PHYSICAL PASS.
- TIL LAGER V1.0.4 is current WORK-default entry; real WORK writes exist, while the final visual startup wrapper still lacks an explicit final physical PASS.
- RFID identity remains full real EPC -> `scanner_code`, last 6 -> `lower_number`; no invented RFID.

## UT Kontor — current verified implementation
`bestilling.html` is currently WORKING v37.6, not v37/v37.3.
It loads the current product modules, stock summary, history visuals, extra stock, language module, terminal users link and `ut-kontor-stage-all-no-scan.js`.

The no-scan option is implemented as Option A only:
- one selected NEW order;
- exact remaining quantities for that order;
- never whole warehouse;
- backend RPC `office_stage_order_without_scanning(uuid)` exists in live database;
- frozen Nordic TIL RAMPE scanning logic remains separate.

Status: implemented/server present, but no-scan whole-order path is still NOT PHYSICAL PASS until the controlled real test is explicitly accepted.

## Lager Admin — current verified implementation
- `lager-admin.html` WORK v2.0 is current direct entry.
- Edge Function `lager-admin-work` v1 is ACTIVE in Supabase.
- Page calls exactly `/functions/v1/lager-admin-work`.
- allowed browser origin is GitHub Pages origin;
- custom `x-admin-key` authentication is server-side;
- browser does not receive Supabase service-role key;
- admin code is not embedded as plaintext in page HTML;
- WORK changes use manual quantity overlay and audit actions `admin_adjust_work` / `admin_set_work`.

Status remains SERVER/UI DEPLOY PASS; WORK physical mutation PASS still pending unless separately confirmed later.

## Android terminal — current verified stable baseline
Stable TEST baseline is Florivo Android v0.7.1:
- branch `florivo-v07-role-quantity-autologout`;
- commit `9ed66f1bce18e90957e8d8c4eff3ad1911c3f14d`;
- NFC login physically works;
- Android hashes `Tag.id` locally with SHA-256; raw UID is not sent/displayed in active UI;
- user/card mapping is server-side;
- roles: lager +1 only; produksjon/admin ANTALL 1..500;
- 12 s idle logout; result 8 s + 4 s grace; BYTT immediate logout;
- current terminal RPC family exists in live Supabase.

Do not modify v0.7.1 in place.

## Inventory / Inventering — current verified implementation
Older protocol text saying V0.11/localStorage-only/no server DB is obsolete.

Current active scanner path:
- `scanner-home.html` links to `florivo-inventory-v012-dev.html`.
- `florivo-inventory-sync.html` is now only a redirect to that current V0.12 path.
- V0.12 uses localStorage as cache/fallback and synchronizes full session snapshots through Supabase `public.florivo_inventory_events`.
- writes are append-only snapshot events with `source='florivo-inventory'`, `mode='test'`, `event_type='snapshot'` in current development client.
- server-side table exists and RLS is enabled.
- verified policies: SELECT for anon/authenticated and INSERT for anon/authenticated; no update/delete policy.
- phone/scanner reconciles local and server snapshots; PC polls latest server state approximately every 2.5 seconds.

Current physical zones implemented in scanner + PC page:
- Plukk
- Varm
- Kald
- Demontering
- Produksjon
- CC

Ramps 28–34 are visual orientation references matching UT Kontor ramp numbering.

Current implemented UX includes zone selection, remembered product, Nordic/RFID path, MAN-xxx path, simulated RFID for non-Nordic testing, zone journal/counters, FULLFØR, RECOUNT revision, and manual batch counting without fabricated RFID.

`florivo-inventeringer.html` currently provides:
- visual warehouse map;
- zone table;
- same-server-session view;
- printable A4 report with detailed registrations and signature fields.

Inventory remains isolated from WORK stock: finishing/counting does not silently correct production stock.
Full Nordic physical server-sync flow still requires explicit PHYSICAL PASS before promotion beyond current TEST development status.

## Presentation analytics — active
The active visit/click journal described in `FLORIVO_PRESENTATION_VISIT_PROTOCOL.md` remains present as a separate analytics subsystem. It is not coupled to stock/orders/Nordic.

## Current backend objects verified
Live Supabase project contains the active tables needed by current flows, including:
`mottak_scans`, `mottak_stock_events`, `mottak_quantity_stock`, `mottak_quantity_stock_events`, `ut_orders`, `ut_order_items`, `ut_order_scans`, `ut_extra_confirmations`, `florivo_terminal_users`, `florivo_terminal_user_cards`, `florivo_inventory_events`, `bama_reset_audit`.

Verified current RPCs include:
`bama_stock_summary`, `office_stage_order_without_scanning`, `receive_mottak_quantity_stock`, `ut_extra_progress`, and the active `florivo_terminal_*` registration/user/card RPC family.

## GitHub Actions
Current `.github/workflows/florivo-android-build.yml` builds Android debug APK on Android-terminal source/workflow changes and uploads the APK artifact. It does not reference the old `BaMaMottak` classic PAT.

## Security findings requiring a separate controlled review
No secret-removal or permission mutation was performed during this audit.

Supabase Security Advisor currently warns that a number of `SECURITY DEFINER` RPCs are executable by `anon` and/or `authenticated`. Some are intentionally browser-callable in the present architecture; some privileged mutation/admin/order functions require a dedicated allowlist review before changing anything. Examples include order mutation/staging functions and several terminal/admin functions.

Also reported: `set_ut_updated_at` has mutable `search_path`.

These are active security-review findings, NOT authorization to revoke permissions blindly: changing grants can break frozen/working production flows. Required next step is a separate dependency map: active page -> RPC -> required role -> mutation scope, then revoke only demonstrably unused/excess permissions with regression tests.

## Protocol mismatches found by this audit
1. `PROTOCOLS.md` Inventory section was behind actual V0.12 server-sync implementation.
2. `FLORIVO_INVENTORY_CONCEPT_PROTOCOL.md` still described V0.11/localStorage-only and old zone set.
3. `FLORIVO_RAMP_NO_SCAN_BULK_PROTOCOL.md` still said scope A/B was unresolved, although Option A was later explicitly accepted and implemented.
4. `PROTOCOLS.md` Android section contained an old pre-NFC UI-only statement, while v0.7.1 NFC/card/role flow is physically proven.
5. `PROTOCOLS.md` UT Kontor version was behind current `bestilling.html` v37.6.
6. `NEXT_CHAT_FLORIVO_ANDROID_TERMINAL.txt` still named UT Kontor v37.3; current wrapper is v37.6.

This audit is factual state reconciliation. It does not promote any feature to PHYSICAL PASS without explicit physical confirmation.