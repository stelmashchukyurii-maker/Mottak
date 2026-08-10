# Nordic ID – Til lager · DEV PROTOCOL

**Проєкт:** BaMavaremottak / AI Scanner Mottak  
**Оновлено:** 10.08.2026 22:39 Europe/Oslo  
**Статус:** DEV / TEST FIRST — НЕ STABLE

## Незмінне правило
- `Nordic ID – Til rampe · STABLE V2.9.7` не переписувати і не видаляти.
- `Til lager` розробляється окремо.
- У `NORDIC_ID_PROGRESS_LOG.md` повний `Til lager` PASS записувати тільки після фізичного підтвердження користувачем.

## Бізнес-правила продуктів
RFID є у всіх робочих продуктів, крім `forlengere_plast`.

RFID products:
- `bunner`
- `hyller30`
- `hyller60`
- `forlengere_korte`
- `forlengere_lange`
- `vrak_bunner`
- `vrak_hyller`

Без RFID:
- `forlengere_plast` — manual/phone count flow.

Rules:
- `vrak_bunner` = 1 RFID-одиниця / стопка = 10 Vrak bunner.
- `vrak_hyller` = 1 RFID-одиниця / стопка = 30 Vrak hyller.
- Усі продукти можуть бути відправлені на RAMPE.
- Forlengere korte/lange: counts не вводити при Mottak; counts вводяться тільки при outgoing.

## Product registry / DB — SERVER PASS
`products.js` = v1.3.0.
Permanent IDs: `vrak_bunner`, `vrak_hyller`.

DB constraints allow RFID products in:
- `mottak_scans`
- `ut_order_scans`

`forlengere_plast` intentionally excluded from RFID scan constraints.

`private.nordic_preview(uuid,text)` server-compatible with Vrak products without editing frozen Til rampe frontend.

Transactional verification:
- TEST duplicate same Vrak RFID → allowed;
- WORK duplicate same Vrak RFID → blocked;
- tests rolled back;
- no synthetic rows left in production.

## Physical TEST evidence before V1.0.2
User physically scanned via `Til lager` in TEST. Database read-back confirmed real `environment=test`, `status=verified`, `stock_status=in_stock`, `source=nordic_id` rows using EPC `33161403D0000785000E3103` / lower `0E3103` for:
- Hyller x60
- Bunner
- Forlengere lange
- Vrak hyller
- Vrak bunner

Therefore RFID → confirm → shared TEST `mottak_scans` write path is working. Remaining reported UI issues were:
1. user could not visually see the stock arrival/count inside Til lager;
2. WORK switch did not activate reliably on Android.

## Nordic ID – Til lager · DEV V1.0.2
Working entry from scanner home:
- `nordic-id-til-lager-v102.html`

Base intake page:
- `nordic-id-til-lager-test.html` · V1.0.1 write flow

V1.0.2 additive module:
- `nordic-til-lager-v102-fix.js`

Published wrapper SHA:
- `da3a74a87e4d9c56a9a51b0b3dd0ec35a0ff5c57`

Published v1.0.2 module SHA:
- `db244c9aadb0716d6f536bf675ba66c7b1bfe659`

V1.0.2 changes only UI/control around the already DB-confirmed intake path:

### WORK HOLD
- old WORK button listener is removed by replacing the DOM button;
- real 1.5 second pointer/touch hold;
- visible red progress bar + countdown;
- browser confirmation after full hold;
- then calls base `setEnv("work")` so base save logic uses real WORK environment;
- TEST button remains immediate;
- Android context-menu/selection is prevented on WORK button.

### PÅ LAGER NÅ
New stock card directly under RFID work area:
- current environment badge TEST/WORK;
- selected product;
- actual count of `verified + in_stock` rows for that product/environment;
- business conversion:
  - Bunner ×10;
  - H30 ×30;
  - H60 ×60;
  - Vrak bunner ×10;
  - Vrak hyller ×30;
  - Forlengere shows RFID-unit count;
- `Siste mottak`: lower number + time + source;
- after successful confirm/save, wrapper refreshes this stock card and scrolls it into view.

## Base Til lager logic retained
- TEST default.
- select product once; selection persists.
- hidden RFID input, readonly idle.
- `Unidentified` hardware trigger arms input.
- 24 HEX EPC.
- 600 ms lock.
- 1600 ms arm window.
- soft keyboard hidden without blur during RFID ACTIVE.
- scan → product + lower 6 → confirm.
- TEST duplicates allowed.
- WORK duplicate/status protection.
- same-product Camera row with `scanner_code=''` can be enriched with full EPC without creating a duplicate.
- different-product Camera row is blocked.
- staged/dispatched existing row is blocked.
- new WORK row → verified/in_stock.
- success state → `PÅ LAGER` → READY.

## Scanner home
`scanner-home.html` currently points:
- `📥 TIL LAGER` → `nordic-id-til-lager-v102.html` → DEV V1.0.2
- `📤 TIL RAMPE` → frozen STABLE V2.9.7

Scanner home content SHA after V1.0.2 link:
- `893bb5da1711bd964d837e6e58213f502187c7ec`

## Camera fallback
Physical PASS remains:
- Camera v4.25 LOWER RESET
- Camera v4.26 AUTO SAVE FOCUS

Camera v4.27 with extra RFID fallback products is prepared but not yet physical PASS.

## UT Kontor
- existing layout/behavior should remain unchanged;
- production language forced to Norwegian;
- additive Vrak module prepared;
- Norwegian/Vrak browser confirmation still required before PASS.

## Next physical check
1. Refresh `scanner-home.html`.
2. Open `📥 TIL LAGER`.
3. Verify visible `DEV V1.0.2 · STOCK VIEW + WORK HOLD`.
4. Choose a product: `PÅ LAGER NÅ` must show TEST count and `Siste mottak`.
5. Hold WORK for ~1.5 seconds: red bar/countdown → confirm → button must become `WORK ✓`; stock badge must become WORK.
6. Do not make a real WORK stock write unless deliberately testing a real item.
7. After user reports result, query DB/log before declaring PASS.
