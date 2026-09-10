import express from "express";

import auth from "../middleware/authMiddleware.js";

import { validate } from "../middleware/validate.js";

import {
  createWorkoutSchema,
  updateWorkoutSchema,
} from "../validators/workoutValidators.js";

import {
  createWorkout,
  getWorkouts,
  getWorkoutById,
  getWorkoutByPostId,
  updateWorkout,
} from "../controllers/workoutController.js";

const router = express.Router();

router.get(
  "/",
  auth,
  getWorkouts
);

router.get(
  "/by-post/:postId",
  auth,
  getWorkoutByPostId
);

router.get(
  "/:id",
  auth,
  getWorkoutById
);

router.patch(
  "/:id",
  auth,
  validate(updateWorkoutSchema),
  updateWorkout
);

router.post(
  "/",
  auth,
  validate(createWorkoutSchema),
  createWorkout
);

export default router;