import mongoose from "mongoose";

import Workout from "../models/Workout.js";
import Post from "../models/Post.js";
import User from "../models/User.js";

import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";

import {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} from "../errors/ApiError.js";

// ─────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────

const ALLOWED_VISIBILITY = [
  "private",
  "followers",
  "public",
];

// ─────────────────────────────────────────
// EXPAND EXERCISE
// ─────────────────────────────────────────
//
// Converts:
//
// {
//   name: "Bench Press",
//   muscleGroup: "Chest",
//   sets: 3,
//   reps: 10,
//   weight: 50,
//   unit: "kg",
//   rpe: 8,
//   isWarmup: false
// }
//
// into:
//
// {
//   name: "Bench Press",
//   muscleGroup: "Chest",
//   sets: [
//     {
//       reps: 10,
//       weight: 50,
//       unit: "kg",
//       rpe: 8,
//       isWarmup: false
//     },
//     ...
//   ]
// }
//
// ─────────────────────────────────────────

function expandExercise(ex) {
  if (!ex || typeof ex !== "object") {
    throw new BadRequestError(
      "Each exercise must be a valid object"
    );
  }

  // ─────────────────────────────────────
  // EXERCISE NAME
  // ─────────────────────────────────────

  if (
    typeof ex.name !== "string" ||
    ex.name.trim().length === 0
  ) {
    throw new BadRequestError(
      "Exercise name is required"
    );
  }

  const normalizedName = ex.name.trim();

  if (normalizedName.length > 100) {
    throw new BadRequestError(
      "Exercise name cannot exceed 100 characters"
    );
  }

  // ─────────────────────────────────────
  // SETS
  // ─────────────────────────────────────

  let setsCount = 1;

  if (
    ex.sets !== undefined &&
    ex.sets !== null &&
    ex.sets !== ""
  ) {
    setsCount = Number(ex.sets);

    if (
      !Number.isFinite(setsCount) ||
      !Number.isInteger(setsCount) ||
      setsCount < 1
    ) {
      throw new BadRequestError(
        "Exercise sets must be a positive integer"
      );
    }
  }

  // Prevent unreasonable payloads.
  if (setsCount > 100) {
    throw new BadRequestError(
      "An exercise cannot contain more than 100 sets"
    );
  }

  // ─────────────────────────────────────
  // REPS
  // ─────────────────────────────────────

  let reps = 0;

  if (
    ex.reps !== undefined &&
    ex.reps !== null &&
    ex.reps !== ""
  ) {
    reps = Number(ex.reps);

    if (
      !Number.isFinite(reps) ||
      !Number.isInteger(reps) ||
      reps < 0
    ) {
      throw new BadRequestError(
        "Exercise reps must be a valid non-negative integer"
      );
    }
  }

  // ─────────────────────────────────────
  // WEIGHT
  // ─────────────────────────────────────

  let weight = 0;

  if (
    ex.weight !== undefined &&
    ex.weight !== null &&
    ex.weight !== ""
  ) {
    weight = Number(ex.weight);

    if (
      !Number.isFinite(weight) ||
      weight < 0
    ) {
      throw new BadRequestError(
        "Exercise weight must be a valid non-negative number"
      );
    }
  }

  // ─────────────────────────────────────
  // UNIT
  // ─────────────────────────────────────

  let unit = "kg";

  if (
    ex.unit !== undefined &&
    ex.unit !== null &&
    ex.unit !== ""
  ) {
    if (
      ex.unit !== "kg" &&
      ex.unit !== "lb"
    ) {
      throw new BadRequestError(
        "Exercise unit must be either kg or lb"
      );
    }

    unit = ex.unit;
  }

  // ─────────────────────────────────────
  // RPE
  // ─────────────────────────────────────

  let rpe;

  if (
    ex.rpe !== undefined &&
    ex.rpe !== null &&
    ex.rpe !== ""
  ) {
    rpe = Number(ex.rpe);

    if (
      !Number.isFinite(rpe) ||
      rpe < 1 ||
      rpe > 10
    ) {
      throw new BadRequestError(
        "RPE must be a number between 1 and 10"
      );
    }
  }

  // ─────────────────────────────────────
  // MUSCLE GROUP
  // ─────────────────────────────────────

 // ─────────────────────────────────────
// MUSCLE GROUP
// ─────────────────────────────────────

if (
  ex.muscleGroup !== undefined &&
  typeof ex.muscleGroup !== "string"
) {
  throw new BadRequestError(
    "Muscle group must be a string"
  );
}

const muscleGroup =
  typeof ex.muscleGroup === "string"
    ? ex.muscleGroup.trim()
    : "";

if (muscleGroup.length > 100) {
  throw new BadRequestError(
    "Muscle group cannot exceed 100 characters"
  );
}

  // ─────────────────────────────────────
  // WARMUP
  // ─────────────────────────────────────


if (
  ex.isWarmup !== undefined &&
  typeof ex.isWarmup !== "boolean"
) {
  throw new BadRequestError(
    "isWarmup must be a boolean"
  );
}

const isWarmup =
  ex.isWarmup === true;

  // ─────────────────────────────────────
  // CREATE SETS
  // ─────────────────────────────────────

  const sets = Array.from(
    { length: setsCount },
    () => ({
      reps,
      weight,
      unit,
      ...(rpe !== undefined && { rpe }),
      isWarmup,
    })
  );

  // ─────────────────────────────────────
  // RETURN NORMALIZED EXERCISE
  // ─────────────────────────────────────

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

function normalizeVisibility(visibility, isPublic) {
  const rawVisibility =
    typeof visibility === "string"
      ? visibility.trim().toLowerCase()
      : "";

  const isLegacyPublic = isPublic === true;

  let normalizedVisibility;

  // New clients
  if (rawVisibility) {
    normalizedVisibility =
      rawVisibility === "community"
        ? "public"
        : rawVisibility;
  }

  // Legacy clients
  else if (isLegacyPublic) {
    normalizedVisibility = "public";
  }

  // Privacy-first default
  else {
    normalizedVisibility = "private";
  }

  if (
    !ALLOWED_VISIBILITY.includes(
      normalizedVisibility
    )
  ) {
    throw new BadRequestError(
      "Invalid visibility"
    );
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
// Followers   → followers of owner
// Private     → owner only
//
// ─────────────────────────────────────────

const canViewWorkout = async (
  workout,
  viewerId
) => {
  if (!workout || !viewerId) {
    return false;
  }

  const ownerId =
    workout.user?._id
      ? workout.user._id.toString()
      : workout.user?.toString();

  const viewerIdString =
    viewerId.toString();

  if (!ownerId) {
    return false;
  }

  // Owner
  if (
    ownerId === viewerIdString
  ) {
    return true;
  }

  // Public
  if (
    workout.visibility === "public"
  ) {
    return true;
  }

  // Private
  if (
    workout.visibility === "private"
  ) {
    return false;
  }

  // Followers only
  if (
    workout.visibility === "followers"
  ) {
    const owner =
      await User.findById(ownerId)
        .select("followers")
        .lean();

    if (!owner) {
      return false;
    }

    const followers =
      Array.isArray(owner.followers)
        ? owner.followers
        : [];

    return followers.some(
      (followerId) =>
        followerId.toString() ===
        viewerIdString
    );
  }

  return false;
};

// ─────────────────────────────────────────
// GET WORKOUTS
// GET /api/workouts
// ─────────────────────────────────────────

export const getWorkouts = asyncHandler(
  async (req, res) => {
    // ─────────────────────────────────────
    // AUTHENTICATION
    // ─────────────────────────────────────

    const viewerId =
      req.user?._id;

    if (!viewerId) {
      throw new UnauthorizedError(
        "User authentication required"
      );
    }

    // ─────────────────────────────────────
    // PAGINATION
    // ─────────────────────────────────────

    const page = Math.max(
      Number.parseInt(
        req.query.page,
        10
      ) || 1,
      1
    );

    const limit = Math.min(
      Math.max(
        Number.parseInt(
          req.query.limit,
          10
        ) || 20,
        1
      ),
      50
    );

    // ─────────────────────────────────────
    // GET VIEWER FOLLOWING
    // ─────────────────────────────────────
    //
    // Fetch once.
    //
    // This prevents the N+1 query problem
    // from checking every workout individually.
    //
    // ─────────────────────────────────────

    const viewer =
      await User.findById(viewerId)
        .select("following")
        .lean();

    if (!viewer) {
      throw new UnauthorizedError(
        "User authentication required"
      );
    }

    const followingIds =
      Array.isArray(viewer.following)
        ? viewer.following
        : [];

    // ─────────────────────────────────────
    // BUILD PRIVACY-AWARE FILTER
    // ─────────────────────────────────────
    //
    // Visible workouts:
    //
    // 1. Public workouts
    // 2. Current user's workouts
    // 3. Followers-only workouts from
    //    users the viewer follows
    //
    // Private workouts belonging to other
    // users are excluded automatically.
    //
    // ─────────────────────────────────────

    const visibilityConditions = [
      {
        visibility: "public",
      },
      {
        user: viewerId,
      },
    ];

    if (
      followingIds.length > 0
    ) {
      visibilityConditions.push({
        visibility: "followers",
        user: {
          $in: followingIds,
        },
      });
    }

    const filter = {
      $or: visibilityConditions,
    };

    // ─────────────────────────────────────
    // COUNT VISIBLE WORKOUTS
    // ─────────────────────────────────────

    const total =
      await Workout.countDocuments(
        filter
      );

    const totalPages =
      Math.ceil(total / limit);

    // ─────────────────────────────────────
    // EMPTY / OUT-OF-RANGE PAGE
    // ─────────────────────────────────────

    if (
      total === 0 ||
      page > totalPages
    ) {
      return sendSuccess(res, {
        data: {
          workouts: [],

          pagination: {
            page,
            limit,
            total,
            totalPages,

            hasNextPage: false,

            hasPreviousPage:
              page > 1 &&
              totalPages > 0,
          },
        },
      });
    }

    // ─────────────────────────────────────
    // PAGINATION
    // ─────────────────────────────────────

    const skip =
      (page - 1) * limit;

    // ─────────────────────────────────────
    // FETCH WORKOUTS
    // ─────────────────────────────────────

    const workouts =
      await Workout.find(filter)
        .sort({
          createdAt: -1,
          _id: -1,
        })
        .skip(skip)
        .limit(limit)
        .populate(
          "user",
          "name handle avatar"
        )
        .populate(
          "comments.user",
          "name handle avatar"
        )
        .populate(
          "respects",
          "_id"
        )
        .lean();

    // ─────────────────────────────────────
    // RESPONSE
    // ─────────────────────────────────────

    return sendSuccess(res, {
      data: {
        workouts,

        pagination: {
          page,
          limit,
          total,
          totalPages,

          hasNextPage:
            page < totalPages,

          hasPreviousPage:
            page > 1,
        },
      },
    });
  }
);

// ─────────────────────────────────────────
// GET WORKOUT BY ID
// GET /api/workouts/:id
// ─────────────────────────────────────────

export const getWorkoutById =
  asyncHandler(
    async (req, res) => {
      const viewerId =
        req.user?._id;

      if (!viewerId) {
        throw new UnauthorizedError(
          "User authentication required"
        );
      }

      const { id } =
        req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        throw new BadRequestError(
          "Invalid workout ID"
        );
      }

      const workout =
        await Workout.findById(id)
          .populate(
            "user",
            "name handle avatar"
          )
          .populate(
            "comments.user",
            "name handle avatar"
          )
          .populate(
            "respects",
            "_id"
          );

      if (!workout) {
        throw new NotFoundError(
          "Workout not found"
        );
      }

      const allowed =
        await canViewWorkout(
          workout,
          viewerId
        );

      if (!allowed) {
        throw new ForbiddenError(
          "You do not have permission to view this workout"
        );
      }

      return sendSuccess(res, {
        data: {
          workout,
        },
      });
    }
  );

// ─────────────────────────────────────────
// GET WORKOUT BY POST ID
// GET /api/workouts/by-post/:postId
// ─────────────────────────────────────────

export const getWorkoutByPostId =
  asyncHandler(
    async (req, res) => {
      const viewerId =
        req.user?._id;

      if (!viewerId) {
        throw new UnauthorizedError(
          "User authentication required"
        );
      }

      const { postId } =
        req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          postId
        )
      ) {
        throw new BadRequestError(
          "Invalid post ID"
        );
      }

      const post =
        await Post.findById(postId);

      if (!post) {
        throw new NotFoundError(
          "Post not found"
        );
      }

      const workoutId =
        post.workout?.workoutId;

      if (!workoutId) {
        throw new NotFoundError(
          "No workout is associated with this post"
        );
      }

      if (
        !mongoose.Types.ObjectId.isValid(
          workoutId
        )
      ) {
        throw new BadRequestError(
          "Invalid workout ID"
        );
      }

      const workout =
        await Workout.findById(
          workoutId
        )
          .populate(
            "user",
            "name handle avatar"
          )
          .populate(
            "comments.user",
            "name handle avatar"
          )
          .populate(
            "respects",
            "_id"
          );

      if (!workout) {
        throw new NotFoundError(
          "Workout not found"
        );
      }

      const allowed =
        await canViewWorkout(
          workout,
          viewerId
        );

      if (!allowed) {
        throw new ForbiddenError(
          "You do not have permission to view this workout"
        );
      }

      return sendSuccess(res, {
        data: {
          workout,
        },
      });
    }
  );

