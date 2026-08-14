# FLORIVO PRESENTATION VISIT PROTOCOL

Status: ACTIVE after deployment of `presentasjon-hovedmeny.html` analytics change.
Created: 14.08.2026, Europe/Oslo.
Project: Florivo / repository `stelmashchukyurii-maker/Mottak`.
Supabase project ref: `hzjsatehehhpgpskckfi`.

## 1. Purpose

Keep a private journal of visits to the Florivo presentation landing page and clicks from that page:

- page: `presentasjon-hovedmeny.html`
- page key in database: `presentasjon-hovedmeny`
- nothing about the counter/statistics is shown to visitors on the presentation page
- statistics are checked on request from live Supabase or via the unlinked internal page `florivo-besok-oversikt.html`

This analytics module is isolated from Nordic ID, WORK/TEST, stock, orders and dispatch logic.

## 2. Database objects

### Visit journal

Table:

`public.florivo_presentation_visits`

Columns:

- `id bigint` — internal event ID
- `page_key text` — currently `presentasjon-hovedmeny`
- `visitor_id uuid` — random anonymous browser ID
- `visited_at timestamptz` — server timestamp

Write RPC:

`public.log_florivo_presentation_visit(p_page_key text, p_visitor_id uuid)`

### Click journal

Table:

`public.florivo_presentation_clicks`

Columns:

- `id bigint` — internal event ID
- `source_page text` — currently `presentasjon-hovedmeny`
- `target_key text` — which presentation button was clicked
- `visitor_id uuid` — same anonymous browser ID used by the visit journal
- `clicked_at timestamptz` — server timestamp

Allowed `target_key` values:

- `video_presentasjon` — VIDEOPRESENTASJON
- `kamera_cloud` — KAMERA CLOUD
- `ut_kontor` — UT KONTOR
- `ut_lager_utsending` — UT LAGER OG UTSENDING
- `scanner_home` — SCANNER HOME
- `versjonslogg` — VERSJONSLOGG / technical development log

Write RPC:

`public.log_florivo_presentation_click(p_target_key text, p_visitor_id uuid)`

Read/aggregate RPC used by the internal statistics page:

`public.florivo_presentation_visit_stats()`

Security:

- RLS is enabled on both journal tables
- direct table access for `anon` and `authenticated` is revoked
- browser can execute only the allowed logging/statistics RPCs
- raw visitor IDs are not displayed on the presentation page or the internal statistics page
- no name, phone number, email or IP address is stored in these journal tables

## 3. Visit counting rules

One counted visit is an anonymous browser session-like visit.

Deduplication rule:

- the same `visitor_id` is counted at most once per 30 minutes
- repeated refreshes in the same browser inside 30 minutes do not increase the visit count
- after 30 minutes a new visit from the same browser may be counted again

Approximate unique visitor/device count:

`COUNT(DISTINCT visitor_id)`

Important limitation:

- `visitor_id` identifies a browser profile, not a person
- clearing browser storage, private/incognito mode, another browser or another device can create a new ID
- therefore unique visitor counts are approximate

## 4. Click counting rules

A click is recorded only when one of the six tracked links is activated from `presentasjon-hovedmeny.html`.

Rules:

- every click on a tracked presentation button is counted
- click totals are NOT subject to the 30-minute visit deduplication rule
- `COUNT(DISTINCT visitor_id)` per `target_key` gives the approximate number of different browsers that clicked that button
- opening `bestilling.html`, `scanner-home.html`, `teknisk-versjonslogg.html`, another work page, or the Drive video directly by URL does NOT count as a transition from the presentation page
- opening the version log from the normal `index.html` main menu does NOT count as a presentation click
- direct use of the destination pages is not modified and does not write to this click journal
- `versjonslogg` is shown as a separate click counter and is intentionally excluded from the five-stage work-content funnel

## 5. Browser storage

The presentation page stores only a random UUID under:

`florivo_presentation_visitor_v1`

Primary storage: `localStorage`.
Fallback: `sessionStorage`.

The visit and click loggers are fail-silent: analytics failure must never block navigation or visibly change the presentation page.

## 6. Timezone rule

All user-facing daily statistics must use:

`Europe/Oslo`

Do not use UTC day boundaries when the user asks for “today”, “yesterday”, a Norwegian date, or daily statistics.

## 7. Standard live queries — visits

### Today — visits + approximate unique browsers

```sql
with bounds as (
  select
    date_trunc('day', now() at time zone 'Europe/Oslo') at time zone 'Europe/Oslo' as start_ts,
    (date_trunc('day', now() at time zone 'Europe/Oslo') + interval '1 day') at time zone 'Europe/Oslo' as end_ts
)
select
  count(*)::int as visits_today,
  count(distinct visitor_id)::int as unique_browsers_today
from public.florivo_presentation_visits, bounds
where page_key = 'presentasjon-hovedmeny'
  and visited_at >= start_ts
  and visited_at < end_ts;
```

### Yesterday

```sql
with bounds as (
  select
    (date_trunc('day', now() at time zone 'Europe/Oslo') - interval '1 day') at time zone 'Europe/Oslo' as start_ts,
    date_trunc('day', now() at time zone 'Europe/Oslo') at time zone 'Europe/Oslo' as end_ts
)
select
  count(*)::int as visits_yesterday,
  count(distinct visitor_id)::int as unique_browsers_yesterday
from public.florivo_presentation_visits, bounds
where page_key = 'presentasjon-hovedmeny'
  and visited_at >= start_ts
  and visited_at < end_ts;
```

