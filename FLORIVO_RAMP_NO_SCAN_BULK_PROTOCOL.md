# FLORIVO RAMP — NO-SCAN BULK MOVE PROTOCOL

Status: ACTIVE DEV · OPTION A IMPLEMENTED · PHYSICAL PASS PENDING
Created: 2026-08-21 Europe/Oslo
Updated: 2026-08-24 Europe/Oslo

## Purpose
Provide an explicit web alternative for moving goods from warehouse (`in_stock`) to ramp (`staged`) when RFID scanning is intentionally not used.

This is an ADDITIONAL controlled path. It does not replace or modify the frozen Nordic TIL RAMPE V2.9.7 RFID/scanning workflow.

## Accepted scope — OPTION A ONLY
The accepted meaning is:
- move ALL STILL-REQUIRED goods for ONE CURRENT SELECTED NEW ORDER/RAMP;
- never move the whole warehouse;
- never touch unrelated orders/stock.

The old A/B scope question is closed. Whole-warehouse move is NOT the implemented behavior.

## Current implementation
UT Kontor wrapper:
`bestilling.html` — current WORKING v37.6.

UI module:
`ut-kontor-stage-all-no-scan.js`

Backend RPC:
`office_stage_order_without_scanning(uuid)`

Current user-facing action:
`FLYTT HELE ORDREN TIL RAMPE · UTEN SKANNING`

## Safety / correctness rules
- Only a selected NEW order can use this path.
- Recalculate current remaining demand at execution time; do not trust stale UI counts.
- Stage exactly the required quantities for that order, never more.
- If the order already has scans/confirmations/progress, refuse the no-scan path rather than mix two fulfillment paths.
- Validate all required stock before mutation.
- For item-based products, choose deterministic eligible in-stock units using existing lifecycle/FIFO semantics.
- `forlengere_plast` remains quantity-ledger based; never invent RFID rows.
- Preserve order/ramp relations and canonical stock accounting.
- Operation must be atomic: partial failure must not look like success.
- Refresh warehouse/ramp/order state after completion.

## Frozen isolation
Do NOT edit the frozen Nordic TIL RAMPE V2.9.7 source or RFID confirmation logic to support this option.
The no-scan path stays beside Nordic scanning as a separate explicit route.

## Current backend fact
`office_stage_order_without_scanning(uuid)` exists in the live Supabase database.

## PHYSICAL PASS boundary
Implementation/server presence is not enough to call this PHYSICAL PASS.

Required controlled real test:
1. use one small NEW order;
2. record warehouse/ramp/order values before;
3. activate `FLYTT HELE ORDREN TIL RAMPE · UTEN SKANNING`;
4. confirm exact product quantities;
5. verify order becomes staged/on-ramp as intended;
6. verify exactly the ordered quantities moved;
7. verify no unrelated stock/order changed;
8. verify stock summary and ramp/order summary agree.

Until that explicit test is accepted, status remains ACTIVE DEV / PHYSICAL PASS PENDING.
