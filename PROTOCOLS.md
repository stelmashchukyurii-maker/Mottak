# BaMavaremottak — індекс протоколів проєкту

**Репозиторій:** `stelmashchukyurii-maker/Mottak`  
**Гілка:** `main`  
**Оновлено:** 11.08.2026 08:33 Europe/Oslo

## 1. Start here
For Nordic/RFID:
1. `NEXT_CHAT_NORDIC_ID.txt`
2. `NORDIC_ID_RFID_PROTOCOL.md`
3. `NORDIC_ID_PROGRESS_LOG.md`
4. `NORDIC_TIL_LAGER_DEV_PROTOCOL.md`
5. `NORDIC_TIL_RAMPE_V298_DEV_PROTOCOL.md` when testing new outgoing compatibility
6. `NORDIC_TIL_RAMPE_STABLE_LOCK.md` for frozen stable/recovery.

Historical Nordic: `NORDIC_ID_RFID_PROTOCOL_ARCHIVE_2026-08-09.md`.
Older `docs/` files remain historical.

## 2. Current Nordic entries
### Frozen outgoing stable
`Nordic ID – Til rampe · STABLE V2.9.7`
- `nordic-id-til-rampe-stable.html`
- frozen source `ed3a19b20efd9af0bf07bc4a079589b3b6038157`
- do not edit/delete/repoint.

### Outgoing compatibility DEV
`Nordic ID – Til rampe · DEV V2.9.8`
- `nordic-id-til-rampe-v298-dev.html`
- all-product/Vrak progress overlay;
- not linked from home;
- not physical PASS/stable.

### Incoming DEV
`Nordic ID – Til lager · DEV V1.0.3`
- `nordic-id-til-lager-v103.html`
- TEST first;
- current full wrapper not physical PASS/stable.

### Scanner home
- `📥 TIL LAGER` → V1.0.3
- `📤 TIL RAMPE` → frozen V2.9.7

## 3. Products
`products.js` v1.3.0.
RFID: bunner, hyller30, hyller60, forlengere_korte, forlengere_lange, vrak_bunner, vrak_hyller.
No RFID: forlengere_plast.
Vrak bunner = 10/stack; Vrak hyller = 30/stack; short/long counts only outgoing; all products may go to RAMPE.

## 4. Unified stock model
RPC `bama_stock_summary()`.
Two canonical counters:
1. physical `in_stock`;
2. available = physical − unfulfilled active ramp-order demand.

Order create/edit changes available immediately. Staging does not double-subtract.
Shared UI module `stock-summary-8-v1.js`.
Current unconfirmed consumers: Camera v4.29, UT Kontor v37, Til lager V1.0.3.

## 5. Plastic quantity stock
Tables:
- `mottak_quantity_stock`
- `mottak_quantity_stock_events`
RPC `receive_mottak_quantity_stock(text,integer,text)`.
Plastic has no RFID and never receives a fake number.
Reservation/stage/cancel/edit lifecycle server-tested.
Manual phone receipt UI: `camera-plast-manual-receipt.js` in Camera v4.29.

## 6. Vrak outgoing
Server PASS:
- Vrak Nordic scan/stage/dispatch full cycle;
- `bama_order_product_progress(uuid)` exposes all-product progress.
Frozen V2.9.7 progress predates Vrak; server prevents false final completion. V2.9.8 DEV supplies visual Vrak progress for testing.

## 7. Camera
Physical rollback PASS: v4.25 and v4.26.
Current unconfirmed `Camera Cloud v4.29`:
- fallback short/long/Vrak;
- two 8-product counters;
- manual plastic receipt.

## 8. UT Kontor
Preserve existing layout/behavior.
Current unconfirmed `UT Kontor WORKING v37`:
- Norwegian startup;
- 8 product cards;
- two unified counters;
- refresh after order save/load.

## 9. Til lager
Base TEST RFID writes already evidenced in DB for multiple products including Vrak.
V1.0.3 adds WORK-hold/last receipt + shared counters; full physical confirmation pending.

## 10. TEST / WORK and RFID
Shared environment-separated tables; TEST duplicate EPC allowed, WORK protected.
RFID: full EPC → scanner_code; last 6 → lower_number; upper_number=''. Camera may have only lower_number. Never invent RFID.

## 11. Wedge rules
Short trigger presses. Do not run CC4Scanner with Wedge. Do not use inputmode=none. Do not blur armed hidden RFID receiver.

## 12. Lifecycle
`in_stock` → `staged` → `dispatched`.
Cancel/edit must not resurrect dispatched goods.
Always read current stock from live DB.

## 13. Protocol update rule
After physical PASS or explicit SERVER PASS update progress/handoff/canonical/appropriate DEV protocol; stable lock only if stable contract changes; sync project summaries after major milestones. Failed experiments are never PASS.

## 14. Next physical sequence
1. Til lager V1.0.3 — TEST counters + WORK hold.
2. Camera v4.29 — counters + plastic manual receipt panel.
3. UT Kontor v37 — Norwegian + 8 products/counters.
4. V2.9.8 DEV — TEST Vrak progress/final guard.
