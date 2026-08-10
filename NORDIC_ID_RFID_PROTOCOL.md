# Nordic ID RFID — АКТУАЛЬНИЙ КАНОНІЧНИЙ ПРОТОКОЛ

**Проєкт:** BaMavaremottak / AI Scanner Mottak  
**Оновлено:** 10.08.2026 20:37 Europe/Oslo  
**Статус:** ГОЛОВНИЙ Nordic ID / RFID канон для наступних розмов  
**Handoff:** `NEXT_CHAT_NORDIC_ID.txt`  
**Історичний snapshot 09.08:** `NORDIC_ID_RFID_PROTOCOL_ARCHIVE_2026-08-09.md`

> ПРАВИЛО №1: перед будь-яким Nordic ID / RFID кроком прочитати `NEXT_CHAT_NORDIC_ID.txt`, цей файл, `NORDIC_ID_PROGRESS_LOG.md` і, якщо змінюється STABLE, `NORDIC_TIL_RAMPE_STABLE_LOCK.md`.

---

# 1. Поточний результат

Офіційна стабільна Nordic-форма для списання/переміщення товару на рампу:

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

Нові експерименти виконувати тільки в:

`utsending-nordic-test.html`

або новій DEV-копії.

---

# 2. scanner-home — робочий екран оператора

`scanner-home.html` очищений від історичних і DEV-карток.

На робочому екрані лише дві операції:

1. `📥 НА СКЛАД` — окрема Nordic INN / Mottak форма ще не підключена.
2. `📤 TIL RAMPE` — відкриває `Nordic ID – Til rampe · STABLE V2.9.7`.

Історичні файли збережені в GitHub, але не показуються оператору:
- `nordic-id-v24-stable.html` — RFID rollback;
- `nordic-id-v20-focus.html` — V2.1 diagnostic/test base;
- `utsending-nordic-test.html` — DEV copy.

Не повертати їх на головний робочий екран без окремої потреби.

---

# 3. Фізично підтверджений V2.9.7 TEST flow

На Nordic ID підтверджено:
- V2.4 hidden RFID/Wedge engine;
- full 24-char HEX EPC;
- 600 ms FIRST TAG lock;
- TEST / WORK перемикач в одній формі;
- RAMPE progress: замовлено / виконано / залишилось / наступний товар;
- SMART FOCUS після відкриття RAMPE та після кожної дії;
- Bunner / Hyller x30 / Hyller x60 — велике просте підтвердження;
- TEST дозволяє повторно використовувати ту саму RFID-бірку;
- Forlengere korte / lange — `Полиці + Продовжувачі` вводяться тільки при outgoing confirmation;
- INPUT LOCK блокує фоновий refresh під час введення counts;
- COUNT COMPACT тримає обидва поля і `ДОДАТИ / СКАСУВАТИ` в компактному вигляді над клавіатурою;
- після підтвердження екран повертається до актуального прогресу RAMPE.

Користувач підтвердив форму як повністю робочу в TEST і наказав зафіксувати її як остаточну STABLE.

---

# 4. RFID mapping

Nordic full EPC:

`scanner_code = full 24-char EPC`

Робочий короткий номер:

`lower_number = last 6 chars of EPC, uppercase`

Compatibility field:

`upper_number = ''`

Приклад:

`33161403D0000785000E3103` → `lower_number = 0E3103`

Не вигадувати і не «виправляти» RFID-коди.

Якщо EPC не прочитаний — фіктивний RFID number не створювати.

---

# 5. Wedge / Nordic hardware rule

Фактичний шлях:

`RFID tag → Nordic ID reader → RFID Wedge Service → keyboard input → Chrome → web form`

Відомий безпечний Wedge baseline:
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

Працювати короткими натисканнями.

Не запускати CC4Scanner і Wedge одночасно: вони можуть конкурувати за reader/NUR connection.

V2.1 FIRST TAG LOCK довів, що один короткий scan-cycle можна стабільно обмежити одним accepted EPC на рівні веб-логіки.

