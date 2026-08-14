# BaMavaremottak — індекс протоколів проєкту

**Репозиторій:** `stelmashchukyurii-maker/Mottak`  
**Гілка:** `main`  
**Оновлено:** 14.08.2026 19:28 Europe/Oslo

## 1. Start here — Nordic/RFID
1. `NEXT_CHAT_NORDIC_ID.txt`
2. `NORDIC_ID_RFID_PROTOCOL.md`
3. `NORDIC_ID_PROGRESS_LOG.md`
4. `NORDIC_TIL_RAMPE_STABLE_LOCK.md`
5. `NORDIC_TIL_LAGER_DEV_PROTOCOL.md`
6. `NORDIC_TIL_RAMPE_V298_DEV_PROTOCOL.md` only when resuming Vrak/all-8 outgoing DEV
7. `NORDIC_SESSION_ARCHIVE_2026-08-11_2243.md` for the closed 11.08 session snapshot.

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
- plastic never gets fake RFID.

## 4. RFID mapping
- full 24 HEX EPC → `scanner_code`
- last 6 → `lower_number`
- `upper_number=''`
- no read → no invented RFID.

## 5. Shared TEST / WORK environment
Common operational tables use `environment=test/work` isolation.
TEST duplicate EPC allowed. WORK duplicate protection remains active.

## 6. Unified stock model
RPC:
`bama_stock_summary()`

Two canonical counters:
1. physical stock;
2. available stock = physical − unfulfilled active order demand.

Create/edit order reduces available immediately. Stage does not double-subtract.

Never use an old protocol stock snapshot as current stock. Always query live via `bama_stock_summary()`.

## 7. Confirmed WORK trial — RAMPE 28
Order:
`34113828-6904-4254-bc85-7c2cd8e8bbd1`

Real partial Nordic flow passed for Bunner + korte/lange.
Both extension confirmations stored 15 hyller + 150 forlengere.
The trial was then cancelled/released and is not active.

## 8. Manual WORK H30 receipt
3 × H30 manually received:
`000012`, `000013`, `000014`.
No fake EPC.

## 9. Vrak outgoing
Server full lifecycle PASS.
Separate UI DEV V2.9.8 provides all-product/Vrak visual progress but is:
- not linked from home;
- not physical PASS;
- not stable.

Do not promote without a separate test and explicit decision.

## 10. Plastic stock
Quantity-only architecture:
- `mottak_quantity_stock`
- `mottak_quantity_stock_events`
- `receive_mottak_quantity_stock(...)`

No RFID/lower is generated for plastic.

## 11. Camera
Last physical rollback PASS:
v4.26.

Current v4.29 remains not fully physically accepted.

## 12. UT Kontor
Current v37 remains preserved; full current acceptance is deferred/unconfirmed.

## 13. Lager Admin — current active development
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

## 14. Florivo Android Scanner — CONCEPT
Concept protocol:
`FLORIVO_ANDROID_SCANNER_CONCEPT_PROTOCOL.md`

Status:
- architecture / idea only;
- no APK yet;
- no pairing API/tables yet;
- no WORK changes;
- does not unfreeze Nordic production.

Core concept:
- Android Scanner is a thin client;
- scanner reads RFID/QR/camera and sends action + factual scan data to server;
- server owns validation, stock/order logic, permissions and audit;
- scanner pairing uses a short-lived one-time QR → pending device → APPROVE/DENY and optional matching control number;
- every scanner gets a revocable server-side `device_id` and permissions;
- no `service_role`, Admin code or permanent universal production secret inside APK.

Critical UT rule:
- `UT Kontor` creates the order;
- customer/recipient/destination data belongs to the server-side UT order;
- Android scanner does **not** choose or recreate the customer;
- for TIL RAMPE / DISPATCH scanner sends `order_id` + physical RFID/action, and server resolves who/where the order is for.

First recommended future stage only after explicit user decision:
`Android V0.1 — DEVICE + RFID LAB`, without production stock writes.

## 15. Florivo Inventory / Inventering — CONCEPT
Concept protocol:
`FLORIVO_INVENTORY_CONCEPT_PROTOCOL.md`

Next-chat handoff:
`NEXT_CHAT_FLORIVO_INVENTORY.txt`

Status:
- concept / TEST design only;
- Browser TEST not yet implemented;
- no inventory DB tables yet;
- no WORK changes;
- no Android inventory implementation yet.

Core concept:
- monthly/periodic physical warehouse count in a separate inventory session;
- inventory session records what is physically seen without automatically changing WORK-stock;
- Bunner stack defaults to 10 but is editable;
- Bunner + Hyller records the actual physical shelf count, including non-standard counts such as 57;
- duplicate RFID within one session must not count twice;
- broken/missing tag uses manual `MAN-xxx` inventory reference plus a physical sticker/mark on the counted asset;
- unknown RFID or server-state mismatch is recorded as physical evidence and becomes an AVVIK, not an automatic stock mutation;
- session completion compares SERVER FORVENTET ↔ FAKTISK TELT and creates discrepancy groups;
- any later WORK correction must be a separate audited, human-approved step.

Development rule:
- first implementation must be a separate Browser TEST form;
- do not experiment inside frozen Nordic WORK production forms;
- only after Browser PHYSICAL PASS should successful inventory UX/logic move into Florivo Android Scanner as `📋 INVENTERING`.

## 16. Change-control rule
Already working production behavior must not be changed on a guess. Explain the problem first and get explicit user authorization.

## 17. Archive status
The 11.08.2026 Nordic session remains closed after:
- Til rampe WORK-default physical PASS;
- real partial RAMPE 28 WORK test;
- Forlengere actual `NNN stk.` display physical PASS;
- protocol synchronization.

Archive snapshot:
`NORDIC_SESSION_ARCHIVE_2026-08-11_2243.md`
