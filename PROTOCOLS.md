# BaMavaremottak — індекс протоколів проєкту

**Призначення:** постійна точка входу для нових розмов ChatGPT, розробників і тестувальників.  
**Репозиторій:** `stelmashchukyurii-maker/Mottak`  
**Основна гілка:** `main`  
**Оновлено:** 10.08.2026 22:16 Europe/Oslo

---

## 1. НАЙНОВІШИЙ HANDOFF — обов'язкова стартова точка

Для Nordic ID / RFID починати з:

```text
NEXT_CHAT_NORDIC_ID.txt
```

Далі читати:

```text
NORDIC_ID_RFID_PROTOCOL.md
NORDIC_ID_PROGRESS_LOG.md
NORDIC_TIL_LAGER_DEV_PROTOCOL.md
NORDIC_TIL_RAMPE_STABLE_LOCK.md
```

`NORDIC_TIL_LAGER_DEV_PROTOCOL.md` — тільки поточний incoming DEV state; не вважати physical PASS або STABLE.

Історичний Nordic snapshot:

```text
NORDIC_ID_RFID_PROTOCOL_ARCHIVE_2026-08-09.md
```

Старий загальний handoff:

```text
docs/HANDOFF_2026-08-09_1213.md
```

залишається історичним джерелом для Camera / UT, але не має пріоритету над current Nordic protocols.

---

## 2. Поточний Nordic ID status

### Outgoing — frozen stable

```text
Nordic ID – Til rampe
nordic-id-til-rampe-stable.html
STABLE V2.9.7
```

Frozen source commit:
`ed3a19b20efd9af0bf07bc4a079589b3b6038157`

Final stable-entry commit:
`f049f5c568dd592f64c8cfadbd416622e5c5fc9d`

Правило:
`STABLE НЕ ПЕРЕПИСУВАТИ І НЕ ВИДАЛЯТИ.`

Physical TEST PASS includes:
- V2.4 hidden RFID/Wedge;
- 24-char EPC;
- 600 ms lock;
- TEST/WORK switch;
- SMART FOCUS;
- ordered/done/remaining/next;
- TEST duplicate EPC;
- Forlengere outgoing counts;
- INPUT LOCK;
- COUNT COMPACT.

### Incoming — current DEV

```text
Nordic ID – Til lager
nordic-id-til-lager-test.html
DEV V1.0.1 · TEST FIRST
```

Status:
- server groundwork ready;
- physical Nordic PASS ще нема;
- WORK не тестувати до TEST physical PASS;
- detailed DEV state: `NORDIC_TIL_LAGER_DEV_PROTOCOL.md`.

---

## 3. scanner-home — поточний вигляд

Оператор бачить:

```text
📥 TIL LAGER   → DEV V1.0.1 · TEST FIRST
📤 TIL RAMPE   → STABLE V2.9.7 · LOCKED
```

Приховані, але збережені:
- `utsending-nordic-test.html` — outgoing DEV;
- `nordic-id-v24-stable.html` — historical RFID rollback;
- `nordic-id-v20-focus.html` — V2.1 diagnostic/test base.

---

## 4. Shared TEST / WORK architecture

Shared public tables:

```text
mottak_scans
ut_orders
ut_order_items
ut_order_scans
ut_extra_confirmations
mottak_stock_events
```

Routing:

```text
TEST → x-bama-environment:test
WORK → x-bama-environment:work
legacy browser without header → WORK
```

Server-verified:
- TEST/WORK isolation;
- TEST same EPC repeat allowed;
- WORK duplicate protection;
- cross-link guards;
- old `ut_test_*` = archive/rollback.

---

## 5. RFID mapping

```text
full 24-char Nordic EPC → scanner_code
last 6 chars             → lower_number
upper_number             → ''
```

Camera fallback may have:

```text
scanner_code = ''
lower_number = 6-char value
```

Never invent RFID when EPC was not read.

---

## 6. Authoritative products

Central registry:

```text
products.js · v1.3.0
```

RFID product IDs:

```text
bunner
hyller30
hyller60
forlengere_korte
forlengere_lange
vrak_bunner
vrak_hyller
```

No RFID:

```text
forlengere_plast
```

Business rules:
- RFID on everything except Forlengere plast;
- all products may go to RAMPE;
- Vrak bunner = 10 per RFID stack;
- Vrak hyller = 30 per RFID stack;
- Forlengere korte/lange counts only at outgoing, not Mottak;
- CC Post remains derived/display-only.

Server constraints accept all seven RFID products in `mottak_scans` and `ut_order_scans`.
Forlengere plast intentionally remains outside RFID scan constraints.

---

## 7. WORK unknown RFID tag flow

Til rampe WORK:

```text
existing + available → reuse
staged/unavailable → warning/block
missing stock row → register now + continue current RAMPE
no EPC → no fake number
```

`private.nordic_preview(uuid,text)` is server-compatible with Vrak bunner / Vrak hyller without changing frozen V2.9.7 frontend.

---

## 8. Til lager DEV flow

```text
TEST default
WORK = 1.5 s hold + confirm
select product once
Unidentified → arm hidden RFID input
24 HEX EPC
600 ms lock
scan → product + lower 6 → confirm
success → PÅ LAGER → READY
```

