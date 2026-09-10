// middleware/authMiddleware.js

import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { sendError } from "../utils/apiResponse.js";

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Check Authorization header
    if (!authHeader?.startsWith("Bearer ")) {
      return sendError(res, {
        statusCode: 401,
        message: "No authentication token provided",
      });
    }

    const token = authHeader.split(" ")[1];

    console.log("AUTH:", req.method, req.originalUrl);
console.log("TOKEN:", token);
console.log("JWT_SECRET EXISTS:", !!process.env.JWT_SECRET);

    // Verify access token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // Validate token payload
    if (!decoded.userId) {
      return sendError(res, {
        statusCode: 401,
        message: "Invalid authentication token",
      });
    }

    // Find authenticated user
    const user = await User.findById(decoded.userId)
      .select("-password");

    // Token is valid, but user no longer exists
    if (!user) {
      return sendError(res, {
        statusCode: 401,
        message: "User associated with this token no longer exists",
      });
    }

    // Attach authenticated user
    req.user = user;

    return next();

  } catch (err) {
    if (
      err.name === "JsonWebTokenError" ||
      err.name === "TokenExpiredError"
    ) {
      return sendError(res, {
        statusCode: 401,
        message: "Invalid or expired authentication token",
      });
    }

    return next(err);
  }
};

export default auth;