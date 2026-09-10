import mongoose from "mongoose";
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
  UnauthorizedError,
} from '../errors/ApiError.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
import Comment, { REACTION_EMOJIS } from '../models/Comments.js';
import Report from '../models/Report.js';
import Notification from '../models/Notification.js';

const canViewPost = async (post, viewerId) => {
  if (!post || !viewerId) {
    return false;
  }

  // Supports both:
  // post.user = ObjectId
  // post.user = populated User object
  const postOwnerId = post.user?._id
    ? post.user._id.toString()
    : post.user?.toString();

  const viewerIdString = viewerId.toString();

  if (!postOwnerId) {
    return false;
  }

  // Owner can always see their own post
  if (postOwnerId === viewerIdString) {
    return true;
  }

  // Public posts → everyone
  if (post.visibility === "public") {
    return true;
  }

  // Private posts → owner only
  if (post.visibility === "private") {
    return false;
  }

  // Followers-only → viewer must follow ORIGINAL author
  if (post.visibility === "followers") {
    const postOwner = await User.findById(postOwnerId)
      .select("followers");

    if (!postOwner) {
      return false;
    }

    return postOwner.followers.some(
      (followerId) =>
        followerId.toString() === viewerIdString
    );
  }

  return false;

};

const canViewPostWithOriginal = async (post, viewerId) => {
  if (!post) {
    return false;
  }

  // First check the repost itself
  const canViewRequestedPost = await canViewPost(
    post,
    viewerId
  );

  if (!canViewRequestedPost) {
    return false;
  }

  // Normal post
  if (!post.isRepost) {
    return true;
  }

  // A repost must have an original
  if (!post.originalPost) {
    return false;
  }

  // IMPORTANT:
  // The viewer must also be allowed to see
  // the ORIGINAL post.
  return canViewPost(
    post.originalPost,
    viewerId
  );
};
// ─────────────────────────────────────────
// CREATE POST
// ─────────────────────────────────────────
export const createPost = asyncHandler(async (req, res) => {
  const { content, workout, media } = req.body;

  const userId = req.user?._id;

  if (!userId) {
    throw new UnauthorizedError(
      "User authentication required"
    );
  }

  if (!content || content.trim().length === 0) {
    throw new BadRequestError(
      "Post content is required",
      [
        {
          field: "content",
          message: "Post content is required",
        },
      ]
    );
  }

  const post = await Post.create({
    user: userId,
    content: content.trim(),
    workout: workout || undefined,
    media: media || [],
  });

  await post.populate(
    "user",
    "name handle avatar"
  );

  return sendSuccess(res, {
    statusCode: 201,
    data: post,
  });
});

