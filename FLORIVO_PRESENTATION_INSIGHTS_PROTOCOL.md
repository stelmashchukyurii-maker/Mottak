# FLORIVO PRESENTATION INSIGHTS PROTOCOL

Status: ACTIVE RULE
Created: 14.08.2026, Europe/Oslo
Updated: 24.08.2026, Europe/Oslo
Project: Florivo / `stelmashchukyurii-maker/Mottak`.
Supabase project ref: `hzjsatehehhpgpskckfi`.

## Purpose

This protocol defines how to interpret private presentation analytics for `presentasjon-hovedmeny.html`:

1. Returning visits.
2. Presentation funnel / interest stages.
3. Six tracked presentation-button click counters, including the technical version log.

Aggregate analytics are shown only on the unlinked internal page:
`florivo-besok-oversikt.html`.

The presentation page itself does NOT display visitor/click counters.
It does contain the visible navigation button `📘 VERSJONSLOGG`, but the analytics values remain private.

Technical-version-log content/navigation rules are defined separately in:
`FLORIVO_TECHNICAL_VERSION_LOG_PROTOCOL.md`.

## Returning visits

The visit journal remains:
`public.florivo_presentation_visits`

A new visit from the same anonymous browser is counted only after the existing 30-minute deduplication window.

Definitions:
- `returning_browsers_today` — anonymous browser IDs with 2+ counted visit rows during the current Europe/Oslo calendar day;
- `repeat_visits_today` — counted visit rows today after subtracting the first counted visit for each browser;
- `returning_browsers_total` — anonymous browser IDs with 2+ counted visit rows since tracking started;
- `repeat_visits_total` — all counted visit rows after subtracting the first counted visit for every browser since tracking started.

Example:
A browser visits at 09:00, 09:10, 10:00 and 15:00.
- 09:00 counts;
- 09:10 is inside the 30-minute window and does not count;
- 10:00 counts as a return;
- 15:00 counts as another return.

Result for that browser: 3 counted visits, 1 returning browser, 2 repeat visits.

## Presentation click targets

The click journal is:
`public.florivo_presentation_clicks`

Tracked `target_key` values:
- `video_presentasjon`
- `kamera_cloud`
- `ut_kontor`
- `ut_lager_utsending`
- `scanner_home`
- `versjonslogg`

Every allowed presentation-button click is counted separately; click counting does not use the 30-minute visit dedupe.

`versjonslogg` semantics:
- counted only when `📘 VERSJONSLOGG` is clicked from `presentasjon-hovedmeny.html`;
- opening the same log from normal `index.html` is NOT a presentation click;
- direct URL open is NOT a presentation click;
- it is shown as a separate sixth click counter;
- it is intentionally excluded from the work-content funnel.

Clicks before the relevant logger was deployed cannot be reconstructed retroactively.

## Funnel / interest stages

The aggregate RPC is:
`public.florivo_presentation_visit_stats()`

The `funnel` array remains intentionally limited to:
- `presentation_page` — unique browsers that opened `presentasjon-hovedmeny.html`;
- `video_presentasjon` — unique browsers that clicked VIDEOPRESENTASJON;
- `kamera_cloud` — unique browsers that clicked KAMERA CLOUD;
- `ut_kontor` — unique browsers that clicked UT KONTOR;
- `ut_lager_utsending` — unique browsers that clicked UT LAGER OG UTSENDING;
- `scanner_home` — unique browsers that clicked SCANNER HOME.

`versjonslogg` is NOT a funnel stage.

Each funnel stage contains:
- `unique_today`
- `unique_total`

The internal statistics page calculates percentages relative to the unique browsers that opened the presentation page.

IMPORTANT: this is an interest funnel, NOT a strict ordered navigation path. A viewer can skip video and open UT Kontor or Scanner Home directly. Do not claim that somebody completed stages in sequence unless event-level timestamps are explicitly analysed and support that conclusion.

## Standard interpretation

Useful signals:
- visit but no button clicks: page was opened, but no tracked destination was opened;
- video click: viewer showed interest in the overview/presentation;
- UT Kontor / UT Lager / Scanner Home click: viewer inspected a working part of the system;
- `VERSJONSLOGG` click: viewer opened the technical development history from the presentation page; this can indicate technical/IT interest, but it is not proof of approval;
- returning browser: the same anonymous browser came back after the 30-minute visit-dedup window;
- multiple destination clicks from one anonymous browser can indicate deeper exploration, but do not infer approval or identity.

Do not interpret:
- no clicks as rejection;
- clicks as approval;
- a version-log click as proof that an IT specialist approved or even fully read the log;
- returning browser as a specific person;
- browser IDs as exact people/devices.

## Live-query rule for another conversation

When the user asks about:
- `повторні відвідування`
- `хтось повертався?`
- `воронка`
- `до яких сторінок доходили?`
- `що найбільше відкривали?`
- `скільки відкривали журнал версій?`

ALWAYS query live Supabase. Do not answer from protocol snapshots.

The easiest aggregate query is:
```sql
select public.florivo_presentation_visit_stats() as stats;
```

Use `Europe/Oslo` for daily interpretation.

## Privacy / isolation

No name, phone, email or IP is stored in these Florivo analytics journal tables.
Do not expose analytics values on `presentasjon-hovedmeny.html` without explicit permission.
Do not couple these analytics to Nordic ID, WORK/TEST, stock, UT orders or dispatch logic.
