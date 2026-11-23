import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import User from "../models/User.js";
import Post from "../models/Post.js";

// Services
import {
  createPostService,
  getFeedService,
  getPostService,
  getUserPostsService,
  updatePostService,
  deletePostService,
  giveRespectService,
  getRespectsService,
  addCommentService,
  getCommentsService,
  deleteCommentService,
  updateCommentService,
  reactToCommentService,
  repostService,
  getSavedPostsService,
  savePostService,
  unsavePostService,
  hidePostService,
  unhidePostService,
  reportPostService,
  trackShareService,
} from "../services/postService.js";

// ─────────────────────────────────────────
// POST VISIBILITY
// ─────────────────────────────────────────

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

  // Followers-only → viewer must follow original author
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

// ─────────────────────────────────────────
// POST VISIBILITY + ORIGINAL POST
// ─────────────────────────────────────────


const canViewPostWithOriginal = async (post, viewerId) => {
  if (!post || !viewerId) {
    return false;
  }

  // Check whether the viewer can access the requested post.
  const canViewRequestedPost = await canViewPost(
    post,
    viewerId
  );

  if (!canViewRequestedPost) {
    return false;
  }

  // A normal post does not require an additional check.
  if (!post.isRepost) {
    return true;
  }

  // A repost must reference an original post.
  const originalPostId =
    post.originalPost?._id ?? post.originalPost;

  if (!originalPostId) {
    return false;
  }

  // Use the populated original when available.
  // Otherwise, fetch the original document from MongoDB.
  const originalPost =
    post.originalPost?.visibility != null
      ? post.originalPost
      : await Post.findById(originalPostId);

  if (!originalPost) {
    return false;
  }

  // The viewer must be allowed to see the original too.
  return canViewPost(originalPost, viewerId);
};

// ─────────────────────────────────────────
// CREATE POST
// ─────────────────────────────────────────

export const createPost = asyncHandler(async (req, res) => {
  const {
    content,
    workout,
    media,
    visibility,
  } = req.validated.body;

  const userId = req.user._id;

  const post = await createPostService({
    userId,
    content,
    workout,
    media,
    visibility,
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: "Post created successfully",
    data: post,
  });
});

// ─────────────────────────────────────────
// GET FEED
// ─────────────────────────────────────────


export const getFeed = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page, limit, type } = req.validated.query;

  const result = await getFeedService({
    userId,
    pageNumber: page,
    limitNumber: limit,
    type,
    canViewPostWithOriginal,
  });

  return sendSuccess(res, {
    data: {
      posts: result.posts,
      pagination: result.pagination,
    },
    pagination: result.pagination,
  });
});

// ─────────────────────────────────────────
// GET SINGLE POST
// ─────────────────────────────────────────

export const getPost = asyncHandler(async (req, res) => {
  const { postId } = req.validated.params;
  const userId = req.user._id;

  const result = await getPostService({
    postId,
    userId,
    canViewPostWithOriginal,
  });

  return sendSuccess(res, {
    data: result,
  });
});

// ─────────────────────────────────────────
// GET USER'S POSTS
// ─────────────────────────────────────────


export const getUserPosts = asyncHandler(async (req, res) => {
  const { userId } = req.validated.params;
  const { page, limit } = req.validated.query;
  const currentUserId = req.user._id;

  const result = await getUserPostsService({
    userId,
    currentUserId,
    pageNumber: page,
    limitNumber: limit,
    canViewPostWithOriginal,
  });

  return sendSuccess(res, {
    data: result.posts,
    pagination: result.pagination,
  });
});


// ─────────────────────────────────────────
// UPDATE POST
// ─────────────────────────────────────────

export const updatePost = asyncHandler(async (req, res) => {
  const { postId } = req.validated.params;
  const updates = req.validated.body;



  const updatedPost = await updatePostService({
    postId,
    userId: req.user._id,
    updates,
  });

  return sendSuccess(res, {
    data: updatedPost,
  });
});

// ─────────────────────────────────────────
// DELETE POST
// ─────────────────────────────────────────

export const deletePost = asyncHandler(async (req, res) => {
  const { postId } = req.validated.params;

  await deletePostService({
    postId,
    userId: req.user._id,
  });

  return res.status(204).send();
});

// ─────────────────────────────────────────
// GIVE RESPECT
// ─────────────────────────────────────────

export const giveRespect = asyncHandler(async (req, res) => {
  const { postId } = req.validated.params;

  const result = await giveRespectService({
    postId,
    userId: req.user._id,
    canViewPostWithOriginal,
  });

  return sendSuccess(res, {
    data: result,
  });
});

// ─────────────────────────────────────────
// GET RESPECTS
// ─────────────────────────────────────────

export const getRespects = asyncHandler(async (req, res) => {
  const { postId } = req.validated.params;

  const users = await getRespectsService({
    postId,
    currentUserId: req.user._id,
    canViewPostWithOriginal,
  });

  return sendSuccess(res, {
    data: users,
  });
});

// ─────────────────────────────────────────
// ADD COMMENT
// ─────────────────────────────────────────

