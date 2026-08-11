# Nordic ID RFID — ПОСТІЙНИЙ ЖУРНАЛ УСПІШНОГО ПРОГРЕСУ

**Проєкт:** BaMavaremottak / AI Scanner Mottak  
**Створено:** 09.08.2026 19:43:37 Europe/Oslo  
**Оновлено:** 11.08.2026 22:43 Europe/Oslo

## Правило журналу
У цей файл записуємо **тільки підтверджені успішні/завершені кроки**. Тимчасові помилки, невдалі спроби, гіпотези та відкриті задачі сюди не додаємо.

Google Drive Nordic ID відео/фото:
`https://drive.google.com/drive/folders/1Xf5puBas4GUveaJqhhuYLNdJcEw_Myo5`

Historical detailed snapshot:
`NORDIC_ID_RFID_PROTOCOL_ARCHIVE_2026-08-09.md`

---

# 09.08.2026 — ПІДТВЕРДЖЕНІ КРОКИ

## PASS — V2.1 FIRST TAG LOCK
Фізичний Nordic ID підтвердив:
- 24-char EPC приймається як перший валідний тег;
- 600 ms lock прибирає повторний прийом одного trigger-cycle;
- цикл READY → ACCEPT/LOCK → READY стабільний;
- Wedge/hidden text receiver працює без `inputmode=none`.

V2.1 залишається diagnostic rollback.

## PASS — V2.2 PRODUCT TEST
Підтверджено:
- product selection;
- full EPC → `scanner_code`;
- last 6 → `lower_number`;
- TEST rows isolated from production;
- повторний TEST EPC дозволений.

## PASS — V2.2.1 KEYBOARD GUARD
Підтверджено на Nordic:
- кнопковий вибір продукту не відкриває soft keyboard;
- RFID receiver залишається `type=text` для Wedge compatibility.

## PASS — V2.3.4 CONFIRM & SAVE + EXTENSION COUNTS
Підтверджено:
- scan → великий confirm → save;
- Bunner/H30/H60 без ручних count-полів;
- Forlengere korte/lange мають `hyller_count` + `forlengere_count`;
- full EPC і lower 6 зберігаються правильно.

## PASS — V2.4 HIDDEN RFID INPUT
Підтверджено фізично:
- видиме RFID технічне поле прибране;
- hidden Wedge receiver продовжує працювати;
- confirm/save flow збережено;
- V2.4 зафіксована як historical stable RFID base.

---

# 10.08.2026 — ПІДТВЕРДЖЕНІ КРОКИ

## SERVER PASS — SHARED TEST / WORK ENVIRONMENT
Підтверджено shared tables з `environment=test/work`:
- `mottak_scans`
- `ut_orders`
- `ut_order_items`
- `ut_order_scans`
- `ut_extra_confirmations`
- `mottak_stock_events`

TEST duplicate EPC allowed; WORK duplicate protected; cross-environment mixing blocked.

## PASS — WORK UNKNOWN RFID BUSINESS CONTRACT IMPLEMENTED
Зафіксовано:
- existing available WORK RFID → reuse;
- staged/unavailable → block/warn;
- EPC read but missing stock row → register now + continue RAMPE;
- no EPC read → never invent RFID.

## PASS — Nordic ID – Til rampe V2.9.7 FINAL APPLICATION
Фізично підтверджено й заморожено outgoing application logic.

Frozen source:
`utsending-nordic-test.html` at commit
`ed3a19b20efd9af0bf07bc4a079589b3b6038157`

Confirmed behavior:
- V2.4 hidden RFID engine;
- 24 HEX EPC;
- 600 ms lock;
- TEST / WORK;
- SMART FOCUS;
- ordered / done / remaining / next;
- normal Bunner/H30/H60 confirm;
- Forlengere count entry only at outgoing;
- INPUT LOCK;
- COUNT COMPACT;
- auto-return to RAMPE progress.

## PASS — SCANNER HOME CLEAN OPERATOR VIEW
Робочий Nordic home був очищений до двох операцій:
- TIL LAGER
- TIL RAMPE

Historical test/rollback pages залишені в GitHub, але приховані від operator home.

## PASS — Camera v4.25 LOWER RESET
Фізично підтверджено:
- lower_number не губиться;
- UI після save більше не зависає в processing;
- після save повертається до наступного фото.

## PASS — Camera v4.26 AUTO SAVE FOCUS
Фізично підтверджено:
- після OCR/recognition сторінка веде до Save;
- Save підсвічується/фокусується;
- v4.25 post-save flow збережено.

## SERVER PASS — VRAK PRODUCT MODEL
Підтверджено:
- RFID мають Vrak bunner і Vrak hyller;
- Vrak bunner = 10 per RFID stack;
- Vrak hyller = 30 per RFID stack;
- WORK duplicate protection працює;
- TEST duplicate EPC працює;
- production constraints підтримують Vrak.

---

# 11.08.2026 — ПІДТВЕРДЖЕНІ КРОКИ

## SERVER PASS — 8-PRODUCT TWO-COUNTER STOCK MODEL
RPC:
`public.bama_stock_summary()`

