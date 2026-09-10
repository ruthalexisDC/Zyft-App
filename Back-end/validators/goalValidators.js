import { z } from "zod";

export const setUserGoalSchema = z.object({
  body: z.object({
    totalGoals: z
      .number({
        message: "totalGoals must be a number",
      })
      .int("totalGoals must be a whole number")
      .min(1, "totalGoals must be at least 1"),
  }),

  params: z.object({}),

  query: z.object({}),
});