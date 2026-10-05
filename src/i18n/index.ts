import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import ar from './ar.json';

export type Lang = 'en' | 'ar';

/** Non-hook accessor usable outside components (title updates, aria-live). */
export function currentLang(): Lang {
  return (i18n.language ?? 'en').startsWith('ar') ? 'ar' : 'en';
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
