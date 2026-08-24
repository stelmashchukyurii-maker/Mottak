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

Останній великий factual reconciliation:
`FLORIVO_ACTIVE_STATE_AUDIT_2026-08-24.md`.
Пізніші явно зафіксовані зміни цього дня можуть мати новішу версію, ніж snapshot audit.

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
RFID products:
- `bunner`
- `hyller30`
- `hyller60`
- `forlengere_korte`
- `forlengere_lange`
- `vrak_bunner`
- `vrak_hyller`

Quantity-only:
- `forlengere_plast`

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
Manual quantity overlay is part of canonical physical stock and therefore must be respected by every operational stock display.
A page must not present raw RFID row count as factual stock when a manual overlay exists.

Never treat an old protocol stock snapshot as current stock; query live.

Quantity architecture:
- `mottak_quantity_stock`
- `mottak_quantity_stock_events`
- `receive_mottak_quantity_stock(...)`

`forlengere_plast` never gets fabricated RFID.

## 4. UT Kontor — ACTIVE WORKING
Current wrapper:
`bestilling.html` = **UT Kontor WORKING v37.8**.

Current active modules include:
- products / vrak products;
- history visuals;
- canonical 8-product stock summary;
- extra stock;
- NO language layer;
- `BRUKERE / TILGANGER` -> `florivo-terminal-users.html`;
- `ut-kontor-stage-all-no-scan.js`;
- `ut-kontor-manual-correction.js`.

### Manual stock correction — ACTIVE DEV
Protocol:
`UT_KONTOR_MANUAL_CORRECTION_PROTOCOL.md`

Current simple WORK correction supports all 8 canonical stock products:
- `-1`
- `+1`
- `SETT FAKTISK`

Current phase intentionally has no Admin-code. Browser never receives `SUPABASE_SERVICE_ROLE_KEY`; mutation is server-side through Edge Function `ut-kontor-manual-correction` and RPC `ut_kontor_manual_correct_work`.

Every actual correction is audited in `mottak_quantity_stock_events` with server-generated human reference `A001`, `A002`, ... .
No fake RFID/EPC/lower is created.

Important separation:
- wrong order -> `Rediger bestilling`;
- wrong factual warehouse count -> `MANUELL KORRIGERING`.

### No-scan Option A
Implemented action:
`FLYTT HELE ORDREN TIL RAMPE · UTEN SKANNING`

Meaning:
- only exact still-required quantities for one selected NEW order;
- never whole warehouse;
- backend RPC `office_stage_order_without_scanning(uuid)` exists;
- if an order already has scanning/confirmation progress, refuse rather than mix paths;
- frozen Nordic TIL RAMPE remains untouched.

Status: implemented/server present, but this no-scan path is NOT PHYSICAL PASS until controlled real test is explicitly accepted.
Read: `FLORIVO_RAMP_NO_SCAN_BULK_PROTOCOL.md`.

## 5. UT Lager / Bekreft rampe — ACTIVE WORKING
Current wrapper:
`utsending.html`.

Stock counter rule as of 24.08.2026:
- compact `B / H×30 / H×60` counter uses canonical `bama_stock_summary()`;
- it displays `available_count`, i.e. factual physical stock including manual overlay minus still-unfulfilled active orders;
- it must not independently count raw `mottak_scans` rows;
- this prevents divergence between UT Kontor and UT Lager and prevents double subtraction after staging.

Frozen Nordic TIL RAMPE production logic remains separate and unchanged.

## 6. Lager Admin — ACTIVE WORK SERVER/UI
Protocol: `LAGER_ADMIN_DEV_PROTOCOL.md`.
Entry: `lager-admin.html` WORK v2.0.

Verified backend:
- Supabase Edge Function `lager-admin-work` ACTIVE;
- custom Admin key checked server-side;
- browser does not receive service-role key;
- manual quantity overlay only, no fake RFID;
- audit actions `admin_adjust_work`, `admin_set_work`.

Status: SERVER/UI DEPLOY PASS; WORK physical mutation PASS still pending unless separately confirmed later.

The separate Lager Admin remains available; the simpler UT Kontor correction path is a later explicit workflow for quick office correction and does not delete the Lager Admin architecture.

## 7. Florivo Android Terminal — STABLE TEST BASELINE + CONTROLLED LIVE PILOT
Protocol: `FLORIVO_ANDROID_TERMINAL_PROTOCOL.md`.
Stable baseline: v0.7.1, branch `florivo-v07-role-quantity-autologout`, commit `9ed66f1bce18e90957e8d8c4eff3ad1911c3f14d`.

