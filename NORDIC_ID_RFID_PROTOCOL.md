# Nordic ID RFID — АКТУАЛЬНИЙ КАНОНІЧНИЙ ПРОТОКОЛ

**Проєкт:** BaMavaremottak / AI Scanner Mottak  
**Оновлено:** 11.08.2026 08:31 Europe/Oslo  
**Статус:** ГОЛОВНИЙ Nordic ID / RFID канон  
**Handoff:** `NEXT_CHAT_NORDIC_ID.txt`  
**Til lager DEV:** `NORDIC_TIL_LAGER_DEV_PROTOCOL.md`  
**Til rampe DEV:** `NORDIC_TIL_RAMPE_V298_DEV_PROTOCOL.md`  
**Historical snapshot:** `NORDIC_ID_RFID_PROTOCOL_ARCHIVE_2026-08-09.md`

> Перед Nordic/RFID змінами читати handoff, цей файл, progress log і відповідний DEV protocol. Якщо змінюється stable contract — також `NORDIC_TIL_RAMPE_STABLE_LOCK.md`.

## 1. Frozen outgoing stable
`Nordic ID – Til rampe · STABLE V2.9.7`
- entry `nordic-id-til-rampe-stable.html`
- frozen source `ed3a19b20efd9af0bf07bc4a079589b3b6038157`
- stable-entry commit `f049f5c568dd592f64c8cfadbd416622e5c5fc9d`
- НЕ ПЕРЕПИСУВАТИ / НЕ ВИДАЛЯТИ / НЕ REPOINT.

Physical TEST PASS includes hidden RFID engine, 24 HEX EPC, 600 ms lock, TEST/WORK, SMART FOCUS, INPUT LOCK, COUNT COMPACT and short/long outgoing counts.

## 2. Separate outgoing DEV for new products
`Nordic ID – Til rampe · DEV V2.9.8`
- entry `nordic-id-til-rampe-v298-dev.html`
- overlay `nordic-til-rampe-v298-progress.js`
- protocol `NORDIC_TIL_RAMPE_V298_DEV_PROTOCOL.md`
- NOT linked from scanner home;
- NOT physical PASS / NOT stable.

Reason: frozen V2.9.7 progress panel predates Vrak. Backend already supports Vrak and blocks false final completion, while V2.9.8 DEV visually uses `bama_order_product_progress(uuid)` for all product rows and guards the final ramp action while anything remains.

Never overwrite V2.9.7 with V2.9.8. If V2.9.8 later passes, create a new stable successor separately.

## 3. Scanner home
Current operator choices:
- `📥 TIL LAGER` → `nordic-id-til-lager-v103.html` → DEV V1.0.3.
- `📤 TIL RAMPE` → frozen stable V2.9.7.

Historical V2.4/V2.1 and all outgoing DEV pages remain hidden from home.

## 4. RFID mapping
- full 24-char EPC → `scanner_code`
- last 6 uppercase → `lower_number`
- `upper_number=''`
- Camera fallback may have `scanner_code=''` and only lower number.
- no EPC read → never invent RFID.

## 5. Nordic Wedge baseline
`RFID → Nordic ID → RFID Wedge Service → keyboard → Chrome → page`
- short trigger presses;
- Automatic start OFF;
- Re-trigger Cancel current operation;
- Long press OFF;
- Hex string / UTF-8 / LF;
- empty prefix/postfix;
- Inventory, max tags 0, timeout 0;
- do not run CC4Scanner and Wedge together;
- do not use `inputmode=none` on RFID receiver.

## 6. TEST / WORK architecture
Shared tables separated by `environment=test/work`:
- mottak_scans
- ut_orders
- ut_order_items
- ut_order_scans
- ut_extra_confirmations
- mottak_stock_events

TEST header `x-bama-environment:test`; WORK/default production = work.
TEST repeated EPC allowed; WORK duplicate protection; cross-environment guards; old `ut_test_*` archive only.

