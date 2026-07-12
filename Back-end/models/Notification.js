// // routes/notifications.js
// import express from "express";
// import auth from "../middleware/authMiddleware.js";
// import Notification from "../models/Notification.js";

// const router = express.Router();

// // ── GET /api/notifications
// // Returns the logged-in user's notifications, newest first.
// router.get("/", auth, async (req, res) => {
//   try {
//     const notifications = await Notification.find({ recipient: req.user._id })
//       .sort({ createdAt: -1 })
//       .limit(50)
//       .populate("sender", "name handle avatar")
//       .populate("workout", "title");

//     // Shape into the format Activity.jsx expects
//     const shaped = notifications.map((n) => {
//       const base = {
//         id:    n._id,
//         type:  n.type,
//         time:  timeAgo(n.createdAt),
//         read:  n.read,
//       };

//       if (n.type === "streak" || n.type === "welcome") {
//         return { ...base, emoji: n.emoji, title: n.title, subtitle: n.subtitle };
//       }

//       return {
//         ...base,
//         user: {
//           id:       n.sender._id,
//           name:     n.sender.name,
//           handle:   `@${n.sender.handle}`,
//           initials: initials(n.sender.name),
//           avatar:   n.sender.avatar,
//         },
//         content:    actionText(n.type),
//         target:     n.workout?.title ?? null,
//         workoutId:  n.workout?._id ?? null,
//         commentId:  n.comment ?? null,
//       };
//     });

//     res.json(shaped);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// // ── PATCH /api/notifications/:id/read
// router.patch("/:id/read", auth, async (req, res) => {
//   try {
//     const notif = await Notification.findOneAndUpdate(
//       { _id: req.params.id, recipient: req.user._id },
//       { read: true },
//       { new: true }
//     );
//     if (!notif) return res.status(404).json({ message: "Not found" });
//     res.json({ success: true });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// // ── PATCH /api/notifications/read-all
// router.patch("/read-all", auth, async (req, res) => {
//   try {
//     await Notification.updateMany(
//       { recipient: req.user._id, read: false },
//       { read: true }
//     );
//     res.json({ success: true });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// // ── DELETE /api/notifications/:id
// router.delete("/:id", auth, async (req, res) => {
//   try {
//     await Notification.findOneAndDelete({
//       _id: req.params.id,
//       recipient: req.user._id,
//     });
//     res.json({ success: true });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// // ── Helpers ──────────────────────────────────────────────────────────────────

// function timeAgo(date) {
//   const diff = Math.floor((Date.now() - new Date(date)) / 1000);
//   if (diff < 60)   return `${diff}s`;
//   if (diff < 3600) return `${Math.floor(diff / 60)}m`;
//   if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
//   return `${Math.floor(diff / 86400)}d`;
// }

// function initials(name) {
//   return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
// }

// function actionText(type) {
//   switch (type) {
//     case "respect": return "gave you respect on";
//     case "comment": return "commented on your workout";
//     case "mention": return "mentioned you in a comment";
//     case "follow":  return "started following you";
//     default:        return "";
//   }
// }

// export default router;

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