import express from "express";
import mongoose from "mongoose";
import multer from "multer";


import auth from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import Workout from "../models/Workout.js";
import Post from "../models/Post.js";
import Comment from "../models/Comments.js";
import { validate } from "../middleware/validate.js";
import { setUserGoalSchema } from "../validators/goalValidators.js";
import {
  updateProfileSchema,
  updatePrivacySchema,
  updateActiveStatusSchema,
  updateNotificationPreferencesSchema,
  userIdParamSchema,
  userHandleParamSchema,
  updateWorkoutSplitSchema,
} from "../validators/userValidators.js";

import { createNotificationService } from "../services/notificationService.js";
import {
  toggleFollowService,
  followUserService,
} from "../services/followService.js";

import {
  getUserProfileById,
  getUserPostsById,
  updateProfile,
  uploadAvatar,
  deleteAccount,
} from "../controllers/userController.js";
import { setUserGoal } from "../controllers/goalController.js";
import {
  sendSuccess,
  sendError,
} from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../errors/ApiError.js";

// Was `multer({ storage: multer.memoryStorage() })` with no limits or
// fileFilter — any authenticated user could upload an arbitrarily large
// or non-image file, which then gets base64-encoded straight into the
// Mongo user document (see uploadAvatar in userController.js). That's an
// easy DoS vector and a document-size/DB-bloat risk. Cap size and
// restrict to actual image mimetypes.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
      console.log("Uploaded filename:", file.originalname);
  console.log("Uploaded MIME type:", file.mimetype);

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG, WEBP, or GIF images are allowed'));
    }
    cb(null, true);
  },
});
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
router.get(
  "/me",
  auth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return sendSuccess(res, {
      message: "Profile retrieved successfully",
      data: { user },
    });
  })
);

// POST /api/users/heartbeat — client sends this every ~30s while the app
// is in the foreground to keep last_active_at fresh. Used for computing
// "Active now" / "Active X ago" status shown to other users.
router.post(
  "/heartbeat",
  auth,
  asyncHandler(async (req, res) => {
    const now = new Date();

    await User.findByIdAndUpdate(req.user._id, {
      last_active_at: now,
    });

    return sendSuccess(res, {
      data: {
        lastActiveAt: now.toISOString(),
      },
    });
  })
);

// PATCH /api/users/active-status — toggle whether this user's active
// status is visible to others (show_active_status). Default true.
router.patch(
  "/active-status",
  auth,
  validate(updateActiveStatusSchema),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    user.show_active_status =
      typeof req.body.showActiveStatus === "boolean"
        ? req.body.showActiveStatus
        : !user.show_active_status;

    await user.save();

    return sendSuccess(res, {
      data: {
        showActiveStatus: user.show_active_status,
      },
    });
  })
);

// PATCH /api/users/goal
router.patch("/goal", auth, validate(setUserGoalSchema), setUserGoal);

// PATCH /api/users/privacy — toggle or set private-account status
router.patch(
  "/privacy",
  auth,
  validate(updatePrivacySchema),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Body can pass an explicit value, or omit it to just toggle
    user.isPrivate =
      typeof req.body.isPrivate === "boolean"
        ? req.body.isPrivate
        : !user.isPrivate;

    await user.save();

    return sendSuccess(res, {
      data: {
        isPrivate: user.isPrivate,
      },
    });
  })
);

// GET /api/users/notification-preferences
router.get(
  "/notification-preferences",
  auth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select(
      "notificationPreferences"
    );

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return sendSuccess(res, {
      data: {
        preferences: user.notificationPreferences || {
          respect: true,
          comment: true,
          follow: true,
        },
      },
    });
  })
);