## 7. Authoritative products
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
- Vrak bunner = 10 per RFID stack.
- Vrak hyller = 30 per RFID stack.
- all products can go to RAMPE.
- short/long counts only at outgoing.
- plastic = quantity-only; never fake RFID.

## 8. Unified stock model
RPC `public.bama_stock_summary()`.

Canonical counters:
1. physical warehouse = current `in_stock`;
2. available warehouse = physical minus still-unfulfilled active ramp orders.

Required behavior:
- create/edit order immediately changes available;
- physically stage unit → physical and remaining demand both decrease, so no double subtraction;
- shortage explicit when demand exceeds physical.

Shared UI module `stock-summary-8-v1.js` is used by current Camera v4.29, UT Kontor v37 and Til lager V1.0.3.

Transactional server PASS confirms the math and TEST/WORK isolation.

## 9. Plastic quantity stock
`forlengere_plast` uses:
- `mottak_quantity_stock`
- `mottak_quantity_stock_events`

Manual receipt RPC:
`receive_mottak_quantity_stock(text,integer,text)`.

Lifecycle:
- order reserves availability;
- stage deducts physical boxes;
- cancel before dispatch returns boxes;
- operational item/ramp edit returns staged boxes + resets;
- recipient/transporter/note edit does not move goods.

Current phone manual receipt UI: Camera v4.29 / `camera-plast-manual-receipt.js`.
No RFID or lower_number is created for plastic.

## 10. Vrak/all-product outgoing server model
- `private.nordic_preview` handles Vrak.
- `nordic_auto_scan` stages Vrak.
- `stage_ut_order` / `confirm_ut_dispatch` validate Vrak RFID.
- `bama_order_product_progress(uuid)` returns ordered/done/remaining for all order product rows.

Transactional full Vrak order → Nordic → staged → dispatched passed.

## 11. Nordic ID – Til lager
Current `nordic-id-til-lager-v103.html` — DEV V1.0.3.

Base TEST RFID write is physically evidenced in DB for H60, Bunner, Forlengere lange, Vrak hyller, Vrak bunner.

V1.0.3 composition:
- base V1.0.1 RFID intake;
- V1.0.2 WORK-hold + last receipt card;
- unified 8-product physical/available counters.

WORK merge:
- different-product lower collision → block;
- full existing RFID → lifecycle/duplicate block;
- same product Camera row with empty scanner_code/in_stock → enrich existing row with EPC, preserve photo;
- staged/dispatched → block;
- missing → verified/in_stock insert.

V1.0.3 not full physical PASS/stable yet.

## 12. Camera
Physical rollback PASS:
- v4.25 LOWER RESET
- v4.26 AUTO SAVE FOCUS

Current unconfirmed Camera v4.29:
- short/long/Vrak fallback choices;
- two unified 8-product counters;
- manual plastic receipt panel.

## 13. UT Kontor
Preserve established layout/behavior.
Current unconfirmed `UT Kontor WORKING v37`:
- forced Norwegian startup;
- 8 product cards;
- two unified counters;
- stock summary refresh after save/load.

## 14. WORK unknown RFID outgoing
Existing available row → reuse.
Staged/unavailable → block/warn.
EPC read but missing row → register now + continue current RAMPE.
No EPC → no fake number.

## 15. “дивись журнал”
Immediately query relevant TEST/WORK stock/order/scans/extras/log data; do not ask user to copy logs manually.

## 16. Protocol update rule
After physical PASS or explicit SERVER PASS:
- progress log;
- handoff when state changes;
- canonical architecture;
- appropriate DEV protocol;
- stable lock only if stable contract changes;
- major milestone → sync `PROTOCOL.md` and `PROTOCOLS.md`.
Failed experiments are not PASS.

## 17. Immediate test order
1. Til lager V1.0.3 — TEST counters + WORK-hold.
2. Camera v4.29 — 8 counters + plastic manual receipt panel.
3. UT Kontor v37 — Norwegian + 8 products/counters.
4. Explicit V2.9.8 DEV with a TEST Vrak order; never route production home to it before PASS.
