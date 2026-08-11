# Nordic ID – Til rampe · Forlengere quantity display

**Date:** 11.08.2026 21:54 Europe/Oslo  
**Scope:** display only / WORK-default Nordic entry  
**Frozen application logic:** V2.9.7 at `ed3a19b20efd9af0bf07bc4a079589b3b6038157`

## User-observed gap
Physical Nordic screenshot of RAMPE 28 showed product progress such as:
- Forlengere korte `1 / 1`
- Forlengere lange `1 / 1`

The phone order view showed the useful entered piece quantity as well:
- Forlengere korte `1 vogn · 150 stk.`
- Forlengere lange `1 vogn · 150 stk.`

User requested the Nordic progress panel to show the actual extension quantity too, without risking the working RFID/outgoing flow.

## Data source verified
`public.ut_extra_progress(order_id)` already exposes the actual outgoing confirmation fields:
- `hyller_count`
- `forlengere_count`

For RAMPE 28 / order `34113828-6904-4254-bc85-7c2cd8e8bbd1`, DB evidence showed:
- `forlengere_korte`: `hyller_count=15`, `forlengere_count=150`
- `forlengere_lange`: `hyller_count=15`, `forlengere_count=150`

Therefore the Nordic display must read the real `forlengere_count`; no hardcoded 150 and no inferred package calculation.

## Implementation
New display-only module:
`nordic-til-rampe-extension-count-display-v1.js`

Create commit:
`9cfc4be8d14163cfa37a1bbc7c0a781009483914`

Operational WORK-default loader updated:
`nordic-id-til-rampe-work-default.html`

Loader update commit:
`f963d4e8d81064e1c7df51352203e698c3d2cdcb`

Behavior:
- reads `ut_extra_progress` for the currently open order;
- for `forlengere_korte` and `forlengere_lange`, sums actual non-null `forlengere_count` values;
- adds a green `NNN stk.` subline in the existing Nordic progress row;
- leaves ordered/done/remaining logic unchanged;
- does not write to Supabase;
- does not change RFID input, preview, confirm, staging, dispatch, duplicate protection, or count-entry flow.

## Physical status
The underlying WORK-default Til rampe flow is physically confirmed by user screenshot: WORK visibly active and RAMPE 28 was partially processed successfully.

The new `NNN stk.` display add-on is **DEPLOYED — PHYSICAL VISUAL RECHECK PENDING**.
Do not mark this display add-on PASS until user refreshes/reopens Til rampe and confirms the piece count is visible and the normal scan flow is unchanged.
