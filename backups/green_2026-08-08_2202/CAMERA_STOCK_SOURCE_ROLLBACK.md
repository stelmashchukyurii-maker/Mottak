# GREEN Camera stock source rollback — 2026-08-08 22:02 Europe/Oslo

Scope: GREEN only. Production files/data were not changed.

Before this fix:
- `camera-green.html` blob SHA: `5e10829f58c88c45ec47c24550927da2a5e00e90`
- Camera GREEN loaded `shared-stock-status.js` without `green-ut-api.js`.
- Therefore the stock widget read production `mottak_scans`.
- The legacy card showed `physical = in_stock + reserved + staged`, so staging a ramp did not reduce that card.

Rollback:
1. Restore `camera-green.html` from blob SHA `5e10829f58c88c45ec47c24550927da2a5e00e90`.
2. Remove/ignore `camera-green-available-stock.js`.

Expected fixed GREEN behavior:
- shared stock requests are routed through `green-ut-api.js` to `ut_test_stock`.
- the top legacy stock card displays AVAILABLE / UTEN RAMPE (`in_stock`) rather than physical including staged rows.
