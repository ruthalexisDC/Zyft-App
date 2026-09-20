import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";

import { UnauthorizedError } from "../errors/ApiError.js";

// Services
import {
  getWorkoutsService,
  getWorkoutByIdService,
  getWorkoutByPostIdService,
  createWorkoutService,
  updateWorkoutService,
} from "../services/workoutService.js";

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────

const requireUserId = (req) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new UnauthorizedError("User authentication required");
  }

  return userId;
};

// ─────────────────────────────────────────
// GET WORKOUTS
// GET /api/workouts
// ─────────────────────────────────────────

export const getWorkouts = asyncHandler(async (req, res) => {
  const userId = requireUserId(req);

  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);

  const limit = Math.min(
    Math.max(Number.parseInt(req.query.limit, 10) || 20, 1),
    50,
  );

  const result = await getWorkoutsService({ userId, page, limit });

  return sendSuccess(res, { data: result });
});

// ─────────────────────────────────────────
// GET WORKOUT BY POST ID
// GET /api/workouts/by-post/:postId
// ─────────────────────────────────────────

export const getWorkoutByPostId = asyncHandler(async (req, res) => {
  const userId = requireUserId(req);

  const result = await getWorkoutByPostIdService({
    postId: req.params.postId,
    userId,
  });

  return sendSuccess(res, { data: result });
});

// ─────────────────────────────────────────
// GET WORKOUT BY ID
// GET /api/workouts/:id
// ─────────────────────────────────────────

export const getWorkoutById = asyncHandler(async (req, res) => {
  const userId = requireUserId(req);

  const result = await getWorkoutByIdService({
    workoutId: req.params.id,
    userId,
  });

  return sendSuccess(res, { data: result });
});

// ─────────────────────────────────────────
// CREATE WORKOUT
// POST /api/workouts
// ─────────────────────────────────────────

export const createWorkout = asyncHandler(async (req, res) => {
  const userId = requireUserId(req);

  const result = await createWorkoutService({
    userId,
    body: req.validated.body,
  });

  return sendSuccess(res, {
    statusCode: 201,
    data: result,
  });
});

// ─────────────────────────────────────────
// UPDATE WORKOUT
// PATCH /api/workouts/:id
// ─────────────────────────────────────────

export const updateWorkout = asyncHandler(async (req, res) => {
  const userId = requireUserId(req);

  const result = await updateWorkoutService({
    workoutId: req.validated.params.id,
    userId,
    body: req.validated.body,
  });

  return sendSuccess(res, { data: result });
});