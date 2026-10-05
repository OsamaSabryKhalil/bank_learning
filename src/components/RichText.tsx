import { useTranslation } from 'react-i18next';
import { glossaryById } from '../lib/content';
import { Link } from 'react-router-dom';
import { useSettings } from '../stores/settings';
import type { Bi } from '../lib/content-types';

/**
 * Safe inline-markup renderer. NEVER uses dangerouslySetInnerHTML.
 * Supported: **bold**, `code`, {{term:<id>}}, {{lesson:<id>}}.
 * Code/identifiers render in dir=ltr bidi-isolated spans.
 * First use of a term shows "Arabic (English)"; later uses show only the
 * current-language rendering. keep_latin terms stay Latin inside Arabic text.
 */

export function RichText({ text, firstTerms }: { text: string; firstTerms: Set<string> }) {
  const lang = useSettings((s) => s.lang);

  // split into tokens: **bold**, `code`, {{term:x}}, {{lesson:x}}
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\{\{(?:term|lesson):[^}]+\}\})/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
          return (
            <code
              key={i}
              dir="ltr"
              className="mono rounded bg-slate-200 px-1 py-0.5 text-sm dark:bg-slate-800"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        const m = part.match(/^\{\{term:([^}]+)\}\}$/);
        if (m) {
          const term = glossaryById.get(m[1]!);
          if (!term) return <span key={i}>{part}</span>; // validator catches this
          const isFirst = firstTerms.has(term.id);
          if (isFirst) firstTerms.delete(term.id);
          if (lang === 'ar') {
            const latin = term.keep_latin ? term.en : `${term.ar} (${term.en})`;
            return <bdi key={i}>{isFirst ? latin : term.ar}</bdi>;
          }
          return <span key={i}>{term.en}</span>;
        }
        const lm = part.match(/^\{\{lesson:([^}]+)\}\}$/);
        if (lm) {
          return (
            <Link key={i} to={`/lesson/${lm[1]}`} className="text-teal-700 underline-offset-2 hover:underline dark:text-teal-300">
              {lm[1]}
            </Link>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

/** Convenience: paragraph with first-term bookkeeping per lesson instance. */
export function BiText({ value, firstTerms }: { value: Bi; firstTerms: Set<string> }) {
  const lang = useSettings((s) => s.lang);
  return (
    <span lang={lang}>
      <RichText text={value[lang]} firstTerms={firstTerms} />
    </span>
  );
}

/** Creates the shared first-use set from a lesson's glossary_terms. */
export function makeFirstTerms(terms: string[]): Set<string> {
  return new Set(terms);
}

export function useBi(): (v: Bi) => string {
  const lang = useSettings((s) => s.lang);
  return (v: Bi) => v[lang];
}

export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export function BiList({ items, ordered = false }: { items: Bi[]; ordered?: boolean }) {
  const { t } = useTranslation();
  const lang = useSettings((s) => s.lang);
  void t;
  const Tag = ordered ? 'ol' : 'ul';
  return (
    <Tag className="list-inside space-y-1.5">
      {items.map((it, i) => (
        <li key={i} lang={lang}>
          <RichTextNoFirst text={it[lang]} />
        </li>
      ))}
    </Tag>
  );
}

function RichTextNoFirst({ text }: { text: string }) {
  // list items: share a no-op first-term set (terms resolved at first use in prose)
  const set = new Set<string>();
  return <RichText text={text} firstTerms={set} />;
}
