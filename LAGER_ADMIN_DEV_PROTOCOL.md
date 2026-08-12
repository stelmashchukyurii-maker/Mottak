# Lager Admin · DEV / WORK PROTOCOL

**Проєкт:** BaMavaremottak / AI Scanner Mottak  
**Створено:** 11.08.2026 13:10 Europe/Oslo  
**Оновлено:** 12.08.2026 08:09 Europe/Oslo  
**Статус:** WORK SERVER/UI ACTIVE · PHYSICAL PASS PENDING

## Поточне рішення користувача
12.08.2026 користувач окремо дозволив повернутися до Lager Admin і включити WORK.

Посилання на Lager Admin не додається в scanner-home, Nordic ID чи інші робочі форми. Воно залишається окремим прямим URL.

## Freeze інших робочих форм
Nordic ID / scanner production-форми не змінювати в рамках Lager Admin. Їхня чинна робоча логіка FROZEN. Будь-які зміни тільки після окремого прямого дозволу користувача.

## Поточний entry
- `lager-admin.html` — WORK v2.0
- `admin-admin.html` — старий mnemonic redirect; не є основним entry і не потрібен для WORK.

Основний прямий URL користувача:
`https://stelmashchukyurii-maker.github.io/Mottak/lager-admin.html`

## Призначення
Окрема адміністративна сторінка для швидкого ручного коригування складських показників без створення вигаданих RFID-номерів.

## Джерело ручної поправки
Quantity ledger:
- `public.mottak_quantity_stock`
- `public.mottak_quantity_stock_events`

Product model охоплює всі 8 продуктів.

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
Privileged DB mutation RPC не відкрито напряму browser `anon`.

Створено окремий server-side Supabase Edge Function:
- slug: `lager-admin-work`
- version: 1
- status: ACTIVE

Безпека:
- дозволений origin тільки `https://stelmashchukyurii-maker.github.io`;
- окремий Admin-код передається в `x-admin-key`;
- Admin-код не зберігається в HTML;
- browser не отримує `SUPABASE_SERVICE_ROLE_KEY`;
- Edge Function працює server-side з service role;
- `verify_jwt=false` використовується разом із custom Admin-key authentication;
- пряме посилання на Admin не додається в production navigation.

## WORK actions
`lager-admin.html` v2.0 підтримує:
- `-5`
- `-1`
- `+1`
- `+5`
- `SETT FAKTISK`
- `OPPDATER`
- WORK history.

Reason presets:
- Hurtigmottak
- Opptelling
- Korreksjon
- Annet

WORK delta дозволені тільки: `-5, -1, +1, +5`.
`SETT FAKTISK` має browser confirmation перед записом.

Admin-код зберігається лише в `sessionStorage` після успішного `OPPDATER`, тобто до закриття вкладки/сесії браузера.

## RFID safety
Admin не створює `mottak_scans` і не генерує fake EPC/lower_number.
Для RFID-продуктів manual_count є адміністративною поправкою.
Для Forlengere plast manual stock є нормальним quantity stock.

## Audit
WORK-зміни пишуться в `mottak_quantity_stock_events` з action:
- `admin_adjust_work`
- `admin_set_work`

Якщо запис audit event після stock update не вдається, Edge Function робить compensating rollback manual quantity до попереднього значення.

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

Після server/UI deployment перевірено повторно: значення не змінилися.
WORK admin audit events після deployment: 0.

Це контрольний snapshot лише на момент перевірки. Поточний склад надалі завжди брати live через `bama_stock_summary()`.

## Що підтверджено
SERVER/UI DEPLOY PASS:
- Edge Function ACTIVE;
- `lager-admin.html` оновлений до WORK v2.0;
- deployment не змінив stock;
- deployment не створив admin audit events;
- Nordic/scanner production files не редагувалися.

## Не заявляти до фізичного тесту
- Lager Admin WORK physical PASS — ще нема.
- Не вважати WORK mutation фізично прийнятим, доки користувач не відкриє форму зі свого телефону, введе Admin-код, виконає контрольну зміну та підтвердить результат.
