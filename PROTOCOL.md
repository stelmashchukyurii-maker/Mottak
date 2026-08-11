# BaMavaremottak — Project Protocol

**Оновлено:** 11.08.2026 22:43 Europe/Oslo

## CURRENT OPERATIONAL STATE

### Nordic scanner home — WORK default
`scanner-home.html`

- `📥 TIL LAGER · WORK` → `nordic-id-til-lager-v104.html`
- `📤 TIL RAMPE · WORK` → `nordic-id-til-rampe-work-default.html`
- TEST remains available manually inside each form.

### Nordic Til rampe
Frozen business logic:
`V2.9.7` at commit `ed3a19b20efd9af0bf07bc4a079589b3b6038157`.

Do not rewrite RFID / confirm / count-entry / staging / dispatch logic without explicit user approval.

Operational WORK-default wrapper is physically confirmed on Nordic.
Forlengere piece-count display (`NNN stk.` from real `ut_extra_progress.forlengere_count`) is also physically confirmed.

Stable/operational lock:
`NORDIC_TIL_RAMPE_STABLE_LOCK.md`

Display patch record:
`NORDIC_TIL_RAMPE_EXTENSION_COUNT_DISPLAY_2026-08-11.md`

### Nordic Til lager
Current:
`DEV V1.0.4 / WORK DEFAULT`

Entry:
`nordic-id-til-lager-v104.html`

Real WORK Nordic intake path is proven in DB. The final V1.0.4 visual WORK-default startup still needs explicit physical confirmation before being called UI PASS.

Protocol:
`NORDIC_TIL_LAGER_DEV_PROTOCOL.md`

## Product model
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

Rules:
- Vrak bunner = 10 per RFID stack.
- Vrak hyller = 30 per RFID stack.
- short/long counts are entered at outgoing.
- plastic is quantity-only; never fake RFID.

## RFID contract
- full 24-char EPC → `scanner_code`
- last 6 → `lower_number`
- `upper_number=''`
- no EPC read → never invent RFID.

## Shared TEST / WORK architecture
Tables use `environment=test/work` isolation.
TEST repeated EPC allowed. WORK duplicate protection remains mandatory.

## Canonical stock model
RPC:
`bama_stock_summary()`

Two counters:
1. physical warehouse;
2. available warehouse = physical − still-unfulfilled active RAMPE demand.

Order create/edit changes available immediately. Staging does not double-subtract.

### Historical baseline reset
11.08.2026 35 old WORK RFID units were moved from `in_stock` to `dispatched` after user confirmed they had already physically shipped manually.

Record:
`WORK_STOCK_BASELINE_RESET_2026-08-11.md`

New stock was subsequently received. Never reuse the old zero baseline as current stock; query live DB.

Archive-time stock snapshot 11.08.2026 22:43:
- Bunner 25
- H30 3
- H60 20
- korte 4
- lange 4
- plast 0
- Vrak bunner 0
- Vrak hyller 2
- on-ramp 0 / order_remaining 0 for all 8.

Snapshot only — not a future constant.

## RAMPE 28 trial
WORK order `34113828-6904-4254-bc85-7c2cd8e8bbd1`, RAMPE 28, was used for real partial Nordic testing.

Confirmed partial flow:
- Bunner 1/1
- Forlengere korte 1/1
- Forlengere lange 1/1
- both extension confirmations stored 15 hyller + 150 forlengere.

The trial was later cancelled/released. It is not active and no stock remains on ramp from it.

## Manual WORK receipt
3 × Hyller x30 manually received with lower numbers:
`000012`, `000013`, `000014`.

No fake EPC was created.

## Deferred items
### Vrak/all-8 outgoing UI
Separate `Nordic ID – Til rampe · DEV V2.9.8` exists for complete visual Vrak/all-product progress.
Server lifecycle already passes, but UI DEV is not physical PASS and not linked from scanner home.

### Camera
Last physical rollback PASS: v4.26.
Current v4.29 remains not fully physically accepted.

### UT Kontor
Current v37 remains preserved and not fully physically accepted in this session.

### Lager Admin
TEST-only DEV. User explicitly deferred it. WORK remains server-locked.

## Protocol order
1. `NEXT_CHAT_NORDIC_ID.txt`
2. `NORDIC_ID_RFID_PROTOCOL.md`
3. `NORDIC_ID_PROGRESS_LOG.md`
4. `NORDIC_TIL_RAMPE_STABLE_LOCK.md`
5. `NORDIC_TIL_LAGER_DEV_PROTOCOL.md`
6. `NORDIC_TIL_RAMPE_V298_DEV_PROTOCOL.md` only when resuming Vrak/all-8 outgoing DEV
7. `NORDIC_SESSION_ARCHIVE_2026-08-11_2243.md` for this session closure.

## User change-control rule
If an already working production behavior appears problematic, explain the issue first and get explicit authorization before modifying it.

## Session status
The Forlengere display task and Til rampe WORK-default task are complete and accepted.
This conversation can be archived after protocol synchronization.
