// import Post from '../models/Post.js';
// import User from '../models/User.js';
// import Comment, { REACTION_EMOJIS } from '../models/Comments.js';
// import Report from '../models/Report.js';

// // ─────────────────────────────────────────
// // CREATE POST
// // ─────────────────────────────────────────
// export const createPost = async (req, res) => {
//   try {
//     const { content, workout, media } = req.body;
//     const userId = req.user?._id || req.body.user;

//     if (!userId) {
//       return res.status(401).json({ message: 'User authentication required' });
//     }

//     if (!content || content.trim().length === 0) {
//       return res.status(400).json({ message: 'Post content is required' });
//     }

//     const post = await Post.create({
//       user: userId,
//       content: content.trim(),
//       workout: workout || undefined,
//       media: media || [],
//     });

//     await post.populate('user', 'name handle avatar');

//     res.status(201).json({
//       success: true,
//       post,
//     });
//   } catch (error) {
//     console.error('Create post error:', error);
//     res.status(500).json({ message: 'Failed to create post', error: error.message });
//   }
// };

// // ─────────────────────────────────────────
// // GET FEED
// // ─────────────────────────────────────────
// export const getFeed = async (req, res) => {
//   try {
//     const userId = req.user._id;
//     const { page = 1, limit = 10, type = 'community' } = req.query;

//     const skip = (parseInt(page) - 1) * parseInt(limit);

//     // Always fetch following list — used both to filter the "following" feed
//     // AND to set isFollowing on every post author regardless of feed type.
//     const currentUser = await User.findById(userId).select('following');
//     const followingIds = (currentUser?.following ?? []).map((id) => id.toString());

//     let query = {};

//     if (type === 'following') {
//       const feedUserIds = [...followingIds, userId.toString()];
//       query = { user: { $in: feedUserIds } };
//     } else {
//       query = { visibility: 'public' };
//     }

//     const posts = await Post.find(query)
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(parseInt(limit))
//       .populate('user', 'name handle avatar')
//       .lean();

//     const postsWithData = await Promise.all(
//       posts.map(async (post) => {
//         const commentCount = await Comment.countDocuments({ post: post._id });
//         const isOwnPost = post.user?._id?.toString() === userId.toString();
//         return {
//           ...post,
//           respectCount: post.respects?.length || 0,
//           commentCount,
//           didRespect:
//             post.respects?.some((r) => r.toString() === userId.toString()) ||
//             false,
//           user: post.user
//             ? {
//                 ...post.user,
//                 isFollowing: isOwnPost
//                   ? false
//                   : followingIds.includes(post.user._id.toString()),
//               }
//             : post.user,
//         };
//       })
//     );

//     const total = await Post.countDocuments(query);

//     res.json({
//       success: true,
//       posts: postsWithData,
//       pagination: {
//         page: parseInt(page),
//         pages: Math.ceil(total / parseInt(limit)),
//         total,
//       },
//     });
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to load feed', error: error.message });
//   }
// };

// // ─────────────────────────────────────────
// // GET SINGLE POST
// // ─────────────────────────────────────────
// export const getPost = async (req, res) => {
//   try {
//     const { postId } = req.params;
//     const userId = req.user._id;

//     const post = await Post.findById(postId)
//       .populate('user', 'name handle avatar')
//       .populate('originalPost');

//     if (!post) {
//       return res.status(404).json({ message: 'Post not found' });
//     }

//     const comments = await Comment.find({ post: postId })
//       .populate('user', 'name handle avatar')
//       .sort({ createdAt: -1 });

//     const commentsWithReactions = comments.map((comment) => {
//       const obj = comment.toObject({ virtuals: true });
//       obj.myReaction = comment.getUserReaction(userId);
//       return obj;
//     });

//     res.json({
//       success: true,
//       post: {
//         ...post.toObject(),
//         didRespect: post.didUserRespect(userId),
//         comments: commentsWithReactions,
//         commentCount: commentsWithReactions.length,
//       },
//     });
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to get post', error: error.message });
//   }
// };

// // ─────────────────────────────────────────
// // GET USER'S POSTS
// // ─────────────────────────────────────────
// export const getUserPosts = async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const { page = 1, limit = 10 } = req.query;
//     const currentUserId = req.user._id;

//     const skip = (parseInt(page) - 1) * parseInt(limit);

//     const posts = await Post.find({ user: userId })
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(parseInt(limit))
//       .populate('user', 'name handle avatar')
//       .populate('workout')
//       .lean();

