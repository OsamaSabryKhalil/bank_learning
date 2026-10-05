// vendor:deps — copy npm cache into repo for offline rebuild (npm ci --offline --cache .npm-cache).
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
if (!existsSync('package-lock.json')) { console.error('no lockfile'); process.exit(1); }
execSync('npm cache verify --cache .npm-cache', { stdio: 'inherit' });
console.log('vendor:deps — .npm-cache ready; rebuild with: npm ci --offline --cache .npm-cache');
