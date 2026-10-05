import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { curriculum, getLesson, isPublished } from '../lib/content';
import { useSettings } from '../stores/settings';
import { useProgress } from '../stores/progress';
import { formatInt } from '../lib/money';
import { RichText, BiText, makeFirstTerms } from '../components/RichText';
import { CodeBlockView, LedgerTableView } from '../components/CodeBlock';
import { WrongRightPanel, DiagramSvg } from '../components/Diagram';
import Quiz from '../components/Quiz';
import LedgerPlayground from '../simulators/LedgerPlayground';
import type { Diagram } from '../lib/content-types';

const TABS = ['explain', 'analogies', 'wrong_right', 'diagrams', 'quiz', 'exercise'] as const;
type Tab = (typeof TABS)[number];

/** Per-diagram custom SVG node layout (language-neutral structure + labels). */
function DiagramView({ diagram }: { diagram: Diagram }) {
  const lang = useSettings((s) => s.lang);
  // The golden lesson uses small flow diagrams; nodes are derived from labels.
  const keys = Object.keys(diagram.labels ?? {});
  const nodes = keys.slice(0, 6).map((key, i, arr) => ({
    x: 20 + (i % 2) * 280,
    y: 20 + Math.floor(i / 2) * 90,
    w: 240,
    key,
    tone: key.startsWith('wrong')
      ? ('bad' as const)
      : key.startsWith('right')
        ? ('good' as const)
        : key.startsWith('flow') || key.startsWith('dep')
          ? ('accent' as const)
          : undefined,
  }));
  const arrows = keys.length > 1
    ? nodes.slice(1).map((_, i) => ({ from: i, to: i + 1 }))
    : [];
  void lang;
  return <DiagramSvg diagram={diagram} nodes={nodes} arrows={arrows} />;
}

