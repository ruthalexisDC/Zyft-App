import mongoose from "mongoose";

import Workout from "../models/Workout.js";
import User from "../models/User.js";
import Post from "../models/Post.js";

import {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} from "../errors/ApiError.js";

// ─────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────

const ALLOWED_VISIBILITY = ["private", "followers", "public"];

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────

// Missing / empty values default to 0.
// Anything else must be a finite, non-negative number.
const parseNonNegativeNumber = (value, label) => {
  if (value === undefined || value === null || value === "") {
    return 0;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new BadRequestError(`${label} must be a valid non-negative number`);
  }

  return parsed;
};

const assertValidObjectId = (id, label) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError(`Invalid ${label}`);
  }
};

// ─────────────────────────────────────────
// EXPAND EXERCISE
// ─────────────────────────────────────────

export function expandExercise(ex) {
  if (!ex || typeof ex !== "object") {
    throw new BadRequestError("Each exercise must be a valid object");
  }

  // ─────────────────────────────────────
  // EXERCISE NAME
  // ─────────────────────────────────────

  if (typeof ex.name !== "string" || ex.name.trim().length === 0) {
    throw new BadRequestError("Exercise name is required");
  }

  const normalizedName = ex.name.trim();

  if (normalizedName.length > 100) {
    throw new BadRequestError("Exercise name cannot exceed 100 characters");
  }

  // ─────────────────────────────────────
  // SETS
  // ─────────────────────────────────────

  let setsCount = 1;

  if (ex.sets !== undefined && ex.sets !== null && ex.sets !== "") {
    setsCount = Number(ex.sets);

    // Number.isInteger already rejects NaN and Infinity
    if (!Number.isInteger(setsCount) || setsCount < 1) {
      throw new BadRequestError("Exercise sets must be a positive integer");
    }
  }

  if (setsCount > 100) {
    throw new BadRequestError("An exercise cannot contain more than 100 sets");
  }

  // ─────────────────────────────────────
  // REPS
  // ─────────────────────────────────────

  let reps = 0;

  if (ex.reps !== undefined && ex.reps !== null && ex.reps !== "") {
    reps = Number(ex.reps);

    if (!Number.isInteger(reps) || reps < 0) {
      throw new BadRequestError(
        "Exercise reps must be a valid non-negative integer",
      );
    }
  }

  // ─────────────────────────────────────
  // WEIGHT
  // ─────────────────────────────────────

  let weight = 0;

  if (ex.weight !== undefined && ex.weight !== null && ex.weight !== "") {
    weight = Number(ex.weight);

    if (!Number.isFinite(weight) || weight < 0) {
      throw new BadRequestError(
        "Exercise weight must be a valid non-negative number",
      );
    }
  }

  // ─────────────────────────────────────
  // UNIT
  // ─────────────────────────────────────

  let unit = "kg";

  if (ex.unit !== undefined && ex.unit !== null && ex.unit !== "") {
    if (ex.unit !== "kg" && ex.unit !== "lb") {
      throw new BadRequestError("Exercise unit must be either kg or lb");
    }

    unit = ex.unit;
  }

  // ─────────────────────────────────────
  // RPE
  // ─────────────────────────────────────

  let rpe;

  if (ex.rpe !== undefined && ex.rpe !== null && ex.rpe !== "") {
    rpe = Number(ex.rpe);

    if (!Number.isFinite(rpe) || rpe < 1 || rpe > 10) {
      throw new BadRequestError("RPE must be a number between 1 and 10");
    }
  }

  // ─────────────────────────────────────
  // MUSCLE GROUP
  // ─────────────────────────────────────

  if (ex.muscleGroup !== undefined && typeof ex.muscleGroup !== "string") {
    throw new BadRequestError("Muscle group must be a string");
  }

  const muscleGroup =
    typeof ex.muscleGroup === "string" ? ex.muscleGroup.trim() : "";

  if (muscleGroup.length > 100) {
    throw new BadRequestError("Muscle group cannot exceed 100 characters");
  }

  // ─────────────────────────────────────
  // WARMUP
  // ─────────────────────────────────────

  if (ex.isWarmup !== undefined && typeof ex.isWarmup !== "boolean") {
    throw new BadRequestError("isWarmup must be a boolean");
  }

  const isWarmup = ex.isWarmup === true;

  // ─────────────────────────────────────
  // CREATE SETS
  // ─────────────────────────────────────

  const sets = Array.from({ length: setsCount }, () => ({
    reps,
    weight,
    unit,
    ...(rpe !== undefined && { rpe }),
    isWarmup,
  }));

  return {
    name: normalizedName,
    muscleGroup,
    sets,
  };
}

