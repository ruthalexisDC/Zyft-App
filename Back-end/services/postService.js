
import mongoose from "mongoose";
import Post from "../models/Post.js";
import User from "../models/User.js";
import Comment from "../models/Comments.js";
import Report from "../models/Report.js";
import { normalizeWorkout } from "../utils/workoutUtils.js";
import { buildCommentTree } from "../utils/commentUtils.js";
import { createNotificationService } from "./notificationService.js";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../errors/ApiError.js";

// ============================================================
// SHARED HELPERS
// ============================================================

const idString = (id) => {
  if (!id) return null;
  return id.toString();
};

const includesId = (array = [], id) =>
  array.some((item) => idString(item) === idString(id));

const REPORT_SNAPSHOT_RETENTION_DAYS = 180;

const buildWorkoutSnapshot = (workout) => {
  if (!workout || typeof workout !== "object") {
    return undefined;
  }

  const snapshot = {};

  // Explicitly allow only non-media workout fields.
  for (const field of [
    "title",
    "category",
    "duration",
    "caloriesBurned",
  ]) {
    if (workout[field] !== undefined) {
      snapshot[field] = workout[field];
    }
  }

  if (Array.isArray(workout.exercises)) {
    snapshot.exercises = workout.exercises.map(
      (exercise) => ({
        ...(exercise.name !== undefined && {
          name: exercise.name,
        }),
        ...(exercise.muscleGroup !== undefined && {
          muscleGroup: exercise.muscleGroup,
        }),
        sets: Array.isArray(exercise.sets)
          ? exercise.sets.map((set) => ({
              ...(set.reps !== undefined && {
                reps: set.reps,
              }),
              ...(set.weight !== undefined && {
                weight: set.weight,
              }),
              ...(set.unit !== undefined && {
                unit: set.unit,
              }),
              ...(set.rpe !== undefined && {
                rpe: set.rpe,
              }),
              ...(set.isWarmup !== undefined && {
                isWarmup: set.isWarmup,
              }),
            }))
          : [],
      })
    );
  }

  return Object.keys(snapshot).length
    ? snapshot
    : undefined;
};

const buildPostReportSnapshot = ({
  post,
  author,
  deletedAt,
}) => ({
  authorId: post.user || null,
  authorName: author?.name || "",
  authorHandle: author?.handle || "",
  content: post.content || "",
  tags: Array.isArray(post.tags) ? post.tags : [],
  visibility: post.visibility || null,
  workout: buildWorkoutSnapshot(post.workout),
  deletedAt,
});


// Preserve report records while detaching them from posts that are being deleted.
// The report itself is retained; only its limited post snapshot expires later.
const snapshotReportsForPosts = async ({
  posts = [],
  session,
}) => {
  if (!posts.length) {
    return 0;
  }

  const postIds = posts.map((post) => post._id).filter(Boolean);

  if (!postIds.length) {
    return 0;
  }

  const reports = await Report.find({
    post: { $in: postIds },
  })
    .session(session)
    .lean();

  if (!reports.length) {
    return 0;
  }

  const authorIds = [
    ...new Set(
      posts
        .map((post) => idString(post.user))
        .filter(Boolean)
    ),
  ];

  const authors = authorIds.length
    ? await User.find({
        _id: { $in: authorIds },
      })
        .select("name handle")
        .session(session)
        .lean()
    : [];

  const authorMap = new Map(
    authors.map((author) => [
      idString(author._id),
      author,
    ])
  );

  const postMap = new Map(
    posts.map((post) => [
      idString(post._id),
      post,
    ])
  );

  const deletedAt = new Date();
  const snapshotExpiresAt = new Date(
    deletedAt.getTime() +
      REPORT_SNAPSHOT_RETENTION_DAYS * 24 * 60 * 60 * 1000
  );

  const operations = reports
    .map((report) => {
      const reportedPost = postMap.get(idString(report.post));

      if (!reportedPost) {
        return null;
      }

      const author = authorMap.get(idString(reportedPost.user));
      const postSnapshot = buildPostReportSnapshot({
        post: reportedPost,
        author,
        deletedAt,
      });

      return {
        updateOne: {
          filter: {
            _id: report._id,
            post: report.post,
          },
          update: {
            $set: {
              post: null,
              originalPostId: report.post,
              postSnapshot,
              snapshotExpiresAt,
            },
          },
        },
      };
    })
    .filter(Boolean);

  if (operations.length) {
    await Report.bulkWrite(operations, { session });
  }

  return operations.length;
};

