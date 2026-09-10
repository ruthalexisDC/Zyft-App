// // models/Notification.js
// import mongoose from "mongoose";

// const notificationSchema = new mongoose.Schema(
//   {
//     recipient: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//       index: true,
//     },
//     sender: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       default: null, // null for system notifications (streak, welcome)
//     },
//     type: {
//       type: String,
//       enum: ["respect", "comment", "mention", "follow", "streak", "welcome"],
//       required: true,
//     },
//     read: {
//       type: Boolean,
//       default: false,
//     },
//     // For system notifications (streak, welcome)
//     emoji: String,
//     title: String,
//     subtitle: String,
//     // For user-generated notifications
//     // NOTE: this references the Post document (posts carry an embedded
//     // `workout` subdocument, not a separate Workout collection — there is
//     // no standalone Workout document to point at here).
//     workout: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Post",
//       default: null,
//     },
//     comment: {
//       type: String,
//       default: null,
//     },

//   commentId: {
//   type: mongoose.Schema.Types.ObjectId,
//   ref: "Comment",
//   default: null,
// },
//     // For follow notifications - store the follower's ID for "Follow back"
//     followBackUserId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       default: null,
//     },
//   },
//   { timestamps: true }
// );

// // Index for fast queries
// notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

// export default mongoose.model("Notification", notificationSchema);

// models/Notification.js
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    // User receiving the notification
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // User who caused the notification
    // null for system notifications
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    type: {
      type: String,
      enum: [
        "respect",
        "comment",
        "mention",
        "follow",
        "streak",
        "welcome",
      ],
      required: true,
    },

    read: {
      type: Boolean,
      default: false,
    },

    // ─────────────────────────────────────────
    // SYSTEM NOTIFICATIONS
    // ─────────────────────────────────────────

    emoji: {
      type: String,
      default: null,
    },

    title: {
      type: String,
      default: null,
    },

    subtitle: {
      type: String,
      default: null,
    },

    // ─────────────────────────────────────────
    // POST-RELATED NOTIFICATIONS
    // ─────────────────────────────────────────

    // References the Post that triggered the notification.
    // For example:
    // - respect
    // - comment
    // - mention
    workout: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },

    // Comment text snapshot
    comment: {
      type: String,
      default: null,
    },

    // ID of the comment that triggered the notification
    commentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },

    // ─────────────────────────────────────────
    // FOLLOW NOTIFICATIONS
    // ─────────────────────────────────────────

    // The user who followed the recipient.
    // Used for "Follow back".
    followBackUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Fast notification list queries
notificationSchema.index({
  recipient: 1,
  read: 1,
  createdAt: -1,
});

export default mongoose.model(
  "Notification",
  notificationSchema
);