Підтверджено правило:
1. physical = фактично на складі;
2. available = physical − невиконана частина активних RAMPE orders;
3. order create/edit змінює available одразу;
4. staging не віднімає товар вдруге.

## SERVER PASS — VRAK FULL OUTGOING LIFECYCLE
Transactional cycle:
`Vrak order → Nordic → staged → dispatched`
пройшов успішно.

Server validates Vrak at stage/dispatch and exposes all-product progress through:
`bama_order_product_progress(uuid)`.

## SERVER PASS — FORLENGERE PLAST QUANTITY STOCK
Підтверджено quantity-only architecture:
- reservation;
- stage decrement;
- cancel restore;
- operational edit restore/reset;
- no fake RFID.

## PASS — WORK OLD-STOCK BASELINE RESET
User confirmed that all old WORK stock still shown in system had already physically shipped manually.

Exact correction:
- 35 `environment='work'`, `verified`, `in_stock` RFID rows → `dispatched`;
- audit event per row;
- marker `created_by='chatgpt_admin_bulk_2026-08-11'`;
- TEST untouched.

Canonical milestone:
`WORK_STOCK_BASELINE_RESET_2026-08-11.md`

This zero state was a historical baseline only; new real stock was received afterward.

## PHYSICAL WORK PASS — REAL NORDIC INCOMING RFID WRITES
Real WORK database contains physically generated Nordic ID receipt rows with:
- `source='nordic_id'`;
- `device_id='NORDIC-ID'`;
- full RFID EPC in `scanner_code`;
- lower 6 in `lower_number`;
- `environment='work'`;
- `status='verified'`;
- `stock_status='in_stock'`.

Confirmed real incoming products include Bunner, Hyller x60 and Vrak hyller.

This proves the actual Nordic incoming RFID write path works in WORK. It does not by itself certify the later V1.0.4 startup wrapper UI.

## PASS — MANUAL WORK RECEIPT 3 × HYLLER x30
Manually received:
- `000012`
- `000013`
- `000014`

Contract:
- source manual;
- scanner_code empty;
- verified/in_stock;
- no fake EPC.

## PASS — TIL RAMPE DELIVERY PATH ON NORDIC
Direct jsDelivr navigation had displayed HTML source text on the Nordic browser. Operational local loader was introduced while keeping frozen V2.9.7 source pinned.

Physical Nordic later opened the normal outgoing form instead of source text.

## PHYSICAL PASS — TIL RAMPE WORK DEFAULT
User requested WORK to be default because switching on Nordic was inconvenient.

Current operator entry:
`nordic-id-til-rampe-work-default.html`

Physical photo confirmed:
- WORK active immediately;
- RAMPE 28 opens in WORK;
- no hold is required before normal work.

## PHYSICAL PARTIAL PASS — RAMPE 28 REAL WORK TRIAL
Order:
`34113828-6904-4254-bc85-7c2cd8e8bbd1`

Physical Nordic screenshot confirmed partial completion:
- Bunner 1/1;
- Forlengere korte 1/1;
- Forlengere lange 1/1.

Database evidence:
- one Bunner `ut_order_scans` row;
- korte confirmation = 15 hyller + 150 forlengere;
- lange confirmation = 15 hyller + 150 forlengere.

The trial was later cancelled/released; all ramp inventory returned and current on-ramp became 0.

## PHYSICAL PASS — FORLENGERE `NNN stk.` DISPLAY
User observed phone view showed e.g. `1 vogn · 150 stk.` while Nordic showed only `1 / 1`.

Display-only module:
`nordic-til-rampe-extension-count-display-v1.js`

It reads actual `forlengere_count` from `ut_extra_progress`, does not hardcode 150, and does not write/change RFID/outgoing logic.

At session close user explicitly confirmed:
**“Продовжувачі готові.”**

Therefore the actual Forlengere piece-count line on Nordic is accepted as **PHYSICAL PASS**.

Dedicated record:
`NORDIC_TIL_RAMPE_EXTENSION_COUNT_DISPLAY_2026-08-11.md`

---

# ACCEPTED OPERATIONAL STATE AT 11.08.2026 22:43

Confirmed production-facing outgoing path:
`scanner-home.html` → `📤 TIL RAMPE · WORK` → frozen V2.9.7 WORK-default wrapper + accepted Forlengere display overlay.

Confirmed core database architecture:
- shared TEST/WORK environment separation;
- WORK real RFID intake rows;
- unified 8-product two-counter summary;
- Vrak server lifecycle;
- plastic quantity lifecycle.

Current archive snapshot stock at 22:43 Europe/Oslo:
- Bunner 25
- Hyller x30 3
- Hyller x60 20
- Forlengere korte 4
- Forlengere lange 4
- Forlengere plast 0
- Vrak bunner 0
- Vrak hyller 2
- on-ramp 0 / order_remaining 0 for all 8.

This stock list is only an archive-time snapshot. Future answers must query live DB.

Open/unconfirmed work is intentionally not recorded as PASS here and is tracked in handoff/DEV protocols.

Session archive:
`NORDIC_SESSION_ARCHIVE_2026-08-11_2243.md`
