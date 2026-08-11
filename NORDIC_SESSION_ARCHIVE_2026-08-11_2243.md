# Nordic ID session archive — 11.08.2026 22:43 Europe/Oslo

**Проєкт:** BaMavaremottak / AI Scanner Mottak  
**Статус:** SESSION CLOSED / ARCHIVED  
**Primary handoff:** `NEXT_CHAT_NORDIC_ID.txt`

## Why this archive exists
This snapshot closes the Nordic work session in which the project moved from TEST-first scanner operation toward real WORK-first operation and physically verified the current Til rampe flow.

No production form is modified by this archive. It records the accepted state and deferred work at session close.

## User decisions locked in this session
1. Both Nordic operator forms should open in WORK by default.
2. TEST remains available manually when needed.
3. User is now operating real WORK flows.
4. If an already working production behavior looks problematic, explain the issue first and get explicit authorization before changing it.
5. Lager Admin remains deferred unless user explicitly reopens that task.

## Scanner home at archive
`scanner-home.html`

Visible operator actions:
- `📥 TIL LAGER · WORK` → `nordic-id-til-lager-v104.html`
- `📤 TIL RAMPE · WORK` → `nordic-id-til-rampe-work-default.html`

Home text visibly identifies WORK as standard / real database.

## Til rampe — accepted production-facing state
Frozen application logic remains:
- version V2.9.7
- source `utsending-nordic-test.html`
- frozen commit `ed3a19b20efd9af0bf07bc4a079589b3b6038157`

Do not rewrite frozen RFID/confirm/count-entry/staging/dispatch logic without explicit user approval.

### Physical PASS — delivery path
Nordic originally displayed direct jsDelivr HTML as source text. A local GitHub Pages loader now renders the exact pinned frozen V2.9.7 source correctly.

Physical Nordic later opened the normal form.

### Physical PASS — WORK default
Operational entry:
`nordic-id-til-rampe-work-default.html`

User photo confirmed:
- WORK active immediately;
- RAMPE 28 opened normally;
- partial real WORK processing worked.

### Physical PASS — Forlengere piece count
Display-only module:
`nordic-til-rampe-extension-count-display-v1.js`

It reads actual `forlengere_count` from `public.ut_extra_progress(order_id)` and shows `NNN stk.` on Nordic.

RAMPE 28 DB evidence:
- Forlengere korte = 15 hyller + 150 forlengere
- Forlengere lange = 15 hyller + 150 forlengere

User confirmed at archive close:
**“Продовжувачі готові.”**

Therefore the new quantity line is PHYSICAL PASS.

## RAMPE 28 trial history
Order id:
`34113828-6904-4254-bc85-7c2cd8e8bbd1`

Environment:
`work`

Created with quantity 1 of all 8 products.

Physical screenshot showed partial completion:
- Bunner 1/1
- Forlengere korte 1/1
- Forlengere lange 1/1
- H30/H60/plastic remained incomplete in that screenshot.

Database archive evidence:
- one Bunner `ut_order_scans` row;
- korte confirmation = 15 hyller + 150 forlengere;
- lange confirmation = 15 hyller + 150 forlengere.

Trial was subsequently cancelled/released.

Archive verification:
- order status `cancelled`;
- extension confirmations released;
- `on_ramp_count=0` for all products;
- `order_remaining=0` for all products.

RAMPE 28 is history, not an active order.

## WORK stock baseline event earlier this day
User confirmed all stock still shown from the old baseline had already physically shipped manually.

Exact bulk correction:
- 35 WORK RFID rows from verified/in_stock → dispatched;
- audit event per row;
- marker `created_by='chatgpt_admin_bulk_2026-08-11'`;
- TEST untouched.

Milestone:
`WORK_STOCK_BASELINE_RESET_2026-08-11.md`

This zero baseline is historical only because new stock was received afterward.

## Real WORK Nordic incoming evidence
Production DB contains real Nordic receipts with:
- `source='nordic_id'`
- `device_id='NORDIC-ID'`
- `environment='work'`
- full EPC scanner_code
- lower 6 lower_number
- `verified/in_stock`.

Confirmed product examples include:
- Bunner
- Hyller x60
- Vrak hyller.

