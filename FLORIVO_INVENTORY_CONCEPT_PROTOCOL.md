# Florivo Inventory / Inventering — ACTIVE DEV PROTOCOL

**Проєкт:** Florivo / BaMavaremottak  
**Оновлено:** 23.08.2026 09:25 Europe/Oslo  
**Статус:** ACTIVE DEV · Browser TEST V0.11 · PHYSICAL UX TESTING · NO LIVE MUTATION  
**Поточна сторінка:** `florivo-inventory-test.html`

> Inventering є окремим контуром фізичної інвентаризації. Під час обходу вона фіксує те, що реально бачить працівник, але НЕ змінює LIVE/WORK-stock автоматично. Чинні Nordic production-форми лишаються FROZEN.

## 0. Canonical dependencies
Перед змінами читати в такому порядку:
1. `PROJECT_CANONICAL_RULES.md`
2. `BAMAVAREMOTTAK_TEST_LIVE_PROTOCOL.md`
3. `PROTOCOLS.md`
4. цей файл
5. `NEXT_CHAT_FLORIVO_INVENTORY.txt`
6. `FLORIVO_NUMBER_PROTOCOL.md`
7. `NORDIC_ID_RFID_PROTOCOL.md` — лише для RFID/Wedge поведінки
8. `FLORIVO_ANDROID_SCANNER_CONCEPT_PROTOCOL.md` — для server-first архітектури

Для нових inventory process/session використовувати `mode='test'|'live'`. Новий `environment` для Inventory не створювати. TEST ніколи не впливає на live stock/statistics/orders/Nordic WORK.

## 1. Мета
Раз на місяць або за потреби працівник проходить склад і створює незалежний фізичний snapshot:

```text
SERVER EXPECTED
      ↕
PHYSICAL REALITY
```

Inventering під час обходу не повинна автоматично:
- додавати або списувати LIVE stock;
- змінювати `stock_status`;
- виправляти залишки;
- створювати fake RFID/EPC;
- приховувати невідомі або несподівані фізичні знахідки.

Після завершення формується AVVIK. Будь-яке подальше коригування LIVE — окрема audited дія з людським підтвердженням.

## 2. Inventory session
Майбутня серверна session повинна мати щонайменше:

```text
inventory_session_id
mode = test | live
started_at
started_by
device_id
warehouse/location
status = open | completed
completed_at
```

Історію попередніх інвентаризацій не перезаписувати.

Поточна Browser V0.11 ще зберігає TEST-session локально в браузері (`localStorage`). Це тимчасовий UX-прототип, не фінальна серверна архітектура.

## 3. НОВЕ ПРАВИЛО: інвентаризація по зонах / цехах
Уся inventory session ділиться на фізичні зони. Кожен count/scan/manual record ОБОВ'ЯЗКОВО належить до однієї зони.

Початковий перелік зон, назви можна уточнити пізніше:
- `Varemottak`
- `Plukk`
- `Produksjon`
- `Kald`
- `Varm`

Концептуально:

```text
INVENTORY SESSION
  ├─ Varemottak
  ├─ Plukk
  ├─ Produksjon
  ├─ Kald
  └─ Varm
```

Правила:
1. Перед початком рахунку оператор вибирає поточну зону.
2. Поточна зона лишається активною, доки оператор її не змінить.
3. У журналі сканера кожен запис має показувати/зберігати зону.
4. На ПК звіт можна дивитися по всьому складу або окремо по кожній зоні.
5. Якщо помилка виявлена лише в останньому цеху, можна повторно перевірити/перерахувати саме цю зону, не втрачаючи інші зони.
6. Завершення всієї inventory session не повинно стирати попередній zone history.
7. Майбутній повторний перерахунок зони повинен мати revision/recount history, а не silent overwrite.

### 3.1. Візуальна карта складу
Бажаний майбутній PC UX: графічна схема складу, де зони розміщені приблизно як у реальному приміщенні. Клік по зоні відкриває її inventory summary / AVVIK / записи.

Користувач може надати намальовану схему. Її треба використати як основу для web-візуалізації; не вигадувати геометрію складу без фактичної схеми.

## 4. НОВЕ ПРАВИЛО: повторюваний шаблон кількості всередині зони
У деяких цехах, особливо `Produksjon`, може бути багато однакових фізичних конфігурацій, наприклад:

