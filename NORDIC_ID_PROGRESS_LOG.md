# Nordic ID RFID — ПОСТІЙНИЙ ЖУРНАЛ УСПІШНОГО ПРОГРЕСУ

**Проєкт:** BaMavaremottak / AI Scanner Mottak  
**Створено:** 09.08.2026 19:43:37 Europe/Oslo  
**Оновлено:** 10.08.2026 20:37 Europe/Oslo

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

**Статус:** історичний стабільний rollback.

---

## PASS — V2.3.4 CONFIRM & SAVE + EXTENSION COUNTS
**Підтверджено користувачем:** 09.08.2026 21:43 Europe/Oslo  
**Заморожений stable-файл:** `nordic-id-v234-stable.html`

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
- кнопка очищення очищає тільки таблицю/лічильники на екрані, Supabase history і Nordic log не видаляються.

**Статус:** підтверджений rollback після появи новішої stable.

---

## PASS — V2.4 HIDDEN RFID INPUT → STABLE RFID BASE
**Підтверджено користувачем:** 09.08.2026 21:59 Europe/Oslo  
**Робочий файл, з якого зроблено stable:** `nordic-id-v23-confirm-test.html`  
**Заморожений stable-файл:** `nordic-id-v24-stable.html`  
**Stable creation commit:** `5f065438f5b79411d1756896a4bbfc9cb7824198`

Підтверджено:
- V2.4 працює на фізичному Nordic ID;
- технічне поле `RFID EPC / Waiting for RFID…` прибране з видимого інтерфейсу;
- прихований `scanInput` лишився технічним приймачем Nordic Wedge;
- Nordic trigger активує прийом EPC, після чого робочий scan/confirm/save flow продовжується;
- Bunner / Hyller x30 / Hyller x60 не потребують видимих текстових полів або ручної клавіатури;
- для Forlengere korte / Forlengere lange видимими ручними input залишаються тільки `hyller_count` і `forlengere_count`;
- великий confirm/save UI, TEST DB запис, `scanner_code`, `lower_number`, екранне очищення та Forlengere counts збережені з V2.3.4.

**Статус:** історична стабільна RFID-база. Файл не переписувати.

---

# 10.08.2026 — ПІДТВЕРДЖЕНІ КРОКИ

## SERVER PASS — SHARED TEST / WORK ENVIRONMENT
Підтверджено серверними тестами та read-back перевірками:
- активні TEST і WORK використовують спільні робочі таблиці з `environment = test/work`;
- старі production browser-форми без environment header трактуються як WORK;
- TEST API передає `x-bama-environment:test`, Nordic WORK — `x-bama-environment:work`;
- TEST і WORK рядки ізольовані RLS / серверною логікою;
- TEST дозволяє повторне використання тієї самої фізичної EPC;
- WORK зберігає захист від дублювання;
- cross-link перевірки не дозволяють змішувати TEST і WORK stock/order/scan;
- synthetic TEST orders `NID-SIM-20260809-01...12`, RAMPE `41...52`, працюють у common tables як `environment=test`;
- old `ut_test_*` збережені як archive/rollback, не як активний backend.

Ключові спільні таблиці:
- `mottak_scans`
- `ut_orders`
- `ut_order_items`
- `ut_order_scans`
- `ut_extra_confirmations`
- `mottak_stock_events`

**Важливо:** це серверний PASS. Повний фізичний WORK end-to-end на реальному складі запланований на 11.08.2026.

---

## PASS — WORK UNKNOWN RFID TAG BUSINESS FLOW IMPLEMENTED
Серверна логіка й UI-контракт зафіксовані:
- якщо WORK RFID EPC прочитаний і stock row існує та доступний → використовувати існуючий запис;
- якщо запис уже staged / недоступний → попередити або заблокувати;
- якщо EPC успішно прочитаний, але stock row відсутній → показати пропозицію оприбуткувати товар зараз і одразу продовжити на поточну RAMPE;
- при підтвердженні зберегти full EPC у `scanner_code`, last 6 у `lower_number`, після чого одразу використати товар у поточному outgoing flow;
- якщо EPC взагалі не прочитаний → **не створювати фіктивний номер**.