// ─────────────────────────────────────────
// NORMALIZE VISIBILITY
// ─────────────────────────────────────────
//
// Supports:
//
// visibility: "private"
// visibility: "followers"
// visibility: "public"
// visibility: "community" → public
//
// Legacy:
//
// isPublic: true → public
//
// Default:
//
// private
//
// ─────────────────────────────────────────

export function normalizeVisibility(visibility, isPublic) {
  const rawVisibility =
    typeof visibility === "string" ? visibility.trim().toLowerCase() : "";

  let normalizedVisibility;

  if (rawVisibility) {
    // New clients
    normalizedVisibility =
      rawVisibility === "community" ? "public" : rawVisibility;
  } else if (isPublic === true) {
    // Legacy clients
    normalizedVisibility = "public";
  } else {
    // Privacy-first default
    normalizedVisibility = "private";
  }

  if (!ALLOWED_VISIBILITY.includes(normalizedVisibility)) {
    throw new BadRequestError("Invalid visibility");
  }

  return normalizedVisibility;
}

// ─────────────────────────────────────────
// CHECK WORKOUT VISIBILITY
// ─────────────────────────────────────────
//
// Rules:
//
// Owner       → always allowed
// Public      → everyone
// Followers   → viewers who follow the owner
// Private     → owner only
//
// Follow relationships are read from the
// VIEWER's `following` array, the same
// source getWorkoutsService uses, so the
// list and detail views always agree.
//
// ─────────────────────────────────────────

export const canViewWorkout = async (workout, viewerId) => {
  if (!workout || !viewerId) {
    return false;
  }

  const ownerId = workout.user?._id
    ? workout.user._id.toString()
    : workout.user?.toString();

  if (!ownerId) {
    return false;
  }

  const viewerIdString = viewerId.toString();

  // Owner
  if (ownerId === viewerIdString) {
    return true;
  }

  // Public
  if (workout.visibility === "public") {
    return true;
  }

  // Followers only
  if (workout.visibility === "followers") {
    const viewer = await User.findById(viewerIdString)
      .select("following")
      .lean();

    if (!viewer || !Array.isArray(viewer.following)) {
      return false;
    }

    return viewer.following.some(
      (followedId) => followedId.toString() === ownerId,
    );
  }

  // Private (or unknown visibility)
  return false;
};

// ─────────────────────────────────────────
// LOAD A WORKOUT THE VIEWER IS ALLOWED TO SEE
// ─────────────────────────────────────────
//
// Shared by getWorkoutByIdService and
// getWorkoutByPostIdService.
//
// ─────────────────────────────────────────

const findViewableWorkout = async (workoutId, viewerId) => {
  assertValidObjectId(workoutId, "workout ID");

  const workout = await Workout.findById(workoutId)
    .populate("user", "name handle avatar")
    .populate("comments.user", "name handle avatar")
    .populate("respects", "_id");

  if (!workout) {
    throw new NotFoundError("Workout not found");
  }

  const allowed = await canViewWorkout(workout, viewerId);

  if (!allowed) {
    throw new ForbiddenError("You do not have permission to view this workout");
  }

  return workout;
};

// ─────────────────────────────────────────
// GET WORKOUTS SERVICE
// ─────────────────────────────────────────

export const getWorkoutsService = async ({ userId, page, limit }) => {
  // ─────────────────────────────────────
  // GET VIEWER FOLLOWING
  // ─────────────────────────────────────
  //
  // Fetched once to avoid an N+1 query
  // from checking every workout.
  //
  // ─────────────────────────────────────

  const viewer = await User.findById(userId).select("following").lean();

  if (!viewer) {
    throw new UnauthorizedError("User authentication required");
  }

  const followingIds = Array.isArray(viewer.following) ? viewer.following : [];

  // ─────────────────────────────────────
  // BUILD PRIVACY-AWARE FILTER
  // ─────────────────────────────────────
  //
  // Visible workouts:
  //
  // 1. Public workouts
  // 2. The viewer's own workouts
  // 3. Followers-only workouts from users
  //    the viewer follows
  //
  // ─────────────────────────────────────

  const visibilityConditions = [{ visibility: "public" }, { user: userId }];

  if (followingIds.length > 0) {
    visibilityConditions.push({
      visibility: "followers",
      user: { $in: followingIds },
    });
  }

  const filter = { $or: visibilityConditions };

  // ─────────────────────────────────────
  // COUNT VISIBLE WORKOUTS
  // ─────────────────────────────────────

  const total = await Workout.countDocuments(filter);

  const totalPages = Math.ceil(total / limit);

  // ─────────────────────────────────────
  // EMPTY / OUT-OF-RANGE PAGE
  // ─────────────────────────────────────

  if (total === 0 || page > totalPages) {
    return {
      workouts: [],

      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: false,
        hasPreviousPage: page > 1 && totalPages > 0,
      },
    };
  }

  // ─────────────────────────────────────
  // FETCH WORKOUTS
  // ─────────────────────────────────────

  const skip = (page - 1) * limit;

  const workouts = await Workout.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .skip(skip)
    .limit(limit)
    .populate("user", "name handle avatar")
    .populate("comments.user", "name handle avatar")
    .populate("respects", "_id")
    .lean();

  return {
    workouts,

    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
};