// ─────────────────────────────────────────
// GET FEED
// ─────────────────────────────────────────
export const getFeed = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const {
    page = 1,
    limit = 10,
    type = "community",
  } = req.query;

  const pageNumber = Math.max(parseInt(page) || 1, 1);
  const limitNumber = Math.min(
    Math.max(parseInt(limit) || 10, 1),
    50
  );

  // ─────────────────────────────────────────────
  // GET CURRENT USER
  // ─────────────────────────────────────────────

  const currentUser = await User.findById(userId).select(
    "following show_active_status"
  );

  const followingIds = (currentUser?.following ?? []).map(
    (id) => id.toString()
  );

  const viewerShowsActiveStatus =
    currentUser?.show_active_status !== false;

  // ─────────────────────────────────────────────
  // BUILD BASE QUERY
  // ─────────────────────────────────────────────

  let query = {};

  if (type === "following") {
    query = {
      $or: [
        // User can always see their own posts
        {
          user: userId,
        },

        // Posts from people they follow
        {
          user: { $in: followingIds },
          visibility: {
            $in: ["public", "followers"],
          },
        },
      ],
    };
  } else {
    // Community feed = public posts
    query = {
      visibility: "public",
    };
  }

  // ─────────────────────────────────────────────
  // FETCH POSTS IN BATCHES
  // ─────────────────────────────────────────────

  const batchSize = limitNumber * 2;

  let databaseSkip = 0;
  let visiblePosts = [];

  /*
   * We don't use MongoDB's normal page skip here because
   * some posts may be removed by the repost privacy check.
   *
   * Instead, we walk through the posts and collect only
   * posts the viewer is actually allowed to see.
   */

  const targetVisiblePosts =
    pageNumber * limitNumber;

  while (visiblePosts.length < targetVisiblePosts) {
    const batch = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(databaseSkip)
      .limit(batchSize)
      .populate(
        "user",
        "name handle avatar last_active_at show_active_status isOnline"
      )
      .populate("originalPost")
      .lean();

    // No more posts in database
    if (batch.length === 0) {
      break;
    }

    databaseSkip += batch.length;

    // Remove posts whose author no longer exists
    const validPosts = batch.filter(
      (post) => post.user != null
    );

    // ─────────────────────────────────────────────
    // REPOST PRIVACY FILTER
    // ─────────────────────────────────────────────

    for (const post of validPosts) {
      // Normal post
      if (!post.isRepost) {
        visiblePosts.push(post);
        continue;
      }

      // Invalid repost with no original
      if (!post.originalPost) {
        continue;
      }

      /*
       * IMPORTANT:
       *
       * Check whether the viewer can see the ORIGINAL post.
       *
       * Do NOT simply check whether the viewer follows
       * the person who reposted it.
       */
      const canViewOriginal = await canViewPost(
        post.originalPost,
        userId
      );

      if (!canViewOriginal) {
        continue;
      }

      visiblePosts.push(post);
    }

    // If this batch was smaller than requested,
    // there are no more posts to fetch.
    if (batch.length < batchSize) {
      break;
    }
  }

  // ─────────────────────────────────────────────
  // GET THE REQUESTED PAGE
  // ─────────────────────────────────────────────

  const startIndex =
    (pageNumber - 1) * limitNumber;

  const pagePosts = visiblePosts.slice(
    startIndex,
    startIndex + limitNumber
  );

  // ─────────────────────────────────────────────
  // ADD RESPONSE DATA
  // ─────────────────────────────────────────────

  const postsWithData = await Promise.all(
    pagePosts.map(async (post) => {
      const commentCount =
        await Comment.countDocuments({
          post: post._id,
        });

      const isOwnPost =
        post.user?._id?.toString() ===
        userId.toString();

      // Active status reciprocity
      const authorShowsActiveStatus =
        post.user?.show_active_status !== false;

      const showActiveStatus =
        authorShowsActiveStatus &&
        viewerShowsActiveStatus;

      return {
        ...post,

        respectCount:
          post.respects?.length || 0,

        commentCount,

        didRespect:
          post.respects?.some(
            (r) =>
              r.toString() ===
              userId.toString()
          ) || false,

        user: post.user
          ? {
              ...post.user,

              isFollowing: isOwnPost
                ? false
                : followingIds.includes(
                    post.user._id.toString()
                  ),

              last_active_at:
                showActiveStatus
                  ? post.user.last_active_at
                  : null,

              isOnline:
                showActiveStatus
                  ? post.user.isOnline
                  : false,
            }
          : post.user,
      };
    })
  );

  // ─────────────────────────────────────────────
  // PAGINATION
  // ─────────────────────────────────────────────

  const hasMore =
    visiblePosts.length >
    startIndex + limitNumber;

 return sendSuccess(res, {
  data: postsWithData,

  pagination: {
    page: pageNumber,
    limit: limitNumber,
    hasMore,
  },
});
});

