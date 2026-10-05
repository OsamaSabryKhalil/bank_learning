// package:offline — build dist and produce release zip with serve.mjs + checksums.
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
execSync('npm run build', { stdio: 'inherit' });
const files = [];
function walk(d) { for (const f of readdirSync(d)) { const p = join(d,f); statSync(p).isDirectory() ? walk(p) : files.push(p); } }
walk('dist');
const sums = files.map(f => { const rel = f.replace('dist/','bank-academy/'); return `${createHash('sha256').update(readFileSync(f)).digest('hex')}  ${rel}`; });
writeFileSync('dist/SHA256SUMS', sums.join('\n'));
writeFileSync('dist/VERSION', '0.1.0\n');
execSync('cd dist && zip -qr ../release/bank-academy-offline.zip . ../serve.mjs', { stdio: 'inherit' });
console.log('package:offline — release/bank-academy-offline.zip');
