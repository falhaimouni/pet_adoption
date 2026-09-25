import { useLanguage } from '../context/LanguageContext';
import { Lang } from '../i18n/translations';

export default function LanguageSwitcher() {
  const { lang, setLang, t } = useLanguage();
  return <select aria-label={t('settings_language')} value={lang} onChange={event => setLang(event.target.value as Lang)} className="max-w-[110px] rounded-lg border border-primary/20 bg-card px-2 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-primary">
    <option value="en" lang="en">English</option>
    <option value="ar" lang="ar">العربية</option>
    <option value="fr" lang="fr">Français</option>
  </select>;
}
