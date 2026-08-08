# GREEN UT rollback point — 2026-08-08 21:07 Europe/Oslo

Purpose: restore the two GREEN UT forms to the exact state that existed before the Forlengere/LIVE TOTALS migration performed at 21:07.

## Original GREEN files saved here

- `backups/green_2026-08-08_2107/bestilling-green.html`
  - original blob SHA: `8eb6095ea4a8e599bef2e529b5a09d0bb407a6fc`
  - backup commit: `a442f5b6c466666589ecc30c24612102cbd47f01`

- `backups/green_2026-08-08_2107/utsending-green.html`
  - original blob SHA: `336ae483bc1a94d1faa0a90cc813110e39cd5292`
  - backup commit: `3ceaa8c4e73473451859555b36aacbfcbe29f7c6`

## Migration commits

- `10c0574c9bcedee582802bb6a4d2bb06889f0728` — add `green-ut-api.js`
- `070071c8a2237106b4970a971f2cc289fa05bd26` — GREEN UT Kontor: Forlengere + persisted LIVE TOTALS + isolated GREEN adapter
- `acee3a4f71267668a32f2a927ec904058b3671ad` — GREEN UT Lager: isolated Forlengere confirmation/execution flow

## What changed

Only the GREEN/private route was changed.

`bestilling-green.html` and `utsending-green.html` now use `green-ut-api.js` so both forms share the same isolated `ut_test_*` sandbox backend while validating the migration. Production writes are not enabled.

No production HTML page was edited by this migration.

## Fast rollback

To restore the previous GREEN state:

1. Replace current `bestilling-green.html` with the content of `backups/green_2026-08-08_2107/bestilling-green.html`.
2. Replace current `utsending-green.html` with the content of `backups/green_2026-08-08_2107/utsending-green.html`.
3. `green-ut-api.js` can then be left unused or deleted in a separate cleanup commit.

Do not roll these GREEN changes into production without explicit user approval.
