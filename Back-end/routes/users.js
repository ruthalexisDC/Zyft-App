// import express from "express";
// import mongoose from "mongoose";
// import multer from "multer";

// import auth from "../middleware/authMiddleware.js";
// import User from "../models/User.js";
// import Notification from "../models/Notification.js";
// import Workout from "../models/Workout.js";

// import {
//   getUserProfileById,
//   getUserPostsById,
//   updateProfile,
//   uploadAvatar,
//   deleteAccount,
// } from "../controllers/userController.js";
// import { setUserGoal } from "../controllers/goalController.js";

// const upload = multer({ storage: multer.memoryStorage() });
// const router = express.Router();

// function timeAgo(date) {
//   const diff = Math.floor((Date.now() - new Date(date)) / 1000);
//   if (diff < 60) return "Just now";
//   if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
//   if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
//   return `${Math.floor(diff / 86400)}d ago`;
// }

// // ═══════════════════════════════════════════════════════
// // STATIC ROUTES (must stay above "/:handle")
// // ═══════════════════════════════════════════════════════

// // GET /api/users/me - Get current user
// router.get("/me", auth, async (req, res) => {
//   try {
//     const user = await User.findById(req.user._id).select("-password");
//     res.json({ user });
//   } catch (err) {
//     res.status(500).json({ message: "Failed to fetch user" });
//   }
// });

// // PATCH /api/users/goal
// router.patch("/goal", auth, setUserGoal);

// // GET /api/users/suggested
// router.get("/suggested", auth, async (req, res) => {
//   try {
//     const users = await User.find({ _id: { $ne: req.user._id } })
//       .limit(5)
//       .select("name handle avatar bio followers following");

//     const shaped = users.map((u) => ({
//       ...u.toObject(),
//       isFollowing: u.followers.some((id) => id.toString() === req.user._id.toString()),
//     }));

//     res.json({ users: shaped });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// // ═══════════════════════════════════════════════════════
// // PROFILE ROUTES
// // ═══════════════════════════════════════════════════════

// router.put("/profile", auth, updateProfile);
// router.put("/avatar", auth, upload.single("photo"), uploadAvatar);
// router.delete("/account", auth, deleteAccount);

// // ═══════════════════════════════════════════════════════
// // ID-BASED ROUTES (namespaced under /id, so no collision with /:handle)
// // ═══════════════════════════════════════════════════════

// router.get("/id/:id", auth, getUserProfileById);
// router.get("/id/:id/posts", auth, getUserPostsById);

// router.post("/id/:id/follow", auth, async (req, res) => {
//   try {
//     const targetId = req.params.id;
//     const currentUserId = req.user.id || req.user._id;

//     if (targetId === currentUserId.toString()) {
//       return res.status(400).json({ message: "Can't follow yourself" });
//     }

//     const targetUser = await User.findById(targetId);
//     const currentUser = await User.findById(currentUserId);

//     if (!targetUser || !currentUser) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     const isFollowing = targetUser.followers.some((id) => id.toString() === currentUserId.toString());

//     if (isFollowing) {
//       // Unfollow
//       targetUser.followers = targetUser.followers.filter((id) => id.toString() !== currentUserId.toString());
//       currentUser.following = currentUser.following.filter((id) => id.toString() !== targetId);
//     } else {
//       // Follow
//       targetUser.followers.push(currentUserId);
//       currentUser.following.push(targetId);

//       await Notification.create({
//         recipient: targetId,
//         sender: currentUserId,
//         type: "follow",
//       });
//     }

//     await Promise.all([targetUser.save(), currentUser.save()]);

//     res.json({
//       following: !isFollowing,
//       followersCount: targetUser.followers.length,
//       followingCount: targetUser.following.length,
//     });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// router.get("/id/:id/follow-status", auth, async (req, res) => {
//   try {
//     const targetUser = await User.findById(req.params.id);

//     if (!targetUser) return res.status(404).json({ message: "User not found" });

//     const currentUserId = (req.user.id || req.user._id).toString();
//     const isFollowing = targetUser.followers.some((id) => id.toString() === currentUserId);
//     res.json({ isFollowing });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// // GET /api/users/id/:id/followers — list of users following this user
// router.get("/id/:id/followers", auth, async (req, res) => {
//   try {
//     const currentUserId = (req.user.id || req.user._id).toString();

//     const user = await User.findById(req.params.id).populate(
//       "followers",
//       "name handle avatar bio followers"
//     );

//     if (!user) return res.status(404).json({ message: "User not found" });

