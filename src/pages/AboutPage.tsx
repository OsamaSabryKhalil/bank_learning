import { useTranslation } from 'react-i18next';
import { curriculum, glossary, publishedLessons } from '../lib/content';
import { useSettings } from '../stores/settings';

export default function AboutPage() {
  const { t } = useTranslation();
  const lang = useSettings((s) => s.lang);

  const published = publishedLessons();
  const diagrams = published.reduce((a, l) => a + l.diagrams.length, 0);
  const buildDate = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_BUILD_DATE ?? '';
  const version = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_APP_VERSION ?? '0.1.0';

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-bold">{t('about.title')}</h1>
      <p className="text-slate-600 dark:text-slate-300">{t('app.tagline')}</p>

      <section className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
        <h2 className="font-semibold">{t('about.version')}</h2>
        <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
          <dt>{t('about.version')}</dt>
          <dd dir="ltr">{version}</dd>
          <dt>{t('about.build_date')}</dt>
          <dd dir="ltr">{buildDate || 'dev'}</dd>
          <dt>{t('about.content_version')}</dt>
          <dd dir="ltr">{curriculum.version}</dd>
        </dl>
      </section>

      <section className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
        <h2 className="font-semibold">{t('about.counts')}</h2>
        <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
          <dt>{t('about.lessons')}</dt>
          <dd>{published.length}</dd>
          <dt>{t('about.terms')}</dt>
          <dd>{glossary.length}</dd>
          <dt>{t('about.diagrams')}</dt>
          <dd>{diagrams}</dd>
        </dl>
      </section>

      <section className="rounded-xl border border-slate-200 p-4 text-sm dark:border-slate-800">
        <h2 className="font-semibold">{t('about.licenses')}</h2>
        <ul className="mt-2 list-inside list-disc space-y-1" dir="ltr">
          <li>React, React DOM, React Router, Zustand, idb-keyval, i18next, react-i18next, FlexSearch — MIT</li>
          <li>Vite, Vitest, Tailwind CSS, TypeScript, ESLint, ajv, fast-check, vite-plugin-pwa — MIT</li>
          <li>Inter — SIL OFL 1.1</li>
          <li>IBM Plex Sans Arabic — SIL OFL 1.1</li>
          <li>JetBrains Mono — SIL OFL 1.1</li>
        </ul>
        <p className="mt-3 text-xs text-slate-500">
          {lang === 'ar' ? 'ملفات التراخيص الكاملة مرفقة في حزمة الإصدار.' : 'Full license files ship in the release package.'}
        </p>
      </section>

      <section className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-700 dark:bg-amber-950">
        <p>{t('app.educational_disclaimer')}</p>
      </section>
    </div>
  );
}
