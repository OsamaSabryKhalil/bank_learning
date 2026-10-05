import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { curriculum, publishedLessons } from '../lib/content';
import { useProgress } from '../stores/progress';
import { useSettings } from '../stores/settings';

export default function HomePage() {
  const { t } = useTranslation();
  const lang = useSettings((s) => s.lang);
  const completed = useProgress((s) => s.completedLessons);
  const lastLesson = useProgress((s) => s.lastLesson);

  const published = publishedLessons();
  const totalMinutes = published.reduce((a, l) => a + l.estimated_minutes, 0);
  const remainingMinutes = published
    .filter((l) => !completed.includes(l.id))
    .reduce((a, l) => a + l.estimated_minutes, 0);

  // current module = first module with an incomplete published lesson
  let currentModule = curriculum.modules[0];
  for (const m of curriculum.modules) {
    const pub = m.lessons.filter((l) => l.status === 'published');
    if (pub.some((l) => !completed.includes(l.id))) {
      currentModule = m;
      break;
    }
  }

  const pct = published.length ? Math.round((completed.length / published.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-3xl font-bold text-teal-800 dark:text-teal-300">{t('app.title')}</h1>
        <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-300">{t('app.tagline')}</p>
      </section>

      <section aria-labelledby="progress-title" className="rounded-xl border border-slate-200 p-5 dark:border-slate-800">
        <h2 id="progress-title" className="text-xl font-semibold">
          {t('progress.title')}
        </h2>
        <div className="mt-4">
          <div
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${pct}% ${t('progress.completed')}`}
            className="h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
          >
            <div className="h-full rounded-full bg-teal-600" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            {t('progress.lessons_done', { count: completed.length })} — {pct}%
          </p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {t('progress.current_module')}: <strong>{currentModule?.title[lang]}</strong>
          </p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {t('progress.time_remaining')}: {t('progress.minutes', { count: remainingMinutes })} /{' '}
            {t('progress.minutes', { count: totalMinutes })}
          </p>
          {lastLesson && (
            <Link
              to={`/lesson/${lastLesson}`}
              className="mt-4 inline-block rounded-lg bg-teal-700 px-4 py-2 text-white hover:bg-teal-800"
            >
              ▶ {t('progress.continue')}
            </Link>
          )}
        </div>
      </section>

      <section aria-labelledby="roadmap-title">
        <h2 id="roadmap-title" className="text-xl font-semibold">
          {t('nav.curriculum')}
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {curriculum.modules.map((m) => {
            const pub = m.lessons.filter((l) => l.status === 'published').length;
            return (
              <Link
                key={m.id}
                to="/curriculum"
                className="rounded-xl border border-slate-200 p-4 hover:border-teal-600 dark:border-slate-800"
              >
                <p className="text-xs font-semibold text-slate-400">{m.id}</p>
                <p className="mt-1 font-medium">{m.title[lang]}</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {pub}/{m.lessons.length}
                </p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
