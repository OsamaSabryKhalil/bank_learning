import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Online/offline indicator + "offline ready" notice once the service worker
 * has activated and precaching finished. No page reload is ever forced.
 */
export default function OfflineNotice() {
  const { t } = useTranslation();
  const [online, setOnline] = useState(navigator.onLine);
  const [offlineReady, setOfflineReady] = useState(false);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);

    // PWA: register SW, wait for activation, then announce readiness.
    if ('serviceWorker' in navigator) {
      void navigator.serviceWorker
        .register('/sw.js')
        .then(async (reg) => {
          const sw = reg.active ?? (await navigator.serviceWorker.ready).active;
          if (sw) setOfflineReady(true);
          reg.addEventListener('updatefound', () => {
            const nw = reg.installing;
            nw?.addEventListener('statechange', () => {
              if (nw.state === 'installed' && navigator.serviceWorker.controller) {
                // New content available; apply only after consent — show a
                // non-blocking notice with an explicit reload button.
                const el = document.getElementById('sw-update');
                if (el) el.hidden = false;
              }
            });
          });
        })
        .catch(() => {
          /* dev mode or unsupported: no SW, offline ready not claimed */
        });
    }
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  return (
    <>
      <div
        role="status"
        aria-live="polite"
        className="fixed bottom-2 end-2 z-40 rounded-full bg-slate-900/90 px-3 py-1 text-xs text-white shadow"
      >
        {online ? (
          <span>
            <span aria-hidden="true">●</span> {t('app.online')}
          </span>
        ) : (
          <span>
            <span aria-hidden="true">○</span> {t('app.offline')}
          </span>
        )}
        {offlineReady && (
          <span className="ms-2 text-teal-300">| {t('app.offline_ready')}</span>
        )}
      </div>
      <div
        id="sw-update"
        hidden
        className="fixed bottom-12 end-2 z-40 rounded-lg border border-slate-300 bg-white p-3 text-sm shadow dark:border-slate-700 dark:bg-slate-900"
      >
        <p>{t('app.offline_ready')}</p>
        <button
          type="button"
          className="mt-2 rounded bg-teal-700 px-3 py-1.5 text-white"
          onClick={() => window.location.reload()}
        >
          {t('settings.update_now', 'Update now')}
        </button>
      </div>
    </>
  );
}
