// /**
//  * utils/apiResponse.js
//  *
//  * Response shape (Step 4 — Standardize Response Format):
//  *
//  * Success:
//  *   { "success": true, "message"?: "...", "data"?: {} }
//  *
//  * Error:
//  *   { "success": false, "message": "...", "errors"?: [{ field, message }] }
//  */

// export const sendSuccess = (
//   res,
//   { statusCode = 200, message, data } = {}
// ) => {
//   return res.status(statusCode).json({
//     success: true,
//     ...(message && { message }),
//     ...(data !== undefined && { data }),
//   });
// };

// export const sendError = (
//   res,
//   { statusCode = 500, message = 'Internal Server Error', errors } = {}
// ) => {
//   return res.status(statusCode).json({
//     success: false,
//     message,
//     ...(errors !== undefined && { errors }),
//   });
// };


/**
 * utils/apiResponse.js
 *
 * Success:
 *   { success: true, message?: string, data?: any, meta?: object }
 *
 * Error:
 *   { success: false, message: string, errors?: array }
 */

export const sendSuccess = (
  res,
  {
    statusCode = 200,
    message,
    data,
    meta,
    pagination,
  } = {}
) => {
  // Support both the new meta.pagination format and
  // existing callers that pass pagination directly.
  const normalizedMeta =
    pagination !== undefined
      ? {
          ...(meta ?? {}),
          pagination,
        }
      : meta;

  return res.status(statusCode).json({
    success: true,
    ...(message && { message }),
    ...(data !== undefined && { data }),
    ...(normalizedMeta !== undefined && {
      meta: normalizedMeta,
    }),
  });
};

export const sendError = (
  res,
  {
    statusCode = 500,
    message = "Internal Server Error",
    errors,
  } = {}
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors !== undefined && { errors }),
  });
};
