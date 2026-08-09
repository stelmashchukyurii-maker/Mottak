# Nordic ID RFID — ПОСТІЙНИЙ ЖУРНАЛ УСПІШНОГО ПРОГРЕСУ

**Проєкт:** BaMavaremottak / AI Scanner Mottak  
**Створено:** 09.08.2026 19:43:37 Europe/Oslo  
**Призначення:** постійний журнал підтверджених і завершених Nordic ID кроків для безперервності між чатами.

## Обов'язкове правило протоколу

Після КОЖНОГО підтвердженого успішного Nordic ID кроку асистент оновлює цей файл.

У довготривалий progress log записуємо:

- дату/час Europe/Oslo;
- версію та файл;
- що успішно зроблено;
- як це перевірено;
- докази: Supabase session / відео / commit / migration;
- що від цього моменту вважаємо доведеним;
- наступний чіткий крок.

**Тимчасові помилки, невдалі спроби, робочі гіпотези та ще не вирішені проблеми окремими записами сюди НЕ додаємо.** Поки проблема відкрита — вона залишається в поточній роботі/чаті. Коли проблему вирішено й перевірено — записуємо один чистий успішний крок із коротким поясненням рішення.

Google Drive папка з Nordic ID відео/фото:
`https://drive.google.com/drive/folders/1Xf5puBas4GUveaJqhhuYLNdJcEw_Myo5`

---

# 09.08.2026 — ПІДТВЕРДЖЕНІ КРОКИ

## PASS — одна постійна WORK-сторінка

**Файл:** `nordic-id-v20-focus.html`

Зафіксовано правило: цей файл є постійною Nordic ID WORK-сторінкою. Наступні дрібні версії змінюють код/видиму версію/час у цьому самому файлі; окремі `v21.html`, `v22.html` не створюються без спеціальної причини.

Fallback не перезаписувати:

- `nordic-id-v19-clean.html`
- `nordic-id.html`

---

## PASS — V2.1 FIRST TAG LOCK розгорнута на тому самому URL

**Версія:** `V2.1 FIRST TAG LOCK`  
**Файл:** `nordic-id-v20-focus.html`  
**Видимий update:** 09.08.2026 19:23:00 Europe/Oslo  
**Lock window:** 600 ms

Реалізовано:

- перший валідний 24-char EPC → `RFID_ACCEPTED`;
- після accepted запускається 600 ms lock window;
- додатковий валідний EPC усередині цього window має піти в `RFID_BLOCKED`, а не як другий робочий scan;
- після завершення lock → автоматично `READY`.

GitHub commits:

- `4acec5c5fb50e9fb6dca1c74da1c03923da61be2` — V2.1 FIRST TAG LOCK;
- `3ecc802bc58bad4c107c8942cd091fc2cd170c17` — виправлення TEST-log key.

---

## PASS — scanner-home синхронізована з поточною Nordic ID версією

**Файл:** `scanner-home.html`  
**Поточний напис на цьому етапі:** `Nordic ID V2.1 — FIRST TAG LOCK`  
**SCANNER HOME:** `v3.0`  
**Видимий update:** 09.08.2026 19:33 Europe/Oslo

Правило: при кожній наступній зміні робочої Nordic ID версії одночасно оновлювати на `scanner-home.html` видимий номер версії та точний час.

Commit:

- `fa12595834d94fcc73b4e2dc37396905201ee829`

---

## PASS — V2.1 TEST-autolog працює з page_version

**Supabase TEST table:** `public.nordic_id_test_log`

Схема TEST-журналу узгоджена з V2.1: поле `page_version` є в таблиці, після чого браузерний V2.1 autolog успішно передає session/events у Supabase.

Migration:

- `add_page_version_to_nordic_id_test_log`

Це перевірено фактичним записом V2.1 events у Supabase.

---

## PASS — базовий фізичний V2.1 цикл ACCEPT → LOCK → READY

**Відео:**

- `VID_20260809_192859.mp4`
- `VID_20260809_192722.mp4`

**Supabase session:** `nid-20260809172608390-qf51s1`

Підтверджено:

- V2.1 реально працює на Nordic ID;
- `FOCUS OK` стабільний;
- UI проходить `READY → OK · LOCKED → READY`;
- `RFID_ACCEPTED`: 20;
- `LOCK_RELEASED`: 20;
- обидва відомі EPC читаються;
- наступний окремий scan після завершення lock знову приймається нормально.

EPC у session:

- `33161403D0000785000E3103` — 16 accepted;
- `33161403D0000785002CB739` — 4 accepted.

---

## PASS — новий тест показав один EPC за один короткий цикл

