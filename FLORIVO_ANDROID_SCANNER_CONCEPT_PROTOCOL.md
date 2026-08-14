# Florivo Android Scanner — КОНЦЕПТУАЛЬНИЙ ПРОТОКОЛ

**Проєкт:** Florivo / BaMavaremottak  
**Дата фіксації:** 14.08.2026 19:11 Europe/Oslo  
**Статус:** CONCEPT / ARCHITECTURE — БЕЗ ЗМІН PRODUCTION  
**Призначення:** зафіксувати задум окремого фірмового Android-застосунку Florivo Scanner та серверної моделі керування сканерами.

> Цей документ не змінює і не розморожує чинні Nordic ID / scanner production-форми. Поточна Nordic production-логіка залишається FROZEN згідно з `NEXT_CHAT_NORDIC_ID.txt`, `NORDIC_ID_RFID_PROTOCOL.md`, `NORDIC_TIL_RAMPE_STABLE_LOCK.md` і `PROTOCOLS.md`.

---

## 1. Головна ідея

Florivo Android Scanner має бути максимально простим клієнтом.

Сканер:
- читає RFID / QR / barcode / camera data;
- показує оператору доступні серверні дії;
- передає на сервер фактичні дані сканування та намір оператора;
- отримує відповідь сервера;
- показує PASS / BLOCK / ERROR / progress.

Сканер **не є джерелом правди для складу, замовлень або одержувача**.

Уся критична бізнес-логіка повинна залишатися на сервері:
- чи існує RFID;
- який це продукт;
- чи дозволений дубль;
- де зараз знаходиться товар;
- чи є активне замовлення;
- скільки залишилося виконати;
- чи можна перемістити товар на рампу;
- чи можна підтвердити dispatch;
- кому/куди належить конкретне замовлення;
- які права має цей scanner/device.

Базовий принцип:

```text
SCANNER READS + REQUESTS
        ↓
SERVER VALIDATES + DECIDES
        ↓
SCANNER SHOWS RESULT
```

---

## 2. Базові операції Android Scanner

Початкова концепція передбачає щонайменше такі серверні операції:

### A. Додати до складу / TIL LAGER
Сканер передає серверу фактичний RFID/EPC та необхідний контекст операції.

Приклад концептуального запиту:

```text
action = ADD_TO_STOCK
device_id = FLR-...
epc = <full EPC>
product = <selected/detected product>
```

Сервер перевіряє валідність, дублікати, environment, product rules та записує/відхиляє операцію.

### B. Відправити на рампу / TIL RAMPE
Сканер працює **в контексті конкретного UT order**.

Приклад:

```text
action = TO_RAMP
device_id = FLR-...
order_id = <UT order UUID>
epc = <full EPC>
```

Сервер перевіряє order, product, remaining quantity, stock state та інші правила й лише після цього виконує staging.

### C. Фактична відправка / DISPATCH
Сканер не створює нового клієнта і не вибирає одержувача вручну.

Він передає серверу факт/підтвердження виконання конкретного замовлення:

```text
action = DISPATCH_ORDER
device_id = FLR-...
order_id = <UT order UUID>
```

Сервер сам знає, **кому і куди їде товар**, із server-side даних цього замовлення.

### D. Майбутні рухи
У майбутньому можуть існувати:
- transfer warehouse → warehouse;
- return to supplier;
- customer return;
- internal movement;
- inventory/counting.

Для будь-якого такого руху одержувач/контрагент/місце призначення має приходити із server-side task/order/transaction, а не вводитися довільно на scanner.

---

# 3. ЖОРСТКЕ ПРАВИЛО — UT KONTOR Є ДЖЕРЕЛОМ ЗАМОВЛЕННЯ

Це окремо зафіксована корекція концепції.

## Поточний Florivo/BaMavaremottak flow

```text
UT KONTOR
   ↓
створює order
   ↓
ut_orders + ut_order_items + пов’язані server-side дані
   ↓
SERVER
   ↓
Android Scanner / Nordic / інший клієнт виконує фізичну частину
```

### Кому їде товар

**Дані клієнта / одержувача / замовника не повинні визначатися Android scanner.**

Вони є атрибутами замовлення, створеного в UT Kontor, або пов’язаних server-side order data.

Android Scanner може показати оператору, наприклад:

```text
RAMPE 31
Order: UT-...
Kunde: <отримано із сервера>
```