const getDisplayPost = (post) =>
  post?.isRepost && post.originalPost
    ? post.originalPost
    : post;

const getEngagementData = (post, userId) => {
  const displayPost = getDisplayPost(post);

  let originalPostWithData = post?.originalPost || null;

  if (post?.isRepost && post.originalPost) {
    originalPostWithData = {
      ...post.originalPost,
      respectCount: post.originalPost.respects?.length || 0,
      repostCount: post.originalPost.reposts?.length || 0,
      didRespect: includesId(
        post.originalPost.respects,
        userId
      ),
    };
  }

  return {
    originalPost: originalPostWithData,
    respectCount: displayPost?.respects?.length || 0,
    repostCount: displayPost?.reposts?.length || 0,
    didRespect: includesId(displayPost?.respects, userId),
  };
};

const getActiveStatus = (author, viewer) => {
  const visible =
    author?.show_active_status !== false &&
    viewer?.show_active_status !== false;

  return {
    last_active_at: visible
      ? author?.last_active_at || null
      : null,
    isOnline: visible
      ? Boolean(author?.isOnline)
      : false,
  };
};

const getFollowingIds = (user) =>
  (user?.following || []).map(idString);

const getHiddenPostIds = (user) =>
  new Set((user?.hiddenPosts || []).map(idString));

const getCommentCountMap = async (postIds = []) => {
  if (!postIds.length) {
    return new Map();
  }

  const counts = await Comment.aggregate([
    {
      $match: {
        post: { $in: postIds },
      },
    },
    {
      $group: {
        _id: "$post",
        count: { $sum: 1 },
      },
    },
  ]);

  return new Map(
    counts.map((item) => [
      idString(item._id),
      item.count,
    ])
  );
};

const populatePostQuery = (query) =>
  query
    .populate(
      "user",
      "name handle avatar last_active_at show_active_status isOnline"
    )
    .populate({
      path: "originalPost",
      populate: {
        path: "user",
        select: "name handle avatar",
      },
    });

// ============================================================
// PAGINATE VISIBLE POSTS
// ============================================================

const getPaginatedVisiblePosts = async ({
  query,
  pageNumber,
  limitNumber,
  userId,
  canViewPostWithOriginal,
  hiddenPostIds = new Set(),
}) => {
  const batchSize = Math.max(limitNumber * 2, 20);
  const requiredPosts = pageNumber * limitNumber + 1;

  const hiddenIds =
    hiddenPostIds instanceof Set
      ? hiddenPostIds
      : new Set(hiddenPostIds || []);

  let databaseSkip = 0;
  const visiblePosts = [];

  while (visiblePosts.length < requiredPosts) {
    const request = populatePostQuery(
      Post.find(query)
        .sort({ createdAt: -1, _id: -1 })
        .skip(databaseSkip)
        .limit(batchSize)
    );

    const batch = await request.lean();

    if (!batch.length) {
      break;
    }

    databaseSkip += batch.length;

    for (const post of batch) {
      if (!post.user) {
        continue;
      }

      const isHidden =
        hiddenIds.has(idString(post._id)) ||
        (post.originalPost &&
          hiddenIds.has(idString(post.originalPost._id)));

      if (isHidden) {
        continue;
      }

      const allowed = await canViewPostWithOriginal(
        post,
        userId
      );

      if (!allowed) {
        continue;
      }

      visiblePosts.push(post);

      if (visiblePosts.length >= requiredPosts) {
        break;
      }
    }

    if (batch.length < batchSize) {
      break;
    }
  }

  const startIndex = (pageNumber - 1) * limitNumber;

  return {
    posts: visiblePosts.slice(
      startIndex,
      startIndex + limitNumber
    ),
    hasMore:
      visiblePosts.length > startIndex + limitNumber,
  };
};

// ============================================================
// FORMAT POST RESULTS
// ============================================================

const formatPostsWithData = ({
  posts,
  userId,
  currentUser,
  followingIds,
  commentCountMap,
  isSaved = false,
}) => {
  return posts.map((post) => {
    const engagement = getEngagementData(post, userId);

    const isOwnPost =
      idString(post.user?._id) === idString(userId);

    const activeStatus = getActiveStatus(
      post.user,
      currentUser
    );

    return {
      ...post,
      ...engagement,

      commentCount:
        commentCountMap.get(idString(post._id)) || 0,

      ...(isSaved ? { isSaved: true } : {}),

      user: post.user
        ? {
            ...post.user,
            isFollowing: isOwnPost
              ? false
              : followingIds.includes(
                  idString(post.user._id)
                ),
            ...activeStatus,
          }
        : null,
    };
  });
};

