# FLORIVO Android v0.7 — ROLE + ANTALL + AUTO LOGOUT

Date: 2026-08-21
Branch: `florivo-v07-role-quantity-autologout`

## Fixed behaviour

- NFC card resolves a Florivo user from the server.
- `lager` role: no manual quantity field; every product press registers quantity 1.
- `produksjon` and `admin` roles: show `ANTALL`; accepted range 1–500.
- Quantity greater than 1 is enforced server-side for roles `produksjon` and `admin` only.
- Bulk registration creates the requested stock quantity and one audit event with the batch quantity.
- For row-based stock products, each physical unit gets its own Florivo number; the UI shows the first–last F-number range for bulk registrations.
- `forlengere_plast` remains quantity-stock based and is incremented by the entered amount.

## Auto logout

After each successful registration:
1. confirmation overlay is shown for 8 seconds;
2. overlay closes and a 4-second grace window starts;
3. if no new product is selected during the 4 seconds, the session logs out to `VENTER PÅ KORT`;
4. if a new product is selected during the grace window, the old logout timer is cancelled and the cycle restarts after the next successful registration.

Manual `BYTT` remains available for immediate logout.

## Server RPC

`public.florivo_terminal_register_stock_qty(...)`

- validates mode/product/quantity;
- requires active Florivo user;
- rejects quantity >1 for roles other than `produksjon` and `admin`;
- stores user/role/quantity audit metadata.
