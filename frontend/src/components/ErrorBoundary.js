import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    const errorId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    
    // Log error details
    console.error('Error caught by boundary:', {
      error: error.message,
      stack: error.stack,
      errorInfo,
      errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });
    
    // Store error details in state for display
    this.setState({
      error,
      errorInfo,
      errorId
    });
    
    // Report to error tracking service (if available)
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: error.message,
        fatal: true,
        error_id: errorId
      });
    }
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null 
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleReportError = () => {
    const { error, errorInfo, errorId } = this.state;
    const errorReport = {
      errorId,
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    // Copy error report to clipboard
    navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2))
      .then(() => alert('Error report copied to clipboard'))
      .catch(() => console.log('Error report:', errorReport));
  };

  render() {
    if (this.state.hasError) {
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-lg w-full bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">Oops! Something went wrong</h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  We're sorry, but something unexpected happened. Our team has been notified.
                </p>
                {this.state.errorId && (
                  <p className="text-xs text-gray-400 mt-1">
                    Error ID: {this.state.errorId}
                  </p>
                )}
              </div>
              
              {isDevelopment && this.state.error && (
                <div className="mt-4 p-3 bg-red-50 rounded-md text-left">
                  <h4 className="text-sm font-medium text-red-800">Development Error Details:</h4>
                  <p className="text-xs text-red-700 mt-1 font-mono">
                    {this.state.error.message}
                  </p>
                  {this.state.error.stack && (
                    <details className="mt-2">
                      <summary className="text-xs text-red-600 cursor-pointer">Stack Trace</summary>
                      <pre className="text-xs text-red-600 mt-1 whitespace-pre-wrap overflow-auto max-h-32">
                        {this.state.error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              )}
              
              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  type="button"
                  className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={this.handleRetry}
                >
                  Try Again
                </button>
                
                <button
                  type="button"
                  className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={this.handleReload}
                >
                  Refresh Page
                </button>
                
                {isDevelopment && (
                  <button
                    type="button"
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={this.handleReportError}
                  >
                    Copy Error Report
                  </button>
                )}
              </div>
              
              <div className="mt-4">
                <button
                  type="button"
                  className="text-sm text-blue-600 hover:text-blue-500"
                  onClick={() => window.history.back()}
                >
                  ← Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
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