# Nordic ID – Til rampe · STABLE LOCK

**Офіційна назва:** `Nordic ID – Til rampe`  
**Stable application version:** `V2.9.7`  
**Фізично підтверджена application logic:** 10.08.2026  
**Frozen application source:** `utsending-nordic-test.html`  
**Frozen source commit:** `ed3a19b20efd9af0bf07bc4a079589b3b6038157`  
**Оновлено operational launch/display:** 11.08.2026 21:54 Europe/Oslo

## LOCK RULE
V2.9.7 є зафіксованою outgoing-логікою Nordic ID для `Til rampe`.

- Не змінювати RFID / confirm / count-entry / staging / dispatch behavior V2.9.7 без окремого рішення користувача.
- Дозволені окремі operational wrappers / display-only overlays лише коли вони не переписують frozen business logic і явно документовані нижче.
- Нові outgoing-функції поза цим scope розробляти тільки в окремому DEV.
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

## DELIVERY PATH FIX — 11.08.2026
Nordic browser displayed direct jsDelivr HTML as source text instead of rendering it.

Frozen source itself was not edited. Local GitHub Pages loaders fetch the exact source from commit `ed3a19...` and render it in the local document while pinning dependencies to the same commit.

Historical TEST-default stable loader:
- `nordic-id-til-rampe-v297-frozen-loader.html`

Historical stable entry:
- `nordic-id-til-rampe-stable.html`

## USER-AUTHORIZED WORK DEFAULT — 11.08.2026 21:28
User explicitly requested that both Nordic operational forms start in WORK by default because switching mode on the scanner is inconvenient.

Operational `Til rampe` entry from `scanner-home.html` is:
- `nordic-id-til-rampe-work-default.html`
- create commit: `7070ba23ce0be8158df2a3db489ff4392f357e33`

Contract:
- exact V2.9.7 application source remains pinned to `ed3a19b20efd9af0bf07bc4a079589b3b6038157`;
- loader changes initial `MODE` from TEST to WORK and initial visible mode labels;
- RFID, confirmation, count entry, duplicate protection, staging and dispatch logic are unchanged;
- TEST remains available via the existing TEST button;
- no WORK scan is performed automatically: operator still opens order and scans/confirms items normally.

### Physical confirmation
11.08.2026 user provided a physical Nordic photo showing:
- WORK visibly active at page start;
- RAMPE 28 open in WORK;
- partial order progress rendered correctly;
- user stated the partial transfer to ramp worked well.

Therefore:
**TIL RAMPE WORK-DEFAULT STARTUP = PHYSICAL PASS.**

This does not by itself mean every 8-product outgoing case is physically complete.

## DISPLAY-ONLY FORLENGERE PIECE COUNT — 11.08.2026 21:54
User observed that phone order view showed `Forlengere korte/lange` as e.g. `1 vogn · 150 stk.`, while Nordic progress only showed `1 / 1`.

Verified source of truth:
`public.ut_extra_progress(order_id)` exposes actual outgoing `forlengere_count`.
For RAMPE 28 evidence showed `forlengere_count=150` for both korte and lange.

Implemented without changing frozen outgoing logic:
- module: `nordic-til-rampe-extension-count-display-v1.js`
- module create commit: `9cfc4be8d14163cfa37a1bbc7c0a781009483914`
- WORK-default loader update commit: `f963d4e8d81064e1c7df51352203e698c3d2cdcb`
- dedicated protocol: `NORDIC_TIL_RAMPE_EXTENSION_COUNT_DISPLAY_2026-08-11.md`

The overlay:
- reads real `forlengere_count` from `ut_extra_progress`;
- shows `NNN stk.` in the existing Nordic progress row for korte/lange;
- does not write data;
- does not change RFID/confirm/count-entry/staging/dispatch.

Status:
**DEPLOYED — PHYSICAL VISUAL RECHECK PENDING.**
Do not call the new `NNN stk.` display PASS until the user refreshes/reopens and confirms it visually.

## WORK UNKNOWN RFID TAG CONTRACT
1. Existing available WORK RFID row → reuse.
2. Staged/unavailable → warning/block.
3. Read EPC missing from WORK stock → offer register now + continue current RAMPE.
4. Full EPC → `scanner_code`; last 6 → `lower_number`.
5. No EPC read → never invent an RFID number.

## Current WORK order context
RAMPE 28 was created as a real WORK trial with quantity 1 of all 8 products and was physically partially processed on Nordic.

The order was subsequently released/cancelled during the trial, so current progress may be reset. Always query the live database before stating its current progress or stock impact.

## Recovery
Application behavior source of truth remains frozen commit:
`ed3a19b20efd9af0bf07bc4a079589b3b6038157`.

If WORK-default launch or the display overlay has a problem:
1. remove/revert the display-only overlay first;
2. if needed repoint scanner home back to the historical stable entry/loader;
3. do not edit/rebuild the frozen V2.9.7 application logic from memory.