// ─────────────────────────────────────────
// GET SINGLE POST
// ─────────────────────────────────────────
export const getPost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const userId = req.user._id;

  const post = await Post.findById(postId)
    .populate(
      "user",
      "name handle avatar last_active_at show_active_status isOnline"
    )
    .populate("originalPost");

  if (!post) {
    throw new NotFoundError("Post not found");
  }

  // ─────────────────────────────────────────────
  // PRIVACY CHECK
  // ─────────────────────────────────────────────

  const allowed = await canViewPostWithOriginal(
    post,
    userId
  );

  if (!allowed) {
    throw new ForbiddenError(
      "You do not have permission to view this post"
    );
  }

  // ─────────────────────────────────────────────
  // COMMENTS
  // ─────────────────────────────────────────────

  const comments = await Comment.find({
    post: postId,
  })
    .populate(
      "user",
      "name handle avatar"
    )
    .sort({
      createdAt: -1,
    });

  const commentsWithReactions =
    comments.map((comment) => {
      const obj = comment.toObject({
        virtuals: true,
      });

      obj.myReaction =
        comment.getUserReaction(userId);

      return obj;
    });

  // ─────────────────────────────────────────────
  // ACTIVE STATUS
  // ─────────────────────────────────────────────

  const [viewer, author] =
    await Promise.all([
      User.findById(userId).select(
        "show_active_status"
      ),

      User.findById(
        post.user?._id
      ).select(
        "show_active_status"
      ),
    ]);

  const showActiveStatus =
    author?.show_active_status !== false &&
    viewer?.show_active_status !== false;

  const postObj = post.toObject();

  if (postObj.user) {
    postObj.user.last_active_at =
      showActiveStatus
        ? postObj.user.last_active_at
        : null;

    postObj.user.isOnline =
      showActiveStatus
        ? postObj.user.isOnline
        : false;
  }

  return sendSuccess(res, {
    data: {
      ...postObj,

      didRespect:
        post.didUserRespect(userId),

      comments: commentsWithReactions,

      commentCount:
        commentsWithReactions.length,
    },
  });
});

// ─────────────────────────────────────────
// GET USER'S POSTS
// ─────────────────────────────────────────
export const getUserPosts = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const {
    page = 1,
    limit = 10,
  } = req.query;

  const currentUserId = req.user._id;

  const pageNumber = Math.max(
    parseInt(page) || 1,
    1
  );

  const limitNumber = Math.min(
    Math.max(parseInt(limit) || 10, 1),
    50
  );

  const skip =
    (pageNumber - 1) * limitNumber;

  // ─────────────────────────────────────────────
  // DETERMINE PROFILE VISIBILITY
  // ─────────────────────────────────────────────

  const isOwnProfile =
    currentUserId.toString() ===
    userId.toString();

  let visibilityFilter = {
    visibility: "public",
  };

  if (isOwnProfile) {
    visibilityFilter = {};
  } else {
    const profileOwner =
      await User.findById(userId)
        .select("followers");

    const viewerFollowsOwner =
      profileOwner?.followers?.some(
        (id) =>
          id.toString() ===
          currentUserId.toString()
      );

    if (viewerFollowsOwner) {
      visibilityFilter = {
        visibility: {
          $in: [
            "public",
            "followers",
          ],
        },
      };
    }
  }

  const query = {
    user: userId,
    ...visibilityFilter,
  };

  // ─────────────────────────────────────────────
  // ACTIVE STATUS
  // ─────────────────────────────────────────────

  const [viewer, author] =
    await Promise.all([
      User.findById(currentUserId)
        .select("show_active_status"),

      User.findById(userId)
        .select("show_active_status"),
    ]);

  const showActiveStatus =
    author?.show_active_status !== false &&
    viewer?.show_active_status !== false;

  // ─────────────────────────────────────────────
  // FETCH
  // ─────────────────────────────────────────────

  const posts = await Post.find(query)
    .sort({
      createdAt: -1,
      _id: -1,
    })
    .skip(skip)
    .limit(limitNumber)
    .populate(
      "user",
      "name handle avatar last_active_at show_active_status isOnline"
    )
    .populate("workout")
    .populate("originalPost")
    .lean();

  // ─────────────────────────────────────────────
  // REPOST PRIVACY FILTER
  // ─────────────────────────────────────────────

  const visiblePosts = [];

  for (const post of posts) {
    if (!post.user) {
      continue;
    }

    const allowed =
      await canViewPostWithOriginal(
        post,
        currentUserId
      );

    if (!allowed) {
      continue;
    }

    visiblePosts.push(post);
  }

  // ─────────────────────────────────────────────
  // RESPONSE DATA
  // ─────────────────────────────────────────────

  const postsWithData =
    await Promise.all(
      visiblePosts.map(async (post) => {
        const commentCount =
          await Comment.countDocuments({
            post: post._id,
          });

        const userWithActiveStatus =
          post.user
            ? {
                ...post.user,

                last_active_at:
                  showActiveStatus
                    ? post.user.last_active_at
                    : null,

                isOnline:
                  showActiveStatus
                    ? post.user.isOnline
                    : false,
              }
            : null;

        return {
          ...post,

          user:
            userWithActiveStatus,

          respectCount:
            post.respects?.length || 0,

          commentCount,

          didRespect:
            post.respects?.some(
              (r) =>
                r.toString() ===
                currentUserId.toString()
            ) || false,
        };
      })
    );

  const totalPosts =
    await Post.countDocuments(query);

  return sendSuccess(res, {
    data: postsWithData,

    pagination: {
      currentPage: pageNumber,
      totalPages: Math.ceil(
        totalPosts / limitNumber
      ),
      totalPosts,
      hasMore:
        skip + posts.length <
        totalPosts,
    },
  });
});