**Нове відео:** `VID_20260809_195650.mp4`  
**Supabase session:** `nid-20260809175459639-p3x1cz`  
**Page version:** `V2.1 FIRST TAG LOCK`

Результат:

- `RFID_ACCEPTED`: 12;
- `RFID_BLOCKED`: 0;
- `SCAN_COMMIT`: 12;
- EPC `33161403D0000785000E3103`: 10 разів;
- EPC `33161403D0000785002CB739`: 2 рази.

Ключова перевірка для поточного практичного етапу:

- між сусідніми accepted-подіями не було близьких подвійних читань;
- найменший інтервал між accepted = **1352 ms**;
- інші інтервали = 1670–4302 ms;
- немає старого небажаного патерну двох EPC через ~80–190 ms в одному короткому burst;
- на цьому тесті фактично спостерігалось **одне accepted RFID-значення за один короткий цикл**, навіть хоча за різні натискання reader бачив обидві фізичні бірки.

**Що вважаємо доведеним:** у цій фізичній конфігурації V2.1 не створила подвійний робочий scan з двох бірок за один короткий цикл.

**Важлива межа твердження:** `RFID_BLOCKED` логіка ще не була фактично викликана в цьому тесті, бо другий EPC усередині 600 ms не прилітав. Тому цей запис підтверджує практичну поведінку `one EPC per observed short cycle`, але не є окремим доказом самого BLOCK-event.

---

## PASS — V2.2 PRODUCT TEST пише Nordic ID у окрему TEST-базу

**Версія:** `V2.2 PRODUCT TEST`  
**Файл:** `nordic-id-v22-product-test.html`  
**TEST table:** `public.nordic_id_mottak_test`

За прямою вказівкою користувача V2.1 збережена окремо як стабільна RFID-база/rollback, а новий продуктово-базовий етап винесено у V2.2.

Підтверджено фактичним тестом:

- вибір продукту працює;
- весь 24-char EPC записується у `scanner_code`;
- старий `078500` / `upper_number` більше не використовується як робочий номер;
- останні 6 символів EPC записуються у `lower_number`;
- production `public.mottak_scans` на цьому етапі не змінюється;
- V2.2 записала 17 тестових рядків: 16 × `0E3103`, 1 × `2CB739`, продукт `hyller30`.

Поля TEST-потоку:

- `scanner_code` = весь EPC, наприклад `33161403D0000785000E3103`;
- `lower_number` = `0E3103` / `2CB739`;
- `upper_number` = порожній технічний compatibility-field.

---

## PASS — V2.2.1 KEYBOARD GUARD

**Підтверджено:** 09.08.2026 20:31 Europe/Oslo  
**Версія:** `V2.2.1 PRODUCT TEST KEYBOARD GUARD`  
**Файл:** `nordic-id-v22-product-test.html`  
**GitHub commit:** `b80db614ff6b18f699e4c095076a5813a0de32f1`  
**Supabase session:** `nid-20260809182759942-z7p199`

Результат:

- Android екранна клавіатура **не відкривається** при роботі з кнопками/вибором продукту — фізично підтверджено користувачем на Nordic ID;
- у відповідній V2.2.1 session журнал бачить 4 `PRODUCT_SELECTED` і 16 `UI_KEYBOARD_GUARD` подій;
- кнопковий UI більше не вважаємо причиною появи клавіатури;
- RFID input лишився `type=text`, щоб не ламати RFID Wedge;
- V2.1 FIRST TAG LOCK логіка не переписувалась;
- користувач продовжує тестувати V2.2.1 далі без нової зміни коду.

**Що від цього моменту вважаємо доведеним:** V2.2.1 вирішує практичну проблему появи Android-клавіатури під час вибору продукту.

---

# АКТУАЛЬНА ТОЧКА ПРОДОВЖЕННЯ — 09.08.2026 20:31 Europe/Oslo

**Поточний тест:** `V2.2.1 PRODUCT TEST KEYBOARD GUARD`  
**Поточний TEST-файл:** `nordic-id-v22-product-test.html`  
**Стабільна RFID-база/rollback:** `nordic-id-v20-focus.html` = `V2.1 FIRST TAG LOCK`  
**Головна:** `scanner-home.html` показує V2.2.1 зверху і V2.1 нижче як stable base.

Поточна структура тесту:

`короткий trigger → V2.1 one-tag RFID logic → accepted EPC → вибраний product → scanner_code = весь EPC → lower_number = останні 6 → public.nordic_id_mottak_test`

Поки користувач тестує V2.2.1, **код не змінювати без нового завдання**. Наступні фізичні результати звіряти з Supabase і, за потреби, з новим відео у постійній Google Drive папці.
