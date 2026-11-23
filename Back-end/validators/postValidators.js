import { z } from "zod";

/**
 * MongoDB ObjectId validator
 */
const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID");

/**
 * Workout set validation
 *
 * Matches Post model:
 * sets: [
 *   {
 *     reps,
 *     weight,
 *     unit,
 *     rpe,
 *     isWarmup
 *   }
 * ]
 */
const workoutSetSchema = z.object({
  reps: z.coerce
    .number({
      message: "Reps must be a number",
    })
    .int("Reps must be a whole number")
    .min(0, "Reps cannot be negative"),

  weight: z.coerce
    .number({
      message: "Weight must be a number",
    })
    .min(0, "Weight cannot be negative")
    .default(0),

  unit: z
    .enum(["kg", "lb"], {
      message: "Unit must be either 'kg' or 'lb'",
    })
    .default("kg"),

  rpe: z.coerce
    .number({
      message: "RPE must be a number",
    })
    .min(1, "RPE must be at least 1")
    .max(10, "RPE cannot exceed 10")
    .optional(),

  isWarmup: z
    .boolean()
    .default(false),
});

/**
 * Workout exercise validation
 *
 * Matches:
 * workout.exercises: [
 *   {
 *     name,
 *     muscleGroup,
 *     sets: []
 *   }
 * ]
 */
const workoutExerciseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Exercise name is required")
    .max(100, "Exercise name cannot exceed 100 characters"),

  muscleGroup: z
    .string()
    .trim()
    .max(50, "Muscle group cannot exceed 50 characters")
    .default(""),

  sets: z
    .array(workoutSetSchema)
    .min(1, "Exercise must contain at least one set"),
});

/**
 * Workout validation
 */
const workoutSchema = z.object({
  // MongoDB ObjectId
  workoutId: objectIdSchema.optional(),

  title: z
    .string()
    .trim()
    .min(1, "Workout title is required")
    .max(100, "Workout title cannot exceed 100 characters"),

  category: z
    .enum(
      [
        "Strength",
        "Cardio",
        "HIIT",
        "Pilates",
        "Yoga",
        "Other",
      ],
      {
        message: "Invalid workout category",
      }
    )
    .optional(),

  duration: z.coerce
    .number({
      message: "Duration must be a number",
    })
    .min(0, "Duration cannot be negative")
    .optional(),

  caloriesBurned: z.coerce
    .number({
      message: "Calories burned must be a number",
    })
    .min(0, "Calories burned cannot be negative")
    .optional(),

  exercises: z
    .array(workoutExerciseSchema)
    .default([]),

  imageUrl: z
    .string()
    .trim()
    .url("Image URL must be a valid URL")
    .optional()
    .or(z.literal("")),
});

/**
 * Media validation
 */
const mediaSchema = z.object({
  url: z
    .string()
    .trim()
    .url("Media URL must be a valid URL"),

  type: z.enum(
    ["image", "video"],
    {
      message: "Media type must be either 'image' or 'video'",
    }
  ),
});

/**
 * CREATE POST
 *
 * POST /api/posts
 */
export const PostWorkoutSchema = z.object({
  body: z
    .object({
      content: z
        .string()
        .trim()
        .max(
          500,
          "Post cannot exceed 500 characters"
        )
        .optional(),

      visibility: z
        .enum(["private", "followers", "public"], {
          message:
            "Visibility must be either 'private', 'followers', or 'public'",
        })
        .default("public"),

      workout: workoutSchema.optional(),

      media: z
        .array(mediaSchema)
        .default([]),
    })
    .refine(
      ({ content, workout, media }) =>
        Boolean(content) ||
        Boolean(workout) ||
        media.length > 0,
      {
        message:
          "Post must contain content, workout, or media",
      }
    ),

  params: z.object({}),
  query: z.object({}),
});

// ─────────────────────────────────────────
// PARAMETER SCHEMAS
// ─────────────────────────────────────────

export const postIdParamSchema = z.object({
  body: z.object({}),
  params: z.object({
    postId: objectIdSchema,
  }),
  query: z.object({}),
});

