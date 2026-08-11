# Nordic ID – Til lager · DEV PROTOCOL

**Проєкт:** BaMavaremottak / AI Scanner Mottak  
**Оновлено:** 11.08.2026 14:51 Europe/Oslo  
**Статус:** DEV / WORK INTAKE NEXT — НЕ STABLE

## Незмінні правила
- `Nordic ID – Til rampe · STABLE V2.9.7` не переписувати і не видаляти.
- `Til lager` розробляється окремо.
- Повний `Til lager` PASS записувати тільки після фізичного підтвердження користувачем.
- RFID products use `mottak_scans`; `forlengere_plast` uses quantity-only stock, never fake RFID.

## NEW WORK BASELINE — 11.08.2026 14:47
User confirmed all previously listed WORK stock had already been physically shipped manually.

Before correction:
- Bunner 14
- Hyller x30 7
- Hyller x60 14
- all other products 0
- active WORK orders 0

All 35 WORK `verified + in_stock` RFID rows were moved to `dispatched` with audit events.
Batch marker:
`created_by='chatgpt_admin_bulk_2026-08-11'`

Verified after correction:
- exact batch events = 35;
- WORK physical stock = 0 for all 8 products;
- WORK available = 0 for all 8 products;
- WORK on ramp = 0;
- WORK outstanding order demand = 0;
- TEST untouched.

Canonical milestone:
`WORK_STOCK_BASELINE_RESET_2026-08-11.md`

**Do not use old 14/7/14 as current stock. Current WORK baseline is ZERO.**

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

## Physical TEST evidence
Base Til lager RFID write path was physically used by user in TEST and DB read-back confirmed `environment=test`, `verified`, `in_stock`, `source=nordic_id`, EPC `33161403D0000785000E3103` / lower `0E3103` for:
- Hyller x60
- Bunner
- Forlengere lange
- Vrak hyller
- Vrak bunner

Therefore RFID → confirm → shared TEST stock write is proven. Full wrapper V1.0.3 is not yet full physical WORK PASS.

## Current Til lager entry — DEV V1.0.3
Entry:
- `nordic-id-til-lager-v103.html`

Composition:
1. base `nordic-id-til-lager-test.html` V1.0.1 write flow;
2. `nordic-til-lager-v102-fix.js` for WORK HOLD + selected-product last receipt;
3. `stock-summary-8-v1.js` for unified two stock counters.

Scanner home points to V1.0.3.

### RFID flow retained
- TEST default.
- product selection persists.
- hidden RFID input readonly idle.
- `Unidentified` hardware trigger arms input.
- 24 HEX EPC.
- 600 ms lock.
- 1600 ms arm.
- soft keyboard hidden without blur during RFID ACTIVE.
- scan → product + lower 6 → confirm.
- success → `PÅ LAGER` → READY.

### WORK HOLD from V1.0.2
- real ~1.5 s pointer/touch hold;
- visible progress/countdown;
- confirm before WORK;
- then base `setEnv("work")`.
This fix still requires final physical confirmation on Nordic Android.

### Selected-product arrival card
- actual in_stock count in current environment;
- selected product conversion ×10/30/60 as applicable;
- `Siste mottak`: lower + time + source;
- refresh after successful save.

### Unified 8-product counters
Module `stock-summary-8-v1.js` reads only server RPC `bama_stock_summary()`.
Shows:
1. physical warehouse;
2. available warehouse = physical minus outstanding active ramp-order demand.

All 8 products are displayed. TEST/WORK comes from current Til lager environment.

## WORK Camera merge rule
- same lower + different product → block;
- existing full RFID → duplicate/status block;
- same product + Camera row with `scanner_code=''` + `in_stock` → enrich same row with full EPC and preserve photo;
- staged/dispatched → block;
- missing row → create verified/in_stock WORK row.

## Unified stock SERVER PASS
RPC: `public.bama_stock_summary()`.
Rule:
- physical = `in_stock` + approved manual overlay where applicable;
- available = physical − unfulfilled active order quantity;
- order create/edit changes available immediately;
- staging does not double-subtract.

Current WORK baseline after user-directed manual-shipment correction:
**0 across all 8 products.**

## Plastic quantity-only stock SERVER PASS
Tables:
- `mottak_quantity_stock`
- `mottak_quantity_stock_events`

RPC:
- `receive_mottak_quantity_stock(text,integer,text)`

Lifecycle:
- order creation reserves availability;
- stage deducts physical plastic boxes;
- cancel returns non-dispatched staged boxes;
- operational order edit returns staged plastic and resets order;
- non-operational edit preserves lifecycle.

Manual receipt has anon TEST transactional PASS and no fake tag/number.
Phone UI is in current Camera v4.29; not part of Nordic scanner Til lager because plastic has no RFID.

## Vrak outgoing SERVER PASS
- Nordic server preview/auto scan supports Vrak.
- `stage_ut_order` and `confirm_ut_dispatch` validate Vrak RFID.
- full transactional Vrak order → Nordic → staged → dispatched passed.
- `bama_order_product_progress(uuid)` exposes all product rows incl Vrak/plastic.

Frozen Til rampe V2.9.7 progress panel predates Vrak. Server blocks false completion, but a separate outgoing DEV UI is required for correct visual Vrak progress. Do not edit stable.

## Camera fallback
Last physical PASS:
- v4.25 LOWER RESET
- v4.26 AUTO SAVE FOCUS

Current unconfirmed Camera:
- v4.29
- extra RFID fallback choices short/long/Vrak;
- unified 8-product counters;
- manual plastic receipt panel.

## UT Kontor
Current unconfirmed:
- WORKING v37
- forced Norwegian;
- 8 product order cards;
- unified 8-product physical/available counters;
- counter refresh after order load/save.
Existing layout/flow must remain unchanged apart from additive product/counter support.

## Lager Admin
- TEST-only DEV exists;
- page/browser load was visually confirmed;
- mutation flow not physically tested;
- user postponed this task on 11.08.2026;
- WORK remains server-locked.

## Next physical WORK check — PRIORITY
User wants to receive NEW stock with scanner.

1. Refresh `scanner-home.html`.
2. Open `📥 TIL LAGER`.
3. Verify `DEV V1.0.3` and that WORK stock counters show 0 after switching to WORK.
4. Hold WORK ~1.5 s and confirm mode change.
5. Scan **one real new incoming RFID item**.
6. Confirm product + lower number and save.
7. Immediately query WORK `mottak_scans` and `bama_stock_summary()`.
8. Expected: selected product physical/available goes `0 → 1` and exact EPC/lower is stored.
9. Only after this single-item WORK PASS continue bulk receiving.