// ─────────────────────────────────────────
// UPDATE POST
// ─────────────────────────────────────────
export const updatePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.postId);

  if (!post) {
    throw new NotFoundError('Post not found');
  }

  if (post.user.toString() !== req.user._id.toString()) {
    throw new ForbiddenError('Not authorized to update this post');
  }

  // ── SECURITY FIX (2026-07-10) ────────────────────────
  // This used to do `{ $set: req.body }` — i.e. it trusted the ENTIRE
  // request body and wrote it straight into the document. The ownership
  // check above only verifies the CURRENT owner before the update; it does
  // nothing to stop the request body itself from overwriting fields like
  // `user` (hijack post ownership), `respects` (fake likes), `createdAt`,
  // or any other field on the schema. This is a classic mass-assignment
  // vulnerability. Fix: whitelist only the fields a user should be able to
  // edit on their own post.
  // ────────────────────────
  const EDITABLE_FIELDS = ['content', 'media', 'visibility'];
  const updates = {};
  for (const field of EDITABLE_FIELDS) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  const updatedPost = await Post.findByIdAndUpdate(
    req.params.postId,
    { $set: updates },
    { new: true, runValidators: true }
  );

  sendSuccess(res, { data: updatedPost });
});

// ─────────────────────────────────────────
// DELETE POST
// ─────────────────────────────────────────
export const deletePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const userId = req.user._id;

  const post = await Post.findById(postId);

  if (!post) {
    throw new NotFoundError('Post not found');
  }

  if (post.user.toString() !== userId.toString()) {
    throw new ForbiddenError('You can only delete your own posts');
  }

  await Comment.deleteMany({ post: postId });
  await Post.findByIdAndDelete(postId);

  // Not sendSuccess(res, { statusCode: 204 }) — sendSuccess always calls
  // .json(), and a 204 response must have an empty body per the HTTP spec.
  res.status(204).send();
});

// ─────────────────────────────────────────
// GIVE RESPECT (like)
// ─────────────────────────────────────────
export const giveRespect = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const userId = req.user._id;

  const post = await Post.findById(postId);

  if (!post) {
    throw new NotFoundError('Post not found');
  }
   
  const allowed = await canViewPostWithOriginal(
  post,
  userId
);