export default function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const lang = useSettings((s) => s.lang);
  const numerals = useSettings((s) => s.numerals);
  const lesson = id ? getLesson(id) : undefined;
  const completed = useProgress((s) => s.completedLessons);
  const markComplete = useProgress((s) => s.markComplete);
  const setLastLesson = useProgress((s) => s.setLastLesson);
  const bookmarks = useProgress((s) => s.bookmarks);
  const toggleBookmark = useProgress((s) => s.toggleBookmark);
  const [tab, setTab] = useState<Tab>('explain');

  useEffect(() => {
    if (id) setLastLesson(id);
  }, [id, setLastLesson]);

  const firstTerms = useMemo(() => (lesson ? makeFirstTerms(lesson.glossary_terms) : new Set<string>()), [lesson]);

  if (!id || !lesson) {
    return (
      <div>
        <h1 className="text-2xl font-bold">{t('lesson.not_found')}</h1>
        <Link to="/curriculum" className="mt-4 inline-block text-teal-700 underline">
          {t('nav.curriculum')}
        </Link>
      </div>
    );
  }
  if (!isPublished(lesson.id)) {
    return (
      <div>
        <h1 className="text-2xl font-bold">{lesson.title[lang]}</h1>
        <p className="mt-4 text-slate-600 dark:text-slate-300">{t('lesson.planned')}</p>
        <Link to="/curriculum" className="mt-4 inline-block text-teal-700 underline">
          {t('nav.curriculum')}
        </Link>
      </div>
    );
  }

  const tabLabels: Record<Tab, string> = {
    explain: t('lesson.tabs.explain'),
    analogies: t('lesson.tabs.analogies'),
    wrong_right: t('lesson.tabs.wrong_right'),
    diagrams: t('lesson.tabs.diagrams'),
    quiz: t('lesson.tabs.quiz'),
    exercise: t('lesson.tabs.exercise'),
  };

  const isDone = completed.includes(lesson.id);

  return (
    <article className="max-w-3xl">
      <header>
        <p className="text-xs font-semibold uppercase text-teal-700 dark:text-teal-300">
          {t('progress.current_module')} {lesson.module} · {lesson.difficulty} ·{' '}
          {t('lesson.minutes', { count: lesson.estimated_minutes })}
        </p>
        <h1 className="mt-1 text-2xl font-bold">{lesson.title[lang]}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
          <button
            type="button"
            onClick={() => toggleBookmark(lesson.id)}
            aria-pressed={bookmarks.includes(lesson.id)}
            className="min-h-[44px] rounded-lg border border-slate-300 px-3 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            {bookmarks.includes(lesson.id) ? '★' : '☆'}
          </button>
          <span className="text-slate-500">
            {t('lesson.reviewed_as_of')} <bdi dir="ltr">{lesson.content_reviewed_as_of}</bdi>
          </span>
        </div>
      </header>

      {/* Tabs */}
      <div role="tablist" aria-label={t('nav.curriculum')} className="mt-6 flex flex-wrap gap-1 border-b border-slate-200 dark:border-slate-800">
        {TABS.map((tb) => (
          <button
            key={tb}
            role="tab"
            aria-selected={tab === tb}
            onClick={() => setTab(tb)}
            className={`min-h-[44px] rounded-t-lg px-3 text-sm ${
              tab === tb
                ? 'border-b-2 border-teal-700 font-semibold text-teal-800 dark:text-teal-300'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tabLabels[tb]}
          </button>
        ))}
      </div>

      <div className="mt-6" role="tabpanel">
        {tab === 'explain' && (
          <>
            <section>
              <h2 className="text-lg font-semibold">{t('lesson.objectives')}</h2>
              <ul className="mt-2 list-inside list-disc space-y-1">
                {lesson.learning_objectives.map((o, i) => (
                  <li key={i}><BiText value={o} firstTerms={firstTerms} /></li>
                ))}
              </ul>
            </section>
            <section className="mt-6">
              <h2 className="text-lg font-semibold">{t('lesson.plain_summary')}</h2>
              <p className="mt-2"><BiText value={lesson.plain_summary} firstTerms={firstTerms} /></p>
            </section>
            <section className="mt-6">
              <h2 className="text-lg font-semibold">{t('lesson.why_matters')}</h2>
              <p className="mt-2"><BiText value={lesson.why_it_matters_in_banking} firstTerms={firstTerms} /></p>
            </section>
            <section className="mt-6">
              <h2 className="text-lg font-semibold">{t('lesson.key_concepts')}</h2>
              <dl className="mt-2 flex flex-col gap-3">
                {lesson.key_concepts.map((kc, i) => (
                  <div key={i} className="rounded-lg bg-slate-100 p-3 dark:bg-slate-800">
                    <dt className="font-medium"><BiText value={{ en: kc.term_id, ar: kc.term_id }} firstTerms={firstTerms} /></dt>
                    <dd className="mt-1 text-sm"><BiText value={kc.definition} firstTerms={firstTerms} /></dd>
                  </div>
                ))}
              </dl>
            </section>
            <section className="mt-6">
              <h2 className="text-lg font-semibold">{t('lesson.common_mistakes')}</h2>
              <ul className="mt-2 list-inside list-disc space-y-1">
                {lesson.common_mistakes.map((m, i) => (
                  <li key={i}><BiText value={m} firstTerms={firstTerms} /></li>
                ))}
              </ul>
            </section>
            <section className="mt-6">
              <h2 className="text-lg font-semibold">{t('lesson.checklist')}</h2>
              <ul className="mt-2 list-inside space-y-1">
                {lesson.checklist_for_production.map((c, i) => (
                  <li key={i}><span aria-hidden="true">☐ </span><BiText value={c} firstTerms={firstTerms} /></li>
                ))}
              </ul>
            </section>
            <section className="mt-6">
              <h2 className="text-lg font-semibold">{t('lesson.cheat_sheet')}</h2>
              <ul className="mt-2 list-inside space-y-1 rounded-xl border border-teal-200 bg-teal-50 p-4 dark:border-teal-800 dark:bg-teal-950">
                {lesson.cheat_sheet.map((c, i) => (
                  <li key={i}><BiText value={c} firstTerms={firstTerms} /></li>
                ))}
              </ul>
            </section>
          </>
        )}

        {tab === 'analogies' && (
          <>
            <section>
              <h2 className="text-lg font-semibold">{t('lesson.analogies')}</h2>
              <div className="mt-3 flex flex-col gap-4">
                {lesson.real_life_analogies.map((a, i) => (
                  <div key={i} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                    <p><BiText value={a.analogy} firstTerms={firstTerms} /></p>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                      <strong>{t('lesson.maps_to')}:</strong> <BiText value={a.maps_to} firstTerms={firstTerms} />
                    </p>
                    <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
                      <strong>{t('lesson.where_it_breaks')}:</strong> <BiText value={a.where_it_breaks} firstTerms={firstTerms} />
                    </p>
                  </div>
                ))}
              </div>
            </section>
            <section className="mt-6">
              <h2 className="text-lg font-semibold">{t('lesson.worked_examples')}</h2>
              {lesson.worked_examples.map((ex, i) => (
                <div key={i} className="mt-4 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                  <h3 className="font-semibold"><BiText value={ex.title} firstTerms={firstTerms} /></h3>
                  <ol className="mt-2 list-inside list-decimal space-y-1 text-sm">
                    {ex.steps.map((s, j) => (
                      <li key={j}><BiText value={s} firstTerms={firstTerms} /></li>
                    ))}
                  </ol>
                  {ex.ledger_tables.map((lt, j) => (
                    <div key={j} className="mt-3"><LedgerTableView table={lt} /></div>
                  ))}
                  <p className="mt-3 text-sm"><strong>{t('lesson.takeaway')}:</strong> <BiText value={ex.takeaway} firstTerms={firstTerms} /></p>
                </div>
              ))}
            </section>
            <section className="mt-6">
              <h2 className="text-lg font-semibold">{t('lesson.incident_stories')}</h2>
              {lesson.incident_stories.map((st, i) => (
                <div key={i} className="mt-4 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                  <h3 className="font-semibold"><BiText value={st.title} firstTerms={firstTerms} /></h3>
                  <ol className="mt-2 space-y-1 text-sm">
                    {st.timeline.map((tl, j) => (
                      <li key={j} className="flex gap-2">
                        <bdi className="shrink-0 font-mono text-xs text-teal-700 dark:text-teal-300" dir="ltr">[{tl.t}]</bdi>
                        <span><BiText value={tl.text} firstTerms={firstTerms} /></span>
                      </li>
                    ))}
                  </ol>
                  <p className="mt-2 text-sm"><strong>{t('lesson.root_cause')}:</strong> <BiText value={st.root_cause} firstTerms={firstTerms} /></p>
                  <p className="mt-1 text-sm"><strong>{t('lesson.how_detected')}:</strong> <BiText value={st.how_it_was_detected} firstTerms={firstTerms} /></p>
                  <p className="mt-1 text-sm"><strong>{t('lesson.fix')}:</strong> <BiText value={st.fix} firstTerms={firstTerms} /></p>
                </div>
              ))}
            </section>
          </>
        )}

        {tab === 'wrong_right' && (
          <>
            <WrongRightPanel
              wrong={
                <>
                  <p className="text-sm"><BiText value={lesson.wrong_behavior.scenario} firstTerms={firstTerms} /></p>
                  <div className="mt-3"><CodeBlockView block={lesson.wrong_behavior.code_block} /></div>
                  <ol className="mt-3 list-inside list-decimal space-y-1 text-sm">
                    {lesson.wrong_behavior.what_goes_wrong_step_by_step.map((s, i) => (
                      <li key={i}><BiText value={s} firstTerms={firstTerms} /></li>
                    ))}
                  </ol>
                  <p className="mt-2 text-sm font-medium">{t('lesson.real_world_consequences')}</p>
                  <ul className="mt-1 list-inside list-disc space-y-1 text-sm">
                    {lesson.wrong_behavior.real_world_consequences.map((s, i) => (
                      <li key={i}><BiText value={s} firstTerms={firstTerms} /></li>
                    ))}
                  </ul>
                </>
              }
              right={
                <>
                  <p className="text-sm"><BiText value={lesson.right_behavior.correct_design} firstTerms={firstTerms} /></p>
                  <div className="mt-3"><CodeBlockView block={lesson.right_behavior.code_block} /></div>
                  <p className="mt-2 text-sm font-medium">{lang === 'ar' ? 'لماذا يعمل:' : 'Why it works:'}</p>
                  <ul className="mt-1 list-inside list-disc space-y-1 text-sm">
                    {lesson.right_behavior.why_it_works.map((s, i) => (
                      <li key={i}><BiText value={s} firstTerms={firstTerms} /></li>
                    ))}
                  </ul>
                  <p className="mt-2 text-sm font-medium">{lang === 'ar' ? 'المقايضات:' : 'Trade-offs:'}</p>
                  <ul className="mt-1 list-inside list-disc space-y-1 text-sm">
                    {lesson.right_behavior.trade_offs.map((s, i) => (
                      <li key={i}><BiText value={s} firstTerms={firstTerms} /></li>
                    ))}
                  </ul>
                </>
              }
            />
            {lesson.jurisdiction_notes.length > 0 && (
              <section className="mt-6">
                <h2 className="text-lg font-semibold">{t('lesson.jurisdiction_notes')}</h2>
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                  {lesson.jurisdiction_notes.map((j, i) => (
                    <li key={i}><BiText value={j} firstTerms={firstTerms} /></li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}

        {tab === 'diagrams' && (
          <div className="flex flex-col gap-6">
            {lesson.diagrams.map((d) => (
              <DiagramView key={d.id} diagram={d} />
            ))}
          </div>
        )}

        {tab === 'quiz' && (
          <Quiz lessonId={lesson.id} questions={lesson.quiz} />
        )}

        {tab === 'exercise' && (
          <>
            <p><BiText value={lesson.hands_on_exercise.task} firstTerms={firstTerms} /></p>
            <div className="mt-4"><CodeBlockView block={lesson.hands_on_exercise.starter} /></div>
            <details className="mt-4 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
              <summary className="cursor-pointer font-medium">
                {lang === 'ar' ? 'الحل' : 'Solution'}
              </summary>
              <div className="mt-3"><CodeBlockView block={lesson.hands_on_exercise.solution} /></div>
            </details>
            {lesson.hands_on_exercise.tests.length > 0 && (
              <ul className="mt-4 list-inside list-disc space-y-1 text-sm">
                {lesson.hands_on_exercise.tests.map((ts, i) => (
                  <li key={i}><BiText value={ts.description} firstTerms={firstTerms} /></li>
                ))}
              </ul>
            )}
            {lesson.simulator_ids.length > 0 && (
              <section className="mt-8">
                <h2 className="text-lg font-semibold">{t('lesson.simulators_in_lesson')}</h2>
                {lesson.simulator_ids.includes('ledger-playground') && (
                  <div className="mt-4"><LedgerPlayground /></div>
                )}
              </section>
            )}
          </>
        )}
      </div>

      <footer className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-4 dark:border-slate-800">
        <button
          type="button"
          onClick={() => markComplete(lesson.id)}
          disabled={isDone}
          className={`min-h-[44px] rounded-lg px-4 font-medium text-white ${
            isDone ? 'bg-green-700' : 'bg-teal-700 enabled:hover:bg-teal-800'
          }`}
        >
          {isDone ? `✓ ${t('progress.completed')}` : t('progress.completed')}
        </button>
        <nav className="flex gap-4 text-sm" aria-label="pager">
          {lesson.prerequisites.length > 0 && (
            <span>
              {t('lesson.prerequisites')}:{' '}
              {lesson.prerequisites.map((p, i) => (
                <span key={p}>
                  {i > 0 && ' · '}
                  <Link to={`/lesson/${p}`} className="underline-offset-2 hover:underline">{p}</Link>
                </span>
              ))}
            </span>
          )}
          {lesson.next_lessons.length > 0 && (
            <span>
              {t('lesson.next_lessons')}:{' '}
              {lesson.next_lessons.map((p, i) => (
                <span key={p}>
                  {i > 0 && ' · '}
                  <Link to={`/lesson/${p}`} className="underline-offset-2 hover:underline">{p}</Link>
                </span>
              ))}
            </span>
          )}
        </nav>
      </footer>
      <p className="sr-only" aria-live="polite">
        {formatInt(lesson.estimated_minutes, lang, numerals)}
      </p>
    </article>
  );
}