// ============================================================
// CREATE POST
// ============================================================

export const createPostService = async ({
  userId,
  content,
  workout,
  media,
  visibility,
}) => {
  // Normalize and validate workout data before saving.
  const normalizedWorkout = normalizeWorkout(workout);

  const post = await Post.create({
    user: userId,
    content,
    workout: normalizedWorkout,
    media,
    visibility,
  });

  await post.populate({
    path: "user",
    select: "name handle avatar",
  });

  return post;
};

// ============================================================
// GET FEED
// ============================================================

export const getFeedService = async ({
  userId,
  pageNumber,
  limitNumber,
  type,
  canViewPostWithOriginal,
}) => {
  const currentUser = await User.findById(userId).select(
    "following hiddenPosts show_active_status"
  );

  if (!currentUser) {
    throw new NotFoundError("User not found");
  }

  const followingIds = getFollowingIds(currentUser);
  const hiddenPostIds = getHiddenPostIds(currentUser);

  let query;

  if (type === "following") {
    query = {
      $or: [
        {
          user: userId,
        },
        {
          user: { $in: followingIds },
          visibility: {
            $in: ["public", "followers"],
          },
        },
      ],
    };
  } else {
    query = {
      visibility: "public",
    };
  }

  const { posts: pagePosts, hasMore } =
    await getPaginatedVisiblePosts({
      query,
      pageNumber,
      limitNumber,
      userId,
      canViewPostWithOriginal,
      hiddenPostIds,
    });

  // Comments belong to the displayed document.
  // A repost has its own comment thread.
  const postIds = pagePosts.map((post) => post._id);

  const commentCountMap = await getCommentCountMap(postIds);

  const postsWithData = formatPostsWithData({
    posts: pagePosts,
    userId,
    currentUser,
    followingIds,
    commentCountMap,
  });

  return {
    posts: postsWithData,
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      hasMore,
    },
  };
};

// ============================================================
// GET POST BY ID
// ============================================================

export const getPostService = async ({
  postId,
  userId,
  canViewPostWithOriginal,
}) => {
  const post = await populatePostQuery(
    Post.findById(postId)
  );

  if (!post) {
    throw new NotFoundError("Post not found");
  }

  const allowed = await canViewPostWithOriginal(
    post,
    userId
  );

  if (!allowed) {
    throw new ForbiddenError(
      "You do not have permission to view this post"
    );
  }

  const [comments, viewer] = await Promise.all([
    Comment.find({ post: postId })
      .populate("user", "name handle avatar")
      .sort({ createdAt: 1 }),

    User.findById(userId).select("show_active_status"),
  ]);

  const commentsWithReactions = buildCommentTree(
    comments,
    userId
  );

  const postObj = post.toObject();

  if (postObj.user) {
    Object.assign(
      postObj.user,
      getActiveStatus(postObj.user, viewer)
    );
  }

  const engagement = getEngagementData(
    postObj,
    userId
  );

  return {
    ...postObj,
    ...engagement,
    comments: commentsWithReactions,
    commentCount: comments.length,
  };
};

// ============================================================
// GET USER POSTS
// ============================================================

export const getUserPostsService = async ({
  userId,
  currentUserId,
  pageNumber,
  limitNumber,
  canViewPostWithOriginal,
}) => {
  const isOwnProfile =
    idString(currentUserId) === idString(userId);

  const profileOwner = await User.findById(userId).select(
    "followers"
  );

  if (!profileOwner) {
    throw new NotFoundError("User not found");
  }

  const viewerFollowsOwner = includesId(
    profileOwner.followers,
    currentUserId
  );

  let visibilityFilter;

  if (isOwnProfile) {
    visibilityFilter = {};
  } else if (viewerFollowsOwner) {
    visibilityFilter = {
      visibility: {
        $in: ["public", "followers"],
      },
    };
  } else {
    visibilityFilter = {
      visibility: "public",
    };
  }

  // Both normal posts and repost documents are returned.
  // The frontend can separate them using post.isRepost.
  const query = {
    user: userId,
    ...visibilityFilter,
  };

  const [viewer, currentUser] = await Promise.all([
    User.findById(currentUserId).select(
      "show_active_status hiddenPosts"
    ),
    User.findById(currentUserId).select("following"),
  ]);

  if (!viewer || !currentUser) {
    throw new NotFoundError("User not found");
  }

  const hiddenPostIds = getHiddenPostIds(viewer);
  const followingIds = getFollowingIds(currentUser);

  const { posts: pagePosts, hasMore } =
    await getPaginatedVisiblePosts({
      query,
      pageNumber,
      limitNumber,
      userId: currentUserId,
      canViewPostWithOriginal,
      hiddenPostIds,
    });

  const postIds = pagePosts.map((post) => post._id);

  const commentCountMap = await getCommentCountMap(postIds);

  const postsWithData = formatPostsWithData({
    posts: pagePosts,
    userId: currentUserId,
    currentUser: viewer,
    followingIds,
    commentCountMap,
  });

  return {
    posts: postsWithData,
    pagination: {
      currentPage: pageNumber,
      hasMore,
    },
  };
};

