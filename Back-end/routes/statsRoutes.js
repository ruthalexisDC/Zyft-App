// backend/routes/statsRoutes.js
import express from "express";
import { getUserStats, resetDailyGoals } from "../controllers/statsController.js";
import  authenticate  from "../middleware/authMiddleware.js";  // ← your existing middleware

const router = express.Router();

// GET  /api/stats        — fetch today's stats
// POST /api/stats/reset  — reset daily goal progress
router.get("/",       authenticate, getUserStats);
router.post("/reset", authenticate, resetDailyGoals);

export default router;