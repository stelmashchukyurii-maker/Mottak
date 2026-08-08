# UT-TEST-CHAIN — статус реалізації

**Дата:** 08.08.2026  
**Час:** 10:43 Europe/Oslo  
**Статус:** PHASE 1 ACTIVE / ізольований тестовий контур працює

Цей документ є статус-доповненням до `UT_TEST_CHAIN_PROTOCOL_2026-08-08.md`.

## Реалізовано

Створені окремі TEST-таблиці Supabase:

- `ut_test_stock`
- `ut_test_orders`
- `ut_test_order_scans`

Production-таблиці `mottak_scans`, `ut_orders`, `ut_order_scans` не використовуються TEST-сторінками напряму.

Створений захисний браузерний адаптер:

- `ut-test-api.js`

Він перенаправляє дозволені REST-запити на TEST-таблиці та TEST-RPC. Невідомі звернення до Supabase REST у TEST-контурі блокуються.

## TEST-склад

У `ut_test_stock` скопійовано реальні історичні записи зі статусом `dispatched`:

- 10 × `bunner`
- 10 × `hyller30`
- 10 × `hyller60`

Перед копіюванням нижні номери були перевірені проти актуального production-складу зі статусами `in_stock`, `reserved`, `staged`.

**Перетин із поточним production-складом: 0.**

У TEST-копіях:

- `stock_status = in_stock`
- `is_test = true`
- зберігається `source_mottak_scan_id`, щоб було видно, з якого історичного production-запису зроблена копія.

## TEST-сторінки

### 1. TEST — UT Kontor

Файл:

`bestilling-products-test.html`

- бере актуальний `bestilling.html` як основу;
- підключає `ut-test-api.js` до виконання робочих скриптів;
- створює та редагує тільки TEST-замовлення;
- бачить лише TEST-залишок;
- показує центральний `products.js`;
- має NO / UA;
- має переходи на TEST Home, TEST Bekreft і TEST Foto.

### 2. TEST — UT Bekreft

Файл:

`utsending-test.html`

- використовує актуальний `utsending-core-v7.html` як основу;
- бачить тільки `ut_test_orders`, `ut_test_stock`, `ut_test_order_scans`;
- дозволяє вибрати конкретний TEST-товар;
- резервує його;
- переводить на рампу;
- виконує TEST-відправку;
- дозволяє повернути весь TEST-товар назад;
- має кнопку переходу на `ut-camera-test.html` для відкритої рампи.

### 3. TEST — UT Foto

Файл:

`ut-camera-test.html`

- використовує актуальний `ut-camera.html` та його допоміжні фото-flow скрипти;
- отримує TEST order ID із TEST Bekreft;
- пошук і резерв виконуються лише у TEST-складі;
- AI Edge Functions залишаються спільними, але результат пошуку/запису товару йде тільки в TEST-базу;
- сценарій «зареєструвати відсутню бірку на складі» також має окрему TEST-RPC і не пише в production.

### 4. TEST Home

Файл:

`test-home.html`

Містить посилання на:

- `products.html`
- `bestilling-products-test.html`
- `utsending-test.html`
- `ut-camera-test.html`
- основний протокол `UT-TEST-CHAIN`.

## TEST-RPC

Створені ізольовані функції:

- `ut_test_physical_stock()`
- `ut_test_reserve_scan_by_id(uuid,text)`
- `ut_test_reserve_scan(uuid,text)`
- `ut_test_remove_scan(uuid,text)`
- `ut_test_stage_order(uuid)`
- `ut_test_dispatch_order(uuid)`
- `ut_test_return_order(uuid)`
- `ut_test_cancel_order(uuid,text)`
- `ut_test_office_edit_order(...)`
- `ut_test_register_scan_only(text,text,numeric)`

TEST-функції створені як `SECURITY INVOKER`.

## Перевірка бази

08.08.2026 проведений службовий наскрізний тест у базі:

1. створено TEST order;
2. зарезервовано по одному Bunner, Hyller x30, Hyller x60;
3. order переведено на рампу;
4. виконана TEST-відправка;
5. всі товари повернуті в `in_stock`;
6. службовий order та його scans видалені.

Результат після тесту:

- Bunner: 10 / 10 `in_stock`
- Hyller x30: 10 / 10 `in_stock`
- Hyller x60: 10 / 10 `in_stock`
- службових test orders: 0
- службових test order scans: 0

Окремо перевірений сценарій фото-реєстрації нового TEST-товару; після перевірки службовий запис видалений.

## Наступний етап

Тепер тестування виконується користувачем через реальні TEST-сторінки. Під час тестів потрібно послідовно «вилизувати»:

- UX / мобільну верстку;
- NO / UA;
- переходи між сторінками;
- стани замовлення;
- резерв / рампа / відправка / повернення;
- фото / AI / ручний ввід;
- складські числа;
- підтримку нових `Forlengere` продуктів;
- структуру бази для нових складових продуктів.

Production-контур не переводити на цю архітектуру без окремої команди користувача.
