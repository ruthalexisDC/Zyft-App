import mongoose from "mongoose";

import Workout from "../models/Workout.js";
import Goal from "../models/Goal.js";
import User from "../models/User.js";

import { NotFoundError } from "../errors/ApiError.js";

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────

const getDateRanges = () => {
  // Today's date range
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // This week's date range (Monday → now)
  const weekStart = new Date();
  const dayOfWeek = weekStart.getDay();
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  weekStart.setDate(weekStart.getDate() - diffToMonday);
  weekStart.setHours(0, 0, 0, 0);

  return {
    todayStart,
    todayEnd,
    weekStart,
  };
};

// ─────────────────────────────────────────
// GET USER STATS
// ─────────────────────────────────────────

export const getUserStatsService = async ({ userId }) => {
  const { todayStart, todayEnd, weekStart } = getDateRanges();

  // ─────────────────────────────────────
  // FETCH USER SPLIT
  // ─────────────────────────────────────

  const user = await User.findById(userId).select("workoutSplit");

  if (!user) {
  throw new NotFoundError("User not found");
}

  const split = user.workoutSplit || Array(7).fill("Rest");

  // Count workout days in their split
  const plannedWorkoutDays = split.filter(
    (day) => day !== "Rest",
  ).length;

  const totalPlannedDays = plannedWorkoutDays || 7;

  // ─────────────────────────────────────
  // RUN ALL QUERIES IN PARALLEL
  // ─────────────────────────────────────
  
  const [
    weekWorkouts,
    weekCaloriesFromWorkouts,
    goals,
    workoutsThisWeek,
  ] = await Promise.all([
    // 1. Number of workouts logged this week

    Workout.countDocuments({
      user: userId,
      createdAt: {
        $gte: weekStart,
        $lte: todayEnd,
      },
    }),

    // 2. Calories from Workout collection
    //
    // Workout is the single source of truth.
    // Do NOT also count Post.workout.caloriesBurned,
    // because the Post represents the same workout.
    Workout.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          createdAt: {
            $gte: weekStart,
            $lte: todayEnd,
          },
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: "$caloriesBurned",
          },
        },
      },
    ]),

    // 3. Today's goals
    Goal.find({
      user: userId,
      date: {
        $gte: todayStart,
        $lte: todayEnd,
      },
    }),

    // 4. This week's workouts
    //
    // Used for split consistency.
    Workout.find({
      user: userId,
      createdAt: {
        $gte: weekStart,
        $lte: todayEnd,
      },
    }).select("createdAt"),
  ]);



  // ─────────────────────────────────────
  // CALCULATE CALORIES
  // ─────────────────────────────────────
  //
  // Workout is the single source of truth.
  //
  // Example:
  //
  // Workout.caloriesBurned = 740
  // Post.workout.caloriesBurned = 740
  //
  // We count only Workout:
  //
  // 740
  //
  // NOT:
  //
  // 740 + 740 = 1480
  //
  // ─────────────────────────────────────

  const totalCalories =
    weekCaloriesFromWorkouts[0]?.total ?? 0;

  // ─────────────────────────────────────
  // CALCULATE SPLIT COMPLIANCE
  // ─────────────────────────────────────
  //
  // A workout is represented by Workout.
  // The Post is only its social representation.
  //
  // Therefore, only Workout dates are used.
  //
  // ─────────────────────────────────────

  const allWorkoutDates = workoutsThisWeek.map(
    (workout) => workout.createdAt,
  );

  const workoutDayIndices = new Set(
    allWorkoutDates.map((date) => {
      const d = new Date(date);
      const day = d.getDay();

      return day === 0 ? 6 : day - 1;
    }),
  );

  let completedSplitDays = 0;

  workoutDayIndices.forEach((dayIndex) => {
    if (split[dayIndex] !== "Rest") {
      completedSplitDays++;
    }
  });

  const consistency = Math.round(
    (completedSplitDays / totalPlannedDays) * 100,
  );

  // ─────────────────────────────────────
  // AUTO-UPDATE GOAL PROGRESS
  // ─────────────────────────────────────

  for (const goal of goals) {
    let current = 0;

    if (goal.type === "workouts") {
      current = weekWorkouts;
    }

    if (goal.type === "calories") {
      current = totalCalories;
    }

    const completed = current >= goal.target;

    if (
      goal.current !== current ||
      goal.completed !== completed
    ) {
      await Goal.findByIdAndUpdate(goal._id, {
        current,
        completed,
      });

      goal.current = current;
      goal.completed = completed;
    }
  }

  // ─────────────────────────────────────
  // RETURN STATS
  // ─────────────────────────────────────

  return {
    workouts: weekWorkouts,
    calories: totalCalories,
    consistency,
    goalsCompleted: goals.filter(
      (goal) => goal.completed,
    ).length,
    totalGoals: goals.length,
    splitCompliance: {
      plannedDays: totalPlannedDays,
      completedDays: completedSplitDays,
    },
  };
};

// ─────────────────────────────────────────
// RESET DAILY GOALS
// ─────────────────────────────────────────

export const resetDailyGoalsService = async ({ userId }) => {
  const { todayStart, todayEnd } = getDateRanges();

  await Goal.updateMany(
    {
      user: userId,
      date: {
        $gte: todayStart,
        $lte: todayEnd,
      },
    },
    {
      current: 0,
      completed: false,
    },
  );

  return {
    message: "Daily goals reset",
  };
};