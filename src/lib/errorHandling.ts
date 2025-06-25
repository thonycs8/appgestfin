export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string, context?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', 400, { field, ...context });
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', context?: Record<string, any>) {
    super(message, 'AUTH_ERROR', 401, context);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions', context?: Record<string, any>) {
    super(message, 'AUTHORIZATION_ERROR', 403, context);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', context?: Record<string, any>) {
    super(message, 'NOT_FOUND', 404, context);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', context?: Record<string, any>) {
    super(message, 'RATE_LIMIT', 429, context);
    this.name = 'RateLimitError';
  }
}

export class ServerError extends AppError {
  constructor(message: string = 'Internal server error', context?: Record<string, any>) {
    super(message, 'SERVER_ERROR', 500, context);
    this.name = 'ServerError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, code?: string, context?: Record<string, any>) {
    super(message, code || 'DATABASE_ERROR', 500, context);
    this.name = 'DatabaseError';
  }
}

export class FinancialError extends AppError {
  constructor(message: string, operation: string, context?: Record<string, any>) {
    super(message, 'FINANCIAL_ERROR', 400, { operation, ...context });
    this.name = 'FinancialError';
  }
}

export function handleError(error: unknown, context?: Record<string, any>): AppError {
  // If it's already an AppError, just return it
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    // Handle specific error types
    if (error.message.includes('rate limit')) {
      return new RateLimitError(error.message, context);
    }
    
    if (error.message.includes('unauthorized') || error.message.includes('authentication')) {
      return new AuthenticationError(error.message, context);
    }
    
    if (error.message.includes('forbidden') || error.message.includes('permission')) {
      return new AuthorizationError(error.message, context);
    }
    
    if (error.message.includes('not found')) {
      return new NotFoundError(error.message, context);
    }
    
    if (error.message.includes('validation') || error.message.includes('invalid')) {
      return new ValidationError(error.message, undefined, context);
    }
    
    return new ServerError(error.message, context);
  }

  return new ServerError('An unexpected error occurred', { originalError: error, ...context });
}

export function getErrorMessage(error: unknown, language: 'pt' | 'en' = 'pt'): string {
  const appError = handleError(error);
  
  const messages = {
    pt: {
      VALIDATION_ERROR: 'Dados inválidos fornecidos',
      AUTH_ERROR: 'Autenticação necessária',
      AUTHORIZATION_ERROR: 'Permissões insuficientes',
      NOT_FOUND: 'Recurso não encontrado',
      RATE_LIMIT: 'Muitas tentativas. Tente novamente em alguns minutos',
      SERVER_ERROR: 'Erro interno do servidor',
      DATABASE_ERROR: 'Erro no banco de dados',
      FINANCIAL_ERROR: 'Erro na operação financeira'
    },
    en: {
      VALIDATION_ERROR: 'Invalid data provided',
      AUTH_ERROR: 'Authentication required',
      AUTHORIZATION_ERROR: 'Insufficient permissions',
      NOT_FOUND: 'Resource not found',
      RATE_LIMIT: 'Too many attempts. Please try again in a few minutes',
      SERVER_ERROR: 'Internal server error',
      DATABASE_ERROR: 'Database error',
      FINANCIAL_ERROR: 'Financial operation error'
    }
  };

  return messages[language][appError.code as keyof typeof messages.pt] || appError.message;
}

// Global error handler for unhandled promises
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    event.preventDefault();
  });

  // Global error handler for uncaught exceptions
  window.addEventListener('error', (event) => {
    console.error('Uncaught error:', event.error);
  });
}

// Error reporting function
export function reportError(error: unknown, context?: Record<string, any>) {
  const appError = handleError(error, context);
  
  // Log to console in development
  if (import.meta.env.DEV) {
    console.error('Error reported:', {
      message: appError.message,
      code: appError.code,
      statusCode: appError.statusCode,
      stack: appError.stack,
      context: appError.context,
      timestamp: new Date().toISOString(),
    });
  }
}

// Performance monitoring wrapper
export async function withErrorHandling<T>(
  operation: string,
  fn: () => Promise<T>,
  context?: Record<string, any>
): Promise<T> {
  try {
    const result = await fn();
    return result;
  } catch (error) {
    const appError = handleError(error, { operation, ...context });
    throw appError;
  }
}