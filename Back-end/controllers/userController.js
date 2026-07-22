import User from '../models/User.js';
import Post from '../models/Post.js';
import Workout from '../models/Workout.js';
import Comment from '../models/Comments.js';
import cloudinary from '../utils/cloudinary.js';

// Get user profile by ID
export const getUserProfileById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -email');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const postCount = await Post.countDocuments({ user: user._id });
    const isFollowing = user.followers.includes(req.user._id);

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        username: user.handle,
        handle: user.handle,
        avatar: user.avatar,
        photo: user.avatar,
        bio: user.bio,
        focus: user.focus,
        level: user.level,
        streakCount: user.streakCount,
        followersCount: user.followers.length,
        followingCount: user.following.length,
        postCount: postCount,
        isFollowing,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to get profile', error: error.message });
  }
};

// Get user's posts by user ID
export const getUserPostsById = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const posts = await Post.find({ user: id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('user', 'name handle avatar')
      .lean();

    const total = await Post.countDocuments({ user: id });

    // Compute respectCount and didRespect for each post so the
    // profile card heart button shows real numbers.
    const postsWithData = await Promise.all(
      posts.map(async (post) => {
        const commentCount = await Comment.countDocuments({ post: post._id });
        return {
          ...post,
          respectCount: post.respects?.length || 0,
          commentCount,
          didRespect:
            post.respects?.some(
              (r) => r.toString() === currentUserId.toString()
            ) || false,
        };
      })
    );

    res.json({
      success: true,
      posts: postsWithData,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ message: 'Failed to get posts', error: error.message });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const { name, bio, focus, level } = req.body;
    const userId = req.user._id;

    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (bio !== undefined) updates.bio = bio.trim();
    if (focus !== undefined) updates.focus = focus.trim();
    if (level !== undefined) updates.level = level;

    const user = await User.findByIdAndUpdate(
      userId,
      updates,
      { returnDocument: 'after', runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        username: user.handle,
        handle: user.handle,
        avatar: user.avatar,
        photo: user.avatar,
        bio: user.bio,
        focus: user.focus,
        level: user.level,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
};

// Upload profile avatar
// Previously this base64-encoded the raw file buffer and stored it directly
// on the User document ("data:image/...;base64,..."). That bloats the Mongo
// document (avatars easily became hundreds of KB of text inside a doc that's
// fetched constantly), skips any CDN/resizing benefits, and risked hitting
// Mongo's 16MB document size limit. Cloudinary is already configured and
// used correctly for post images from the frontend — this now uploads the
// buffer there server-side (signed, via the SDK) and stores just the
// resulting URL, consistent with the rest of the app's media handling.
export const uploadAvatar = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'zyft/avatars',
          public_id: `avatar_${userId}`,
          overwrite: true,
          resource_type: 'image',
          transformation: [{ width: 512, height: 512, crop: 'fill', gravity: 'face' }],
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    const avatarUrl = uploadResult.secure_url;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatar: avatarUrl },
      { returnDocument: 'after' }
    ).select('-password');

    res.json({
      success: true,
      avatar: avatarUrl,
      photo: avatarUrl,
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        username: updatedUser.handle,
        handle: updatedUser.handle,
        avatar: updatedUser.avatar,
        photo: updatedUser.avatar,
        bio: updatedUser.bio,
        focus: updatedUser.focus,
        level: updatedUser.level,
      },
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ message: 'Failed to upload avatar', error: error.message });
  }
};

// Delete user account
export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;

    await Post.deleteMany({ user: userId });
    await Workout.deleteMany({ user: userId });
    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Failed to delete account', error: error.message });
  }
};