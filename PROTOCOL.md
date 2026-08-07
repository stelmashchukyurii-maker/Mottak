# BaMavaremottak — Project Protocol

## 07.08.2026 — Session archived at 22:54 Oslo time

### UT warehouse page
- Current working page: `utsending.html`
- Current version: **UT Lager v27.12 AVBRYT**
- Architecture remains lightweight/event-driven: no continuous MutationObserver loops and no periodic UI polling in the wrapper.
- Opening a RAMPE now auto-scrolls once to the opened active-ramp detail.
- Existing `ut-bulk.html` mass-selection workflow remains in use under the button **Masseskanning / Масове сканування**.
- Added red **Cancel order / Скасувати замовлення** button on an opened ramp.
- Cancellation uses `cancel_ut_order` and must return only goods that are still `reserved` or `staged` on the ramp.
- Goods already `dispatched` must never be returned by order cancellation.
- Cancelled orders remain in history; they are not deleted.

### Stock rule
Stock is the set of verified non-test rows with `stock_status = in_stock`.
Test labels (`is_test = true`) must not be counted as warehouse stock.

Final intentional stock baseline after cleanup on 07.08.2026:

**Bunner — 8**
- 0354F6
- 09B982
- 135991
- 19A34B
- 2A7B6C
- 2E9147
- 311C3F
- 3450AC

**Hyller x30 — 7**
- 14FB7E
- 16CB03
- 2048A3
- 297DC4
- 31B80A
- 41B256
- 491CAE

**Hyller x60 — 2**
- 09FA9F
- 15B8A1

Total intentional warehouse baseline: **17 items = 8 B + 7 Hx30 + 2 Hx60**.
All other rows that had still been `in_stock` during cleanup were moved to `dispatched`.

### Main menu
- Main page currently uses the v18 family.
- Added pin-removal protection: **PIN-LÅS**.
- Adding a bookmark/pin remains easy.
- Removing an existing pin is blocked by default.
- User unlocks pin editing for 60 seconds; it then relocks automatically.

### Operational rule for future tests
- `in_stock` = physically available warehouse stock.
- `reserved` = assigned to an order, not yet on ramp.
- `staged` = physically on ramp / ready for dispatch.
- `dispatched` = already written off / sent; do not return it when cancelling a ramp.
- Cancelling an active order returns only `reserved` and `staged` rows to `in_stock`.
- Keep test labels excluded from real stock.

### Session closure marker
🧱 Conversation/session archived by user request.
