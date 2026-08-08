# BLUE — UT Kontor v28 stable snapshot

- Date: 08.08.2026
- Time: 14:47 Europe/Oslo
- Production file: `bestilling.html`
- Stable visible version: `UT Kontor v28 SALDO-RAMPER`
- Blob SHA: `b5ed540870bed3efc85a1cc8a05e143fedab0b20`
- Status: BLUE / current stable / DO NOT MODIFY during GREEN validation

## Recovery rule
If GREEN validation fails, keep or restore `bestilling.html` from blob SHA above. BLUE users must continue using `bestilling.html` until explicit cutover approval.

## GREEN parallel files
- `green-home.html`
- `bestilling-green.html`
- `camera-green.html`
- `utsending-green.html`

GREEN is isolated from BLUE user navigation. At this stage GREEN routes use the isolated UT test data adapter while UI/code is validated. Production-compatible `ut_order_items` and `save_ut_order_with_items` have already been added additively; old BLUE pages do not depend on them.