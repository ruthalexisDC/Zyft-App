// // routes/workoutRoutes.js
// import express from "express";
// import auth from "../middleware/authMiddleware.js";
// import Workout from "../models/Workout.js";
// import Post from "../models/Post.js";
// import Notification from "../models/Notification.js";
// import User from "../models/User.js";

// const router = express.Router();

// // ── GET /api/workouts - list all public workouts
// router.get("/", auth, async (req, res) => {
//   try {
//     const workouts = await Workout.find({ isPublic: true })
//       .sort({ createdAt: -1 })
//       .limit(20)
//       .populate("user", "name handle avatar");
//     res.json({ workouts });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// // ── GET /api/workouts/:id
// router.get("/:id", auth, async (req, res) => {
//   try {
//     const workout = await Workout.findById(req.params.id)
//       .populate("user", "name handle avatar")
//       .populate("comments.user", "name handle avatar")
//       .populate("respects", "_id");

//     if (!workout) return res.status(404).json({ message: "Workout not found" });
//     res.json(workout);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// // ── POST /api/workouts
// // Create a new workout log + AUTO-CREATE POST
// router.post("/", auth, async (req, res) => {
//   try {
//     const { title, notes, duration, exercises, category, caloriesBurned, imageUrl } = req.body;
    
//     // 1. Create workout
//     const workout = await Workout.create({
//       user: req.user._id,
//       title,
//       notes,
//       duration,
//       caloriesBurned: caloriesBurned || 0,
//       exercises,
//       imageUrl: imageUrl || '',
//       isPublic: req.body.isPublic !== false,
//     });

//     // 2. Create post (if public)
//     if (workout.isPublic) {
//       await Post.create({
//         user: req.user._id,
//         content: notes?.trim() || `${title.trim()} - just crushed this workout! 💪`,
//         workout: {
//           title: workout.title,
//           category: category || 'Strength',
//           duration: workout.duration,
//           caloriesBurned: workout.caloriesBurned,
//           exercises: (exercises || []).map(e => ({
//             name: e.name,
//             sets: parseInt(e.sets) || 0,
//             reps: e.reps || 0,
//             weight: parseFloat(e.weight) || 0,
//           })),
//           imageUrl: workout.imageUrl,
//         },
//         visibility: 'public',
//       });

//       // 3. Notify followers
//       const user = await User.findById(req.user._id);
//       if (user?.followers?.length > 0) {
//         const notifications = user.followers.map(followerId => ({
//           recipient: followerId,
//           sender: req.user._id,
//           type: 'respect',
//           workout: workout._id,
//         }));
//         await Notification.insertMany(notifications);
//       }
//     }

//     res.status(201).json({
//       success: true,
//       workout,
//       message: workout.isPublic ? 'Workout logged and shared!' : 'Workout saved privately',
//     });
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// });

// // ── POST /api/workouts/:id/respect
// router.post("/:id/respect", auth, async (req, res) => {
//   try {
//     const workout = await Workout.findById(req.params.id);
//     if (!workout) return res.status(404).json({ message: "Workout not found" });

//     const alreadyRespected = workout.respects.includes(req.user._id);

//     if (alreadyRespected) {
//       workout.respects.pull(req.user._id);
//     } else {
//       workout.respects.push(req.user._id);

//       if (!workout.user.equals(req.user._id)) {
//         const owner = await User.findById(workout.user).select("notificationPreferences");
//         if (owner?.notificationPreferences?.respect !== false) {
//           await Notification.create({
//             recipient: workout.user,
//             sender:    req.user._id,
//             type:      "respect",
//             workout:   workout._id,
//           });
//         }
//       }
//     }

//     await workout.save();
//     res.json({ respected: !alreadyRespected, count: workout.respects.length });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// // ── POST /workouts/:id/comments
// router.post("/:id/comments", auth, async (req, res) => {
//   try {
//     const { text } = req.body;
//     if (!text?.trim()) return res.status(400).json({ message: "Comment is empty" });

//     const workout = await Workout.findById(req.params.id);
//     if (!workout) return res.status(404).json({ message: "Workout not found" });

//     workout.comments.push({ user: req.user._id, text });
//     await workout.save();

//     const newComment = workout.comments[workout.comments.length - 1];

//     if (!workout.user.equals(req.user._id)) {
//       const owner = await User.findById(workout.user).select("notificationPreferences");
//       if (owner?.notificationPreferences?.comment !== false) {
//         await Notification.create({
//           recipient: workout.user,
//           sender:    req.user._id,
//           type:      "comment",
//           workout:   workout._id,
//           comment:   newComment._id,
//         });
//       }
//     }

//     const mentioned = text.match(/@[\w]+/g) || [];
//     for (const m of mentioned) {
//       const handle = m.slice(1).toLowerCase();
//       const mentionedUser = await User.findOne({ handle });
//       if (
//         mentionedUser &&
//         !mentionedUser._id.equals(req.user._id) &&
//         !mentionedUser._id.equals(workout.user) &&
//         mentionedUser.notificationPreferences?.comment !== false
//       ) {
//         await Notification.create({
//           recipient: mentionedUser._id,
//           sender:    req.user._id,
//           type:      "mention",
//           workout:   workout._id,
//           comment:   newComment._id,
//         });
//       }
//     }

//     await workout.populate("comments.user", "name handle avatar");
//     res.status(201).json(newComment);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// export default router;

// routes/workoutRoutes.js
import express from "express";
import auth from "../middleware/authMiddleware.js";
import Workout from "../models/Workout.js";
import Post from "../models/Post.js";
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
    // IMPORTANT: capture the created Post — this is the document the
    // frontend actually fetches by ID (getPost -> GET /api/posts/:id,
    // WorkoutPost.jsx -> "view post"). Notifications must reference
    // post._id, NOT workout._id, or "view post" 404s every time.
    let post = null;
    if (workout.isPublic) {
      post = await Post.create({
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

      // 3. Notify followers — reference the POST's id, since that's what
      // "view post" resolves against.
      const user = await User.findById(req.user._id);
      if (user?.followers?.length > 0) {
        const notifications = user.followers.map(followerId => ({
          recipient: followerId,
          sender: req.user._id,
          type: 'respect',
          workout: post._id, // NOTE: field is still called "workout" to avoid
                              // touching the Notification schema / notificationsRoutes.js,
                              // but the value is now the Post's _id.
        }));
        await Notification.insertMany(notifications);
      }
    }

    res.status(201).json({
      success: true,
      workout,
      post,
      message: workout.isPublic ? 'Workout logged and shared!' : 'Workout saved privately',
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ── DEPRECATED: POST /api/workouts/:id/respect
// Not called anywhere in the frontend (src/api/posts.js's respectPost hits
// /api/posts/:id/respect instead, which operates on the Post model that
// the feed and WorkoutPost page actually read). Operating on Workout.respects
// here would silently diverge from Post.respects, which is what's rendered.
// Left commented out rather than deleted outright — restore only if you
// intend to wire the frontend to call this instead.
//
// router.post("/:id/respect", auth, async (req, res) => { ... });

// ── DEPRECATED: POST /api/workouts/:id/comments
// Same issue as above: src/api/posts.js's addComment hits
// /api/posts/:id/comments and writes to the separate Comment model,
// not Workout.comments[]. Comments made here would never show up
// in the UI. Left commented out; restore only if intentionally re-wired.
//
// router.post("/:id/comments", auth, async (req, res) => { ... });

export default router;