// ─────────────────────────────────────────
// CREATE WORKOUT
// POST /api/workouts
// ─────────────────────────────────────────
//
// Creates:
//
// 1. Workout
// 2. Social Post
//
// Both are created inside one MongoDB
// transaction.
//
// ─────────────────────────────────────────

export const createWorkout =
  asyncHandler(
    async (req, res) => {
      // ───────────────────────────────────
      // AUTHENTICATION
      // ───────────────────────────────────

      const userId =
        req.user?._id;

      if (!userId) {
        throw new UnauthorizedError(
          "User authentication required"
        );
      }

      // ───────────────────────────────────
      // REQUEST DATA
      // ───────────────────────────────────

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
} = req.validated.body;


      // ───────────────────────────────────
      // VISIBILITY
      // ───────────────────────────────────

  const normalizedVisibility = normalizeVisibility(
  visibility,
  isPublic
);

      // ───────────────────────────────────
      // VALIDATE TITLE
      // ───────────────────────────────────

      if (
        typeof title !== "string" ||
        title.trim().length === 0
      ) {
        throw new BadRequestError(
          "Workout title is required"
        );
      }

      const normalizedTitle =
        title.trim();

      if (
        normalizedTitle.length > 100
      ) {
        throw new BadRequestError(
          "Workout title cannot exceed 100 characters"
        );
      }

      // ───────────────────────────────────
      // NORMALIZE NOTES
      // ───────────────────────────────────

      const normalizedNotes =
        typeof notes === "string"
          ? notes.trim()
          : "";

      // ───────────────────────────────────
      // NORMALIZE IMAGE URL
      // ───────────────────────────────────

      const normalizedImageUrl =
        typeof imageUrl === "string"
          ? imageUrl.trim()
          : "";

      // ───────────────────────────────────
      // NORMALIZE CATEGORY
      // ───────────────────────────────────

      const normalizedCategory =
  category !== undefined
    ? category.trim() || "Other"
    : undefined;


      // ───────────────────────────────────
      // VALIDATE EXERCISES
      // ───────────────────────────────────

      if (
        !Array.isArray(rawExercises)
      ) {
        throw new BadRequestError(
          "Exercises must be an array"
        );
      }

      const exercises =
        rawExercises.map(
          expandExercise
        );

      // ───────────────────────────────────
      // NORMALIZE DURATION
      // ───────────────────────────────────

      let normalizedDuration = 0;

      if (
        duration !== undefined &&
        duration !== null &&
        duration !== ""
      ) {
        normalizedDuration =
          Number(duration);

        if (
          !Number.isFinite(
            normalizedDuration
          ) ||
          normalizedDuration < 0
        ) {
          throw new BadRequestError(
            "Duration must be a valid non-negative number"
          );
        }
      }

      // ───────────────────────────────────
      // NORMALIZE CALORIES
      // ───────────────────────────────────

      let normalizedCalories = 0;

      if (
        caloriesBurned !== undefined &&
        caloriesBurned !== null &&
        caloriesBurned !== ""
      ) {
        normalizedCalories =
          Number(caloriesBurned);

        if (
          !Number.isFinite(
            normalizedCalories
          ) ||
          normalizedCalories < 0
        ) {
          throw new BadRequestError(
            "Calories burned must be a valid non-negative number"
          );
        }
      }

      // ───────────────────────────────────
      // START MONGODB TRANSACTION
      // ───────────────────────────────────

      const session =
        await mongoose.startSession();

      try {
        session.startTransaction();

        // ─────────────────────────────────
        // CREATE WORKOUT
        // ─────────────────────────────────
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
  {
    session,
  }
);

        // ─────────────────────────────────
        // CREATE SOCIAL POST
        // ─────────────────────────────────

        const [post] =
          await Post.create(
            [
              {
                user: userId,

                content:
                  normalizedNotes.length > 0
                    ? normalizedNotes
                    : `Just crushed ${normalizedTitle}! 💪`,
                    visibility: normalizedVisibility,


                workout: {
                  workoutId:
                    workout._id,

                  title:
                    normalizedTitle,

                  category:
                    normalizedCategory,

                  duration:
                    normalizedDuration,

                  caloriesBurned:
                    normalizedCalories,

                  exercises,

                  imageUrl:
                    normalizedImageUrl,
                },

                media:
                  normalizedImageUrl.length > 0
                    ? [
                        {
                          url:
                            normalizedImageUrl,
                          type: "image",
                        },
                      ]
                    : [],
              },
            ],
            {
              session,
            }
          );

        // ─────────────────────────────────
        // COMMIT TRANSACTION
        // ─────────────────────────────────

        await session.commitTransaction();

        // ─────────────────────────────────
        // RESPONSE
        // ─────────────────────────────────

        return sendSuccess(res, {
          statusCode: 201,

          data: {
            workout,
            post,
          },
        });
      } catch (error) {
        // ─────────────────────────────────
        // ROLLBACK
        // ─────────────────────────────────

        if (
          session.inTransaction()
        ) {
          await session.abortTransaction();
        }

        throw error;
      } finally {
        await session.endSession();
      }
    }
  );

  // ─────────────────────────────────────────
