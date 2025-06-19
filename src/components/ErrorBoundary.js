import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console and external service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Here you could send error to logging service like Sentry
    // Sentry.captureException(error, { extra: errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback 
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReload={this.handleReload}
          onGoHome={this.handleGoHome}
        />
      );
    }

    return this.props.children;
  }
}

// Functional component for error display
const ErrorFallback = ({ error, errorInfo, onReload, onGoHome }) => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Error Icon */}
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>

        {/* Error Message */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Oops! Quelque chose s'est mal passé
        </h1>
        
        <p className="text-gray-600 mb-8">
          Une erreur inattendue s'est produite. Nous nous excusons pour la gêne occasionnée.
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={onReload}
            className="w-full btn-primary"
          >
            Recharger la page
          </button>
          
          <button
            onClick={onGoHome}
            className="w-full btn-secondary"
          >
            Retour à l'accueil
          </button>
        </div>

        {/* Development Error Details */}
        {isDevelopment && error && (
          <details className="mt-8 text-left">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
              Détails de l'erreur (développement)
            </summary>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg text-xs">
              <div className="mb-4">
                <h4 className="font-semibold text-red-600">Erreur:</h4>
                <pre className="whitespace-pre-wrap text-red-800">
                  {error.toString()}
                </pre>
              </div>
              
              {errorInfo && (
                <div>
                  <h4 className="font-semibold text-red-600">Stack Trace:</h4>
                  <pre className="whitespace-pre-wrap text-red-800">
                    {errorInfo.componentStack}
                  </pre>
                </div>
              )}
            </div>
          </details>
        )}

        {/* Contact Support */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Si le problème persiste, contactez le support technique.
          </p>
        </div>
      </div>
    </div>
  );
};

// Hook for functional components error handling
export const useErrorHandler = () => {
  return (error, errorInfo) => {
    console.error('Error caught by useErrorHandler:', error, errorInfo);
    // Here you could send error to logging service
  };
};

export default ErrorBoundary;