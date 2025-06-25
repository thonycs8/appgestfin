export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'AUTHORIZATION_ERROR', 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT', 429);
    this.name = 'RateLimitError';
  }
}

export class ServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(message, 'SERVER_ERROR', 500);
    this.name = 'ServerError';
  }
}

export function handleError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    // Handle specific error types
    if (error.message.includes('rate limit')) {
      return new RateLimitError(error.message);
    }
    
    if (error.message.includes('unauthorized') || error.message.includes('authentication')) {
      return new AuthenticationError(error.message);
    }
    
    if (error.message.includes('forbidden') || error.message.includes('permission')) {
      return new AuthorizationError(error.message);
    }
    
    if (error.message.includes('not found')) {
      return new NotFoundError(error.message);
    }
    
    if (error.message.includes('validation') || error.message.includes('invalid')) {
      return new ValidationError(error.message);
    }
    
    return new ServerError(error.message);
  }

  return new ServerError('An unexpected error occurred');
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
      SERVER_ERROR: 'Erro interno do servidor'
    },
    en: {
      VALIDATION_ERROR: 'Invalid data provided',
      AUTH_ERROR: 'Authentication required',
      AUTHORIZATION_ERROR: 'Insufficient permissions',
      NOT_FOUND: 'Resource not found',
      RATE_LIMIT: 'Too many attempts. Please try again in a few minutes',
      SERVER_ERROR: 'Internal server error'
    }
  };

  return messages[language][appError.code as keyof typeof messages.pt] || appError.message;
}

// Global error handler for unhandled promises
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    // Prevent the default browser behavior
    event.preventDefault();
    
    // You could send this to an error reporting service
    // reportError(event.reason);
  });
}

// Error reporting function (placeholder)
export function reportError(error: unknown, context?: Record<string, any>) {
  const appError = handleError(error);
  
  // In production, send to error reporting service like Sentry
  console.error('Error reported:', {
    message: appError.message,
    code: appError.code,
    statusCode: appError.statusCode,
    stack: appError.stack,
    context,
    timestamp: new Date().toISOString(),
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
    url: typeof window !== 'undefined' ? window.location.href : 'server'
  });
}