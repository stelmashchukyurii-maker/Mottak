# Lager Admin · DEV PROTOCOL

**Проєкт:** BaMavaremottak / AI Scanner Mottak  
**Створено:** 11.08.2026 13:10 Europe/Oslo  
**Оновлено:** 11.08.2026 14:50 Europe/Oslo  
**Статус:** DEV / TEST ONLY / DEFERRED — WORK SERVER-LOCKED

## Поточне рішення користувача
11.08.2026 після відкриття сторінки користувач вирішив **відкласти Lager Admin** і перейти до реального нового приходу через Nordic scanner.

Не продовжувати Lager Admin, не відкривати WORK і не робити production manual corrections, доки користувач окремо не попросить повернутися до цієї задачі.

## Що вже підтверджено фізично
Browser/UI load PASS:
- `admin-admin.html` відкриває `lager-admin.html`;
- видно `🧪 TEST AKTIV`;
- видно `🔒 WORK LÅST`;
- видно product cards, включно з Forlengere/Vrak;
- видно PÅ LAGER / RFID / MANUELL / TILGJENGELIG;
- mobile layout працює на телефоні.

Mutation buttons `+/-/SETT FAKTISK` користувач фізично **не тестував** перед рішенням відкласти задачу.

## Призначення
Окрема адміністративна сторінка для швидкого ручного коригування складських показників без створення вигаданих RFID-номерів.

Entry:
- `lager-admin.html`
- mnemonic redirect: `admin-admin.html`

## TEST / WORK
V1 працює тільки в `environment=test`.
WORK не просто прихований у UI — RPC-функції серверно відхиляють будь-яку спробу коригування при `environment=work`.

## Джерело ручної поправки
Використовується quantity ledger:
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
`bama_stock_summary()` використовує manual overlay:

RFID product:
`physical_count = verified in_stock RFID rows + manual_count`

Forlengere plast:
`physical_count = manual quantity stock`

`available_count = physical_count - still-unfulfilled active RAMPE orders`

Оператор не редагує `available_count` вручну.

## Ручна корекція DEV
Admin page підтримує:
- `-5`
- `-1`
- `+1`
- `+5`
- `SETT FAKTISK`

Reason presets:
- Hurtigmottak
- Opptelling
- Korreksjon
- Annet

## RFID safety
Admin не створює `mottak_scans` і не генерує fake EPC/lower_number.
Для RFID-продуктів manual_count є адміністративною поправкою.
Для Forlengere plast manual stock є нормальним quantity stock.

## Audit
TEST-зміни пишуться в `mottak_quantity_stock_events`.

RPC:
- `bama_admin_stock_summary()`
- `bama_admin_stock_adjust_test(product,delta,reason)`
- `bama_admin_stock_set_test(product,target,reason)`
- `bama_admin_stock_history_test(limit)`

Mutation RPCs мають hard guard `environment='test'`.

## SERVER PASS 11.08.2026
Transactional/browser-role verification:
- anon TEST `vrak_bunner +5` працює;
- `SETT FAKTISK` перераховує manual delta;
- history RPC бачить зміни;
- TEST manual overlay входить у stock summary;
- усі write-тести виконані з ROLLBACK;
- WORK mutation підтверджено заблокована сервером.

## Новий пріоритет після відкладення
Поточний реальний WORK baseline після manual-shipment correction = **0 по всіх 8 продуктах**.
Див. `WORK_STOCK_BASELINE_RESET_2026-08-11.md`.

Наступний реальний прихід користувач хоче робити через `Nordic ID – Til lager`.

## Не заявляти
- Lager Admin mutation physical PASS — нема.
- WORK admin — не реалізований і навмисно заблокований.
- production manual corrections — не робити без нового явного рішення користувача.
