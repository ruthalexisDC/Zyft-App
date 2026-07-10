// routes/workouts.js
import express from "express";
import auth from "../middleware/authMiddleware.js";
import Workout from "../models/Workout.js";
import Post from "../models/Post.js";           // ← ADD THIS
import Notification from "../models/Notification.js";
import User from "../models/User.js";

const router = express.Router();

// ── GET /api/workouts - list all public workouts
router.get("/", auth, async (req, res) => {
  try {
    const workouts = await Workout.find({ isPublic: true })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("user", "name handle avatar");
    res.json({ workouts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/workouts/:id
router.get("/:id", auth, async (req, res) => {
  try {
    const workout = await Workout.findById(req.params.id)
      .populate("user", "name handle avatar")
      .populate("comments.user", "name handle avatar")
      .populate("respects", "_id");

    if (!workout) return res.status(404).json({ message: "Workout not found" });
    res.json(workout);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/workouts
// Create a new workout log + AUTO-CREATE POST
router.post("/", auth, async (req, res) => {
  try {
    const { title, notes, duration, exercises, category, caloriesBurned, imageUrl } = req.body;
    
    // 1. Create workout
    const workout = await Workout.create({
      user: req.user._id,
      title,
      notes,
      duration,
      caloriesBurned: caloriesBurned || 0,
      exercises,
      imageUrl: imageUrl || '',
      isPublic: req.body.isPublic !== false,
    });

    // 2. Create post (if public)
    if (workout.isPublic) {
      await Post.create({
        user: req.user._id,
        content: notes?.trim() || `${title.trim()} - just crushed this workout! 💪`,
        workout: {
          title: workout.title,
          category: category || 'Strength',
          duration: workout.duration,
          caloriesBurned: workout.caloriesBurned,
          exercises: (exercises || []).map(e => ({
            name: e.name,
            sets: parseInt(e.sets) || 0,
            reps: e.reps || 0,
            weight: parseFloat(e.weight) || 0,
          })),
          imageUrl: workout.imageUrl,
        },
        visibility: 'public',
      });

      // 3. Notify followers
      const user = await User.findById(req.user._id);
      if (user?.followers?.length > 0) {
        const notifications = user.followers.map(followerId => ({
          recipient: followerId,
          sender: req.user._id,
          type: 'respect',
          workout: workout._id,
        }));
        await Notification.insertMany(notifications);
      }
    }

    res.status(201).json({
      success: true,
      workout,
      message: workout.isPublic ? 'Workout logged and shared!' : 'Workout saved privately',
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ── POST /api/workouts/:id/respect
router.post("/:id/respect", auth, async (req, res) => {
  try {
    const workout = await Workout.findById(req.params.id);
    if (!workout) return res.status(404).json({ message: "Workout not found" });

    const alreadyRespected = workout.respects.includes(req.user._id);

    if (alreadyRespected) {
      workout.respects.pull(req.user._id);
    } else {
      workout.respects.push(req.user._id);

      if (!workout.user.equals(req.user._id)) {
        await Notification.create({
          recipient: workout.user,
          sender:    req.user._id,
          type:      "respect",
          workout:   workout._id,
        });
      }
    }

    await workout.save();
    res.json({ respected: !alreadyRespected, count: workout.respects.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/workouts/:id/comments
router.post("/:id/comments", auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: "Comment is empty" });

    const workout = await Workout.findById(req.params.id);
    if (!workout) return res.status(404).json({ message: "Workout not found" });

    workout.comments.push({ user: req.user._id, text });
    await workout.save();

    const newComment = workout.comments[workout.comments.length - 1];

    if (!workout.user.equals(req.user._id)) {
      await Notification.create({
        recipient: workout.user,
        sender:    req.user._id,
        type:      "comment",
        workout:   workout._id,
        comment:   newComment._id,
      });
    }

    const mentioned = text.match(/@[\w]+/g) || [];
    for (const m of mentioned) {
      const handle = m.slice(1).toLowerCase();
      const mentionedUser = await User.findOne({ handle });
      if (
        mentionedUser &&
        !mentionedUser._id.equals(req.user._id) &&
        !mentionedUser._id.equals(workout.user)
      ) {
        await Notification.create({
          recipient: mentionedUser._id,
          sender:    req.user._id,
          type:      "mention",
          workout:   workout._id,
          comment:   newComment._id,
        });
      }
    }

    await workout.populate("comments.user", "name handle avatar");
    res.status(201).json(newComment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;