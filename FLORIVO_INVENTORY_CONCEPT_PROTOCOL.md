# Florivo Inventory / Inventering — ACTIVE DEV PROTOCOL

**Проєкт:** Florivo / BaMavaremottak  
**Оновлено:** 24.08.2026 Europe/Oslo  
**Статус:** ACTIVE DEV · V0.12 SERVER-SYNC TEST · NO AUTOMATIC LIVE MUTATION  
**Поточний scanner/manual entry:** `florivo-inventory-v012-dev.html`  
**Поточний PC/web entry:** `florivo-inventeringer.html`

> Inventering фіксує фізичну реальність складу окремо від production stock. Поточний V0.12 вже синхронізує TEST-session через Supabase, але завершення інвентаризації НЕ виправляє LIVE/WORK stock автоматично.

## 0. Canonical dependencies
Перед змінами читати:
1. `PROJECT_CANONICAL_RULES.md`
2. `BAMAVAREMOTTAK_TEST_LIVE_PROTOCOL.md`
3. `PROTOCOLS.md`
4. цей файл
5. `NEXT_CHAT_FLORIVO_INVENTORY.txt`
6. `FLORIVO_NUMBER_PROTOCOL.md`
7. `NORDIC_ID_RFID_PROTOCOL.md` лише для RFID/Wedge behavior
8. `FLORIVO_ACTIVE_STATE_AUDIT_2026-08-24.md`

New Inventory process/session semantics use `mode='test'|'live'`. Current V0.12 client remains hard-wired to `mode='test'` until explicit promotion.

## 1. Purpose
Inventory creates an independent physical snapshot:

```text
SERVER EXPECTED
      ↕
PHYSICAL REALITY
```

During counting Inventory must not silently:
- add/remove LIVE stock;
- alter production `stock_status`;
- stage/dispatch an order;
- fabricate RFID/EPC/lower numbers;
- rewrite frozen Nordic production logic.

Future discrepancy resolution is a separate audited human-approved action.

## 2. Current active files
Current scanner/manual path:
- `florivo-inventory-v012-dev.html` — V0.12 server-sync bridge + active working client.
- `florivo-inventory-v012-ui.html` — V0.12 UI loaded inside the bridge.

Compatibility entry:
- `florivo-inventory-sync.html` currently redirects to `florivo-inventory-v012-dev.html`.

PC/web:
- `florivo-inventeringer.html` — same server session, visual map, table and printable A4 report.

Rollback/history only:
- `florivo-inventory-test-v011-stable.html` — frozen V0.11 rollback copy.
- old V0.11/local-only text must not be treated as current architecture.

`scanner-home.html` currently links directly to V0.12 and to the PC/web Inventory page.

## 3. Current server synchronization — IMPLEMENTED
Supabase table:
`public.florivo_inventory_events`

Current model is append-only snapshot events, not yet normalized sessions/items tables.

After a meaningful local change, the scanner/client writes a full session snapshot with:
- `session_id`
- `mode='test'`
- `source='florivo-inventory'`
- `event_type='snapshot'`
- `payload` = current inventory session

Verified current DB security:
- RLS enabled;
- anon/authenticated SELECT policy exists;
- anon/authenticated INSERT policy exists;
- no UPDATE policy;
- no DELETE policy.

Current synchronization behavior:
- localStorage remains cache/fallback;
- at bootstrap local and server state are reconciled;
- the client pushes changed snapshots;
- server-first/current-session reconciliation merges same-session records/zones;
- PC/web polls latest server snapshot approximately every 2.5 seconds;
- current shared session therefore appears across phone/scanner/PC when network is available.

This snapshot-event model is the current implementation. A normalized sessions/observations schema is a future option only if concurrency/multi-scanner requirements justify it.

## 4. Current zones — IMPLEMENTED
Current zone set used by active V0.12 scanner and PC page:
- `Plukk`
- `Varm`
- `Kald`
- `Demontering`
- `Produksjon`
- `CC`

Ramps `28–34` are visual orientation references on the PC map and follow UT Kontor ramp numbering. They are not separate current Inventory count zones unless explicitly added later.