export const addComment = asyncHandler(async (req, res) => {
  const { postId } = req.validated.params;

  const {
    content,
    parentComment,
  } = req.validated.body;

  const comment = await addCommentService({
    postId,
    userId: req.user._id,
    content,
    parentComment,
    canViewPostWithOriginal,
  });

  return sendSuccess(res, {
    statusCode: 201,
    data: comment,
  });
});

// ─────────────────────────────────────────
// GET COMMENTS
// ─────────────────────────────────────────

export const getComments = asyncHandler(async (req, res) => {
  const { postId } = req.validated.params;

  const comments = await getCommentsService({
    postId,
    userId: req.user._id,
    canViewPostWithOriginal,
  });

  return sendSuccess(res, {
    data: comments,
  });
});

// ─────────────────────────────────────────
// DELETE COMMENT
// ─────────────────────────────────────────

export const deleteComment = asyncHandler(async (req, res) => {
  const { postId, commentId } = req.validated.params;

  await deleteCommentService({
    postId,
    commentId,
    userId: req.user._id,
  });

  return res.status(204).send();
});

// ─────────────────────────────────────────
// UPDATE COMMENT
// ─────────────────────────────────────────

export const updateComment = asyncHandler(async (req, res) => {
  const { postId, commentId } = req.validated.params;
  const { content } = req.validated.body;

  const comment = await updateCommentService({
    postId,
    commentId,
    userId: req.user._id,
    content,
  });

  return sendSuccess(res, {
    data: comment,
  });
});

// ─────────────────────────────────────────
// REACT TO COMMENT
// ─────────────────────────────────────────

export const reactToComment = asyncHandler(async (req, res) => {
  const { postId, commentId } = req.validated.params;
  const { emoji } = req.validated.body;

  const result = await reactToCommentService({
    postId,
    commentId,
    userId: req.user._id,
    emoji,
    canViewPostWithOriginal,
  });

  return sendSuccess(res, {
    data: {
      reactionSummary: result.reactionSummary,
      myReaction: result.myReaction,
    },
  });
});

// ─────────────────────────────────────────
// REPOST
// ─────────────────────────────────────────


export const repost = asyncHandler(async (req, res) => {
  const { postId } = req.validated.params;

  const result = await repostService({
    postId,
    userId: req.user._id,
    canViewPost,
  });

  return sendSuccess(res, {
    statusCode: result.reposted ? 201 : 200,
    data: {
      reposted: result.reposted,
      repostCount: result.repostCount,
      ...(result.post && {
        post: result.post,
      }),
    },
  });
});


// ─────────────────────────────────────────
// GET SAVED POSTS
// ─────────────────────────────────────────


export const getSavedPosts = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page, limit } = req.validated.query;

  const result = await getSavedPostsService({
    userId,
    pageNumber: page,
    limitNumber: limit,
    canViewPostWithOriginal,
  });

  return sendSuccess(res, {
    data: result.posts,
    pagination: result.pagination,
  });
});


// ─────────────────────────────────────────
// SAVE POST
// ─────────────────────────────────────────

export const savePost = asyncHandler(async (req, res) => {
  const { postId } = req.validated.params;

  const result = await savePostService({
    postId,
    userId: req.user._id,
    canViewPostWithOriginal,
  });

  return sendSuccess(res, {
    data: {
      saved: result.saved,
    },
  });
});

// ─────────────────────────────────────────
// UNSAVE POST
// ─────────────────────────────────────────

export const unsavePost = asyncHandler(async (req, res) => {
  const { postId } = req.validated.params;

  const result = await unsavePostService({
    postId,
    userId: req.user._id,
  });

  return sendSuccess(res, {
    data: {
      saved: result.saved,
    },
  });
});

// ─────────────────────────────────────────
// HIDE POST
// ─────────────────────────────────────────

export const hidePost = asyncHandler(async (req, res) => {
  const { postId } = req.validated.params;

  const result = await hidePostService({
    postId,
    userId: req.user._id,
  });

  return sendSuccess(res, {
    data: {
      hidden: result.hidden,
    },
  });
});

// ─────────────────────────────────────────
// UNHIDE POST
// ─────────────────────────────────────────

export const unhidePost = asyncHandler(async (req, res) => {
  const { postId } = req.validated.params;

  const result = await unhidePostService({
    postId,
    userId: req.user._id,
  });

  return sendSuccess(res, {
    data: {
      hidden: result.hidden,
    },
  });
});

// ─────────────────────────────────────────
// REPORT POST
// ─────────────────────────────────────────

export const reportPost = asyncHandler(async (req, res) => {
  const { postId } = req.validated.params;
  const { reason } = req.validated.body;

  const result = await reportPostService({
  postId,
  userId: req.user._id,
  reason,
  canViewPostWithOriginal,
});

  return sendSuccess(res, {
    statusCode: 201,
    data: result.report,
  });
});

// ─────────────────────────────────────────
// SHARE TRACKING
// ─────────────────────────────────────────

export const trackShare = asyncHandler(async (req, res) => {
  const { postId } = req.validated.params;

  const result = await trackShareService({
    postId,
    userId: req.user._id,
    canViewPostWithOriginal,
  });

  return sendSuccess(res, {
    data: {
      shareCount: result.shareCount,
    },
  });
});