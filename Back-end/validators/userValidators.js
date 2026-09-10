import { z } from "zod";

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