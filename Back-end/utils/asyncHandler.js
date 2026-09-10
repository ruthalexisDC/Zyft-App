/**
 * utils/asyncHandler.js
 *
 * Wraps an async controller so any thrown error (including a rejected
 * promise from an awaited call) is forwarded to next(err) automatically,
 * instead of every controller needing its own try/catch.
 *
 * Before:
 *   export const getPost = async (req, res) => {
 *     try {
 *       ...
 *     } catch (error) {
 *       res.status(500).json({ message: '...' });
 *     }
 *   };
 *
 * After:
 *   export const getPost = asyncHandler(async (req, res) => {
 *     const post = await Post.findById(req.params.postId);
 *     if (!post) throw new NotFoundError('Post not found');
 *     res.success(post);
 *   });
 */
export function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}