Every count/scan/manual record belongs to a zone.

Zone workflow supports:
- not started / in progress / completed states;
- `FULLFØR` for a zone;
- `RECOUNT` of a completed zone;
- revision history semantics rather than silently replacing another zone.

## 5. Current scanner/manual UX — IMPLEMENTED
Current V0.12 includes:
- Norsk + Українська;
- visual/table zone selection;
- current zone shown while counting;
- remembered current product/mode;
- Nordic ID RFID Wedge path;
- duplicate RFID protection within the session;
- manual `MAN-xxx` path;
- simulated RFID path for non-Nordic testing;
- compact journal/counters;
- zone complete/recount behavior;
- manual batch observation for repeated physical layouts.

Manual batch example:
`50 Bunner × 3 Hyller = 150 Hyller` may be recorded as one manual observation.

Critical identity rule:
- batch/manual counting must never fabricate EPC or `lower_number`;
- real RFID observations retain individual RFID identity.

## 6. Physical observation, not permanent historical product truth
Inventory records what is physically present now. Historical `hyller30/hyller60/...` identity must not force a false physical count.

If server history and physical observation differ, record the physical fact and later classify the difference as AVVIK; do not silently mutate production stock during counting.

## 7. RFID / number identity — ACTIVE RULE
- `scanner_code` = full real EPC.
- `lower_number` = last 6 chars of that real EPC only.
- `florivo_number` = separate permanent internal Florivo number.
- `MAN-xxx` = inventory-only manual observation identity, never an RFID/lower value.
- no RFID read = no invented EPC/lower.

If a physically printed tag number is proven to be distinct from both `lower_number` and `florivo_number`, create a dedicated field later; do not overload existing identity fields.

## 8. Duplicate / recount behavior
The same real EPC must not silently count twice in one Inventory session.

A repeated scan should point to the prior record/zone/revision. Recount changes are revision/history operations, not duplicate physical observations and not silent overwrite of unrelated zones.

## 9. PC page `INVENTERINGER` — IMPLEMENTED CURRENT BASE
`florivo-inventeringer.html` currently provides:
- visual warehouse map with current six zones;
- ramp orientation 28–34;
- per-zone current statistics;
- table view;
- recent records;
- server synchronization state;
- link back to scanner/manual Inventory;
- printable A4 report;
- detailed registrations in the report;
- signature fields for performed/checked/date.

This is current implemented reporting base. Full historical inventory-browser and full discrepancy dashboard are future work.

## 10. Session completion
Completing a zone or the overall Inventory session preserves the observation history.

Critical rule:
`AVSLUTT INVENTERING` must never silently correct LIVE/WORK stock.

Any later correction must be a separate reviewed/audited workflow.

## 11. SERVER EXPECTED <-> FAKTISK / AVVIK — NEXT ACTIVE DEVELOPMENT
Not yet claim as implemented production behavior.

Target categories include:
- `MANGLER`
- `FUNNET MEN IKKE FORVENTET`
- `UKJENT RFID`
- `MANUELT TELT`
- `FEIL ANTALL`
- zone-specific discrepancies/recount history

Before implementing correction, first build read/compare/report behavior. LIVE correction is a separate later authorization.

## 12. Physical PASS boundary
Current server-sync implementation is ACTIVE DEV / TEST.

Do not call full Inventory flow PHYSICAL PASS until an explicit real test confirms at least:
1. phone/Nordic enters records;
2. PC sees the same server session/records;
3. duplicate/recount behavior works physically;
4. no unrelated WORK stock/order values change;
5. full Nordic RFID path works against the current V0.12 entry.

## 13. Next sequence
1. controlled phone/scanner <-> PC synchronization test;
2. full Nordic physical RFID verification on current V0.12;
3. inventory history/session list on PC;
4. SERVER EXPECTED <-> FAKTISK / AVVIK;
5. normalized DB model only if concurrency requires it;
6. separate audited LIVE correction flow after explicit review.

## 14. Frozen isolation
Inventory changes must not rewrite frozen Nordic TIL RAMPE/TIL LAGER production behavior. Reuse verified RFID facts and server semantics without altering those WORK flows as a side effect.
