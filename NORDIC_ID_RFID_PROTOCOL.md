# Nordic ID RFID — АКТУАЛЬНИЙ КАНОНІЧНИЙ ПРОТОКОЛ

**Проєкт:** BaMavaremottak / AI Scanner Mottak  
**Оновлено:** 11.08.2026 22:43 Europe/Oslo  
**Статус:** ГОЛОВНИЙ Nordic ID / RFID канон  
**Handoff:** `NEXT_CHAT_NORDIC_ID.txt`  
**Session archive:** `NORDIC_SESSION_ARCHIVE_2026-08-11_2243.md`  
**Til lager DEV:** `NORDIC_TIL_LAGER_DEV_PROTOCOL.md`  
**Til rampe lock:** `NORDIC_TIL_RAMPE_STABLE_LOCK.md`  
**Til rampe Vrak DEV:** `NORDIC_TIL_RAMPE_V298_DEV_PROTOCOL.md`

> Перед Nordic/RFID змінами читати handoff, цей файл, progress log і відповідний DEV/lock protocol. Уже робочу production-поведінку не міняти без попереднього пояснення користувачу й окремого дозволу.

## 1. Operational scanner home — WORK default
Current `scanner-home.html` is the operator entry.

Visible production choices:
- `📥 TIL LAGER · WORK` → `nordic-id-til-lager-v104.html`
- `📤 TIL RAMPE · WORK` → `nordic-id-til-rampe-work-default.html`

Home visibly says `WORK ER STANDARD · REAL DATABASE`.

User decision:
- WORK is default for both Nordic operations;
- TEST remains available manually inside each form when needed.

Latest scanner-home commit:
`8b61e3a0626edc63358fa0ff17e695cb090213e7`

## 2. Frozen outgoing application logic
Official outgoing application:
`Nordic ID – Til rampe · V2.9.7`

Frozen source:
- file `utsending-nordic-test.html`
- commit `ed3a19b20efd9af0bf07bc4a079589b3b6038157`

Do not rewrite/remove frozen RFID/confirm/count-entry/staging/dispatch logic.

Physical V2.9.7 behavior already confirmed:
- hidden Nordic Wedge RFID engine;
- full 24-char HEX EPC;
- 600 ms first-tag lock;
- SMART FOCUS;
- INPUT LOCK;
- COUNT COMPACT;
- ordered / done / remaining / next;
- Bunner / H30 / H60 confirm;
- short/long counts entered at outgoing;
- TEST duplicate RFID allowed;
- WORK duplicate protection.

## 3. Til rampe WORK-default operational wrapper — PHYSICAL PASS
Entry:
`nordic-id-til-rampe-work-default.html`

The wrapper:
- fetches the exact frozen V2.9.7 source;
- starts `MODE=work`;
- keeps TEST button available;
- does not automatically scan or dispatch anything.

Physical evidence 11.08.2026:
- Nordic photo showed WORK active immediately;
- RAMPE 28 opened normally;
- partial real WORK order flow worked.

Status:
**PHYSICAL PASS.**

## 4. Forlengere piece-count display — PHYSICAL PASS
Display-only overlay:
`nordic-til-rampe-extension-count-display-v1.js`

Source of truth:
`public.ut_extra_progress(order_id)` → actual `forlengere_count`.

For RAMPE 28 the DB contained:
- korte: `hyller_count=15`, `forlengere_count=150`
- lange: `hyller_count=15`, `forlengere_count=150`

The overlay shows actual `NNN stk.` in the Nordic progress row. It does not write data and does not change frozen outgoing business logic.

User confirmation at session close:
**“Продовжувачі готові.”**

Status:
**PHYSICAL PASS.**

Dedicated record:
`NORDIC_TIL_RAMPE_EXTENSION_COUNT_DISPLAY_2026-08-11.md`

## 5. Til lager — current operational DEV V1.0.4
Entry:
`nordic-id-til-lager-v104.html`

