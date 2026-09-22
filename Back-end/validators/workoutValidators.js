import { z } from "zod";

export const createWorkoutSchema = z.object({
  body: z.object({
    title: z
      .string()
      .trim()
      .min(1, "Title is required")
      .max(100, "Title cannot exceed 100 characters"),

    notes: z
      .string()
      .trim()
      .max(500, "Notes cannot exceed 500 characters")
      .optional(),

    duration: z
  .coerce
  .number({
    message: "Duration must be a number",
  })
      .finite("Duration must be a finite number")
      .min(0, "Duration cannot be negative")
      .optional(),

  caloriesBurned: z
  .coerce
  .number({
    message: "Calories burned must be a number",
  })
      .finite("Calories burned must be a finite number")
      .min(0, "Calories burned cannot be negative")
      .optional(),

    category: z
      .string()
      .trim()
      .max(50, "Category cannot exceed 50 characters")
      .optional(),

    imageUrl: z
      .string()
      .trim()
      .url("Image URL must be a valid URL")
      .optional()
      .or(z.literal("")),

    visibility: z
      .enum(["private", "followers", "public", "community"])
      .optional(),

    // Legacy compatibility
    isPublic: z
      .boolean({
        message: "isPublic must be a boolean",
      })
      .optional(),

    exercises: z
      .array(
        z.object({
          name: z
            .string()
            .trim()
            .min(1, "Exercise name is required")
            .max(
              100,
              "Exercise name cannot exceed 100 characters"
            ),

          sets: z
  .coerce
  .number({
    message: "Sets must be a number",
  })
            .int("Sets must be a whole number")
            .min(1, "Sets must be at least 1"),

          reps: z
  .coerce
  .number({
    message: "Reps must be a number",
  })
            .int("Reps must be a whole number")
            .min(0, "Reps cannot be negative"),

         weight: z
  .coerce
  .number({
    message: "Weight must be a number",
  })
            .finite("Weight must be a finite number")
            .min(0, "Weight cannot be negative")
            .optional(),

          unit: z
            .enum(["kg", "lb"], {
              message: "Unit must be either kg or lb",
            })
            .optional(),

          rpe: z
            .number({
              message: "RPE must be a number",
            })
            .finite("RPE must be a finite number")
            .min(1, "RPE must be at least 1")
            .max(10, "RPE cannot exceed 10")
            .optional(),

          muscleGroup: z
            .string()
            .trim()
            .max(
              100,
              "Muscle group cannot exceed 100 characters"
            )
            .optional(),

          isWarmup: z
            .boolean({
              message: "isWarmup must be a boolean",
            })
            .optional(),
        })
      )
      .optional()
      .default([]),
  }),

  params: z.object({}),

  query: z.object({}),
});

export const updateWorkoutSchema = z.object({
  body: z
    .object({
      title: z
        .string()
        .trim()
        .min(1, "Title cannot be empty")
        .max(100, "Title cannot exceed 100 characters")
        .optional(),

      notes: z
        .string()
        .trim()
        .max(500, "Notes cannot exceed 500 characters")
        .optional(),

      duration: z
        .number()
        .finite()
        .min(0, "Duration cannot be negative")
        .optional(),

      caloriesBurned: z
        .number()
        .finite()
        .min(0, "Calories burned cannot be negative")
        .optional(),

      category: z
        .string()
        .trim()
        .max(50, "Category cannot exceed 50 characters")
        .optional(),

      imageUrl: z
        .union([
          z.string().trim().url("Invalid image URL"),
          z.literal(""),
        ])
        .optional(),

      visibility: z
        .enum(["private", "followers", "public", "community"])
        .optional(),

      isPublic: z.boolean().optional(),

      exercises: z
        .array(
          z.object({
            name: z
              .string()
              .trim()
              .min(1, "Exercise name is required")
              .max(100, "Exercise name cannot exceed 100 characters"),

            sets: z
              .number()
              .int()
              .min(1, "Sets must be at least 1"),

            reps: z
              .number()
              .int()
              .min(0, "Reps cannot be negative"),

            weight: z
              .number()
              .finite()
              .min(0, "Weight cannot be negative")
              .optional(),

            unit: z
              .enum(["kg", "lb"])
              .optional(),

            rpe: z
              .number()
              .finite()
              .min(1, "RPE must be at least 1")
              .max(10, "RPE cannot exceed 10")
              .optional(),

            muscleGroup: z
              .string()
              .trim()
              .max(100, "Muscle group cannot exceed 100 characters")
              .optional(),

            isWarmup: z.boolean().optional(),
          })
        )
        .optional(),
    })
    .refine(
      (data) => Object.keys(data).length > 0,
      {
        message: "At least one field is required to update the workout",
      }
    ),

  params: z.object({
    id: z.string().min(1, "Workout ID is required"),
  }),

  query: z.object({}),
});