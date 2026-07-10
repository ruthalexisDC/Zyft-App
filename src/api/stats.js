// src/api/stats.js
import api from "./axios.js";

export const getUserStats = () => api.get("/stats");
export const updateUserGoal = (totalGoals) => 
api.patch('/users/goal', { totalGoals });