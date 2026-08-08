# GREEN mirror rollback — 2026-08-08 21:31 Europe/Oslo

Purpose: exact rollback point before routing the `/green/` mirror forms to the isolated canonical GREEN forms.

## Before change

- `green/bestilling.html`
  - blob SHA: `b5ed540870bed3efc85a1cc8a05e143fedab0b20`
- `green/utsending.html`
  - blob SHA: `359dd191d3da01a24da26ee3ecb2d252313e22aa`

These blobs are the versions visible in the user's screenshots with the GREEN `ARBEIDSKOPI · PROD-DATA` marker and `UT Lager v27.12 AVBRYT`.

## Routing change

The mirror files now redirect to:

- `../bestilling-green.html`
- `../utsending-green.html`

This keeps the visible `/green/` entry route but moves order/warehouse work to the isolated GREEN pair with `green-ut-api.js` and Forlengere confirmation support.

## Production safety

No production database rows, production RPCs, production tables, or production HTML files were modified by this routing change.

To roll back, restore the two files from the blob SHAs above (or revert the corresponding commits).
