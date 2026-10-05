import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../stores/settings';
import { useProgress } from '../stores/progress';
import { formatInt } from '../lib/money';

export default function SettingsPage() {
  const { t } = useTranslation();
  const settings = useSettings();
  const progress = useProgress();
  const [storageInfo, setStorageInfo] = useState<{ persisted: boolean; usage: number | null }>({
    persisted: false,
    usage: null,
  });

  useEffect(() => {
    void navigator.storage?.persisted?.().then((persisted) =>
      setStorageInfo((s) => ({ ...s, persisted })),
    );
    void navigator.storage?.estimate?.().then((est) =>
      setStorageInfo((s) => ({ ...s, usage: est.usage ?? null })),
    );
  }, []);

  const exportData = () => {
    const payload = JSON.stringify(
      { settings: settings.export(), learner: progress.exportAll() },
      null,
      2,
    );
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bank-academy-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (file: File) => {
    void file.text().then((txt) => {
      try {
        const data = JSON.parse(txt) as {
          settings?: ReturnType<typeof settings.export>;
          learner?: ReturnType<typeof progress.exportAll>;
        };
        if (data.settings) settings.update(data.settings);
        if (data.learner) progress.importAll(data.learner);
      } catch {
        alert(t('search.no_results')); // invalid file: generic failure notice
      }
    });
  };

  const resetAll = () => {
    if (window.confirm(t('settings.reset_confirm'))) progress.resetAll();
  };

  const fmtBytes = (n: number) => {
    if (n > 1024 * 1024) return `${formatInt(Math.round(n / 1024 / 1024), settings.lang)} MB`;
    return `${formatInt(Math.round(n / 1024), settings.lang)} KB`;
  };

  const label = 'block text-sm font-medium mb-1';
  const input = 'min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-900';

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <h1 className="text-2xl font-bold">{t('settings.title')}</h1>

      <fieldset>
        <legend className={label}>{t('settings.language')}</legend>
        <select
          className={input}
          value={settings.lang}
          onChange={(e) => settings.update({ lang: e.target.value as 'en' | 'ar' })}
        >
          <option value="en">English</option>
          <option value="ar">العربية</option>
        </select>
      </fieldset>

      <fieldset>
        <legend className={label}>{t('settings.theme')}</legend>
        <select
          className={input}
          value={settings.theme}
          onChange={(e) => settings.update({ theme: e.target.value as 'light' | 'dark' | 'system' })}
        >
          <option value="light">{t('settings.theme_light')}</option>
          <option value="dark">{t('settings.theme_dark')}</option>
          <option value="system">{t('settings.theme_system')}</option>
        </select>
      </fieldset>

      <fieldset>
        <legend className={label}>{t('settings.numerals')}</legend>
        <select
          className={input}
          value={settings.numerals}
          onChange={(e) =>
            settings.update({ numerals: e.target.value as 'western' | 'arabic-indic' })
          }
        >
          <option value="western">{t('settings.numerals_western')}</option>
          <option value="arabic-indic">{t('settings.numerals_arabic')}</option>
        </select>
      </fieldset>

      <fieldset>
        <legend className={label}>{t('settings.text_size')}</legend>
        <select
          className={input}
          value={settings.textSize}
          onChange={(e) =>
            settings.update({ textSize: e.target.value as 'normal' | 'large' | 'xlarge' })
          }
        >
          <option value="normal">100%</option>
          <option value="large">115%</option>
          <option value="xlarge">130%</option>
        </select>
      </fieldset>

      <label className="flex items-center gap-3 text-sm font-medium">
        <input
          type="checkbox"
          className="size-6"
          checked={settings.reduceMotion}
          onChange={(e) => settings.update({ reduceMotion: e.target.checked })}
        />
        {t('settings.reduce_motion')}
      </label>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t('settings.storage')}</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {storageInfo.persisted ? t('settings.storage_persisted') : t('settings.storage_not_persisted')}
          {storageInfo.usage !== null && (
            <> — {t('settings.storage_usage', { used: fmtBytes(storageInfo.usage) })}</>
          )}
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t('progress.title')}</h2>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={exportData} className="min-h-[44px] rounded-lg bg-teal-700 px-4 text-white hover:bg-teal-800">
            {t('settings.export')}
          </button>
          <label className="min-h-[44px] cursor-pointer rounded-lg border border-slate-300 px-4 py-2.5 leading-7 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
            {t('settings.import')}
            <input
              type="file"
              accept="application/json"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importData(f);
              }}
            />
          </label>
          <button type="button" onClick={resetAll} className="min-h-[44px] rounded-lg border border-red-300 px-4 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950">
            {t('settings.reset')}
          </button>
        </div>
      </section>
    </div>
  );
}
