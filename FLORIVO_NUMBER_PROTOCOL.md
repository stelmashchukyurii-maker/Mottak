# FLORIVO NUMBER / RFID BINDING PROTOCOL

Status: ACTIVE RULE
Fixed: 2026-08-21 Europe/Oslo

## Purpose
Define the permanent internal Florivo item number separately from physical RFID/EPC tag identifiers.

## Canonical fields in `public.mottak_scans`
- `id` — technical UUID.
- `florivo_number` — permanent internal sequential Florivo number for newly registered item rows.
- `scanner_code` — full physical RFID/EPC when known.
- `lower_number` — last 6 characters of `scanner_code` only.
- `product` — product key.
- `registration_method` — how the item was originally put on stock.
- `is_test` — individual item TEST flag.
- legacy `environment` remains physically present until a separate audited migration.

## Do not overload lower_number
`lower_number` must keep one meaning only: the final 6 characters of the real long RFID/EPC.
Never store `florivo_number` in `lower_number`.

## New item without RFID
Android may register an item before any physical RFID has been scanned.
Example:
- `florivo_number = 327`
- display `F-000327`
- `scanner_code = ''`
- `lower_number = ''`
- `registration_method = 'android_button'`
- `stock_status = 'in_stock'`

This is a real stock item when process `mode='live'`.

## Later RFID binding
When a physical RFID is later read:
1. validate the long EPC;
2. identify the product;
3. choose the oldest/FIFO unbound Florivo row of the same product and same TEST/LIVE environment;
4. write full EPC to `scanner_code`;
5. write only its final 6 characters to `lower_number`;
6. never change `florivo_number`.

Binding must never cross product types.

Prepared RPC:
`florivo_terminal_bind_rfid_fifo(p_mode, p_product_key, p_scanner_code)`.

## Registration method
Allowed canonical values currently:
- `android_button`
- `rfid_scan`
- `camera`
- `manual_admin`
- `import`

`registration_method` records the original stock-registration route. Later RFID binding does not erase this fact.

## Quantity-only product
`forlengere_plast` remains quantity-only stock. Android +1 updates the quantity stock ledger and still receives a Florivo display number from the shared sequence/event flow, but it does not create a fake RFID row in `mottak_scans`.

## History
Old physical EPC and lower numbers are historical evidence and must not be deleted merely because the physical goods have left. Departure is represented by stock status/audit events.