але scanner не повинен заново створювати або самостійно визначати `Kunde`.

### Правильна логіка

```text
UT Kontor створив замовлення
→ сервер уже знає RAMPE, товари, кількості та дані призначення
→ scanner відкриває/отримує це замовлення
→ scanner передає лише фактичні RFID/дії
→ server перевіряє їх проти order
→ після завершення server виконує/підтверджує dispatch для одержувача, який уже записаний у замовленні
```

Отже попередню умовну фразу «scanner відправляє покупцю/замовнику» слід трактувати так:

> scanner фізично виконує dispatch існуючого server-side order; **одержувач береться з UT Kontor order, а не зі scanner input**.

---

## 4. Реєстрація і pairing нового Android Scanner

Мета — новий scanner не отримує доступ до Florivo лише через встановлення APK.

Він повинен бути прив’язаний до зареєстрованого Florivo account / organization через server-side pairing.

### Крок 1 — зареєстрований користувач
Користувач входить у Florivo web/admin і відкриває розділ, умовно:

```text
Skannere / Devices
```

Натискає:

```text
Koble til ny skanner
```

### Крок 2 — сервер генерує QR
Сервер створює короткоживучий pairing session та QR.

QR не є постійним паролем.

Концептуальні властивості:

```text
pairing_session = random
expires_at = short TTL
single_use = true
status = waiting
```

QR може автоматично змінюватися/оновлюватися на сторінці після завершення або закінчення pairing session.

### Крок 3 — Android app сканує QR
Новий scanner відкриває Florivo Scanner і бачить:

```text
Denne skanneren er ikke tilkoblet
[ SKANN QR-KODE ]
```

Після QR app передає серверу:
- pairing_session;
- локальний/generated scanner installation ID;
- device model;
- app version;
- мінімальні технічні дані, потрібні для реєстрації.

### Крок 4 — сервер показує pending device
На сторінці зареєстрованого користувача має з’явитися повідомлення на кшталт:

```text
Ny skanner ber om tilgang
ID: FLR-7A92
Device: Nordic ID HH85

[ AVVIS ]  [ GODKJENN ]
```

### Крок 5 — контрольне число
Для захисту від випадкового/чужого pairing сервер може показати коротке контрольне число одночасно:
- на Android scanner;
- на web-сторінці користувача.

Наприклад:

```text
5831
```

Користувач візуально звіряє число і натискає `GODKJENN` або `AVVIS`.

Контрольне число не є постійним PIN і не повинно бути довгоживучим credential.

### Крок 6 — після APPROVE
Лише після підтвердження сервер створює активний device record і видає цьому scanner його device credential/session mechanism.

---

## 5. Device model / Florivo Device Management

Кожен scanner повинен мати окрему server-side identity.

Концептуальний запис:

```text
device_id = FLR-7A92
organization_id = ...
location_id = ...
device_type = android_scanner
model = Nordic ID HH85
status = active
paired_by = user_id
paired_at = timestamp
last_seen_at = timestamp
app_version = ...
```

### Прив’язка
Основна бажана ієрархія:

```text
ORGANIZATION
   ↓
LOCATION / WAREHOUSE
   ↓
DEVICE / SCANNER
```

Користувач, який дозволив pairing, записується як `paired_by`, але scanner не повинен концептуально належати лише одній фізичній людині.

Це дозволяє передавати scanner між працівниками, не втрачаючи прив’язку до підприємства/складу.

---

## 6. Права scanner/device

Сервер повинен мати змогу керувати дозволеними діями конкретного scanner.

Наприклад:

```text
can_stock_in = true
can_to_ramp = true
can_dispatch = false
can_transfer = false
can_return = false
```

Android app отримує дозволені функції із сервера і показує тільки доступні оператору/device кнопки.

Але приховування кнопки в app не є security boundary.

Навіть якщо хтось штучно викличе заборонений API action, сервер повинен повторно перевірити permission і відхилити запит.

---

## 7. Блокування / відв’язування scanner

На Florivo web/admin власник/authorized user повинен мати можливість:

```text
BLOCK DEVICE
UNPAIR DEVICE
CHANGE PERMISSIONS
CHANGE LOCATION
```

Якщо scanner загублено або його більше не можна використовувати:

```text
status = blocked
```

Після цього сервер не приймає критичні warehouse actions від цього `device_id` навіть якщо APK і локальні дані залишилися на фізичному пристрої.

---

