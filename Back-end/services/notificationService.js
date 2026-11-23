
import mongoose from "mongoose";
import Notification from "../models/Notification.js";
import {
  BadRequestError,
  NotFoundError,
} from "../errors/ApiError.js";

// ─────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────

const NOTIFICATION_TYPES = [
  "respect",
  "comment",
  "mention",
  "follow",
  "streak",
  "welcome",
];

const SYSTEM_NOTIFICATION_TYPES = ["streak", "welcome"];

const DEFAULT_NOTIFICATION_LIMIT = 50;
const MAX_NOTIFICATION_LIMIT = 100;

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────

const validateObjectId = (id, fieldName = "id") => {
  if (!mongoose.isValidObjectId(id)) {
    throw new BadRequestError(`Invalid ${fieldName}`);
  }
};

const normalizeLimit = (limit) => {
  const parsedLimit = Number(limit);

  if (!Number.isInteger(parsedLimit) || parsedLimit < 1) {
    return DEFAULT_NOTIFICATION_LIMIT;
  }

  return Math.min(parsedLimit, MAX_NOTIFICATION_LIMIT);
};

// ─────────────────────────────────────────
// CREATE NOTIFICATION
// ─────────────────────────────────────────

export const createNotificationService = async ({
  recipient,
  sender = null,
  type,
  emoji = null,
  title = null,
  subtitle = null,
  workout = null,
  comment = null,
  commentId = null,
  followBackUserId = null,
}) => {
  validateObjectId(recipient, "recipient ID");

  if (sender !== null && sender !== undefined) {
    validateObjectId(sender, "sender ID");

    // Never create a notification for a user's own action.
    if (String(recipient) === String(sender)) {
      return null;
    }
  }

  if (!NOTIFICATION_TYPES.includes(type)) {
    throw new BadRequestError("Invalid notification type");
  }

  // System notifications do not require a sender.
  // User-action notifications should identify their sender.
  if (
    !SYSTEM_NOTIFICATION_TYPES.includes(type) &&
    (sender === null || sender === undefined)
  ) {
    throw new BadRequestError(
      "Sender is required for this notification type"
    );
  }

  if (workout !== null && workout !== undefined) {
    validateObjectId(workout, "post ID");
  }

  if (commentId !== null && commentId !== undefined) {
    validateObjectId(commentId, "comment ID");
  }

  if (
    followBackUserId !== null &&
    followBackUserId !== undefined
  ) {
    validateObjectId(followBackUserId, "follow-back user ID");
  }

  return Notification.create({
    recipient,
    sender: sender ?? null,
    type,
    emoji,
    title,
    subtitle,
    workout,
    comment,
    commentId,
    followBackUserId,
  });
};

// ─────────────────────────────────────────
// GET NOTIFICATIONS
// ─────────────────────────────────────────

export const getNotificationsService = async ({
  recipient,
  limit = DEFAULT_NOTIFICATION_LIMIT,
}) => {
  validateObjectId(recipient, "recipient ID");

  const notifications = await Notification.find({ recipient })
    .sort({ createdAt: -1 })
    .limit(normalizeLimit(limit))
    .populate("sender", "name handle avatar followers")
    .populate("workout", "workout.title content");

  return notifications;
};

// ─────────────────────────────────────────
// GET UNREAD COUNT
// ─────────────────────────────────────────

export const getUnreadNotificationCountService = async ({
  recipient,
}) => {
  validateObjectId(recipient, "recipient ID");

  return Notification.countDocuments({
    recipient,
    read: false,
  });
};

// ─────────────────────────────────────────
// MARK ONE NOTIFICATION AS READ
// ─────────────────────────────────────────

export const markNotificationAsReadService = async ({
  notificationId,
  recipient,
}) => {
  validateObjectId(notificationId, "notification ID");
  validateObjectId(recipient, "recipient ID");

  const notification = await Notification.findOneAndUpdate(
    {
      _id: notificationId,
      recipient,
    },
    {
      $set: { read: true },
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!notification) {
    throw new NotFoundError("Notification not found");
  }

  return notification;
};

// ─────────────────────────────────────────
// MARK ALL NOTIFICATIONS AS READ
// ─────────────────────────────────────────

export const markAllNotificationsAsReadService = async ({
  recipient,
}) => {
  validateObjectId(recipient, "recipient ID");

  const result = await Notification.updateMany(
    {
      recipient,
      read: false,
    },
    {
      $set: { read: true },
    }
  );

  return {
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount,
  };
};

// ─────────────────────────────────────────
// DELETE NOTIFICATION
// ─────────────────────────────────────────

export const deleteNotificationService = async ({
  notificationId,
  recipient,
}) => {
  validateObjectId(notificationId, "notification ID");
  validateObjectId(recipient, "recipient ID");

  const notification = await Notification.findOneAndDelete({
    _id: notificationId,
    recipient,
  });

  if (!notification) {
    throw new NotFoundError("Notification not found");
  }

  return notification;
};