**Статус:** реалізація/серверна логіка готова; фізичний WORK-тест цього сценарію ще має бути виконаний 11.08.2026.

---

## PASS — Nordic ID – Til rampe · V2.9.7 → FINAL STABLE
**Офіційна норвезька назва:** `Nordic ID – Til rampe`  
**Підтверджено користувачем:** 10.08.2026 20:14 Europe/Oslo  
**Робочий DEV-файл:** `utsending-nordic-test.html`  
**Stable entry:** `nordic-id-til-rampe-stable.html`  
**Lock manifest:** `NORDIC_TIL_RAMPE_STABLE_LOCK.md`  
**Frozen source commit:** `ed3a19b20efd9af0bf07bc4a079589b3b6038157`  
**Final stable-entry commit:** `f049f5c568dd592f64c8cfadbd416622e5c5fc9d`

Підтверджено фізично на Nordic ID:
- V2.4 hidden RFID/Wedge engine стабільно читає 24-char EPC;
- 600 ms RFID lock збережено;
- TEST / WORK перемикач є частиною однієї форми;
- відкриття RAMPE автоматично переводить екран до найінформативнішого блоку;
- видно `замовлено / виконано / залишилось / наступний товар`;
- після підтвердження скану екран автоматично повертається до актуального прогресу RAMPE;
- Bunner / Hyller x30 / Hyller x60 мають просте велике підтвердження;
- TEST дозволяє повторно використовувати ту саму RFID-бірку;
- Forlengere korte / Forlengere lange вводять `Полиці + Продовжувачі` саме при списанні;
- INPUT LOCK не дає фоновому refresh стерти введені числа;
- COUNT COMPACT стискає сценарій продовжувачів для малого Nordic-екрана: два поля поруч + `ДОДАТИ / СКАСУВАТИ` поруч над цифровою клавіатурою;
- весь підтверджений TEST-цикл користувач оцінив як повністю робочий і придатний до фіксації.

### Заморозка
`nordic-id-til-rampe-stable.html` не тягне майбутній `main`, а відкриває V2.9.7 з конкретного GitHub commit. Тому майбутні зміни DEV-файлів не повинні змінювати цю STABLE-форму.

**Рішення:** `Nordic ID – Til rampe` є остаточною стабільною формою для операції **Til rampe**. Не переписувати й не видаляти. Нові експерименти — тільки у CURRENT/DEV.

---

## PASS — SCANNER HOME CLEAN WORK VIEW
**Підтверджено рішенням користувача:** 10.08.2026 20:36 Europe/Oslo

Робочий `scanner-home.html` очищено від історичних/технічних карток.
На екрані залишено тільки:
1. **📥 НА СКЛАД** — майбутня окрема Nordic INN / Mottak форма;
2. **📤 TIL RAMPE** → `nordic-id-til-rampe-stable.html` → `Nordic ID – Til rampe · STABLE V2.9.7`.

Також на головній коротко зафіксовано WORK-правило для невідомої RFID-бірки: якщо EPC прочитано, але товару ще нема на складі, `Til rampe` пропонує оприбуткувати й одразу продовжити на RAMPE; без прочитаного EPC фіктивний номер не створюється.

Історичні V2.4 / V2.1 та DEV-копії **не видалені** з GitHub, а лише приховані з робочого екрана.

---

# ПОТОЧНА АРХІТЕКТУРА scanner-home.html

На робочому екрані тільки дві операції:
1. **📥 НА СКЛАД** — ще не підключена окрема Nordic Mottak форма.
2. **📤 TIL RAMPE** — `Nordic ID – Til rampe · STABLE V2.9.7` через `nordic-id-til-rampe-stable.html`.

Приховано з робочого екрана, але збережено в GitHub:
- `utsending-nordic-test.html` — DEV copy для майбутніх змін;
- `nordic-id-v24-stable.html` — історичний RFID rollback;
- `nordic-id-v20-focus.html` — V2.1 diagnostic/test base.

Наступний окремий напрямок: **Nordic ID – På lager / Mottak (НА СКЛАД)**. Він не повинен змінювати `Nordic ID – Til rampe` STABLE.

Наступна перевірка 11.08.2026: фізичний WORK end-to-end на реальному складі. До цього тесту `Nordic ID – Til rampe` STABLE не змінювати.