## 8. Сервер як єдине джерело бізнес-рішень

Android Scanner не повинен самостійно реалізовувати фінальну складську істину.

Для кожної критичної операції сервер перевіряє щонайменше:
- device active/blocked;
- organization/location;
- user/device permissions;
- TEST/WORK environment;
- order status;
- product;
- RFID/EPC validity;
- duplicate rules;
- current stock status;
- remaining order demand;
- reservation/stage/dispatch rules;
- transaction consistency.

Тільки server response визначає фінальний результат.

Приклад:

```text
REQUEST:
TO_RAMP + order_id + EPC

SERVER RESPONSE:
SUCCESS
або
BLOCKED_ALREADY_STAGED
або
WRONG_PRODUCT
або
ORDER_COMPLETE
або
DEVICE_BLOCKED
```

---

## 9. Безпека Android app

У APK не повинні знаходитися:
- Supabase `service_role`;
- Admin code;
- приватні server secrets;
- довгоживучі універсальні production credentials.

Усі privileged operations виконуються server-side через захищений API / Edge Functions / RPC contract.

Device credential має бути:
- окремим для кожного scanner;
- відкличним server-side;
- не тотожним user password;
- по можливості захищеним Android Keystore / OS secure storage.

QR pairing token — одноразовий та короткоживучий.

---

## 10. Network / offline policy — початкова версія

На першому production етапі критичні зміни складу повинні вимагати server acknowledgement.

Тобто без мережі scanner може показати локальний UI або останній cache, але не повинен сам оголошувати успішним:
- ADD_TO_STOCK;
- TO_RAMP;
- DISPATCH;
- іншу critical stock mutation.

Причина: уникнути конфліктів між двома scanner, які одночасно працюють з тим самим RFID/order.

Майбутній offline write queue можливий лише після окремого idempotency/conflict-resolution protocol.

---

## 11. Audit

Кожна критична server action від Android Scanner повинна залишати audit context, де можливо:

```text
device_id
organization_id
location_id
user/session context
action
order_id
rfid/scanner_code
result
timestamp
app_version
```

Це дозволяє відповісти:
- який scanner зробив операцію;
- коли;
- для якого order;
- з яким RFID;
- який був результат.

---

## 12. Відношення до чинної Nordic production-системи

Android Scanner — новий окремий напрямок.

Він **не є дозволом переписувати**:
- frozen Nordic ID Til rampe V2.9.7;
- чинний WORK-default wrapper;
- Forlengere display PASS;
- інші production Nordic/scanner forms.

Поточна web/Nordic система залишається:
- робочим production reference;
- fallback;
- golden behavior reference для майбутнього Android implementation.

Новий Android flow має проходити окремі TEST / PHYSICAL PASS етапи до будь-якого production promotion.

---

## 13. Рекомендований перший Android етап

### V0.1 — DEVICE + RFID LAB
Без production stock writes.

Цілі:
1. встановити Florivo Scanner APK на Nordic ID HH85;
2. зареєструвати/спарити scanner через QR + APPROVE/control number;
3. отримати server-side `device_id`;
4. перевірити RFID capture;
5. передати безпечний TEST request на server;
6. отримати server response;
7. зафіксувати PHYSICAL PASS лише після реального тесту.

Після цього окремими етапами:
- TEST TIL LAGER;
- TEST TIL RAMPE;
- UT order integration;
- TEST dispatch;
- лише потім контрольований WORK pilot.

---

## 14. Коротка канонічна схема

```text
UT KONTOR
   │
   │ створює order + destination/customer data
   ▼
FLORIVO SERVER
   │
   ├── orders
   ├── stock
   ├── permissions
   ├── devices
   ├── audit
   │
   ▼
FLORIVO ANDROID SCANNER
   │
   ├── read RFID / QR / camera
   ├── send order_id + scan/action
   └── show server decision
```

Ключове правило:

> **Scanner повідомляє, що фізично сталося або що оператор хоче зробити. Сервер визначає, чи це дозволено, до якого замовлення/одержувача це належить і як змінюється склад.**

---

## 15. Статус на момент фіксації

Станом на 14.08.2026:
- це концептуальний протокол;
- Android APK ще не створено;
- pairing tables/API ще не створено;
- production Nordic/scanner code не змінювався;
- жодних WORK stock mutations цим протоколом не виконано.

Наступний технічний крок — лише після окремого рішення користувача про початок Android V0.1.
