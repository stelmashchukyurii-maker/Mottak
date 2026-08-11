# BaMavaremottak — Project Protocol

**Оновлено:** 11.08.2026 08:26 Europe/Oslo

## CURRENT PRIORITY — 8-product warehouse / Nordic Til lager

### Frozen outgoing stable
`Nordic ID – Til rampe · STABLE V2.9.7`
- entry `nordic-id-til-rampe-stable.html`
- frozen source `ed3a19b20efd9af0bf07bc4a079589b3b6038157`
- stable entry `f049f5c568dd592f64c8cfadbd416622e5c5fc9d`
- do not overwrite/delete.

### Scanner home
- `📥 TIL LAGER` → `nordic-id-til-lager-v103.html` → DEV V1.0.3.
- `📤 TIL RAMPE` → frozen stable V2.9.7.

### Products
RFID:
`bunner`, `hyller30`, `hyller60`, `forlengere_korte`, `forlengere_lange`, `vrak_bunner`, `vrak_hyller`.

No RFID:
`forlengere_plast`.

Rules:
- Vrak bunner stack = 10.
- Vrak hyller stack = 30.
- all products can go to RAMPE.
- short/long counts only at outgoing.
- plastic = quantity-only stock, no fake RFID.

### Canonical stock counters
Server RPC: `bama_stock_summary()`.

Counter 1 = physical warehouse (`in_stock`).
Counter 2 = physical warehouse minus still-unfulfilled active ramp orders.

User-required behavior:
- order create/edit changes counter 2 immediately;
- staging does not double-subtract because physical and remaining demand move together.

Shared UI module:
`stock-summary-8-v1.js`.
Used in current Camera v4.29, UT Kontor v37, Til lager V1.0.3.
These current UI versions still require physical/browser confirmation.

### Plastic quantity stock
Tables:
- `mottak_quantity_stock`
- `mottak_quantity_stock_events`

Manual receipt RPC:
`receive_mottak_quantity_stock(text,integer,text)`.

Lifecycle server PASS:
- order reserves availability;
- stage deducts physical boxes;
- cancel restores undispatched boxes;
- operational edit restores/resets;
- non-operational edit preserves staged stock.

Camera v4.29 contains phone manual plastic receipt UI.

### Vrak outgoing
Server PASS:
- Vrak Nordic scan/stage/dispatch full transactional cycle passes.
- `bama_order_product_progress(uuid)` exposes all product progress.

Frozen V2.9.7 progress UI predates Vrak. Server blocks false completion, but a separate outgoing DEV is required for correct visual Vrak progress. Stable remains untouched.

### Camera
Last physical PASS rollback:
- v4.25 LOWER RESET
- v4.26 AUTO SAVE FOCUS

Current unconfirmed v4.29:
- short/long/Vrak Camera fallback;
- two 8-product counters;
- manual plastic receipt.

### UT Kontor
Preserve existing layout/behavior.
Current unconfirmed WORKING v37:
- forced Norwegian startup;
- 8 product cards;
- two 8-product counters;
- immediate stock-summary refresh after order save/load.

### TEST / WORK
Shared tables separated by `environment=test/work`.
TEST duplicate RFID allowed; WORK duplicate protection retained.

### Protocol sources
Before Nordic work read:
1. `NEXT_CHAT_NORDIC_ID.txt`
2. `NORDIC_ID_RFID_PROTOCOL.md`
3. `NORDIC_ID_PROGRESS_LOG.md`
4. `NORDIC_TIL_LAGER_DEV_PROTOCOL.md`
5. `NORDIC_TIL_RAMPE_STABLE_LOCK.md` if stable is involved.

### Next physical checks
1. Til lager V1.0.3 TEST counters + WORK hold.
2. Camera v4.29 8 counters + plastic manual receipt UI.
3. UT Kontor v37 Norwegian + 8 products/counters.
4. Separate outgoing DEV for Vrak progress.

---

## 07.08.2026 — Historical session archive
Historical stock and old UT behavior remain documented in older protocol files. Do not use old numerical baselines as current stock; query Supabase.

Lifecycle retained:
- `in_stock` = physical warehouse;
- `staged` = physically on ramp;
- `dispatched` = sent/written off;
- cancellation must never resurrect dispatched goods.
