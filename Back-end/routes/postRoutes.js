
// routes/postRoutes.js
import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  createPost, getFeed, getPost, getUserPosts,
  updatePost, deletePost, giveRespect, getRespects,
  addComment, getComments, deleteComment, repost, updateComment, reactToComment,
  // ── NEW: interaction controllers ──
  savePost, unsavePost, hidePost, unhidePost, reportPost, trackShare
} from '../controllers/postController.js';
import authenticate from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please slow down!',
});

router.use(rateLimiter);

// ── Feed ──
router.get('/feed', getFeed);

// ── Post CRUD ──
router.post('/', createPost);
router.get('/user/:userId', getUserPosts);

// ── Comments ──
router.get('/:postId/comments', getComments);
router.post('/:postId/comments', addComment);
router.delete('/:postId/comments/:commentId', deleteComment);
router.put('/:postId/comments/:commentId', updateComment);
router.post('/:postId/comments/:commentId/react', reactToComment); 

// ── Single Post ──
router.get('/:postId', getPost);
router.put('/:postId', updatePost);
router.patch('/:postId', updatePost);
router.delete('/:postId', deletePost);

// ── Interactions ──
router.post('/:postId/respect', giveRespect);
router.get('/:postId/respects', getRespects);
router.post('/:postId/repost', repost);

// ── NEW: Favorites / Save ──
router.post('/:postId/save', savePost);
router.delete('/:postId/save', unsavePost);

// ── NEW: Hide / Not Interested ──
router.post('/:postId/hide', hidePost);
router.delete('/:postId/hide', unhidePost);

// ── NEW: Report ──
router.post('/:postId/report', reportPost);

// ── NEW: Share tracking ──
router.post('/:postId/share', trackShare);

export default router;