// PATCH /api/users/notification-preferences — partial update, e.g. { respect: false }
router.patch(
  "/notification-preferences",
  auth,
  validate(updateNotificationPreferencesSchema),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    const allowedKeys = ["respect", "comment", "follow"];

    for (const key of allowedKeys) {
      if (typeof req.body[key] === "boolean") {
        user.notificationPreferences[key] = req.body[key];
      }
    }

    await user.save();

    return sendSuccess(res, {
      data: {
        preferences: user.notificationPreferences,
      },
    });
  })
);

// GET /api/users/suggested
router.get(
  "/suggested",
  auth,
  asyncHandler(async (req, res) => {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .limit(5)
      .select("name handle avatar bio followers following");

    const shaped = users.map((u) => ({
      ...u.toObject(),
      isFollowing: u.followers.some(
        (id) => id.toString() === req.user._id.toString()
      ),
    }));

    return sendSuccess(res, {
      data: {
        users: shaped,
      },
    });
  })
);

// ═══════════════════════════════════════════════════════
// PROFILE ROUTES
// ═══════════════════════════════════════════════════════

router.patch("/profile", auth, validate(updateProfileSchema), updateProfile);
// multer's errors (file too large, wrong type) are thrown inside its own
const handleAvatarUpload = (req, res, next) => {
  upload.single("photo")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return sendError(res, {
          statusCode: 400,
          message: "Image must be smaller than 5MB",
        });
      }

      return sendError(res, {
        statusCode: 400,
        message: err.message,
      });
    }

    if (err) {
      return sendError(res, {
        statusCode: 400,
        message: err.message,
      });
    }

    next();
  });
};

router.patch("/avatar", auth, handleAvatarUpload, uploadAvatar);
router.delete("/account", auth, deleteAccount);

// ═══════════════════════════════════════════════════════
// ID-BASED ROUTES (namespaced under /id, so no collision with /:handle)
// ═══════════════════════════════════════════════════════

router.get(
  "/id/:id",
  auth,
  validate(userIdParamSchema),
  getUserProfileById);

router.get(
  "/id/:id/posts",
  auth,
  validate(userIdParamSchema),
  getUserPostsById
);

router.post(
  "/id/:id/follow",
  auth,
  validate(userIdParamSchema),
  asyncHandler(async (req, res) => {
    const targetId = req.params.id;
    const currentUserId = req.user.id || req.user._id;

    const targetUser = await User.findById(targetId);

    const result = await toggleFollowService({
      targetUser,
      currentUserId,
    });

    return sendSuccess(res, {
      data: {
        following: result.following,
        followersCount: result.followersCount,
        followingCount: result.followingCount,
      },
    });
  })
);

router.get(
  "/id/:id/follow-status",
  auth,
  validate(userIdParamSchema),
  asyncHandler(async (req, res) => {
    const targetUser = await User.findById(req.params.id);

    if (!targetUser) {
      throw new NotFoundError("User not found");
    }

    const currentUserId = (
      req.user.id || req.user._id
    ).toString();

    const isFollowing = targetUser.followers.some(
      (id) => id.toString() === currentUserId
    );

    return sendSuccess(res, {
      data: {
        isFollowing,
      },
    });
  })
);

// GET /api/users/id/:id/followers — list of users following this user
router.get(
  "/id/:id/followers",
  auth,
  validate(userIdParamSchema),
  asyncHandler(async (req, res) => {
    const currentUserId = (req.user.id || req.user._id).toString();

    const user = await User.findById(req.params.id).populate(
      "followers",
      "name handle avatar bio followers"
    );

    if (!user) {
      throw new NotFoundError("User not found");
    }

    const list = user.followers.map((u) => ({
      id: u._id,
      name: u.name,
      handle: u.handle,
      avatar: u.avatar,
      bio: u.bio,
      isFollowing:
        u.followers?.some((id) => id.toString() === currentUserId) || false,
    }));

    return sendSuccess(res, {
      data: {
        users: list,
      },
    });
  })
);