// ============================================================
// GET SAVED POSTS
// ============================================================

export const getSavedPostsService = async ({
  userId,
  pageNumber,
  limitNumber,
  canViewPostWithOriginal,
}) => {
  const currentUser = await User.findById(userId).select(
    "savedPosts following show_active_status"
  );

  if (!currentUser) {
    throw new NotFoundError("User not found");
  }

  const savedPostIds = currentUser.savedPosts || [];

  if (!savedPostIds.length) {
    return {
      posts: [],
      pagination: {
        currentPage: pageNumber,
        totalPages: 0,
        totalPosts: 0,
        hasMore: false,
      },
    };
  }

  const followingIds = getFollowingIds(currentUser);

  // Most recently saved first.
  const orderedSavedPostIds = [...savedPostIds].reverse();

  const batchSize = Math.max(limitNumber * 2, 20);

  let databaseIndex = 0;
  const visiblePosts = [];

  // Scan all saved IDs to calculate accurate total counts.
  while (databaseIndex < orderedSavedPostIds.length) {
    const batchIds = orderedSavedPostIds.slice(
      databaseIndex,
      databaseIndex + batchSize
    );

    const posts = await populatePostQuery(
      Post.find({
        _id: { $in: batchIds },
      })
    ).lean();

    const postMap = new Map(
      posts.map((post) => [
        idString(post._id),
        post,
      ])
    );

    // Preserve the user's saved order.
    const orderedBatch = batchIds
      .map((id) => postMap.get(idString(id)))
      .filter(Boolean);

    for (const post of orderedBatch) {
      if (!post.user) {
        continue;
      }

      const allowed = await canViewPostWithOriginal(
        post,
        userId
      );

      if (!allowed) {
        continue;
      }

      visiblePosts.push(post);
    }

    databaseIndex += batchIds.length;
  }

  const startIndex = (pageNumber - 1) * limitNumber;

  const pagePosts = visiblePosts.slice(
    startIndex,
    startIndex + limitNumber
  );

  const hasMore =
    visiblePosts.length > startIndex + limitNumber;

  const postIds = pagePosts.map((post) => post._id);

  const commentCountMap = await getCommentCountMap(postIds);

  const postsWithData = formatPostsWithData({
    posts: pagePosts,
    userId,
    currentUser,
    followingIds,
    commentCountMap,
    isSaved: true,
  });

  return {
    posts: postsWithData,
    pagination: {
      currentPage: pageNumber,
      totalPosts: visiblePosts.length,
      totalPages: Math.ceil(
        visiblePosts.length / limitNumber
      ),
      hasMore,
    },
  };
};

// ============================================================
// UPDATE POST
// ============================================================

export const updatePostService = async ({
  postId,
  userId,
  updates,
}) => {
  const post = await Post.findById(postId);

  if (!post) {
    throw new NotFoundError("Post not found");
  }

  if (idString(post.user) !== idString(userId)) {
    throw new ForbiddenError(
      "Not authorized to update this post"
    );
  }

  const safeUpdates = { ...updates };

  // Normalize workout data only when the request includes it.
  if (
    Object.prototype.hasOwnProperty.call(
      safeUpdates,
      "workout"
    )
  ) {
    safeUpdates.workout = normalizeWorkout(
      safeUpdates.workout
    );
  }

  const updatedPost = await Post.findOneAndUpdate(
    {
      _id: postId,
      user: userId,
    },
    {
      $set: safeUpdates,
    },
    {
      new: true,
      runValidators: true,
    }
  ).populate("user", "name handle avatar");

  if (!updatedPost) {
    throw new NotFoundError("Post not found");
  }

  return updatedPost;
};

// ============================================================
// DELETE POST
// ============================================================

