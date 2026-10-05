import { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../stores/settings';
import { curriculum } from '../lib/content';

function LanguageToggle() {
  const { t } = useTranslation();
  const lang = useSettings((s) => s.lang);
  const update = useSettings((s) => s.update);

  const switchTo = (next: 'en' | 'ar') => {
    if (next === lang) return;
    update({ lang: next });
    // i18n change + aria-live announcement
    void import('../i18n').then(({ default: i18n }) => {
      void i18n.changeLanguage(next);
      const live = document.getElementById('lang-live');
      if (live) live.textContent = next === 'ar' ? 'تم تغيير اللغة إلى العربية' : 'Language switched to English';
    });
  };

  return (
    <div role="group" aria-label={t('settings.language')} className="flex gap-1 rounded-lg bg-slate-200/60 p-1 dark:bg-slate-800">
      <button
        type="button"
        onClick={() => switchTo('en')}
        aria-pressed={lang === 'en'}
        className={`min-h-[44px] px-3 rounded-md text-sm font-medium ${lang === 'en' ? 'bg-white dark:bg-slate-700 shadow' : ''}`}
      >
        English
      </button>
      <button
        type="button"
        onClick={() => switchTo('ar')}
        aria-pressed={lang === 'ar'}
        className={`min-h-[44px] px-3 rounded-md text-sm font-medium ${lang === 'ar' ? 'bg-white dark:bg-slate-700 shadow' : ''}`}
      >
        العربية
      </button>
    </div>
  );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation();
  const lang = useSettings((s) => s.lang);
  return (
    <nav aria-label={t('nav.curriculum')} className="flex flex-col gap-4 overflow-y-auto">
      {curriculum.modules.map((m) => (
        <div key={m.id}>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {m.id}. {m.title[lang]}
          </p>
          <ul className="flex flex-col gap-1">
            {m.lessons
              .filter((l) => l.status === 'published')
              .map((l) => (
                <li key={l.id}>
                  <NavLink
                    to={`/lesson/${l.id}`}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      `block rounded-md px-2 py-1.5 text-sm ${
                        isActive
                          ? 'bg-teal-700 text-white'
                          : 'hover:bg-slate-200 dark:hover:bg-slate-800'
                      }`
                    }
                  >
                    {l.title[lang]}
                  </NavLink>
                </li>
              ))}
            {m.lessons.every((l) => l.status !== 'published') && (
              <li className="px-2 py-1 text-xs italic text-slate-400 dark:text-slate-500">
                {m.title[lang]} — {t('lesson.planned')}
              </li>
            )}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const links: { to: string; label: string }[] = [
    { to: '/', label: t('nav.home') },
    { to: '/curriculum', label: t('nav.curriculum') },
    { to: '/glossary', label: t('nav.glossary') },
    { to: '/simulators', label: t('nav.simulators') },
    { to: '/search', label: t('nav.search') },
    { to: '/settings', label: t('nav.settings') },
    { to: '/about', label: t('nav.about') },
  ];

  return (
    <div className="min-h-screen">
      <div id="lang-live" aria-live="polite" className="sr-only" />
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2">
          <button
            type="button"
            className="md:hidden min-h-[44px] min-w-[44px] rounded-md hover:bg-slate-200 dark:hover:bg-slate-800"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? t('nav.close') : t('nav.menu')}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link to="/" className="flex items-center gap-2 font-bold text-teal-800 dark:text-teal-300">
            <img src="/icon.svg" alt="" width="28" height="28" aria-hidden="true" />
            <span>{t('app.title')}</span>
          </Link>
          <nav aria-label={t('nav.menu')} className="ms-2 hidden flex-1 gap-1 md:flex">
            {links.slice(0, 5).map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm ${
                    isActive
                      ? 'bg-teal-700 text-white'
                      : 'hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="ms-auto flex items-center gap-2">
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `hidden rounded-md px-3 py-2 text-sm md:block ${
                  isActive ? 'bg-teal-700 text-white' : 'hover:bg-slate-200 dark:hover:bg-slate-800'
                }`
              }
            >
              {t('nav.settings')}
            </NavLink>
            <NavLink
              to="/about"
              className={({ isActive }) =>
                `hidden rounded-md px-3 py-2 text-sm md:block ${
                  isActive ? 'bg-teal-700 text-white' : 'hover:bg-slate-200 dark:hover:bg-slate-800'
                }`
              }
            >
              {t('nav.about')}
            </NavLink>
            <LanguageToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        <aside
          className={`${menuOpen ? 'block' : 'hidden'} fixed inset-x-0 top-[52px] bottom-0 z-20 overflow-y-auto bg-white p-4 md:static md:z-auto md:block md:w-64 md:shrink-0 md:bg-transparent md:p-0 dark:bg-slate-900 md:dark:bg-transparent`}
        >
          <SidebarNav onNavigate={() => setMenuOpen(false)} />
        </aside>
        <main className="min-w-0 flex-1" key={location.pathname}>
          {children}
        </main>
      </div>

      <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
        <p className="mx-auto max-w-3xl px-4">{t('app.educational_disclaimer')}</p>
      </footer>
    </div>
  );
}
