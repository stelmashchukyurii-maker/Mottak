# BaMavaremottak — індекс протоколів проєкту

**Репозиторій:** `stelmashchukyurii-maker/Mottak`  
**Гілка:** `main`  
**Оновлено:** 11.08.2026 08:27 Europe/Oslo

## 1. Start here
For Nordic/RFID:
1. `NEXT_CHAT_NORDIC_ID.txt`
2. `NORDIC_ID_RFID_PROTOCOL.md`
3. `NORDIC_ID_PROGRESS_LOG.md`
4. `NORDIC_TIL_LAGER_DEV_PROTOCOL.md`
5. `NORDIC_TIL_RAMPE_STABLE_LOCK.md` when stable/recovery is relevant.

Historical research:
- `NORDIC_ID_RFID_PROTOCOL_ARCHIVE_2026-08-09.md`
- older docs under `docs/` remain history.

## 2. Current Nordic status
### Outgoing stable
`Nordic ID – Til rampe · STABLE V2.9.7`
- `nordic-id-til-rampe-stable.html`
- frozen source `ed3a19b20efd9af0bf07bc4a079589b3b6038157`
- do not edit/delete.

### Incoming DEV
`Nordic ID – Til lager · DEV V1.0.3`
- entry `nordic-id-til-lager-v103.html`
- TEST first;
- V1.0.2 WORK-hold + last receipt;
- V1.0.3 unified 8-product counters;
- not stable/full physical PASS yet.

Scanner home:
- `📥 TIL LAGER` → V1.0.3
- `📤 TIL RAMPE` → V2.9.7 stable

## 3. Authoritative products
`products.js` v1.3.0.

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
- Vrak bunner = 10 per stack.
- Vrak hyller = 30 per stack.
- all products may go to RAMPE.
- short/long counts only at outgoing.
- CC Post derived/display-only.

## 4. Unified 8-product stock model
RPC:
`public.bama_stock_summary()`

Two canonical counters:
1. physical `in_stock` warehouse;
2. available = physical − still-unfulfilled active ramp orders.

Critical rule:
- order create/edit immediately changes available;
- staging does not double-subtract.

Shared UI:
`stock-summary-8-v1.js`

Current consumers:
- Camera v4.29
- UT Kontor v37
- Til lager V1.0.3

Server tests passed. Current UI versions require physical/browser confirmation.

## 5. Plastic quantity stock
Tables:
- `mottak_quantity_stock`
- `mottak_quantity_stock_events`

RPC:
`receive_mottak_quantity_stock(text,integer,text)`

No RFID or lower number for plastic.
Lifecycle:
- order reservation affects available;
- stage removes physical boxes;
- cancel restores undispatched boxes;
- operational order edit restores/reset;
- non-operational edit preserves lifecycle.

Manual phone receipt UI:
`camera-plast-manual-receipt.js` in current Camera v4.29.

## 6. Vrak / outgoing server support
Server PASS:
- Vrak accepted by Nordic preview/auto scan;
- stage/dispatch validation supports Vrak;
- full transactional Vrak lifecycle passes;
- `bama_order_product_progress(uuid)` returns all-product progress.

Frozen V2.9.7 visual progress predates Vrak. It must not be edited; create/test a separate outgoing DEV for Vrak visual progress.

## 7. Camera
Physical PASS rollback:
- v4.25 LOWER RESET
- v4.26 AUTO SAVE FOCUS

Current unconfirmed:
`Camera Cloud v4.29 · 8 PRODUKTER · PLAST MANUELT MOTTAK`
- `camera-live-v414.html`
- fallback choices for short/long/Vrak;
- 8-product physical/available counters;
- manual plastic receipt.

## 8. UT Kontor
User rule: preserve established layout/behavior.
Current unconfirmed:
`UT Kontor WORKING v37 · 8 PRODUKTER · 2 LAGERTELLERE`
- Norwegian forced at startup;
- Vrak cards additive;
- shared counters refresh after order save/load.

## 9. TEST / WORK architecture
Shared tables, separated by `environment=test/work`:
- mottak_scans
- ut_orders
- ut_order_items
- ut_order_scans
- ut_extra_confirmations
- mottak_stock_events

TEST same EPC repeat allowed; WORK duplicate protection; cross-environment guards; old `ut_test_*` archive only.

## 10. RFID mapping
- full EPC → scanner_code
- last 6 → lower_number
- upper_number = ''
- Camera can have only lower_number.
- never invent RFID when EPC was not read.

## 11. Wedge rules
- short trigger presses;
- do not use CC4Scanner and Wedge simultaneously;
- do not use `inputmode=none` for RFID receiver;
- avoid unconditional blur while RFID input is armed.

## 12. Stock lifecycle
- `in_stock` = physical warehouse
- `staged` = physically on ramp
- `dispatched` = sent

Cancellation/edit must not resurrect dispatched goods.
Always query live DB for current quantities.

## 13. Protocol update rule
After physical PASS or explicit SERVER PASS:
- progress log;
- handoff if current state changes;
- canonical Nordic protocol if architecture changes;
- Til lager DEV protocol during incoming DEV;
- stable lock only when stable contract changes;
- sync this index and `PROTOCOL.md` after major milestones.

Failed experiments are not PASS.

## 14. Next tests
1. Til lager V1.0.3 — TEST counters and WORK-hold.
2. Camera v4.29 — 8 counters + plastic manual receipt UI.
3. UT Kontor v37 — Norwegian + 8 products/counters.
4. Separate outgoing DEV for Vrak progress.
