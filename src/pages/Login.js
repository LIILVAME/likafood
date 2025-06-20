import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../services/authcontext';
import { useLanguage } from '../contexts/languagecontext';

function Login() {
  const { login, loginOrRegister, verifyOTP, isAuthenticated, loading } = useAuth();
  const { t } = useLanguage();
  const [step, setStep] = useState('phone'); // 'phone', 'register', or 'otp'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authAction, setAuthAction] = useState(''); // 'login' or 'register'
  const [showRegistrationFields, setShowRegistrationFields] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // First try with just phone number
      const result = await loginOrRegister(phoneNumber);
      if (result.success) {
        const { action } = result.data.data;
        setAuthAction(action);
        setStep('otp');
      } else {
        // Check if we need registration data
        if (result.error.includes('Business name and owner name are required')) {
          setShowRegistrationFields(true);
        } else {
          setError(result.error);
        }
      }
    } catch (err) {
      setError(t('failedToSendOTP'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let result;
      if (authAction === 'register') {
        // Use verifyOTP for registration flow
        result = await verifyOTP(phoneNumber, otp, 'registration');
      } else {
        // Use login for normal login flow
        result = await login(phoneNumber, otp);
      }
      
      if (!result.success) {
        setError(result.error);
      }
    } catch (err) {
      setError(authAction === 'register' ? t('registrationFailed') : t('loginFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await loginOrRegister(phoneNumber, businessName, ownerName);
      if (result.success) {
        const { action } = result.data.data;
        setAuthAction(action);
        setStep('otp');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(t('registrationFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToPhone = () => {
    setStep('phone');
    setBusinessName('');
    setOwnerName('');
    setOtp('');
    setError('');
    setShowRegistrationFields(false);
    setAuthAction('');
  };

  const formatPhoneNumber = (value) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Add + prefix if not present
    if (digits.length > 0 && !value.startsWith('+')) {
      return '+' + digits;
    }
    
    return value;
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">LikaFood</h1>
          <p className="text-gray-600">{t('vendorManagementSystem')}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {step === 'phone' ? (
            <form onSubmit={showRegistrationFields ? handleRegisterSubmit : handlePhoneSubmit} className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {showRegistrationFields ? t('createAccount') : t('enterPhoneNumber')}
                </h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('phoneNumber')}
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                      placeholder="+1234567890"
                      className="input-field"
                      required
                      disabled={isLoading}
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      {t('includeCountryCode')}
                    </p>
                  </div>
                  
                  {showRegistrationFields && (
                    <>
                      <div>
                        <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-2">
                          {t('businessName')}
                        </label>
                        <input
                          id="businessName"
                          type="text"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          placeholder={t('businessNamePlaceholder')}
                          className="input-field"
                          required
                          disabled={isLoading}
                        />
                      </div>
                      <div>
                        <label htmlFor="ownerName" className="block text-sm font-medium text-gray-700 mb-2">
                          {t('ownerName')}
                        </label>
                        <input
                          id="ownerName"
                          type="text"
                          value={ownerName}
                          onChange={(e) => setOwnerName(e.target.value)}
                          placeholder={t('ownerNamePlaceholder')}
                          className="input-field"
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={isLoading || !phoneNumber.trim() || (showRegistrationFields && (!businessName.trim() || !ownerName.trim()))}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {showRegistrationFields ? t('creatingAccount') : t('sendingOTP')}
                    </div>
                  ) : (
                    showRegistrationFields ? t('createAccountSendOTP') : t('sendOTP')
                  )}
                </button>
                
                {showRegistrationFields && (
                  <button
                    type="button"
                    onClick={() => setShowRegistrationFields(false)}
                    disabled={isLoading}
                    className="w-full btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('backToLogin')}
                  </button>
                )}
              </div>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {t('enterVerificationCode')}
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  {t('sentVerificationCode', { phoneNumber })}
                </p>
                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('verificationCode')}
                  </label>
                  <input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="1234"
                    maxLength="6"
                    className="input-field text-center text-lg tracking-widest"
                    required
                    disabled={isLoading}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    {t('enterDigitCode')}
                  </p>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={isLoading || !otp.trim()}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {t('verifying')}
                    </div>
                  ) : (
                    t('verifyLogin')
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={handleBackToPhone}
                  disabled={isLoading}
                  className="w-full btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('changePhoneNumber')}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500">
            {t('demoOTPMessage')}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;