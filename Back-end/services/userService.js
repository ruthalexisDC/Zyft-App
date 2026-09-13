import User from "../models/User.js";
import Post from "../models/Post.js";
import Comment from "../models/Comments.js";
import Workout from "../models/Workout.js"
import cloudinary from "../utils/cloudinary.js";
import crypto from "crypto";
import transporter from "../config/email.js";


// Service: Get user profile by ID
export const getUserProfileById = async (userId, currentUserId) => {
  const user = await User.findById(userId)
    .select("-password -email");

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const postCount = await Post.countDocuments({
    user: user._id,
  });

  const isFollowing = user.followers.some(
    (id) => id.toString() === currentUserId.toString()
  );

  const currentUser = await User.findById(currentUserId)
    .select("show_active_status");

  const showActiveStatus =
    user.show_active_status !== false &&
    currentUser?.show_active_status !== false;

  return {
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
    postCount,
    isFollowing,

    show_active_status: user.show_active_status,
    last_active_at: showActiveStatus
      ? user.last_active_at
      : null,
    isOnline: showActiveStatus
      ? user.isOnline
      : false,
  };
};

// Service: Get user post bi ID
export const getUserPostsById = async (
  userId,
  currentUserId,
  page = 1,
  limit = 20
) => {
  const posts = await Post.find({ user: userId })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate(
      "user",
      "name handle avatar last_active_at isOnline show_active_status"
    )
    .lean();

  const total = await Post.countDocuments({
    user: userId,
  });

  const postsWithData = await Promise.all(
    posts.map(async (post) => {
      const commentCount = await Comment.countDocuments({
        post: post._id,
      });

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

  return {
    posts: postsWithData,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

// Service: Update user profile

export const updateUserProfile = async (userId, profileData) => {
  const { name, bio, focus, level } = profileData;

  const updates = {};

  if (name !== undefined) {
    updates.name = name.trim();
  }

  if (bio !== undefined) {
    updates.bio = bio.trim();
  }

  if (focus !== undefined) {
    updates.focus = focus.trim();
  }

  if (level !== undefined) {
    updates.level = level;
  }

  const user = await User.findByIdAndUpdate(
    userId,
    updates,
    {
      returnDocument: "after",
      runValidators: true,
    }
  ).select("-password");

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  return {
    _id: user._id,
    name: user.name,
    username: user.handle,
    handle: user.handle,
    avatar: user.avatar,
    photo: user.avatar,
    bio: user.bio,
    focus: user.focus,
    level: user.level,
  };
};

//Service: Upload profile avatar
export const uploadUserAvatar = async (userId, fileBuffer) => {
  const uploadResult = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "zyft/avatars",
        public_id: `avatar_${userId}`,
        overwrite: true,
        resource_type: "image",
        transformation: [
          {
            width: 512,
            height: 512,
            crop: "fill",
            gravity: "face",
          },
        ],
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve(result);
      }
    );

    stream.end(fileBuffer);
  });

  const avatarUrl = uploadResult.secure_url;

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { avatar: avatarUrl },
    { returnDocument: "after" }
  ).select("-password");

  if (!updatedUser) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  return {
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
  };
};

// Service: Delete user account
export const deleteUserAccountService = async (userId) => {
  await Post.deleteMany({ user: userId });
  await Workout.deleteMany({ user: userId });
  await User.findByIdAndDelete(userId);

  return true;
};

// Service: Request email verification
export const requestEmailVerificationService = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    return {
      success: false,
      status: 404,
      message: "User not found",
    };
  }

  if (user.isVerified) {
    return {
      success: false,
      status: 400,
      message: "Email is already verified",
    };
  }

  // Create verification token
  const verificationToken = crypto
    .randomBytes(32)
    .toString("hex");

  // Save only the hashed token in MongoDB
  user.emailVerifyToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  // Token expires after 1 hour
  user.emailVerifyExpires = new Date(
    Date.now() + 60 * 60 * 1000
  );

  await user.save({ validateBeforeSave: false });

  const verificationUrl =
    `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

  await transporter.sendMail({
    from: {
      name: "Zyft",
      address: process.env.EMAIL_USER,
    },
    to: user.email,
    subject: "Verify your Zyft account",
    html: `
      <h1>Welcome to Zyft!</h1>

      <p>Please verify your email address by clicking the button below.</p>

      <p>
        <a
          href="${verificationUrl}"
          style="
            display: inline-block;
            padding: 12px 20px;
            background-color: #FF6B4A;
            color: white;
            text-decoration: none;
            border-radius: 6px;
          "
        >
          Verify Email
        </a>
      </p>

      <p>This link will expire in 1 hour.</p>

      <p>If you did not create a Zyft account, you can ignore this email.</p>
    `,
  });

  return {
    success: true,
    message: "Verification email sent successfully",
  };
};

// Service: Confirm email verification
export const confirmEmailVerificationService = async (token) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    emailVerifyToken: hashedToken,
    emailVerifyExpires: {
      $gt: new Date(),
    },
  });

  if (!user) {
    return {
      success: false,
      status: 400,
      message: "Invalid or expired verification token",
    };
  }

  user.isVerified = true;
  user.emailVerifyToken = undefined;
  user.emailVerifyExpires = undefined;

  await user.save();

  return {
    success: true,
    message: "Email verified successfully",
  };
};