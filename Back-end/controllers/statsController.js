import mongoose from "mongoose";
import Workout from "../models/Workout.js";
import Post from "../models/Post.js";  // ← ADD THIS IMPORT
import Goal from "../models/Goal.js";
import User from "../models/User.js";

export const getUserStats = async (req, res) => {
  try {
    const userId = req.user._id ?? req.user.id;

    // ── Today's date range ──
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // ── This week's date range (Monday → now) ──
    const weekStart = new Date();
    const dayOfWeek = weekStart.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    weekStart.setDate(weekStart.getDate() - diffToMonday);
    weekStart.setHours(0, 0, 0, 0);

    // ── Fetch user split ──
    const user = await User.findById(userId).select("workoutSplit");
    const split = user?.workoutSplit || Array(7).fill("Rest");

    // Count workout days in their split (non-"Rest" days)
    const plannedWorkoutDays = split.filter((day) => day !== "Rest").length;
    const totalPlannedDays = plannedWorkoutDays || 7;

    // ── Run all queries in parallel ──
    const [weekWorkouts, weekCaloriesFromWorkouts, weekCaloriesFromPosts, goals, workoutsThisWeek, postsThisWeek] =
      await Promise.all([

        // 1. Workouts logged this week (from Workout collection)
        Workout.countDocuments({
          user: userId,
          createdAt: { $gte: weekStart, $lte: todayEnd },
        }),

        // 2. Calories from Workout collection
        Workout.aggregate([
          {
            $match: {
              user: new mongoose.Types.ObjectId(userId),
              createdAt: { $gte: weekStart, $lte: todayEnd },
            },
          },
          { $group: { _id: null, total: { $sum: "$caloriesBurned" } } },
        ]),

        // 3. NEW: Calories from Post collection (workout.caloriesBurned)
        Post.aggregate([
          {
            $match: {
              user: new mongoose.Types.ObjectId(userId),
              createdAt: { $gte: weekStart, $lte: todayEnd },
              "workout.caloriesBurned": { $exists: true, $gt: 0 },
            },
          },
          { $group: { _id: null, total: { $sum: "$workout.caloriesBurned" } } },
        ]),

        // 4. Today's goals
        Goal.find({
          user: userId,
          date: { $gte: todayStart, $lte: todayEnd },
        }),

        // 5. Get this week's workouts to check split compliance
        Workout.find({
          user: userId,
          createdAt: { $gte: weekStart, $lte: todayEnd },
        }).select("createdAt"),

        // 6. NEW: Get this week's posts with workouts for split compliance fallback
        Post.find({
          user: userId,
          createdAt: { $gte: weekStart, $lte: todayEnd },
          "workout.title": { $exists: true },
        }).select("createdAt"),
      ]);

    // ── Combine calories from both collections ──
    const totalCalories = 
      (weekCaloriesFromWorkouts[0]?.total ?? 0) + 
      (weekCaloriesFromPosts[0]?.total ?? 0);

    // ── Calculate split compliance ──
    // Use both Workouts and Posts for workout day detection
    const allWorkoutDates = [
      ...workoutsThisWeek.map((w) => w.createdAt),
      ...postsThisWeek.map((p) => p.createdAt),
    ];

    const workoutDayIndices = new Set(
      allWorkoutDates.map((date) => {
        const d = new Date(date);
        const day = d.getDay();
        return day === 0 ? 6 : day - 1;
      })
    );

    let completedSplitDays = 0;
    workoutDayIndices.forEach((dayIndex) => {
      if (split[dayIndex] !== "Rest") {
        completedSplitDays++;
      }
    });

    const consistency = Math.round((completedSplitDays / totalPlannedDays) * 100);

    // ── Auto-update goal progress ──
    for (const goal of goals) {
      let current = 0;
      if (goal.type === "workouts") current = weekWorkouts;
      if (goal.type === "calories") current = totalCalories;

      const completed = current >= goal.target;
      if (goal.current !== current || goal.completed !== completed) {
        await Goal.findByIdAndUpdate(goal._id, { current, completed });
        goal.current = current;
        goal.completed = completed;
      }
    }

    res.json({
      workouts: weekWorkouts,
      calories: totalCalories,
      consistency,
      goalsCompleted: goals.filter((g) => g.completed).length,
      totalGoals: goals.length,
      splitCompliance: {
        plannedDays: totalPlannedDays,
        completedDays: completedSplitDays,
      },
    });
  } catch (err) {
    console.error("getUserStats error:", err);
    res.status(500).json({ message: "Failed to fetch stats" });
  }
};

export const resetDailyGoals = async (req, res) => {
  try {
    const userId = req.user._id ?? req.user.id;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    await Goal.updateMany(
      { user: userId, date: { $gte: todayStart, $lte: todayEnd } },
      { current: 0, completed: false },
    );

    res.json({ message: "Daily goals reset" });
  } catch (err) {
    console.error("resetDailyGoals error:", err);
    res.status(500).json({ message: "Failed to reset goals" });
  }
};