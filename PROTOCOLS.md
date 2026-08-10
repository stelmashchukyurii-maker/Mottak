# BaMavaremottak — індекс протоколів проєкту

**Призначення:** постійна точка входу для нових розмов ChatGPT, розробників і тестувальників.  
**Репозиторій:** `stelmashchukyurii-maker/Mottak`  
**Основна гілка:** `main`  
**Оновлено:** 10.08.2026 20:37 Europe/Oslo

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
NORDIC_TIL_RAMPE_STABLE_LOCK.md
```

Історичний повний Nordic research snapshot до переходу на V2.9.7:

```text
NORDIC_ID_RFID_PROTOCOL_ARCHIVE_2026-08-09.md
```

Старий загальний handoff:

```text
docs/HANDOFF_2026-08-09_1213.md
```

залишається важливим для Camera / UT / загальної архітектури того етапу, але **не має пріоритету над поточними Nordic-протоколами**.

---

## 2. Поточний Nordic ID status

Офіційна стабільна outgoing-форма:

```text
Nordic ID – Til rampe
nordic-id-til-rampe-stable.html
STABLE V2.9.7
```

Frozen source commit:

```text
ed3a19b20efd9af0bf07bc4a079589b3b6038157
```

Final stable-entry commit:

```text
f049f5c568dd592f64c8cfadbd416622e5c5fc9d
```

Правило:

```text
STABLE НЕ ПЕРЕПИСУВАТИ І НЕ ВИДАЛЯТИ.
```

Нові Nordic експерименти — тільки:

```text
utsending-nordic-test.html
```

або нова DEV-копія.

Фізично підтверджено в TEST:
- V2.4 hidden RFID/Wedge engine;
- 24-char EPC;
- 600 ms lock;
- TEST / WORK switch;
- SMART FOCUS;
- RAMPE progress: замовлено / виконано / залишилось / наступний товар;
- Bunner / H30 / H60 confirm;
- TEST duplicate EPC;
- Forlengere counts on outgoing;
- INPUT LOCK;
- COUNT COMPACT.

Повний фізичний WORK end-to-end запланований на 11.08.2026. До цього stable-код не змінювати.

---

## 3. scanner-home — поточний робочий вигляд

`scanner-home.html` очищено від історичних/DEV карток.

Оператор бачить тільки:

```text
📥 НА СКЛАД
📤 TIL RAMPE
```

`TIL RAMPE` веде тільки на final STABLE V2.9.7.

Приховані з робочого екрана, але збережені в GitHub:
- `utsending-nordic-test.html` — DEV;
- `nordic-id-v24-stable.html` — historical RFID rollback;
- `nordic-id-v20-focus.html` — V2.1 diagnostic/test base.

Не видаляти ці файли без окремого рішення.

---

## 4. Shared TEST / WORK architecture

Активні Nordic TEST і WORK використовують common public tables, розділені:

```text
environment = test
environment = work
```

Ключові таблиці:

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
TEST  → x-bama-environment:test
WORK  → x-bama-environment:work
legacy production browser without header → WORK
```

Серверно перевірено:
- TEST/WORK isolation;
- TEST same EPC repeat allowed;
- WORK duplicate protection;
- cross-link guards між stock/order/scan environments;
- old `ut_test_*` = archive/rollback, не активний backend.

---

## 5. RFID mapping

```text
full 24-char Nordic EPC → scanner_code
last 6 chars             → lower_number
upper_number             → ''
```

Camera може мати:

```text
scanner_code = ''
lower_number = 6-char value
```

Не вигадувати RFID number, якщо EPC не прочитаний.

---

## 6. WORK unknown RFID tag flow

Якщо WORK EPC прочитаний:

```text
existing + available → reuse stock row
already staged/unavailable → warning/block
missing stock row → offer register now + continue to current RAMPE
```

При register + continue:
- full EPC зберігається в `scanner_code`;
- last 6 в `lower_number`;
- товар одразу продовжує outgoing flow на поточну RAMPE.

Якщо RFID EPC не прочитаний:

```text
НЕ створювати фіктивний номер.
```

Статус: implementation/server-ready; фізичний WORK-test — 11.08.2026.

---

## 7. Forlengere business rule

Authoritative products:

```text
bunner
hyller30
hyller60
forlengere_korte
forlengere_lange
forlengere_plast
```

`forlengere_plast` — без RFID / manual phone flow.

Для `forlengere_korte` / `forlengere_lange`:
- `hyller_count` та `forlengere_count` вводяться **при Utsending / списанні**;
- на Mottak counts не вводити;
- production `ut_extra_confirmations` використовується для outgoing confirmations.

---

## 8. Nordic Wedge / hardware rule

