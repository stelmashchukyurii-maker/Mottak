# Nordic ID RFID — ПОСТІЙНИЙ ЖУРНАЛ ПРОГРЕСУ

**Проєкт:** BaMavaremottak / AI Scanner Mottak  
**Створено:** 09.08.2026 19:43:37 Europe/Oslo  
**Призначення:** append-only журнал кожного підтвердженого кроку, часткового результату, помилки та наступної дії.

## Обов'язкове правило

Після КОЖНОГО суттєвого Nordic ID кроку асистент повинен оновити цей файл.

Для кожного запису фіксувати:

- дату/час Europe/Oslo;
- версію та файл;
- що саме змінили;
- як тестували;
- докази: Supabase session / відео / commit / migration;
- результат: `PASS`, `PARTIAL`, `FAIL`, `OPEN`;
- що вже вважаємо доведеним;
- що ще НЕ доведено;
- один чіткий наступний крок.

Не переписувати історію заднім числом. Старі записи залишати; нові додавати нижче. Виправляти можна лише очевидні помилки/описки.

Google Drive папка з Nordic ID відео/фото:
`https://drive.google.com/drive/folders/1Xf5puBas4GUveaJqhhuYLNdJcEw_Myo5`

---

# 09.08.2026 — БАЗОВІ ПІДТВЕРДЖЕНІ КРОКИ

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

Логіка:

- перший валідний 24-char EPC → `RFID_ACCEPTED`;
- протягом 600 ms сторінка переходить у `LOCKED`;
- додатковий валідний EPC у цьому вікні → `RFID_BLOCKED`;
- після завершення lock → автоматично `READY`.

GitHub commits цього етапу:

- `4acec5c5fb50e9fb6dca1c74da1c03923da61be2` — Nordic ID V2.1 first tag lock;
- `3ecc802bc58bad4c107c8942cd091fc2cd170c17` — fix V2.1 test log key.

---

## PASS — scanner-home синхронізована з поточною Nordic ID версією

**Файл:** `scanner-home.html`  
**Поточний напис:** `Nordic ID V2.1 — FIRST TAG LOCK`  
**SCANNER HOME:** `v3.0`  
**Видимий update:** 09.08.2026 19:33 Europe/Oslo

Правило відтепер: при кожній зміні робочої Nordic ID версії одночасно оновлювати на `scanner-home.html` видимий номер версії та точний час.

Commit:

- `fa12595834d94fcc73b4e2dc37396905201ee829`

---

## PARTIAL — фізичний V2.1 тест на Nordic ID, відео 19:28–19:29

**Основне відео:** `VID_20260809_192859.mp4`  
**Коротке відео:** `VID_20260809_192722.mp4`

На відео підтверджено:

- сторінка V2.1 реально відкрита на Nordic ID;
- `FOCUS OK` тримається;
- UI переходить `READY → OK · LOCKED → READY`;
- accepted counter росте;
- сторінка не зависає після повторних коротких trigger presses.

Відео саме по собі показало до 20 accepted та `BLOCKED: 0`.

**Статус:** `PARTIAL`, а не повний PASS для FIRST TAG LOCK.

Причина: у цій сесії не було другого валідного EPC, що потрапив усередину 600 ms lock window, тому фактичне `RFID_BLOCKED` ще не було продемонстровано.

---

## FAIL → FIXED — V2.1 TEST-журнал спочатку не записувався

На екрані V2.1 у відео було видно:

`Журнал: ПОМИЛКА`

Перевірка Supabase показала причину:

- код V2.1 відправляв поле `page_version`;
- `public.nordic_id_test_log` не мав колонки `page_version`;
- тому REST insert падав, хоча RFID UI продовжував працювати локально.

**Виправлення:** 09.08.2026 приблизно 19:42 Europe/Oslo застосована Supabase migration:

`add_page_version_to_nordic_id_test_log`

SQL-зміна:

`alter table public.nordic_id_test_log add column if not exists page_version text;`

Після migration накопичена в браузері V2.1 queue автоматично успішно дописалася в Supabase.

**Статус:** `PASS` для TEST-autolog після schema fix.

---

## PASS — відновлено точний журнал фізичного V2.1 тесту

**Supabase session:** `nid-20260809172608390-qf51s1`  
**Page version:** `V2.1 FIRST TAG LOCK`

Підсумок session:

- `KEYDOWN`: 92
- `KEYUP`: 61
- `BEFOREINPUT`: 20
- `INPUT`: 20
- `SCAN_COMMIT`: 20
- `RFID_ACCEPTED`: 20
- `LOCK_RELEASED`: 20
- `RFID_BLOCKED`: 0

Accepted EPC:

- `33161403D0000785000E3103` — 16 разів;
- `33161403D0000785002CB739` — 4 рази.

Перший accepted у цьому сегменті: `2026-08-09T17:29:07.505Z`  
Останній accepted: `2026-08-09T17:29:43.065Z`

Що доведено цією session:

- V2.1 коректно приймає валідні 24-char EPC;
- обидва відомі EPC читаються;
- після кожного accepted lock запускається і відпускається;
- наступний окремий trigger через >600 ms знову приймається;
- TEST-autolog тепер працює після schema fix.

Що НЕ доведено:

- що другий EPC у тому самому короткому burst точно буде записаний як `RFID_BLOCKED`, бо в цій session `RFID_BLOCKED = 0`.

---

# ПОТОЧНА ТОЧКА ПРОДОВЖЕННЯ

**Handoff:** `NID-HANDOFF-2026-08-09-V21-RETEST`

## Наступний єдиний крок

Не міняти код V2.1.

Зробити короткий контрольний тест з **двома RFID-бірками поруч**, у тій конфігурації/відстані, де старі журнали вже показували два різні EPC з розривом ~80–190 ms.

Потрібний доказ у TEST-log:

1. перший EPC → `RFID_ACCEPTED`;
2. другий EPC приблизно через 80–190 ms → `RFID_BLOCKED`;
3. `since_accepted_ms < 600`;
4. після `LOCK_RELEASED` наступний окремий trigger знову → `RFID_ACCEPTED`.

Тільки після цього записати окремий `PASS — FIRST TAG LOCK CONFIRMED` і переходити до:

`accepted EPC → правильний робочий номер → public.mottak_scans`.