```text
50 × (1 Bunner + 3 Hyller)
```

Не треба змушувати оператора 50 разів вводити `3`.

Потрібен zone/current-profile режим:

```text
POTOCZNY / CURRENT PROFILE
1 Bunner + Hyller
Default Hyller = 3
```

Після цього кожен наступний RFID у цій зоні відкривається вже з `3` у полі. Оператор бачить число і підтверджує або змінює його для конкретного Bunner.

Критично:
- кожен RFID все одно зберігається окремо;
- duplicate protection лишається;
- групова цифра `50 × ...` не повинна знищити individual tag identity;
- можна додати швидший confirmation UX після фізичного тесту, але не silent auto-save без окремого рішення.

## 5. Browser TEST V0.11 — фактично реалізовано
Поточна форма вже має:
- окрему кнопку `🧪 TEST · INVENTERING` на `scanner-home.html`;
- TEST default, WORK/LIVE неактивний;
- Norsk + Українська;
- Nordic ID RFID Wedge capture, сумісний із перевіреним Nordic flow;
- persistent current product mode між сканами;
- duplicate EPC/lower block у межах поточної локальної session;
- manual `MAN-xxx` flow;
- compact journal із пошуком та фільтрами;
- завершення локальної TEST-session;
- усі записи поки лише localStorage, без inventory DB і без LIVE mutation.

### 5.1. Поточні типи/UX
RFID/current modes:
- `1 Bunner + Hyller`
- `Bare 1 Bunner`
- `Bunner stabel`
- `Hyller vrak`
- `Bunner vrak`
- `Forlengere lange`
- `Forlengere korte`

Manual-only:
- `Bunner uten brikke`

`1 Bunner + Hyller`:
- quick `3 / 4 / 5`;
- `− / manual input / +`;
- quick `30 / 60`;
- велика OK/TELT кнопка.

`Bunner stabel`:
- default 10, editable.

`Bunner vrak`:
- default 10, editable.

`Forlengere lange/korte`:
- окреме manual поле `antall forlengere` — зараз без default;
- окремо `antall hyller` з `− / 15 / +` і quick `15 / 16`;
- обидва значення мають зберігатися окремо.

`Bunner uten brikke`:
- тільки manual;
- `MAN-xxx`;
- ручний count/calculator типу `10+10+3`.

## 6. Product = physical observation, not permanent tag identity
Inventory не повинна трактувати історичний `hyller30/hyller60/...` як незмінну фізичну істину.

Під час inventory оператор фіксує реальний стан зараз. Наприклад якщо історично tag був H60, але фізично сьогодні є `1 Bunner + 57 Hyller`, inventory записує 57 і створює AVVIK/history, а не блокує count.

## 7. RFID / number identity
Canonical number rules:
- `scanner_code` = повний реальний EPC;
- `lower_number` = тільки останні 6 символів реального EPC;
- `florivo_number` = окремий постійний внутрішній Florivo number;
- не записувати `florivo_number` у `lower_number`;
- no RFID read = no invented EPC/lower.

Окреме питання, яке треба дослідити перед DB schema: якщо великий фізично надрукований номер на бірці НЕ є `lower_number` і НЕ є `florivo_number`, для нього потрібне окреме поле на кшталт `physical_tag_number`. Не repurpose existing fields без доказу.

## 8. Duplicate protection
У межах однієї inventory session той самий реальний EPC не рахується двічі.

При повторному scan:

```text
⚠ ALLEREDE TELT
<tag/lower>
<zone>
<physical observation>
<telt time>
```

Майбутня `ENDRE` повинна редагувати наявний record із audit/revision, а не створювати другий count.

## 9. Manual / no-tag
Коли RFID відсутній/пошкоджений/не читається:
- створити inventory-only `MAN-xxx`;
- MAN не є RFID і не є `lower_number`;
- запис має містити zone + physical type/count;
- worker може фізично позначити товар MAN-number, щоб не порахувати його повторно.

## 10. Unknown / unexpected RFID
Inventory повинна дозволити записати фізичний факт навіть якщо server не очікує tag.

Варіанти:
- `UKJENT I SYSTEMET` — EPC відсутній у current server asset model;
- `FUNNET PÅ LAGER` — server має, наприклад, `dispatched`, але фізично товар знайдено.

