# UT Kontor — MANUELL LAGERKORRIGERING

Status: ACTIVE DEV · SIMPLE WORK CORRECTION · NO ADMIN CODE YET
Updated: 2026-08-24 Europe/Oslo

## Purpose
Provide a small controlled manual stock-correction tool directly inside the WORKING UT Kontor page.

This is for correcting the factual warehouse quantity when the system count differs from reality. It is NOT for correcting an order. Wrong order data must still be corrected through `Rediger bestilling`.

## Scope — first simple version
Visible entry inside `bestilling.html`:
`MANUELL KORRIGERING`

Products allowed in this first version:
- `bunner`
- `hyller30`
- `hyller60`

Allowed actions:
- `-1`
- `+1`
- `SETT FAKTISK`

No Admin-code is required in this first version by explicit user decision. Authentication/roles may be added later without changing the stock accounting model.

## Accounting rule
The operator NEVER edits `available_count` directly.

Manual correction changes only the physical/manual overlay.
Canonical stock remains:
`available = physical - still-unfulfilled active order demand`

Creating/editing a UT order still reduces available immediately. Staging must not double-subtract.

## RFID safety
Manual correction must not:
- create `mottak_scans` rows;
- invent EPC/RFID;
- invent `lower_number`;
- rewrite existing RFID identity.

For RFID-based products, correction uses the existing `mottak_quantity_stock` manual overlay.

## Server boundary
Browser must not receive `SUPABASE_SERVICE_ROLE_KEY`.
Manual WORK correction is performed server-side through a dedicated Edge Function restricted to the three products and allowed actions above.

Because there is intentionally no Admin-code in the first version, this is NOT strong authentication. The mutation surface must stay narrowly scoped. A later security phase may add Admin-code/card/role authorization.

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

## Separation from Inventory
Florivo Inventory V0.12 remains TEST observation/server-sync and must not silently mutate LIVE/WORK stock.
This UT Kontor action is a separate explicit human-approved WORK correction path.

## Separation from frozen Nordic
Do not modify Nordic TIL RAMPE/TIL LAGER frozen production behavior to implement this feature.
