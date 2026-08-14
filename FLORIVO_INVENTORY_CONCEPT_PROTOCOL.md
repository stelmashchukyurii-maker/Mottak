# Florivo Inventory / Inventering — КОНЦЕПТУАЛЬНИЙ ПРОТОКОЛ

**Проєкт:** Florivo / BaMavaremottak  
**Дата фіксації:** 14.08.2026 19:28 Europe/Oslo  
**Статус:** CONCEPT / TEST DESIGN — БЕЗ ЗМІН PRODUCTION  
**Призначення:** зафіксувати задум окремого режиму щомісячної інвентаризації складу з Nordic ID / Florivo Scanner.

> Цей документ НЕ змінює WORK-stock, Nordic production-форми або заморожену production-логіку. Перший етап — окрема браузерна TEST-форма. Після фізичного тесту успішна логіка може бути перенесена у Florivo Android Scanner.

---

## 1. Головна мета

Раз на місяць або за потреби працівник проходить весь склад зі сканером і фіксує **фактичний фізичний стан**.

Ключова ідея:

```text
ЩО СЕРВЕР ОЧІКУЄ ПОБАЧИТИ
            ↕
ЩО ФАКТИЧНО ПОРАХОВАНО НА СКЛАДІ
```

Інвентаризація повинна створювати незалежний snapshot / inventory session і під час обходу НЕ повинна автоматично:
- додавати товар у WORK-stock;
- списувати товар із WORK-stock;
- змінювати `stock_status`;
- виправляти серверні залишки;
- створювати fake RFID/EPC.

Будь-яке майбутнє коригування WORK після інвентаризації — окремий підтверджений крок після перегляду розбіжностей.

---

## 2. Окрема inventory session

Старт:

```text
INVENTERING
Dato: <date>
Location: <warehouse/location>

[ START INVENTERING ]
```

Сервер створює одну inventory session, наприклад:

```text
inventory_session_id
started_at
started_by
device_id
location
status = open
```

Усі наступні RFID/manual записи належать саме цій session.

Після завершення:

```text
status = completed
completed_at
```

Потрібно зберігати історію кожної інвентаризації, а не перезаписувати попередню.

---

## 3. Основний фізичний flow

```text
START INVENTERING
        ↓
ходимо по складу
        ↓
RFID scan / manual fallback
        ↓
оператор фіксує, що реально бачить
        ↓
CONFIRM
        ↓
наступний товар
        ↓
...
        ↓
AVSLUTT INVENTERING
        ↓
SERVER EXPECTED ↔ PHYSICAL COUNT
        ↓
AVVIK REPORT
```

---

## 4. Bunner — стопка

Після RFID оператор може вибрати:

```text
BUNNER STABEL
```

Фактична кількість Bunner у стопці:

```text
Antall Bunner
[-]  10  [+]
```

Правило:
- значення за замовчуванням = **10**;
- оператор може змінити його, якщо фактична стопка має іншу кількість;
- inventory зберігає фактичне число, а не примусово 10.

Приклад:

```text
RFID = <EPC>
physical_type = bunner_stack
physical_bunner_count = 10
```

---

## 5. Bunner + Hyller

Другий основний варіант після RFID:

```text
BUNNER + HYLLER
```

Оператор фіксує фактичну кількість полиць:

```text
Antall hyller
[ 30 ]
```

Інвентаризація не повинна обмежувати факт тільки стандартними x30 або x60.

Якщо фізично є:

```text
1 Bunner + 57 Hyller
```

так і зберігати:

```text
physical_bunner_count = 1
physical_hyller_count = 57
```

Це важливо, бо Inventering повинна показувати реальність, навіть якщо сервер очікував H60.

---

## 6. Захист від подвійного рахунку

В межах однієї inventory session той самий RFID/EPC не можна зарахувати двічі автоматично.

При повторному скануванні:

```text
⚠ ALLEREDE TELT
<EPC / lower>
Bunner stabel · 10 stk
Telt: <time>
```

Повторний scan не додає нову одиницю.

Майбутня можливість `ENDRE` може дозволяти відкрити вже порахований запис і виправити кількість без створення дубля.

---

## 7. Неробоча / відсутня бірка — MANUELL

Обов’язковий fallback:

```text
[ + MANUELL ]
```

Використовується, коли:
- RFID не читається;
- бірка пошкоджена;
- бірки фізично немає;
- є товар, який треба порахувати, але немає надійного RFID.

Оператор вибирає фізичний тип і кількість:

```text
BUNNER STABEL
або
BUNNER + HYLLER
```

Після підтвердження система створює **тільки inventory manual reference**, наприклад:

```text
MAN-001
MAN-002
MAN-003
```

Це НЕ RFID і НЕ `lower_number` для основного складу.

На екрані великими цифрами показується manual number.

Працівник фізично відмічає вже порахований товар наліпкою / маркером з цим номером, щоб не порахувати його вдруге.

Приклад:

```text
MAN-027
Bunner stabel
10 stk
```

---

## 8. Невідомий RFID

Якщо RFID фізично знайдений, але сервер не знає його як поточний складський актив:

```text
⚠ UKJENT I SYSTEMET
<EPC>

[ REGISTRER SOM FUNNET ]
```

Для інвентаризації його потрібно дозволити зафіксувати як фізично знайдений.

Але ця дія:
- НЕ додає його автоматично у WORK-stock;
- НЕ змінює `mottak_scans` без окремого рішення;
- лише створює inventory evidence / discrepancy.

---

## 9. Товар зі статусом, який не відповідає фізичній реальності

Наприклад сервер має:

```text
stock_status = dispatched
```

але товар фізично знайдено на складі.

У звичайному production-flow це може бути блокуюча проблема.

