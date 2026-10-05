# HANDOFF.md — Bank Backend Academy

Instructions for a new agent (cold start). Read this file first, then PROGRESS.json.

## Project overview

Offline, fully bilingual (Arabic RTL / English LTR) learning app teaching bank
backend engineering. Frontend-only; no backend server. All content is local
JSON. The complete specification lives verbatim in `docs/SPEC.json` — re-read
it after any context reset.

Fictional bank: **Numuw Bank** (بنك نُمو). Cast: customers (Amal, Yusuf),
merchant (Dina's Electronics), operations clerk (Sara), auditor (Kamal).

## How to run

```bash
npm ci                # while online
npm run dev           # dev server
npm run build         # production build (dist/)
npm run preview       # serve dist via serve.mjs
npm run check         # typecheck + lint + lint:rtl + validate:content + unit tests
npm run test          # unit tests only
```

## How to continue (per-lesson workflow)

1. Re-read `docs/SPEC.json`, `PROGRESS.json`, `docs/AUTHORING_GUIDE.md`,
   the golden lesson `content/lessons/03-double-entry-bookkeeping.json`, and
   `reports/analogy-index.json`.
2. Add/extend glossary terms (both languages) first:
   `content/glossary/terms.json`.
3. Write the lesson JSON (English + Arabic in ONE pass), with diagrams,
   code blocks, ledger tables.
4. `npm run validate:content -- --lesson <id>` — fix everything.
5. Mark the lesson `"status": "published"` in `content/curriculum.json`,
   update PROGRESS.json, commit both languages together.
6. Module gate when the module is done: full build + tests, tag
   `v0.(4+N)-module-NN`.

## Conventions

- Conventional Commits with `Task-Id: T-xxx` trailer.
- Every human-readable string is `{"en": "...", "ar": "..."}`.
- Amounts are integers in minor units. `before + delta = after` and
  `Σdebits = Σcredits` per currency are validated.
- Analogies have distinct `tag` slugs; a tag may appear in at most 3 lessons
  course-wide (see reports/analogy-index.json).
- CSS: logical properties only (ms-/me-/ps-/pe-/start-/end-). `lint:rtl`
  fails on physical direction utilities.
- Diagrams: hand-written SVG React components (D-003), language-neutral
  structure + per-language labels.

## Known issues / status truth

- Commit hashes in PROGRESS.json can lag by one commit (a commit cannot
  contain its own hash). `npm run progress:sync` fills them.
- Chromium/Playwright availability in this sandbox is attempted in T-010;
  if blocked, e2e tests are written but marked blocked with reason, never
  faked (SPEC execution_mode rule 5).
- Remaining lessons are `"status": "planned"` in curriculum.json and hidden
  from navigation — never half-published.
