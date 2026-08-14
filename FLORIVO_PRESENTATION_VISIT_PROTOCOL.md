# FLORIVO PRESENTATION VISIT PROTOCOL

Status: ACTIVE after deployment of `presentasjon-hovedmeny.html` analytics change.
Created: 14.08.2026, Europe/Oslo.
Project: Florivo / repository `stelmashchukyurii-maker/Mottak`.
Supabase project ref: `hzjsatehehhpgpskckfi`.

## 1. Purpose

Keep a private journal of visits to the Florivo presentation landing page:

- page: `presentasjon-hovedmeny.html`
- page key in database: `presentasjon-hovedmeny`
- nothing about the counter/statistics is shown to visitors on the page
- statistics are checked only on request by querying live Supabase data

This journal is isolated from Nordic ID, WORK/TEST, stock, orders and dispatch logic.

## 2. Database objects

Table:

`public.florivo_presentation_visits`

Columns:

- `id bigint` — internal event ID
- `page_key text` — currently `presentasjon-hovedmeny`
- `visitor_id uuid` — random anonymous browser ID
- `visited_at timestamptz` — server timestamp

Write RPC:

`public.log_florivo_presentation_visit(p_page_key text, p_visitor_id uuid)`

Security:

- RLS is enabled on the table
- direct table access for `anon` and `authenticated` is revoked
- browser can only execute the logging RPC
- statistics are not exposed to the presentation page

## 3. Counting rules

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

No name, phone number, email or IP address is stored in this table.

## 4. Browser storage

The page stores only a random UUID under:

`florivo_presentation_visitor_v1`

Primary storage: `localStorage`.
Fallback: `sessionStorage`.

The logger is fail-silent: analytics failure must never block or visibly change the presentation page.

## 5. Timezone rule

All user-facing daily statistics must use:

`Europe/Oslo`

Do not use UTC day boundaries when the user asks for “today”, “yesterday”, a Norwegian date, or daily statistics.

## 6. Standard live queries

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

## 7. Rules for another ChatGPT conversation

When the user asks about Florivo presentation visits, ALWAYS query live Supabase. Do not answer from old protocol snapshots.

Examples of user requests:

- “Скільки сьогодні заходили?”
- “Перевір журнал відвідувань.”
- “Скільки унікальних сьогодні?”
- “Покажи за останні 7 днів.”
- “Скільки всього відвідувань?”
- “Коли були останні заходи?”

Default answer for “how many today” should include both:

1. counted visits today
2. approximate unique browsers today

If the user asks “who visited”, explain that the journal intentionally does not identify people. It can only distinguish anonymous browser IDs approximately.

## 8. Tracking start / historical limitation

Tracking was introduced on 14.08.2026.

Visits before the analytics deployment cannot be reconstructed from this table. Do not invent or estimate pre-tracking visits unless the user explicitly asks for an estimate based on another source.

## 9. Do not change without explicit permission

Do not expose visit counts on `presentasjon-hovedmeny.html` unless the user explicitly asks.
Do not add personal-data collection to this journal.
Do not couple this analytics table/RPC to Nordic ID, WORK/TEST, stock, UT orders or dispatch logic.