В INVENTERING навпаки треба дозволити зафіксувати факт:

```text
⚠ FUNNET PÅ LAGER
Serverstatus: DISPATCHED
```

Цей товар потрапляє до AVVIK report.

Принцип:

> Inventering не приховує помилки server state — вона повинна їх знаходити.

---

## 10. Підтримка всіх продуктів — майбутня повна версія

Початковий фізичний TEST можна сфокусувати на Bunner / Hyller.

Повна Florivo Inventory повинна в перспективі підтримувати весь актуальний product model:

### RFID products
- `bunner`
- `hyller30`
- `hyller60`
- `forlengere_korte`
- `forlengere_lange`
- `vrak_bunner`
- `vrak_hyller`

### Quantity-only
- `forlengere_plast`

Принципи:
- Forlengere korte/lange — під час inventory фіксувати фактичний фізичний count, який потрібен для реального звіряння;
- Vrak — рахувати фактичну кількість;
- Plast — quantity-only/manual count, без fake RFID.

Точний UX цих продуктів визначити після першого Browser TEST Bunner/Hyller.

---

## 11. Завершення інвентаризації

Кнопка:

```text
[ AVSLUTT INVENTERING ]
```

Перед завершенням бажано показати:
- кількість унікальних RFID;
- кількість manual records;
- загальну кількість Bunner;
- загальну кількість Hyller;
- невідомі RFID;
- попередження про можливі незавершені записи.

Після підтвердження session закривається та сервер формує звіт.

---

## 12. Порівняння SERVER ↔ FAKTISK

Після завершення сервер порівнює очікуваний stock state із фактичною inventory session.

Приклад summary:

```text
INVENTERING <date>

SERVER FORVENTET
Bunner: 250
Hyller: 1830

FAKTISK TELT
Bunner: 247
Hyller: 1827

AVVIK
Bunner: -3
Hyller: -3
```

Окремі групи розбіжностей:

### MANGLER
Товар, який сервер очікує на складі, але під час inventory не знайдений.

### FUNNET MEN IKKE FORVENTET
Фізично знайдений товар, якого сервер не очікує на складі.

### UKJENT RFID
RFID фізично знайдений, але відсутній у базі/поточному stock model.

### MANUELT TELT
Записи типу `MAN-xxx` через неробочу/відсутню бірку.

### FEIL ANTALL
RFID/asset знайдений, але фактична кількість Bunner/Hyller відрізняється від того, що очікує server/product model.

---

## 13. WORK correction — тільки після окремого підтвердження

Inventory report сам НЕ коригує основний склад.

Майбутній flow:

```text
INVENTORY COMPLETED
       ↓
AVVIK REPORT
       ↓
людина перевіряє
       ↓
APPROVE CORRECTION
       ↓
окремі server-side audited adjustments
```

Усі коригування повинні мати audit trail:
- хто;
- коли;
- яка inventory session;
- старе значення/state;
- нове значення/state;
- причина.

Не можна робити silent overwrite залишків.

---

## 14. Browser TEST — рекомендований перший етап

Перед Android реалізацією створити окрему браузерну TEST-сторінку.

Мета Browser TEST:
- перевірити реальний обхід складу зі Nordic ID;
- зрозуміти оптимальну кількість кнопок;
- перевірити Bunner stabel default 10 + editable;
- перевірити Bunner + Hyller із довільною фактичною кількістю полиць;
- перевірити duplicate RFID block;
- перевірити manual `MAN-xxx` + фізичну наліпку;
- перевірити unknown RFID;
- перевірити resume session після випадкового refresh/закриття;
- перевірити фінальний discrepancy report.

Перший Browser TEST повинен бути TEST-only і не змінювати WORK-stock.

---

## 15. Після Browser PHYSICAL PASS → Android

Тільки після фізичного успішного тесту UX/logic переносити в Florivo Android Scanner.

Майбутня Android кнопка:

```text
📋 INVENTERING
```

Android-клієнт залишається простим:
- читає RFID;
- передає scan + фактичні counts;
- отримує server validation;
- показує already counted / unknown / saved;
- не вирішує сам, як виправляти WORK-stock.

Це узгоджується з `FLORIVO_ANDROID_SCANNER_CONCEPT_PROTOCOL.md`:

```text
SCANNER READS + REQUESTS
        ↓
SERVER VALIDATES + DECIDES
        ↓
SCANNER SHOWS RESULT
```

---

## 16. Критичні правила LOCK для майбутньої реалізації

1. Inventory session є окремою від operational stock.
2. Scan під час inventory не змінює WORK-stock автоматично.
3. Один RFID = максимум один активний count у session.
4. Manual record ніколи не генерує fake RFID/EPC/lower.
5. Unknown/unexpected RFID треба дозволити записати як physical evidence.
6. Фактична кількість важливіша за стандартну продуктову норму при inventory.
7. Bunner stack default = 10, але editable.
8. Bunner + Hyller дозволяє довільну фактичну кількість Hyller.
9. Завершена inventory session зберігається в історії.
10. WORK correction — тільки окремо, audited і після людського підтвердження.
11. Перший етап — Browser TEST; Android тільки після PHYSICAL PASS.
12. Чинні Nordic/WORK production-форми залишаються FROZEN і не використовуються як місце для експерименту.

---

## 17. Поточний статус

Станом на 14.08.2026:

```text
IDEA CONFIRMED
→ CONCEPT PROTOCOL CREATED
→ Browser TEST NOT YET IMPLEMENTED
→ NO WORK CHANGES
→ NO DB CHANGES FOR INVENTORY YET
→ Android Inventory NOT YET IMPLEMENTED
```

Наступна окрема розмова може почати з проектування Browser TEST, не торкаючись Florivo Android Scanner DEV та поточної Nordic production лінії.
