import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const LoadingSpinner = ({ size = 'medium', message = null }) => {
  const { t } = useLanguage();
  
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-12 h-12',
    large: 'w-16 h-16'
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="flex flex-col items-center space-y-4">
        {/* Spinner */}
        <div className="relative">
          <div className={`${sizeClasses[size]} border-4 border-gray-200 rounded-full animate-spin`}></div>
          <div className={`${sizeClasses[size]} border-4 border-primary-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0`}></div>
        </div>
        
        {/* Loading message */}
        <div className="text-center">
          <p className="text-gray-600 font-medium">
            {message || t('loading')}
          </p>
          <div className="flex space-x-1 mt-2 justify-center">
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Inline loading spinner for smaller components
export const InlineSpinner = ({ size = 'small', className = '' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8'
  };

  return (
    <div className={`relative ${className}`}>
      <div className={`${sizeClasses[size]} border-2 border-gray-200 rounded-full animate-spin`}></div>
      <div className={`${sizeClasses[size]} border-2 border-primary-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0`}></div>
    </div>
  );
};

// Button loading state
export const ButtonSpinner = ({ className = '' }) => {
  return (
    <div className={`relative w-5 h-5 ${className}`}>
      <div className="w-5 h-5 border-2 border-white/30 rounded-full animate-spin"></div>
      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
    </div>
  );
};

export default LoadingSpinner;