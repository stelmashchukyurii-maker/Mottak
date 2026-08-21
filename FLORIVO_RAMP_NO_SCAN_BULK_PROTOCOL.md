# FLORIVO RAMP — NO-SCAN BULK MOVE PROTOCOL

Status: DRAFT — SCOPE CONFIRMATION REQUIRED
Created: 2026-08-21 Europe/Oslo

## Purpose
Provide an explicit web alternative for moving goods from warehouse (`in_stock`) to ramp (`staged`) when RFID scanning is intentionally not used.

This is an ADDITIONAL controlled path. It must not replace or modify the frozen Nordic TIL RAMPE V2.9.7 RFID/scanning workflow.

## Recommended user flow
1. Open the existing web ramp/order context.
2. Select/current order or ramp is already known.
3. Press a separate button such as `FLYTT ALT TIL RAMPE · UTEN SKANNING`.
4. Before any mutation, show an exact summary by product of what will be moved.
5. User confirms once.
6. Server performs one auditable bulk staging operation.
7. UI refreshes warehouse/ramp counts and shows the result.

## Strong recommendation for scope
Default/recommended meaning of `ALT`:
- move ALL STILL-REQUIRED goods for the CURRENT SELECTED ORDER/RAMP;
- never blindly move every item physically available in the whole warehouse.

Alternative interpretation requiring explicit user confirmation:
- move literally all current warehouse stock to ramp.

This protocol remains DRAFT until the user confirms which meaning is intended.

## Safety / correctness rules
- WORK only when explicitly chosen.
- Recalculate remaining demand at execution time; do not trust stale UI counts.
- Never stage more than the current remaining order/ramp requirement unless the user explicitly chooses a whole-stock operation.
- Only eligible `in_stock` rows may become `staged`.
- For item-based products, choose deterministic FIFO/oldest eligible units using the existing Florivo/stock lifecycle semantics.
- `forlengere_plast` remains quantity-ledger based; never invent RFID rows.
- Operation must be idempotent against double-click/retry and must not double-stage already staged units.
- Preserve order/ramp relations and existing stock accounting semantics.
- Write an explicit audit marker such as `no_scan_bulk_to_ramp` with order/ramp, product quantities, actor/device when available, and timestamp.
- Show exact before/after result; partial failure must not silently look like success.

## Frozen isolation
Do NOT edit the frozen Nordic TIL RAMPE V2.9.7 application source or its RFID confirmation logic to implement this feature.
Implement the no-scan path beside it, using a separate web control and a dedicated server transaction/RPC that reuses the same canonical lifecycle meaning.

## Open scope question
Does `FLYTT ALT TIL RAMPE` mean:
A. all remaining goods required by the currently selected order/ramp (RECOMMENDED), or
B. literally all goods currently in warehouse?

No production mutation or button promotion should be made until A/B is confirmed.
