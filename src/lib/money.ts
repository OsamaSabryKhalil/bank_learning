/**
 * Money formatting from integer minor units, using a bundled ISO 4217 table.
 * No external lookup, works offline. Exponents: 0 (JPY), 2 (USD), 3 (KWD)...
 */

export interface CurrencyInfo {
  code: string;
  exponent: number;
  en: string;
  ar: string;
}

/** Bundled ISO 4217 subset used across the course. Extensible via content. */
export const CURRENCIES: Record<string, CurrencyInfo> = {
  USD: { code: 'USD', exponent: 2, en: 'US Dollar', ar: 'دولار أمريكي' },
  EUR: { code: 'EUR', exponent: 2, en: 'Euro', ar: 'يورو' },
  GBP: { code: 'GBP', exponent: 2, en: 'Pound Sterling', ar: 'جنيه إسترليني' },
  EGP: { code: 'EGP', exponent: 2, en: 'Egyptian Pound', ar: 'جنيه مصري' },
  SAR: { code: 'SAR', exponent: 2, en: 'Saudi Riyal', ar: 'ريال سعودي' },
  AED: { code: 'AED', exponent: 2, en: 'UAE Dirham', ar: 'درهم إماراتي' },
  JOD: { code: 'JOD', exponent: 3, en: 'Jordanian Dinar', ar: 'دينار أردني' },
  KWD: { code: 'KWD', exponent: 3, en: 'Kuwaiti Dinar', ar: 'دينار كويتي' },
  BHD: { code: 'BHD', exponent: 3, en: 'Bahraini Dinar', ar: 'دينار بحريني' },
  JPY: { code: 'JPY', exponent: 0, en: 'Japanese Yen', ar: 'ين ياباني' },
  CHF: { code: 'CHF', exponent: 2, en: 'Swiss Franc', ar: 'فرنك سويسري' },
  TRY: { code: 'TRY', exponent: 2, en: 'Turkish Lira', ar: 'ليرة تركية' },
};

export type Numerals = 'western' | 'arabic-indic';

/** Convert Western digits 0-9 to Arabic-Indic digits. */
export function toArabicIndic(s: string): string {
  const map = '٠١٢٣٤٥٦٧٨٩';
  return s.replace(/[0-9]/g, (d) => map[Number(d)]!);
}

/**
 * Format an integer minor-unit amount with the currency code always shown.
 * Uses explicit Intl locale extension so the numbering system is guaranteed:
 *   ar-u-nu-latn  -> Arabic locale, Western digits
 *   ar-u-nu-arab  -> Arabic locale, Arabic-Indic digits
 *   en-u-nu-latn  -> English locale, Western digits
 */
export function formatMoney(
  minor: number,
  currency: string,
  lang: 'en' | 'ar',
  numerals: Numerals = 'western',
): string {
  const info = CURRENCIES[currency];
  const exp = info ? info.exponent : 2;
  const value = minor / 10 ** exp;
  const nu = numerals === 'arabic-indic' ? 'arab' : 'latn';
  const locale = `${lang}-u-nu-${nu}`;
  const num = new Intl.NumberFormat(locale, {
    minimumFractionDigits: exp,
    maximumFractionDigits: exp,
  }).format(value);
  return lang === 'ar' ? `${num} ${currency}` : `${num} ${currency}`;
}

/** Format a plain integer (counts, ids) honoring the numeral setting. */
export function formatInt(n: number, lang: 'en' | 'ar', numerals: Numerals = 'western'): string {
  const nu = numerals === 'arabic-indic' ? 'arab' : 'latn';
  return new Intl.NumberFormat(`${lang}-u-nu-${nu}`).format(n);
}
