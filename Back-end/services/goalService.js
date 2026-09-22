import Goal from "../models/Goal.js";

const getTodayRange = () => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  return {
    todayStart,
    todayEnd,
  };
};

export const setUserGoalService = async ({ userId, totalGoals }) => {
  const { todayStart, todayEnd } = getTodayRange();

  let goal = await Goal.findOne({
    user: userId,
    type: "workouts",
    date: {
      $gte: todayStart,
      $lte: todayEnd,
    },
  });

  if (goal) {
    goal.target = totalGoals;
    goal.completed = goal.current >= totalGoals;

    await goal.save();
  } else {
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

  return goal;
};