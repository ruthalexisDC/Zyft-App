export const sendSuccess = (
  res,
  {
    statusCode = 200,
    message,
    data,
  } = {}
) => {
  return res.status(statusCode).json({
    success: true,
    ...(message && { message }),
    ...(data !== undefined && { data }),
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

/**

 * Pure helper functions that build the standardized response shapes
 * defined in the API refactor roadmap (Step 4 — Standardize Response Format).
 *
 * Success (single resource):
 * { "data": {} }
 *
 * Success (collection, paginated):
 * { "data": [], "pagination": { ...whatever pagination meta you pass... } }
 *
 * NOTE: `pagination` is intentionally passed through as-is rather than
 * forced into a { nextCursor, hasNextPage } shape. Some endpoints
 * (getFeed, getUserPosts) still use page/limit pagination — that gets
 * standardized to cursors in Step 11, not here.
 */
 
export function buildSuccess(data) {
  return { data };
}
 
export function buildPaginated(data, pagination = {}) {
  return { data, pagination };
}