export const commentParamsSchema = z.object({
  body: z.object({}),
  params: z.object({
    postId: objectIdSchema,
    commentId: objectIdSchema,
  }),
  query: z.object({}),
});


// ─────────────────────────────────────────
// COMMENT SCHEMAS
// ─────────────────────────────────────────
export const createCommentSchema = z.object({
  body: z.object({
    content: z
      .string()
      .trim()
      .min(1, "Comment content is required")
      .max(500, "Comment cannot exceed 500 characters"),

    parentComment: objectIdSchema
      .nullable()
      .optional(),
  }),

  params: z.object({
    postId: objectIdSchema,
  }),

  query: z.object({}),
});



export const updateCommentSchema = z.object({
  body: z.object({
    content: z
      .string()
      .trim()
      .min(1, "Comment content is required")
      .max(500, "Comment cannot exceed 500 characters"),
  }),

  params: z.object({
    postId: objectIdSchema,
    commentId: objectIdSchema,
  }),

  query: z.object({}),
});


export const reactToCommentSchema = z.object({
  body: z.object({
    emoji: z.enum(["👍", "❤️", "😂", "😮"], {
      message: "Invalid reaction emoji",
    }),
  }),

  params: z.object({
    postId: objectIdSchema,
    commentId: objectIdSchema,
  }),

  query: z.object({}),
});


// ─────────────────────────────────────────
// POST UPDATE
// ─────────────────────────────────────────

export const updatePostSchema = z.object({
  body: z
    .object({
      content: z
        .string()
        .trim()
        .max(500, "Post cannot exceed 500 characters")
        .optional(),

      visibility: z
        .enum(["private", "followers", "public"])
        .optional(),

      media: z.array(mediaSchema).optional(),
    })
    .refine(
      (data) => Object.keys(data).length > 0,
      {
        message: "At least one field must be provided to update the post",
      }
    ),

  params: z.object({
    postId: objectIdSchema,
  }),

  query: z.object({}),
});


// ─────────────────────────────────────────
// REPORT
// ─────────────────────────────────────────

export const reportPostSchema = z.object({
  params: z.object({
    postId: objectIdSchema,
  }),
  body: z.object({
    reason: z.enum([
      "spam",
      "harassment",
      "inappropriate",
      "falseInfo",
      "other",
    ]),
  }),
});

// ─────────────────────────────────────────
// FEED QUERY
// ─────────────────────────────────────────

export const feedQuerySchema = z.object({
  body: z
  .object({})
  .optional()
  .default({}),

  params: z.object({}),

  query: z.object({
    page: z.coerce
      .number()
      .int("Page must be a whole number")
      .min(1, "Page must be at least 1")
      .default(1),

    limit: z.coerce
      .number()
      .int("Limit must be a whole number")
      .min(1, "Limit must be at least 1")
      .max(50, "Limit cannot exceed 50")
      .default(10),

    type: z
      .enum(["community", "following"], {
        message: "Feed type must be either 'community' or 'following'",
      })
      .default("community"),
  }),
});


// ─────────────────────────────────────────
// SAVED POSTS QUERY
// ─────────────────────────────────────────

export const savedPostsQuerySchema = z.object({
  body: z.object({}),

  params: z.object({}),

  query: z.object({
    page: z.coerce
      .number()
      .int("Page must be a whole number")
      .min(1, "Page must be at least 1")
      .default(1),

    limit: z.coerce
      .number()
      .int("Limit must be a whole number")
      .min(1, "Limit must be at least 1")
      .max(50, "Limit cannot exceed 50")
      .default(20),
  }),
});

// ─────────────────────────────────────────
// USER POSTS QUERY
// ─────────────────────────────────────────

export const userPostsSchema = z.object({
  body: z.object({}),

  params: z.object({
    userId: objectIdSchema,
  }),

  query: z.object({
    page: z.coerce
      .number()
      .int("Page must be a whole number")
      .min(1, "Page must be at least 1")
      .default(1),

    limit: z.coerce
      .number()
      .int("Limit must be a whole number")
      .min(1, "Limit must be at least 1")
      .max(50, "Limit cannot exceed 50")
      .default(10),
  }),
});