//     const postsWithData = await Promise.all(
//       posts.map(async (post) => {
//         const commentCount = await Comment.countDocuments({ post: post._id });
//         return {
//           ...post,
//           respectCount: post.respects?.length || 0,
//           commentCount,
//           didRespect:
//             post.respects?.some(
//               (r) => r.toString() === currentUserId?.toString()
//             ) || false,
//         };
//       })
//     );

//     const totalPosts = await Post.countDocuments({ user: userId });

//     res.json({
//       success: true,
//       posts: postsWithData,
//       pagination: {
//         currentPage: parseInt(page),
//         totalPages: Math.ceil(totalPosts / parseInt(limit)),
//         totalPosts,
//         hasMore: skip + posts.length < totalPosts,
//       },
//     });
//   } catch (error) {
//     console.error('Get user posts error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to get user posts',
//       error: error.message,
//     });
//   }
// };

// // ─────────────────────────────────────────
// // UPDATE POST
// // ─────────────────────────────────────────
// export const updatePost = async (req, res) => {
//   try {
//     const post = await Post.findById(req.params.postId);

//     if (!post) {
//       return res.status(404).json({ message: 'Post not found' });
//     }

//     if (post.user.toString() !== req.user._id.toString()) {
//       return res.status(403).json({ message: 'Not authorized to update this post' });
//     }

//     const updatedPost = await Post.findByIdAndUpdate(
//       req.params.postId,
//       { $set: req.body },
//       { new: true, runValidators: true }
//     );

//     res.status(200).json({
//       success: true,
//       message: 'Post updated successfully',
//       post: updatedPost,
//     });
//   } catch (error) {
//     console.error('Update post error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to update post',
//       error: error.message,
//     });
//   }
// };

// // ─────────────────────────────────────────
// // DELETE POST
// // ─────────────────────────────────────────
// export const deletePost = async (req, res) => {
//   try {
//     const { postId } = req.params;
//     const userId = req.user._id;

//     const post = await Post.findById(postId);

//     if (!post) {
//       return res.status(404).json({ success: false, message: 'Post not found' });
//     }

//     if (post.user.toString() !== userId.toString()) {
//       return res.status(403).json({
//         success: false,
//         message: 'You can only delete your own posts',
//       });
//     }

//     await Comment.deleteMany({ post: postId });
//     await Post.findByIdAndDelete(postId);

//     res.status(200).json({ success: true, message: 'Post deleted successfully' });
//   } catch (error) {
//     console.error('Delete post error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to delete post',
//       error: error.message,
//     });
//   }
// };

// // ─────────────────────────────────────────
// // GIVE RESPECT (like)
// // ─────────────────────────────────────────
// export const giveRespect = async (req, res) => {
//   try {
//     const { postId } = req.params;
//     const userId = req.user._id;

//     const post = await Post.findById(postId);

//     if (!post) {
//       return res.status(404).json({ message: 'Post not found' });
//     }

//     const alreadyRespected = post.respects.some(
//       (r) => r.toString() === userId.toString()
//     );

//     if (alreadyRespected) {
//       post.respects = post.respects.filter(
//         (r) => r.toString() !== userId.toString()
//       );
//     } else {
//       post.respects.push(userId);
//     }

//     await post.save();

//     res.json({
//       success: true,
//       respected: !alreadyRespected,
//       respectCount: post.respects.length,
//     });
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to give respect', error: error.message });
//   }
// };

// // ─────────────────────────────────────────
// // GET COMMENTS
// // ─────────────────────────────────────────
// export const getComments = async (req, res) => {
//   try {
//     const { postId } = req.params;
//     const userId = req.user._id;

//     const post = await Post.findById(postId);
//     if (!post) {
//       return res.status(404).json({ message: 'Post not found' });
//     }

//     const comments = await Comment.find({ post: postId })
//       .populate('user', 'name handle avatar')
//       .sort({ createdAt: -1 });

//     const commentsWithReactions = comments.map((comment) => {
//       const obj = comment.toObject({ virtuals: true });
//       obj.myReaction = comment.getUserReaction(userId);
//       return obj;
//     });

//     res.json({ success: true, comments: commentsWithReactions });
//   } catch (error) {
//     console.error('Get comments error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to get comments',
//       error: error.message,
//     });
//   }
// };

// // ─────────────────────────────────────────
// // ADD COMMENT
// // ─────────────────────────────────────────
// export const addComment = async (req, res) => {
//   try {
//     const { postId } = req.params;
//     const { content } = req.body;
//     const userId = req.user._id;

//     if (!content || content.trim().length === 0) {
//       return res.status(400).json({ success: false, message: 'Comment content is required' });
//     }