export const deletePostService = async ({
  postId,
  userId,
}) => {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const post = await Post.findById(postId).session(session);

      if (!post) {
        throw new NotFoundError("Post not found");
      }

      if (idString(post.user) !== idString(userId)) {
        throw new ForbiddenError(
          "You can only delete your own posts"
        );
      }

      const postIdsToDelete = [post._id];

      // Deleting an original also deletes all of its repost documents.
      if (!post.isRepost) {
        const reposts = await Post.find({
          originalPost: post._id,
          isRepost: true,
        })
          .select("_id")
          .session(session)
          .lean();

        postIdsToDelete.push(
          ...reposts.map((repost) => repost._id)
        );
      }

      // Fetch full documents so each report gets a snapshot of the
      // exact post it refers to, including repost-specific content.
      const postsForSnapshots = await Post.find({
        _id: { $in: postIdsToDelete },
      })
        .session(session)
        .lean();

      await snapshotReportsForPosts({
        posts: postsForSnapshots,
        session,
      });

      // Deleting one repost removes its embedded entry from the original.
      if (post.isRepost && post.originalPost) {
        await Post.updateOne(
          { _id: post.originalPost },
          {
            $pull: {
              reposts: {
                user: post.user,
              },
            },
          },
          { session }
        );
      }

      await Comment.deleteMany({
        post: { $in: postIdsToDelete },
      }).session(session);

      await User.updateMany(
        {
          savedPosts: { $in: postIdsToDelete },
        },
        {
          $pull: {
            savedPosts: {
              $in: postIdsToDelete,
            },
          },
        }
      ).session(session);

      await User.updateMany(
        {
          hiddenPosts: { $in: postIdsToDelete },
        },
        {
          $pull: {
            hiddenPosts: {
              $in: postIdsToDelete,
            },
          },
        }
      ).session(session);

      await Post.deleteMany({
        _id: { $in: postIdsToDelete },
      }).session(session);
    });

    return true;
  } finally {
    await session.endSession();
  }
};

// ============================================================
// GIVE / REMOVE RESPECT
// ============================================================

export const giveRespectService = async ({
  postId,
  userId,
  canViewPostWithOriginal,
}) => {
  const requestedPost = await Post.findById(postId);

  if (!requestedPost) {
    throw new NotFoundError("Post not found");
  }

  const allowed = await canViewPostWithOriginal(
    requestedPost,
    userId
  );

  if (!allowed) {
    throw new ForbiddenError(
      "You do not have permission to interact with this post"
    );
  }

  // Reposts share engagement with the original post.
  const targetPostId =
    requestedPost.isRepost && requestedPost.originalPost
      ? requestedPost.originalPost
      : requestedPost._id;

  // Atomic toggle.
  const removed = await Post.findOneAndUpdate(
    {
      _id: targetPostId,
      respects: userId,
    },
    {
      $pull: {
        respects: userId,
      },
    },
    {
      new: true,
    }
  ).select("user respects");

  if (removed) {
    return {
      respected: false,
      respectCount: removed.respects.length,
    };
  }

  const added = await Post.findOneAndUpdate(
    {
      _id: targetPostId,
      respects: { $ne: userId },
    },
    {
      $addToSet: {
        respects: userId,
      },
    },
    {
      new: true,
    }
  ).select("user respects");

  if (!added) {
    const latest = await Post.findById(targetPostId)
      .select("user respects");

    if (!latest) {
      throw new NotFoundError("Original post not found");
    }

    return {
      respected: includesId(latest.respects, userId),
      respectCount: latest.respects.length,
    };
  }

  if (idString(added.user) !== idString(userId)) {
    try {
      await createNotificationService({
        recipient: added.user,
        sender: userId,
        type: "respect",
        workout: targetPostId,
      });
    } catch (error) {
      console.error(
        "Failed to create respect notification:",
        error
      );
    }
  }

  return {
    respected: true,
    respectCount: added.respects.length,
  };
};

// ============================================================
// GET RESPECTS
// ============================================================

export const getRespectsService = async ({
  postId,
  currentUserId,
  canViewPostWithOriginal,
}) => {
  const requestedPost = await Post.findById(postId);

  if (!requestedPost) {
    throw new NotFoundError("Post not found");
  }

  const allowed = await canViewPostWithOriginal(
    requestedPost,
    currentUserId
  );

  if (!allowed) {
    throw new ForbiddenError(
      "You do not have permission to view respects for this post"
    );
  }

  const targetPostId =
    requestedPost.isRepost && requestedPost.originalPost
      ? requestedPost.originalPost
      : requestedPost._id;

  const targetPost = await Post.findById(
    targetPostId
  ).populate(
    "respects",
    "name handle avatar bio followers"
  );

  if (!targetPost) {
    throw new NotFoundError("Original post not found");
  }

  return (targetPost.respects || []).map((user) => ({
    id: user._id,
    name: user.name,
    handle: `@${user.handle}`,
    avatar: user.avatar,
    bio: user.bio,
    isFollowing: includesId(
      user.followers,
      currentUserId
    ),
  }));
};