//     const list = user.followers.map((u) => ({
//       id: u._id,
//       name: u.name,
//       handle: `@${u.handle}`,
//       avatar: u.avatar,
//       bio: u.bio,
//       isFollowing: u.followers?.some((id) => id.toString() === currentUserId) || false,
//     }));

//     res.json({ users: list });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// // GET /api/users/id/:id/following — list of users this user follows
// router.get("/id/:id/following", auth, async (req, res) => {
//   try {
//     const currentUserId = (req.user.id || req.user._id).toString();

//     const user = await User.findById(req.params.id).populate(
//       "following",
//       "name handle avatar bio followers"
//     );

//     if (!user) return res.status(404).json({ message: "User not found" });

//     const list = user.following.map((u) => ({
//       id: u._id,
//       name: u.name,
//       handle: `@${u.handle}`,
//       avatar: u.avatar,
//       bio: u.bio,
//       isFollowing: u.followers?.some((id) => id.toString() === currentUserId) || false,
//     }));

//     res.json({ users: list });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// // ═══════════════════════════════════════════════════════
// // WORKOUT SPLIT ROUTES
// // (safe below "/:handle" since Express won't let a single-segment
// // wildcard match a two-segment path like "/:id/split")
// // ═══════════════════════════════════════════════════════

// router.get("/:id/split", auth, async (req, res) => {
//   try {
//     if (req.user._id.toString() !== req.params.id) {
//       return res.status(403).json({ message: "Unauthorized" });
//     }

//     const user = await User.findById(req.params.id).select("workoutSplit");
//     if (!user) return res.status(404).json({ message: "User not found" });

//     res.json({
//       split: user.workoutSplit || Array(7).fill("Rest"),
//     });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// router.put("/:id/split", auth, async (req, res) => {
//   try {
//     if (req.user._id.toString() !== req.params.id) {
//       return res.status(403).json({ message: "Unauthorized" });
//     }

//     const { split } = req.body;

//     if (!Array.isArray(split) || split.length !== 7) {
//       return res.status(400).json({
//         message: "Split must be an array of exactly 7 day labels",
//       });
//     }

//     if (!split.every((day) => typeof day === "string" && day.length <= 20)) {
//       return res.status(400).json({
//         message: "Each day must be a string (max 20 chars)",
//       });
//     }

//     const user = await User.findByIdAndUpdate(
//       req.params.id,
//       { workoutSplit: split },
//       { new: true }
//     ).select("workoutSplit");

//     res.json({
//       message: "Split updated",
//       split: user.workoutSplit,
//     });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// // ═══════════════════════════════════════════════════════
// // HANDLE-BASED ROUTES (wildcards — must stay LAST)
// // ═══════════════════════════════════════════════════════

// // GET /api/users/:handle — Public profile by handle
// router.get("/:handle", auth, async (req, res) => {
//   try {
//     const user = await User.findOne({ handle: req.params.handle.toLowerCase() }).select("-password -email");

//     if (!user) return res.status(404).json({ message: "User not found" });

//     const workoutCount = await Workout.countDocuments({ user: user._id });
//     const recentWorkouts = await Workout.find({ user: user._id, isPublic: true })
//       .sort({ createdAt: -1 })
//       .limit(5)
//       .select("title duration createdAt");

//     const isFollowing = user.followers.includes(req.user._id);

//     res.json({
//       id: user._id,
//       name: user.name,
//       handle: `@${user.handle}`,
//       avatar: user.avatar,
//       bio: user.bio,
//       streakCount: user.streakCount,
//       isFollowing,
//       stats: {
//         workouts: workoutCount,
//         followers: user.followers.length,
//         following: user.following.length,
//       },
//       recentWorkouts: recentWorkouts.map((w) => ({
//         id: w._id,
//         title: w.title,
//         duration: w.duration ? `${w.duration}m` : null,
//         date: timeAgo(w.createdAt),
//       })),
//     });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// // POST /api/users/:handle/follow — Toggle follow/unfollow by handle
// router.post("/:handle/follow", auth, async (req, res) => {
//   try {
//     const search = req.params.handle.toLowerCase();

//     let target = await User.findOne({ handle: search });
//     if (!target && mongoose.Types.ObjectId.isValid(search)) {
//       target = await User.findById(search);
//     }

//     if (!target) return res.status(404).json({ message: "User not found" });
//     if (target._id.equals(req.user._id)) {
//       return res.status(400).json({ message: "You cannot follow yourself" });
//     }

//     const isFollowing = target.followers.includes(req.user._id);

