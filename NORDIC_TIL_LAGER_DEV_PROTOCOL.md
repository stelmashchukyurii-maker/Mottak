# Nordic ID – Til lager · DEV PROTOCOL

**Проєкт:** BaMavaremottak / AI Scanner Mottak  
**Оновлено:** 11.08.2026 22:43 Europe/Oslo  
**Статус:** DEV V1.0.4 / WORK DEFAULT — НЕ STABLE

## Незмінні правила
- `Nordic ID – Til rampe · V2.9.7` RFID/confirm/count-entry/staging/dispatch logic не переписувати без окремого рішення користувача.
- `Til lager` розробляється окремо.
- Повний V1.0.4 startup PASS записувати тільки після фізичного підтвердження користувачем.
- RFID products use `mottak_scans`; `forlengere_plast` uses quantity-only stock, never fake RFID.

## Current operational entry — DEV V1.0.4
Entry:
`nordic-id-til-lager-v104.html`

Scanner home points to V1.0.4 as:
`📥 TIL LAGER · WORK`

Composition:
1. base `nordic-id-til-lager-test.html` receipt/RFID flow;
2. `nordic-til-lager-v102-fix.js`;
3. `stock-summary-8-v1.js`;
4. wrapper calls existing `setEnv("work")` immediately after load.

## USER DECISION — WORK DEFAULT
11.08.2026 user explicitly requested that Nordic `Til lager` open directly in WORK because switching on the scanner is inconvenient.

Result:
- WORK is default startup environment;
- TEST remains available manually;
- base TEST file is preserved;
- receipt/RFID business logic was not rewritten.

## RFID flow retained
- product selection persists;
- hidden RFID input readonly idle;
- hardware `Unidentified` trigger arms input;
- 24 HEX EPC;
- 600 ms lock;
- scan → product + lower 6 → confirm;
- success → `PÅ LAGER` → READY;
- WORK duplicate protections retained.

## REAL WORK incoming path — DATABASE PHYSICAL EVIDENCE
Live WORK `mottak_scans` contains many physically created Nordic rows with:
- `environment='work'`;
- `source='nordic_id'`;
- `device_id='NORDIC-ID'`;
- full EPC in `scanner_code`;
- last 6 in `lower_number`;
- `status='verified'`;
- `stock_status='in_stock'`.

Confirmed real incoming products include:
- Bunner;
- Hyller x60;
- Vrak hyller.

Therefore the **actual Nordic incoming RFID → WORK database write path is proven**.

Important distinction:
this does **not** yet prove that the final V1.0.4 wrapper visibly starts in WORK on the physical Nordic after the last default-mode change. That startup UI still needs one explicit visual confirmation.

## Unified 8-product counters
Module:
`stock-summary-8-v1.js`

Reads:
`public.bama_stock_summary()`

Shows:
1. physical warehouse;
2. available warehouse = physical minus unfulfilled active RAMPE order demand.

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
11.08.2026 old physically shipped stock was bulk-corrected to dispatched:
- exact batch = 35 RFID rows;
- TEST untouched.

Canonical milestone:
`WORK_STOCK_BASELINE_RESET_2026-08-11.md`

New WORK receipts were created afterward. Never assume the old zero baseline is current; query `bama_stock_summary()` live.

## Manual WORK H30 receipt
3 × Hyller x30 manually received with lower numbers:
- `000012`
- `000013`
- `000014`

No fake EPC; `scanner_code=''`; source manual.

## Current physical status
Confirmed:
- TEST base RFID intake path;
- real WORK Nordic intake rows in production DB.

Still pending:
- explicit physical visual confirmation that `nordic-id-til-lager-v104.html` starts directly in WORK on Nordic after final wrapper change.

## Next physical check when this task resumes
1. Open `scanner-home.html` on Nordic.
2. Open `📥 TIL LAGER · WORK`.
3. Expected: top mode is already WORK without hold/confirmation.
4. Confirm visible WORK state.
5. Only then scan intended new incoming stock.
6. On `журнал` / `дивись журнал`, query WORK `mottak_scans` + `bama_stock_summary()` immediately.

Do not mark V1.0.4 startup UI physical PASS until step 3–4 are confirmed by user.

Session closure snapshot:
`NORDIC_SESSION_ARCHIVE_2026-08-11_2243.md`