// ============================================================
// ADD COMMENT
// ============================================================

export const addCommentService = async ({
  postId,
  userId,
  content,
  parentComment,
  canViewPostWithOriginal,
}) => {
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
      "You do not have permission to comment on this post"
    );
  }

  let parent = null;

  if (parentComment) {
    const requestedParent = await Comment.findById(
      parentComment
    );

    if (
      !requestedParent ||
      idString(requestedParent.post) !== idString(postId)
    ) {
      throw new BadRequestError("Invalid parent comment");
    }

    // Keep threads one level deep.
    parent = requestedParent.parentComment
      ? await Comment.findById(
          requestedParent.parentComment
        )
      : requestedParent;

    if (
      !parent ||
      idString(parent.post) !== idString(postId) ||
      parent.parentComment
    ) {
      throw new BadRequestError("Invalid parent comment");
    }
  }

  const comment = await Comment.create({
    post: postId,
    user: userId,
    content: content.trim(),
    parentComment: parent ? parent._id : null,
  });

  await comment.populate(
    "user",
    "name handle avatar"
  );

  const commentObj = comment.toObject({
    virtuals: true,
  });

  commentObj.myReaction = null;
  commentObj.replies = [];

  const notifyRecipient = parent
    ? parent.user
    : post.user;

  if (idString(notifyRecipient) !== idString(userId)) {
    try {
      await createNotificationService({
        recipient: notifyRecipient,
        sender: userId,
        type: "comment",
        workout: post._id,
        comment: comment.content,
        commentId: comment._id,
      });
    } catch (error) {
      console.error(
        "Failed to create comment notification:",
        error
      );
    }
  }

  return commentObj;
};

// ============================================================
// GET COMMENTS
// ============================================================

export const getCommentsService = async ({
  postId,
  userId,
  canViewPostWithOriginal,
}) => {
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
      "You do not have permission to view comments on this post"
    );
  }

  const allComments = await Comment.find({
    post: postId,
  })
    .populate("user", "name handle avatar")
    .sort({ createdAt: 1 });

  return buildCommentTree(allComments, userId);
};


 // ============================================================
 // DELETE COMMENT
 // ============================================================

export const deleteCommentService = async ({
  postId,
  commentId,
  userId,
}) => {
  const comment = await Comment.findOne({
    _id: commentId,
    post: postId,
  });

  if (!comment) {
    throw new NotFoundError("Comment not found on this post");
  }

  if (idString(comment.user) !== idString(userId)) {
    throw new ForbiddenError(
      "You can only delete your own comments"
    );
  }

  // Delete replies before deleting the parent.
  await Comment.deleteMany({
    parentComment: commentId,
    post: postId,
  });

  await Comment.findOneAndDelete({
    _id: commentId,
    post: postId,
  });

  return true;
};

// ============================================================
// UPDATE COMMENT
// ============================================================

export const updateCommentService = async ({
  postId,
  commentId,
  userId,
  content,
}) => {
  const comment = await Comment.findOne({
    _id: commentId,
    post: postId,
  });

  if (!comment) {
    throw new NotFoundError("Comment not found on this post");
  }

  if (idString(comment.user) !== idString(userId)) {
    throw new ForbiddenError(
      "You can only edit your own comments"
    );
  }

  comment.content = content.trim();

  await comment.save();

  const populatedComment = await comment.populate(
    "user",
    "name handle avatar"
  );

  const commentObj = populatedComment.toObject({
    virtuals: true,
  });

  commentObj.myReaction =
    populatedComment.getUserReaction(userId);

  return commentObj;
};

// ============================================================
// REACT TO COMMENT
// ============================================================

export const reactToCommentService = async ({
  postId,
  commentId,
  userId,
  emoji,
  canViewPostWithOriginal,
}) => {
  const comment = await Comment.findOne({
    _id: commentId,
    post: postId,
  });

  if (!comment) {
    throw new NotFoundError("Comment not found on this post");
  }

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
      "You do not have permission to react to this comment"
    );
  }

  const existingIndex = comment.reactions.findIndex(
    (reaction) =>
      idString(reaction.user) === idString(userId)
  );

  let myReaction = emoji;

  if (existingIndex !== -1) {
    const existingReaction =
      comment.reactions[existingIndex];

    if (existingReaction.emoji === emoji) {
      comment.reactions.splice(existingIndex, 1);
      myReaction = null;
    } else {
      existingReaction.emoji = emoji;
    }
  } else {
    comment.reactions.push({
      user: userId,
      emoji,
    });
  }

  await comment.save();

  return {
    reactionSummary: comment.reactionSummary,
    myReaction,
  };
};


