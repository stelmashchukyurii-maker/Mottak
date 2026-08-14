# FLORIVO PRESENTATION INSIGHTS PROTOCOL

Status: ACTIVE after deployment of the returning-visits/funnel analytics update.
Created: 14.08.2026, Europe/Oslo.
Project: Florivo / `stelmashchukyurii-maker/Mottak`.
Supabase project ref: `hzjsatehehhpgpskckfi`.

## Purpose

This protocol defines how to interpret two private analytics blocks for `presentasjon-hovedmeny.html`:

1. Returning visits.
2. Presentation funnel / interest stages.

The blocks are shown only on the unlinked internal page:

`florivo-besok-oversikt.html`

Nothing is added visibly to the presentation page.

## Returning visits

The visit journal remains:

`public.florivo_presentation_visits`

A new visit from the same anonymous browser is counted only after the existing 30-minute deduplication window.

Definitions:

- `returning_browsers_today` — number of anonymous browser IDs with 2+ counted visit rows during the current Europe/Oslo calendar day.
- `repeat_visits_today` — counted visit rows today after subtracting the first counted visit for each browser.
- `returning_browsers_total` — number of anonymous browser IDs with 2+ counted visit rows since tracking started.
- `repeat_visits_total` — all counted visit rows after subtracting the first counted visit for every browser since tracking started.

Example:

A browser visits at 09:00, 09:10, 10:00 and 15:00.

- 09:00 counts.
- 09:10 is inside the 30-minute window and does not count.
- 10:00 counts as a return.
- 15:00 counts as another return.

Result for that browser: 3 counted visits, 1 returning browser, 2 repeat visits.

## Funnel / interest stages

The aggregate RPC is:

`public.florivo_presentation_visit_stats()`

It returns a `funnel` array with these stages:

- `presentation_page` — unique browsers that opened `presentasjon-hovedmeny.html`.
- `video_presentasjon` — unique browsers that clicked VIDEOPRESENTASJON from that page.
- `kamera_cloud` — unique browsers that clicked KAMERA CLOUD from that page.
- `ut_kontor` — unique browsers that clicked UT KONTOR from that page.
- `ut_lager_utsending` — unique browsers that clicked UT LAGER OG UTSENDING from that page.
- `scanner_home` — unique browsers that clicked SCANNER HOME from that page.

Each stage contains:

- `unique_today`
- `unique_total`

The internal statistics page calculates percentages relative to the unique browsers that opened the presentation page.

IMPORTANT: this is an interest funnel, NOT a strict ordered navigation path. A viewer can skip video and open UT Kontor or Scanner Home directly. Do not claim that somebody completed stages in sequence unless event-level timestamps are explicitly analysed and support that conclusion.

## Standard interpretation

Useful signals:

- Visit but no button clicks: page was opened, but no tracked destination was opened.
- Video click: viewer showed interest in the overview/presentation.
- UT Kontor / UT Lager / Scanner Home click: viewer inspected a working part of the system.
- Returning browser: the same anonymous browser came back after the 30-minute visit-dedup window.
- Multiple destination clicks from one anonymous browser can indicate deeper exploration, but do not infer approval or identity.

Do not interpret:

- no clicks as rejection;
- clicks as approval;
- returning browser as a specific person;
- browser IDs as exact people/devices.

## Live-query rule for another conversation

When the user asks about:

- `повторні відвідування`
- `хтось повертався?`
- `воронка`
- `до яких сторінок доходили?`
- `що найбільше відкривали?`

ALWAYS query live Supabase. Do not answer from protocol snapshots.

The easiest aggregate query is:

```sql
select public.florivo_presentation_visit_stats() as stats;
```

Use `Europe/Oslo` for daily interpretation.

## Privacy / isolation

No name, phone, email or IP is stored in these Florivo analytics journal tables.
Do not expose analytics on `presentasjon-hovedmeny.html` without explicit permission.
Do not couple these analytics to Nordic ID, WORK/TEST, stock, UT orders or dispatch logic.
