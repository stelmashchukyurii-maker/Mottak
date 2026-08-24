# BaMavaremottak — індекс протоколів проєкту

**Репозиторій:** `stelmashchukyurii-maker/Mottak`  
**Гілка:** `main`  
**Оновлено:** 24.08.2026 Europe/Oslo

## 0. READ FIRST — canonical rules
Перед зміною існуючої підсистеми читати в такому порядку:
1. `PROJECT_CANONICAL_RULES.md`
2. `BAMAVAREMOTTAK_TEST_LIVE_PROTOCOL.md` коли TEST/LIVE релевантний
3. `PROTOCOLS.md`
4. точний active subsystem protocol
5. його progress log / NEXT_CHAT handoff
6. останній релевантний audit record
7. live DB state, якщо рішення залежить від поточних даних/схеми

Conflict rule: новіші canonical rules переважають старі feature notes та archives.

Canonical TEST/LIVE:
- whole form/order/workflow/process -> `mode='test'|'live'` для нового дизайну;
- concrete item in `public.mottak_scans` -> `is_test=true|false`;
- legacy `environment=test/work` фізично лишається в частині production schema і не мігрується випадково.

TEST ніколи не повинен впливати на LIVE stock, production orders/statistics, Nordic WORK, reservations, staging, dispatch або availability.

Поточний factual reconciliation:
`FLORIVO_ACTIVE_STATE_AUDIT_2026-08-24.md`.

## 1. Nordic / RFID — ACTIVE + FROZEN production behavior
Read:
- `NEXT_CHAT_NORDIC_ID.txt`
- `NORDIC_ID_RFID_PROTOCOL.md`
- `NORDIC_ID_PROGRESS_LOG.md`
- `NORDIC_TIL_RAMPE_STABLE_LOCK.md`
- `NORDIC_TIL_LAGER_DEV_PROTOCOL.md`

Current operator home:
`scanner-home.html`

Current WORK entries:
- TIL LAGER -> `nordic-id-til-lager-v104.html`
- TIL RAMPE -> `nordic-id-til-rampe-work-default.html`

TIL RAMPE:
- frozen V2.9.7 logic;
- WORK-default wrapper PHYSICAL PASS;
- Forlengere actual `NNN stk.` display PHYSICAL PASS.

TIL LAGER:
- current V1.0.4 / WORK DEFAULT;
- real WORK incoming writes exist;
- final V1.0.4 visual WORK-default startup still awaits explicit final physical confirmation.

Do not rewrite frozen Nordic production logic as part of unrelated work.

## 2. Product / RFID identity — ACTIVE RULE
Product model:
RFID: `bunner`, `hyller30`, `hyller60`, `forlengere_korte`, `forlengere_lange`, `vrak_bunner`, `vrak_hyller`.
Quantity-only: `forlengere_plast`.

Identity:
- full real EPC -> `scanner_code`;
- last 6 of real EPC -> `lower_number`;
- internal permanent Florivo sequence -> `florivo_number`;
- no RFID read -> never invent EPC/lower.

Read: `FLORIVO_NUMBER_PROTOCOL.md`.

## 3. Unified stock — ACTIVE
Canonical live summary RPC:
`bama_stock_summary()`

Counters:
1. physical stock;
2. available stock = physical - still-unfulfilled active order demand.

Create/edit order reduces available immediately; staging must not double-subtract.
Never treat an old protocol stock snapshot as current stock; query live.

Quantity architecture:
- `mottak_quantity_stock`
- `mottak_quantity_stock_events`
- `receive_mottak_quantity_stock(...)`

`forlengere_plast` never gets fabricated RFID.

## 4. UT Kontor — ACTIVE WORKING
Current wrapper:
`bestilling.html` = **UT Kontor WORKING v37.6**.

Current active modules include:
- products / vrak products;
- history visuals;
- stock summary;
- extra stock;
- NO language layer;
- `BRUKERE / TILGANGER` -> `florivo-terminal-users.html`;
- `ut-kontor-stage-all-no-scan.js`.

No-scan Option A is implemented:
`FLYTT HELE ORDREN TIL RAMPE · UTEN SKANNING`

Meaning:
- only the exact still-required quantities for one selected NEW order;
- never whole warehouse;
- backend RPC `office_stage_order_without_scanning(uuid)` exists;
- if an order already has scanning/confirmation progress, the no-scan path must refuse rather than mix paths;
- frozen Nordic TIL RAMPE remains untouched.

Status: implemented/server present, but this no-scan path is NOT PHYSICAL PASS until the controlled real test is explicitly accepted.

Read: `FLORIVO_RAMP_NO_SCAN_BULK_PROTOCOL.md` and latest Android/session handoff.

## 5. Lager Admin — ACTIVE WORK SERVER/UI
Protocol: `LAGER_ADMIN_DEV_PROTOCOL.md`.
Entry: `lager-admin.html` WORK v2.0.

Verified current backend:
- Supabase Edge Function `lager-admin-work` v1 ACTIVE;
- page calls that function directly;
- custom Admin key is checked server-side;
- browser does not receive service-role key;
- manual quantity overlay only, no fake RFID;
- audit actions `admin_adjust_work`, `admin_set_work`.

Status: SERVER/UI DEPLOY PASS; WORK physical mutation PASS still pending unless separately confirmed later.

## 6. Florivo Android Terminal — STABLE TEST BASELINE + CONTROLLED LIVE PILOT
Protocol: `FLORIVO_ANDROID_TERMINAL_PROTOCOL.md`.
Stable baseline: v0.7.1, branch `florivo-v07-role-quantity-autologout`, commit `9ed66f1bce18e90957e8d8c4eff3ad1911c3f14d`.

