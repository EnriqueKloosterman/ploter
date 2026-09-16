import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export function LanguageSelector() {
  const { i18n, t } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'es' ? 'en' : 'es';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-1 px-2 py-1 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors"
      title={t('common.language')}
    >
      <Globe className="w-4 h-4" />
      <span className="font-medium uppercase">{i18n.language}</span>
    </button>
  );
}

export default LanguageSelector;