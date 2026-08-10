# Nordic ID – Til rampe · STABLE LOCK

**Офіційна назва форми:** `Nordic ID – Til rampe`  
**Stable version:** `V2.9.7`  
**Підтверджено користувачем:** 10.08.2026 20:14 Europe/Oslo  
**Stable entry:** `nordic-id-til-rampe-stable.html`  
**Frozen source commit:** `ed3a19b20efd9af0bf07bc4a079589b3b6038157`  
**Frozen source page:** `utsending-nordic-test.html`

## LOCK RULE

Ця форма вважається остаточною стабільною формою Nordic ID для операції **Til rampe**.

- `nordic-id-til-rampe-stable.html` не переписувати і не видаляти під час подальшої розробки.
- Stable entry завантажує весь комплект коду з конкретного GitHub commit, а не з поточного `main`.
- Тому подальші зміни CURRENT/DEV-файлів не повинні змінювати поведінку цієї STABLE-форми.
- Усі нові експерименти виконувати в `utsending-nordic-test.html` або новій робочій копії.
- V2.4 `nordic-id-v24-stable.html` лишається історичним RFID rollback.
- V2.1 `nordic-id-v20-focus.html` лишається незмінною RFID diagnostic/test base.

## Підтверджений функціонал V2.9.7

- V2.4 hidden RFID input / Nordic Wedge engine;
- 24 HEX EPC + 600 ms lock;
- TEST / WORK перемикач;
- RAMPE order progress: замовлено / виконано / залишилось / наступний товар;
- SMART FOCUS після відкриття RAMPE та після дій;
- TEST duplicate RFID flow;
- Bunner / Hyller x30 / Hyller x60 confirm flow;
- Forlengere korte / lange counts entered only at outgoing confirmation;
- INPUT LOCK під час введення кількостей;
- COUNT COMPACT: Полиці + Продовжувачі та ДОДАТИ/СКАСУВАТИ компактно для малого екрана Nordic;
- автоматичне повернення до інформативного місця після дії.

## Відновлення

Якщо stable entry випадково змінено або видалено, відновлювати його з GitHub history/commit `aaad7d7b3133c1df2a0eb87eb1840b18b1dc0553`, не збирати заново «по пам’яті».
