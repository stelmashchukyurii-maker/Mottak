# UT Kontor — MANUELL LAGERKORRIGERING

Status: ACTIVE DEV · SIMPLE WORK CORRECTION · ALL 8 PRODUCTS · NO ADMIN CODE YET
Updated: 2026-08-24 Europe/Oslo

## Purpose
Provide a small controlled manual stock-correction tool directly inside the WORKING UT Kontor page.

This is for correcting the factual warehouse quantity when the system count differs from reality. It is NOT for correcting an order. Wrong order data must still be corrected through `Rediger bestilling`.

## Scope — current simple version
Visible entry inside `bestilling.html`:
`MANUELL KORRIGERING`

Products allowed:
- `bunner`
- `hyller30`
- `hyller60`
- `forlengere_korte`
- `forlengere_lange`
- `forlengere_plast`
- `vrak_bunner`
- `vrak_hyller`

Allowed actions for every product:
- `-1`
- `+1`
- `SETT FAKTISK`

No Admin-code is required in this version by explicit user decision. Authentication/roles may be added later without changing the stock accounting model.

## Accounting rule
The operator NEVER edits `available_count` directly.

Manual correction changes only the factual/manual stock overlay.
Canonical stock remains:
`available = physical - still-unfulfilled active order demand`

Creating/editing a UT order still reduces available immediately. Staging must not double-subtract.

All operational pages that display stock must use the same canonical `bama_stock_summary()` semantics. A page must not show raw RFID counts as factual stock when a manual overlay exists.

## Units
- Bunner: stabel, package size 10.
- Hyller x30: vogn, package size 30.
- Hyller x60: vogn, package size 60.
- Forlengere korte: vogn.
- Forlengere lange: vogn.
- Forlengere plast: eske, quantity-only/no RFID.
- Vrak bunner: stabel, package size 10.
- Vrak hyller: stabel, package size 30.

## RFID safety
Manual correction must not:
- create `mottak_scans` rows;
- invent EPC/RFID;
- invent `lower_number`;
- rewrite existing RFID identity.

For RFID-based products, correction uses the existing `mottak_quantity_stock` manual overlay.
For `forlengere_plast`, the quantity ledger is the normal stock source and must never become negative.

## Server boundary
Browser must not receive `SUPABASE_SERVICE_ROLE_KEY`.
Manual WORK correction is performed server-side through the dedicated Edge Function `ut-kontor-manual-correction`, restricted to the eight canonical products and the allowed actions above.

Because there is intentionally no Admin-code in the current version, this is NOT strong authentication. The mutation surface stays narrowly scoped. A later security phase may add Admin-code/card/role authorization.

## Audit / numbering
Every successful correction must create a durable audit event in `mottak_quantity_stock_events`.

Automatic human-readable reference:
- `A001`
- `A002`
- `A003`
- ...

The number is generated server-side, never by the browser.

Audit data includes at least:
- reference number;
- date/time;
- product;
- delta;
- manual quantity after;
- physical after;
- available after;
- action/source = UT Kontor manual correction.

## Confirmation
Every mutation requires a browser confirmation showing the old and proposed new factual quantity before the request is sent.

## Refresh
After success UT Kontor refreshes its stock summary immediately so the operator sees the corrected physical/available values without reopening the page.

## Separation from order editing
- Wrong order quantity/ramp/customer data -> `Rediger bestilling`.
- Wrong factual warehouse count -> `MANUELL KORRIGERING`.

## Separation from Inventory
Florivo Inventory V0.12 remains TEST observation/server-sync and must not silently mutate LIVE/WORK stock.
This UT Kontor action is a separate explicit human-approved WORK correction path.

## Separation from frozen Nordic
Do not modify Nordic TIL RAMPE/TIL LAGER frozen production behavior to implement this feature.