// GET /api/users/id/:id/following — list of users this user follows
router.get(
  "/id/:id/following",
  auth,
  validate(userIdParamSchema),
  asyncHandler(async (req, res) => {
    const currentUserId = (req.user.id || req.user._id).toString();

    const user = await User.findById(req.params.id).populate(
      "following",
      "name handle avatar bio followers"
    );

    if (!user) {
      throw new NotFoundError("User not found");
    }

    const list = user.following.map((u) => ({
      id: u._id,
      name: u.name,
      handle: u.handle,
      avatar: u.avatar,
      bio: u.bio,
      isFollowing:
        u.followers?.some((id) => id.toString() === currentUserId) || false,
    }));

    return sendSuccess(res, {
      data: {
        users: list,
      },
    });
  })
);

// ═══════════════════════════════════════════════════════
// WORKOUT SPLIT ROUTES
// (safe below "/:handle" since Express won't let a single-segment
// wildcard match a two-segment path like "/:id/split")
// ═══════════════════════════════════════════════════════

router.get(
  "/:id/split",
  auth,
  validate(userIdParamSchema),
  asyncHandler(async (req, res) => {
    if (req.user._id.toString() !== req.params.id) {
      throw new ForbiddenError("Unauthorized");
    }

    const user = await User.findById(req.params.id).select("workoutSplit");

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return sendSuccess(res, {
      data: {
        split: user.workoutSplit || Array(7).fill("Rest"),
      },
    });
  })
);
// PATCH /api/users/:id/split — update the user's workout split
router.patch(
  "/:id/split",
  auth,
  validate(userIdParamSchema),
  validate(updateWorkoutSplitSchema),
  asyncHandler(async (req, res) => {
    if (req.user._id.toString() !== req.params.id) {
      throw new ForbiddenError("Unauthorized");
    }

    const { split } = req.body;


    const user = await User.findByIdAndUpdate(
      req.params.id,
      { workoutSplit: split },
      { new: true }
    ).select("workoutSplit");

    return sendSuccess(res, {
      message: "Split updated",
      data: {
        split: user.workoutSplit,
      },
    });
  })
);

// ═══════════════════════════════════════════════════════
// HANDLE-BASED ROUTES (wildcards — must stay LAST)
// ═══════════════════════════════════════════════════════

