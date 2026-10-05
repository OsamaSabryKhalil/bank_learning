// lint:rtl — fail on physical-direction CSS utilities/properties outside allowlist.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
const ALLOW = new Set(); // entries need explicit reasons per SPEC; none yet
const BAD = [/\b(ml|mr|pl|pr)-\d/, /\bleft-\d/, /\bright-\d/, /text-left/, /text-right/, /margin-left/, /margin-right/, /padding-left/, /padding-right/];
const errors = [];
function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) { if (!/node_modules|dist|\.git/.test(p)) walk(p); continue; }
    if (!/\.(tsx?|css)$/.test(f)) continue;
    const src = readFileSync(p, 'utf8');
    for (const re of BAD) { const m = src.match(re); if (m) errors.push(`${p}: physical direction utility "${m[0]}"`); }
  }
}
walk('src');
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('lint:rtl — OK, logical properties only');
