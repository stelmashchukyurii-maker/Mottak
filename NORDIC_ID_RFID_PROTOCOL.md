# Nordic ID RFID — АКТУАЛЬНИЙ КАНОНІЧНИЙ ПРОТОКОЛ

**Проєкт:** BaMavaremottak / AI Scanner Mottak  
**Оновлено:** 10.08.2026 22:14 Europe/Oslo  
**Статус:** ГОЛОВНИЙ Nordic ID / RFID канон для наступних розмов  
**Handoff:** `NEXT_CHAT_NORDIC_ID.txt`  
**Til lager DEV:** `NORDIC_TIL_LAGER_DEV_PROTOCOL.md`  
**Історичний snapshot 09.08:** `NORDIC_ID_RFID_PROTOCOL_ARCHIVE_2026-08-09.md`

> ПРАВИЛО №1: перед будь-яким Nordic ID / RFID кроком прочитати `NEXT_CHAT_NORDIC_ID.txt`, цей файл, `NORDIC_ID_PROGRESS_LOG.md`, а для `Til lager` також `NORDIC_TIL_LAGER_DEV_PROTOCOL.md`. Якщо змінюється STABLE — прочитати `NORDIC_TIL_RAMPE_STABLE_LOCK.md`.

---

# 1. Незмінний stable результат — Til rampe

Офіційна стабільна outgoing-форма:

`Nordic ID – Til rampe`

Stable entry:
`nordic-id-til-rampe-stable.html`

Stable version:
`V2.9.7`

Frozen source commit:
`ed3a19b20efd9af0bf07bc4a079589b3b6038157`

Final stable-entry commit:
`f049f5c568dd592f64c8cfadbd416622e5c5fc9d`

**Цю STABLE-форму не переписувати й не видаляти.**

Outgoing frontend-експерименти — тільки в `utsending-nordic-test.html` або окремій DEV-копії.

---

# 2. scanner-home — поточний екран

`scanner-home.html` показує дві основні операції:

1. `📥 TIL LAGER` → `nordic-id-til-lager-test.html` → **DEV V1.0.1 · TEST FIRST**.
2. `📤 TIL RAMPE` → `Nordic ID – Til rampe · STABLE V2.9.7`.

`Til lager` поки **не STABLE і не physical PASS**.

Приховані, але збережені в GitHub:
- `nordic-id-v24-stable.html` — RFID rollback;
- `nordic-id-v20-focus.html` — V2.1 diagnostic/test base;
- `utsending-nordic-test.html` — outgoing DEV copy.

---

# 3. Фізично підтверджений Til rampe V2.9.7 TEST flow

Підтверджено на Nordic ID:
- V2.4 hidden RFID/Wedge engine;
- full 24-char HEX EPC;
- 600 ms FIRST TAG lock;
- TEST / WORK switch;
- SMART FOCUS;
- ordered / done / remaining / next;
- Bunner / Hyller x30 / Hyller x60 simple confirmation;
- TEST duplicate EPC allowed;
- Forlengere korte/lange counts тільки при outgoing;
- INPUT LOCK;
- COUNT COMPACT;
- після дії екран повертається до актуального прогресу RAMPE.

Користувач підтвердив цей TEST-flow і наказав заморозити V2.9.7.

---

# 4. RFID mapping

Nordic:
- `scanner_code = full 24-char EPC`
- `lower_number = last 6 chars uppercase`
- `upper_number = ''`

Приклад:
`33161403D0000785000E3103` → `0E3103`

Camera/телефон може мати:
- `scanner_code=''`
- тільки `lower_number`.

Якщо EPC не прочитаний — фіктивний RFID number не створювати.

---

# 5. Wedge / Nordic hardware

Шлях:
`RFID tag → Nordic ID reader → RFID Wedge Service → keyboard input → Chrome → web form`

Known safe baseline:
- Automatic start OFF;
- Trigger RFID;
- Re-trigger = Cancel current operation;
- Long press OFF;
- Hex string;
- UTF-8;
- LF suffix;
- empty prefix/postfix;
- Inventory;
- max tags 0;
- timeout 0.

Короткі trigger presses.
Не використовувати CC4Scanner і Wedge одночасно.
Не використовувати `inputmode=none` на RFID receiver.

---

# 6. Shared TEST / WORK architecture

Активні TEST і WORK використовують shared public tables з `environment=test/work`:
- `mottak_scans`
- `ut_orders`
- `ut_order_items`
- `ut_order_scans`
- `ut_extra_confirmations`
- `mottak_stock_events`

Routing:
- TEST → `x-bama-environment:test`
- Nordic WORK → `x-bama-environment:work`
- legacy production browser без header → WORK

Серверно перевірено:
- TEST/WORK isolation;
- TEST same EPC repeat allowed;
- WORK duplicate protection;
- cross-link guards;
- old `ut_test_*` = archive/rollback.

Synthetic TEST orders: `NID-SIM-20260809-01 ... 12`, RAMPE `41 ... 52`.

---

# 7. Authoritative products

Central registry: `products.js` **v1.3.0**.

RFID products:
- `bunner`
- `hyller30`
- `hyller60`
- `forlengere_korte`
- `forlengere_lange`
- `vrak_bunner`
- `vrak_hyller`

Без RFID:
- `forlengere_plast` — manual / phone count flow.

Business rules:
- RFID є у всього, крім Forlengere plast;
- усі продукти можуть бути відправлені на RAMPE;
- `vrak_bunner` = 1 RFID unit / stabel = 10 Vrak bunner;
- `vrak_hyller` = 1 RFID unit / stabel = 30 Vrak hyller;
- Forlengere korte/lange: counts НЕ вводяться на Mottak; `hyller_count` + `forlengere_count` вводяться при Utsending.

