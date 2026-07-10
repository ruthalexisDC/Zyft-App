// backend/routes/userRoutes.js
import express from "express";
import { setUserGoal } from "../controllers/goalController.js";
import User from '../models/User.js';
import auth from '../middleware/authMiddleware.js';  // ← Keep this one

const router = express.Router();

// GET /api/users/me - Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

// PATCH /api/users/goal
router.patch("/goal", auth, setUserGoal);  // ← Use auth, not authenticate

export default router;