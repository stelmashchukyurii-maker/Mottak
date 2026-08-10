# BaMavaremottak — Project Protocol

**Оновлено:** 10.08.2026 22:15 Europe/Oslo

## CURRENT PRIORITY — Nordic ID / Til lager

Офіційна стабільна outgoing / ramp operation:

`Nordic ID – Til rampe · STABLE V2.9.7`

Stable entry:
`nordic-id-til-rampe-stable.html`

Критичне правило:
- STABLE не переписувати й не видаляти;
- frozen source commit: `ed3a19b20efd9af0bf07bc4a079589b3b6038157`;
- final stable-entry commit: `f049f5c568dd592f64c8cfadbd416622e5c5fc9d`;
- outgoing experiments only in DEV.

Поточний `scanner-home.html`:
- `📥 TIL LAGER` → `nordic-id-til-lager-test.html` → DEV V1.0.1 · TEST FIRST;
- `📤 TIL RAMPE` → frozen final stable V2.9.7.

`Til lager` не називати stable до фізичного Nordic PASS.
Детальний DEV state: `NORDIC_TIL_LAGER_DEV_PROTOCOL.md`.

### TEST / WORK
Shared public tables розділені `environment=test/work`.
TEST дозволяє duplicate EPC; WORK зберігає duplicate protection.

### RFID products
Central registry `products.js` v1.3.0.

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
- Vrak bunner = 10 per RFID stack;
- Vrak hyller = 30 per RFID stack;
- усі продукти можуть іти на RAMPE;
- korte/lange counts вводяться при outgoing, не Mottak.

### Server groundwork
- product constraints розширені для Vrak + korte/lange RFID;
- `private.nordic_preview` розширено для Vrak без зміни frozen Til rampe frontend;
- TEST duplicate Vrak RFID transactional check = allowed;
- WORK duplicate Vrak RFID transactional check = blocked;
- test rows rolled back, production не засмічено.

### WORK unknown RFID tag
Якщо EPC прочитаний, але WORK stock row відсутній, `Til rampe` пропонує register + continue to current RAMPE.
Якщо EPC не прочитаний — фіктивний номер не створювати.

### Camera fallback
Confirmed PASS:
- Camera v4.25 LOWER RESET;
- Camera v4.26 AUTO SAVE FOCUS.

Current Camera wrapper v4.27 adds fallback product choices for korte/lange/Vrak, але ще не physical PASS.

### UT Kontor
- Existing layout/behavior зберігати.
- Мова примусово повернена на Norwegian (`mottak_ut_language=no`).
- `ut-kontor-vrak-products.js` additive-only додає Vrak bunner / Vrak hyller.
- Existing six product flows не переписані.
- UI now identifies 8 products.
- Norwegian + Vrak browser confirmation ще потрібна перед PASS.

### Протоколи Nordic
Перед Nordic-змінами читати:
1. `NEXT_CHAT_NORDIC_ID.txt`
2. `NORDIC_ID_RFID_PROTOCOL.md`
3. `NORDIC_ID_PROGRESS_LOG.md`
4. `NORDIC_TIL_LAGER_DEV_PROTOCOL.md` для incoming DEV
5. `NORDIC_TIL_RAMPE_STABLE_LOCK.md` якщо зміна торкається stable

Історичний snapshot:
`NORDIC_ID_RFID_PROTOCOL_ARCHIVE_2026-08-09.md`

### Next physical step
- `scanner-home.html` → `📥 TIL LAGER`;
- verify `DEV V1.0.1` + TEST;
- choose Bunner або Vrak bunner;
- one short RFID scan;
- confirm;
- query DB/log;
- WORK тільки після TEST physical PASS.

---

## 07.08.2026 — Historical session archive

### UT warehouse page
- Historical working page: `utsending.html`
- Historical version at that checkpoint: **UT Lager v27.12 AVBRYT**
- Architecture lightweight/event-driven: no continuous MutationObserver loops and no periodic UI polling in wrapper.
- Opening RAMPE auto-scrolls once to opened active-ramp detail.
- Existing `ut-bulk.html` mass-selection workflow under **Masseskanning / Масове сканування**.
- Red **Cancel order / Скасувати замовлення** button added.
- Cancellation uses `cancel_ut_order` and returns only goods still `reserved` or `staged` on ramp.
- Goods already `dispatched` must never be returned by cancellation.
- Cancelled orders remain in history; they are not deleted.

### Historical stock rule at 07.08 checkpoint
Stock was verified non-test rows with `stock_status = in_stock`.
Historical baseline recorded then:

**Bunner — 8**
- 0354F6
- 09B982
- 135991
- 19A34B
- 2A7B6C
- 2E9147
- 311C3F
- 3450AC

**Hyller x30 — 7**
- 14FB7E
- 16CB03
- 2048A3
- 297DC4
- 31B80A
- 41B256
- 491CAE

**Hyller x60 — 2**
- 09FA9F
- 15B8A1

Historical total: **17 items = 8 B + 7 Hx30 + 2 Hx60**.

This baseline is historical only and must not be treated as current stock without querying the database.

### Lifecycle rule retained
- `in_stock` = physically available warehouse stock.
- `staged` = physically on ramp / ready for dispatch.
- `dispatched` = already written off / sent.
- Cancel flow must never resurrect already dispatched goods.

### Session closure marker
⛔ 07.08 session archived by user request.
