# BaMavaremottak — індекс протоколів проєкту

**Репозиторій:** `stelmashchukyurii-maker/Mottak`  
**Гілка:** `main`  
**Оновлено:** 23.08.2026 Europe/Oslo

## 0. READ FIRST — canonical rules
Before changing any existing subsystem, read in this order:
1. `PROJECT_CANONICAL_RULES.md`
2. `BAMAVAREMOTTAK_TEST_LIVE_PROTOCOL.md` when TEST/LIVE is relevant
3. this file: `PROTOCOLS.md`
4. the exact subsystem protocol
5. its progress log / NEXT_CHAT handoff

Conflict rule: newer canonical project rules override older feature notes and archives. Archived/session files are history only.

### Canonical TEST/LIVE semantics
Whole form / order / workflow / process:
- `mode = 'test'`
- `mode = 'live'`

Concrete tag/product row in `public.mottak_scans`:
- `is_test = true`
- `is_test = false`

Do not mix these meanings.

`environment=test/work` is a LEGACY implementation pattern still physically present in parts of the current database. Do not rename or remove legacy production columns/functions casually. Any migration must be separate, audited, and regression-tested.

TEST data must never affect live stock, live statistics, production orders, Nordic WORK, reservations, dispatch, availability calculations, or other production mutations.

## 1. Start here — Nordic/RFID
1. `NEXT_CHAT_NORDIC_ID.txt`
2. `NORDIC_ID_RFID_PROTOCOL.md`
3. `NORDIC_ID_PROGRESS_LOG.md`
4. `NORDIC_TIL_RAMPE_STABLE_LOCK.md`
5. `NORDIC_TIL_LAGER_DEV_PROTOCOL.md`
6. `NORDIC_TIL_RAMPE_V298_DEV_PROTOCOL.md` only when resuming Vrak/all-8 outgoing DEV
7. `NORDIC_SESSION_ARCHIVE_2026-08-11_2243.md` for the closed 11.08 session snapshot

Historical Nordic snapshot:
`NORDIC_ID_RFID_PROTOCOL_ARCHIVE_2026-08-09.md`

## 2. Current Nordic operator entries — FROZEN
### Scanner home
`scanner-home.html`

Production buttons are WORK-first:
- `📥 TIL LAGER · WORK` → `nordic-id-til-lager-v104.html`
- `📤 TIL RAMPE · WORK` → `nordic-id-til-rampe-work-default.html`

TEST remains available manually inside each form.

### Change lock 12.08.2026
Усі Nordic ID / scanner production-форми та їхня вже робоча production-логіка вважаються FROZEN.

Не змінювати їх у рамках інших задач. Будь-яка зміна лише після окремого прямого дозволу користувача.

### Til rampe operational state
Application logic remains frozen V2.9.7 at:
`ed3a19b20efd9af0bf07bc4a079589b3b6038157`

WORK-default startup is PHYSICAL PASS.
Forlengere actual piece-count display (`NNN stk.`) is PHYSICAL PASS.

Display protocol:
`NORDIC_TIL_RAMPE_EXTENSION_COUNT_DISPLAY_2026-08-11.md`

### Til lager operational state
Current:
`DEV V1.0.4 / WORK DEFAULT`

Real WORK incoming Nordic writes are present in DB. Final V1.0.4 visual WORK-default startup still awaits an explicit physical confirmation.

## 3. Product model
RFID:
- bunner
- hyller30
- hyller60
- forlengere_korte
- forlengere_lange
- vrak_bunner
- vrak_hyller

No RFID:
- forlengere_plast

Rules:
- Vrak bunner = 10/stack
- Vrak hyller = 30/stack
- short/long counts entered only at outgoing
- all products may be ordered to RAMPE
- plastic never gets fake RFID

## 4. RFID mapping
- full 24 HEX EPC → `scanner_code`
- last 6 → `lower_number`
- `upper_number=''`
- no read → no invented RFID

## 5. Unified stock model
RPC:
`bama_stock_summary()`

Two canonical counters:
1. physical stock;
2. available stock = physical − unfulfilled active order demand.

Create/edit order reduces available immediately. Stage does not double-subtract.

Never use an old protocol stock snapshot as current stock. Always query live via `bama_stock_summary()`.

## 6. Confirmed WORK trial — RAMPE 28
Order:
`34113828-6904-4254-bc85-7c2cd8e8bbd1`

Real partial Nordic flow passed for Bunner + korte/lange.
Both extension confirmations stored 15 hyller + 150 forlengere.
The trial was then cancelled/released and is not active.

## 7. Manual WORK H30 receipt
3 × H30 manually received:
`000012`, `000013`, `000014`.
No fake EPC.

## 8. Vrak outgoing
Server full lifecycle PASS.
Separate UI DEV V2.9.8 provides all-product/Vrak visual progress but is:
- not linked from home;
- not physical PASS;
- not stable.

Do not promote without a separate test and explicit decision.

## 9. Plastic stock
Quantity-only architecture:
- `mottak_quantity_stock`
- `mottak_quantity_stock_events`
- `receive_mottak_quantity_stock(...)`

No RFID/lower is generated for plastic.

## 10. Camera
Last physical rollback PASS:
v4.26.

Current v4.29 remains not fully physically accepted.

## 11. UT Kontor
Current v37 remains preserved; full current acceptance is deferred/unconfirmed.

## 12. Lager Admin — current active development
Protocol:
`LAGER_ADMIN_DEV_PROTOCOL.md`