if (!allowed) {
  throw new ForbiddenError(
    "You do not have permission to interact with this post"
  );
}
  // Defensive: ensure respects is array
  if (!Array.isArray(post.respects)) {
    post.respects = [];
  }

  const alreadyRespected = post.respects.some((r) => r.toString() === userId.toString());

  let newRespects;
  if (alreadyRespected) {
    newRespects = post.respects.filter((r) => r.toString() !== userId.toString());
  } else {
    newRespects = [...post.respects, userId];
  }

  // TRADEOFF: using updateOne deliberately skips full-document validation
  // (the `save()` path would reject a partially-invalid doc). This keeps
  // the write fast and avoids validation errors on existing posts, but it
  // also means any future required-field additions to the Post schema
  // will NOT be enforced on this write path. If Post ever gains new
  // required fields, revisit this to use findByIdAndUpdate + runValidators.
  await Post.updateOne({ _id: postId }, { $set: { respects: newRespects } });

  // Notification logic...
  if (!alreadyRespected && post.user.toString() !== userId.toString()) {
    try {
      await Notification.create({
        recipient: post.user,
        sender: userId,
        type: 'respect',
        workout: post._id,
      });
    } catch (notifErr) {
      console.error('Failed to create respect notification:', notifErr);
    }
  }

  sendSuccess(res, {
    data: { respected: !alreadyRespected, respectCount: newRespects.length },
  });
});

// ─────────────────────────────────────────
// GET RESPECTS (who liked this post)
// ─────────────────────────────────────────
export const getRespects = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const currentUserId = req.user._id.toString();

  const post = await Post.findById(postId).populate(
    'respects',
    'name handle avatar bio followers'
  );

  if (!post) {
    throw new NotFoundError('Post not found');
  }

  const allowed = await canViewPostWithOriginal(
  post,
  currentUserId
);

if (!allowed) {
  throw new ForbiddenError(
    "You do not have permission to view respects for this post"
  );
}

  // ── DEFENSIVE: handle undefined respects ──
  const respects = post.respects || [];

  const users = respects.map((u) => ({
    id: u._id,
    name: u.name,
    handle: `@${u.handle}`,
    avatar: u.avatar,
    bio: u.bio,
    isFollowing: u.followers?.some((id) => id.toString() === currentUserId) || false,
  }));

  sendSuccess(res, { data: users });
});

// ─────────────────────────────────────────
// ADD COMMENT
// ─────────────────────────────────────────
export const addComment = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { content, parentComment } = req.body;
  const userId = req.user._id;

  if (!content || content.trim().length === 0) {
    throw new BadRequestError('Comment content is required', [
      { field: 'content', message: 'Comment content is required' },
    ]);
  }

  const post = await Post.findById(postId);
  if (!post) {
    throw new NotFoundError('Post not found');
  }

  const allowed = await canViewPostWithOriginal(
  post,
  userId
);

if (!allowed) {
  throw new ForbiddenError(
    "You do not have permission to comment on this post"
  );
}

  let parent = null;
  if (parentComment) {
    parent = await Comment.findById(parentComment);
    if (!parent || parent.post.toString() !== postId) {
      throw new BadRequestError('Invalid parent comment');
    }
    // Keep threads one level deep: replying to a reply attaches to that
    // reply's top-level parent instead of nesting further
    if (parent.parentComment) {
      parent = await Comment.findById(parent.parentComment);
    }
  }

  const comment = await Comment.create({
    post: postId,
    user: userId,
    content: content.trim(),
    parentComment: parent ? parent._id : null,
  });

  await comment.populate('user', 'name handle avatar');

  const commentObj = comment.toObject({ virtuals: true });
  commentObj.myReaction = null;
  commentObj.replies = [];

  // Notify whoever should be notified: the parent comment's author for a
  // reply, or the post owner for a top-level comment
  const notifyRecipient = parent ? parent.user : post.user;
  if (notifyRecipient.toString() !== userId.toString()) {
    try {
      await Notification.create({
        recipient: notifyRecipient,
        sender: userId,
        type: 'comment', // reuse existing type; add a 'reply' type to your Notification enum if you want to distinguish them in the UI
        workout: post._id,
        comment: comment.content,
        commentId: comment._id,
      });
    } catch (notifErr) {
      console.error('Failed to create comment notification:', notifErr);
    }
  }

  sendSuccess(res, { statusCode: 201, data: commentObj });
});

