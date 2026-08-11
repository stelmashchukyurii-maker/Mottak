# Nordic ID RFID — АКТУАЛЬНИЙ КАНОНІЧНИЙ ПРОТОКОЛ

**Проєкт:** BaMavaremottak / AI Scanner Mottak  
**Оновлено:** 11.08.2026 08:25 Europe/Oslo  
**Статус:** ГОЛОВНИЙ Nordic ID / RFID канон  
**Handoff:** `NEXT_CHAT_NORDIC_ID.txt`  
**Til lager DEV:** `NORDIC_TIL_LAGER_DEV_PROTOCOL.md`  
**Historical snapshot:** `NORDIC_ID_RFID_PROTOCOL_ARCHIVE_2026-08-09.md`

> Перед Nordic/RFID змінами читати handoff, цей файл, progress log і Til lager DEV protocol. Якщо змінюється stable contract — також `NORDIC_TIL_RAMPE_STABLE_LOCK.md`.

## 1. Frozen outgoing stable
`Nordic ID – Til rampe · STABLE V2.9.7`
- entry: `nordic-id-til-rampe-stable.html`
- frozen source: `ed3a19b20efd9af0bf07bc4a079589b3b6038157`
- stable-entry commit: `f049f5c568dd592f64c8cfadbd416622e5c5fc9d`
- НЕ ПЕРЕПИСУВАТИ / НЕ ВИДАЛЯТИ.

Physical TEST PASS already includes hidden RFID engine, 24 HEX EPC, 600 ms lock, TEST/WORK, SMART FOCUS, INPUT LOCK, COUNT COMPACT and outgoing short/long counts.

New product compatibility is added server-side, but frozen V2.9.7 visual progress predates Vrak. Server prevents false completion; Vrak visual progress must be developed in a separate outgoing DEV, not by changing stable.

## 2. Scanner home
Current operator choices:
- `📥 TIL LAGER` → `nordic-id-til-lager-v103.html` → DEV V1.0.3.
- `📤 TIL RAMPE` → frozen stable V2.9.7.

Historical V2.4/V2.1 and outgoing DEV remain hidden from home.

## 3. RFID mapping
- full 24-char EPC → `scanner_code`
- last 6 uppercase → `lower_number`
- `upper_number=''`
- Camera fallback may have `scanner_code=''` and only lower number.
- no EPC read → never invent RFID.

## 4. Nordic Wedge baseline
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

## 5. TEST / WORK architecture
Shared tables separated by `environment=test/work`:
- mottak_scans
- ut_orders
- ut_order_items
- ut_order_scans
- ut_extra_confirmations
- mottak_stock_events

TEST header: `x-bama-environment:test`.
WORK/default production: work.
TEST duplicate EPC allowed; WORK duplicate protection; cross-environment links guarded; old `ut_test_*` are archive/rollback.

## 6. Authoritative products
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
- plastic is quantity-only; never fake RFID.

## 7. Unified stock model — canonical rule
RPC: `public.bama_stock_summary()`.

Two counters everywhere:
1. **physical warehouse** = current physical `in_stock` quantity;
2. **available warehouse** = physical warehouse minus the still-unfulfilled quantity of active ramp orders.

Critical behavior:
- create/edit an order → available changes immediately;
- physically staging a unit → physical decreases and order_remaining decreases together, so no double subtraction;
- shortage is explicit if active demand exceeds physical stock.

The same 8-product summary is the source for Camera, UT Kontor and Til lager through `stock-summary-8-v1.js`.

Server transactional PASS confirms reservation math and no double subtraction.

## 8. Plastic quantity stock
`forlengere_plast` uses:
- `mottak_quantity_stock`
- `mottak_quantity_stock_events`

Manual receipt RPC:
`receive_mottak_quantity_stock(text,integer,text)`.

WORK lifecycle:
- order reserves availability;
- stage deducts physical boxes;
- cancel before dispatch returns boxes;
- operational order edit returns staged boxes and resets lifecycle;
- recipient/transporter/note edit does not move goods.

Phone manual receipt UI is current Camera v4.29. No RFID/lower number is created for plastic.

## 9. Vrak / all-product outgoing server model
Server support:
- `private.nordic_preview` handles Vrak.
- `nordic_auto_scan` stages Vrak stock.
- `stage_ut_order` / `confirm_ut_dispatch` validate Vrak RFID.
- `bama_order_product_progress(uuid)` returns ordered/done/remaining for all order products.

Transactional Vrak full flow passed.

Frozen stable visual progress still needs a separate DEV successor before Vrak UI can be declared ready.

## 10. Nordic ID – Til lager
Current entry: `nordic-id-til-lager-v103.html` — DEV V1.0.3.

Physical evidence already proves base TEST RFID writes for H60, Bunner, Forlengere lange, Vrak hyller and Vrak bunner.

V1.0.3 adds:
- V1.0.2 1.5 s WORK hold + selected-product arrival card;
- unified 8-product physical/available counters.

WORK logic:
- different-product lower collision → block;
- existing full RFID → block by lifecycle/duplicate rules;
- same-product Camera row with empty scanner_code/in_stock → enrich existing row with full EPC, preserve photo;
- staged/dispatched → block;
- missing → create verified/in_stock.

V1.0.3 not yet full physical PASS/stable.

## 11. Camera
Physical rollback PASS:
- v4.25 LOWER RESET
- v4.26 AUTO SAVE FOCUS

Current unconfirmed Camera v4.29:
- fallback product choices for short/long/Vrak;
- unified 8-product counters;
- manual plastic receipt panel.

Do not call v4.29 PASS until user physically confirms it.

## 12. UT Kontor
User rule: preserve existing layout/behavior.
Current unconfirmed `UT Kontor WORKING v37`:
- Norwegian forced at startup;
- 8 product order cards;
- two unified stock counters;
- stock summary refreshes after order save/load.

## 13. WORK unknown RFID on outgoing
If EPC exists + available stock row → reuse.
If staged/unavailable → block/warn.
If EPC read but row missing → offer register now + continue current RAMPE.
If EPC not read → no fake number.

## 14. If user says “дивись журнал”
Immediately query current environment rows and relevant order/scans/extras/logs. Do not ask user to copy logs manually.

## 15. Protocol update rule
After confirmed physical or explicit SERVER PASS:
- `NORDIC_ID_PROGRESS_LOG.md`
- `NEXT_CHAT_NORDIC_ID.txt` when state changes
- this canonical file when architecture changes
- `NORDIC_TIL_LAGER_DEV_PROTOCOL.md` during incoming DEV
- stable lock only if stable contract changes
- major milestone → sync `PROTOCOL.md` and `PROTOCOLS.md`.
Failed experiments are not PASS.

## 16. Immediate physical sequence
1. Til lager V1.0.3 — verify TEST counters and WORK-hold without accidental WORK receipt.
2. Camera v4.29 — visually verify 8 counters and plastic manual receipt panel; only add real plastic deliberately.
3. UT Kontor v37 — verify Norwegian + 8 products/counters; do not create real order unless deliberate.
4. Prepare/test separate outgoing DEV with Vrak progress. Frozen V2.9.7 remains untouched.
