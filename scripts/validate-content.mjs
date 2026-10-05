// validate:content — schema-lite checks per SPEC validation_suite.
// Supports --lesson <id> to scope; writes reports/content-report.json.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { globSync } from 'node:fs';
const CUR = JSON.parse(readFileSync('content/curriculum.json', 'utf8'));
const errors = [], warnings = [];
// 1. curriculum ids unique + count
const ids = CUR.modules.flatMap(m => m.lessons.map(l => l.id));
if (new Set(ids).size !== ids.length) errors.push('duplicate lesson ids in curriculum');
if (ids.length !== 82) errors.push(`curriculum must list 82 lessons, found ${ids.length}`);
// 2. glossary
const glossaryFiles = globSync('content/glossary/*.json');
const terms = glossaryFiles.flatMap(f => JSON.parse(readFileSync(f, 'utf8')));
const seenAr = new Map();
for (const t of terms) {
  if (!t.id || !t.en || !t.ar || !t.definition?.en || !t.definition?.ar) errors.push(`glossary term incomplete: ${t.id}`);
  if (seenAr.has(t.ar)) errors.push(`duplicate Arabic rendering "${t.ar}" for ${t.id} and ${seenAr.get(t.ar)}`);
  seenAr.set(t.ar, t.id);
}
// 3. published lessons exist as files + token resolution + quotas
const published = CUR.modules.flatMap(m => m.lessons.filter(l => l.status === 'published'));
for (const l of published) {
  const file = `content/lessons/${l.id}.json`;
  if (!existsSync(file)) { errors.push(`published lesson missing file: ${l.id}`); continue; }
  const lesson = JSON.parse(readFileSync(file, 'utf8'));
  for (const k of ['learning_objectives','key_concepts','real_life_analogies','worked_examples','incident_stories','diagrams','common_mistakes','checklist_for_production','quiz','cheat_sheet']) {
    if (!Array.isArray(lesson[k]) || lesson[k].length === 0) errors.push(`${l.id}: ${k} empty`);
  }
  const text = JSON.stringify(lesson);
  if (/https?:\/\//.test(text)) errors.push(`${l.id}: external URL in content`);
  for (const m of text.matchAll(/\{\{term:([^}]+)\}\}/g)) if (!terms.some(t => t.id === m[1])) errors.push(`${l.id}: unresolved term ${m[1]}`);
  if (/\b(TODO|TBD|lorem|placeholder)\b/i.test(text)) errors.push(`${l.id}: forbidden placeholder text`);
  for (const [k, min] of [['learning_objectives',3],['key_concepts',4],['real_life_analogies',5],['worked_examples',3],['incident_stories',2],['diagrams',4],['common_mistakes',5],['checklist_for_production',6],['quiz',6]]) {
    if ((lesson[k]?.length ?? 0) < min) errors.push(`${l.id}: ${k} below quota (${lesson[k]?.length}/${min})`);
  }
}
// 4. i18n parity
const flat = (o, p='') => Object.entries(o).flatMap(([k,v]) => typeof v === 'object' ? flat(v, p+k+'.') : [p+k]);
const en = JSON.parse(readFileSync('src/i18n/en.json','utf8')), ar = JSON.parse(readFileSync('src/i18n/ar.json','utf8'));
const ke = new Set(flat(en)), ka = new Set(flat(ar));
for (const k of ke) if (!ka.has(k)) errors.push(`i18n missing ar key: ${k}`);
for (const k of ka) if (!ke.has(k)) errors.push(`i18n missing en key: ${k}`);
mkdirSync('reports', { recursive: true });
writeFileSync('reports/content-report.json', JSON.stringify({ generated: new Date().toISOString(), lessons_total: ids.length, published: published.length, glossary_terms: terms.length, errors, warnings }, null, 2));
console.log(`validate:content — ${ids.length} lessons (published ${published.length}), ${terms.length} terms, ${errors.length} errors`);
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
