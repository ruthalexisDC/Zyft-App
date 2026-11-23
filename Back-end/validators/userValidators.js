import { z } from "zod";
import { objectIdSchema } from "./commonValidators.js";

export const updateProfileSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name cannot exceed 100 characters")
      .optional(),

    bio: z
      .string()
      .trim()
      .max(200, "Bio cannot exceed 200 characters")
      .optional(),

    focus: z
      .string()
      .trim()
      .max(100, "Focus cannot exceed 100 characters")
      .optional(),

    level: z
      .string()
      .trim()
      .max(50, "Level cannot exceed 50 characters")
      .optional(),
  }),

  params: z.object({}),
  query: z.object({}),
});

export const updatePrivacySchema = z.object({
  body: z.object({
    isPrivate: z
      .boolean({
        message: "isPrivate must be a boolean",
      })
      .optional(),
  }),

  params: z.object({}),
  query: z.object({}),
});

export const updateActiveStatusSchema = z.object({
  body: z.object({
    showActiveStatus: z
      .boolean({
        message: "showActiveStatus must be a boolean",
      }),
  }),

  params: z.object({}),
  query: z.object({}),
});

export const updateNotificationPreferencesSchema = z.object({
  body: z.object({
    respect: z
      .boolean({
        message: "respect must be a boolean",
      })
      .optional(),

    comment: z
      .boolean({
        message: "comment must be a boolean",
      })
      .optional(),

    follow: z
      .boolean({
        message: "follow must be a boolean",
      })
      .optional(),
  }),

  params: z.object({}),
  query: z.object({}),
});

export const userIdParamSchema = z.object({
  body: z.object({}),
  params: z.object({
    id: objectIdSchema,
  }),
  query: z.object({}),
});

export const userHandleParamSchema = z.object({
  body: z.object({}),
  params: z.object({
    handle: z
      .string()
      .trim()
      .min(1, "Handle is required")
      .max(30, "Handle cannot exceed 30 characters"),
  }),
  query: z.object({}),
});
export const updateWorkoutSplitSchema = z.object({
  body: z.object({
    split: z
      .array(
        z
          .string()
          .max(20, "Each day must be a string (max 20 characters)")
      )
      .length(7, "Split must be an array of exactly 7 day labels"),
  }),

  params: z.object({
    id: objectIdSchema,
  }),

  query: z.object({}),
});