Робочий шлях:

```text
RFID tag → Nordic ID → RFID Wedge Service → keyboard input → Chrome → web form
```

Known safe Wedge baseline:
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

Короткі trigger presses.

Не використовувати CC4Scanner і Wedge одночасно.

---

## 9. Поточний наступний Nordic етап

11.08.2026:

1. відкрити `Nordic ID – Til rampe · STABLE V2.9.7`;
2. перейти свідомо в WORK;
3. зробити фізичний end-to-end на реальному складі;
4. окремо перевірити unknown-tag flow;
5. якщо PASS — **не змінювати код**, лише додати `WORK CONFIRMED` у протоколи.

Після цього окремий напрям:

```text
📥 НА СКЛАД
```

Nordic Mottak / INN форма має створюватися окремо і не змінювати `Nordic ID – Til rampe` STABLE.

---

## 10. Обов'язковий протокол розробки GREEN / WORKING

Для звичайних production форм діє правило:

```text
GREEN
→ робимо всю зміну повністю
→ користувач тестує
→ PASS
→ переносимо весь перевірений bundle у WORKING
```

Не змінювати WORKING паралельно під час GREEN-розробки.
Не робити partial transfer одного скрипта або однієї латки.

Nordic `Til rampe` має окремий стабільний snapshot-процес, описаний у `NORDIC_TIL_RAMPE_STABLE_LOCK.md`.

---

## 11. Stock lifecycle

Поточні складські статуси:

```text
in_stock
staged
dispatched
```

`reserved` не використовувати як `mottak_scans.stock_status`.

Значення:
- `in_stock` = фізично на складі;
- `staged` = на рампі / підготовлено;
- `dispatched` = списано / відправлено.

Cancel logic не повинна повертати `dispatched` назад на склад.

Поточні числові залишки завжди читати з БД, не з історичних baseline у старих протоколах.

---

## 12. Products registry

Центральний registry:

```text
products.js
```

Активні ID:

```text
bunner
hyller30
hyller60
cc_post
forlengere_korte
forlengere_lange
forlengere_plast
```

`cc_post` — derived/display-only, не окремий вручну tracked stock product.

---

## 13. Відомі регресії, які не повторювати

### MutationObserver feedback loop
Не створювати observer, який реагує на style/DOM mutation і сам безкінечно створює нову mutation.

### Partial GREEN → WORKING transfer
Не переносити перевірений bundle частинами.

### inputmode=none on RFID receiver
Не використовувати: раніше фізично блокував нормальний Wedge RFID input.

### Long trigger hold
Не використовувати як робочий режим: генерує повторні `Unidentified` events.

---

## 14. Інші чинні / історичні протоколи

Загальний handoff до Nordic-фази:

```text
docs/HANDOFF_2026-08-09_1213.md
```

UT TEST chain:

```text
docs/UT_TEST_CHAIN_PROTOCOL_2026-08-08.md
docs/UT_TEST_CHAIN_STATUS_2026-08-08.md
```

INN history:

```text
docs/INN_PROTOCOL_2026-08-03.md
```

UT production history:

```text
docs/UT_PROTOCOL_2026-08-04.md
docs/UT_PROTOCOL_2026-08-03.md
```

Старі файли — історія. Поточне явне рішення користувача й current canonical protocols мають вищий пріоритет.

---

## 15. Порядок джерел істини

```text
1. Поточне явне рішення користувача
2. NEXT_CHAT_NORDIC_ID.txt — для Nordic ID current state
3. NORDIC_ID_RFID_PROTOCOL.md
4. NORDIC_ID_PROGRESS_LOG.md
5. NORDIC_TIL_RAMPE_STABLE_LOCK.md
6. PROTOCOLS.md / PROTOCOL.md
7. Актуальний code main + pinned stable commit
8. Фактична Supabase schema/functions/data
9. Старі handoff/protocol files як історія
```

Перед фактичною зміною коду завжди перечитати активні файли й перевірити schema/RPC, якщо зміна торкається БД.

---

## 16. Правило оновлення протоколів

Після кожного підтвердженого успішного / завершеного кроку:
- оновити `NORDIC_ID_PROGRESS_LOG.md`;
- оновити `NEXT_CHAT_NORDIC_ID.txt`, якщо змінився current state;
- оновити `NORDIC_ID_RFID_PROTOCOL.md`, якщо змінилася канонічна архітектура;
- оновити `NORDIC_TIL_RAMPE_STABLE_LOCK.md`, якщо змінився stable contract / recovery / visibility;
- після великого milestone синхронізувати `PROTOCOLS.md` і `PROTOCOL.md`.

Невдалі експерименти не записувати як PASS.
