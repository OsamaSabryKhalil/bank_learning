import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { glossary, publishedLessons } from '../lib/content';
import { useSettings } from '../stores/settings';
import { hasArabic, normalizeArabic, normalizeLatin, digitsToWestern } from '../lib/arabic';

/**
 * Offline full-text search over published lessons and glossary terms.
 * Indexes are built at build time (scripts/build-search.mjs) into
 * dist/search-index-{en,ar}.json and lazy-loaded here; Arabic queries are
 * normalized (diacritics, alef variants, ال) and also matched through the
 * glossary alias map so an Arabic query finds English-named lessons and
 * vice versa.
 */

interface SearchIndexEntry {
  id: string;
  title: string;
  snippet: string;
}

const indexCache: Partial<Record<'en' | 'ar', SearchIndexEntry[]>> = {};

async function loadIndex(lang: 'en' | 'ar'): Promise<SearchIndexEntry[]> {
  if (indexCache[lang]) return indexCache[lang]!;
  try {
    const res = await fetch(`/search-index-${lang}.json`);
    indexCache[lang] = res.ok ? ((await res.json()) as SearchIndexEntry[]) : [];
  } catch {
    indexCache[lang] = [];
  }
  return indexCache[lang]!;
}

export default function SearchPage() {
  const { t } = useTranslation();
  const lang = useSettings((s) => s.lang);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<SearchIndexEntry[] | null>(null);

  const glossaryAliases = useMemo(() => {
    // alias map: normalized Arabic alias -> English term name (and reverse)
    const map: { ar: { norm: string; en: string }[]; en: { norm: string; ar: string }[] } = {
      ar: [],
      en: [],
    };
    for (const term of glossary) {
      map.ar.push(
        ...[term.ar, ...term.ar_aliases].map((a) => ({ norm: normalizeArabic(a), en: term.en })),
      );
      map.en.push({ norm: normalizeLatin(term.en), ar: term.ar });
    }
    return map;
  }, []);

  async function run() {
    const raw = digitsToWestern(q.trim());
    if (!raw) {
      setResults(null);
      return;
    }
    const isAr = hasArabic(raw);
    // Cross-language glossary expansion: an Arabic query also matches the
    // English term name and lessons that use it, and the reverse.
    let expanded = raw;
    if (isAr) {
      const norm = normalizeArabic(raw);
      for (const a of glossaryAliases.ar) {
        if (a.norm.includes(norm) || norm.includes(a.norm)) {
          expanded = `${raw} ${a.en}`;
          break;
        }
      }
    } else {
      const norm = normalizeLatin(raw);
      for (const e of glossaryAliases.en) {
        if (e.norm.includes(norm) || norm.includes(e.norm)) {
          expanded = `${raw} ${e.ar}`;
          break;
        }
      }
    }
    // search in BOTH indexes, prefer current language first
    const [own, other] = await Promise.all([loadIndex(lang), loadIndex(lang === 'en' ? 'ar' : 'en')]);
    const needle = hasArabic(expanded) ? normalizeArabic(expanded) : normalizeLatin(expanded);
    const needles = expanded
      .split(/\s+/)
      .map((w) => (hasArabic(w) ? normalizeArabic(w) : normalizeLatin(w)))
      .filter(Boolean);
    const hit = (e: SearchIndexEntry) => {
      const hay = hasArabic(e.title + e.snippet) ? normalizeArabic(`${e.title} ${e.snippet}`) : normalizeLatin(`${e.title} ${e.snippet}`);
      return needles.every((n) => hay.includes(n)) || hay.includes(needle);
    };
    const ownHits = own.filter(hit);
    const otherHits = other.filter(hit);
    setResults([...ownHits, ...otherHits].slice(0, 50));
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{t('nav.search')}</h1>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          void run();
        }}
        className="flex gap-2"
      >
        <input
          type="search"
          dir="auto"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('search.placeholder')}
          aria-label={t('search.placeholder')}
          className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
        />
        <button type="submit" className="min-h-[44px] rounded-lg bg-teal-700 px-4 text-white hover:bg-teal-800">
          {t('nav.search')}
        </button>
      </form>
      {results !== null && (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t('search.results', { count: results.length })}
        </p>
      )}
      <ul className="flex flex-col gap-3">
        {(results ?? []).map((r) => (
          <li key={r.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <Link to={r.id.startsWith('term:') ? '/glossary' : `/lesson/${r.id}`} className="font-medium hover:underline">
              {r.title}
            </Link>
            <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{r.snippet}</p>
          </li>
        ))}
      </ul>
      {results !== null && results.length === 0 && <p className="text-slate-500">{t('search.no_results')}</p>}
      <p className="text-xs text-slate-400">
        {publishedLessons().length} {t('search.lessons')}
      </p>
    </div>
  );
}
