
// routes/notificationRoutes.js

import express from "express";
import auth from "../middleware/authMiddleware.js";

import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";

import {
  getNotificationsService,
  getUnreadNotificationCountService,
  markNotificationAsReadService,
  markAllNotificationsAsReadService,
  deleteNotificationService,
} from "../services/notificationService.js";

const router = express.Router();

// ─────────────────────────────────────────
// GET UNREAD NOTIFICATION COUNT
// GET /api/notifications/unread-count
// ─────────────────────────────────────────

router.get(
  "/unread-count",
  auth,
  asyncHandler(async (req, res) => {
    const count = await getUnreadNotificationCountService({
      recipient: req.user._id,
    });

    return sendSuccess(res, {
      data: { count },
    });
  })
);

// ─────────────────────────────────────────
// GET NOTIFICATIONS
// GET /api/notifications
// ─────────────────────────────────────────

router.get(
  "/",
  auth,
  asyncHandler(async (req, res) => {
    const notifications = await getNotificationsService({
      recipient: req.user._id,
      limit: req.query.limit,
    });

    const currentUserId = String(req.user._id);

    const shaped = notifications.map((n) => {
      const base = {
        id: String(n._id),
        type: n.type,
        time: timeAgo(n.createdAt),
        read: n.read,
      };

      // System notifications do not require a sender.
      if (n.type === "streak" || n.type === "welcome") {
        return {
          ...base,
          emoji: n.emoji,
          title: n.title,
          subtitle: n.subtitle,
        };
      }

      // A populated reference can be null if the sender
      // has been deleted.
      const sender = n.sender ?? null;
      const post = n.workout ?? null;

      const isFollowing =
        sender?.followers?.some(
          (id) => String(id) === currentUserId
        ) ?? false;

      return {
        ...base,

        user: sender
          ? {
              id: String(sender._id),
              name: sender.name ?? "Former user",
              handle: sender.handle
                ? `@${sender.handle}`
                : null,
              initials: initials(sender.name),
              avatar: sender.avatar ?? null,
              isFollowing,
            }
          : {
              id: null,
              name: "Former user",
              handle: null,
              initials: "?",
              avatar: null,
              isFollowing: false,
            },

        content: actionText(n.type),
        target: post
  ? post.workout?.title || post.content || null
  : null,
        postId: post?._id ? String(post._id) : null,
        comment: n.comment ?? null,
        commentId: n.commentId
          ? String(n.commentId)
          : null,
      };
    });

    return sendSuccess(res, {
      data: shaped,
    });
  })
);

// ─────────────────────────────────────────
// MARK ONE NOTIFICATION AS READ
// PATCH /api/notifications/:id/read
// ─────────────────────────────────────────

router.patch(
  "/:id/read",
  auth,
  asyncHandler(async (req, res) => {
    await markNotificationAsReadService({
      notificationId: req.params.id,
      recipient: req.user._id,
    });

    return sendSuccess(res);
  })
);

// ─────────────────────────────────────────
// MARK ALL NOTIFICATIONS AS READ
// PATCH /api/notifications/read-all
// ─────────────────────────────────────────

router.patch(
  "/read-all",
  auth,
  asyncHandler(async (req, res) => {
    const result = await markAllNotificationsAsReadService({
      recipient: req.user._id,
    });

    return sendSuccess(res, {
      data: result,
    });
  })
);

// ─────────────────────────────────────────
// DELETE NOTIFICATION
// DELETE /api/notifications/:id
// ─────────────────────────────────────────

router.delete(
  "/:id",
  auth,
  asyncHandler(async (req, res) => {
    await deleteNotificationService({
      notificationId: req.params.id,
      recipient: req.user._id,
    });

    return sendSuccess(res);
  })
);

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────

function timeAgo(date) {
  const diff = Math.max(
    0,
    Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  );

  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;

  return `${Math.floor(diff / 86400)}d`;
}

function initials(name) {
  if (!name?.trim()) return "?";

  return name
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
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