Physically verified in current baseline:
- NFC card login;
- server-side user/card mapping;
- active Android sends SHA-256 card identifier, not raw UID;
- `lager` = +1 only;
- `produksjon` / `admin` = ANTALL 1..500;
- 12 s idle logout;
- result 8 s + 4 s grace; BYTT immediate logout.

Current live backend RPC family exists, including user/card resolution, quantity registration, normal stock registration and FIFO RFID binding.

Do not modify v0.7.1 in place; new Android changes require a new version/branch.

Read also:
- `FLORIVO_ANDROID_V071_STABLE_2026-08-21.md`
- `FLORIVO_ANDROID_TERMINAL_PROGRESS_LOG.md`
- `FLORIVO_NFC_SECURITY_AUDIT_2026-08-21.md`

## 7. Florivo Android Scanner — CONCEPT ONLY
Protocol: `FLORIVO_ANDROID_SCANNER_CONCEPT_PROTOCOL.md`.

This remains architecture, not current production implementation.
Server-first rules are still valid design constraints:
- scanner reads and requests;
- server validates/decides;
- UT Kontor remains source of order/customer/destination;
- no `service_role`, Admin code or permanent universal production secret inside APK;
- future scanner pairing must be revocable/server-controlled.

Do not list concept pairing/device flow as already deployed.

## 8. Florivo Inventory / Inventering — ACTIVE DEV V0.12 SERVER SYNC
Protocol: `FLORIVO_INVENTORY_CONCEPT_PROTOCOL.md`.
Handoff: `NEXT_CHAT_FLORIVO_INVENTORY.txt`.

Current active scanner/manual path:
`florivo-inventory-v012-dev.html`

`florivo-inventory-sync.html` currently redirects to that V0.12 path.

Current PC/web page:
`florivo-inventeringer.html`

Current implementation:
- shared server-synced TEST inventory through `public.florivo_inventory_events`;
- append-only full-session snapshot events;
- current client writes `mode='test'`, `source='florivo-inventory'`, `event_type='snapshot'`;
- RLS enabled; current SELECT + INSERT policies verified; no UPDATE/DELETE policy;
- localStorage remains fallback/cache;
- PC polls latest server session approximately every 2.5 s;
- server/local reconciliation supports the current shared session;
- no automatic LIVE/WORK stock mutation.

Current implemented zones:
- Plukk
- Varm
- Kald
- Demontering
- Produksjon
- CC

Ramps 28–34 are visual orientation references matching UT Kontor numbering.

Implemented UX includes:
- NO/UK;
- zone selection and current-zone state;
- Nordic/RFID path;
- MAN-xxx manual path;
- simulated RFID for non-Nordic testing;
- remembered product;
- zone journal/counters;
- FULLFØR;
- RECOUNT with revision;
- manual batch counting without fabricated RFID;
- PC visual map + table + printable A4 inventory report.

Status: ACTIVE DEV / TEST server sync. Full Nordic physical server-sync flow still requires explicit PHYSICAL PASS.

Next active development only after current physical verification:
- inventory history list;
- SERVER EXPECTED <-> FAKTISK / AVVIK;
- normalized sessions/observations only if concurrency/multi-scanner requirements justify it;
- separate audited LIVE correction flow after review.

## 9. Camera — CURRENT ENTRY PRESERVED
Current menu/entry uses `camera-live-v4.html`, which redirects to its working camera implementation.
Do not infer a newer camera file is production merely because it exists in repository. Camera promotion requires the same explicit physical acceptance rule as other working flows.

## 10. Presentation analytics — ACTIVE ISOLATED MODULE
Read:
- `FLORIVO_PRESENTATION_VISIT_PROTOCOL.md`
- `FLORIVO_PRESENTATION_INSIGHTS_PROTOCOL.md`
- `NEXT_CHAT_FLORIVO_STAT_REPORT.txt`

Current presentation visit/click logging is isolated from Nordic/stock/orders. Internal statistics page remains `florivo-besok-oversikt.html`.
For current statistics always query live Supabase; do not quote old snapshots.

## 11. GitHub / Android build — ACTIVE
Workflow:
`.github/workflows/florivo-android-build.yml`

It builds Android debug APK for Android-terminal source/workflow changes and uploads the artifact. The workflow does not reference the old classic PAT `BaMaMottak`.

## 12. Security — ACTIVE FINDINGS / DO NOT BLINDLY CHANGE
Completed NFC cleanup remains governed by `FLORIVO_NFC_SECURITY_AUDIT_2026-08-21.md`.
Raw UID must not be reintroduced in active UI/logs/docs.

Security audit 24.08.2026 found Supabase Advisor warnings for multiple browser-executable `SECURITY DEFINER` functions and mutable `search_path` on `set_ut_updated_at`.

This does NOT mean revoke everything immediately. Some RPCs are current browser API by design. Before permission changes create an exact dependency allowlist:
`active page -> RPC -> required role -> read/mutation scope`.
Then remove only proven excess/unused privileges and regression-test frozen WORK flows.

See `FLORIVO_ACTIVE_STATE_AUDIT_2026-08-24.md`.

## 13. Protocol governance / active-state rule
Canonical current-state documents should describe what is actually active, in use, deployed, physically passed, or implemented-but-explicitly-pending-PASS.

Legacy prototypes, rollback copies, abandoned routes and concepts must not be presented as current working state. Keep them in archives/feature history only when needed for rollback or evidence.

Never promote `implemented` to `PHYSICAL PASS` without explicit physical confirmation.
Never change frozen working behavior solely to make old documentation look consistent.
