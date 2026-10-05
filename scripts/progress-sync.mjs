// progress:sync — fill commit hashes by Task-Id trailer and recompute percent.
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
const P = JSON.parse(readFileSync('PROGRESS.json','utf8'));
const log = execSync('git log --all --format=%H%x09%s%x09%b', { encoding: 'utf8' });
const map = new Map();
for (const line of log.split('\n')) {
  const m = line.match(/Task-Id:\s*(T-\d+)/);
  if (m) { const h = line.split('\t')[0].slice(0,7); map.set(m[1], h); }
}
for (const t of P.tasks) if (t.status === 'done' && map.has(t.id)) t.commit = map.get(t.id);
const done = P.tasks.filter(t => t.status === 'done').length;
P.overall_percent = Math.round((done / P.tasks.length) * 100);
P.last_commit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
P.last_updated = new Date().toISOString();
writeFileSync('PROGRESS.json', JSON.stringify(P, null, 2));
console.log(`progress:sync — ${done}/${P.tasks.length} tasks (${P.overall_percent}%)`);
