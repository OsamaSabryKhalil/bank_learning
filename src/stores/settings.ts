import { create } from 'zustand';
import { get, set } from 'idb-keyval';

export type Lang = 'en' | 'ar';
export type Theme = 'light' | 'dark' | 'system';
export type Numerals = 'western' | 'arabic-indic';
export type TextSize = 'normal' | 'large' | 'xlarge';

export interface Settings {
  lang: Lang;
  theme: Theme;
  numerals: Numerals;
  textSize: TextSize;
  reduceMotion: boolean; // false = follow system
}

const KEY = 'bank-academy:settings';

export function detectDefaultLang(): Lang {
  const langs = navigator.languages ?? [navigator.language];
  for (const l of langs) {
    if (l.toLowerCase().startsWith('ar')) return 'ar';
  }
  return 'en';
}

function applyDom(s: Settings): void {
  const html = document.documentElement;
  html.lang = s.lang;
  html.dir = s.lang === 'ar' ? 'rtl' : 'ltr';
  const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = s.theme === 'system' ? (sysDark ? 'dark' : 'light') : s.theme;
  html.dataset.theme = theme;
  html.dataset.textsize = s.textSize;
  html.dataset.reducemotion = String(s.reduceMotion);
  document.title = s.lang === 'ar' ? 'أكاديمية البنوك الخلفية' : 'Bank Backend Academy';
}

interface SettingsStore extends Settings {
  hydrated: boolean;
  hydrate(): Promise<void>;
  update(patch: Partial<Settings>): void;
  export(): Settings;
}

export const useSettings = create<SettingsStore>((setStore, getStore) => ({
  lang: 'en',
  theme: 'system',
  numerals: 'western',
  textSize: 'normal',
  reduceMotion: false,
  hydrated: false,
  async hydrate() {
    let stored: Partial<Settings> = {};
    try {
      stored = (await get<Partial<Settings>>(KEY)) ?? {};
    } catch {
      // IndexedDB unavailable -> localStorage fallback
      try {
        stored = JSON.parse(localStorage.getItem(KEY) ?? '{}');
      } catch {
        stored = {};
      }
    }
    const lang = stored.lang ?? detectDefaultLang();
    const next: Settings = {
      lang,
      theme: stored.theme ?? 'system',
      numerals: stored.numerals ?? 'western',
      textSize: stored.textSize ?? 'normal',
      reduceMotion: stored.reduceMotion ?? false,
    };
    applyDom(next);
    setStore({ ...next, hydrated: true });
    void navigator.storage?.persist?.();
  },
  update(patch) {
    const next = { ...getStore(), ...patch };
    applyDom(next);
    setStore(patch);
    const persist = async () => {
      try {
        await set(KEY, next);
      } catch {
        try {
          localStorage.setItem(KEY, JSON.stringify(next));
        } catch {
          /* storage full or blocked: settings stay session-only */
        }
      }
    };
    void persist();
  },
  export() {
    const { lang, theme, numerals, textSize, reduceMotion } = getStore();
    return { lang, theme, numerals, textSize, reduceMotion };
  },
}));
