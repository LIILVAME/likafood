import React from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { useLanguage } from '../contexts/languagecontext';

// Custom toast styles
const toastStyles = {
  success: {
    style: {
      background: '#10B981',
      color: '#fff',
      borderRadius: '12px',
      padding: '16px',
      fontSize: '14px',
      fontWeight: '500',
      boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#10B981',
    },
  },
  error: {
    style: {
      background: '#EF4444',
      color: '#fff',
      borderRadius: '12px',
      padding: '16px',
      fontSize: '14px',
      fontWeight: '500',
      boxShadow: '0 10px 25px rgba(239, 68, 68, 0.3)',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#EF4444',
    },
  },
  loading: {
    style: {
      background: '#3B82F6',
      color: '#fff',
      borderRadius: '12px',
      padding: '16px',
      fontSize: '14px',
      fontWeight: '500',
      boxShadow: '0 10px 25px rgba(59, 130, 246, 0.3)',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#3B82F6',
    },
  },
};

// Notification service
export const NotificationService = {
  success: (message, options = {}) => {
    return toast.success(message, {
      ...toastStyles.success,
      duration: 4000,
      ...options,
    });
  },

  error: (message, options = {}) => {
    return toast.error(message, {
      ...toastStyles.error,
      duration: 5000,
      ...options,
    });
  },

  loading: (message, options = {}) => {
    return toast.loading(message, {
      ...toastStyles.loading,
      ...options,
    });
  },

  promise: (promise, messages, options = {}) => {
    return toast.promise(
      promise,
      {
        loading: messages.loading,
        success: messages.success,
        error: messages.error,
      },
      {
        success: toastStyles.success,
        error: toastStyles.error,
        loading: toastStyles.loading,
        ...options,
      }
    );
  },

  dismiss: (toastId) => {
    toast.dismiss(toastId);
  },

  dismissAll: () => {
    toast.dismiss();
  },

  // Custom toast with action button
  custom: (message, action, options = {}) => {
    return toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">{message}</p>
              </div>
            </div>
          </div>
          {action && (
            <div className="flex border-l border-gray-200">
              <button
                onClick={() => {
                  action.onClick();
                  toast.dismiss(t.id);
                }}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-primary-600 hover:text-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {action.label}
              </button>
            </div>
          )}
        </div>
      ),
      {
        duration: 6000,
        ...options,
      }
    );
  },
};

// Hook for using notifications with translations
export const useNotifications = () => {
  const { t } = useLanguage();

  return {
    success: (messageKey, options = {}) => {
      const message = typeof messageKey === 'string' && t(messageKey) !== messageKey 
        ? t(messageKey) 
        : messageKey;
      return NotificationService.success(message, options);
    },

    error: (messageKey, options = {}) => {
      const message = typeof messageKey === 'string' && t(messageKey) !== messageKey 
        ? t(messageKey) 
        : messageKey;
      return NotificationService.error(message, options);
    },

    loading: (messageKey, options = {}) => {
      const message = typeof messageKey === 'string' && t(messageKey) !== messageKey 
        ? t(messageKey) 
        : messageKey;
      return NotificationService.loading(message, options);
    },

    promise: (promise, messageKeys, options = {}) => {
      const messages = {
        loading: t(messageKeys.loading) || messageKeys.loading,
        success: t(messageKeys.success) || messageKeys.success,
        error: t(messageKeys.error) || messageKeys.error,
      };
      return NotificationService.promise(promise, messages, options);
    },

    dismiss: NotificationService.dismiss,
    dismissAll: NotificationService.dismissAll,
    custom: NotificationService.custom,
  };
};

// Toaster component with custom positioning
const NotificationToaster = () => {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      containerClassName=""
      containerStyle={{}}
      toastOptions={{
        // Default options for all toasts
        className: '',
        duration: 4000,
        style: {
          background: '#363636',
          color: '#fff',
          borderRadius: '12px',
          padding: '16px',
          fontSize: '14px',
          fontWeight: '500',
        },
      }}
    />
  );
};

export default NotificationToaster;

// CSS for animations (add to your CSS file)
export const toastAnimations = `
  @keyframes enter {
    0% {
      transform: translate3d(0, -200%, 0) scale(0.6);
      opacity: 0.5;
    }
    100% {
      transform: translate3d(0, 0, 0) scale(1);
      opacity: 1;
    }
  }

  @keyframes leave {
    0% {
      transform: translate3d(0, 0, -1px) scale(1);
      opacity: 1;
    }
    100% {
      transform: translate3d(0, -150%, -1px) scale(0.6);
      opacity: 0;
    }
  }

  .animate-enter {
    animation: enter 0.35s ease-out;
  }

  .animate-leave {
    animation: leave 0.4s ease-in forwards;
  }
`;