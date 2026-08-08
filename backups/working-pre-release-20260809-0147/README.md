# WORKING pre-release rollback snapshot

Created: 2026-08-09 01:47 Europe/Oslo
Purpose: rollback point before promoting the verified shared-database architecture to the WORKING program.

No warehouse rows are copied or modified by this snapshot. Git blob SHAs below identify the exact pre-release code.

## Entry pages
- index.html — `0189c009a1511e508653037425d630366e600563`
- inn.html — `01bda11ab3f0c3fc2f0480ad226d4d552a04cb1b`
- camera-live-v4.html — `5420baea29e2c4853ef0e5a8cc6e9fdc61544f12`
- camera-live-v414.html — `2120d9b468750bcec0cc8dad980799709a042ad2`
- mottak-live-v2.html — `d18126ca705765f0ec6d5bb7b8e429e2d7e2102a`
- mottak-live-v45.html — `4dbea359ccda069e94cb5f487564978b6531fb0b`
- bestilling.html — `5d20363803a5611979e39f0a94862cc099ec3946`
- utsending.html — `9d03261a0ecc3c5b8b82a6081d80e8b475d43518`

## Core release logic
- compact-stock-counter.js — `b65247be5c5656cbe765ac0fd195cb483cb8bfc3`
- compact-stock-counter-v2.js — `50903a87564c91e66513135ddee0e2473ee19e56`
- utsending-product-stock-v273.js — `52bf8ed4e407c6fae6c492851c1245a38f1a2b16`
- camera-current-stock-only.js — `46275b520c85ffcb827f084986431fbbdbb85182`
- stock-lifecycle-ui.js — `621f90090475807994112db1511ee8c32e63bbb0`
- camera-lower-only.js — `ff7c4534ec71dd3a87d781043ad4e7ce91b9c2a2`
- mottak-lower-only.js — `280ac45a2d3fa37e4f4577ce9bb9035c3f2b61c5`
- upper-number-policy.js — `dce570516e7d50147fe757113a4dec06b44091f8`

## GREEN / TEST isolation reference
- green-ut-api.js — `c7fa9e04e1d1b14a56ab308508847a1ccb861a48`
- ut-test-api.js — `f028bf3b051b40f985a0bc7659109db136637579`

## Production warehouse fingerprint before release
`mottak_scans` snapshot:
- total rows: 133
- verified in_stock: 17
- verified staged: 0
- verified dispatched: 116
- in_stock Bunner: 8
- in_stock Hyller x30: 7
- in_stock Hyller x60: 2
- data fingerprint: `006751ae4a9ede1b1632ffab365a7524`

The fingerprint covers id, lower_number, product, status, stock_status, photo_path, and ut_order_id ordered by id.
