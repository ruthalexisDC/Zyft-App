import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";

import { UnauthorizedError } from "../errors/ApiError.js";

import {
  getUserStatsService,
  resetDailyGoalsService,
} from "../services/statsService.js";

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────

const requireUserId = (req) => {
  const userId = req.user?._id ?? req.user?.id;

  if (!userId) {
    throw new UnauthorizedError("User authentication required");
  }

  return userId;
};

// ─────────────────────────────────────────
// GET USER STATS
// GET /api/stats
// ─────────────────────────────────────────

export const getUserStats = asyncHandler(async (req, res) => {
  const userId = requireUserId(req);

  const result = await getUserStatsService({
    userId,
  });

  return sendSuccess(res, {
    data: result,
  });
});

// ─────────────────────────────────────────
// RESET DAILY GOALS
// ─────────────────────────────────────────

export const resetDailyGoals = asyncHandler(async (req, res) => {
  const userId = requireUserId(req);

  const result = await resetDailyGoalsService({
    userId,
  });

  return sendSuccess(res, {
    data: result,
  });
});