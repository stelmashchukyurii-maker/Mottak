# Nordic ID – Til lager · DEV PROTOCOL

**Проєкт:** BaMavaremottak / AI Scanner Mottak  
**Оновлено:** 11.08.2026 21:28 Europe/Oslo  
**Статус:** DEV V1.0.4 / WORK DEFAULT — НЕ STABLE

## Незмінні правила
- `Nordic ID – Til rampe · V2.9.7` RFID/confirm/count/progress logic не переписувати без окремого рішення користувача.
- `Til lager` розробляється окремо.
- Повний `Til lager` PASS записувати тільки після фізичного підтвердження користувачем.
- RFID products use `mottak_scans`; `forlengere_plast` uses quantity-only stock, never fake RFID.

## Current operational entry — DEV V1.0.4
Entry:
- `nordic-id-til-lager-v104.html`

Scanner home points to V1.0.4.

Composition:
1. base `nordic-id-til-lager-test.html` receipt/RFID flow;
2. `nordic-til-lager-v102-fix.js`;
3. `stock-summary-8-v1.js`;
4. wrapper calls existing `setEnv("work")` immediately after load.

### USER DECISION — WORK DEFAULT
11.08.2026 21:28 user explicitly requested that Nordic `Til lager` open directly in WORK because switching on the scanner is inconvenient.

Result:
- WORK is the default startup environment;
- TEST remains available by the existing TEST button;
- base TEST file is preserved unchanged;
- no RFID/receipt business logic was rewritten;
- physical confirmation on the Nordic device is still pending.

### RFID flow retained
- product selection persists;
- hidden RFID input readonly idle;
- `Unidentified` hardware trigger arms input;
- 24 HEX EPC;
- 600 ms lock;
- scan → product + lower 6 → confirm;
- success → `PÅ LAGER` → READY;
- WORK duplicate protections retained.

### Unified 8-product counters
Module `stock-summary-8-v1.js` reads server RPC `bama_stock_summary()`.
Shows:
1. physical warehouse;
2. available warehouse = physical minus unfulfilled active ramp-order demand.

## WORK Camera merge rule
- same lower + different product → block;
- existing full RFID → duplicate/status block;
- same product + Camera row with empty `scanner_code` + `in_stock` → enrich same row;
- staged/dispatched → block;
- missing row → create verified/in_stock WORK row.

## Products
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
- Vrak bunner = 1 RFID stack = 10.
- Vrak hyller = 1 RFID stack = 30.
- all products can go to RAMPE.
- short/long Hyller/Forlengere counts only at outgoing.

## Historical WORK baseline
11.08.2026 14:47 old physically shipped stock was bulk-corrected to dispatched: 35 RFID rows, TEST untouched. Canonical milestone: `WORK_STOCK_BASELINE_RESET_2026-08-11.md`.

Do not assume current stock is zero: new WORK receipts were created after that reset. Query `bama_stock_summary()` live before quoting stock.

## Physical evidence already confirmed
Base Til lager RFID write path was physically used in TEST and DB-confirmed for several products. V1.0.4 WORK-default startup itself is not yet physically confirmed.

## Next physical check
1. Refresh `scanner-home.html`.
2. Open `📥 TIL LAGER`.
3. Expected: top mode is already WORK without hold/confirmation.
4. Confirm visible WORK state before scanning.
5. Scan one intended real RFID item and confirm.
6. On `журнал` / `дивись журнал`, query WORK `mottak_scans` + `bama_stock_summary()` immediately.

Do not mark V1.0.4 physical PASS until steps 2–4 are confirmed on the Nordic device.
