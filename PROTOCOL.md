# BaMavaremottak — Project Protocol

**Оновлено:** 10.08.2026 20:37 Europe/Oslo

## CURRENT PRIORITY — Nordic ID

Офіційна стабільна форма outgoing / ramp operation:

`Nordic ID – Til rampe · STABLE V2.9.7`

Stable entry:

`nordic-id-til-rampe-stable.html`

Критичне правило:
- STABLE не переписувати й не видаляти;
- frozen source commit: `ed3a19b20efd9af0bf07bc4a079589b3b6038157`;
- final stable-entry commit: `f049f5c568dd592f64c8cfadbd416622e5c5fc9d`;
- нові експерименти тільки у DEV (`utsending-nordic-test.html` або нова DEV-копія).

Поточний `scanner-home.html` показує оператору тільки:
- `📥 НА СКЛАД` — майбутня Nordic Mottak / INN форма;
- `📤 TIL RAMPE` — final stable V2.9.7.

V2.4, V2.1 і DEV збережені в GitHub, але приховані з робочого екрана.

### TEST / WORK
Активні TEST і WORK працюють у shared public tables, розділених `environment=test/work`.
TEST дозволяє duplicate EPC для симуляцій; WORK зберігає duplicate protection.

### WORK unknown RFID tag
Якщо EPC прочитаний, але WORK stock row відсутній, `Til rampe` пропонує оприбуткувати товар із цією біркою й одразу продовжити на поточну RAMPE.
Якщо EPC не прочитаний — фіктивний номер не створювати.

Повний фізичний WORK end-to-end запланований на 11.08.2026. До PASS stable-код не змінювати.

### Forlengere
Forlengere korte/lange:
- `hyller_count` + `forlengere_count` вводяться при Utsending / списанні;
- на Mottak counts не вводити.

### Протоколи Nordic
Перед Nordic-змінами читати:
1. `NEXT_CHAT_NORDIC_ID.txt`
2. `NORDIC_ID_RFID_PROTOCOL.md`
3. `NORDIC_ID_PROGRESS_LOG.md`
4. `NORDIC_TIL_RAMPE_STABLE_LOCK.md`

Історичний Nordic research snapshot:
`NORDIC_ID_RFID_PROTOCOL_ARCHIVE_2026-08-09.md`

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
