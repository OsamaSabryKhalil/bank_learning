import { useTranslation } from 'react-i18next';
import { curriculum, getLesson } from '../lib/content';
import { useSettings } from '../stores/settings';
import LedgerPlayground from '../simulators/LedgerPlayground';

/** Simulators gallery: lists simulators from the curriculum's simulator_hosts. */
export default function SimulatorsPage() {
  const { t } = useTranslation();
  const lang = useSettings((s) => s.lang);
  const hosts = Object.entries(curriculum.simulator_hosts ?? {});

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{t('simulators.title')}</h1>
      <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-300">
        {t('simulators.disclaimer')}
      </p>
      <div className="flex flex-col gap-8">
        {hosts.map(([simId, lessonId]) => {
          const lesson = getLesson(lessonId);
          if (!lesson) return null;
          return (
            <section
              key={simId}
              aria-labelledby={`sim-${simId}`}
              className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"
            >
              <h2 id={`sim-${simId}`} className="text-lg font-semibold">
                {lesson.title[lang]}
              </h2>
              {simId === 'ledger-playground' ? (
                <div className="mt-4">
                  <LedgerPlayground />
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-500">
                  {t('lesson.planned')} — {lesson.title[lang]}
                </p>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