---

# 6. Shared TEST / WORK architecture

Активні TEST і WORK використовують ті самі public tables, розділені `environment = test/work`:
- `mottak_scans`
- `ut_orders`
- `ut_order_items`
- `ut_order_scans`
- `ut_extra_confirmations`
- `mottak_stock_events`

TEST API додає:

`x-bama-environment: test`

Nordic WORK додає:

`x-bama-environment: work`

Старі production browser-форми без нового header трактуються як WORK.

Серверно перевірено:
- TEST і WORK rows ізольовані;
- TEST same EPC може використовуватись повторно;
- WORK duplicate protection збережена;
- cross-link guards не дозволяють змішувати TEST/WORK stock-order-scan;
- old `ut_test_*` збережені як archive/rollback.

Synthetic TEST orders:

`NID-SIM-20260809-01 ... 12`

RAMPE:

`41 ... 52`

---

# 7. Products / Forlengere

RFID products:
- `bunner`
- `hyller30`
- `hyller60`
- `forlengere_korte`
- `forlengere_lange`

`forlengere_plast` — без RFID, manual/phone flow.

Forlengere korte/lange:
- counts НЕ вводяться на Mottak;
- `hyller_count` + `forlengere_count` вводяться при Utsending / списанні;
- production `ut_extra_confirmations` є основним місцем для цих outgoing confirmations.

---

# 8. WORK unknown RFID tag flow

Якщо Nordic у WORK читає EPC:

1. stock row існує й доступний → використати існуючий row;
2. row уже staged / unavailable → warning/block;
3. EPC прочитаний, але stock row відсутній → показати пропозицію:
   `Оприбуткувати товар зараз і одразу додати на поточну RAMPE?`
4. YES → зберегти full EPC + last 6, створити/оновити stock row і одразу продовжити outgoing flow;
5. EPC не прочитаний → не створювати фіктивний number і не продовжувати як RFID item.

**Статус:** backend/UI contract реалізований і серверно перевірений. Повний фізичний WORK end-to-end на реальному складі ще має бути перевірений 11.08.2026.

До цього фізичного WORK-тесту STABLE V2.9.7 не змінювати.

---

# 9. Якщо користувач каже «дивись журнал»

Одразу перевіряти актуальні TEST/WORK записи й RFID log, не просити користувача переносити журнал вручну.

Для outgoing дивитися за потреби:
- `ut_orders`
- `ut_order_items`
- `mottak_scans`
- `ut_order_scans`
- `ut_extra_confirmations`
- `nordic_id_test_log`

Завжди розрізняти `environment=test` і `environment=work`.

---

# 10. Протокол змін

Після кожного **підтвердженого успішного / завершеного** Nordic-кроку оновлювати:

1. `NORDIC_ID_PROGRESS_LOG.md` — PASS / SERVER PASS;
2. `NEXT_CHAT_NORDIC_ID.txt` — якщо змінився актуальний стан/наступний крок;
3. `NORDIC_TIL_RAMPE_STABLE_LOCK.md` — тільки якщо змінився stable contract / recovery / visibility policy;
4. цей `NORDIC_ID_RFID_PROTOCOL.md` — якщо змінилася канонічна архітектура або головне правило.

Невдалі експерименти не додавати як PASS.

Після великих змін також синхронізувати `PROTOCOLS.md` і `PROTOCOL.md`.

---

# 11. Наступний етап

11.08.2026:

- фізично перевірити `Nordic ID – Til rampe · STABLE V2.9.7` у WORK на реальному складі;
- окремо перевірити unknown-tag flow;
- якщо WORK PASS — лише записати `WORK CONFIRMED` у протоколи, без зміни STABLE-коду.

Після цього окремий напрям:

`📥 НА СКЛАД`

Створити Nordic Mottak / INN форму, не змінюючи `Nordic ID – Til rampe` STABLE.