// ============================================================
// REPOST / REMOVE REPOST
// ============================================================

export const repostService = async ({
  postId,
  userId,
  canViewPost,
}) => {
  const session = await mongoose.startSession();

  let result = null;
  let createdRepostId = null;

  try {
    await session.withTransaction(async () => {
      // Reset values because MongoDB may retry a transaction.
      result = null;
      createdRepostId = null;

      const originalPost = await Post.findById(postId)
        .session(session);

      if (!originalPost) {
        throw new NotFoundError("Post not found");
      }

      if (originalPost.isRepost) {
        throw new BadRequestError(
          "You cannot repost a repost"
        );
      }

      if (originalPost.visibility === "private") {
        throw new ForbiddenError(
          "Private posts cannot be reposted"
        );
      }

      const allowed = await canViewPost(
        originalPost,
        userId
      );

      if (!allowed) {
        throw new ForbiddenError(
          "You do not have permission to repost this post"
        );
      }

      const existingReposts = await Post.find({
        user: userId,
        originalPost: originalPost._id,
        isRepost: true,
      })
        .session(session)
        .lean();

      // --------------------------------------------------------
      // REMOVE REPOST
      // --------------------------------------------------------

      if (existingReposts.length > 0) {
        const repostIds = existingReposts.map(
          (repost) => repost._id
        );

        // Preserve reports filed against these repost documents before
        // removing them. The helper runs inside this transaction.
        await snapshotReportsForPosts({
          posts: existingReposts,
          session,
        });

        await Comment.deleteMany({
          post: { $in: repostIds },
        }).session(session);

        await User.updateMany(
          {
            savedPosts: { $in: repostIds },
          },
          {
            $pull: {
              savedPosts: {
                $in: repostIds,
              },
            },
          }
        ).session(session);

        await User.updateMany(
          {
            hiddenPosts: { $in: repostIds },
          },
          {
            $pull: {
              hiddenPosts: {
                $in: repostIds,
              },
            },
          }
        ).session(session);

        await Post.deleteMany({
          _id: { $in: repostIds },
          user: userId,
          originalPost: originalPost._id,
          isRepost: true,
        }).session(session);

        await Post.updateOne(
          {
            _id: originalPost._id,
          },
          {
            $pull: {
              reposts: {
                user: userId,
              },
            },
          },
          { session }
        );

        const updatedOriginal = await Post.findById(
          originalPost._id
        )
          .select("reposts")
          .session(session);

        if (!updatedOriginal) {
          throw new NotFoundError("Original post not found");
        }

        result = {
          reposted: false,
          repostCount: updatedOriginal.reposts.length,
        };

        return;
      }

      // --------------------------------------------------------
      // CREATE REPOST
      // --------------------------------------------------------

      // Normalize the original workout before copying it.
      // This rejects malformed legacy workout data with a
      // clear validation error instead of a Mongoose cast error.
      const normalizedWorkout = normalizeWorkout(
        originalPost.workout,
        "originalPost.workout"
      );

      const [newRepost] = await Post.create(
        [
          {
            user: userId,
            content: originalPost.content,
            tags: originalPost.tags,
            visibility: originalPost.visibility,
            workout: normalizedWorkout,
            media: originalPost.media || [],
            isRepost: true,
            originalPost: originalPost._id,
            respects: [],
            reposts: [],
          },
        ],
        { session }
      );

      // Remove stale duplicate embedded entries first.
      await Post.updateOne(
        {
          _id: originalPost._id,
        },
        {
          $pull: {
            reposts: {
              user: userId,
            },
          },
        },
        { session }
      );

      await Post.updateOne(
        {
          _id: originalPost._id,
        },
        {
          $push: {
            reposts: {
              user: userId,
              createdAt: newRepost.createdAt,
            },
          },
        },
        { session }
      );

      const updatedOriginal = await Post.findById(
        originalPost._id
      )
        .select("reposts")
        .session(session);

      if (!updatedOriginal) {
        throw new NotFoundError("Original post not found");
      }

      createdRepostId = newRepost._id;

      result = {
        reposted: true,
        repostCount: updatedOriginal.reposts.length,
      };
    });

    // Populate after the transaction commits.
    if (createdRepostId) {
      const populatedRepost = await populatePostQuery(
        Post.findById(createdRepostId)
      );

      if (!populatedRepost) {
        throw new NotFoundError("Repost not found");
      }

      result.post = populatedRepost;
    }

    return result;
  } finally {
    await session.endSession();
  }
};

