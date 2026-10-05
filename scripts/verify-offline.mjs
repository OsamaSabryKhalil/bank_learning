// verify:offline — (1) no external http(s) refs in dist outside allowlist; (2) precache completeness note.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
const ALLOW = JSON.parse(readFileSync('scripts/offline-allowlist.json','utf8'));
const errors = [];
function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (!/\.(html|js|css|json|svg|webmanifest|js\.map)$/.test(f)) continue;
    const src = readFileSync(p, 'utf8');
    for (const m of src.matchAll(/https?:\/\/[^\s"'`)]+/g)) {
      const url = m[0];
      if (ALLOW.some(a => url.startsWith(a.reason_prefix) || url.includes(a.allow))) continue;
      errors.push(`${p}: external ref ${url}`);
    }
  }
}
walk('dist');
if (errors.length) { console.error(errors.slice(0,20).join('\n')); process.exit(1); }
console.log('verify:offline — no external references in dist');