Current direct entry:
`lager-admin.html`

12.08.2026:
- WORK v2.0 UI deployed;
- server-side Supabase Edge Function `lager-admin-work` v1 ACTIVE;
- Admin-code custom auth is server-side; code is not stored in HTML;
- direct Admin link is not added to scanner-home/Nordic/production navigation;
- changes use manual quantity overlay and do not create fake RFID;
- WORK audit actions: `admin_adjust_work`, `admin_set_work`;
- server/UI deployment did not change stock and created zero WORK admin audit events.

WORK PHYSICAL PASS still pending user test from phone.

## 13. Florivo Android Terminal — ACTIVE TEST DEV
Current protocol:
`FLORIVO_ANDROID_TERMINAL_PROTOCOL.md`

Progress log:
`FLORIVO_ANDROID_TERMINAL_PROGRESS_LOG.md`

Current status 21.08.2026:
- native Kotlin/Jetpack Compose APK builds and installs on real Android phone;
- compact one-screen product UI accepted as direction;
- no NFC gate yet in the current UI-only APK;
- next backend connection must use canonical process-level `mode = 'test'`;
- do not create a new parallel TEST architecture merely because older protocol text used isolated TEST tables;
- production Nordic/stock mutations remain untouched until physical PASS and explicit promotion.

Important: old dedicated `florivo_terminal_test_*` tables/RPCs are legacy prototype infrastructure. They may be used only if explicitly required for migration/diagnostics, not as the canonical future TEST/LIVE architecture.

## 14. Florivo Android Scanner — CONCEPT
Concept protocol:
`FLORIVO_ANDROID_SCANNER_CONCEPT_PROTOCOL.md`

Status:
- architecture / idea;
- scanner is a thin client;
- scanner reads RFID/QR/camera and sends action + factual scan data to server;
- server owns validation, stock/order logic, permissions and audit;
- scanner pairing uses a short-lived one-time QR → pending device → APPROVE/DENY and optional matching control number;
- every scanner gets a revocable server-side `device_id` and permissions;
- no `service_role`, Admin code or permanent universal production secret inside APK.

Critical UT rule:
- `UT Kontor` creates the order;
- customer/recipient/destination data belongs to the server-side UT order;
- Android scanner does not choose or recreate the customer;
- for TIL RAMPE / DISPATCH scanner sends `order_id` + physical RFID/action, and server resolves destination.

## 15. Florivo Inventory / Inventering — ACTIVE DEV
Active protocol:
`FLORIVO_INVENTORY_CONCEPT_PROTOCOL.md`

Next-chat handoff:
`NEXT_CHAT_FLORIVO_INVENTORY.txt`

Current page:
`florivo-inventory-test.html`

Status 23.08.2026:
- Browser TEST implemented and evolved to V0.11;
- real Nordic ID physical UX has been exercised;
- TEST/localStorage only; no Inventory DB and no LIVE mutation yet;
- persistent product mode, duplicate RFID block, MAN-xxx, bilingual UI, compact journal;
- 1 Bunner + Hyller quick 3/4/5 + 30/60;
- Bunner stabel default 10;
- Bunner vrak default 10;
- Forlengere lange/korte store separate `antall forlengere` and `antall hyller` (15/16 quick hyller);
- Bunner uten brikke is manual-only.

New accepted architecture:
- one inventory session is split into physical warehouse zones;
- initial zones: Varemottak, Plukk, Produksjon, Kald, Varm;
- every observation belongs to a zone;
- zone may be recounted/revised without silently overwriting other zones;
- PC reporting must support whole warehouse and per-zone views;
- future warehouse map should follow a real user-supplied floor sketch;
- repeated configuration in a zone may use a persistent current profile/default count, e.g. Produksjon = `1 Bunner + 3 Hyller`, while each RFID remains an individual record.

Safety:
- new Inventory session/process uses `mode='test'|'live'`;
- TEST never affects LIVE stock;
- mismatch becomes AVVIK, not silent mutation;
- any later LIVE correction is separate, audited and human-approved.

Next sequence:
1. Browser zone selection / zone journal / recount UX;
2. per-zone current profile/default count;
3. Nordic physical test;
4. server Inventory schema;
5. PC `INVENTERINGER` with zone map/history;
6. SERVER EXPECTED ↔ FAKTISK / AVVIK;
7. separate audited LIVE correction flow.

## 16. Protocol governance / change-control
Already working production behavior must not be changed on a guess.

Whenever a new project-wide decision is made:
1. record it in the canonical protocol;
2. update this index if status/architecture changed;
3. update the affected subsystem protocol;
4. only then modify code/database behavior.

Do not leave important architecture decisions only in chat.

## 17. Database schema warning
Live schema inspection on 21.08.2026 shows legacy `environment` columns still exist in several operational tables, while `mottak_scans` already contains `is_test`.

Therefore:
- canonical naming for NEW process/workflow design is `mode = test/live`;
- `mottak_scans` tag/product identity uses `is_test`;
- legacy `environment` columns are not to be removed during ordinary feature work;
- a future cleanup/migration must be planned separately so existing WORK logic remains stable.

## 18. Archive status
The 11.08.2026 Nordic session remains closed after:
- Til rampe WORK-default physical PASS;
- real partial RAMPE 28 WORK test;
- Forlengere actual `NNN stk.` display physical PASS;
- protocol synchronization.

Archive snapshot:
`NORDIC_SESSION_ARCHIVE_2026-08-11_2243.md`
