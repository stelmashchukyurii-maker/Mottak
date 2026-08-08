# GREEN unified available-stock rollback

Created 08.08.2026 kl. 22:35 Europe/Oslo before changing GREEN Camera / UT Lager availability display.

Production is not part of this change.

## Current pre-change blobs
- `camera-green.html`: `660f03f77e2c74ae4058d91c1c14a2333cfe3288`
- `utsending-green.html`: `c8e46a4b149fbb82c32628b4034489c4461f2ab3`
- Camera pre-change copy: `backups/green_2026-08-08_2235_available/camera-green.html`

To rollback, restore the two wrapper files to the blob SHAs above and stop loading `green-legacy-available-stock.js`.

The intended new rule is identical to the existing GREEN UT Kontor rule:
`available = in_stock - max(0, active_order_quantity - already_reserved_or_staged_for_that_order)`.
Only legacy balanced products participate: `bunner`, `hyller30`, `hyller60`. Forlengere products never reduce this warehouse balance.
