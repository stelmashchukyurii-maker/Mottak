# Nordic ID – Til rampe · STABLE LOCK

**Офіційна назва:** `Nordic ID – Til rampe`  
**Stable application version:** `V2.9.7`  
**Фізично підтверджена application logic:** 10.08.2026  
**Frozen application source:** `utsending-nordic-test.html`  
**Frozen source commit:** `ed3a19b20efd9af0bf07bc4a079589b3b6038157`  
**Оновлено operational launch:** 11.08.2026 21:28 Europe/Oslo

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

## DELIVERY PATH FIX — 11.08.2026
Nordic browser displayed direct jsDelivr HTML as source text instead of rendering it.

Frozen source itself was not edited. Local GitHub Pages loaders fetch the exact source from commit `ed3a19...` and render it in the local document while pinning dependencies to the same commit.

Historical TEST-default stable loader:
- `nordic-id-til-rampe-v297-frozen-loader.html`

Historical stable entry:
- `nordic-id-til-rampe-stable.html`

## USER-AUTHORIZED WORK DEFAULT — 11.08.2026 21:28
User explicitly requested that both Nordic operational forms start in WORK by default because switching mode on the scanner is inconvenient.

Operational `Til rampe` entry from `scanner-home.html` is now:
- `nordic-id-til-rampe-work-default.html`
- create commit: `7070ba23ce0be8158df2a3db489ff4392f357e33`

Contract:
- exact V2.9.7 application source remains pinned to `ed3a19b20efd9af0bf07bc4a079589b3b6038157`;
- loader changes only initial `MODE` from TEST to WORK and initial visible mode labels;
- RFID, confirmation, order progress, count entry, duplicate protection and dispatch logic are unchanged;
- TEST remains available via the existing TEST button;
- no WORK scan is performed automatically: operator still opens order and scans/confirm items normally.

Status:
**WORK-DEFAULT ENTRY DEPLOYED — PHYSICAL NORDIC RECHECK PENDING.**
Do not call this startup change physical PASS until the user confirms the form opens normally and visibly starts in WORK.

## WORK UNKNOWN RFID TAG CONTRACT
1. Existing available WORK RFID row → reuse.
2. Staged/unavailable → warning/block.
3. Read EPC missing from WORK stock → offer register now + continue current RAMPE.
4. Full EPC → `scanner_code`; last 6 → `lower_number`.
5. No EPC read → never invent an RFID number.

## Current WORK order context
RAMPE 28 was created as a real WORK trial with quantity 1 of all 8 products. Before physical outgoing scanning, all progress was done 0 / remaining 1 and `ut_order_scans` was empty.

Always query the live database before stating its current progress.

## Recovery
Application behavior source of truth remains frozen commit:
`ed3a19b20efd9af0bf07bc4a079589b3b6038157`.

If WORK-default launch has a problem, repoint scanner home back to the historical stable entry/loader without editing the frozen V2.9.7 source.
