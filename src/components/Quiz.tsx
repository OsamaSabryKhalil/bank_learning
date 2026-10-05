import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../stores/settings';
import { useProgress } from '../stores/progress';
import type { QuizQuestion } from '../lib/content-types';
import { RichText } from './RichText';

/** Deterministic shuffle per lesson so reruns are stable but positions vary. */
function shuffle<T>(arr: T[], seed: number): T[] {
  const out = [...arr];
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) % 2147483648;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

export default function Quiz({ lessonId, questions }: { lessonId: string; questions: QuizQuestion[] }) {
  const { t } = useTranslation();
  const lang = useSettings((s) => s.lang);
  const numerals = useSettings((s) => s.numerals);
  const recordQuiz = useProgress((s) => s.recordQuiz);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const q = questions[idx];
  // shuffle options at runtime; track which original index each shown option is
  const options = useMemo(
    () => (q ? shuffle(q.options.map((o, i) => ({ o, i })), idx * 31 + lessonId.length * 7 + 13) : []),
    [q, idx, lessonId],
  );

  if (!q) return null;

  const firstTerms = new Set<string>();

  const check = () => {
    if (selected === null) return;
    setChecked(true);
    if (selected === q.answer_index) setScore((s) => s + 1);
  };

  const next = () => {
    if (idx + 1 >= questions.length) {
      recordQuiz(lessonId, score, questions.length);
      setDone(true);
    } else {
      setIdx((i) => i + 1);
      setSelected(null);
      setChecked(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-xl border border-slate-200 p-6 text-center dark:border-slate-800">
        <p className="text-lg font-semibold">
          {t('quiz.score')}: {score}/{questions.length}
        </p>
        <button
          type="button"
          className="mt-4 min-h-[44px] rounded-lg bg-teal-700 px-4 text-white hover:bg-teal-800"
          onClick={() => {
            setIdx(0); setSelected(null); setChecked(false); setScore(0); setDone(false);
          }}
        >
          {t('quiz.restart')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-500">
        {t('quiz.question', { number: idx + 1 })} — {q.type === 'scenario' ? t('quiz.scenario') : t('quiz.single')}
      </p>
      <fieldset>
        <legend className="text-base font-medium">
          <RichText text={q.question[lang]} firstTerms={firstTerms} />
        </legend>
        <div className="mt-3 flex flex-col gap-2">
          {options.map(({ o, i }, pos) => (
            <label
              key={pos}
              className={`flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg border p-3 ${
                checked && i === q.answer_index
                  ? 'border-green-600 bg-green-50 dark:bg-green-950'
                  : checked && selected === i
                    ? 'border-red-500 bg-red-50 dark:bg-red-950'
                    : 'border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800'
              }`}
            >
              <input
                type="radio"
                name={`q-${idx}`}
                className="size-5"
                checked={selected === i}
                disabled={checked}
                onChange={() => setSelected(i)}
              />
              <span>
                <RichText text={o[lang]} firstTerms={firstTerms} />
              </span>
              {checked && i === q.answer_index && <span aria-hidden="true" className="ms-auto">✓</span>}
              {checked && selected === i && i !== q.answer_index && <span aria-hidden="true" className="ms-auto">✗</span>}
            </label>
          ))}
        </div>
      </fieldset>
      {!checked ? (
        <button
          type="button"
          disabled={selected === null}
          className="w-fit min-h-[44px] rounded-lg bg-teal-700 px-4 text-white enabled:hover:bg-teal-800 disabled:opacity-50"
          onClick={check}
        >
          {t('quiz.check')}
        </button>
      ) : (
        <>
          <div
            role="status"
            className={`rounded-lg p-3 text-sm ${
              selected === q.answer_index
                ? 'bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-300'
                : 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-300'
            }`}
          >
            <p className="font-semibold">
              {selected === q.answer_index ? `✓ ${t('quiz.correct')}` : `✗ ${t('quiz.incorrect')}`}
            </p>
            <p className="mt-1">
              <strong>{t('quiz.explanation')}:</strong>{' '}
              <RichText text={q.explanation[lang]} firstTerms={firstTerms} />
            </p>
          </div>
          <button
            type="button"
            className="w-fit min-h-[44px] rounded-lg bg-teal-700 px-4 text-white hover:bg-teal-800"
            onClick={next}
          >
            {t('quiz.next')}
          </button>
        </>
      )}
      <p className="sr-only" aria-live="polite">
        {checked ? (selected === q.answer_index ? t('quiz.correct') : t('quiz.incorrect')) : ''}
      </p>
      {numerals === 'arabic-indic' && <span className="sr-only">{`٠١٢٣٤٥٦٧٨٩`}</span>}
    </div>
  );
}
