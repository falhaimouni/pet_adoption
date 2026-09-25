import translations, { Lang } from './translations';
import { interfaceText } from './interfaceText';
export type TextParams = Record<string, string | number>;
const sourceKeys = new Map(Object.entries(translations.en).map(([key, text]) => [text, key]));
const canonicalSources = new Map([...sourceKeys.keys(), ...Object.keys(interfaceText)].map(source => [source.toLowerCase(), source]));
export function translateText(source: string, params: TextParams = {}, lang: Lang = (typeof document === 'undefined' ? 'en' : document.documentElement.lang || 'en') as Lang): string {
  const canonical = canonicalSources.get(source.toLowerCase()) ?? source;
  const key = sourceKeys.get(canonical);
  const translated = lang === 'en' ? source : interfaceText[canonical]?.[lang as 'ar' | 'fr'] ?? (key ? translations[lang]?.[key] : undefined) ?? source;
  return translated.replace(/\{(\w+)\}/g, (match, name) => String(params[name] ?? match));
}
export function localizeApiMessage(message: string, status = 400): string {
  const translated = translateText(message);
  if (translated !== message || (typeof document === 'undefined' || document.documentElement.lang === 'en')) return translated;
  return translateText(status === 401 ? 'Please sign in again.' : status === 403 ? 'You do not have permission to perform this action.' : status === 404 ? 'The requested item was not found.' : status >= 500 ? 'The request could not be completed. Please try again.' : 'Please check your input and try again.');
}
