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

    // ── NEW: threaded replies ──
    // null/undefined = top-level comment. Set = this is a reply to another
    // comment. Kept to ONE level deep on purpose (a reply-to-a-reply gets
    // reattached to the original top-level comment in the controller) so
    // the UI never has to render infinite nesting.
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
      index: true,
    },

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

commentSchema.index({ post: 1, createdAt: -1 });
commentSchema.index({ user: 1, createdAt: -1 });
commentSchema.index({ parentComment: 1, createdAt: 1 });

commentSchema.virtual('reactionSummary').get(function () {
  const summary = {};
  (this.reactions || []).forEach(({ emoji }) => {
    summary[emoji] = (summary[emoji] || 0) + 1;
  });
  return summary;
});

commentSchema.methods.getUserReaction = function (userId) {
  if (!userId) return null;
  const match = this.reactions.find(
    (r) => r.user.toString() === userId.toString()
  );
  return match ? match.emoji : null;
};

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;