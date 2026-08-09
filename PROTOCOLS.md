# BaMavaremottak — індекс протоколів проєкту

**Призначення:** постійна точка входу для нових розмов ChatGPT, розробників і тестувальників.  
**Репозиторій:** `stelmashchukyurii-maker/Mottak`  
**Основна гілка:** `main`  
**Оновлено:** 09.08.2026 12:13 Europe/Oslo

---

## 1. НАЙНОВІШИЙ HANDOFF — обов'язкова стартова точка

Починати з:

```text
docs/HANDOFF_2026-08-09_1213.md
```

Код для нової scanner-розмови:

```text
Продовжуй BAMA-SCANNER-0908.
```

Цей handoff має пріоритет над попередніми handoff щодо поточного стану й містить:

- WORKING / GREEN / UT TEST архітектуру;
- production database/stock rules;
- 7 active products / 6 manual-order products;
- Forlengere та production UT lifecycle;
- актуальні UT Kontor GREEN v38 / WORKING v36;
- актуальний UT Lager v27.15;
- актуальні Camera WORKING/ GREEN v4.24;
- stock-minus-ramp semantics;
- відомі регресії MutationObserver/cache-loop;
- новий остаточний протокол GREEN → PASS → повний перенос у WORKING;
- scanner як наступний пріоритет;
- стартовий текст для нової розмови.

---

## 2. Новий обов'язковий протокол розробки

Від 09.08.2026 діє такий порядок для нових змін:

```text
GREEN
→ робимо всю зміну повністю
→ GREEN чітко позначений зеленим оформленням
→ користувач тестує
→ PASS
→ переносимо весь перевірений комплект у WORKING повністю
```

### Заборонено

- змінювати WORKING паралельно під час GREEN-розробки;
- переносити GREEN у WORKING по одному скрипту;
- переносити лише частину логіки;
- робити окремі «латки» в WORKING, яких немає в перевіреному GREEN;
- вважати GREEN і UT TEST одним середовищем.

### При повному переносі

Переносяться разом:

- wrapper/HTML;
- усі активні JS-модулі;
- логіка UI;
- підрахунки;
- мови;
- data/RPC integration;
- перевірена поведінка.

Не переноситься лише GREEN-специфічне оформлення, рамка, позначення та спеціальні тестові floating controls, якщо користувач не попросив інакше.

---

## 3. Поточний наступний напрям — SCANNER / CAMERA

Нова розмова працює зі scanner-частиною.

Перед змінами обов'язково відкрити актуальні:

```text
camera-green.html
camera-live-v414.html
```

а також всі JS-модулі, які вони реально підключають.

Починати зміни тільки в:

```text
camera-green.html
```

WORKING Camera не змінювати до PASS користувача.

Поточні базові версії:

```text
WORKING: camera-live-v414.html — Camera Cloud v4.24
GREEN:   camera-green.html     — GREEN Camera Cloud v4.24
```

Детальна scanner-архітектура та список модулів — у `docs/HANDOFF_2026-08-09_1213.md`.

---

## 4. Поточні ключові рішення по складу

Production warehouse:

```text
public.mottak_scans
```

Stock statuses тільки:

```text
in_stock
staged
dispatched
```

`reserved` не використовувати як складський статус.

Робочий tag ID:

```text
lower_number — унікальний 6-символьний номер
```

`upper_number` — compatibility-only, робоче значення не використовувати.

`078500` не зберігати як робочі дані.

Повторне приймання `dispatched` tag перевикористовує той самий row; дубль не створюється.

---

## 5. Лічильник складу

Не змішувати:

```text
physical stock
```

і

```text
compact availability = physical in_stock − outstanding active ramp/order demand
```

Уже `staged` позиції не віднімати двічі.

Чинна семантика:

```text
PÅ LAGER · MINUS RAMPER
```

Безпечний модуль:

```text
compact-stock-counter-v2.js
```

Старий `compact-stock-counter.js` не повертати як основний.

---

## 6. Продукти

Центральний registry:

```text
products.js
```

Активні ID:

```text
bunner
hyller30
hyller60
cc_post
forlengere_korte
forlengere_lange
forlengere_plast
```

`cc_post` — derived/display-only і не є ручним orderable product.

Отже:

```text
7 active products
6 manually orderable products
```

Детальна комплектація й Forlengere rules описані у latest handoff.

---

## 7. UT Kontor — поточна точка

GREEN:

