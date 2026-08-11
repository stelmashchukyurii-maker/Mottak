# Nordic ID – Til rampe · DEV V2.9.8 PROTOCOL

**Створено:** 11.08.2026 08:29 Europe/Oslo  
**Статус:** DEV / НЕ STABLE / НЕ PHYSICAL PASS

## Critical rule
Frozen `Nordic ID – Til rampe · STABLE V2.9.7` remains untouched.
- stable entry: `nordic-id-til-rampe-stable.html`
- frozen source: `ed3a19b20efd9af0bf07bc4a079589b3b6038157`
- do not repoint stable entry to this DEV.

## Why V2.9.8 exists
V2.9.7 was physically confirmed before Vrak products were introduced. Backend now supports Vrak, but the frozen V2.9.7 SMART FOCUS progress panel only knows B/H and Forlengere extras. Therefore:
- backend can scan/stage/dispatch Vrak;
- server blocks false final completion;
- frozen UI may fail to visually list Vrak in ordered/done/remaining/next.

V2.9.8 is a separate compatibility DEV for visual progress across all current products.

## Files
Entry:
- `nordic-id-til-rampe-v298-dev.html`

Progress overlay:
- `nordic-til-rampe-v298-progress.js`

Base loaded inside DEV:
- current `utsending-nordic-test.html` from main.

The wrapper is intentionally NOT linked from `scanner-home.html` yet.

## Server source of truth
RPC:
`public.bama_order_product_progress(uuid)`

Returns per order item:
- product_id
- ordered_quantity
- done_quantity
- remaining_quantity
- unit
- sort_order

Supported rows include:
- bunner
- hyller30
- hyller60
- forlengere_korte
- forlengere_lange
- forlengere_plast
- vrak_bunner
- vrak_hyller

Anon TEST transactional verification passed for Vrak + plastic rows.

## V2.9.8 UI behavior
Overlay repaints `#nidWorkPanel` using the all-product RPC.
It shows:
- ordered / done / remaining for all order items;
- first incomplete product as NEXT;
- Vrak product names instead of raw IDs;
- warning until every ordered product is complete;
- final `Klar på rampe / Готово на рампі` button is visually disabled while any product remains.

It does not alter the RFID scanner engine, INPUT LOCK, COUNT COMPACT, TEST/WORK DB routing or frozen stable files.

## Server safety already verified
- Vrak full cycle transactional PASS: order → Nordic → staged → dispatched.
- stage/dispatch functions validate Vrak.
- plastic lifecycle separately uses quantity stock.
- false completion is server-blocked even on old stable.

## Physical test required before any promotion
Test only through explicit DEV entry, not scanner home:
1. TEST order containing Vrak bunner or Vrak hyller.
2. Open V2.9.8 DEV.
3. Verify Vrak row appears in progress.
4. Verify NEXT points to Vrak when appropriate.
5. Scan/confirm Vrak RFID.
6. Verify row changes done/remaining.
7. Verify final button remains disabled until all products complete.
8. Only after user confirms PASS decide whether to create a NEW stable successor. Never overwrite V2.9.7.