//     const post = await Post.findById(postId);
//     if (!post) {
//       return res.status(404).json({ success: false, message: 'Post not found' });
//     }

//     const comment = await Comment.create({
//       post: postId,
//       user: userId,
//       content: content.trim(),
//     });

//     await comment.populate('user', 'name handle avatar');

//     const commentObj = comment.toObject({ virtuals: true });
//     commentObj.myReaction = null;

//     res.status(201).json({ success: true, comment: commentObj });
//   } catch (error) {
//     console.error('Add comment error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to add comment',
//       error: error.message,
//     });
//   }
// };

// // ─────────────────────────────────────────
// // DELETE COMMENT
// // ─────────────────────────────────────────
// export const deleteComment = async (req, res) => {
//   try {
//     const { commentId } = req.params;
//     const userId = req.user._id;

//     const comment = await Comment.findById(commentId);

//     if (!comment) {
//       return res.status(404).json({ message: 'Comment not found' });
//     }

//     if (comment.user.toString() !== userId.toString()) {
//       return res.status(403).json({ message: 'You can only delete your own comments' });
//     }

//     await Comment.findByIdAndDelete(commentId);

//     res.json({ success: true, message: 'Comment deleted' });
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to delete comment', error: error.message });
//   }
// };

// // ─────────────────────────────────────────
// // UPDATE COMMENT
// // ─────────────────────────────────────────
// export const updateComment = async (req, res) => {
//   try {
//     const { commentId } = req.params;
//     const { content } = req.body;
//     const userId = req.user._id;

//     if (!content || content.trim().length === 0) {
//       return res.status(400).json({ message: 'Comment content is required' });
//     }

//     const comment = await Comment.findById(commentId);
//     if (!comment) {
//       return res.status(404).json({ message: 'Comment not found' });
//     }

//     if (comment.user.toString() !== userId.toString()) {
//       return res.status(403).json({ message: 'You can only edit your own comments' });
//     }

//     comment.content = content.trim();
//     await comment.save();

//     const populatedComment = await comment.populate('user', 'name handle avatar');
//     const commentObj = populatedComment.toObject({ virtuals: true });
//     commentObj.myReaction = populatedComment.getUserReaction(userId);

//     res.json({ success: true, comment: commentObj });
//   } catch (error) {
//     console.error('Update comment error:', error);
//     res.status(500).json({ message: 'Failed to update comment', error: error.message });
//   }
// };

// // ─────────────────────────────────────────
// // REACT TO COMMENT
// // ─────────────────────────────────────────
// export const reactToComment = async (req, res) => {
//   try {
//     const { commentId } = req.params;
//     const { emoji } = req.body;
//     const userId = req.user._id;

//     if (!REACTION_EMOJIS.includes(emoji)) {
//       return res.status(400).json({ message: 'Invalid reaction emoji' });
//     }

//     const comment = await Comment.findById(commentId);
//     if (!comment) {
//       return res.status(404).json({ message: 'Comment not found' });
//     }

//     const existingIndex = comment.reactions.findIndex(
//       (r) => r.user.toString() === userId.toString()
//     );

//     let myReaction = emoji;

//     if (existingIndex !== -1) {
//       const existing = comment.reactions[existingIndex];
//       if (existing.emoji === emoji) {
//         comment.reactions.splice(existingIndex, 1);
//         myReaction = null;
//       } else {
//         existing.emoji = emoji;
//       }
//     } else {
//       comment.reactions.push({ user: userId, emoji });
//     }

//     await comment.save();

//     res.json({ success: true, reactionSummary: comment.reactionSummary, myReaction });
//   } catch (error) {
//     console.error('React to comment error:', error);
//     res.status(500).json({ message: 'Failed to react to comment', error: error.message });
//   }
// };


import Post from '../models/Post.js';
import User from '../models/User.js';
import Comment, { REACTION_EMOJIS } from '../models/Comments.js';
import Report from '../models/Report.js';