Це evidence/AVVIK, а не автоматичний LIVE stock mutation.

## 11. Server-side target architecture
Після UX/zone design наступний етап — окремі server-side inventory records, орієнтовно:
- inventory sessions;
- inventory zone runs / zone recount revisions;
- inventory observations/items;
- discrepancy/AVVIK result or view;
- audit trail for any later correction.

Точну Supabase schema спочатку перевірити проти live database reality; не вигадувати production columns/functions і не торкатися frozen Nordic logic.

## 12. Завершення session
Перед `AVSLUTT INVENTERING` показувати мінімум:
- зони та їхній статус (не почато / в процесі / завершено / перераховано);
- unique RFID count;
- manual count;
- Bunner total;
- Hyller total;
- Forlengere long/short totals;
- Vrak;
- unknown/unexpected warnings;
- незавершені записи/зони.

Після confirm session стає `completed`; історія лишається доступною.

## 13. PC page `INVENTERINGER` — REQUIRED
На scanner лишається швидке collection UX. На ПК має бути повна сторінка:

```text
INVENTERINGER
  → inventory date/session
  → warehouse map / zones
  → SAMMENDRAG
  → AVVIK
  → ALLE TELTE
  → MANUELLE
  → IKKE FUNNET
  → zone-specific views
```

Пошук щонайменше по EPC/lower, Florivo number, MAN-number і, якщо буде окремий physical tag number, по ньому теж.

## 14. SERVER EXPECTED ↔ FAKTISK
Після завершення сервер формує discrepancy report.

Категорії:
- `MANGLER` — очікувався, але не знайдений;
- `FUNNET MEN IKKE FORVENTET` — фізично знайдений, але server не очікував;
- `UKJENT RFID`;
- `MANUELT TELT`;
- `FEIL ANTALL`;
- zone-specific discrepancy / recount history.

Порівняння має бути доступне для всього warehouse і для кожної zone окремо.

## 15. LIVE correction — окремий audited flow
`AVSLUTT INVENTERING` ніколи сам не виправляє LIVE stock.

Майбутній flow:

```text
INVENTORY COMPLETED
→ AVVIK REPORT
→ HUMAN REVIEW
→ APPROVE CORRECTION
→ AUDITED SERVER-SIDE ADJUSTMENT
```

Для кожної correction зберігати:
- inventory session;
- zone/record;
- хто і коли;
- old state/value;
- new state/value;
- reason;
- approved_by.

Silent overwrite заборонений.

## 16. Android future
Після Browser/Web physical pass успішна логіка переноситься в Florivo Android Scanner як тонкий клієнт:

```text
SCANNER READS + REQUESTS
→ SERVER VALIDATES + DECIDES
→ SCANNER SHOWS RESULT
```

Android не стає окремим джерелом складської істини.

## 17. FROZEN boundaries
1. Nordic TIL RAMPE frozen production logic не змінювати.
2. Nordic TIL LAGER production behavior не змінювати в рамках Inventory.
3. Inventory TEST не впливає на LIVE stock/statistics/orders.
4. Не створювати fake RFID/lower.
5. Не робити global `environment -> mode` migration під виглядом Inventory.
6. Будь-який LIVE correction — тільки окремо, audited, human-approved.

## 18. Поточний статус / next sequence
Станом на 23.08.2026:

```text
CONCEPT CREATED
→ Browser TEST implemented
→ Browser TEST evolved to V0.11
→ Nordic physical UX exercised on real device
→ product/count UX partially refined
→ zone/workshop segmentation ACCEPTED FOR NEXT DESIGN
→ server Inventory DB NOT YET CREATED
→ PC Inventering history/report page NOT YET CREATED
→ AVVIK engine NOT YET CREATED
→ LIVE correction flow NOT YET CREATED
→ NO LIVE INVENTORY MUTATION
```

Рекомендований наступний порядок:
1. додати zone selection + zone journal + zone recount UX у Browser TEST;
2. додати current-profile/default quantity per zone (наприклад Produksjon = 1 Bunner + 3 Hyller);
3. фізично протестувати zone flow на Nordic;
4. після UX PASS спроектувати server inventory schema (`mode=test/live`);
5. створити PC `INVENTERINGER` + zone map/report;
6. додати SERVER EXPECTED ↔ FAKTISK / AVVIK;
7. лише потім проєктувати audited LIVE correction.
