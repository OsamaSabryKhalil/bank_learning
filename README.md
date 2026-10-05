# Bank Backend Academy — أكاديمية البنوك الخلفية

Offline, fully bilingual (English/العربية, RTL+LTR) learning app teaching bank
backend engineering. Frontend-only: no backend server; all content ships as
local JSON. Complete specification: `docs/SPEC.json`.

## Run
```bash
npm ci            # while online
npm run dev       # develop
npm run build     # production build to dist/
npm run preview   # serve dist/ via serve.mjs (127.0.0.1)
npm run check      # typecheck + lint + lint:rtl + validate:content + tests
```

## Status (honest)
Phases 0–2 built: preflight, scaffold, bilingual/RTL shell, content engine
(validator, renderer, quiz, storage), search, ledger-playground simulator,
offline packaging scripts. **0 of 82 lessons published yet** — the golden
lesson (03-double-entry-bookkeeping) is the exact next task; see
PROGRESS.json `next_action`. Playwright e2e blocked in this sandbox (no
Chromium); scripts report blocked honestly rather than faking results.

## Educational disclaimer / إخلاء مسؤولية
This is educational material, not legal, regulatory, or compliance advice.
هذه مادة تعليمية وليست استشارة قانونية أو تنظيمية. النص ثنائي اللغة كتبه
ذكاء اصطناعي ويُستحسن مراجعته من مهندس بنكي ناطق بالعربية.