// ─────────────────────────────────────────
// GET COMMENTS
// ─────────────────────────────────────────
export const getComments = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const userId = req.user._id;

  const post = await Post.findById(postId);
  if (!post) {
    throw new NotFoundError('Post not found');
  }
    const allowed = await canViewPostWithOriginal(
  post,
  userId
);

if (!allowed) {
  throw new ForbiddenError(
    "You do not have permission to view comments on this post"
  );
}

  const allComments = await Comment.find({ post: postId })
    .populate('user', 'name handle avatar')
    .sort({ createdAt: 1 });

  const comments = buildCommentTree(allComments, userId);

  sendSuccess(res, { data: comments });
});

// ─────────────────────────────────────────
// DELETE COMMENT
// ─────────────────────────────────────────
export const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user._id;

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new NotFoundError('Comment not found');
  }

  if (comment.user.toString() !== userId.toString()) {
    throw new ForbiddenError('You can only delete your own comments');
  }

  // Remove any replies so they don't get orphaned pointing at a deleted parent
  await Comment.deleteMany({ parentComment: commentId });
  await Comment.findByIdAndDelete(commentId);

  res.status(204).send();
});

// ─────────────────────────────────────────
// UPDATE COMMENT
// ─────────────────────────────────────────
export const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;
  const userId = req.user._id;

  if (!content || content.trim().length === 0) {
    throw new BadRequestError('Comment content is required', [
      { field: 'content', message: 'Comment content is required' },
    ]);
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new NotFoundError('Comment not found');
  }

  if (comment.user.toString() !== userId.toString()) {
    throw new ForbiddenError('You can only edit your own comments');
  }

  comment.content = content.trim();
  await comment.save();

  const populatedComment = await comment.populate('user', 'name handle avatar');
  const commentObj = populatedComment.toObject({ virtuals: true });
  commentObj.myReaction = populatedComment.getUserReaction(userId);

  sendSuccess(res, { data: commentObj });
});

// ─────────────────────────────────────────
// REACT TO COMMENT
// ─────────────────────────────────────────
export const reactToComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { emoji } = req.body;
  const userId = req.user._id;

  if (!REACTION_EMOJIS.includes(emoji)) {
    throw new BadRequestError('Invalid reaction emoji');
  }

  const comment = await Comment.findById(commentId);

if (!comment) {
  throw new NotFoundError("Comment not found");
}

const post = await Post.findById(comment.post);

if (!post) {
  throw new NotFoundError("Post not found");
}

const allowed = await canViewPostWithOriginal(
  post,
  userId
);

if (!allowed) {
  throw new ForbiddenError(
    "You do not have permission to react to this comment"
  );
}

  const existingIndex = comment.reactions.findIndex(
    (r) => r.user.toString() === userId.toString()
  );

  let myReaction = emoji;

  if (existingIndex !== -1) {
    const existing = comment.reactions[existingIndex];
    if (existing.emoji === emoji) {
      comment.reactions.splice(existingIndex, 1);
      myReaction = null;
    } else {
      existing.emoji = emoji;
    }
  } else {
    comment.reactions.push({ user: userId, emoji });
  }

  await comment.save();

  sendSuccess(res, { data: { reactionSummary: comment.reactionSummary, myReaction } });
});

