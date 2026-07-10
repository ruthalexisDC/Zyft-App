// import mongoose from 'mongoose';

// const commentSchema = new mongoose.Schema(
//   {
//     post: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'Post',
//       required: true,
//       index: true,
//     },
//     user: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'User',
//       required: true,
//     },
//     content: {
//       type: String,
//       required: [true, 'Comment content is required'],
//       maxlength: [500, 'Comment cannot exceed 500 characters'],
//     },
//   },
//   {
//     timestamps: true,
//     toJSON: { virtuals: true },
//     toObject: { virtuals: true },
//   }
// );

// // Indexes for fast lookups
// commentSchema.index({ post: 1, createdAt: -1 });
// commentSchema.index({ user: 1, createdAt: -1 });

// const Comment = mongoose.model('Comment', commentSchema);

// export default Comment;

import mongoose from 'mongoose';

export const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮'];

const commentSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      maxlength: [500, 'Comment cannot exceed 500 characters'],
    },

    // ── NEW: reactions ──
    // One entry per user who has reacted. A user can only have ONE active
    // reaction at a time: picking a different emoji replaces their old one,
    // picking the same emoji again removes it. See reactToComment in
    // postController.js for the toggle/switch logic.
    reactions: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        emoji: {
          type: String,
          enum: REACTION_EMOJIS,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for fast lookups
commentSchema.index({ post: 1, createdAt: -1 });
commentSchema.index({ user: 1, createdAt: -1 });

// Virtual: { "👍": 2, "❤️": 1 } — counts per emoji actually present.
// Emojis with zero reactions simply don't appear as a key.
commentSchema.virtual('reactionSummary').get(function () {
  const summary = {};
  (this.reactions || []).forEach(({ emoji }) => {
    summary[emoji] = (summary[emoji] || 0) + 1;
  });
  return summary;
});

// Instance method: which emoji (if any) did this specific user react with?
commentSchema.methods.getUserReaction = function (userId) {
  if (!userId) return null;
  const match = this.reactions.find(
    (r) => r.user.toString() === userId.toString()
  );
  return match ? match.emoji : null;
};

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;