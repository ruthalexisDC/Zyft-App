/**
 * errors/ApiError.js
 *
 * Custom error classes so controllers can do:
 *
 *   throw new NotFoundError('Post not found');
 *
 * instead of manually building res.status(...).json(...) in every branch.
 * ErrorHandler.js reads `err.errors` for field-level detail (to match
 * sendError's `errors` param) — NOT `err.details`.
 */

export class ApiError extends Error {
  constructor(message, { statusCode = 500, errors } = {}) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errors = errors; // e.g. [{ field: 'email', message: 'Email is required' }]
    this.isOperational = true; // expected error, not a bug/crash

    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class BadRequestError extends ApiError {
  constructor(message = 'Bad request', errors) {
    super(message, { statusCode: 400, errors });
  }
}

export class ValidationError extends ApiError {
  constructor(message = 'Invalid request', errors) {
    super(message, { statusCode: 400, errors });
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Authentication required') {
    super(message, { statusCode: 401 });
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Not authorized to perform this action') {
    super(message, { statusCode: 403 });
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Resource not found') {
    super(message, { statusCode: 404 });
  }
}

export class ConflictError extends ApiError {
  constructor(message = 'Resource already exists') {
    super(message, { statusCode: 409 });
  }
}