// ─────────────────────────────────────────
// GET WORKOUT BY ID SERVICE
// ─────────────────────────────────────────

export const getWorkoutByIdService = async ({ workoutId, userId }) => {
  const workout = await findViewableWorkout(workoutId, userId);

  return { workout };
};

// ─────────────────────────────────────────
// GET WORKOUT BY POST ID SERVICE
// ─────────────────────────────────────────

export const getWorkoutByPostIdService = async ({ postId, userId }) => {
  assertValidObjectId(postId, "post ID");

  const post = await Post.findById(postId);

  if (!post) {
    throw new NotFoundError("Post not found");
  }

  const workoutId = post.workout?.workoutId;

  if (!workoutId) {
    throw new NotFoundError("No workout is associated with this post");
  }

  const workout = await findViewableWorkout(workoutId, userId);

  return { workout };
};

// ─────────────────────────────────────────
// CREATE WORKOUT SERVICE
// ─────────────────────────────────────────
//
// Creates a Workout and its social Post
// inside one MongoDB transaction.
//
// ─────────────────────────────────────────

export const createWorkoutService = async ({ userId, body }) => {
  const {
    title,
    notes,
    duration,
    caloriesBurned,
    exercises: rawExercises,
    imageUrl,
    category,
    visibility,
    isPublic,
  } = body;

  // ─────────────────────────────────────
  // VISIBILITY
  // ─────────────────────────────────────

  const normalizedVisibility = normalizeVisibility(visibility, isPublic);

  // ─────────────────────────────────────
  // TITLE
  // ─────────────────────────────────────

  if (typeof title !== "string" || title.trim().length === 0) {
    throw new BadRequestError("Workout title is required");
  }

  const normalizedTitle = title.trim();

  if (normalizedTitle.length > 100) {
    throw new BadRequestError("Workout title cannot exceed 100 characters");
  }

  // ─────────────────────────────────────
  // OPTIONAL TEXT FIELDS
  // ─────────────────────────────────────

  const normalizedNotes = typeof notes === "string" ? notes.trim() : "";

  const normalizedImageUrl = typeof imageUrl === "string" ? imageUrl.trim() : "";

  const normalizedCategory =
    typeof category === "string" ? category.trim() || "Other" : undefined;

  // ─────────────────────────────────────
  // EXERCISES
  // ─────────────────────────────────────

  if (!Array.isArray(rawExercises)) {
    throw new BadRequestError("Exercises must be an array");
  }

  const exercises = rawExercises.map(expandExercise);

  // ─────────────────────────────────────
  // NUMBERS
  // ─────────────────────────────────────

  const normalizedDuration = parseNonNegativeNumber(duration, "Duration");

  const normalizedCalories = parseNonNegativeNumber(
    caloriesBurned,
    "Calories burned",
  );

  // ─────────────────────────────────────
  // TRANSACTION
  // ─────────────────────────────────────

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const [workout] = await Workout.create(
      [
        {
          user: userId,
          title: normalizedTitle,
          notes: normalizedNotes,
          duration: normalizedDuration,
          exercises,
          imageUrl: normalizedImageUrl,
          visibility: normalizedVisibility,
          caloriesBurned: normalizedCalories,
        },
      ],
      { session },
    );

    const [post] = await Post.create(
      [
        {
          user: userId,

          content:
            normalizedNotes.length > 0
              ? normalizedNotes
              : `Just crushed ${normalizedTitle}! 💪`,

          visibility: normalizedVisibility,

          workout: {
            workoutId: workout._id,
            title: normalizedTitle,
            category: normalizedCategory,
            duration: normalizedDuration,
            caloriesBurned: normalizedCalories,
            exercises,
            imageUrl: normalizedImageUrl,
          },

          media:
            normalizedImageUrl.length > 0
              ? [{ url: normalizedImageUrl, type: "image" }]
              : [],
        },
      ],
      { session },
    );

    await session.commitTransaction();

    return { workout, post };
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    throw error;
  } finally {
    await session.endSession();
  }
};

