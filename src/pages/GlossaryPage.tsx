import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { glossary, termBacklinks } from '../lib/content';
import { useSettings } from '../stores/settings';
import { hasArabic, normalizeArabic, digitsToWestern } from '../lib/arabic';

export default function GlossaryPage() {
  const { t } = useTranslation();
  const lang = useSettings((s) => s.lang);
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const query = digitsToWestern(q.trim());
    if (!query) return glossary;
    const isAr = hasArabic(query);
    const norm = isAr ? normalizeArabic(query) : query.toLowerCase();
    return glossary.filter((term) => {
      const hayAr = normalizeArabic(
        `${term.ar} ${term.definition.ar} ${term.ar_aliases.join(' ')}`,
      );
      const hayEn = `${term.en} ${term.definition.en}`.toLowerCase();
      return hayAr.includes(norm) || hayEn.includes(norm);
    });
  }, [q]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{t('glossary.title')}</h1>
      <input
        type="search"
        dir="auto"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t('search.placeholder')}
        aria-label={t('search.placeholder')}
        className="w-full max-w-md rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
      />
      <dl className="flex flex-col gap-4">
        {filtered.map((term) => {
          const backlinks = termBacklinks(term.id);
          return (
            <div
              key={term.id}
              className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"
            >
              <dt className="font-semibold">
                {/* side-by-side Arabic/English view */}
                <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <bdi>{term.ar}</bdi>
                  <span className="text-slate-400">/</span>
                  <bdi dir="ltr">{term.en}</bdi>
                </span>
              </dt>
              <dd className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                <p lang="ar" dir="rtl">
                  <bdi>{term.definition.ar}</bdi>
                </p>
                <p lang="en" dir="ltr">
                  {term.definition.en}
                </p>
              </dd>
              {backlinks.length > 0 && (
                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  {t('glossary.used_in')}:{' '}
                  {backlinks.map((l, i) => (
                    <span key={l.id}>
                      {i > 0 && ' · '}
                      <Link to={`/lesson/${l.id}`} className="underline-offset-2 hover:underline">
                        {l.title[lang]}
                      </Link>
                    </span>
                  ))}
                </p>
              )}
              {term.related.length > 0 && (
                <p className="mt-1 text-xs text-slate-400">
                  {t('glossary.related')}: {term.related.join(' · ')}
                </p>
              )}
            </div>
          );
        })}
      </dl>
      {filtered.length === 0 && <p className="text-slate-500">{t('search.no_results')}</p>}
    </div>
  );
}
