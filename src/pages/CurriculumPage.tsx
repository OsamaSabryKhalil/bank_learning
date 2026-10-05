import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { curriculum } from '../lib/content';
import { useProgress } from '../stores/progress';
import { useSettings } from '../stores/settings';

export default function CurriculumPage() {
  const { t } = useTranslation();
  const lang = useSettings((s) => s.lang);
  const completed = useProgress((s) => s.completedLessons);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{t('nav.curriculum')}</h1>
      {curriculum.modules.map((m) => {
        const pub = m.lessons.filter((l) => l.status === 'published');
        return (
          <section
            key={m.id}
            aria-labelledby={`mod-${m.id}`}
            className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"
          >
            <h2 id={`mod-${m.id}`} className="text-lg font-semibold">
              {m.id}. {m.title[lang]}
            </h2>
            <ul className="mt-3 flex flex-col gap-2">
              {pub.map((l) => (
                <li key={l.id} className="flex items-center gap-2">
                  <span aria-hidden="true" className="text-teal-600">
                    {completed.includes(l.id) ? '✓' : '•'}
                  </span>
                  <Link to={`/lesson/${l.id}`} className="text-sm underline-offset-4 hover:underline">
                    {l.title[lang]}
                  </Link>
                  {completed.includes(l.id) && <span className="sr-only">{t('progress.completed')}</span>}
                </li>
              ))}
              {pub.length === 0 && (
                <li className="text-sm italic text-slate-400">{t('lesson.planned')}</li>
              )}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
