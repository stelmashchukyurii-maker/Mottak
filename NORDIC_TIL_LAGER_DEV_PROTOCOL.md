# Nordic ID – Til lager · DEV PROTOCOL

**Проєкт:** BaMavaremottak / AI Scanner Mottak  
**Створено:** 10.08.2026 22:02 Europe/Oslo  
**Статус:** DEV / TEST FIRST — НЕ STABLE

## Незмінне правило
- `Nordic ID – Til rampe · STABLE V2.9.7` не переписувати і не видаляти.
- Нова форма приймання розробляється окремо як `nordic-id-til-lager-test.html`.
- У `NORDIC_ID_PROGRESS_LOG.md` `Til lager` можна переносити як PASS тільки після фізичного підтвердження користувачем на Nordic ID.

## Бізнес-правила продуктів
RFID є у всіх робочих продуктів, крім `forlengere_plast`.

RFID-продукти:
- `bunner`
- `hyller30`
- `hyller60`
- `forlengere_korte`
- `forlengere_lange`
- `vrak_bunner`
- `vrak_hyller`

Без RFID:
- `forlengere_plast` — ручний / телефонний count-flow.

Нові підтверджені правила:
- `vrak_bunner` = 1 RFID-одиниця / стопка = 10 Vrak bunner.
- `vrak_hyller` = 1 RFID-одиниця / стопка = 30 Vrak hyller.
- Усі перелічені продукти можуть бути відправлені на RAMPE.
- `forlengere_korte` / `forlengere_lange`: при прийманні на склад кількість Hyller/Forlengere НЕ вводиться; ці кількості вводяться лише при UT / списанні.

## Центральний product registry
`products.js` оновлено до **v1.3.0**.
Додано permanent IDs:
- `vrak_bunner`
- `vrak_hyller`

`forlengere_plast` явно позначено як `rfid:false`.

## Supabase product constraints — SERVER PASS
Project: `hzjsatehehhpgpskckfi`

Migration:
- `extend_rfid_products_for_vrak_and_extenders`

`mottak_scans_product_check` тепер дозволяє:
- bunner
- hyller30
- hyller60
- forlengere_korte
- forlengere_lange
- vrak_bunner
- vrak_hyller

`ut_order_scans_product_check` тепер дозволяє той самий RFID-набір.
`forlengere_plast` навмисно не доданий у RFID scan table.

## Til rampe server compatibility — SERVER PASS
Migration:
- `extend_nordic_preview_for_vrak_products_v2`

`private.nordic_preview(uuid,text)` розширено так, щоб `vrak_bunner` і `vrak_hyller` проходили як звичайні RFID stock items.
Frozen frontend `Nordic ID – Til rampe V2.9.7` не переписувався.

## TEST / WORK database verification
Перевірено через browser-role semantics (`anon` + `x-bama-environment`):
- TEST: дві однакові RFID-бірки для `vrak_bunner` успішно існували одночасно (`count=2`).
- WORK: друга однакова RFID-бірка для `vrak_hyller` не створила дубль (`count=1`).
- Обидві перевірки виконані всередині транзакції з `ROLLBACK`.
- Контрольний SELECT після тесту повернув 0 тестових рядків: production не засмічено.

## Nordic ID – Til lager DEV
**Файл:** `nordic-id-til-lager-test.html`  
**Поточна версія:** DEV V1.0.1  
**GitHub content SHA:** `03c43233b1d81b5e107799bbbf4c396ddcc23907`

Основний flow:
1. TEST за замовчуванням.
2. WORK тільки після ~1.5 s hold + browser confirm.
3. Вибрати продукт один раз; вибір зберігається для наступних сканів.
4. V2.4-style hidden RFID input:
   - `Unidentified` hardware trigger arms input;
   - 24 HEX EPC;
   - 600 ms lock;
   - input readonly в idle;
   - soft keyboard ховається без blur під час RFID ACTIVE.
5. Scan → показати product + lower 6 → підтвердити.
6. TEST: створити нову TEST-одиницю; same physical RFID дозволена повторно.
7. WORK:
   - якщо RFID уже існує → block/warning;
   - якщо існує Camera-row з тим самим `lower_number`, `scanner_code=''`, тим самим product і `in_stock` → доповнити цей самий row повним EPC, не створювати дубль і не втрачати photo;
   - якщо Camera-row має інший product → block, нічого не змінювати;
   - якщо row staged/dispatched → block;
   - якщо рядка немає → створити verified `in_stock` WORK row.
8. Success → великий `PÅ LAGER` → автоматично повернутися до READY.

## Scanner home
`scanner-home.html` тепер показує:
- `📥 TIL LAGER` → DEV V1.0.1 · TEST FIRST
- `📤 TIL RAMPE` → STABLE V2.9.7 · LOCKED

Til lager ще не називати stable до фізичного Nordic PASS.

## Camera fallback
Фізично підтверджена попередня база:
- Camera v4.25 LOWER RESET — після save більше не зависає на `ОБРОБКА…`.
- Camera v4.26 AUTO SAVE FOCUS — після успішного OCR автоматично фокусується/прокручується до `ЗБЕРЕГТИ`.

Підготовлено наступну DEV-надбудову для fallback нових RFID-продуктів:
- `camera-extra-rfid-products.js`
- `camera-live-v4-floating-camera-v2.js`
- `camera-live-v414.html` → Camera v4.27 `RFID FALLBACK PRODUCTS`

Нові Camera fallback products:
- forlengere_korte
- forlengere_lange
- vrak_bunner
- vrak_hyller

Camera v4.27 ще потребує фізичного підтвердження; v4.26 лишається останнім підтвердженим Camera PASS/rollback у GitHub history.

## UT Kontor
`bestilling.html` лишається функціонально тим самим `UT Kontor WORKING v36`.
Виправлено тільки мову: перед language-module примусово встановлюється `mottak_ut_language=no`, щоб production UT Kontor не підхоплював українську з TEST/localStorage.

Vrak-продукти ще треба додати до order-entry cards UT Kontor окремим additive кроком; не змінювати існуючі 6 product flows.

## Наступний фізичний крок
На Nordic:
1. відкрити `scanner-home.html`;
2. `📥 TIL LAGER`;
3. залишити **TEST**;
4. вибрати `Bunner` або `Vrak bunner`;
5. коротко scan відомої RFID-бірки;
6. перевірити modal product + lower_number;
7. підтвердити TEST;
8. після цього перевірити DB/log перед переходом до WORK.
