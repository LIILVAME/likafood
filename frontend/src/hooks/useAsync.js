import { useState, useEffect, useCallback, useRef } from 'react';
import { useNotifications } from '../components/NotificationSystem';

/**
 * Custom hook for handling async operations with loading, error, and success states
 * @param {Function} asyncFunction - The async function to execute
 * @param {Array} dependencies - Dependencies array for useEffect
 * @param {Object} options - Configuration options
 * @returns {Object} - State and control functions
 */
export const useAsync = (asyncFunction, dependencies = [], options = {}) => {
  const {
    immediate = true,
    onSuccess,
    onError,
    showSuccessNotification = false,
    showErrorNotification = true,
    successMessage,
    errorMessage
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const [lastExecuted, setLastExecuted] = useState(null);
  
  const { success: showSuccess, error: showError } = useNotifications();
  const mountedRef = useRef(true);
  const abortControllerRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const execute = useCallback(async (...args) => {
    try {
      // Abort previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Create new abort controller
      abortControllerRef.current = new AbortController();
      
      if (!mountedRef.current) return;
      
      setLoading(true);
      setError(null);
      setLastExecuted(Date.now());

      const result = await asyncFunction(...args, {
        signal: abortControllerRef.current.signal
      });

      if (!mountedRef.current) return;

      setData(result);
      setError(null);
      
      // Success callback
      if (onSuccess) {
        onSuccess(result);
      }
      
      // Success notification
      if (showSuccessNotification && successMessage) {
        showSuccess(successMessage);
      }
      
      return result;
    } catch (err) {
      if (!mountedRef.current) return;
      
      // Don't handle aborted requests as errors
      if (err.name === 'AbortError') {
        return;
      }
      
      setError(err);
      setData(null);
      
      // Error callback
      if (onError) {
        onError(err);
      }
      
      // Error notification
      if (showErrorNotification) {
        const message = errorMessage || err.message || 'Une erreur est survenue';
        showError(message);
      }
      
      throw err;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
      abortControllerRef.current = null;
    }
  }, [asyncFunction, onSuccess, onError, showSuccessNotification, showErrorNotification, successMessage, errorMessage, showSuccess, showError]);

  // Auto-execute on mount or dependency change
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute, ...(Array.isArray(dependencies) ? dependencies : [])]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
    setLastExecuted(null);
  }, []);

  const retry = useCallback(() => {
    return execute();
  }, [execute]);

  return {
    data,
    loading,
    error,
    execute,
    reset,
    retry,
    lastExecuted,
    isStale: lastExecuted && (Date.now() - lastExecuted) > 300000, // 5 minutes
  };
};

/**
 * Hook for handling form submissions with async operations
 * @param {Function} submitFunction - The async submit function
 * @param {Object} options - Configuration options
 * @returns {Object} - State and control functions
 */
export const useAsyncForm = (submitFunction, options = {}) => {
  const {
    onSuccess,
    onError,
    successMessage = 'Opération réussie',
    resetOnSuccess = false,
    validateBeforeSubmit
  } = options;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitCount, setSubmitCount] = useState(0);
  
  const { success: showSuccess, error: showError } = useNotifications();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleSubmit = useCallback(async (formData, ...args) => {
    try {
      // Validation
      if (validateBeforeSubmit) {
        const validationResult = await validateBeforeSubmit(formData);
        if (!validationResult.isValid) {
          showError(validationResult.message || 'Données invalides');
          return;
        }
      }

      if (!mountedRef.current) return;
      
      setIsSubmitting(true);
      setSubmitError(null);
      setSubmitCount(prev => prev + 1);

      const result = await submitFunction(formData, ...args);

      if (!mountedRef.current) return;

      // Success callback
      if (onSuccess) {
        onSuccess(result, formData);
      }
      
      // Success notification
      showSuccess(successMessage);
      
      // Reset form if requested
      if (resetOnSuccess && typeof resetOnSuccess === 'function') {
        resetOnSuccess();
      }
      
      return result;
    } catch (err) {
      if (!mountedRef.current) return;
      
      setSubmitError(err);
      
      // Error callback
      if (onError) {
        onError(err, formData);
      } else {
        // Default error notification
        const message = err.message || 'Erreur lors de la soumission';
        showError(message);
      }
      
      throw err;
    } finally {
      if (mountedRef.current) {
        setIsSubmitting(false);
      }
    }
  }, [submitFunction, onSuccess, onError, successMessage, resetOnSuccess, validateBeforeSubmit, showSuccess, showError]);

  const resetSubmit = useCallback(() => {
    setSubmitError(null);
    setSubmitCount(0);
  }, []);

  return {
    handleSubmit,
    isSubmitting,
    submitError,
    submitCount,
    resetSubmit,
    hasSubmitted: submitCount > 0
  };
};

/**
 * Hook for handling data fetching with caching and refresh capabilities
 * @param {Function} fetchFunction - The async fetch function
 * @param {string} cacheKey - Unique key for caching
 * @param {Object} options - Configuration options
 * @returns {Object} - State and control functions
 */
export const useAsyncData = (fetchFunction, cacheKey, options = {}) => {
  const {
    cacheTime = 300000, // 5 minutes
    staleTime = 60000,  // 1 minute
    refetchOnWindowFocus = true,
    ...asyncOptions
  } = options;

  const cacheRef = useRef(new Map());
  const [refreshKey, setRefreshKey] = useState(0);

  // Get cached data
  const getCachedData = useCallback(() => {
    const cached = cacheRef.current.get(cacheKey);
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > cacheTime) {
      cacheRef.current.delete(cacheKey);
      return null;
    }
    
    return {
      data: cached.data,
      isStale: now - cached.timestamp > staleTime
    };
  }, [cacheKey, cacheTime, staleTime]);

  // Enhanced fetch function with caching
  const enhancedFetchFunction = useCallback(async (...args) => {
    const result = await fetchFunction(...args);
    
    // Cache the result
    cacheRef.current.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });
    
    return result;
  }, [fetchFunction, cacheKey]);

  const asyncState = useAsync(enhancedFetchFunction, [refreshKey], {
    ...asyncOptions,
    immediate: true
  });

  // Initialize with cached data if available
  useEffect(() => {
    const cached = getCachedData();
    if (cached && !asyncState.data) {
      // Set cached data immediately, but still fetch fresh data
      asyncState.data = cached.data;
    }
  }, [getCachedData, asyncState]);

  // Refresh function
  const refresh = useCallback(() => {
    cacheRef.current.delete(cacheKey);
    setRefreshKey(prev => prev + 1);
  }, [cacheKey]);

  // Refetch on window focus
  useEffect(() => {
    if (!refetchOnWindowFocus) return;
    
    const handleFocus = () => {
      const cached = getCachedData();
      if (!cached || cached.isStale) {
        refresh();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetchOnWindowFocus, refresh, getCachedData]);

  return {
    ...asyncState,
    refresh,
    isStale: getCachedData()?.isStale || false
  };
};

export default useAsync;