Composition:
- base Nordic incoming RFID flow;
- V1.0.2 UI/stock fixes;
- unified 8-product stock counters;
- wrapper calls existing `setEnv("work")` at startup.

WORK is default; TEST remains manual fallback.

Base WORK receipt path is proven in real DB: many rows exist with `source='nordic_id'`, `device_id='NORDIC-ID'`, `environment='work'`, `verified/in_stock`.

However the specific V1.0.4 **visual WORK-default startup** still has no explicit user confirmation after the final wrapper change. Do not label that startup UI PASS until confirmed on the device.

## 6. RFID mapping
- full 24-char EPC → `scanner_code`
- last 6 uppercase → `lower_number`
- `upper_number=''`
- Camera/manual fallback may have `scanner_code=''` and only lower number.
- no EPC read → never invent RFID.

Manual WORK receipt without EPC is allowed only as an explicit manual stock action; do not fabricate scanner_code.

## 7. Nordic Wedge baseline
`RFID → Nordic ID → RFID Wedge Service → keyboard → Chrome → page`

Baseline:
- short trigger presses;
- Automatic start OFF;
- Re-trigger = Cancel current operation;
- Long press OFF;
- Hex string;
- UTF-8;
- LF;
- prefix/postfix empty;
- Inventory;
- max tags 0;
- timeout 0;
- do not run CC4Scanner and Wedge together;
- do not use `inputmode=none` on RFID receiver.

## 8. TEST / WORK architecture
Shared production tables are separated by `environment=test/work`:
- `mottak_scans`
- `ut_orders`
- `ut_order_items`
- `ut_order_scans`
- `ut_extra_confirmations`
- `mottak_stock_events`
- quantity stock tables for plastic/manual overlay.

TEST header:
`x-bama-environment:test`

WORK/default legacy browser:
`work`

TEST repeated EPC allowed; WORK duplicate protection; cross-environment guards remain mandatory.

## 9. Authoritative products
`products.js` v1.3.0.

RFID:
- `bunner`
- `hyller30`
- `hyller60`
- `forlengere_korte`
- `forlengere_lange`
- `vrak_bunner`
- `vrak_hyller`

No RFID:
- `forlengere_plast`

Rules:
- Vrak bunner = 1 RFID stack = 10.
- Vrak hyller = 1 RFID stack = 30.
- all products may be ordered to RAMPE.
- short/long `hyller_count` + `forlengere_count` are entered only at outgoing confirmation.
- plastic = quantity-only/manual boxes; never fake RFID.

## 10. Unified two-counter stock model
RPC:
`public.bama_stock_summary()`

Canonical counters:
1. physical warehouse = current stock;
2. available warehouse = physical minus unfulfilled active RAMPE order demand.

Required behavior:
- create/edit order changes available immediately;
- stage does not double-subtract;
- shortage explicit when demand exceeds physical.

Shared UI module:
`stock-summary-8-v1.js`

## 11. WORK baseline history and current-stock rule
11.08.2026 user confirmed old physical WORK stock had already shipped manually. 35 old `verified + in_stock` RFID rows were corrected to `dispatched` with audit marker:
`created_by='chatgpt_admin_bulk_2026-08-11'`.

Milestone:
`WORK_STOCK_BASELINE_RESET_2026-08-11.md`

After that, new real WORK stock was received. Therefore **never quote the old zero baseline as current stock**.
Always query live `bama_stock_summary()`.

Archive-time snapshot 11.08.2026 22:43 Europe/Oslo:
- Bunner 25
- Hyller x30 3
- Hyller x60 20
- Forlengere korte 4
- Forlengere lange 4
- Forlengere plast 0
- Vrak bunner 0
- Vrak hyller 2
- on-ramp 0 and order_remaining 0 for all 8 at that snapshot.

This is an archive snapshot, not a permanent future stock value.

