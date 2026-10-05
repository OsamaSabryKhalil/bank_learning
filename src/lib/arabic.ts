/**
 * Arabic text normalization, used at index time and query time so that
 * Arabic search matches regardless of diacritics, alef variants, and the
 * definite article. Also used by validate:content (scripts mirror this).
 */

/** Strip tashkeel (diacritics) and tatweel. */
export function stripDiacritics(s: string): string {
  // U+064B..U+065F harakat, U+0670 superscript alef, U+0640 tatweel
  return s.replace(/[\u064B-\u065F\u0670\u0640]/g, '');
}

/** Unify alef forms to plain alef. */
export function unifyAlef(s: string): string {
  return s.replace(/[\u0622\u0623\u0625]/g, '\u0627');
}

/** Unify ya with alef maksura, and ha with ta marbuta (matching only). */
export function unifyYaTa(s: string): string {
  return s.replace(/\u0649/g, '\u064A').replace(/\u0629/g, '\u0647');
}

/** Convert Arabic-Indic (and Persian) digits to Western digits. */
export function digitsToWestern(s: string): string {
  return s
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

/** Strip the definite article at token level. */
export function stripAlPrefix(s: string): string {
  // Remove leading "ال" from each word, but keep words that are mostly "ال"
  return s
    .split(/(\s+)/)
    .map((tok) => (/^[\u0627\u0644]{2}.+/.test(tok) && tok.length > 3 ? tok.slice(2) : tok))
    .join('');
}

/** Full normalization pipeline for Arabic matching. */
export function normalizeArabic(s: string): string {
  let out = digitsToWestern(s);
  out = stripDiacritics(out);
  out = unifyAlef(out);
  out = unifyYaTa(out);
  out = stripAlPrefix(out);
  return out.toLowerCase();
}

/** Normalizer for English queries. */
export function normalizeLatin(s: string): string {
  return digitsToWestern(s).toLowerCase();
}

/** Detect whether a string contains Arabic letters. */
export function hasArabic(s: string): boolean {
  return /[\u0600-\u06FF\u0750-\u077F]/.test(s);
}

/** Share of Arabic letters among letters (excludes digits/punct/space). */
export function arabicLetterShare(s: string): number {
  const letters = s.match(/[\p{L}]/gu) ?? [];
  const arabic = s.match(/[\u0600-\u06FF]/g) ?? [];
  if (letters.length === 0) return 0;
  return arabic.length / letters.length;
}
