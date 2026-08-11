# Lager Admin · DEV PROTOCOL

**Проєкт:** BaMavaremottak / AI Scanner Mottak  
**Створено:** 11.08.2026 13:10 Europe/Oslo  
**Статус:** DEV / TEST ONLY — WORK SERVER-LOCKED

## Призначення
Окрема адміністративна сторінка для швидкого ручного коригування складських показників без створення вигаданих RFID-номерів.

Entry:
- `lager-admin.html`
- mnemonic redirect: `admin-admin.html`

Official UI name:
- `Lager Admin`
- header: `Lager Admin · TEST`

## TEST / WORK
V1 працює тільки в `environment=test`.
WORK не просто прихований у UI — RPC-функції серверно відхиляють будь-яку спробу коригування при `environment=work`.

## Джерело ручної поправки
Використовується існуючий quantity ledger:
- `public.mottak_quantity_stock`
- `public.mottak_quantity_stock_events`

Product constraint розширено на всі 8 продуктів.

RFID products:
- `bunner`
- `hyller30`
- `hyller60`
- `forlengere_korte`
- `forlengere_lange`
- `vrak_bunner`
- `vrak_hyller`

No RFID:
- `forlengere_plast`

## Правило підрахунку
`bama_stock_summary()` тепер використовує manual overlay:

RFID product:
`physical_count = verified in_stock RFID rows + manual_count`

Forlengere plast:
`physical_count = manual quantity stock`

Другий лічильник лишається автоматичним:
`available_count = physical_count - still-unfulfilled active RAMPE orders`

Оператор НЕ редагує available_count вручну.

## Ручна корекція
Admin page підтримує:
- `-5`
- `-1`
- `+1`
- `+5`
- `SETT FAKTISK` — встановити фактичний фізичний залишок; сервер сам рахує delta.

Reason presets:
- Hurtigmottak
- Opptelling
- Korreksjon
- Annet

Додаткова note може бути введена оператором.

## RFID safety
Admin не створює записи в `mottak_scans` і не генерує fake EPC/lower_number.
Для RFID-продуктів `manual_count` є адміністративною поправкою / неідентифікованою кількістю.
Для plast manual stock є нормальним основним stock.

## Audit
Кожна TEST-зміна пишеться в `mottak_quantity_stock_events`:
- environment
- product_id
- delta
- manual quantity_after
- action
- reason/note
- physical_after
- available_after
- created_at

Admin UI показує останні 30 TEST-змін.

## RPC
- `bama_admin_stock_summary()`
- `bama_admin_stock_adjust_test(product,delta,reason)`
- `bama_admin_stock_set_test(product,target,reason)`
- `bama_admin_stock_history_test(limit)`

Execute granted to anon/authenticated, але mutation RPCs мають hard guard `environment='test'`.

## SERVER PASS 11.08.2026
Transactional/browser-role verification:
- anon TEST `vrak_bunner +5` працює;
- `SETT FAKTISK` перераховує manual delta до заданого physical total;
- history RPC бачить обидві зміни;
- anon TEST `vrak_hyller +4` дав `rfid_count=2`, `manual_count=4`, `physical_count=6`;
- всі write-тести виконані з ROLLBACK;
- WORK mutation спроба підтверджено заблокована сервером.

## Не заявляти ще
- `Lager Admin` physical/browser PASS — користувач ще не перевірив сторінку.
- WORK admin — не реалізований і навмисно заблокований.
- production manual corrections — не робити до окремого рішення користувача щодо захисту WORK.

## Наступний фізичний тест
1. Відкрити `admin-admin.html` або `lager-admin.html`.
2. Переконатися: `🧪 TEST AKTIV` і `🔒 WORK LÅST`.
3. Вибрати `Vrak bunner`.
4. Натиснути `+1`.
5. Перевірити, що `PÅ LAGER`, `MANUELL`, `TILGJENGELIG` змінилися.
6. Відкрити UT Kontor / TEST-лічильник і звірити той самий TEST summary, якщо цей UI працює в TEST environment.
7. Потім у Lager Admin повернути число кнопкою `-1` або `SETT FAKTISK`.
8. Лише після physical PASS вирішувати, як захищати і відкривати WORK.
