import { useSettings } from '../stores/settings';
import type { Bi, CodeBlock, LedgerTable } from '../lib/content-types';
import { formatMoney } from '../lib/money';

/** Comment syntax per language for code blocks. */
const COMMENT: Record<string, string> = {
  sql: '--',
  ts: '//',
  java: '//',
  python: '#',
  json: '//',
  pseudo: '#',
};

export function CodeBlockView({ block }: { block: CodeBlock }) {
  const lang = useSettings((s) => s.lang);
  const commentToken = COMMENT[block.lang] ?? '--';
  return (
    <figure>
      <figcaption className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-300">
        {block.caption[lang]}
      </figcaption>
      <pre
        dir="ltr"
        tabIndex={0}
        aria-label={block.caption[lang]}
        className="mono max-w-full overflow-x-auto rounded-xl bg-slate-900 p-4 text-sm leading-6 text-slate-100"
      >
        <code>
          {block.lines.map((line, i) => {
            const markClass =
              line.mark === 'bad'
                ? 'text-red-300'
                : line.mark === 'good'
                  ? 'text-green-300'
                  : 'text-slate-100';
            const comment = line.comment
              ? ` ${commentToken} ${line.comment[lang]}`
              : '';
            return (
              <span key={i}>
                <span className={markClass}>{line.code}</span>
                {comment && (
                  <span className="text-slate-400 italic" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                    {comment}
                  </span>
                )}
                {'\n'}
              </span>
            );
          })}
        </code>
      </pre>
    </figure>
  );
}

export function LedgerTableView({ table }: { table: LedgerTable }) {
  const lang = useSettings((s) => s.lang);
  const numerals = useSettings((s) => s.numerals);
  const money = (m: number, c: string) => (
    <bdi dir="ltr">{formatMoney(m, c, lang, numerals)}</bdi>
  );

  if (table.kind === 'balance_change') {
    return (
      <figure>
        <figcaption className="mb-2 text-sm font-medium">{table.caption[lang]}</figcaption>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-300 text-start dark:border-slate-700">
                <th className="p-2 text-start">{lang === 'ar' ? 'الحساب' : 'Account'}</th>
                <th className="p-2 text-start">{lang === 'ar' ? 'قبل' : 'Before'}</th>
                <th className="p-2 text-start">{lang === 'ar' ? 'التغير' : 'Change'}</th>
                <th className="p-2 text-start">{lang === 'ar' ? 'بعد' : 'After'}</th>
              </tr>
            </thead>
            <tbody>
              {table.rows.map((r, i) => (
                <tr key={i} className="border-b border-slate-200 dark:border-slate-800">
                  <td className="p-2">{r.account[lang]}</td>
                  <td className="p-2">{money(r.before_minor, r.currency)}</td>
                  <td className={`p-2 ${r.delta_minor < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-700 dark:text-green-400'}`}>
                    {r.delta_minor >= 0 ? '+' : ''}
                    {money(r.delta_minor, r.currency)}
                  </td>
                  <td className="p-2 font-medium">{money(r.after_minor, r.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </figure>
    );
  }

  // journal
  return (
    <figure>
      <figcaption className="mb-2 text-sm font-medium">{table.caption[lang]}</figcaption>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[32rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-300 dark:border-slate-700">
              <th className="p-2 text-start">{lang === 'ar' ? 'الحساب' : 'Account'}</th>
              <th className="p-2 text-start">{lang === 'ar' ? 'مدين' : 'Debit'}</th>
              <th className="p-2 text-start">{lang === 'ar' ? 'دائن' : 'Credit'}</th>
            </tr>
          </thead>
          <tbody>
            {table.entries.map((e, i) => (
              <tr key={i} className="border-b border-slate-200 dark:border-slate-800">
                <td className="p-2">{e.account[lang]}</td>
                <td className="p-2">{e.debit_minor > 0 ? money(e.debit_minor, e.currency) : ''}</td>
                <td className="p-2">{e.credit_minor > 0 ? money(e.credit_minor, e.currency) : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}

export function BiHeading({ value, as = 'h3' }: { value: Bi; as?: 'h3' | 'h4' }) {
  const lang = useSettings((s) => s.lang);
  const Tag = as;
  return <Tag className="mt-4 font-semibold">{value[lang]}</Tag>;
}
