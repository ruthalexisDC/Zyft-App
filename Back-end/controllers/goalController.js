import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";

import { UnauthorizedError } from "../errors/ApiError.js";

import { setUserGoalService } from "../services/goalService.js";

const requireUserId = (req) => {
  const userId = req.user?._id ?? req.user?.id;

  if (!userId) {
    throw new UnauthorizedError("User authentication required");
  }

  return userId;
};

// PATCH /api/users/goal
export const setUserGoal = asyncHandler(async (req, res) => {
  const userId = requireUserId(req);
  const { totalGoals } = req.body;

  const goal = await setUserGoalService({
    userId,
    totalGoals,
  });

  return sendSuccess(res, {
    message: "Goal set successfully",
    data: {
      goal,
    },
  });
});