## 12. Manual H30 receipt confirmed
3 × Hyller x30 were explicitly received manually in WORK with lower numbers:
- `000012`
- `000013`
- `000014`

Contract:
- `source='manual'`
- `scanner_code=''`
- `verified/in_stock`
- no fake EPC.

## 13. RAMPE 28 real WORK trial — PHYSICAL PARTIAL PASS, then cancelled
Order:
`34113828-6904-4254-bc85-7c2cd8e8bbd1`
Ramp:
`28`

Created with quantity 1 of all 8 products.

Physical Nordic partial progress confirmed:
- Bunner 1/1
- Forlengere korte 1/1
- Forlengere lange 1/1
- H30/H60/plastic still incomplete in screenshot.

Actual outgoing extension confirmations:
- korte: 15 hyller + 150 forlengere
- lange: 15 hyller + 150 forlengere.

The trial was later cancelled/released. Archive verification:
- order status `cancelled`;
- one historical Bunner order scan remains;
- extension confirmations are released;
- `on_ramp_count=0`.

Do not treat RAMPE 28 as an active order.

## 14. Vrak outgoing compatibility — DEFERRED DEV
Server already supports Vrak full lifecycle and blocks false completion.

Separate UI DEV:
`Nordic ID – Til rampe · DEV V2.9.8`
- entry `nordic-id-til-rampe-v298-dev.html`
- all-product/Vrak progress overlay
- NOT linked from scanner home
- NOT physical PASS
- NOT stable.

Do not promote without separate physical test and explicit user decision.

## 15. Plastic quantity stock
`forlengere_plast` uses:
- `mottak_quantity_stock`
- `mottak_quantity_stock_events`

Manual receipt RPC:
`receive_mottak_quantity_stock(text,integer,text)`

Lifecycle reservation/stage/cancel/edit has server PASS.
No RFID/lower is generated for plastic.

## 16. Camera state
Last physical rollback PASS:
- v4.25 LOWER RESET
- v4.26 AUTO SAVE FOCUS

Current Camera v4.29 includes:
- short/long/Vrak fallback choices;
- unified 8-product counters;
- manual plastic receipt.

V4.29 remains **not fully physically accepted** in this session.

## 17. UT Kontor state
Current:
`UT Kontor WORKING v37`

Intended preserved behavior:
- Norwegian startup;
- 8 product cards;
- two unified counters;
- refresh after load/save.

Full current v37 acceptance remains **deferred/unconfirmed**.

## 18. Lager Admin state — DEFERRED
`lager-admin.html` / `admin-admin.html`

TEST-only DEV UI load was physically visible. Mutation UI was not physically tested. WORK is server-locked.

User explicitly deferred this task on 11.08.2026.
Do not resume unless user asks.

## 19. WORK unknown RFID outgoing
Existing available row → reuse.
Staged/unavailable → block/warn.
EPC read but missing row → register now + continue current RAMPE.
No EPC → no fake number.

## 20. “дивись журнал”
Immediately query relevant live TEST/WORK stock/order/scans/extras/log data. Do not ask user to copy logs manually.

## 21. Protocol update rule
After physical PASS or explicit SERVER PASS:
- update permanent progress log;
- update handoff when state changes;
- update canonical architecture;
- update appropriate DEV/lock protocol;
- major milestone → sync `PROTOCOL.md` and `PROTOCOLS.md`;
- failed experiments never enter success log.

## 22. Deferred next work after this archive
No urgent unfinished action is required for the completed Forlengere display / Til rampe WORK-default flow.

Explicit deferred items:
1. physically confirm `Til lager V1.0.4` opens directly in WORK after final wrapper change;
2. physically test V2.9.8 Vrak/all-8 outgoing UI before any promotion;
3. Camera v4.29 acceptance;
4. UT Kontor v37 acceptance;
5. Lager Admin only if user reopens that task.

Session closure snapshot:
`NORDIC_SESSION_ARCHIVE_2026-08-11_2243.md`
