// middleware/ErrorHandler.js

import { sendError } from "../utils/apiResponse.js";
import { ApiError, NotFoundError } from "../errors/ApiError.js";

// 404 handler for routes that don't match anything. Mount right before
// errorHandler, after all your route definitions.
export const notFoundHandler = (req, res, next) => {
  next(new NotFoundError(`Route not found: ${req.method} ${req.originalUrl}`));
};

const errorHandler = (err, req, res, next) => {
  console.error(err);

  // Prevent sending a second response
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let errors = err.errors;

  // Below branches translate raw driver/library errors (Mongoose, MongoDB)
  // into our shape. Skip them for our own ApiError subclasses — those
  // already set statusCode/errors correctly in their constructor, and
  // sadly share `err.name === "ValidationError"` with Mongoose's native
  // error, so without this guard a thrown `new ValidationError(...)`
  // would get its already-correct `errors` array mangled below.
  if (!(err instanceof ApiError)) {
    // Mongoose validation error
    if (err.name === "ValidationError") {
      statusCode = 400;

      errors = Object.values(err.errors).map((error) => ({
        field: error.path,
        message: error.message,
      }));
    }

    // MongoDB duplicate key error
    if (err.code === 11000) {
      statusCode = 409;

      const field = Object.keys(err.keyValue || {})[0];

      message = field
        ? `${field} already exists`
        : "Duplicate value already exists";
    }

    // Invalid MongoDB ObjectId
    if (err.name === "CastError") {
      statusCode = 400;
      message = `Invalid ${err.path}`;
    }
  }

  // Do not expose unexpected server errors
  if (statusCode >= 500) {
    message = "Internal Server Error";
  }

  // Field-level errors are safe to show regardless of environment —
  // they're expected validation feedback, not internals. Only the
  // generic 5xx message above is environment-gated.
  return sendError(res, {
    statusCode,
    message,
    ...(errors !== undefined && { errors }),
  });
};

export default errorHandler;