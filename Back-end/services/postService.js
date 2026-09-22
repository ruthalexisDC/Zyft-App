import Post from "../models/Post.js";
import User from "../models/User.js";
import Comment from "../models/Comments.js";
import { buildCommentTree } from "../utils/commentUtils.js";
import Notification from "../models/Notification.js";
import Report from "../models/Report.js";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../errors/ApiError.js";



//Service : Create Post
export const createPostService = async ({
  userId,
  content,
  workout,
  media,
  visibility,
}) => {


  const post = await Post.create({
    user: userId,
    content,
    workout,
    media,
    visibility,
  });


  await post.populate({
    path: "user",
    select: "name handle avatar",
  });

  return post;
};

// Service: Get Feed
export const getFeedService = async ({
  userId,
  pageNumber,
  limitNumber,
  type,
  canViewPostWithOriginal,
}) => {
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

  const targetVisiblePosts = pageNumber * limitNumber;

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
    // POST VISIBILITY FILTER
    // ─────────────────────────────────────────────

    for (const post of validPosts) {
      const allowed = await canViewPostWithOriginal(
        post,
        userId
      );

      if (!allowed) {
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

  return {
    posts: postsWithData,
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      hasMore,
    },
  };
};

//Service : Get Post By Id
// Service: Get Post By Id
export const getPostService = async ({
  postId,
  userId,
  canViewPostWithOriginal,
}) => {
  const post = await Post.findById(postId)
    .populate(
      "user",
      "name handle avatar last_active_at show_active_status isOnline"
    )
    .populate("originalPost");

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

  // Get all comments
  const comments = await Comment.find({
    post: postId,
  })
    .populate("user", "name handle avatar")
    .sort({
      createdAt: 1,
    });

  // Convert flat comments into a nested comment tree
  const commentsWithReactions = buildCommentTree(
    comments,
    userId
  );

  // Active status
  const [viewer, author] = await Promise.all([
    User.findById(userId).select("show_active_status"),
    User.findById(post.user?._id).select("show_active_status"),
  ]);

  const showActiveStatus =
    author?.show_active_status !== false &&
    viewer?.show_active_status !== false;

  const postObj = post.toObject();

  if (postObj.user) {
    postObj.user.last_active_at = showActiveStatus
      ? postObj.user.last_active_at
      : null;

    postObj.user.isOnline = showActiveStatus
      ? postObj.user.isOnline
      : false;
  }

  return {
    ...postObj,
    didRespect: post.didUserRespect(userId),
    comments: commentsWithReactions,
    commentCount: comments.length,
  };
};

//Service : Get User Posts
// Service: Get User Posts
export const getUserPostsService = async ({
  userId,
  currentUserId,
  pageNumber,
  limitNumber,
  canViewPostWithOriginal,
}) => {
  const skip =
    (pageNumber - 1) * limitNumber;

  // Determine profile visibility
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

  // Active status
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

  // Fetch posts
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

  // Repost privacy filter
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

  // Response data
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

          user: userWithActiveStatus,

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

  return {
    posts: postsWithData,

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
  };
};


// Service: Get Saved Posts
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

  if (savedPostIds.length === 0) {
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

  const followingIds = (currentUser.following || []).map(
    (id) => id.toString()
  );

  const viewerShowsActiveStatus =
    currentUser.show_active_status !== false;

  /*
   * Saved posts are stored as IDs on the User document.
   *
   * We process them in batches instead of loading every
   * saved post into memory at once.
   *
   * Reverse the IDs so the newest saved post appears first.
   */
  const orderedSavedPostIds = [...savedPostIds].reverse();

  const BATCH_SIZE = Math.max(limitNumber * 2, 20);

  let databaseIndex = 0;
  let visiblePosts = [];

  while (databaseIndex < orderedSavedPostIds.length) {
    const batchIds = orderedSavedPostIds.slice(
      databaseIndex,
      databaseIndex + BATCH_SIZE
    );

    const posts = await Post.find({
      _id: {
        $in: batchIds,
      },
    })
      .populate(
        "user",
        "name handle avatar last_active_at show_active_status isOnline"
      )
      .populate("workout")
      .populate("originalPost")
      .lean();

    const postMap = new Map(
      posts.map((post) => [
        post._id.toString(),
        post,
      ])
    );

    /*
     * Restore savedPosts order because MongoDB does not
     * guarantee the order of $in results.
     */
    const orderedBatch = batchIds
      .map((id) => postMap.get(id.toString()))
      .filter(Boolean);

    /*
     * Check whether each saved post is still visible.
     */
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

    /*
     * We only need enough visible posts to build
     * the requested page plus one extra post.
     *
     * The extra post lets us determine hasMore.
     */
    const requiredPosts =
      pageNumber * limitNumber + 1;

    if (visiblePosts.length >= requiredPosts) {
      break;
    }
  }

  /*
   * Determine the requested page from the visible posts.
   */
  const startIndex =
    (pageNumber - 1) * limitNumber;

  const pagePosts = visiblePosts.slice(
    startIndex,
    startIndex + limitNumber
  );

  /*
   * If we stopped early because we found enough posts,
   * there is another page.
   */
  const hasMore =
    visiblePosts.length >
    startIndex + limitNumber;

  /*
   * Build response data.
   */
  const postsWithData = await Promise.all(
    pagePosts.map(async (post) => {
      const commentCount =
        await Comment.countDocuments({
          post: post._id,
        });

      const isOwnPost =
        post.user?._id?.toString() ===
        userId.toString();

      const authorShowsActiveStatus =
        post.user?.show_active_status !== false;

      const showActiveStatus =
        authorShowsActiveStatus &&
        viewerShowsActiveStatus;

      return {
        ...post,

        isSaved: true,

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
          : null,
      };
    })
  );

  /*
   * totalPosts is the number of visible saved posts
   * that we have evaluated so far.
   *
   * If we processed every saved post, this is the
   * complete total.
   *
   * If we stopped early, we intentionally don't claim
   * an exact total.
   */
  const processedAllPosts =
    databaseIndex >= orderedSavedPostIds.length;

  const totalPosts = processedAllPosts
    ? visiblePosts.length
    : undefined;

  return {
    posts: postsWithData,

    pagination: {
      currentPage: pageNumber,
      ...(totalPosts !== undefined && {
        totalPages: Math.ceil(
          totalPosts / limitNumber
        ),
        totalPosts,
      }),
      hasMore,
    },
  };
};

//Service : Update Post

export const updatePostService = async ({
  postId,
  userId,
  updates,
}) => {
  const post = await Post.findById(postId);

if (!post) {
  throw new NotFoundError("Post not found");
}

  if (post.user.toString() !== userId.toString()) {
    throw new ForbiddenError(
      "Not authorized to update this post"
    );
  }

  const updatedPost =
    await Post.findByIdAndUpdate(
      postId,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    );

  return updatedPost;
};

// Service: Delete Post
export const deletePostService = async ({
  postId,
  userId,
}) => {
  const post = await Post.findById(postId);

  if (!post) {
  throw new NotFoundError("Post not found");
}
  if (post.user.toString() !== userId.toString()) {
    throw new ForbiddenError(
      "You can only delete your own posts"
    );
  }

  await Comment.deleteMany({
    post: postId,
  });

  await Post.findByIdAndDelete(postId);

  return true;
};

// Service: Give / Remove Respect
export const giveRespectService = async ({
  postId,
  userId,
  canViewPostWithOriginal,
}) => {
  const post = await Post.findById(postId);

  if (!post) {
    return null;
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

  // Defensive: ensure respects is an array
  if (!Array.isArray(post.respects)) {
    post.respects = [];
  }

  const alreadyRespected = post.respects.some(
    (r) =>
      r.toString() === userId.toString()
  );

  let newRespects;

  if (alreadyRespected) {
    newRespects = post.respects.filter(
      (r) =>
        r.toString() !== userId.toString()
    );
  } else {
    newRespects = [
      ...post.respects,
      userId,
    ];
  }

  await Post.updateOne(
    { _id: postId },
    {
      $set: {
        respects: newRespects,
      },
    }
  );

  // Create notification only when adding respect,
  // not when removing respect.
  if (
    !alreadyRespected &&
    post.user.toString() !== userId.toString()
  ) {
    try {
      await Notification.create({
        recipient: post.user,
        sender: userId,
        type: "respect",
        workout: post._id,
      });
    } catch (notifErr) {
      console.error(
        "Failed to create respect notification:",
        notifErr
      );
    }
  }

  return {
    respected: !alreadyRespected,
    respectCount: newRespects.length,
  };
};

// Service: Get Respects
export const getRespectsService = async ({
  postId,
  currentUserId,
  canViewPostWithOriginal,
}) => {
  const post = await Post.findById(postId).populate(
    "respects",
    "name handle avatar bio followers"
  );

 if (!post) {
  throw new NotFoundError("Post not found");
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

  // Defensive: handle undefined respects
  const respects = post.respects || [];

  const users = respects.map((u) => ({
    id: u._id,
    name: u.name,
    handle: `@${u.handle}`,
    avatar: u.avatar,
    bio: u.bio,

    isFollowing:
      u.followers?.some(
        (id) =>
          id.toString() === currentUserId.toString()
      ) || false,
  }));

  return users;
};

// Service: Add Comment
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
    parent = await Comment.findById(parentComment);

    if (
      !parent ||
      parent.post.toString() !== postId.toString()
    ) {
      throw new BadRequestError(
        "Invalid parent comment"
      );
    }

    // Keep threads one level deep.
    // If replying to a reply, attach the new comment
    // to the original top-level comment.
    if (parent.parentComment) {
      parent = await Comment.findById(
        parent.parentComment
      );
    }
  }

  const comment = await Comment.create({
    post: postId,
    user: userId,
    content: content.trim(),
    parentComment: parent
      ? parent._id
      : null,
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

  // Notify the parent comment's author for a reply,
  // otherwise notify the post owner.
  const notifyRecipient = parent
    ? parent.user
    : post.user;

  if (
    notifyRecipient.toString() !==
    userId.toString()
  ) {
    try {
      await Notification.create({
        recipient: notifyRecipient,
        sender: userId,
        type: "comment",
        workout: post._id,
        comment: comment.content,
        commentId: comment._id,
      });
    } catch (notifErr) {
      console.error(
        "Failed to create comment notification:",
        notifErr
      );
    }
  }

  return commentObj;
};

// Service: Get Comments
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
    .sort({
      createdAt: 1,
    });

  return buildCommentTree(
    allComments,
    userId
  );
};

// Service: Delete Comment
export const deleteCommentService = async ({
  commentId,
  userId,
}) => {
  const comment = await Comment.findById(commentId);

  if (!comment) {
  throw new NotFoundError("Comment not found");
}

  if (
    comment.user.toString() !==
    userId.toString()
  ) {
    throw new ForbiddenError(
      "You can only delete your own comments"
    );
  }

  // Remove replies so they don't become
  // orphaned after the parent is deleted.
  await Comment.deleteMany({
    parentComment: commentId,
  });

  await Comment.findByIdAndDelete(commentId);

  return true;
};

// Service: Update Comment
export const updateCommentService = async ({
  commentId,
  userId,
  content,
}) => {
  const comment = await Comment.findById(commentId);

 if (!comment) {
  throw new NotFoundError("Comment not found");
}

  if (
    comment.user.toString() !==
    userId.toString()
  ) {
    throw new ForbiddenError(
      "You can only edit your own comments"
    );
  }

  comment.content = content.trim();

  await comment.save();

  const populatedComment =
    await comment.populate(
      "user",
      "name handle avatar"
    );

  const commentObj =
    populatedComment.toObject({
      virtuals: true,
    });

  commentObj.myReaction =
    populatedComment.getUserReaction(userId);

  return commentObj;
};

// Service: React to Comment
export const reactToCommentService = async ({
  commentId,
  userId,
  emoji,
  canViewPostWithOriginal,
}) => {
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

  const existingIndex =
    comment.reactions.findIndex(
      (r) =>
        r.user.toString() ===
        userId.toString()
    );

  let myReaction = emoji;

  if (existingIndex !== -1) {
    const existing =
      comment.reactions[existingIndex];

    if (existing.emoji === emoji) {
      // Clicking the same emoji again removes the reaction.
      comment.reactions.splice(
        existingIndex,
        1
      );

      myReaction = null;
    } else {
      // Change existing reaction.
      existing.emoji = emoji;
    }
  } else {
    // Add new reaction.
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

// Service: Repost / Remove Repost
export const repostService = async ({
  postId,
  userId,
  canViewPost,
}) => {
  // 1. Find the original post
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

    return {
      reposted: false,
    };
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

  return {
    reposted: true,
    post: newRepost,
  };
};

// Service: Save Post
export const savePostService = async ({
  postId,
  userId,
  canViewPostWithOriginal,
}) => {
  // 1. Find the post
  const post = await Post.findById(postId);

  if (!post) {
  throw new NotFoundError("Post not found");
}

  // 2. User must be able to view the post
  const allowed = await canViewPostWithOriginal(
    post,
    userId
  );

  if (!allowed) {
    throw new ForbiddenError(
      "You do not have permission to save this post"
    );
  }

  // 3. Find user
  const user = await User.findById(userId);

  if (!user) {
  throw new NotFoundError("User not found");
}

  // 4. Check whether post is already saved
  const alreadySaved = user.savedPosts.some(
    (id) =>
      id.toString() === postId.toString()
  );

  // 5. Save only if not already saved
  if (!alreadySaved) {
    user.savedPosts.push(postId);

    await user.save();
  }

  return {
    saved: true,
  };
};

// Service: Unsave Post
export const unsavePostService = async ({
  postId,
  userId,
}) => {
  // 1. Find user
  const user = await User.findById(userId);

  if (!user) {
  throw new NotFoundError("User not found");
}

  // 2. Remove post from savedPosts
  user.savedPosts = user.savedPosts.filter(
    (id) =>
      id.toString() !== postId.toString()
  );

  await user.save();

  return {
    saved: false,
  };
};

// Service: Hide Post
export const hidePostService = async ({
  postId,
  userId,
}) => {
  const user = await User.findById(userId);

  if (!user) {
  throw new NotFoundError("User not found");
}

  const alreadyHidden = user.hiddenPosts.some(
    (id) =>
      id.toString() === postId.toString()
  );

  if (!alreadyHidden) {
    user.hiddenPosts.push(postId);

    await user.save();
  }

  return {
    hidden: true,
  };
};

// Service: Unhide Post
export const unhidePostService = async ({
  postId,
  userId,
}) => {
  const user = await User.findById(userId);

 if (!user) {
  throw new NotFoundError("User not found");
}

  user.hiddenPosts = user.hiddenPosts.filter(
    (id) =>
      id.toString() !== postId.toString()
  );

  await user.save();

  return {
    hidden: false,
  };
};

export const reportPostService = async ({
  postId,
  userId,
  reason,
}) => {
  const post = await Post.findById(postId);

  if (!post) {
  throw new NotFoundError("Post not found");
}

  const report = await Report.create({
    post: postId,
    reporter: userId,
    reason,
    status: "pending",
    createdAt: new Date(),
  });

  return {
    report,
  };
};

// Service: Track Share
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

  post.shareCount =
    (post.shareCount || 0) + 1;

  await post.save();

  return {
    shareCount: post.shareCount,
  };
};