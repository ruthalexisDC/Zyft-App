// models/Notification.js
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // null for system notifications (streak, welcome)
    },
    type: {
      type: String,
      enum: ["respect", "comment", "mention", "follow", "streak", "welcome"],
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    // For system notifications (streak, welcome)
    emoji: String,
    title: String,
    subtitle: String,
    // For user-generated notifications
    // NOTE: this references the Post document (posts carry an embedded
    // `workout` subdocument, not a separate Workout collection — there is
    // no standalone Workout document to point at here).
    workout: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },
    comment: {
      type: String,
      default: null,
    },
    // For follow notifications - store the follower's ID for "Follow back"
    followBackUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

// Index for fast queries
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);