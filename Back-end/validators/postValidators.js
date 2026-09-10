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
  body: z.object({
    content: z
      .string()
      .trim()
      .min(1, "Post content is required")
      .max(500, "Post cannot exceed 500 characters"),

    visibility: z
      .enum(
        ["private", "followers", "public"],
        {
          message:
            "Visibility must be either 'private', 'followers', or 'public'",
        }
      )
      .default("public"),

    workout: workoutSchema.optional(),

    media: z
      .array(mediaSchema)
      .default([]),
  }),

  params: z.object({}),

  query: z.object({}),
});