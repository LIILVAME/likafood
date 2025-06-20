import React, { useState } from 'react';
import { useAuth } from '../services/AuthContext';
import { apiService } from '../services/apiService';
import CurrencySelector from '../components/CurrencySelector';
import { useLanguage } from '../contexts/LanguageContext';

function Settings() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [profileData, setProfileData] = useState({
    businessName: user?.businessName || '',
    ownerName: user?.ownerName || '',
    phoneNumber: user?.phoneNumber || '',
    location: user?.location || '',
    description: user?.description || ''
  });

  const [businessHours, setBusinessHours] = useState({
    open: user?.businessHours?.open || '08:00',
    close: user?.businessHours?.close || '20:00',
    daysOpen: user?.businessHours?.daysOpen || [
      'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
    ]
  });

  const daysOfWeek = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBusinessHoursChange = (e) => {
    const { name, value } = e.target;
    setBusinessHours(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDayToggle = (day) => {
    setBusinessHours(prev => ({
      ...prev,
      daysOpen: prev.daysOpen.includes(day)
        ? prev.daysOpen.filter(d => d !== day)
        : [...prev.daysOpen, day]
    }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await apiService.put('/profile', profileData);
      setMessage(t('profileUpdatedSuccess'));
    } catch (err) {
      setError(t('profileUpdateError'));
    } finally {
      setLoading(false);
    }
  };

  const handleBusinessHoursSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await apiService.put('/business-hours', businessHours);
      setMessage(t('businessHoursUpdatedSuccess'));
    } catch (err) {
      setError(t('businessHoursUpdateError'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm(t('logoutConfirm'))) {
      logout();
    }
  };

  const tabs = [
    { key: 'profile', label: t('profile'), icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )},
    { key: 'business', label: t('businessHours'), icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )},
    { key: 'currency', label: t('currency'), icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
      </svg>
    )},
    { key: 'about', label: t('about'), icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )}
  ];

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('settings')}</h1>
        <button
          onClick={handleLogout}
          className="text-red-600 hover:text-red-700 font-medium"
        >
          {t('logout')}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Messages */}
      {message && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600">{message}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'profile' && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('businessProfile')}</h2>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('businessName')} *
              </label>
              <input
                type="text"
                name="businessName"
                value={profileData.businessName}
                onChange={handleProfileChange}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('ownerName')} *
              </label>
              <input
                type="text"
                name="ownerName"
                value={profileData.ownerName}
                onChange={handleProfileChange}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('phoneNumber')}
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={profileData.phoneNumber}
                onChange={handleProfileChange}
                className="input-field"
                disabled
              />
              <p className="text-sm text-gray-500 mt-1">
                {t('phoneNumberCannotBeChanged')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('location')}
              </label>
              <input
                type="text"
                name="location"
                value={profileData.location}
                onChange={handleProfileChange}
                className="input-field"
                placeholder={t('locationPlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('businessDescription')}
              </label>
              <textarea
                name="description"
                value={profileData.description}
                onChange={handleProfileChange}
                rows={3}
                className="input-field"
                placeholder={t('businessDescriptionPlaceholder')}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('updating') : t('updateProfile')}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'business' && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('businessHours')}</h2>
          <form onSubmit={handleBusinessHoursSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('openingTime')}
                </label>
                <input
                  type="time"
                  name="open"
                  value={businessHours.open}
                  onChange={handleBusinessHoursChange}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('closingTime')}
                </label>
                <input
                  type="time"
                  name="close"
                  value={businessHours.close}
                  onChange={handleBusinessHoursChange}
                  className="input-field"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('daysOpen')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {daysOfWeek.map((day) => (
                  <label key={day} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={businessHours.daysOpen.includes(day)}
                      onChange={() => handleDayToggle(day)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">{day}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">{t('currentSchedule')}</h3>
              <p className="text-sm text-blue-800">
                <strong>{t('hours')}:</strong> {businessHours.open} - {businessHours.close}
              </p>
              <p className="text-sm text-blue-800">
                <strong>{t('days')}:</strong> {businessHours.daysOpen.length > 0 
                  ? businessHours.daysOpen.join(', ') 
                  : t('noDaysSelected')}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || businessHours.daysOpen.length === 0}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('updating') : t('updateBusinessHours')}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'currency' && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('currencySettings')}</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-4">
                {t('chooseCurrencyDescription')}
              </p>
              <CurrencySelector className="w-full" />
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">{t('currencyInformation')}</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>EUR (€):</strong> {t('euroDescription')}</p>
                <p><strong>XOF (FCFA):</strong> {t('xofDescription')}</p>
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                💡 <strong>{t('tip')}:</strong> {t('currencyTipDescription')}
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'about' && (
        <div className="space-y-4">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('aboutLikaFood')}</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">{t('version')}</h3>
                <p className="text-sm text-gray-600">MVP v1.0</p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">{t('description')}</h3>
                <p className="text-sm text-gray-600">
                  {t('appDescription')}
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">{t('features')}</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• {t('orderManagementTracking')}</li>
                  <li>• {t('menuCatalogManagement')}</li>
                  <li>• {t('expenseTrackingCategorization')}</li>
                  <li>• {t('dailySalesProfitMetrics')}</li>
                  <li>• {t('businessProfileHoursManagement')}</li>
                  <li>• {t('mobileOptimizedInterface')}</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('support')}</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">{t('helpCenter')}</span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">{t('contactSupport')}</span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">{t('privacyPolicy')}</span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">{t('termsOfService')}</span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('accountActions')}</h2>
            <div className="space-y-3">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200 hover:bg-red-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="font-medium">{t('logout')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;