```text
bestilling-green.html
GREEN UT Kontor v38
build 20260809-1124
```

WORKING:

```text
bestilling.html
UT Kontor WORKING v36
build 20260809-1139
```

У WORKING перенесена функціональна частина GREEN із totals/Forlengere/мовами/stock logic; GREEN floating HOME не переносилась.

Подальші зміни UT Kontor робити тільки за новим протоколом GREEN → PASS → full transfer.

---

## 8. UT Lager — поточна точка

WORKING:

```text
utsending.html
UT Lager v27.15
build 20260809-1040
```

Підтримуються:

- Bunner;
- Hyller x30;
- Hyller x60;
- Forlengere korte;
- Forlengere lange;
- Forlengere plast.

Production extra RPC:

```text
confirm_ut_extra_unit
clear_ut_extra_unit
ut_extra_progress
stage_ut_order
confirm_ut_dispatch
```

---

## 9. Cache / fresh experiment

GREEN home має експериментальну кнопку:

```text
↻ ОНОВИТИ ВСЕ GREEN
```

Її ще не вважати production-ready до фактичної перевірки користувачем.

Аналогічну кнопку було додано у WORKING, після чого головна перестала нормально відкриватися. Її повністю прибрано.

WORKING main відновлена. `index.html` зараз використовує cache-bust для стабільного `office-home-setting.js`:

```text
office-home-setting.js?v=20260809-1158
```

Не повертати fresh/cache button у WORKING до успішного GREEN-test.

---

## 10. Відомі регресії, які не повторювати

### Whole-body MutationObserver loop

UT Kontor раніше зависав через observer, який відслідковував DOM і сам безкінечно змінював його.

Не створювати observer, який сам генерує безкінечний потік mutation у спостережуваному root.

### Partial GREEN → WORKING transfer

Часткові переноси призводили до втрати totals/розходження поведінки.

Відтепер тільки повний перенос перевіреного bundle.

### WORKING cache loop

Перший global refresh-button зламав відкриття WORKING main. Fresh-механізми тестувати тільки в GREEN.

---

## 11. Інші чинні протоколи

### Попередній handoff

```text
docs/HANDOFF_2026-08-08_2030.md
```

Використовувати як історію стану до 09.08.2026.

### UT TEST CHAIN

```text
docs/UT_TEST_CHAIN_PROTOCOL_2026-08-08.md
docs/UT_TEST_CHAIN_STATUS_2026-08-08.md
```

### INN

```text
docs/INN_PROTOCOL_2026-08-03.md
```

Старі INN-імена/архітектурні деталі можуть бути історичними; перед зміною scanner завжди читати фактичний `main`.

### UT production history

```text
docs/UT_PROTOCOL_2026-08-04.md
docs/UT_PROTOCOL_2026-08-03.md
```

---

## 12. Порядок джерел істини

```text
1. Поточне явне рішення користувача
2. docs/HANDOFF_2026-08-09_1213.md
3. PROTOCOLS.md
4. Актуальний code main
5. Фактична Supabase schema/functions/data
6. Старі протоколи як історія
```

Перед фактичною зміною коду завжди перечитати активні файли `main`.

---

## 13. Старт нової scanner-розмови

Найкоротше:

```text
Продовжуй BAMA-SCANNER-0908.
```

Повний текст:

```text
Продовжуємо BaMavaremottak. Наступний напрям — SCANNER / CAMERA.
Спочатку прочитай docs/HANDOFF_2026-08-09_1213.md і PROTOCOLS.md.
Потім відкрий актуальні camera-green.html, camera-live-v414.html та всі scanner JS-модулі, які вони реально завантажують.

Працюємо спочатку тільки в GREEN.
GREEN має бути візуально відрізнимий.
WORKING під час розробки не чіпати.
Після того як я перевірю GREEN і дам PASS, перенести в WORKING увесь перевірений scanner bundle повністю, а не частинами.

Перед першою зміною коротко скажи:
1) яка зараз scanner-архітектура;
2) які файли реально активні;
3) де саме будемо робити наступну зміну в GREEN.
```

---

## 14. Правило оновлення протоколу

Оновлювати handoff/індекс після:

- нового стабільного GREEN PASS;
- GREEN → WORKING transfer;
- зміни stock lifecycle;
- зміни product/business logic;
- зміни Supabase schema/RPC;
- критичного дефекту або rollback;
- переходу на нову основну scanner-версію.

Дрібні косметичні зміни не потребують нового handoff, якщо не змінюють процес.
