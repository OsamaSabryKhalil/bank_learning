// build:search — build one search index per language from published content.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
mkdirSync('dist', { recursive: true });
const CUR = JSON.parse(readFileSync('content/curriculum.json', 'utf8'));
const terms = JSON.parse(readFileSync('content/glossary/terms.json', 'utf8'));
for (const lang of ['en','ar']) {
  const entries = terms.map(t => ({ id: `term:${t.id}`, title: lang==='ar'?t.ar:t.en, snippet: t.definition[lang] }));
  for (const m of CUR.modules) for (const l of m.lessons) {
    if (l.status !== 'published') continue;
    const f = `content/lessons/${l.id}.json`;
    if (existsSync(f)) { const les = JSON.parse(readFileSync(f,'utf8')); entries.push({ id: l.id, title: les.title[lang], snippet: les.plain_summary[lang] }); }
  }
  writeFileSync(`dist/search-index-${lang}.json`, JSON.stringify(entries));
  console.log(`search index ${lang}: ${entries.length} entries`);
}
