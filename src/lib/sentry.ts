import * as Sentry from '@sentry/react';
import React from 'react';

// Sentry configuration
export const initSentry = () => {
  // Only initialize Sentry in production or if explicitly enabled
  const shouldInitialize = import.meta.env.PROD || import.meta.env.VITE_ENABLE_SENTRY === 'true';
  
  if (!shouldInitialize) {
    console.log('Sentry disabled in development mode');
    return;
  }

  const dsn = import.meta.env.VITE_SENTRY_DSN;
  
  if (!dsn) {
    console.warn('Sentry DSN not found. Error monitoring disabled.');
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
    ],
    
    // Performance monitoring
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0, // 10% in production, 100% in dev
    
    // Session replay
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
    
    // Release tracking
    release: import.meta.env.VITE_APP_VERSION || '1.0.0',
    
    // Additional configuration
    beforeSend(event, hint) {
      // Filter out certain errors in production
      if (import.meta.env.PROD) {
        // Don't send network errors that are likely user connectivity issues
        if (event.exception?.values?.[0]?.type === 'NetworkError') {
          return null;
        }
        
        // Don't send errors from browser extensions
        if (event.exception?.values?.[0]?.stacktrace?.frames?.some(
          frame => frame.filename?.includes('extension://')
        )) {
          return null;
        }
      }
      
      return event;
    },
    
    // Set user context
    initialScope: {
      tags: {
        component: 'gestfin-frontend',
      },
    },
  });
};

// Custom error boundary component
export const SentryErrorBoundary = Sentry.withErrorBoundary;

// Custom hooks for Sentry
export const useSentryUser = () => {
  const setUser = (user: {
    id: string;
    email?: string;
    username?: string;
    subscription?: string;
  }) => {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
      subscription: user.subscription,
    });
  };

  const clearUser = () => {
    Sentry.setUser(null);
  };

  return { setUser, clearUser };
};

// Performance monitoring helpers
export const startTransaction = (name: string, op: string) => {
  return Sentry.startTransaction({ name, op });
};

export const addBreadcrumb = (message: string, category: string, level: Sentry.SeverityLevel = 'info') => {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    timestamp: Date.now() / 1000,
  });
};

// Custom error reporting
export const captureError = (error: Error, context?: Record<string, any>) => {
  Sentry.withScope((scope) => {
    if (context) {
      Object.keys(context).forEach(key => {
        scope.setContext(key, context[key]);
      });
    }
    Sentry.captureException(error);
  });
};

export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, any>) => {
  Sentry.withScope((scope) => {
    if (context) {
      Object.keys(context).forEach(key => {
        scope.setContext(key, context[key]);
      });
    }
    Sentry.captureMessage(message, level);
  });
};

// Financial operation tracking
export const trackFinancialOperation = (operation: string, data: Record<string, any>) => {
  addBreadcrumb(`Financial operation: ${operation}`, 'finance', 'info');
  
  Sentry.withScope((scope) => {
    scope.setTag('operation_type', 'financial');
    scope.setContext('financial_operation', {
      operation,
      timestamp: new Date().toISOString(),
      ...data,
    });
  });
};

// Database operation tracking
export const trackDatabaseOperation = (operation: string, table: string, success: boolean, duration?: number) => {
  addBreadcrumb(`Database ${operation} on ${table}: ${success ? 'success' : 'failed'}`, 'database');
  
  if (!success) {
    captureMessage(`Database operation failed: ${operation} on ${table}`, 'warning', {
      database_operation: {
        operation,
        table,
        duration,
      },
    });
  }
};

// Authentication tracking
export const trackAuthEvent = (event: string, userId?: string) => {
  addBreadcrumb(`Auth event: ${event}`, 'auth');
  
  Sentry.withScope((scope) => {
    scope.setTag('auth_event', event);
    if (userId) {
      scope.setUser({ id: userId });
    }
  });
};

// Subscription tracking
export const trackSubscriptionEvent = (event: string, planId?: string, amount?: number) => {
  addBreadcrumb(`Subscription event: ${event}`, 'subscription');
  
  Sentry.withScope((scope) => {
    scope.setTag('subscription_event', event);
    scope.setContext('subscription', {
      event,
      planId,
      amount,
      timestamp: new Date().toISOString(),
    });
  });
};

// Performance monitoring for API calls
export const withPerformanceMonitoring = async <T>(
  operation: string,
  fn: () => Promise<T>,
  context?: Record<string, any>
): Promise<T> => {
  const transaction = startTransaction(operation, 'http.client');
  const startTime = Date.now();
  
  try {
    const result = await fn();
    const duration = Date.now() - startTime;
    
    transaction.setStatus('ok');
    transaction.setData('duration', duration);
    
    if (context) {
      Object.keys(context).forEach(key => {
        transaction.setData(key, context[key]);
      });
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    transaction.setStatus('internal_error');
    transaction.setData('duration', duration);
    
    captureError(error as Error, {
      operation,
      duration,
      ...context,
    });
    
    throw error;
  } finally {
    transaction.finish();
  }
};

export { Sentry };