// UPDATE WORKOUT
// PATCH /api/workouts/:id
// ─────────────────────────────────────────
//
// Updates:
// 1. Workout
// 2. Linked social Post
//
// Only the workout owner can update it.
//
// ─────────────────────────────────────────

export const updateWorkout =
  asyncHandler(
    async (req, res) => {
      // ───────────────────────────────────
      // AUTHENTICATION
      // ───────────────────────────────────

      const userId =
        req.user?._id;

      if (!userId) {
        throw new UnauthorizedError(
          "User authentication required"
        );
      }

      // ───────────────────────────────────
      // VALIDATE WORKOUT ID
      // ───────────────────────────────────

      const { id } =
        req.validated.params;

      if (
        !mongoose.Types.ObjectId.isValid(id)
      ) {
        throw new BadRequestError(
          "Invalid workout ID"
        );
      }

      // ───────────────────────────────────
      // GET REQUEST DATA
      // ───────────────────────────────────

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
      } = req.validated.body;

      // ───────────────────────────────────
      // FIND WORKOUT
      // ───────────────────────────────────

      const workout =
        await Workout.findById(id);

      if (!workout) {
        throw new NotFoundError(
          "Workout not found"
        );
      }

      // ───────────────────────────────────
      // OWNERSHIP
      // ───────────────────────────────────

      if (
        workout.user.toString() !==
        userId.toString()
      ) {
        throw new ForbiddenError(
          "You can only update your own workout"
        );
      }

      // ───────────────────────────────────
      // NORMALIZE UPDATED FIELDS
      // ───────────────────────────────────

      if (title !== undefined) {
        const normalizedTitle =
          title.trim();

        if (
          normalizedTitle.length === 0
        ) {
          throw new BadRequestError(
            "Workout title is required"
          );
        }

        workout.title =
          normalizedTitle;
      }

      if (notes !== undefined) {
        workout.notes =
          notes.trim();
      }

      if (duration !== undefined) {
        workout.duration =
          Number(duration);
      }

      if (caloriesBurned !== undefined) {
        workout.caloriesBurned =
          Number(caloriesBurned);
      }

      if (imageUrl !== undefined) {
        workout.imageUrl =
          imageUrl.trim();
      }

      // ───────────────────────────────────
      // VISIBILITY
      // ───────────────────────────────────

      if (
        visibility !== undefined ||
        isPublic !== undefined
      ) {
        workout.visibility =
          normalizeVisibility(
            visibility,
            isPublic
          );
      }

      // ───────────────────────────────────
      // EXERCISES
      // ───────────────────────────────────

      if (
        rawExercises !== undefined
      ) {
        if (
          !Array.isArray(rawExercises)
        ) {
          throw new BadRequestError(
            "Exercises must be an array"
          );
        }

        workout.exercises =
          rawExercises.map(
            expandExercise
          );
      }

      // ───────────────────────────────────
      // CATEGORY
      // ───────────────────────────────────
      //
      // Category exists inside the Post's
      // workout snapshot, not Workout itself.
      //
      // We keep it separately for syncing
      // the linked Post below.
      //
      // ───────────────────────────────────

      const normalizedCategory =
        category !== undefined
          ? category.trim()
          : undefined;

      // ───────────────────────────────────
      // START TRANSACTION
      // ───────────────────────────────────

      const session =
        await mongoose.startSession();

      try {
        session.startTransaction();

        // ─────────────────────────────────
        // SAVE WORKOUT
        // ─────────────────────────────────

        await workout.save({
          session,
        });

        // ─────────────────────────────────
        // FIND LINKED POST
        // ─────────────────────────────────

        const post =
          await Post.findOne({
            user: userId,
            "workout.workoutId":
              workout._id,
          }).session(session);

        if (!post) {
          throw new NotFoundError(
            "Linked workout post not found"
          );
        }

        // ─────────────────────────────────
        // UPDATE POST
        // ─────────────────────────────────

        if (
          notes !== undefined
        ) {
          post.content =
            workout.notes.length > 0
              ? workout.notes
              : `Just crushed ${workout.title}! 💪`;
        }

        if (
          title !== undefined
        ) {
          if (
            notes === undefined
          ) {
            post.content =
              workout.notes.length > 0
                ? workout.notes
                : `Just crushed ${workout.title}! 💪`;
          }

          post.workout.title =
            workout.title;
        }

        if (
          normalizedCategory !== undefined
        ) {
          post.workout.category =
            normalizedCategory;
        }

        if (
          duration !== undefined
        ) {
          post.workout.duration =
            workout.duration;
        }

        if (
          caloriesBurned !== undefined
        ) {
          post.workout.caloriesBurned =
            workout.caloriesBurned;
        }

        if (
          rawExercises !== undefined
        ) {
          post.workout.exercises =
            workout.exercises;
        }

        if (
          imageUrl !== undefined
        ) {
          post.workout.imageUrl =
            workout.imageUrl;

          post.media =
            workout.imageUrl.length > 0
              ? [
                  {
                    url:
                      workout.imageUrl,
                    type: "image",
                  },
                ]
              : [];
        }

        if (
          visibility !== undefined ||
          isPublic !== undefined
        ) {
          post.visibility =
            workout.visibility;
        }

        // ─────────────────────────────────
        // SAVE POST
        // ─────────────────────────────────

        await post.save({
          session,
        });

        // ─────────────────────────────────
        // COMMIT
        // ─────────────────────────────────

        await session.commitTransaction();

        // ─────────────────────────────────
        // RESPONSE
        // ─────────────────────────────────

        return sendSuccess(res, {
          data: {
            workout,
            post,
          },
        });
      } catch (error) {
        if (
          session.inTransaction()
        ) {
          await session.abortTransaction();
        }

        throw error;
      } finally {
        await session.endSession();
      }
    }
  );