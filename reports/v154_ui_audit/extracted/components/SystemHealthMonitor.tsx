
import React, { useEffect, useRef } from 'react';
import { logActivity } from '../utils/logger';
import { useToast } from '../context/ToastContext';

/**
 * SystemHealthMonitor
 * Acts as a runtime code reviewer. It intercepts non-fatal errors,
 * console warnings, and performance bottlenecks.
 */
const SystemHealthMonitor: React.FC = () => {
  const { warning } = useToast();
  const originalConsoleError = useRef(console.error);
  const originalConsoleWarn = useRef(console.warn);
  const originalFetch = useRef(window.fetch);
  
  // Throttle logs to prevent flooding database
  const logBuffer = useRef<Set<string>>(new Set());

  useEffect(() => {
    // 1. Intercept Console Errors (Non-fatal application errors)
    try {
        console.error = (...args) => {
            originalConsoleError.current.apply(console, args);
            handleLogIntercept('error', args);
        };
    } catch (e) {
        // Console interception might be blocked
    }

    // 2. Intercept Console Warnings (React warnings, Deprecations)
    try {
        console.warn = (...args) => {
            originalConsoleWarn.current.apply(console, args);
            handleLogIntercept('warning', args);
        };
    } catch (e) {
        // Console interception might be blocked
    }

    // 3. Monitor Network Requests (Fetch Wrapper)
    // Wrapped in try-catch because 'fetch' is read-only in some environments
    try {
        window.fetch = async (...args) => {
            const startTime = performance.now();
            try {
                const response = await originalFetch.current.apply(window, args);
                
                // Log Slow Requests (> 2 seconds)
                const duration = performance.now() - startTime;
                if (duration > 2000) {
                    logHealthIssue('performance', `بطء شبكة: استغرق الطلب ${Math.round(duration)}ms`, args[0].toString());
                }

                // Log Failed Requests (4xx, 5xx)
                if (!response.ok) {
                    logHealthIssue('network', `فشل طلب شبكة: ${response.status} ${response.statusText}`, args[0].toString());
                }
                
                return response;
            } catch (error: any) {
                logHealthIssue('network', `خطأ اتصال: ${error.message}`, args[0].toString());
                throw error;
            }
        };
    } catch (e) {
        // Silently ignore fetch interception failure in restricted environments
    }

    // 4. Performance Observer (Long Tasks that freeze UI)
    let perfObserver: PerformanceObserver | null = null;
    try {
        if ('PerformanceObserver' in window) {
            perfObserver = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    if (entry.duration > 100) { // Tasks taking > 100ms
                        logHealthIssue('performance', `تجميد واجهة (Long Task): ${Math.round(entry.duration)}ms`, 'UI Lag Detected');
                    }
                });
            });
            perfObserver.observe({ entryTypes: ['longtask'] });
        }
    } catch (e) {
        // Observer not supported
    }

    // Cleanup: Restore originals
    return () => {
        try { console.error = originalConsoleError.current; } catch(e){}
        try { console.warn = originalConsoleWarn.current; } catch(e){}
        try { window.fetch = originalFetch.current; } catch(e){}
        if (perfObserver) perfObserver.disconnect();
    };
  }, []);

  const handleLogIntercept = (level: 'error' | 'warning', args: any[]) => {
      try {
          const message = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
          
          // Filter out benign warnings (optional)
          if (message.includes('React Router') || message.includes('HMR')) return;
          
          // Filter out the specific fetch interceptor warning if it leaks through
          if (message.includes('Cannot intercept window.fetch')) return;

          const key = `${level}:${message.substring(0, 50)}`; // Create signature
          
          // Prevent spamming the same error multiple times per session
          if (!logBuffer.current.has(key)) {
              logBuffer.current.add(key);
              
              // Only log serious warnings or errors to DB
              logHealthIssue('system', `[Monitor] ${level.toUpperCase()}: ${message.substring(0, 100)}...`, message);
          }
      } catch (e) {
          // Safety net
      }
  };

  const logHealthIssue = async (type: string, title: string, details: string) => {
      // We use the existing logger but with a 'system' type
      await logActivity(
          'system', 
          title, 
          details, 
          0, 
          undefined, 
          type === 'network' ? 'warning' : 'error'
      );
  };

  return null; // Invisible Component
};

export default SystemHealthMonitor;
