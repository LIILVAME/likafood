import React, { memo, useMemo, useCallback, lazy, Suspense } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

/**
 * Higher-order component for performance optimization
 * @param {React.Component} Component - Component to optimize
 * @param {Object} options - Optimization options
 * @returns {React.Component} - Optimized component
 */
export const withPerformanceOptimization = (Component, options = {}) => {
  const {
    memoize = true,
    lazyLoad = false,
    displayName = Component.displayName || Component.name
  } = options;

  let OptimizedComponent = Component;

  // Apply memoization
  if (memoize) {
    OptimizedComponent = memo(OptimizedComponent, (prevProps, nextProps) => {
      // Custom comparison function for better performance
      const prevKeys = Object.keys(prevProps);
      const nextKeys = Object.keys(nextProps);
      
      if (prevKeys.length !== nextKeys.length) {
        return false;
      }
      
      return prevKeys.every(key => {
        const prevValue = prevProps[key];
        const nextValue = nextProps[key];
        
        // Deep comparison for objects and arrays
        if (typeof prevValue === 'object' && prevValue !== null) {
          return JSON.stringify(prevValue) === JSON.stringify(nextValue);
        }
        
        return prevValue === nextValue;
      });
    });
  }

  // Apply lazy loading
  if (lazyLoad) {
    const LazyComponent = lazy(() => Promise.resolve({ default: OptimizedComponent }));
    OptimizedComponent = (props) => (
      <Suspense fallback={<LoadingSpinner />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  }

  OptimizedComponent.displayName = `Optimized(${displayName})`;
  return OptimizedComponent;
};

/**
 * Hook for optimizing expensive calculations
 * @param {Function} calculation - Expensive calculation function
 * @param {Array} dependencies - Dependencies array
 * @param {Object} options - Optimization options
 * @returns {*} - Memoized result
 */
export const useOptimizedCalculation = (calculation, dependencies, options = {}) => {
  const { debounceMs = 0, cacheSize = 10 } = options;
  
  // Cache for storing previous results
  const cache = useMemo(() => new Map(), []);
  
  return useMemo(() => {
    // Create cache key from dependencies
    const cacheKey = JSON.stringify(dependencies);
    
    // Check if result is already cached
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }
    
    // Calculate new result
    const result = calculation();
    
    // Store in cache with size limit
    if (cache.size >= cacheSize) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    cache.set(cacheKey, result);
    
    return result;
  }, dependencies);
};

/**
 * Hook for optimizing event handlers
 * @param {Function} handler - Event handler function
 * @param {Array} dependencies - Dependencies array
 * @returns {Function} - Optimized handler
 */
export const useOptimizedCallback = (handler, dependencies) => {
  return useCallback(handler, dependencies);
};

/**
 * Hook for debouncing values
 * @param {*} value - Value to debounce
 * @param {number} delay - Debounce delay in milliseconds
 * @returns {*} - Debounced value
 */
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook for throttling function calls
 * @param {Function} callback - Function to throttle
 * @param {number} delay - Throttle delay in milliseconds
 * @returns {Function} - Throttled function
 */
export const useThrottle = (callback, delay) => {
  const lastRan = React.useRef(Date.now());

  return useCallback((...args) => {
    if (Date.now() - lastRan.current >= delay) {
      callback(...args);
      lastRan.current = Date.now();
    }
  }, [callback, delay]);
};

/**
 * Component for measuring and displaying performance metrics
 */
export const PerformanceMonitor = memo(({ children, onMetrics }) => {
  const [metrics, setMetrics] = React.useState({
    renderTime: 0,
    renderCount: 0,
    lastRender: null
  });

  const startTime = React.useRef(null);

  React.useEffect(() => {
    startTime.current = performance.now();
  });

  React.useLayoutEffect(() => {
    if (startTime.current) {
      const renderTime = performance.now() - startTime.current;
      const newMetrics = {
        renderTime,
        renderCount: metrics.renderCount + 1,
        lastRender: new Date().toISOString()
      };
      
      setMetrics(newMetrics);
      
      if (onMetrics) {
        onMetrics(newMetrics);
      }
    }
  });

  if (process.env.NODE_ENV === 'development') {
    return (
      <div>
        {children}
        <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs font-mono z-50">
          <div>Render: {metrics.renderTime.toFixed(2)}ms</div>
          <div>Count: {metrics.renderCount}</div>
        </div>
      </div>
    );
  }

  return children;
});

/**
 * Hook for intersection observer (lazy loading images, infinite scroll)
 * @param {Object} options - Intersection observer options
 * @returns {Array} - [ref, isIntersecting, entry]
 */
export const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = React.useState(false);
  const [entry, setEntry] = React.useState(null);
  const elementRef = React.useRef(null);

  React.useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        setEntry(entry);
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [options]);

  return [elementRef, isIntersecting, entry];
};

/**
 * Optimized image component with lazy loading
 */
export const OptimizedImage = memo(({ src, alt, className, placeholder, ...props }) => {
  const [imageRef, isIntersecting] = useIntersectionObserver();
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
  }, []);

  return (
    <div ref={imageRef} className={`relative ${className}`}>
      {isIntersecting && !hasError && (
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          {...props}
        />
      )}
      
      {(!isIntersecting || !isLoaded) && !hasError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          {placeholder || (
            <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      )}
      
      {hasError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-gray-400 text-center">
            <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-xs">Failed to load</span>
          </div>
        </div>
      )}
    </div>
  );
});

/**
 * Virtual list component for large datasets
 */
export const VirtualList = memo(({ items, itemHeight, containerHeight, renderItem, className }) => {
  const [scrollTop, setScrollTop] = React.useState(0);
  const containerRef = React.useRef(null);

  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );

  const visibleItems = items.slice(visibleStart, visibleEnd);
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleStart * itemHeight;

  const handleScroll = useThrottle((e) => {
    setScrollTop(e.target.scrollTop);
  }, 16); // ~60fps

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) =>
            renderItem(item, visibleStart + index)
          )}
        </div>
      </div>
    </div>
  );
});

export default {
  withPerformanceOptimization,
  useOptimizedCalculation,
  useOptimizedCallback,
  useDebounce,
  useThrottle,
  PerformanceMonitor,
  useIntersectionObserver,
  OptimizedImage,
  VirtualList
};