// ─────────────────────────────────────────
// CREATE POST
// ─────────────────────────────────────────
export const createPost = async (req, res) => {
  try {
    const { content, workout, media } = req.body;
    const userId = req.user?._id || req.body.user;

    if (!userId) {
      return res.status(401).json({ message: 'User authentication required' });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Post content is required' });
    }

    const post = await Post.create({
      user: userId,
      content: content.trim(),
      workout: workout || undefined,
      media: media || [],
    });

    await post.populate('user', 'name handle avatar');

    res.status(201).json({
      success: true,
      post,
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Failed to create post', error: error.message });
  }
};

// ─────────────────────────────────────────
// GET FEED
// ─────────────────────────────────────────
export const getFeed = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, type = 'community' } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Always fetch following list — used both to filter the "following" feed
    // AND to set isFollowing on every post author regardless of feed type.
    const currentUser = await User.findById(userId).select('following');
    const followingIds = (currentUser?.following ?? []).map((id) => id.toString());

    let query = {};

    if (type === 'following') {
      const feedUserIds = [...followingIds, userId.toString()];
      query = { user: { $in: feedUserIds } };
    } else {
      query = { visibility: 'public' };
    }

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'name handle avatar')
      .lean();

    const postsWithData = await Promise.all(
      posts.map(async (post) => {
        const commentCount = await Comment.countDocuments({ post: post._id });
        const isOwnPost = post.user?._id?.toString() === userId.toString();
        return {
          ...post,
          respectCount: post.respects?.length || 0,
          commentCount,
          didRespect:
            post.respects?.some((r) => r.toString() === userId.toString()) ||
            false,
          user: post.user
            ? {
                ...post.user,
                isFollowing: isOwnPost
                  ? false
                  : followingIds.includes(post.user._id.toString()),
              }
            : post.user,
        };
      })
    );

    const total = await Post.countDocuments(query);

    res.json({
      success: true,
      posts: postsWithData,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load feed', error: error.message });
  }
};

// ─────────────────────────────────────────
// GET SINGLE POST
// ─────────────────────────────────────────
export const getPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId)
      .populate('user', 'name handle avatar')
      .populate('originalPost');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comments = await Comment.find({ post: postId })
      .populate('user', 'name handle avatar')
      .sort({ createdAt: -1 });

    const commentsWithReactions = comments.map((comment) => {
      const obj = comment.toObject({ virtuals: true });
      obj.myReaction = comment.getUserReaction(userId);
      return obj;
    });

    res.json({
      success: true,
      post: {
        ...post.toObject(),
        didRespect: post.didUserRespect(userId),
        comments: commentsWithReactions,
        commentCount: commentsWithReactions.length,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get post', error: error.message });
  }
};

// ─────────────────────────────────────────
// GET USER'S POSTS
// ─────────────────────────────────────────
export const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const currentUserId = req.user._id;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const posts = await Post.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'name handle avatar')
      .populate('workout')
      .lean();

    const postsWithData = await Promise.all(
      posts.map(async (post) => {
        const commentCount = await Comment.countDocuments({ post: post._id });
        return {
          ...post,
          respectCount: post.respects?.length || 0,
          commentCount,
          didRespect:
            post.respects?.some(
              (r) => r.toString() === currentUserId?.toString()
            ) || false,
        };
      })
    );

    const totalPosts = await Post.countDocuments({ user: userId });

    res.json({
      success: true,
      posts: postsWithData,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalPosts / parseInt(limit)),
        totalPosts,
        hasMore: skip + posts.length < totalPosts,
      },
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user posts',
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────
// UPDATE POST
// ─────────────────────────────────────────
export const updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this post' });
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

    res.status(200).json({
      success: true,
      message: 'Post updated successfully',
      post: updatedPost,
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update post',
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────
// DELETE POST
// ─────────────────────────────────────────
export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (post.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own posts',
      });
    }

    await Comment.deleteMany({ post: postId });
    await Post.findByIdAndDelete(postId);

    res.status(200).json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete post',
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────
// GIVE RESPECT (like)
// ─────────────────────────────────────────
export const giveRespect = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const alreadyRespected = post.respects.some(
      (r) => r.toString() === userId.toString()
    );

    if (alreadyRespected) {
      post.respects = post.respects.filter(
        (r) => r.toString() !== userId.toString()
      );
    } else {
      post.respects.push(userId);
    }

    await post.save();

    res.json({
      success: true,
      respected: !alreadyRespected,
      respectCount: post.respects.length,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to give respect', error: error.message });
  }
};

// ─────────────────────────────────────────
// GET RESPECTS (who liked this post)
// ─────────────────────────────────────────
export const getRespects = async (req, res) => {
  try {
    const { postId } = req.params;
    const currentUserId = req.user._id.toString();

    const post = await Post.findById(postId).populate(
      'respects',
      'name handle avatar bio followers'
    );

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const users = post.respects.map((u) => ({
      id: u._id,
      name: u.name,
      handle: `@${u.handle}`,
      avatar: u.avatar,
      bio: u.bio,
      isFollowing: u.followers?.some((id) => id.toString() === currentUserId) || false,
    }));

    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch respects', error: error.message });
  }
};