WORK merge rule with Camera:
- same product + same lower + Camera row with `scanner_code=''` + `in_stock` → enrich same row with full EPC, preserve photo, no duplicate;
- different product → block;
- existing full RFID → block duplicate/status;
- staged/dispatched → block;
- missing → create verified/in_stock row.

V1.0.1 specifically keeps RFID receiver focused while hiding soft keyboard.

---

## 9. Server verification for Vrak

Transactional browser-role checks:
- TEST same fake Vrak RFID twice → 2 rows allowed;
- WORK same fake Vrak RFID twice → only 1 row;
- all tests rolled back;
- post-test artificial row count = 0.

This is SERVER PASS only.

---

## 10. Camera fallback

Physical PASS:

```text
Camera v4.25 LOWER RESET
Camera v4.26 AUTO SAVE FOCUS
```

Confirmed:
- save no longer leaves floating bar stuck at `ОБРОБКА…`;
- after save returns to `📷 ФОТО`;
- after valid OCR auto-scrolls/highlights `💾 ЗБЕРЕГТИ`.

Current wrapper:

```text
Camera v4.27 · RFID FALLBACK PRODUCTS
```

Unconfirmed physically. Adds fallback choices:
- Forlengere korte
- Forlengere lange
- Vrak bunner
- Vrak hyller

v4.26 remains last physical Camera PASS/rollback in GitHub history.

---

## 11. UT Kontor

User rule: existing layout/behavior is good; do not redesign it.

Current additive changes:
- production language forced to Norwegian before language module;
- `ut-kontor-vrak-products.js` adds Vrak bunner / Vrak hyller;
- existing six product flows stay in original module;
- Vrak use same `Send hele rampen` save path;
- visible brand: `UT Kontor WORKING v36 · 8 PRODUKTER`.

Norwegian + Vrak browser confirmation still required before logging PASS.

---

## 12. Nordic Wedge / hardware rule

```text
RFID tag → Nordic ID → RFID Wedge Service → keyboard input → Chrome → web form
```

Safe baseline:
- Automatic start OFF;
- Trigger RFID;
- Re-trigger Cancel current operation;
- Long press OFF;
- Hex string;
- UTF-8;
- LF;
- empty prefix/postfix;
- Inventory;
- max tags 0;
- timeout 0.

Short presses.
Do not use CC4Scanner and Wedge simultaneously.
Do not use `inputmode=none` for RFID receiver.

---

## 13. Stock lifecycle

```text
in_stock
staged
dispatched
```

- `in_stock` = physically available warehouse stock;
- `staged` = on ramp / prepared;
- `dispatched` = sent / written off.

Do not treat `reserved` as `mottak_scans.stock_status`.
Cancel must never resurrect dispatched rows.
Always query current DB for stock numbers.

---

## 14. Відомі регресії, які не повторювати

### MutationObserver feedback loop
Do not observe style/DOM mutations and write the same style/DOM in an endless loop.

### Partial GREEN → WORKING transfer
Do not transfer a tested bundle in fragments.

### `inputmode=none` on RFID receiver
Previously broke physical Wedge input.

### Soft-keyboard helper with unconditional blur
Do not blur hidden RFID input immediately after hardware arm. Til lager V1.0.1 fixed this.

### Long trigger hold
Creates repeated `Unidentified` events. Use short trigger presses.

---

## 15. Інші чинні / історичні протоколи

```text
docs/HANDOFF_2026-08-09_1213.md
docs/UT_TEST_CHAIN_PROTOCOL_2026-08-08.md
docs/UT_TEST_CHAIN_STATUS_2026-08-08.md
docs/INN_PROTOCOL_2026-08-03.md
docs/UT_PROTOCOL_2026-08-04.md
docs/UT_PROTOCOL_2026-08-03.md
```

Older files are history. Current explicit user decisions and canonical protocols have priority.

---

## 16. Порядок джерел істини

```text
1. Current explicit user decision
2. NEXT_CHAT_NORDIC_ID.txt
3. NORDIC_ID_RFID_PROTOCOL.md
4. NORDIC_ID_PROGRESS_LOG.md
5. NORDIC_TIL_LAGER_DEV_PROTOCOL.md for current incoming DEV
6. NORDIC_TIL_RAMPE_STABLE_LOCK.md for stable contract
7. PROTOCOLS.md / PROTOCOL.md
8. Current main code + pinned stable commit
9. Actual Supabase schema/functions/data
10. Old handoff/protocol files as history
```

---

## 17. Правило оновлення протоколів

After every confirmed successful/completed step:
- update `NORDIC_ID_PROGRESS_LOG.md`;
- update `NEXT_CHAT_NORDIC_ID.txt` if current state changed;
- update `NORDIC_ID_RFID_PROTOCOL.md` if canonical architecture changed;
- update `NORDIC_TIL_LAGER_DEV_PROTOCOL.md` during incoming DEV;
- update `NORDIC_TIL_RAMPE_STABLE_LOCK.md` only if stable contract changes;
- after major milestones sync `PROTOCOLS.md` and `PROTOCOL.md`.

Failed experiments are not PASS.

---

## 18. Immediate next physical test

One step at a time:

```text
scanner-home.html
→ 📥 TIL LAGER
→ verify DEV V1.0.1 + TEST
```

Then choose Bunner or Vrak bunner and do one short RFID scan.
After result, query DB/log before WORK.