// ============================================================
// SAVE POST
// ============================================================

export const savePostService = async ({
  postId,
  userId,
  canViewPostWithOriginal,
}) => {
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

  const result = await User.updateOne(
    {
      _id: userId,
    },
    {
      $addToSet: {
        savedPosts: postId,
      },
    }
  );

  if (result.matchedCount === 0) {
    throw new NotFoundError("User not found");
  }

  return {
    saved: true,
  };
};

// ============================================================
// UNSAVE POST
// ============================================================

export const unsavePostService = async ({
  postId,
  userId,
}) => {
  const result = await User.updateOne(
    {
      _id: userId,
    },
    {
      $pull: {
        savedPosts: postId,
      },
    }
  );

  if (result.matchedCount === 0) {
    throw new NotFoundError("User not found");
  }

  return {
    saved: false,
  };
};

// ============================================================
// HIDE POST
// ============================================================

export const hidePostService = async ({
  postId,
  userId,
}) => {
  const result = await User.updateOne(
    {
      _id: userId,
    },
    {
      $addToSet: {
        hiddenPosts: postId,
      },
    }
  );

  if (result.matchedCount === 0) {
    throw new NotFoundError("User not found");
  }

  return {
    hidden: true,
  };
};

// ============================================================
// UNHIDE POST
// ============================================================

export const unhidePostService = async ({
  postId,
  userId,
}) => {
  const result = await User.updateOne(
    {
      _id: userId,
    },
    {
      $pull: {
        hiddenPosts: postId,
      },
    }
  );

  if (result.matchedCount === 0) {
    throw new NotFoundError("User not found");
  }

  return {
    hidden: false,
  };
};

// ============================================================
// REPORT POST
// ============================================================



export const reportPostService = async ({
  postId,
  userId,
  reason,
  canViewPostWithOriginal,
}) => {
  const post = await Post.findById(postId);

  if (!post) {
    throw new NotFoundError("Post not found");
  }

  if (typeof canViewPostWithOriginal !== "function") {
    throw new Error(
      "canViewPostWithOriginal must be provided"
    );
  }

  const allowed = await canViewPostWithOriginal(
    post,
    userId
  );

  if (!allowed) {
    throw new ForbiddenError(
      "You do not have permission to report this post"
    );
  }

  // Prevent the same user from reporting the same post twice.
  const existingReport = await Report.findOne({
    post: postId,
    reporter: userId,
  });

  if (existingReport) {
    throw new ConflictError(
      "You have already reported this post"
    );
  }

  try {
    // Fetch the original author's information for the snapshot.
    const author = await User.findById(post.user)
      .select("name handle")
      .lean();

    // Set snapshot expiration to 180 days after report creation.
    const snapshotExpiresAt = new Date();
    snapshotExpiresAt.setDate(
      snapshotExpiresAt.getDate() + 180
    );

    const report = await Report.create({
      post: postId,
      originalPostId: post._id,
      reporter: userId,
      reason: reason.trim(),
      status: "pending",

      postSnapshot: {
        authorId: post.user,
        authorName: author?.name ?? "",
        authorHandle: author?.handle ?? "",
        content: post.content ?? "",
        tags: post.tags ?? [],
        visibility: post.visibility ?? null,
        workout: post.workout ?? undefined,
        deletedAt: null,
      },

      snapshotExpiresAt,
    });

    return { report };
  } catch (error) {
    // Handles simultaneous requests caught by the unique index.
    if (error.code === 11000) {
      throw new ConflictError(
        "You have already reported this post"
      );
    }

    throw error;
  }
};

// ============================================================
// TRACK SHARE
// ============================================================

export const trackShareService = async ({
  postId,
  userId,
  canViewPostWithOriginal,
}) => {
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
      "You do not have permission to share this post"
    );
  }

  const updatedPost = await Post.findByIdAndUpdate(
    postId,
    {
      $inc: {
        shareCount: 1,
      },
    },
    {
      new: true,
    }
  ).select("shareCount");

  if (!updatedPost) {
    throw new NotFoundError("Post not found");
  }

  return {
    shareCount: updatedPost.shareCount,
  };
};