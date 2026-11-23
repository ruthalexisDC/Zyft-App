
// routes/postRoutes.js

import express from "express";
import rateLimit from "express-rate-limit";

import {
  createPost,
  getFeed,
  getPost,
  getUserPosts,
  getSavedPosts,
  updatePost,
  deletePost,
  giveRespect,
  getRespects,
  addComment,
  getComments,
  deleteComment,
  repost,
  updateComment,
  reactToComment,
  savePost,
  unsavePost,
  hidePost,
  unhidePost,
  reportPost,
  trackShare,
} from "../controllers/postController.js";

import authenticate from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";

import {
  PostWorkoutSchema,
  postIdParamSchema,
  userPostsSchema,
  commentParamsSchema,
  createCommentSchema,
  updateCommentSchema,
  reactToCommentSchema,
  updatePostSchema,
  reportPostSchema,
  feedQuerySchema,
  savedPostsQuerySchema,
} from "../validators/postValidators.js";

const router = express.Router();

// ─────────────────────────────────────────
// AUTHENTICATION
// ─────────────────────────────────────────

router.use(authenticate);

// ─────────────────────────────────────────
// RATE LIMITING
// ─────────────────────────────────────────

const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, please slow down!",
});

router.use(rateLimiter);

// ─────────────────────────────────────────
// FEED
// ─────────────────────────────────────────

router.get(
  "/feed",
  validate(feedQuerySchema),
  getFeed
);

// ─────────────────────────────────────────
// POST CRUD
// ─────────────────────────────────────────

// Create post
router.post(
  "/",
  validate(PostWorkoutSchema),
  createPost
);

// Get posts by user
router.get(
  "/user/:userId",
   validate(userPostsSchema),
  getUserPosts
);

// Get saved posts
// router.get(
//   "/saved",
//   validate(savedPostsQuerySchema),
//   getSavedPosts
// );

router.get(
  "/saved",
  validate(savedPostsQuerySchema),
  getSavedPosts
);

// ─────────────────────────────────────────
// COMMENTS
// ─────────────────────────────────────────

// Create comment
router.post(
  "/:postId/comments",
  validate(createCommentSchema),
  addComment
);

// Get comments
router.get(
  "/:postId/comments",
  validate(postIdParamSchema),
  getComments
);

// Delete comment
router.delete(
  "/:postId/comments/:commentId",
  validate(commentParamsSchema),
  deleteComment
);

// Update comment
router.patch(
  "/:postId/comments/:commentId",
  validate(updateCommentSchema),
  updateComment
);

// React to comment
router.post(
  "/:postId/comments/:commentId/react",
  validate(reactToCommentSchema),
  reactToComment
);

// ─────────────────────────────────────────
// SINGLE POST
// ─────────────────────────────────────────

// Get single post
router.get(
  "/:postId",
  validate(postIdParamSchema),
  getPost
);

// Update post
router.patch(
  "/:postId",
  validate(updatePostSchema),
  updatePost
);

// Delete post
router.delete(
  "/:postId",
  validate(postIdParamSchema),
  deletePost
);

// ─────────────────────────────────────────
// INTERACTIONS
// ─────────────────────────────────────────

// Give respect
router.post(
  "/:postId/respect",
  validate(postIdParamSchema),
  giveRespect
);

// Get respects
router.get(
  "/:postId/respects",
  validate(postIdParamSchema),
  getRespects
);

// Repost
router.post(
  "/:postId/repost",
  validate(postIdParamSchema),
  repost
);

// ─────────────────────────────────────────
// SAVE / FAVORITES
// ─────────────────────────────────────────

// Save post
router.post(
  "/:postId/save",
  validate(postIdParamSchema),
  savePost
);

// Unsave post
router.delete(
  "/:postId/save",
  validate(postIdParamSchema),
  unsavePost
);

// ─────────────────────────────────────────
// HIDE / NOT INTERESTED
// ─────────────────────────────────────────

// Hide post
router.post(
  "/:postId/hide",
  validate(postIdParamSchema),
  hidePost
);

// Unhide post
router.delete(
  "/:postId/hide",
  validate(postIdParamSchema),
  unhidePost
);

// ─────────────────────────────────────────
// REPORT
// ─────────────────────────────────────────

router.post(
  "/:postId/report",
  validate(reportPostSchema),
  reportPost
);

// ─────────────────────────────────────────
// SHARE TRACKING
// ─────────────────────────────────────────

router.post(
  "/:postId/share",
  validate(postIdParamSchema),
  trackShare
);

export default router;