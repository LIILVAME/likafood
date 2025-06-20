import React, { useState } from 'react';
import { useLanguage } from '../contexts/languagecontext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useAuth } from '../services/authcontext';

const Settings = () => {
  const { t, language, setLanguage, languages } = useLanguage();
  const { currency, setCurrency, currencies } = useCurrency();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleLanguageChange = (newLanguage) => {
    setIsLoading(true);
    setTimeout(() => {
      setLanguage(newLanguage);
      setIsLoading(false);
    }, 300);
  };

  const handleCurrencyChange = (newCurrency) => {
    setCurrency(newCurrency);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">
            {t('settings') || 'Paramètres'}
          </h1>
        </div>

        <div className="p-6 space-y-8">
          {/* User Information */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              {t('userInformation') || 'Informations utilisateur'}
            </h2>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm text-gray-600">
                <span className="font-medium">{t('phoneNumber') || 'Numéro de téléphone'}:</span> {user?.phoneNumber || 'Non défini'}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                <span className="font-medium">{t('registrationDate') || 'Date d\'inscription'}:</span> {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 'Non défini'}
              </p>
            </div>
          </div>

          {/* Language Settings */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              {t('language') || 'Langue'}
            </h2>
            <div className="space-y-2">
              {Object.values(languages).map((lang) => (
                <label key={lang.code} className="flex items-center">
                  <input
                    type="radio"
                    name="language"
                    value={lang.code}
                    checked={language === lang.code}
                    onChange={() => handleLanguageChange(lang.code)}
                    disabled={isLoading}
                    className="mr-3 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-lg mr-2">{lang.flag}</span>
                  <span className="text-sm font-medium text-gray-700">
                    {lang.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Currency Settings */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              {t('currency') || 'Devise'}
            </h2>
            <div className="space-y-2">
              {Object.values(currencies).map((curr) => (
                <label key={curr.code} className="flex items-center">
                  <input
                    type="radio"
                    name="currency"
                    value={curr.code}
                    checked={currency === curr.code}
                    onChange={() => handleCurrencyChange(curr.code)}
                    className="mr-3 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {curr.name} ({curr.symbol})
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* App Information */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              {t('appInformation') || 'Informations de l\'application'}
            </h2>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm text-gray-600">
                <span className="font-medium">{t('version') || 'Version'}:</span> 1.0.0
              </p>
              <p className="text-sm text-gray-600 mt-2">
                <span className="font-medium">{t('lastUpdate') || 'Dernière mise à jour'}:</span> {new Date().toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;