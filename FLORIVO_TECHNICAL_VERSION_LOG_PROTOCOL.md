# FLORIVO TECHNICAL VERSION LOG PROTOCOL

Status: ACTIVE RULE
Updated: 24.08.2026, Europe/Oslo
Repository: `stelmashchukyurii-maker/Mottak`

## 1. Purpose

The technical version log is a curated, human-readable history of the system's main technical versions and development milestones for technical/IT review.

It is NOT:
- a raw Git commit list;
- a release feed for every small edit;
- a presentation-history page;
- a statistics page;
- a marketing page.

Public entry:
`teknisk-versjonslogg.html`

The visible log must remain neutral and unbranded. Do not show the old project/company name or the current product/project brand inside the visible log text.

## 2. Current files

Stable public wrapper:
`teknisk-versjonslogg.html`

Language pages:
- Norwegian: `teknisk-versjonslogg-no.html`
- Ukrainian: `teknisk-versjonslogg-uk.html`

The wrapper keeps the public URL stable and switches between the two complete language pages.

Language controls:
- visible buttons: `NO` and `UK`;
- HTML language code for Ukrainian is `uk`;
- query parameter may use `?lang=no` or `?lang=uk`;
- browser preference is remembered in localStorage key `technical_version_log_lang_v1`;
- default language is Norwegian.

When the content changes, NO and UK versions must be updated together so they describe the same milestones.

## 3. Navigation

A `📘 VERSJONSLOGG` link is available from:
- the normal main page `index.html`;
- the presentation main page `presentasjon-hovedmeny.html`.

Both links point to the same stable wrapper:
`teknisk-versjonslogg.html`.

Therefore updating the log itself requires only one content update; the two main-page links do not need to be rewritten for every new version.

## 4. Visible editorial rules

The visible log must:
- contain no calendar dates;
- contain no clock times;
- contain no old company/project brand;
- contain no current product/project brand;
- contain no presentation, presentation-video, presentation-statistics, analytics or visitor-tracking history;
- focus on technical versions, functional changes, architecture milestones and verified status;
- remain readable for an IT specialist on PC while still working on mobile.

Recommended heading semantics:
- `Teknisk utviklingslogg`
- `Hovedversjoner og tekniske milepæler`

The log is intentionally a curated overview, not a complete commit-by-commit changelog.

## 5. Grouped version ranges

Several nearby versions may be grouped in one entry when they belong to the same development direction.

Examples already used:
- `v4.10–v4.12`
- `V2.3–V2.3.5`
- `v4.6.6–v4.6.9`

Grouping does NOT mean the intermediate versions did not exist. It only keeps the log readable.

## 6. Status labels

Use status labels only when supported by project evidence.

Typical labels:
- `STABIL`
- `WORK`
- `TEST`
- `DEV / PROTOTYPE`
- `ERSTATTET`
- `PHYSICAL PASS`
- `SERVER PASS`
- `PASS PENDING`

Do not upgrade an entry from DEV/TEST/PENDING to STABIL/PHYSICAL PASS unless a real verification was explicitly recorded.

## 7. Source-of-truth rule when updating

Do not reconstruct new entries from memory alone.

For a new significant entry, use in this order:
1. current canonical protocols;
2. current subsystem protocol/progress log/handoff;
3. relevant Git history / merged implementation;
4. relevant audit or live verification when status depends on it.

A filename or existing page alone is not proof that the version was production-active or physically passed.

## 8. Mandatory maintenance rule for future work

After every significant new version or technical milestone, check whether the technical development log must be updated.

ADD or update a log entry when there is a meaningful change such as:
- a new main version;
- a new stable/WORK baseline;
- a new physically verified workflow;
- a new database/server architecture milestone;
- a major new module or integration;
- a meaningful TEST/DEV branch worth retaining as development history;
- a major change in stock/order/RFID/inventory/security architecture.

DO NOT create a separate entry for routine low-value changes such as:
- cache busts;
- tiny text corrections;
- color/spacing-only changes;
- deployment re-uploads with no functional difference;
- incidental link/address fixes;
- every individual Git commit.

Those small changes should be grouped under the nearest functional version when relevant.

This means the historical data does NOT need to be recollected from scratch every time. The existing log is the base; future confirmed milestones are appended/updated incrementally.

## 9. Relationship to presentation analytics

The `VERSJONSLOGG` button on `presentasjon-hovedmeny.html` is a tracked presentation click target with key:
`versjonslogg`.

Counting semantics:
- click from `presentasjon-hovedmeny.html` -> counted in presentation click analytics;
- open from normal `index.html` -> NOT counted as a presentation click;
- direct URL open -> NOT counted as a presentation click.

The version-log click is displayed as a separate sixth click counter.
It is intentionally excluded from the five-destination work-content funnel so the technical-document interest signal does not distort the work-page funnel.

Historical limitation:
opens before the `versjonslogg` logger was deployed cannot be reconstructed retroactively.

Read analytics rules in:
- `FLORIVO_PRESENTATION_VISIT_PROTOCOL.md`
- `FLORIVO_PRESENTATION_INSIGHTS_PROTOCOL.md`
- `NEXT_CHAT_FLORIVO_VISITS.txt`
- `NEXT_CHAT_FLORIVO_STAT_REPORT.txt`

## 10. Isolation / safety

Updating the technical version log must not modify:
- Nordic RFID logic;
- UT order logic;
- stock calculations;
- staging/dispatch;
- WORK/TEST behavior;
- Android terminal behavior;
- Inventory data;
- Supabase production logic except when an explicitly approved analytics change requires it.

The version log is documentation/navigation only.

## 11. Change workflow

For a normal version-log update:
1. read this protocol and `PROTOCOLS.md`;
2. collect only the new relevant milestone evidence;
3. update Norwegian and Ukrainian content in lockstep;
4. preserve `teknisk-versjonslogg.html` as the stable public entry;
5. verify no forbidden visible brand/date/time/presentation-statistics text leaked into the log;
6. verify the existing links from `index.html` and `presentasjon-hovedmeny.html` still work;
7. do not touch operational business logic as part of a documentation-only change.
