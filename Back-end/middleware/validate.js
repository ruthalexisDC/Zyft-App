import { sendError } from "../utils/apiResponse.js";

export const validate = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body ?? {},
      params: req.params ?? {},
      query: req.query ?? {},
    });

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      console.error("Validation errors:", errors);

      return sendError(res, {
        statusCode: 400,
        message: "Validation failed",
        errors,
      });
    }

    req.validated = result.data;

    next();
  };
};