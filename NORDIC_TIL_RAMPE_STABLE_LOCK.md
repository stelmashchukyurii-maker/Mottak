# Nordic ID – Til rampe · STABLE LOCK

**Офіційна назва форми:** `Nordic ID – Til rampe`  
**Stable version:** `V2.9.7`  
**Підтверджено користувачем:** 10.08.2026 20:14 Europe/Oslo  
**Протоколи повторно звірено:** 10.08.2026 20:37 Europe/Oslo  
**Stable entry:** `nordic-id-til-rampe-stable.html`  
**Frozen source commit:** `ed3a19b20efd9af0bf07bc4a079589b3b6038157`  
**Final stable-entry commit:** `f049f5c568dd592f64c8cfadbd416622e5c5fc9d`  
**Frozen source page:** `utsending-nordic-test.html`

## LOCK RULE

Ця форма вважається остаточною стабільною формою Nordic ID для операції **Til rampe**.

- `nordic-id-til-rampe-stable.html` не переписувати і не видаляти під час подальшої розробки.
- Stable entry відкриває повноекранно весь комплект коду з конкретного GitHub commit, а не з поточного `main`.
- Тому подальші зміни CURRENT/DEV-файлів не повинні змінювати поведінку цієї STABLE-форми.
- Усі нові експерименти виконувати в `utsending-nordic-test.html` або новій робочій копії.
- V2.4 `nordic-id-v24-stable.html` лишається історичним RFID rollback.
- V2.1 `nordic-id-v20-focus.html` лишається незмінною RFID diagnostic/test base.
- Історичні/DEV файли можна приховувати з `scanner-home.html`, але не видаляти з GitHub без окремого рішення.

## Підтверджений фізичний функціонал V2.9.7

- V2.4 hidden RFID input / Nordic Wedge engine;
- 24 HEX EPC + 600 ms lock;
- TEST / WORK перемикач в одній формі;
- RAMPE order progress: замовлено / виконано / залишилось / наступний товар;
- SMART FOCUS після відкриття RAMPE та після дій;
- TEST duplicate RFID flow;
- Bunner / Hyller x30 / Hyller x60 confirm flow;
- Forlengere korte / lange counts entered only at outgoing confirmation;
- INPUT LOCK під час введення кількостей;
- COUNT COMPACT: Полиці + Продовжувачі та ДОДАТИ/СКАСУВАТИ компактно для малого екрана Nordic;
- автоматичне повернення до інформативного місця після дії.

## WORK UNKNOWN RFID TAG CONTRACT

Це частина зафіксованої бізнес-логіки V2.9.7 / shared backend:

1. Якщо RFID EPC прочитаний і відповідний WORK stock row існує та доступний — використати існуючий запис.
2. Якщо stock row уже staged / недоступний — показати warning/block, не створювати дубль.
3. Якщо RFID EPC успішно прочитаний, але stock row відсутній — запропонувати:
   **оприбуткувати товар зараз і одразу продовжити на поточну RAMPE**.
4. При підтвердженні:
   - full EPC → `scanner_code`;
   - last 6 → `lower_number`;
   - після створення/оновлення stock row одразу продовжити outgoing flow.
5. Якщо RFID EPC взагалі не прочитаний — **не створювати фіктивний номер і не продовжувати як RFID item**.

**Статус на 10.08.2026:** реалізація та серверна логіка готові. Повний фізичний WORK end-to-end, включно з unknown-tag flow, ще має бути перевірений на реальному складі 11.08.2026. До цього тесту stable-файл не змінювати.

## SCANNER HOME VISIBILITY POLICY

Після очищення робочого екрана 10.08.2026 20:36 `scanner-home.html` показує лише:
- `📥 НА СКЛАД` — майбутня окрема Nordic INN / Mottak форма;
- `📤 TIL RAMPE` — ця STABLE V2.9.7.

DEV, V2.4 і V2.1 збережені в GitHub, але не показуються оператору на головному робочому екрані.

## Відновлення

Якщо stable entry випадково змінено або видалено, відновлювати його з GitHub history/commit `f049f5c568dd592f64c8cfadbd416622e5c5fc9d`, не збирати заново «по пам’яті».

Після відновлення обов'язково звірити:
- stable entry → frozen source commit `ed3a19b20efd9af0bf07bc4a079589b3b6038157`;
- назву `Nordic ID – Til rampe`;
- version `V2.9.7`;
- TEST/WORK switch;
- SMART FOCUS / INPUT LOCK / COUNT COMPACT;
- WORK unknown-tag contract вище.
