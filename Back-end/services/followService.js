import User from "../models/User.js";
import Notification from "../models/Notification.js";

import {
  BadRequestError,
  NotFoundError,
} from "../errors/ApiError.js";

import { createNotificationService } from "./notificationService.js";

// Refresh an existing unread follow notification,
// or create a new notification.
const notifyFollow = async (targetUser, currentUserId) => {
  if (targetUser.notificationPreferences?.follow === false) {
    return;
  }

  const existing = await Notification.findOne({
    recipient: targetUser._id,
    sender: currentUserId,
    type: "follow",
    read: false,
  });

  if (existing) {
  const now = new Date();

  await Notification.updateOne(
    {
      _id: existing._id,
      read: false,
    },
    {
      $set: {
        createdAt: now,
        updatedAt: now,
      },
    },
    {
      timestamps: false,
      overwriteImmutable: true,
    }
  );

  return;
}

  await createNotificationService({
    recipient: targetUser._id,
    sender: currentUserId,
    type: "follow",
  });
};

// Shared follow/unfollow logic.
export const toggleFollowService = async ({
  targetUser,
  currentUserId,
}) => {
  if (!targetUser) {
    throw new NotFoundError("User not found");
  }

  if (targetUser._id.toString() === currentUserId.toString()) {
    throw new BadRequestError("You cannot follow yourself");
  }

  const currentUser = await User.findById(currentUserId);

  if (!currentUser) {
    throw new NotFoundError("User not found");
  }

  const wasFollowing = targetUser.followers.some(
    (id) => id.toString() === currentUserId.toString()
  );

  if (wasFollowing) {
    await Promise.all([
      User.updateOne(
        { _id: targetUser._id },
        { $pull: { followers: currentUserId } }
      ),
      User.updateOne(
        { _id: currentUserId },
        { $pull: { following: targetUser._id } }
      ),
    ]);
  } else {
    await Promise.all([
      User.updateOne(
        { _id: targetUser._id },
        { $addToSet: { followers: currentUserId } }
      ),
      User.updateOne(
        { _id: currentUserId },
        { $addToSet: { following: targetUser._id } }
      ),
    ]);

    // Preserve follow success even if notification creation fails.
    try {
      await notifyFollow(targetUser, currentUserId);
    } catch (error) {
      console.error(
        "Failed to create follow notification:",
        error
      );
    }
  }

  const refreshedTarget = await User.findById(
    targetUser._id
  ).select("followers following");

  if (!refreshedTarget) {
    throw new NotFoundError("User not found");
  }

  return {
    following: !wasFollowing,
    followersCount: refreshedTarget.followers.length,
    followingCount: refreshedTarget.following.length,
  };
};



// Follow-only operation.
// Unlike toggleFollowService, calling this repeatedly
// must never unfollow the target user.
export const followUserService = async ({
  targetUser,
  currentUserId,
}) => {
  if (!targetUser) {
    throw new NotFoundError("User not found");
  }

  if (!currentUserId) {
    throw new BadRequestError("Current user ID is required");
  }

  if (targetUser._id.toString() === currentUserId.toString()) {
    throw new BadRequestError("You cannot follow yourself");
  }

  const currentUser = await User.findById(currentUserId);

  if (!currentUser) {
    throw new NotFoundError("User not found");
  }

  // Check the existing relationship.
  const alreadyFollowing = targetUser.followers.some(
    (id) => id.toString() === currentUserId.toString()
  );

  if (!alreadyFollowing) {
    // Preserve the atomic array update pattern used
    // by the existing follow/unfollow service.
    await Promise.all([
      User.updateOne(
        { _id: targetUser._id },
        { $addToSet: { followers: currentUserId } }
      ),
      User.updateOne(
        { _id: currentUserId },
        { $addToSet: { following: targetUser._id } }
      ),
    ]);

    // Notification failures must not undo a successful follow.
    try {
      await notifyFollow(targetUser, currentUserId);
    } catch (error) {
      console.error(
        "Failed to create follow notification:",
        error
      );
    }
  }

  // Read the current follower count from MongoDB.
  const refreshedTarget = await User.findById(
    targetUser._id
  ).select("followers");

  if (!refreshedTarget) {
    throw new NotFoundError("User not found");
  }

  return {
    following: true,
    followerCount: refreshedTarget.followers.length,
  };
};