Physically verified:
- NFC card login;
- server-side user/card mapping;
- active Android sends SHA-256 card identifier, not raw UID;
- `lager` = +1 only;
- `produksjon` / `admin` = ANTALL 1..500;
- 12 s idle logout;
- result 8 s + 4 s grace; BYTT immediate logout.

Current live backend RPC family exists for user/card resolution and stock registration.
Do not modify v0.7.1 in place; new Android changes require a new version/branch.

Read also:
- `FLORIVO_ANDROID_V071_STABLE_2026-08-21.md`
- `FLORIVO_ANDROID_TERMINAL_PROGRESS_LOG.md`
- `FLORIVO_NFC_SECURITY_AUDIT_2026-08-21.md`

## 8. Florivo Android Scanner — CONCEPT ONLY
Protocol: `FLORIVO_ANDROID_SCANNER_CONCEPT_PROTOCOL.md`.

Server-first design constraints remain:
- scanner reads and requests;
- server validates/decides;
- UT Kontor remains source of order/customer/destination;
- no `service_role`, Admin code or permanent universal production secret inside APK;
- future scanner pairing must be revocable/server-controlled.

Do not present concept pairing/device flow as deployed.

## 9. Florivo Inventory / Inventering — ACTIVE DEV V0.12 SERVER SYNC
Protocol: `FLORIVO_INVENTORY_CONCEPT_PROTOCOL.md`.
Handoff: `NEXT_CHAT_FLORIVO_INVENTORY.txt`.

Current active scanner/manual path:
`florivo-inventory-v012-dev.html`

PC/web:
`florivo-inventeringer.html`

Current implementation:
- shared server-synced TEST inventory through `public.florivo_inventory_events`;
- append-only full-session snapshot events;
- current client writes `mode='test'`, `source='florivo-inventory'`, `event_type='snapshot'`;
- RLS enabled with current SELECT + INSERT policies;
- localStorage remains fallback/cache;
- PC polls latest server session;
- no automatic LIVE/WORK stock mutation.

Current zones:
- Plukk
- Varm
- Kald
- Demontering
- Produksjon
- CC

Ramps 28–34 are visual orientation references matching UT Kontor numbering.

Current status: ACTIVE DEV / TEST server sync. Full Nordic physical server-sync flow still requires explicit PHYSICAL PASS.
Any future LIVE discrepancy correction remains separate, audited and human-approved; current Inventory must not silently mutate production stock.

## 10. Camera — CURRENT ENTRY PRESERVED
Current menu/entry uses `camera-live-v4.html`, which redirects to its working camera implementation.
Do not infer a newer camera file is production merely because it exists. Promotion requires explicit physical acceptance.

## 11. Presentation analytics — ACTIVE ISOLATED MODULE
Read:
- `FLORIVO_PRESENTATION_VISIT_PROTOCOL.md`
- `FLORIVO_PRESENTATION_INSIGHTS_PROTOCOL.md`
- `NEXT_CHAT_FLORIVO_STAT_REPORT.txt`

Visit/click logging is isolated from Nordic/stock/orders. Internal statistics page: `florivo-besok-oversikt.html`.
For current statistics query live Supabase; do not quote old snapshots.

## 12. GitHub / Android build — ACTIVE
Workflow:
`.github/workflows/florivo-android-build.yml`

It builds Android debug APK for Android-terminal source/workflow changes and uploads the artifact. It does not reference the old classic PAT `BaMaMottak`.

## 13. Security — ACTIVE FINDINGS / DO NOT BLINDLY CHANGE
Raw NFC UID must not be reintroduced in active UI/logs/docs.

Security audit 24.08.2026 found Supabase Advisor warnings for multiple browser-executable `SECURITY DEFINER` functions and mutable `search_path` on `set_ut_updated_at`.
Do not revoke blindly. First map:
`active page -> RPC -> required role -> read/mutation scope`, then remove only proven excess privileges and regression-test frozen WORK flows.

The current UT Kontor manual correction deliberately has no Admin-code in its first simple phase. This is an explicit usability decision, not a claim of strong authentication. Its server mutation surface must stay restricted to the defined products/actions until later authorization work.

## 14. Protocol governance / active-state rule
Canonical current-state documents describe what is actually active, deployed, physically passed, or implemented-but-explicitly-pending-PASS.

Legacy prototypes, rollback copies, abandoned routes and concepts must not be presented as current working state.
Never promote `implemented` to `PHYSICAL PASS` without explicit physical confirmation.
Never change frozen working behavior solely to make old documentation look consistent.