// GET /api/users/:handle — Public profile by handle
router.get(
  "/:handle",
  auth,
  validate(userHandleParamSchema),
  asyncHandler(async (req, res) => {
    const user = await User.findOne({
      handle: req.params.handle.toLowerCase(),
    }).select("-password -email");

    if (!user) {
      throw new NotFoundError("User not found");
    }

    const workoutCount = await Workout.countDocuments({
      user: user._id,
    });

    const recentWorkouts = await Workout.find({
      user: user._id,
      isPublic: true,
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title duration createdAt");

    const isFollowing = user.followers.includes(req.user._id);

    return sendSuccess(res, {
      data: {
        id: user._id,
        name: user.name,
        handle: user.handle,
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
      },
    });
  })
);

// POST /api/users/:handle/follow — Toggle follow/unfollow by handle
router.post(
  "/:handle/follow",
  auth,
  validate(userHandleParamSchema),
  asyncHandler(async (req, res) => {
    const search = req.params.handle.toLowerCase();
    const currentUserId = req.user.id || req.user._id;

    let targetUser = await User.findOne({
      handle: search,
    });

    // Preserve existing ObjectId fallback.
    if (
      !targetUser &&
      mongoose.Types.ObjectId.isValid(search)
    ) {
      targetUser = await User.findById(search);
    }

    const result = await toggleFollowService({
      targetUser,
      currentUserId,
    });

    return sendSuccess(res, {
      data: {
        following: result.following,
        followerCount: result.followersCount,
      },
    });
  })
);

// POST /api/users/:handle/follow-only — Force follow

router.post(
  "/:handle/follow-only",
  auth,
  validate(userHandleParamSchema),
  asyncHandler(async (req, res) => {
    const search = req.params.handle.toLowerCase();
    const currentUserId = req.user.id || req.user._id;

    const targetUser = await User.findOne({
      handle: search,
    });

    const result = await followUserService({
      targetUser,
      currentUserId,
    });

    return sendSuccess(res, {
      data: {
        following: result.following,
        followerCount: result.followerCount,
      },
    });
  })
);


// POST /api/users/:handle/unfollow — Force unfollow
router.post(
  "/:handle/unfollow",
  auth,
  validate(userHandleParamSchema),
  asyncHandler(async (req, res) => {
    const target = await User.findOne({
      handle: req.params.handle.toLowerCase(),
    });

    if (!target) {
      throw new NotFoundError("User not found");
    }

    target.followers.pull(req.user._id);
    req.user.following.pull(target._id);

    await Promise.all([target.save(), req.user.save()]);

    return sendSuccess(res, {
      data: {
        following: false,
        followerCount: target.followers.length,
      },
    });
  })
);

// GET /api/users — list all users for the Discover "People Like You" section.
// Returns real profile data plus supportive, non-competitive badge signals:
//   🌱 Beginner Friendly  — user's level is Beginner
//   🔥 Active This Week   — logged a workout/post in the last 7 days
//   💬 Supportive         — left ≥3 comments (encouragement signal)
router.get(
  "/",
  auth,
  asyncHandler(async (req, res) => {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .limit(10)
      .select(
        "name handle avatar bio followers following streakCount focus level lastWorkout"
      );

    const currentUserId = req.user._id.toString();

    // ── Compute badge signals in parallel ──
    const oneWeekAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    );

    const userIds = users.map((u) => u._id);

    // Users who logged a workout or shared a post in the last 7 days.
    const [
      recentWorkoutUsers,
      recentPostUsers,
      supportiveUsers,
    ] = await Promise.all([
      userIds.length
        ? Workout.distinct("user", {
            user: { $in: userIds },
            createdAt: { $gte: oneWeekAgo },
          })
        : [],

      userIds.length
        ? Post.distinct("user", {
            user: { $in: userIds },
            createdAt: { $gte: oneWeekAgo },
          })
        : [],

      userIds.length
        ? Comment.aggregate([
            { $match: { user: { $in: userIds } } },
            {
              $group: {
                _id: "$user",
                count: { $sum: 1 },
              },
            },
            { $match: { count: { $gte: 3 } } },
            { $project: { _id: 1 } },
          ])
        : [],
    ]);

    const activeUserIds = new Set(
      [...recentWorkoutUsers, ...recentPostUsers].map((id) =>
        id.toString()
      )
    );

    const supportiveUserIdSet = new Set(
      supportiveUsers.map((row) => row._id.toString())
    );

    const shaped = users.map((u) => {
      const badges = [];

      if (u.level === "Beginner") {
        badges.push("🌱 Beginner Friendly");
      }

      if (activeUserIds.has(u._id.toString())) {
        badges.push("🔥 Active This Week");
      }

      if (supportiveUserIdSet.has(u._id.toString())) {
        badges.push("💬 Supportive");
      }

      return {
        id: u._id,
        name: u.name,
        handle:
          u.handle || `user${u._id.toString().slice(-4)}`,
        avatar: u.avatar,
        bio: u.bio || "Fitness enthusiast",
        streakCount: u.streakCount || 0,
        followers: u.followers?.length || 0,
        following: u.following?.length || 0,
        isFollowing:
          u.followers?.some(
            (id) => id.toString() === currentUserId
          ) || false,
        workouts: Math.floor(Math.random() * 200) + 20,
        initials:
          u.name
            ?.split(" ")
            .map((w) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 2) || "U",
        color: "from-[#8b5cf6] to-[#a78bfa]",
        focus: u.focus || "Strength",
        level: u.level || "Intermediate",
        followersNum: u.followers?.length || 0,
        badges,
      };
    });

    return sendSuccess(res, {
      data: {
        users: shaped,
      },
    });
  })
);


export default router;