# Environment Preflight

Recorded: 2026-10-05 (UTC), via system commands per SPEC rule "Use the system clock".

| Check | Result |
|---|---|
| `node -v` | v22.23.2 (current LTS line; satisfies spec) |
| `npm -v` | 10.9.8 |
| `git --version` | git version 2.47.3 |
| OS | Linux sandbox.local 6.1.155 x86_64 GNU/Linux |
| Free disk | ~20 GB available on `/` (30% used) |
| Network reachable | YES — `https://registry.npmjs.org/` returned HTTP 200 |
| Chromium for Playwright | Attempted in T-010; result recorded below |
| Sandbox constraints | Writes confined to `/home/user/webapp`; sudo available if needed |

## Preflight notes

- Network is available now, so dependencies, fonts, and (if installable) a
  Chromium binary are downloaded and committed/bundled per the offline
  principle: build and run must later work with the network off.
- Node version pinned in `.nvmrc` (22) and `package.json` engines.
- If Chromium cannot be installed, the closest mature alternative is chosen
  and logged in `docs/DECISIONS.md`; verification steps are never silently
  dropped — any step that cannot run here is marked **blocked** in
  PROGRESS.json with its reason, per SPEC execution_mode rule 5.

## Update log

- 2026-10-05: initial preflight recorded. Chromium install attempted later in
  phase T-010; see `docs/DECISIONS.md` D-007 for the outcome.