//     if (isFollowing) {
//       target.followers.pull(req.user._id);
//       req.user.following.pull(target._id);
//     } else {
//       target.followers.push(req.user._id);
//       req.user.following.push(target._id);

//       await Notification.create({
//         recipient: target._id,
//         sender: req.user._id,
//         type: "follow",
//       });
//     }

//     await Promise.all([target.save(), req.user.save()]);

//     res.json({
//       following: !isFollowing,
//       followerCount: target.followers.length,
//     });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// // POST /api/users/:handle/follow-only — Force follow
// router.post("/:handle/follow-only", auth, async (req, res) => {
//   try {
//     const target = await User.findOne({ handle: req.params.handle.toLowerCase() });
//     if (!target) return res.status(404).json({ message: "User not found" });
//     if (target._id.equals(req.user._id)) {
//       return res.status(400).json({ message: "You cannot follow yourself" });
//     }

//     const alreadyFollowing = target.followers.includes(req.user._id);

//     if (!alreadyFollowing) {
//       target.followers.push(req.user._id);
//       req.user.following.push(target._id);

//       await Notification.create({
//         recipient: target._id,
//         sender: req.user._id,
//         type: "follow",
//       });

//       await Promise.all([target.save(), req.user.save()]);
//     }

//     res.json({
//       following: true,
//       followerCount: target.followers.length,
//     });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// // POST /api/users/:handle/unfollow — Force unfollow
// router.post("/:handle/unfollow", auth, async (req, res) => {
//   try {
//     const target = await User.findOne({ handle: req.params.handle.toLowerCase() });
//     if (!target) return res.status(404).json({ message: "User not found" });

//     target.followers.pull(req.user._id);
//     req.user.following.pull(target._id);

//     await Promise.all([target.save(), req.user.save()]);

//     res.json({
//       following: false,
//       followerCount: target.followers.length,
//     });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// // GET /api/users — list all users
// router.get("/", auth, async (req, res) => {
//   try {
//     const users = await User.find({ _id: { $ne: req.user._id } })
//       .limit(10)
//       .select("name handle avatar bio followers following streakCount");

//     const currentUserId = req.user._id.toString();

//     const shaped = users.map((u) => ({
//       id: u._id,
//       name: u.name,
//       handle: u.handle ? `@${u.handle}` : `@user${u._id.toString().slice(-4)}`,
//       avatar: u.avatar,
//       bio: u.bio || "Fitness enthusiast",
//       streakCount: u.streakCount || 0,
//       followers: u.followers?.length || 0,
//       following: u.following?.length || 0,
//       isFollowing: u.followers?.some((id) => id.toString() === currentUserId) || false,
//       workouts: Math.floor(Math.random() * 200) + 20,
//       initials: u.name?.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "U",
//       color: "from-[#8b5cf6] to-[#a78bfa]",
//       focus: "Strength",
//       level: "Intermediate",
//       followersNum: u.followers?.length || 0,
//     }));

//     res.json({ users: shaped });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// export default router;

// routes/users.js
//
// Single source of truth for everything mounted at /api/users.
// (Merged in from routes/userRoutes.js — that file was mounted on the
// same prefix and has been removed; see server.js.)
//
// ORDERING RULES — read before adding a route:
//   1. Exact/static paths (e.g. "/me", "/goal", "/suggested", "/profile")
//      MUST come before any "/:handle"-style wildcard route below, or the
//      wildcard will shadow them.
//   2. "/id/:id..." routes are namespaced under "/id" specifically so they
//      never collide with the "/:handle" routes.

import express from "express";
import mongoose from "mongoose";
import multer from "multer";

import auth from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import Workout from "../models/Workout.js";

import {
  getUserProfileById,
  getUserPostsById,
  updateProfile,
  uploadAvatar,
  deleteAccount,
} from "../controllers/userController.js";
import { setUserGoal } from "../controllers/goalController.js";

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ═══════════════════════════════════════════════════════
// STATIC ROUTES (must stay above "/:handle")
// ═══════════════════════════════════════════════════════

// GET /api/users/me - Get current user
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user" });
  }
});

// PATCH /api/users/goal
router.patch("/goal", auth, setUserGoal);

