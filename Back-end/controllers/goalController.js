// backend/controllers/goalController.js
import Goal from "../models/Goal.js";

// PATCH /api/users/goal
// Creates a "workouts" goal for today if one doesn't exist yet,
// or updates the target if it does.
export const setUserGoal = async (req, res) => {
  try {
    const userId = req.user._id ?? req.user.id;
    const { totalGoals } = req.body;

    if (!totalGoals || totalGoals < 1) {
      return res.status(400).json({ message: "totalGoals must be at least 1" });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Check if a workouts goal already exists for today
    let goal = await Goal.findOne({
      user: userId,
      type: "workouts",
      date: { $gte: todayStart, $lte: todayEnd },
    });

    if (goal) {
      // Update existing goal's target
      goal.target = totalGoals;
      goal.completed = goal.current >= totalGoals;
      await goal.save();
    } else {
      // Create a fresh goal for today
      goal = await Goal.create({
        user: userId,
        title: `Log ${totalGoals} workout${totalGoals > 1 ? "s" : ""}`,
        type: "workouts",
        target: totalGoals,
        current: 0,
        completed: false,
        date: todayStart,
      });
    }

    res.json({ message: "Goal set successfully", goal });
  } catch (err) {
    console.error("setUserGoal error:", err);
    res.status(500).json({ message: "Failed to set goal" });
  }
};