# Nordic ID – Til rampe · STABLE LOCK

**Офіційна назва:** `Nordic ID – Til rampe`  
**Stable version:** `V2.9.7`  
**Фізично підтверджена логіка:** 10.08.2026  
**Stable entry:** `nordic-id-til-rampe-stable.html`  
**Frozen application source:** `utsending-nordic-test.html`  
**Frozen source commit:** `ed3a19b20efd9af0bf07bc4a079589b3b6038157`

## LOCK RULE

V2.9.7 є зафіксованою outgoing-логікою Nordic ID для `Til rampe`.

- Не змінювати RFID / confirm / progress / count-flow V2.9.7 без окремого рішення користувача.
- Нові outgoing-функції розробляти тільки в окремому DEV.
- V2.4 лишається historical RFID rollback.
- V2.1 лишається diagnostic RFID base.

## Підтверджений V2.9.7 функціонал

- V2.4 hidden RFID/Wedge engine;
- 24-char HEX EPC;
- 600 ms first-tag lock;
- TEST / WORK switch;
- SMART FOCUS;
- ordered / done / remaining / next;
- TEST duplicate RFID support;
- Bunner / Hyller x30 / Hyller x60 confirm;
- Forlengere korte/lange counts only at outgoing;
- INPUT LOCK;
- COUNT COMPACT;
- auto-return to useful ramp progress after action.

## DELIVERY PATH FIX — 11.08.2026 18:36 Europe/Oslo

### Problem observed physically
When the operator correctly opened `📤 TIL RAMPE` from `scanner-home.html` on the Nordic ID device, the browser navigated from the stable entry directly to a jsDelivr URL containing frozen `utsending-nordic-test.html`.

On the Nordic browser, that CDN HTML response was displayed as **plain source text** (`<!DOCTYPE html>`, CSS, etc.) instead of being rendered as a web page. Consequently V2.9.7 never started and no Nordic log / `ut_order_scans` event was produced.

### Fix
The V2.9.7 application logic itself was **not edited**.

New loader:
`nordic-id-til-rampe-v297-frozen-loader.html`

Loader commit:
`33e4762ba918a7b2489b0e59b1fbe79b5f532679`

Stable-entry delivery fix commit:
`1fd069d9c7bd0d8598b454edb3f14ca3b9bbd15c`

New launch path:
`scanner-home.html`
→ `nordic-id-til-rampe-stable.html`
→ local GitHub Pages `nordic-id-til-rampe-v297-frozen-loader.html`
→ fetch exact frozen application source from commit `ed3a19...`
→ render that source as HTML inside the GitHub Pages document.

The loader also rewrites only the **dependency URLs** (`utsending-core-v7.html`, `ut-test-api.js`, injected JS modules) to the same exact frozen commit. This prevents current `main` changes from altering V2.9.7 behavior.

### Status
**DELIVERY FIX IMPLEMENTED — PHYSICAL RECHECK PENDING.**
Do not call this delivery fix PASS until the operator reopens `TIL RAMPE` on Nordic and sees the normal V2.9.7 UI instead of HTML source text.

## WORK UNKNOWN RFID TAG CONTRACT

1. Existing available WORK RFID row → reuse.
2. Staged/unavailable → warning/block.
3. Read EPC missing from WORK stock → offer register now + continue current RAMPE.
4. Full EPC → `scanner_code`; last 6 → `lower_number`.
5. No EPC read → never invent an RFID number.

## Current physical WORK test context — 11.08.2026

Active test order:
- RAMPE 28
- environment `work`
- quantity 1 of each of all 8 products.

Before delivery-path fix verification:
- `ut_order_scans` for RAMPE 28 = 0;
- all product progress = done 0 / remaining 1;
- Nordic log had no new events because the form did not start.

## Recovery

For application behavior, source of truth remains frozen commit:
`ed3a19b20efd9af0bf07bc4a079589b3b6038157`.

If the delivery loader breaks, restore the launch architecture from Git history while preserving that exact frozen source commit. Do not rebuild V2.9.7 behavior from memory.