DB constraints server-ready:
- `mottak_scans_product_check` дозволяє всі 7 RFID product IDs;
- `ut_order_scans_product_check` дозволяє всі 7 RFID product IDs;
- Forlengere plast навмисно не входить у RFID scan constraint.

---

# 8. WORK unknown RFID tag flow — Til rampe

Якщо Nordic у WORK читає EPC:
1. stock row існує й доступний → використати existing row;
2. staged/unavailable → warning/block;
3. EPC прочитаний, stock row відсутній → запропонувати register now + continue to current RAMPE;
4. YES → full EPC + lower 6 → stock row → одразу outgoing flow;
5. EPC не прочитаний → не створювати фіктивний number.

`private.nordic_preview(uuid,text)` серверно розширено для `vrak_bunner` та `vrak_hyller`, без переписування frozen V2.9.7 frontend.

**Статус:** backend/server-ready. Повний physical WORK end-to-end ще потребує підтвердження.

---

# 9. Nordic ID – Til lager DEV

Файл:
`nordic-id-til-lager-test.html`

Поточна версія:
`DEV V1.0.1`

Статус:
**TEST FIRST / не STABLE / physical PASS ще нема.**

Основний flow:
1. TEST default.
2. WORK тільки після ~1.5 s hold + browser confirm.
3. Вибрати продукт один раз; selection persists.
4. Hidden RFID receiver, readonly idle.
5. `Unidentified` hardware trigger arms input.
6. 24 HEX EPC, 600 ms lock, 1600 ms arm, 150 ms idle commit.
7. Soft keyboard ховається без blur під час RFID ACTIVE.
8. Scan → product + lower 6 → confirm.
9. Success → великий `PÅ LAGER` → automatic READY.

TEST:
- environment=test;
- duplicate same RFID allowed.

WORK:
- same lower + different product → block;
- existing full RFID → duplicate/status block;
- same-product Camera row (`scanner_code=''`, in_stock) → enrich same row with full EPC, photo зберігається, дубль не створюється;
- staged/dispatched row → block;
- no row → create verified/in_stock WORK row.

Деталі й непідтверджені DEV-зміни вести в `NORDIC_TIL_LAGER_DEV_PROTOCOL.md`, а не як PASS у progress log.

---

# 10. Camera fallback

Фізично підтверджено:
- Camera v4.25 LOWER RESET — після save UI не зависає на `ОБРОБКА…`, повертається до `📷 ФОТО`;
- Camera v4.26 AUTO SAVE FOCUS — після успішного OCR автоматично переводить до `💾 ЗБЕРЕГТИ`.

Camera v4.27 `RFID FALLBACK PRODUCTS` підготовлена, але ще не physical PASS.
Вона додає fallback product choices:
- forlengere_korte
- forlengere_lange
- vrak_bunner
- vrak_hyller

Camera v4.26 лишається останнім фізично підтвердженим Camera rollback у GitHub history.

---

# 11. UT Kontor

Користувач підтвердив, що існуючий UT Kontor layout/behavior ідеальний і його не треба переробляти.

Виправлення мови:
- `bestilling.html` примусово ставить `mottak_ut_language=no` перед language-module;
- це виправляє випадкове успадкування української з shared localStorage.

Additive product extension:
- `ut-kontor-vrak-products.js` додає `Vrak bunner` і `Vrak hyller` окремими cards;
- існуючі 6 product flows залишаються у старому модулі;
- UT Kontor тепер заявляє `8 PRODUKTER`;
- physical/browser confirmation цих нових cards ще потрібна перед PASS.

---

# 12. Server verification нових Vrak

Transactional browser-role tests:
- TEST duplicate `vrak_bunner` RFID → 2 rows allowed;
- WORK duplicate `vrak_hyller` RFID → only 1 row;
- обидва тести виконані з `ROLLBACK`;
- контроль після rollback → 0 штучних рядків у production.

Це SERVER PASS, не physical PASS.

---

# 13. Якщо користувач каже «дивись журнал»

Одразу перевіряти актуальні TEST/WORK rows і RFID log.

Для Til lager насамперед:
- recent `mottak_scans` з правильним environment;
- product;
- scanner_code/full EPC;
- lower_number;
- status;
- stock_status;
- source;
- created/verified timestamps.

Для outgoing також:
- `ut_orders`
- `ut_order_items`
- `ut_order_scans`
- `ut_extra_confirmations`
- `nordic_id_test_log`

Не просити користувача вручну переносити журнал.

---

# 14. Протокол змін

Після кожного підтвердженого успішного / завершеного кроку:
1. `NORDIC_ID_PROGRESS_LOG.md` — PASS / SERVER PASS;
2. `NEXT_CHAT_NORDIC_ID.txt` — current state / next step;
3. `NORDIC_ID_RFID_PROTOCOL.md` — canonical architecture;
4. `NORDIC_TIL_RAMPE_STABLE_LOCK.md` — тільки якщо змінюється stable contract;
5. `NORDIC_TIL_LAGER_DEV_PROTOCOL.md` — DEV Til lager до physical PASS;
6. після великих змін `PROTOCOLS.md` і `PROTOCOL.md`.

Невдалі експерименти не записувати як PASS.

---

# 15. Наступний фізичний крок

Спочатку `Til lager`, не WORK:
1. refresh `scanner-home.html`;
2. `📥 TIL LAGER`;
3. переконатися: `DEV V1.0.1`, TEST active;
4. вибрати Bunner або Vrak bunner;
5. один короткий RFID scan;
6. confirm;
7. після результату перевірити DB/log;
8. лише після TEST physical PASS переходити до WORK.

`Nordic ID – Til rampe` STABLE під час цього не змінювати.