This proves real Nordic incoming RFID writes to WORK.

## Manual H30 receipt
3 × Hyller x30 manually received in WORK:
- `000012`
- `000013`
- `000014`

Contract:
- source manual;
- scanner_code empty;
- verified/in_stock;
- no fake EPC.

## Archive-time live stock snapshot
Checked at session close 11.08.2026 22:43 Europe/Oslo:

- Bunner: 25
- Hyller x30: 3
- Hyller x60: 20
- Forlengere korte: 4
- Forlengere lange: 4
- Forlengere plast: 0
- Vrak bunner: 0
- Vrak hyller: 2

At this exact snapshot:
- `on_ramp_count=0` for all 8;
- `order_remaining=0` for all 8.

**This is historical snapshot data only. Future stock questions must query `bama_stock_summary()` live.**

## Til lager status at archive
Current entry:
`nordic-id-til-lager-v104.html`

Design:
- WORK default;
- TEST manual fallback;
- real RFID receipt logic retained;
- unified 8-product two-counter summary.

Confirmed:
- real WORK Nordic incoming DB write path works.

Still not explicitly physically confirmed:
- final V1.0.4 wrapper visibly opening directly in WORK after the last default-mode change.

This is the most natural small next check if Nordic incoming work resumes.

## Deferred work — intentionally not completed in this session
### Nordic Til rampe V2.9.8
Purpose:
full all-8/Vrak visual progress.

Status:
- server support PASS;
- separate DEV exists;
- not linked from scanner home;
- not physical PASS;
- not stable.

Do not promote without separate physical test and explicit user decision.

### Camera v4.29
Includes 8-product counters, extra fallback products and manual plastic receipt.
Not fully physically accepted in this session.

Last fully accepted Camera rollback remains v4.26.

### UT Kontor v37
Preserve Norwegian layout/behavior and 8-product counters.
Full current acceptance remains deferred/unconfirmed.

### Lager Admin
TEST-only DEV.
UI load was physically visible.
Mutation UI was not physically accepted.
WORK remains server-locked.
User explicitly deferred this task.

## Canonical business rules preserved
### RFID
- full 24 HEX EPC → scanner_code
- last 6 → lower_number
- upper_number empty
- no EPC read → never invent RFID.

### Product model
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

Vrak bunner = 10/stack.
Vrak hyller = 30/stack.
Short/long counts only at outgoing.

### Stock counters
`bama_stock_summary()`:
1. physical warehouse;
2. available = physical − unfulfilled active RAMPE order demand.

Stage must not double-subtract.

## Protocol synchronization completed at archive
Updated:
- `NORDIC_ID_PROGRESS_LOG.md`
- `NORDIC_ID_RFID_PROTOCOL.md`
- `NORDIC_TIL_RAMPE_STABLE_LOCK.md`
- `NORDIC_TIL_RAMPE_EXTENSION_COUNT_DISPLAY_2026-08-11.md`
- `NORDIC_TIL_LAGER_DEV_PROTOCOL.md`
- `PROTOCOL.md`
- `PROTOCOLS.md`
- `NEXT_CHAT_NORDIC_ID.txt`

Synchronization commits created during closure:
- Forlengere display PASS protocol: `fca890bd43eb91bb093153814ebf6e60ec4d6489`
- Til rampe stable lock: `77f6297f4ed934efb2c8118fb26e8afbe16dc007`
- canonical RFID protocol: `8c3e2ada864b4592577ded2e13b6913e02c6f4c1`
- project protocol: `bc4cc2b34310dc5a87aa435371e00b9d9c02486e`
- protocol index: `fb0af0797d802ae607f1dea366e1830f2a9435d7`
- permanent progress log: `6de9d8f7dfab9bf22c3a827aeccf9ad868918193`
- handoff: `f9d11c1e8cf12cea7ad703dfaad5812536987279`
- Til lager protocol: `ec8690ffddafbe32b2907f6ef4d15d6580d2ab29`

## Close decision
The specific tasks completed in this conversation — Til rampe WORK-default operation and Forlengere quantity display — are accepted and documented.

No urgent unfinished action is required before archiving this conversation.

When work resumes, read `NEXT_CHAT_NORDIC_ID.txt` first.