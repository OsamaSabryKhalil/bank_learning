import { useMemo, useReducer, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../stores/settings';
import { formatMoney } from '../lib/money';
import {
  type EngineResult,
  type EngineState,
  numuwPreset,
  postEntry,
  reversePosting,
  trialBalance,
} from './ledgerEngine';

/**
 * Ledger Playground UI — bilingual, RTL-safe, keyboard operable.
 * Engine is pure (ledgerEngine.ts); this layer only renders and dispatches.
 */

type Action =
  | { type: 'post'; lines: { account_id: string; debit_minor: string; credit_minor: string }[]; memo: string }
  | { type: 'reverse'; postingId: number }
  | { type: 'preset' };

function reducer(state: EngineState, action: Action): EngineState {
  switch (action.type) {
    case 'preset':
      return numuwPreset();
    case 'post': {
      const lines = action.lines
        .map((l) => ({
          account_id: l.account_id,
          debit_minor: l.debit_minor ? Math.round(Number(l.debit_minor) * 100) : 0,
          credit_minor: l.credit_minor ? Math.round(Number(l.credit_minor) * 100) : 0,
        }))
        .filter((l) => l.account_id && (l.debit_minor > 0 || l.credit_minor > 0));
      const result: EngineResult = postEntry(state, lines, action.memo);
      return result.state;
    }
    case 'reverse': {
      const result = reversePosting(state, action.postingId, `Reversal of #${action.postingId}`);
      return result.state;
    }
  }
}

export default function LedgerPlayground() {
  const { t } = useTranslation();
  const lang = useSettings((s) => s.lang);
  const numerals = useSettings((s) => s.numerals);
  const [state, dispatch] = useReducer(reducer, undefined, numuwPreset);
  const [memo, setMemo] = useState('');
  const [lineA, setLineA] = useState({ account_id: 'cash', debit_minor: '', credit_minor: '' });
  const [lineB, setLineB] = useState({ account_id: 'amal', debit_minor: '', credit_minor: '' });

  const tb = useMemo(() => trialBalance(state), [state]);
  const money = (m: number, c: string) => <bdi dir="ltr">{formatMoney(m, c, lang, numerals)}</bdi>;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: 'post', lines: [lineA, lineB], memo: memo || 'transfer' });
    setMemo('');
    setLineA({ account_id: lineA.account_id, debit_minor: '', credit_minor: '' });
    setLineB({ account_id: lineB.account_id, debit_minor: '', credit_minor: '' });
  };

  const accountLabel = (id: string) => {
    const names: Record<string, { en: string; ar: string }> = {
      cash: { en: 'Cash at central bank', ar: 'النقد لدى البنك المركزي' },
      vault: { en: 'Cash in vault', ar: 'النقد في الخزنة' },
      amal: { en: "Amal's checking account", ar: 'حساب أمل الجاري' },
      yusuf: { en: "Yusuf's savings account", ar: 'حساب يوسف للتوفير' },
      loans: { en: 'Loans to customers', ar: 'قروض العملاء' },
      'interest-income': { en: 'Interest income', ar: 'إيرادات الفوائد' },
      capital: { en: 'Share capital', ar: 'رأس المال' },
      'usd-nostro': { en: 'USD nostro account', ar: 'حساب nostro بالدولار' },
      'usd-deposits': { en: 'USD customer deposits', ar: 'ودائع العملاء بالدولار' },
    };
    return names[id]?.[lang] ?? id;
  };

  const inputCls =
    'min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-2 dark:border-slate-700 dark:bg-slate-900';

  return (
    <section aria-label={t('simulators.title')} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
      <p className="mb-3 rounded-lg bg-slate-100 p-2 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        {t('simulators.disclaimer')}
      </p>
      <div aria-live="assertive">
        {state.lastError && (
          <p role="alert" className="mb-3 rounded-lg bg-red-50 p-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-300">
            ✗ <bdi dir={lang === 'ar' ? 'rtl' : 'ltr'}>{state.lastError}</bdi>
          </p>
        )}
      </div>

      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium" htmlFor="lp-acc-a">{lang === 'ar' ? 'السطر الأول — الحساب' : 'Line 1 — account'}</label>
          <select id="lp-acc-a" className={inputCls} value={lineA.account_id} onChange={(e) => setLineA({ ...lineA, account_id: e.target.value })}>
            {state.accounts.map((a) => (
              <option key={a.id} value={a.id}>{accountLabel(a.id)} ({a.currency})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium" htmlFor="lp-acc-b">{lang === 'ar' ? 'السطر الثاني — الحساب' : 'Line 2 — account'}</label>
          <select id="lp-acc-b" className={inputCls} value={lineB.account_id} onChange={(e) => setLineB({ ...lineB, account_id: e.target.value })}>
            {state.accounts.map((a) => (
              <option key={a.id} value={a.id}>{accountLabel(a.id)} ({a.currency})</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs font-medium" htmlFor="lp-deb-a">{lang === 'ar' ? 'مدين (ج.م)' : 'Debit (EGP)'}</label>
          <label className="text-xs font-medium" htmlFor="lp-cred-a">{lang === 'ar' ? 'دائن (ج.م)' : 'Credit (EGP)'}</label>
          <input id="lp-deb-a" inputMode="decimal" dir="ltr" className={inputCls} value={lineA.debit_minor} onChange={(e) => setLineA({ ...lineA, debit_minor: e.target.value })} />
          <input id="lp-cred-a" inputMode="decimal" dir="ltr" className={inputCls} value={lineA.credit_minor} onChange={(e) => setLineA({ ...lineA, credit_minor: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs font-medium" htmlFor="lp-deb-b">{lang === 'ar' ? 'مدين (ج.م)' : 'Debit (EGP)'}</label>
          <label className="text-xs font-medium" htmlFor="lp-cred-b">{lang === 'ar' ? 'دائن (ج.م)' : 'Credit (EGP)'}</label>
          <input id="lp-deb-b" inputMode="decimal" dir="ltr" className={inputCls} value={lineB.debit_minor} onChange={(e) => setLineB({ ...lineB, debit_minor: e.target.value })} />
          <input id="lp-cred-b" inputMode="decimal" dir="ltr" className={inputCls} value={lineB.credit_minor} onChange={(e) => setLineB({ ...lineB, credit_minor: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium" htmlFor="lp-memo">{lang === 'ar' ? 'البيان' : 'Memo'}</label>
          <input id="lp-memo" dir="auto" className={inputCls} value={memo} onChange={(e) => setMemo(e.target.value)} placeholder={lang === 'ar' ? 'مثال: إيداع نقدي' : 'e.g. cash deposit'} />
        </div>
        <div className="flex gap-2 sm:col-span-2">
          <button type="submit" className="min-h-[44px] rounded-lg bg-teal-700 px-4 text-white hover:bg-teal-800">
            {lang === 'ar' ? 'ترحيل القيد' : 'Post entry'}
          </button>
          <button type="button" className="min-h-[44px] rounded-lg border border-slate-300 px-4 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800" onClick={() => dispatch({ type: 'preset' })}>
            {t('simulators.reset')}
          </button>
        </div>
      </form>

      <h3 className="mt-6 text-sm font-semibold">{lang === 'ar' ? 'الأرصدة' : 'Balances'}</h3>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full min-w-[24rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-300 dark:border-slate-700">
              <th className="p-2 text-start">{lang === 'ar' ? 'الحساب' : 'Account'}</th>
              <th className="p-2 text-start">{lang === 'ar' ? 'العملة' : 'Currency'}</th>
              <th className="p-2 text-start">{lang === 'ar' ? 'الرصيد' : 'Balance'}</th>
            </tr>
          </thead>
          <tbody>
            {state.accounts.map((a) => (
              <tr key={a.id} className="border-b border-slate-200 dark:border-slate-800">
                <td className="p-2">{accountLabel(a.id)}</td>
                <td className="p-2"><bdi dir="ltr">{a.currency}</bdi></td>
                <td className="p-2">{money(a.balance_minor, a.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="mt-4 text-sm font-semibold">{lang === 'ar' ? 'ميزان المراجعة' : 'Trial balance'}</h3>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full min-w-[24rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-300 dark:border-slate-700">
              <th className="p-2 text-start">{lang === 'ar' ? 'العملة' : 'Currency'}</th>
              <th className="p-2 text-start">{lang === 'ar' ? 'مجموع المدين' : 'Total debits'}</th>
              <th className="p-2 text-start">{lang === 'ar' ? 'مجموع الدائن' : 'Total credits'}</th>
              <th className="p-2 text-start">{lang === 'ar' ? 'متوازن؟' : 'Balanced?'}</th>
            </tr>
          </thead>
          <tbody>
            {tb.map((r) => (
              <tr key={r.currency} className="border-b border-slate-200 dark:border-slate-800">
                <td className="p-2"><bdi dir="ltr">{r.currency}</bdi></td>
                <td className="p-2">{money(r.debits_minor, r.currency)}</td>
                <td className="p-2">{money(r.credits_minor, r.currency)}</td>
                <td className="p-2">{r.balanced ? '✓' : '✗'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="mt-4 text-sm font-semibold">{lang === 'ar' ? 'دفتر اليومية' : 'Journal'}</h3>
      <ol className="mt-2 flex flex-col gap-2">
        {state.postings.map((p) => (
          <li key={p.id} className="flex items-center gap-2 rounded-lg border border-slate-200 p-2 text-sm dark:border-slate-800">
            <bdi dir="ltr">#{p.id}</bdi>
            <span className="min-w-0 flex-1 truncate">
              <bdi dir="auto">{p.memo}</bdi>
              {' '}
              {p.lines.map((l) => `${l.account_id} ${l.debit_minor ? `D${l.debit_minor}` : `C${l.credit_minor}`}`).join(' · ')}
            </span>
            {p.reversed_by !== null && <span className="text-xs text-slate-400" dir="ltr">⇄ #{p.reversed_by}</span>}
            {p.reversed_by === null && (
              <button
                type="button"
                className="min-h-[44px] rounded border border-amber-400 px-2 text-xs text-amber-700 hover:bg-amber-50 dark:border-amber-600 dark:text-amber-400"
                onClick={() => dispatch({ type: 'reverse', postingId: p.id })}
              >
                {lang === 'ar' ? 'قيد عكسي' : 'Reverse'}
              </button>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
