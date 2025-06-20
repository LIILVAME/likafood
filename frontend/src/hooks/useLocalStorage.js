import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for managing state with localStorage persistence
 * @param {string} key - The localStorage key
 * @param {*} initialValue - Initial value if no stored value exists
 * @param {Object} options - Configuration options
 * @returns {Array} - [value, setValue, removeValue]
 */
export const useLocalStorage = (key, initialValue, options = {}) => {
  const {
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    syncAcrossTabs = true,
    onError = console.error
  } = options;

  const [storedValue, setStoredValue] = useState(() => {
    try {
      if (typeof window === 'undefined') {
        return initialValue;
      }
      
      const item = window.localStorage.getItem(key);
      return item ? deserialize(item) : initialValue;
    } catch (error) {
      onError(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        if (valueToStore === undefined) {
          window.localStorage.removeItem(key);
        } else {
          window.localStorage.setItem(key, serialize(valueToStore));
        }
      }
    } catch (error) {
      onError(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, serialize, storedValue, onError]);

  const removeValue = useCallback(() => {
    try {
      setStoredValue(undefined);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      onError(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, onError]);

  // Sync across tabs
  useEffect(() => {
    if (!syncAcrossTabs || typeof window === 'undefined') {
      return;
    }

    const handleStorageChange = (e) => {
      if (e.key === key && e.newValue !== serialize(storedValue)) {
        try {
          setStoredValue(e.newValue ? deserialize(e.newValue) : undefined);
        } catch (error) {
          onError(`Error syncing localStorage key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, storedValue, serialize, deserialize, syncAcrossTabs, onError]);

  return [storedValue, setValue, removeValue];
};

/**
 * Hook for managing session storage
 * @param {string} key - The sessionStorage key
 * @param {*} initialValue - Initial value if no stored value exists
 * @param {Object} options - Configuration options
 * @returns {Array} - [value, setValue, removeValue]
 */
export const useSessionStorage = (key, initialValue, options = {}) => {
  const {
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    onError = console.error
  } = options;

  const [storedValue, setStoredValue] = useState(() => {
    try {
      if (typeof window === 'undefined') {
        return initialValue;
      }
      
      const item = window.sessionStorage.getItem(key);
      return item ? deserialize(item) : initialValue;
    } catch (error) {
      onError(`Error reading sessionStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        if (valueToStore === undefined) {
          window.sessionStorage.removeItem(key);
        } else {
          window.sessionStorage.setItem(key, serialize(valueToStore));
        }
      }
    } catch (error) {
      onError(`Error setting sessionStorage key "${key}":`, error);
    }
  }, [key, serialize, storedValue, onError]);

  const removeValue = useCallback(() => {
    try {
      setStoredValue(undefined);
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(key);
      }
    } catch (error) {
      onError(`Error removing sessionStorage key "${key}":`, error);
    }
  }, [key, onError]);

  return [storedValue, setValue, removeValue];
};

/**
 * Hook for managing user preferences with localStorage
 * @param {string} userId - User ID for scoped preferences
 * @param {Object} defaultPreferences - Default preference values
 * @returns {Object} - Preferences state and handlers
 */
export const useUserPreferences = (userId, defaultPreferences = {}) => {
  const key = `user_preferences_${userId}`;
  const [preferences, setPreferences] = useLocalStorage(key, defaultPreferences);

  const updatePreference = useCallback((prefKey, value) => {
    setPreferences(prev => ({
      ...prev,
      [prefKey]: value
    }));
  }, [setPreferences]);

  const updatePreferences = useCallback((newPreferences) => {
    setPreferences(prev => ({
      ...prev,
      ...newPreferences
    }));
  }, [setPreferences]);

  const resetPreferences = useCallback(() => {
    setPreferences(defaultPreferences);
  }, [setPreferences, defaultPreferences]);

  const getPreference = useCallback((prefKey, fallback = null) => {
    return preferences?.[prefKey] ?? fallback;
  }, [preferences]);

  return {
    preferences,
    updatePreference,
    updatePreferences,
    resetPreferences,
    getPreference
  };
};

/**
 * Hook for managing application cache with expiration
 * @param {string} key - Cache key
 * @param {number} ttl - Time to live in milliseconds
 * @returns {Object} - Cache state and handlers
 */
export const useCache = (key, ttl = 300000) => { // 5 minutes default
  const cacheKey = `cache_${key}`;
  
  const [cacheData, setCacheData] = useLocalStorage(cacheKey, null);

  const isExpired = useCallback(() => {
    if (!cacheData || !cacheData.timestamp) {
      return true;
    }
    return Date.now() - cacheData.timestamp > ttl;
  }, [cacheData, ttl]);

  const get = useCallback(() => {
    if (!cacheData || isExpired()) {
      return null;
    }
    return cacheData.data;
  }, [cacheData, isExpired]);

  const set = useCallback((data) => {
    setCacheData({
      data,
      timestamp: Date.now()
    });
  }, [setCacheData]);

  const clear = useCallback(() => {
    setCacheData(null);
  }, [setCacheData]);

  const refresh = useCallback((data) => {
    set(data);
  }, [set]);

  return {
    get,
    set,
    clear,
    refresh,
    isExpired: isExpired(),
    hasData: !!cacheData && !isExpired()
  };
};

/**
 * Hook for managing form draft with auto-save
 * @param {string} formId - Unique form identifier
 * @param {Object} initialValues - Initial form values
 * @param {Object} options - Configuration options
 * @returns {Object} - Draft state and handlers
 */
export const useFormDraft = (formId, initialValues = {}, options = {}) => {
  const {
    autoSaveDelay = 1000,
    clearOnSubmit = true
  } = options;

  const draftKey = `form_draft_${formId}`;
  const [draft, setDraft] = useLocalStorage(draftKey, null);
  const timeoutRef = useRef(null);

  // Get current values (draft or initial)
  const getCurrentValues = useCallback(() => {
    return draft?.data || initialValues;
  }, [draft, initialValues]);

  // Save draft with debounce
  const saveDraft = useCallback((values) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDraft({
        data: values,
        timestamp: Date.now()
      });
    }, autoSaveDelay);
  }, [setDraft, autoSaveDelay]);

  // Clear draft
  const clearDraft = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setDraft(null);
  }, [setDraft]);

  // Check if draft exists
  const hasDraft = useCallback(() => {
    return !!draft?.data;
  }, [draft]);

  // Get draft age in minutes
  const getDraftAge = useCallback(() => {
    if (!draft?.timestamp) return 0;
    return Math.floor((Date.now() - draft.timestamp) / 60000);
  }, [draft]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    getCurrentValues,
    saveDraft,
    clearDraft,
    hasDraft: hasDraft(),
    draftAge: getDraftAge(),
    lastSaved: draft?.timestamp
  };
};

export default useLocalStorage;