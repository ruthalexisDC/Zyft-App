// middleware/ErrorHandler.js

import { sendError } from "../utils/apiResponse.js";

const errorHandler = (err, req, res, next) => {
  console.error(err);

  // Prevent sending a second response
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let errors = err.errors;

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

  // Do not expose unexpected server errors
  if (statusCode === 500) {
    message = "Internal Server Error";
  }

  return sendError(res, {
    statusCode,
    message,

    ...(process.env.NODE_ENV === "development" &&
      errors !== undefined && {
        errors,
      }),
  });
};

export default errorHandler;