// ─────────────────────────────────────────
// REPOST
// ─────────────────────────────────────────
export const repost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const userId = req.user._id;

  // 1. Find the post
  const originalPost = await Post.findById(postId);

  if (!originalPost) {
    throw new NotFoundError("Post not found");
  }

  // 2. Do not allow nested reposts
  if (originalPost.isRepost) {
    throw new BadRequestError(
      "You cannot repost a repost"
    );
  }

  // 3. Private posts cannot be reposted
  if (originalPost.visibility === "private") {
    throw new ForbiddenError(
      "Private posts cannot be reposted"
    );
  }

  // 4. User must be able to see the original
  const canViewOriginal = await canViewPost(
    originalPost,
    userId
  );

  if (!canViewOriginal) {
    throw new ForbiddenError(
      "You do not have permission to repost this post"
    );
  }

  // 5. Check whether user already reposted it
  const alreadyReposted = await Post.findOne({
    user: userId,
    originalPost: originalPost._id,
    isRepost: true,
  });

  // 6. If already reposted → remove repost
  if (alreadyReposted) {
    await Post.findByIdAndDelete(
      alreadyReposted._id
    );

    await Post.findByIdAndUpdate(
      originalPost._id,
      {
        $pull: {
          reposts: {
            user: userId,
          },
        },
      }
    );

    return sendSuccess(res, {
      data: {
        reposted: false,
      },
    });
  }

  // 7. Repost inherits original visibility
  const repostVisibility =
    originalPost.visibility;

  // 8. Create repost
  const newRepost = await Post.create({
    user: userId,

    content: originalPost.content,
    tags: originalPost.tags,
    visibility: repostVisibility,
    workout: originalPost.workout,
    media: originalPost.media || [],

    isRepost: true,
    originalPost: originalPost._id,

    respects: [],
    reposts: [],
  });

  // 9. Add repost to original post
  await Post.findByIdAndUpdate(
    originalPost._id,
    {
      $push: {
        reposts: {
          user: userId,
          createdAt: newRepost.createdAt,
        },
      },
    }
  );

  // 10. Populate response
  await newRepost.populate(
    "user",
    "name handle avatar"
  );

  await newRepost.populate("originalPost");

  return sendSuccess(res, {
    statusCode: 201,
    data: {
      reposted: true,
      post: newRepost,
    },
  });
});

// ─────────────────────────────────────────
// SAVE / UNSAVE
// ─────────────────────────────────────────
export const savePost = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { postId } = req.params;

  const post = await Post.findById(postId);

  if (!post) {
    throw new NotFoundError("Post not found");
  }

  const allowed = await canViewPostWithOriginal(
    post,
    userId
  );

  if (!allowed) {
    throw new ForbiddenError(
      "You do not have permission to save this post"
    );
  }

  const user = await User.findById(userId);

  if (!user.savedPosts.some(
    (id) => id.toString() === postId
  )) {
    user.savedPosts.push(postId);
    await user.save();
  }

  return sendSuccess(res, {
    data: {
      saved: true,
    },
  });
});

export const unsavePost = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { postId } = req.params;

  const user = await User.findById(userId);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  user.savedPosts = user.savedPosts.filter(
    (id) => id.toString() !== postId
  );

  await user.save();

  return sendSuccess(res, {
    data: {
      saved: false,
    },
  });
});

// ─────────────────────────────────────────
// HIDE / UNHIDE
// ─────────────────────────────────────────
export const hidePost = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user.hiddenPosts.includes(req.params.postId)) {
    user.hiddenPosts.push(req.params.postId);
    await user.save();
  }
  sendSuccess(res, { data: { hidden: true } });
});

export const unhidePost = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.hiddenPosts = user.hiddenPosts.filter((id) => id.toString() !== req.params.postId);
  await user.save();
  sendSuccess(res, { data: { hidden: false } });
});

// ─────────────────────────────────────────
// REPORT
// ─────────────────────────────────────────
export const reportPost = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const report = new Report({
    post: req.params.postId,
    reporter: req.user._id,
    reason,
    status: 'pending',
    createdAt: new Date(),
  });
  await report.save();
  sendSuccess(res, { statusCode: 201, data: report });
});

// ─────────────────────────────────────────
// SHARE TRACKING
// ─────────────────────────────────────────
export const trackShare = asyncHandler(async (req, res) => {
  const post = await Post.findById(
    req.params.postId
  );

  if (!post) {
    throw new NotFoundError("Post not found");
  }

  const allowed = await canViewPostWithOriginal(
    post,
    req.user._id
  );

  if (!allowed) {
    throw new ForbiddenError(
      "You do not have permission to share this post"
    );
  }

  post.shareCount =
    (post.shareCount || 0) + 1;

  await post.save();

  return sendSuccess(res, {
    data: {
      shareCount: post.shareCount,
    },
  });
});