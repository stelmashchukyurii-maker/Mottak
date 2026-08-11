# BaMavaremottak — Project Protocol

**Оновлено:** 11.08.2026 08:32 Europe/Oslo

## CURRENT PRIORITY — 8-product warehouse / Nordic Til lager

### Frozen outgoing stable
`Nordic ID – Til rampe · STABLE V2.9.7`
- `nordic-id-til-rampe-stable.html`
- frozen source `ed3a19b20efd9af0bf07bc4a079589b3b6038157`
- do not overwrite/delete/repoint.

Separate unconfirmed outgoing DEV:
- `nordic-id-til-rampe-v298-dev.html`
- `NORDIC_TIL_RAMPE_V298_DEV_PROTOCOL.md`
- all-product/Vrak visual progress only;
- not linked from scanner home.

### Scanner home
- `📥 TIL LAGER` → V1.0.3 DEV.
- `📤 TIL RAMPE` → frozen V2.9.7 stable.

### Products
RFID: bunner, hyller30, hyller60, forlengere_korte, forlengere_lange, vrak_bunner, vrak_hyller.
No RFID: forlengere_plast.
Vrak bunner = 10/stack; Vrak hyller = 30/stack; all products may go to RAMPE; short/long counts only outgoing.

### Canonical stock model
RPC `bama_stock_summary()`.
- counter 1 = physical `in_stock`;
- counter 2 = physical minus still-unfulfilled active ramp orders;
- order create/edit changes counter 2 immediately;
- staging does not double-subtract.

Shared frontend: `stock-summary-8-v1.js`.
Current unconfirmed consumers:
- Camera v4.29
- UT Kontor v37
- Til lager V1.0.3

### Plastic quantity stock
Tables `mottak_quantity_stock`, `mottak_quantity_stock_events`.
Manual receipt RPC `receive_mottak_quantity_stock(text,integer,text)`.
Order lifecycle reservation/stage/cancel/edit tested transactionally.
Current Camera v4.29 contains manual plastic receipt UI without fake RFID.

### Vrak outgoing
Server full cycle PASS.
`bama_order_product_progress(uuid)` provides all-product progress.
Frozen V2.9.7 UI predates Vrak, so separate V2.9.8 DEV exists; server blocks false completion on old stable.

### Camera
Physical rollback PASS: v4.25, v4.26.
Current v4.29 unconfirmed: short/long/Vrak fallback + two 8-product counters + plastic manual receipt.

### UT Kontor
Preserve existing layout/behavior.
Current v37 unconfirmed: Norwegian + 8 products + two counters + immediate refresh after order save/load.

### Til lager
Current V1.0.3 unconfirmed full wrapper.
Base TEST RFID writes physically evidenced; V1.0.3 counters/WORK hold need confirmation.

### Protocols
Read in order:
1. `NEXT_CHAT_NORDIC_ID.txt`
2. `NORDIC_ID_RFID_PROTOCOL.md`
3. `NORDIC_ID_PROGRESS_LOG.md`
4. `NORDIC_TIL_LAGER_DEV_PROTOCOL.md`
5. `NORDIC_TIL_RAMPE_V298_DEV_PROTOCOL.md` when testing outgoing DEV
6. `NORDIC_TIL_RAMPE_STABLE_LOCK.md` for stable/recovery.

### Next physical checks
1. Til lager V1.0.3 counters + WORK hold.
2. Camera v4.29 counters + plastic panel.
3. UT Kontor v37 Norwegian + 8 products/counters.
4. V2.9.8 DEV with TEST Vrak order.

Historical protocols remain archives. Current stock values must always come from live DB, not old baselines.
