import { useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { translateText, TextParams } from './text';
export function useText() {
  const { lang } = useLanguage();
  return useCallback((source: string, params?: TextParams) => translateText(source, params, lang), [lang]);
}
