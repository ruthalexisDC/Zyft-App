
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import {
  BadRequestError,
  UnauthorizedError,
} from '../errors/ApiError.js';
import User from "../models/User.js";
import { REACTION_EMOJIS } from '../models/Comments.js';


//Service 
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
// REFACTORED: CREATE POST
// ─────────────────────────────────────────
  export const createPost = asyncHandler(async (req, res) => {
  const { content, workout, media, visibility } = req.body;
  const userId = req.user._id;

  if (!userId) {
    throw new UnauthorizedError("Authentication required");
  }

  if (!content && !workout && !media) {
    throw new BadRequestError(
      "Post must contain content, workout, or media"
    );
  }

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

  const {
    page = 1,
    limit = 10,
    type = "community",
  } = req.query;

  const pageNumber = Math.max(
    parseInt(page) || 1,
    1
  );

  const limitNumber = Math.min(
    Math.max(parseInt(limit) || 10, 1),
    50
  );

  const result = await getFeedService({
    userId,
    pageNumber,
    limitNumber,
    type,
    canViewPostWithOriginal,
  });

  return sendSuccess(res, {
    data: {
      posts: result.posts,
      pagination: result.pagination,
    },
  });
});

// ─────────────────────────────────────────
// GET SINGLE POST
// ─────────────────────────────────────────
export const getPost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
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

  const result = await getUserPostsService({
    userId,
    currentUserId,
    pageNumber,
    limitNumber,
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
  const EDITABLE_FIELDS = [
    "content",
    "media",
    "visibility",
  ];

  const updates = {};

  for (const field of EDITABLE_FIELDS) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  const updatedPost = await updatePostService({
    postId: req.params.postId,
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
  const { postId } = req.params;

  await deletePostService({
    postId,
    userId: req.user._id,
  });

  return res.status(204).send();
});

// ─────────────────────────────────────────
// GIVE RESPECT (like)
// ─────────────────────────────────────────
// Service: Give / Remove Respect
  export const giveRespect = asyncHandler(async (req, res) => {
  const { postId } = req.params;

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
// GET RESPECTS (who liked this post)
// ─────────────────────────────────────────
export const getRespects = asyncHandler(async (req, res) => {
  const { postId } = req.params;

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
  const { postId } = req.params;
  const { content, parentComment } = req.body;

  const userId = req.user._id;

  if (
    !content ||
    content.trim().length === 0
  ) {
    throw new BadRequestError(
      "Comment content is required",
      [
        {
          field: "content",
          message: "Comment content is required",
        },
      ]
    );
  }

  const comment = await addCommentService({
    postId,
    userId,
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
  const { postId } = req.params;

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
  const { commentId } = req.params;

  await deleteCommentService({
    commentId,
    userId: req.user._id,
  });

  return res.status(204).send();
});

// ─────────────────────────────────────────
// UPDATE COMMENT
// ─────────────────────────────────────────
export const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  const userId = req.user._id;

  if (
    !content ||
    content.trim().length === 0
  ) {
    throw new BadRequestError(
      "Comment content is required",
      [
        {
          field: "content",
          message: "Comment content is required",
        },
      ]
    );
  }

  const comment =
    await updateCommentService({
      commentId,
      userId,
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
  const { commentId } = req.params;
  const { emoji } = req.body;
  const userId = req.user._id;

  if (!REACTION_EMOJIS.includes(emoji)) {
    throw new BadRequestError("Invalid reaction emoji");
  }

  const result = await reactToCommentService({
    commentId,
    userId,
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
  const { postId } = req.params;
  const userId = req.user._id;

  const result = await repostService({
    postId,
    userId,
    canViewPost,
  });


  return sendSuccess(res, {
    statusCode: result.reposted ? 201 : 200,
    data: {
      reposted: result.reposted,
      ...(result.post && {
        post: result.post,
      }),
    },
  });
});

  // Get Saved Posts
export const getSavedPosts = asyncHandler(
  async (req, res) => {
    const userId = req.user._id;

    const pageNumber = Math.max(
      parseInt(req.query.page, 10) || 1,
      1
    );

    const limitNumber = Math.min(
      Math.max(
        parseInt(req.query.limit, 10) || 20,
        1
      ),
      50
    );

    const result =
      await getSavedPostsService({
        userId,
        pageNumber,
        limitNumber,
        canViewPostWithOriginal,
      });

    return sendSuccess(res, {
      data: result.posts,
      pagination: result.pagination,
    });
  }
);

// ─────────────────────────────────────────
// SAVE
// ─────────────────────────────────────────
export const savePost = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { postId } = req.params;

  const result = await savePostService({
    postId,
    userId,
    canViewPostWithOriginal,
  });

  return sendSuccess(res, {
    data: {
      saved: result.saved,
    },
  });
});

// ─────────────────────────────────────────
// UNSAVE
// ─────────────────────────────────────────
export const unsavePost = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { postId } = req.params;

  const result = await unsavePostService({
    postId,
    userId,
  });


  return sendSuccess(res, {
    data: {
      saved: result.saved,
    },
  });
});


// ─────────────────────────────────────────
// HIDE
// ─────────────────────────────────────────
export const hidePost = asyncHandler(async (req, res) => {
  const result = await hidePostService({
    postId: req.params.postId,
    userId: req.user._id,
  });



  return sendSuccess(res, {
    data: {
      hidden: result.hidden,
    },
  });
});

// ─────────────────────────────────────────
// UNHIDE
// ─────────────────────────────────────────
export const unhidePost = asyncHandler(async (req, res) => {
  const result = await unhidePostService({
    postId: req.params.postId,
    userId: req.user._id,
  });

  return sendSuccess(res, {
    data: {
      hidden: result.hidden,
    },
  });
});

// ─────────────────────────────────────────
// REPORT
// ─────────────────────────────────────────
export const reportPost = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const result = await reportPostService({
    postId: req.params.postId,
    userId: req.user._id,
    reason,
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
  const result = await trackShareService({
    postId: req.params.postId,
    userId: req.user._id,
    canViewPostWithOriginal,
  });

  return sendSuccess(res, {
    data: {
      shareCount: result.shareCount,
    },
  });
});