// ─────────────────────────────────────────
// GET COMMENTS
// ─────────────────────────────────────────
export const getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comments = await Comment.find({ post: postId })
      .populate('user', 'name handle avatar')
      .sort({ createdAt: -1 });

    const commentsWithReactions = comments.map((comment) => {
      const obj = comment.toObject({ virtuals: true });
      obj.myReaction = comment.getUserReaction(userId);
      return obj;
    });

    res.json({ success: true, comments: commentsWithReactions });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get comments',
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────
// ADD COMMENT
// ─────────────────────────────────────────
export const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Comment content is required' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const comment = await Comment.create({
      post: postId,
      user: userId,
      content: content.trim(),
    });

    await comment.populate('user', 'name handle avatar');

    const commentObj = comment.toObject({ virtuals: true });
    commentObj.myReaction = null;

    res.status(201).json({ success: true, comment: commentObj });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment',
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────
// DELETE COMMENT
// ─────────────────────────────────────────
export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user._id;

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You can only delete your own comments' });
    }

    await Comment.findByIdAndDelete(commentId);

    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete comment', error: error.message });
  }
};

// ─────────────────────────────────────────
// UPDATE COMMENT
// ─────────────────────────────────────────
export const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You can only edit your own comments' });
    }

    comment.content = content.trim();
    await comment.save();

    const populatedComment = await comment.populate('user', 'name handle avatar');
    const commentObj = populatedComment.toObject({ virtuals: true });
    commentObj.myReaction = populatedComment.getUserReaction(userId);

    res.json({ success: true, comment: commentObj });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ message: 'Failed to update comment', error: error.message });
  }
};

// ─────────────────────────────────────────
// REACT TO COMMENT
// ─────────────────────────────────────────
export const reactToComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    if (!REACTION_EMOJIS.includes(emoji)) {
      return res.status(400).json({ message: 'Invalid reaction emoji' });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
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

    res.json({ success: true, reactionSummary: comment.reactionSummary, myReaction });
  } catch (error) {
    console.error('React to comment error:', error);
    res.status(500).json({ message: 'Failed to react to comment', error: error.message });
  }
};

// ─────────────────────────────────────────
// REPOST
// ─────────────────────────────────────────
export const repost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const originalPost = await Post.findById(postId);
    if (!originalPost) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const alreadyReposted = await Post.findOne({
      user: userId,
      originalPost: postId,
      isRepost: true,
    });

    if (alreadyReposted) {
      await Post.findByIdAndDelete(alreadyReposted._id);
      return res.json({ success: true, reposted: false, message: 'Repost removed' });
    }

    const newRepost = await Post.create({
      user: userId,
      content: originalPost.content,
      isRepost: true,
      originalPost: postId,
      workout: originalPost.workout,
    });

    await newRepost.populate('user', 'name handle avatar');
    await newRepost.populate('originalPost');

    res.status(201).json({ success: true, reposted: true, post: newRepost });
  } catch (error) {
    res.status(500).json({ message: 'Failed to repost', error: error.message });
  }
};

// ─────────────────────────────────────────
// SAVE / UNSAVE
// ─────────────────────────────────────────
export const savePost = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.savedPosts.includes(req.params.postId)) {
      user.savedPosts.push(req.params.postId);
      await user.save();
    }
    res.json({ success: true, saved: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const unsavePost = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.savedPosts = user.savedPosts.filter(
      (id) => id.toString() !== req.params.postId
    );
    await user.save();
    res.json({ success: true, saved: false });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────
// HIDE / UNHIDE
// ─────────────────────────────────────────
export const hidePost = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.hiddenPosts.includes(req.params.postId)) {
      user.hiddenPosts.push(req.params.postId);
      await user.save();
    }
    res.json({ success: true, hidden: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const unhidePost = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.hiddenPosts = user.hiddenPosts.filter(
      (id) => id.toString() !== req.params.postId
    );
    await user.save();
    res.json({ success: true, hidden: false });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────
// REPORT
// ─────────────────────────────────────────
export const reportPost = async (req, res) => {
  try {
    const { reason } = req.body;
    const report = new Report({
      post: req.params.postId,
      reporter: req.user._id,
      reason,
      status: 'pending',
      createdAt: new Date(),
    });
    await report.save();
    res.json({ success: true, message: 'Report submitted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────
// SHARE TRACKING
// ─────────────────────────────────────────
export const trackShare = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    post.shareCount = (post.shareCount || 0) + 1;
    await post.save();
    res.json({ success: true, shareCount: post.shareCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};