// ─────────────────────────────────────────
// UPDATE WORKOUT SERVICE
// ─────────────────────────────────────────
//
// Updates the Workout and syncs its linked
// Post inside one MongoDB transaction.
// Only the owner can update.
//
// ─────────────────────────────────────────

export const updateWorkoutService = async ({ workoutId, userId, body }) => {
  assertValidObjectId(workoutId, "workout ID");

  const {
    title,
    notes,
    duration,
    caloriesBurned,
    exercises: rawExercises,
    imageUrl,
    category,
    visibility,
    isPublic,
  } = body;

  // ─────────────────────────────────────
  // FIND WORKOUT + CHECK OWNERSHIP
  // ─────────────────────────────────────

  const workout = await Workout.findById(workoutId);

  if (!workout) {
    throw new NotFoundError("Workout not found");
  }

  if (workout.user.toString() !== userId.toString()) {
    throw new ForbiddenError("You can only update your own workout");
  }

  // ─────────────────────────────────────
  // APPLY WORKOUT UPDATES
  // ─────────────────────────────────────

  if (title !== undefined) {
    if (typeof title !== "string") {
      throw new BadRequestError("Workout title is required");
    }

    const normalizedTitle = title.trim();

    if (normalizedTitle.length === 0) {
      throw new BadRequestError("Workout title is required");
    }

    if (normalizedTitle.length > 100) {
      throw new BadRequestError("Workout title cannot exceed 100 characters");
    }

    workout.title = normalizedTitle;
  }

  if (notes !== undefined) {
    if (typeof notes !== "string") {
      throw new BadRequestError("Workout notes must be a string");
    }

    workout.notes = notes.trim();
  }

  if (duration !== undefined) {
    workout.duration = parseNonNegativeNumber(duration, "Duration");
  }

  if (caloriesBurned !== undefined) {
    workout.caloriesBurned = parseNonNegativeNumber(
      caloriesBurned,
      "Calories burned",
    );
  }

  if (imageUrl !== undefined) {
    if (typeof imageUrl !== "string") {
      throw new BadRequestError("Image URL must be a string");
    }

    workout.imageUrl = imageUrl.trim();
  }

  if (visibility !== undefined || isPublic !== undefined) {
    workout.visibility = normalizeVisibility(visibility, isPublic);
  }

  if (rawExercises !== undefined) {
    if (!Array.isArray(rawExercises)) {
      throw new BadRequestError("Exercises must be an array");
    }

    workout.exercises = rawExercises.map(expandExercise);
  }

  // Category lives on the Post's workout snapshot, not on Workout.
  const normalizedCategory =
    typeof category === "string" ? category.trim() || "Other" : undefined;

  // ─────────────────────────────────────
  // TRANSACTION
  // ─────────────────────────────────────

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    await workout.save({ session });

    const post = await Post.findOne({
      user: userId,
      "workout.workoutId": workout._id,
    }).session(session);

    if (!post) {
      throw new NotFoundError("Linked workout post not found");
    }

    // ───────────────────────────────────
    // SYNC POST
    // ───────────────────────────────────

    if (notes !== undefined || title !== undefined) {
      post.content =
        workout.notes.length > 0
          ? workout.notes
          : `Just crushed ${workout.title}! 💪`;
    }

    if (title !== undefined) {
      post.workout.title = workout.title;
    }

    if (normalizedCategory !== undefined) {
      post.workout.category = normalizedCategory;
    }

    if (duration !== undefined) {
      post.workout.duration = workout.duration;
    }

    if (caloriesBurned !== undefined) {
      post.workout.caloriesBurned = workout.caloriesBurned;
    }

    if (rawExercises !== undefined) {
      post.workout.exercises = workout.exercises;
    }

    if (imageUrl !== undefined) {
      post.workout.imageUrl = workout.imageUrl;

      post.media =
        workout.imageUrl.length > 0
          ? [{ url: workout.imageUrl, type: "image" }]
          : [];
    }

    if (visibility !== undefined || isPublic !== undefined) {
      post.visibility = workout.visibility;
    }

    await post.save({ session });

    await session.commitTransaction();

    return { workout, post };
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    throw error;
  } finally {
    await session.endSession();
  }
};