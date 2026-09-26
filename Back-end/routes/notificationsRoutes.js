import express from "express";
import auth from "../middleware/authMiddleware.js";
import Notification from "../models/Notification.js";

import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";

import { NotFoundError } from "../errors/ApiError.js";

const router = express.Router();

// ── GET /api/notifications/unread-count
router.get(
  "/unread-count",
  auth,
  asyncHandler(async (req, res) => {
    const countForUser = await Notification.countDocuments({
      recipient: req.user._id,
      read: false,
    });

    return sendSuccess(res, {
      data: { count: countForUser },
    });
  })
);

// ── GET /api/notifications
// Returns the logged-in user's notifications, newest first.
router.get(
  "/",
  auth,
  asyncHandler(async (req, res) => {
    const notifications = await Notification.find({
      recipient: req.user._id,
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("sender", "name handle avatar followers")
      .populate("workout", "workout.title content");
    const currentUserId = req.user._id.toString();

    const shaped = notifications.map((n) => {
      const base = {
        id: n._id,
        type: n.type,
        time: timeAgo(n.createdAt),
        read: n.read,
      };

      if (n.type === "streak" || n.type === "welcome") {
        return {
          ...base,
          emoji: n.emoji,
          title: n.title,
          subtitle: n.subtitle,
        };
      }

      const isFollowing =
        n.sender?.followers?.some(
          (id) => id.toString() === currentUserId
        ) ?? false;

      return {
        ...base,
        user: {
          id: n.sender._id,
          name: n.sender.name,
          handle: n.sender.handle ? `@${n.sender.handle}` : null,
          initials: initials(n.sender.name),
          avatar: n.sender.avatar,
          isFollowing,
        },
        content: actionText(n.type),
        target: n.workout?.workout?.title ?? null,
        // workoutId: n.workout?._id ?? null,
        postId: n.workout?._id ?? null,
        comment: n.comment ?? null,
      };
    });

    return sendSuccess(res, {
      data: shaped,
    });
  })
);

// ── PATCH /api/notifications/:id/read
router.patch(
  "/:id/read",
  auth,
  asyncHandler(async (req, res) => {
    const notif = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        recipient: req.user._id,
      },
      { read: true },
      { new: true }
    );

    if (!notif) {
      throw new NotFoundError("Notification not found");
    }

    return sendSuccess(res);
  })
);

// ── PATCH /api/notifications/read-all
router.patch(
  "/read-all",
  auth,
  asyncHandler(async (req, res) => {
    await Notification.updateMany(
      {
        recipient: req.user._id,
        read: false,
      },
      { read: true }
    );

    return sendSuccess(res);
  })
);

// ── DELETE /api/notifications/:id
router.delete(
  "/:id",
  auth,
  asyncHandler(async (req, res) => {
    await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id,
    });

    return sendSuccess(res);
  })
);

// ── Helpers ──────────────────────────────────────────────

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);

  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;

  return `${Math.floor(diff / 86400)}d`;
}

function initials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function actionText(type) {
  switch (type) {
    case "respect":
      return "gave you respect on";
    case "comment":
      return "commented on your workout";
    case "mention":
      return "mentioned you in a comment";
    case "follow":
      return "started following you";
    default:
      return "";
  }
}

export default router;