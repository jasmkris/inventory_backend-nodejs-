export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

// Helper function to handle common error scenarios
export const handleError = (error: Error) => {
  if (error instanceof ValidationError) {
    return { status: 400, message: error.message };
  }
  if (error instanceof AuthorizationError) {
    return { status: 403, message: error.message };
  }
  if (error instanceof NotFoundError) {
    return { status: 404, message: error.message };
  }
  if (error instanceof ConflictError) {
    return { status: 409, message: error.message };
  }
  if (error instanceof DatabaseError) {
    return { status: 500, message: 'Database operation failed' };
  }
  
  // Default error handling
  console.error('Unhandled error:', error);
  return { status: 500, message: 'Internal server error' };
}; 