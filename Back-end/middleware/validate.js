import { sendError } from "../utils/apiResponse.js";

export const validate = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      return sendError(res, {
      statusCode: 400,
      message: "Validation failed",
      errors,
});
    }

    // Store validated data separately.
    // Do not overwrite req.body, req.params, or req.query.
    req.validated = result.data;

    next();
  };
};