# Lager Admin · DEV / WORK PROTOCOL

**Проєкт:** BaMavaremottak / AI Scanner Mottak  
**Створено:** 11.08.2026 13:10 Europe/Oslo  
**Оновлено:** 12.08.2026 08:09 Europe/Oslo  
**Статус:** WORK ACTIVATION IN PROGRESS

## Поточне рішення користувача
12.08.2026 користувач окремо дозволив повернутися до Lager Admin і включити WORK.

Посилання на Lager Admin не додається в scanner-home, Nordic ID чи інші робочі форми. Воно залишається окремим прямим URL.

## Freeze інших робочих форм
Nordic ID / scanner production-форми не змінювати в рамках Lager Admin. Їхня чинна робоча логіка FROZEN. Будь-які зміни тільки після окремого прямого дозволу користувача.

## Що було підтверджено до WORK activation
Browser/UI load PASS:
- `admin-admin.html` відкриває `lager-admin.html`;
- видно product cards, включно з Forlengere/Vrak;
- видно PÅ LAGER / RFID / MANUELL / TILGJENGELIG;
- mobile layout працює на телефоні.

Стара TEST-версія mutation buttons `+/-/SETT FAKTISK` фізично не була прийнята користувачем перед відкладенням.

## Призначення
Окрема адміністративна сторінка для швидкого ручного коригування складських показників без створення вигаданих RFID-номерів.

Entry:
- `lager-admin.html`
- mnemonic redirect: `admin-admin.html`

## Джерело ручної поправки
Quantity ledger:
- `public.mottak_quantity_stock`
- `public.mottak_quantity_stock_events`

Product constraint охоплює всі 8 продуктів.

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

## WORK architecture 12.08.2026
Не відкриваємо privileged DB mutation RPC напряму для browser anon.

Створено окремий server-side Supabase Edge Function:
- `lager-admin-work`
- status ACTIVE
- version 1

Безпека:
- дозволений origin тільки `https://stelmashchukyurii-maker.github.io`;
- окремий Admin-код передається з браузера в `x-admin-key`;
- код не зберігається в HTML;
- Edge Function використовує server-side `SUPABASE_SERVICE_ROLE_KEY`;
- `verify_jwt=false` тільки тому, що використовується custom Admin-key authentication;
- WORK mutation проходить через server-side function, а не напряму з publishable key.

## WORK actions
Admin page має підтримувати:
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

WORK delta дозволені тільки: `-5, -1, +1, +5`.
`SETT FAKTISK` має окреме підтвердження перед записом.

## RFID safety
Admin не створює `mottak_scans` і не генерує fake EPC/lower_number.
Для RFID-продуктів manual_count є адміністративною поправкою.
Для Forlengere plast manual stock є нормальним quantity stock.

## Audit
WORK-зміни пишуться в `mottak_quantity_stock_events` з action:
- `admin_adjust_work`
- `admin_set_work`

## Live baseline перед WORK activation
12.08.2026 перед змінами перевірено live через `bama_stock_summary()`:
- bunner 24
- hyller30 3
- hyller60 20
- forlengere_korte 3
- forlengere_lange 3
- forlengere_plast 0
- vrak_bunner 0
- vrak_hyller 2

Це контрольний snapshot лише на момент перевірки. Поточний склад надалі завжди брати live через `bama_stock_summary()`.

## Не заявляти до фізичного тесту
- Lager Admin WORK physical PASS — ще нема.
- Не вважати WORK mutation фізично прийнятим, доки користувач не зробить контрольну зміну зі свого телефону та не підтвердить результат.
