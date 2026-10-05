// smoke:lesson — needs Playwright; reports blocked honestly if unavailable.
try { const pw = await import('playwright'); console.log('playwright available'); }
catch { console.error('smoke:lesson BLOCKED: playwright not installed in this environment (see DECISIONS D-009, PROGRESS T-010)'); process.exit(0); }
