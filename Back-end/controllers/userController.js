import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { BadRequestError } from "../errors/ApiError.js";


// Services
import {
  getUserProfileById as getUserProfileByIdService,
  getUserPostsById as getUserPostsByIdService,
  updateUserProfile as updateUserProfileService,
  uploadUserAvatar as uploadUserAvatarService,
  deleteUserAccountService,
  requestEmailVerificationService,
  confirmEmailVerificationService,
} from "../services/userService.js";


// Get user profile by ID
export const getUserProfileById = asyncHandler(async (req, res) => {

  const user = await getUserProfileByIdService(
    req.params.id,
    req.user._id
  );

  return sendSuccess(res, {
    data: { user },
  });
});

// Get user posts by ID
export const getUserPostsById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  const result = await getUserPostsByIdService(
    id,
    req.user._id,
    page,
    limit
  );

  return sendSuccess(res, {
    data: result.posts,
    pagination: result.pagination,
  });
});


// Refactored: Update user profile
export const updateProfile = asyncHandler(async (req, res) => {
  const user = await updateUserProfileService(
    req.user._id,
    req.body
  );

  return sendSuccess(res, {
    data: {
      user,
    },
  });
});


// Refactored: Upload profile avatar
export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new BadRequestError("No file uploaded");
  }

  const result = await uploadUserAvatarService(
    req.user._id,
    req.file.buffer
  );

  return sendSuccess(res, {
    data: result,
  });
});

// Refactored:  Delete user account
export const deleteAccount = asyncHandler(async (req, res) => {
  await deleteUserAccountService(req.user._id);

  return sendSuccess(res, {
    message: "Account deleted successfully",
  });
});

// Refactored: Send email verification
export const requestEmailVerification = asyncHandler(async (req, res) => {
  const result = await requestEmailVerificationService(
    req.user._id
  );

  return sendSuccess(res, {
    message: result.message,
  });
});

// Refactored: Confirm email verification
export const confirmEmailVerification = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    throw new BadRequestError(
      "Verification token is required"
    );
  }

  const result = await confirmEmailVerificationService(token);

  return sendSuccess(res, {
    message: result.message,
  });
});