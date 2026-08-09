# Nordic ID RFID — ПОСТІЙНИЙ ЖУРНАЛ УСПІШНОГО ПРОГРЕСУ

**Проєкт:** BaMavaremottak / AI Scanner Mottak  
**Створено:** 09.08.2026 19:43:37 Europe/Oslo  
**Оновлено:** 09.08.2026 21:43 Europe/Oslo

## Правило журналу
У цей файл записуємо **тільки підтверджені успішні/завершені кроки**. Тимчасові помилки, невдалі спроби, гіпотези та відкриті проблеми сюди не додаємо.

Google Drive Nordic ID відео/фото:
`https://drive.google.com/drive/folders/1Xf5puBas4GUveaJqhhuYLNdJcEw_Myo5`

---

# 09.08.2026 — ПІДТВЕРДЖЕНІ КРОКИ

## PASS — V2.1 FIRST TAG LOCK
**Файл:** `nordic-id-v20-focus.html`  
**Lock window:** 600 ms

Підтверджено:
- перший валідний 24-char EPC приймається як `RFID_ACCEPTED`;
- цикл `READY → ACCEPT/LOCK → READY` працює на фізичному Nordic ID;
- `FOCUS OK` стабільний;
- TEST autolog пише події в `public.nordic_id_test_log` з `page_version`;
- у фізичному тесті спостерігалося одне accepted RFID-значення за один короткий trigger-cycle.

Ключові докази:
- session `nid-20260809172608390-qf51s1`;
- session `nid-20260809175459639-p3x1cz`;
- відео `VID_20260809_192859.mp4`, `VID_20260809_192722.mp4`, `VID_20260809_195650.mp4`.

**Статус:** V2.1 лишається незмінною `RFID TEST BASE / DIAGNOSTIC` і не переписується.

---

## PASS — V2.2 PRODUCT TEST
**Файл:** `nordic-id-v22-product-test.html`  
**TEST table:** `public.nordic_id_mottak_test`

Підтверджено:
- вибір продукту працює;
- Nordic RFID пишеться тільки в окрему TEST-базу;
- `scanner_code` = весь 24-char EPC;
- `lower_number` = останні 6 символів EPC;
- старий `078500 / upper_number` не використовується як робочий номер;
- production `public.mottak_scans` не змінювалась;
- у перевіреній сесії 17 accepted = 17 успішно збережених TEST-рядків.

Фактичні TEST-дані:
- 16 × `0E3103`;
- 1 × `2CB739`;
- продукт `hyller30`.

---

## PASS — V2.2.1 PRODUCT TEST · KEYBOARD GUARD
**Файл:** `nordic-id-v22-product-test.html`  
**GitHub commit:** `b80db614ff6b18f699e4c095076a5813a0de32f1`  
**Supabase session:** `nid-20260809182759942-z7p199`

Підтверджено користувачем на фізичному Nordic ID:
- клавіатура не відкривається при кнопковому виборі продукту;
- журнал бачить `PRODUCT_SELECTED` та `UI_KEYBOARD_GUARD`;
- RFID input лишається `type=text`, щоб не ламати Wedge.

**Статус:** історичний стабільний rollback; більше не є останньою STABLE після промоції V2.3.4.

---

## PASS — V2.3.4 CONFIRM & SAVE + EXTENSION COUNTS → НОВА STABLE
**Підтверджено користувачем:** 09.08.2026 21:43 Europe/Oslo  
**Робочий файл, з якого зроблено snapshot:** `nordic-id-v23-confirm-test.html`  
**Заморожений stable-файл:** `nordic-id-v234-stable.html`  
**Stable snapshot blob:** `ffadcf0239b6f12eddf81be052816278c4e2ff48`

Підтверджено:
- Nordic ID читає RFID-бірку;
- після scan показується велике підтвердження з вибраним продуктом + `lower_number` + повним EPC;
- користувач вручну підтверджує внесення;
- запис успішно потрапляє в `public.nordic_id_mottak_test`;
- після SAVE показується великий зелений стан `✅ ЗАПИСАНО`;
- `OK — ДАЛІ` завершує цикл і дозволяє перейти до наступного scan;
- `scanner_code` = весь EPC;
- `lower_number` = останні 6 символів;
- Bunner / Hyller x30 / Hyller x60 не мають полів кількості;
- Forlengere korte / Forlengere lange мають два ручні TEST-поля: `hyller_count` і `forlengere_count`;
- ці два поля вже існують у TEST-таблиці як nullable integer;
- кнопка очищення очищає тільки таблицю/лічильники на екрані, Supabase history і Nordic log не видаляються.

**Рішення користувача:** V2.3.4 зафіксована як **остання STABLE** і переміщена в середню зелену картку `scanner-home.html`.

---

# ПОТОЧНА АРХІТЕКТУРА scanner-home.html

На головній завжди три Nordic-картки:
1. **CURRENT TEST** — верхня робоча копія для наступних доробок (`nordic-id-v23-confirm-test.html`).
2. **STABLE** — середня, зараз `V2.3.4` → `nordic-id-v234-stable.html`. Stable-файл не переписувати.
3. **RFID TEST BASE** — нижня `V2.1 FIRST TAG LOCK` → `nordic-id-v20-focus.html`. Не переписувати і не прибирати.

Коли наступний CURRENT TEST підтверджений користувачем — заморозити його окремим stable-файлом, пересунути у середню STABLE-картку, а верхній робочий файл лишити для наступних змін.

Production `public.mottak_scans` на цьому етапі не змінювати без окремої команди користувача.