// PATCH /api/users/privacy — toggle or set private-account status
router.patch("/privacy", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Body can pass an explicit value, or omit it to just toggle
    user.isPrivate = typeof req.body.isPrivate === "boolean" ? req.body.isPrivate : !user.isPrivate;
    await user.save();

    res.json({ isPrivate: user.isPrivate });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/notification-preferences
router.get("/notification-preferences", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("notificationPreferences");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      preferences: user.notificationPreferences || { respect: true, comment: true, follow: true },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/users/notification-preferences — partial update, e.g. { respect: false }
router.patch("/notification-preferences", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const allowedKeys = ["respect", "comment", "follow"];
    for (const key of allowedKeys) {
      if (typeof req.body[key] === "boolean") {
        user.notificationPreferences[key] = req.body[key];
      }
    }

    await user.save();
    res.json({ preferences: user.notificationPreferences });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/suggested
router.get("/suggested", auth, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .limit(5)
      .select("name handle avatar bio followers following");

    const shaped = users.map((u) => ({
      ...u.toObject(),
      isFollowing: u.followers.some((id) => id.toString() === req.user._id.toString()),
    }));

    res.json({ users: shaped });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ═══════════════════════════════════════════════════════
// PROFILE ROUTES
// ═══════════════════════════════════════════════════════

router.put("/profile", auth, updateProfile);
router.put("/avatar", auth, upload.single("photo"), uploadAvatar);
router.delete("/account", auth, deleteAccount);

// ═══════════════════════════════════════════════════════
// ID-BASED ROUTES (namespaced under /id, so no collision with /:handle)
// ═══════════════════════════════════════════════════════

router.get("/id/:id", auth, getUserProfileById);
router.get("/id/:id/posts", auth, getUserPostsById);

router.post("/id/:id/follow", auth, async (req, res) => {
  try {
    const targetId = req.params.id;
    const currentUserId = req.user.id || req.user._id;

    if (targetId === currentUserId.toString()) {
      return res.status(400).json({ message: "Can't follow yourself" });
    }

    const targetUser = await User.findById(targetId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser || !currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const isFollowing = targetUser.followers.some((id) => id.toString() === currentUserId.toString());

    if (isFollowing) {
      // Unfollow
      targetUser.followers = targetUser.followers.filter((id) => id.toString() !== currentUserId.toString());
      currentUser.following = currentUser.following.filter((id) => id.toString() !== targetId);
    } else {
      // Follow
      targetUser.followers.push(currentUserId);
      currentUser.following.push(targetId);

      if (targetUser.notificationPreferences?.follow !== false) {
        await Notification.create({
          recipient: targetId,
          sender: currentUserId,
          type: "follow",
        });
      }
    }

    await Promise.all([targetUser.save(), currentUser.save()]);

    res.json({
      following: !isFollowing,
      followersCount: targetUser.followers.length,
      followingCount: targetUser.following.length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/id/:id/follow-status", auth, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);

    if (!targetUser) return res.status(404).json({ message: "User not found" });

    const currentUserId = (req.user.id || req.user._id).toString();
    const isFollowing = targetUser.followers.some((id) => id.toString() === currentUserId);
    res.json({ isFollowing });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/id/:id/followers — list of users following this user
router.get("/id/:id/followers", auth, async (req, res) => {
  try {
    const currentUserId = (req.user.id || req.user._id).toString();

    const user = await User.findById(req.params.id).populate(
      "followers",
      "name handle avatar bio followers"
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    const list = user.followers.map((u) => ({
      id: u._id,
      name: u.name,
      handle: `@${u.handle}`,
      avatar: u.avatar,
      bio: u.bio,
      isFollowing: u.followers?.some((id) => id.toString() === currentUserId) || false,
    }));

    res.json({ users: list });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/id/:id/following — list of users this user follows
router.get("/id/:id/following", auth, async (req, res) => {
  try {
    const currentUserId = (req.user.id || req.user._id).toString();

    const user = await User.findById(req.params.id).populate(
      "following",
      "name handle avatar bio followers"
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    const list = user.following.map((u) => ({
      id: u._id,
      name: u.name,
      handle: `@${u.handle}`,
      avatar: u.avatar,
      bio: u.bio,
      isFollowing: u.followers?.some((id) => id.toString() === currentUserId) || false,
    }));

    res.json({ users: list });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ═══════════════════════════════════════════════════════
// WORKOUT SPLIT ROUTES
// (safe below "/:handle" since Express won't let a single-segment
// wildcard match a two-segment path like "/:id/split")
// ═══════════════════════════════════════════════════════

router.get("/:id/split", auth, async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const user = await User.findById(req.params.id).select("workoutSplit");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      split: user.workoutSplit || Array(7).fill("Rest"),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/:id/split", auth, async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const { split } = req.body;

    if (!Array.isArray(split) || split.length !== 7) {
      return res.status(400).json({
        message: "Split must be an array of exactly 7 day labels",
      });
    }

    if (!split.every((day) => typeof day === "string" && day.length <= 20)) {
      return res.status(400).json({
        message: "Each day must be a string (max 20 chars)",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { workoutSplit: split },
      { new: true }
    ).select("workoutSplit");

    res.json({
      message: "Split updated",
      split: user.workoutSplit,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ═══════════════════════════════════════════════════════
// HANDLE-BASED ROUTES (wildcards — must stay LAST)
// ═══════════════════════════════════════════════════════

// GET /api/users/:handle — Public profile by handle
router.get("/:handle", auth, async (req, res) => {
  try {
    const user = await User.findOne({ handle: req.params.handle.toLowerCase() }).select("-password -email");

    if (!user) return res.status(404).json({ message: "User not found" });

    const workoutCount = await Workout.countDocuments({ user: user._id });
    const recentWorkouts = await Workout.find({ user: user._id, isPublic: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title duration createdAt");

    const isFollowing = user.followers.includes(req.user._id);

    res.json({
      id: user._id,
      name: user.name,
      handle: `@${user.handle}`,
      avatar: user.avatar,
      bio: user.bio,
      streakCount: user.streakCount,
      isFollowing,
      stats: {
        workouts: workoutCount,
        followers: user.followers.length,
        following: user.following.length,
      },
      recentWorkouts: recentWorkouts.map((w) => ({
        id: w._id,
        title: w.title,
        duration: w.duration ? `${w.duration}m` : null,
        date: timeAgo(w.createdAt),
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/users/:handle/follow — Toggle follow/unfollow by handle
router.post("/:handle/follow", auth, async (req, res) => {
  try {
    const search = req.params.handle.toLowerCase();

    let target = await User.findOne({ handle: search });
    if (!target && mongoose.Types.ObjectId.isValid(search)) {
      target = await User.findById(search);
    }

    if (!target) return res.status(404).json({ message: "User not found" });
    if (target._id.equals(req.user._id)) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const isFollowing = target.followers.includes(req.user._id);

    if (isFollowing) {
      target.followers.pull(req.user._id);
      req.user.following.pull(target._id);
    } else {
      target.followers.push(req.user._id);
      req.user.following.push(target._id);

      if (target.notificationPreferences?.follow !== false) {
        await Notification.create({
          recipient: target._id,
          sender: req.user._id,
          type: "follow",
        });
      }
    }

    await Promise.all([target.save(), req.user.save()]);

    res.json({
      following: !isFollowing,
      followerCount: target.followers.length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/users/:handle/follow-only — Force follow
router.post("/:handle/follow-only", auth, async (req, res) => {
  try {
    const target = await User.findOne({ handle: req.params.handle.toLowerCase() });
    if (!target) return res.status(404).json({ message: "User not found" });
    if (target._id.equals(req.user._id)) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const alreadyFollowing = target.followers.includes(req.user._id);

    if (!alreadyFollowing) {
      target.followers.push(req.user._id);
      req.user.following.push(target._id);

      if (target.notificationPreferences?.follow !== false) {
        await Notification.create({
          recipient: target._id,
          sender: req.user._id,
          type: "follow",
        });
      }

      await Promise.all([target.save(), req.user.save()]);
    }

    res.json({
      following: true,
      followerCount: target.followers.length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/users/:handle/unfollow — Force unfollow
router.post("/:handle/unfollow", auth, async (req, res) => {
  try {
    const target = await User.findOne({ handle: req.params.handle.toLowerCase() });
    if (!target) return res.status(404).json({ message: "User not found" });

    target.followers.pull(req.user._id);
    req.user.following.pull(target._id);

    await Promise.all([target.save(), req.user.save()]);

    res.json({
      following: false,
      followerCount: target.followers.length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users — list all users
router.get("/", auth, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .limit(10)
      .select("name handle avatar bio followers following streakCount");

    const currentUserId = req.user._id.toString();

    const shaped = users.map((u) => ({
      id: u._id,
      name: u.name,
      handle: u.handle ? `@${u.handle}` : `@user${u._id.toString().slice(-4)}`,
      avatar: u.avatar,
      bio: u.bio || "Fitness enthusiast",
      streakCount: u.streakCount || 0,
      followers: u.followers?.length || 0,
      following: u.following?.length || 0,
      isFollowing: u.followers?.some((id) => id.toString() === currentUserId) || false,
      workouts: Math.floor(Math.random() * 200) + 20,
      initials: u.name?.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "U",
      color: "from-[#8b5cf6] to-[#a78bfa]",
      focus: "Strength",
      level: "Intermediate",
      followersNum: u.followers?.length || 0,
    }));

    res.json({ users: shaped });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;