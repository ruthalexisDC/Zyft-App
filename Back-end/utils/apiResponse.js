/**
 * utils/apiResponse.js
 *
 * Response shape (Step 4 — Standardize Response Format):
 *
 * Success:
 *   { "success": true, "message"?: "...", "data"?: {} }
 *
 * Error:
 *   { "success": false, "message": "...", "errors"?: [{ field, message }] }
 */

export const sendSuccess = (
  res,
  { statusCode = 200, message, data } = {}
) => {
  return res.status(statusCode).json({
    success: true,
    ...(message && { message }),
    ...(data !== undefined && { data }),
  });
};

export const sendError = (
  res,
  { statusCode = 500, message = 'Internal Server Error', errors } = {}
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors !== undefined && { errors }),
  });
};