
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


// Refactored: Get user profile by ID
export const getUserProfileById = async (req, res) => {
  try {
    const user = await getUserProfileByIdService(
      req.params.id,
      req.user._id
    );

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get profile error:", error);

    return res.status(error.statusCode || 500).json({
      message: error.message || "Failed to get profile",
    });
  }
};
       // Refactored: Get user profile by ID
        export const getUserPostsById = async (req, res) => {
        try {
          const { id } = req.params;

          const page = parseInt(req.query.page) || 1;
          const limit = parseInt(req.query.limit) || 20;

          const result = await getUserPostsByIdService(
            id,
            req.user._id,
            page,
            limit
          );

          return res.status(200).json({
            success: true,
            ...result,
          });
        } catch (error) {
          console.error("Get user posts error:", error);

          return res.status(error.statusCode || 500).json({
            message: error.message || "Failed to get posts",
          });
        }
      };


// Refactored: Update user profile
export const updateProfile = async (req, res) => {
  try {
    const user = await updateUserProfileService(
      req.user._id,
      req.body
    );

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Update profile error:", error);

    return res.status(error.statusCode || 500).json({
      message: error.message || "Failed to update profile",
    });
  }
};


// Refactored: Upload profile avatar
export const uploadAvatar = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    const result = await uploadUserAvatarService(
      userId,
      req.file.buffer
    );

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Upload avatar error:", error);

    return res.status(error.statusCode || 500).json({
      message: error.message || "Failed to upload avatar",
    });
  }
};

// Refactored:  Delete user account
export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;

    await deleteUserAccountService(userId);

    res.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({
      message: "Failed to delete account",
      error: error.message,
    });
  }
};

// Refactored: Send email verification
export const requestEmailVerification = async (req, res) => {
  try {
    const result = await requestEmailVerificationService(
      req.user._id
    );

    if (!result.success) {
      return res.status(result.status).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: result.message,
    });

  } catch (error) {
    console.error("Verification email error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send verification email",
      error: error.message,
    });
  }
};

// Refactored: Confirm email verification
export const confirmEmailVerification = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Verification token is required",
      });
    }

    const result = await confirmEmailVerificationService(token);

    if (!result.success) {
      return res.status(result.status).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: result.message,
    });

  } catch (error) {
    console.error("Email confirmation error:", error);

    return res.status(500).json({
      success: false,
      message: "Email verification failed",
      error: error.message,
    });
  }
};