### Total since tracking started

```sql
select
  count(*)::int as visits_total,
  count(distinct visitor_id)::int as unique_browsers_total,
  min(visited_at) as first_recorded_visit,
  max(visited_at) as latest_recorded_visit
from public.florivo_presentation_visits
where page_key = 'presentasjon-hovedmeny';
```

### Daily statistics — last 30 Norwegian calendar days

```sql
select
  (visited_at at time zone 'Europe/Oslo')::date as day_oslo,
  count(*)::int as visits,
  count(distinct visitor_id)::int as unique_browsers
from public.florivo_presentation_visits
where page_key = 'presentasjon-hovedmeny'
  and visited_at >= now() - interval '30 days'
group by 1
order by 1 desc;
```

### Last 20 visits / journal

```sql
select
  id,
  to_char(visited_at at time zone 'Europe/Oslo', 'YYYY-MM-DD HH24:MI:SS') as oslo_time,
  left(visitor_id::text, 8) as anonymous_browser
from public.florivo_presentation_visits
where page_key = 'presentasjon-hovedmeny'
order by visited_at desc
limit 20;
```

### Today by hour

```sql
with bounds as (
  select
    date_trunc('day', now() at time zone 'Europe/Oslo') at time zone 'Europe/Oslo' as start_ts,
    (date_trunc('day', now() at time zone 'Europe/Oslo') + interval '1 day') at time zone 'Europe/Oslo' as end_ts
)
select
  to_char(date_trunc('hour', visited_at at time zone 'Europe/Oslo'), 'HH24:00') as hour_oslo,
  count(*)::int as visits,
  count(distinct visitor_id)::int as unique_browsers
from public.florivo_presentation_visits, bounds
where page_key = 'presentasjon-hovedmeny'
  and visited_at >= start_ts
  and visited_at < end_ts
group by 1
order by 1;
```

## 8. Standard live queries — button clicks

### Today + total by presentation button

```sql
with bounds as (
  select
    date_trunc('day', now() at time zone 'Europe/Oslo') at time zone 'Europe/Oslo' as start_ts,
    (date_trunc('day', now() at time zone 'Europe/Oslo') + interval '1 day') at time zone 'Europe/Oslo' as end_ts
)
select
  target_key,
  count(*) filter (where clicked_at >= start_ts and clicked_at < end_ts)::int as clicks_today,
  count(distinct visitor_id) filter (where clicked_at >= start_ts and clicked_at < end_ts)::int as unique_today,
  count(*)::int as clicks_total,
  count(distinct visitor_id)::int as unique_total,
  max(clicked_at) as latest_click
from public.florivo_presentation_clicks, bounds
where source_page = 'presentasjon-hovedmeny'
group by target_key
order by target_key;
```

### Last 30 click events

```sql
select
  target_key,
  to_char(clicked_at at time zone 'Europe/Oslo', 'YYYY-MM-DD HH24:MI:SS') as oslo_time,
  left(visitor_id::text, 8) as anonymous_browser
from public.florivo_presentation_clicks
where source_page = 'presentasjon-hovedmeny'
order by clicked_at desc
limit 30;
```

## 9. Internal statistics page

Unlinked page:

`florivo-besok-oversikt.html`

It is intentionally NOT linked from Florivo main menus or the presentation page.

It displays aggregate statistics only:

- visits today
- approximate unique browsers today
- visits for the last 7 days
- total visits
- daily visit breakdown
- latest visit
- expandable/open-by-default presentation-button list with today / total / approximate unique browsers / latest click for each of the six tracked destinations
- the version-log counter is separate from the work-content funnel

## 10. Rules for another ChatGPT conversation

When the user asks about Florivo presentation visits OR presentation-button clicks, ALWAYS query live Supabase. Do not answer from old protocol snapshots.

Examples of user requests:

- “Скільки сьогодні заходили?”
- “Перевір журнал відвідувань.”
- “Скільки унікальних сьогодні?”
- “Покажи за останні 7 днів.”
- “Скільки всього відвідувань?”
- “Коли були останні заходи?”
- “Скільки разів відкривали відеопрезентацію?”
- “Скільки переходів було в UT Kontor?”
- “Скільки відкривали журнал версій?”
- “Які кнопки найчастіше натискали?”
- “Покажи переходи по всіх сторінках сьогодні.”

Default answer for “how many today” should include both counted visits and approximate unique browsers.

For click questions, clearly distinguish:

- clicks / openings through the presentation page
- approximate unique browsers that clicked

If the user asks “who visited/clicked”, explain that the journal intentionally does not identify people. It can only distinguish anonymous browser IDs approximately.

## 11. Tracking start / historical limitation

Visit tracking started on 14.08.2026.

Click tracking for the original five presentation links was added on 14.08.2026 after the visit journal. Tracking for the `VERSJONSLOGG` presentation link was added later on 14.08.2026. Clicks made before the relevant logger was deployed cannot be reconstructed from this table.

Do not invent or estimate historical data unless the user explicitly asks for an estimate based on another source.

## 12. Do not change without explicit permission

Do not expose visit/click counts on `presentasjon-hovedmeny.html` unless the user explicitly asks.
Do not add personal-data collection to these journals.
Do not couple this analytics module to Nordic ID, WORK/TEST, stock, UT orders or dispatch logic.
