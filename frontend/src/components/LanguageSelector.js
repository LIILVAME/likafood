import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const LanguageSelector = ({ className = '' }) => {
  const { language, setLanguage, languages, t } = useLanguage();

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <label htmlFor="language-select" className="text-sm font-medium text-gray-700">
        {t('language') || 'Language'}:
      </label>
      <select
        id="language-select"
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
      >
        {Object.entries(languages).map(([code, languageInfo]) => (
          <option key={code} value={code}>
            {languageInfo.flag} {languageInfo.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;