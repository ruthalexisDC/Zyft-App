// import crypto from "crypto";
// import jwt from "jsonwebtoken";
// import User from "../models/User.js";
// import { sendEmail } from "../utils/sendEmails.js";

// // Generate JWT
// const generateToken = (userId) => {
//   return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
//     expiresIn: "7d",
//   });
// };

// // ========== REGISTER ==========
// export const register = async (req, res) => {
//   try {
//     const { name, email, password } = req.body;

//     // Validation
//     if (!name || !email || !password) {
//       return res.status(400).json({ message: "Please provide all fields" });
//     }

//     // Check if user already exists
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ message: "User already exists" });
//     }

//     // Auto-generate handle from name (lowercase, no spaces, unique)
//     let handle = name.toLowerCase().replace(/\s+/g, "");

//     // Check if handle already exists, append random number if so
//     let handleExists = await User.findOne({ handle });
//     while (handleExists) {
//       handle = `${handle}${Math.floor(Math.random() * 1000)}`;
//       handleExists = await User.findOne({ handle });
//     }

//     // Create user
//     const user = await User.create({
//       name,
//       email,
//       password,
//       handle,
//     });

//     // Generate token
//     const token = generateToken(user._id);

//     res.status(201).json({
//       success: true,
//       token,
//       user: {
//         _id: user._id,
//         id: user._id,
//         email: user.email,
//         name: user.name,
//         handle: user.handle,
//         avatar: user.avatar || "",
//         bio: user.bio || "",
//         focus: user.focus || "Strength",
//         level: user.level || "Beginner",
//         onboardingComplete: user.onboardingComplete || false,
//       },
//     });
//   } catch (error) {
//     console.error("Registration error:", error);
//     res.status(500).json({ message: "Registration failed", error: error.message });
//   }
// };

// // ========== LOGIN ==========
// export const login = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(401).json({ message: "Invalid email or password" });
//     }

//     const isMatch = await user.comparePassword(password);
//     if (!isMatch) {
//       return res.status(401).json({ message: "Invalid email or password" });
//     }

//     const token = generateToken(user._id);

//     res.status(200).json({
//       success: true,
//       token,
//       user: {
//         _id: user._id,
//         id: user._id,
//         email: user.email,
//         name: user.name,
//         handle: user.handle,
//         avatar: user.avatar || "",
//         bio: user.bio || "",
//         focus: user.focus || "Strength",
//         level: user.level || "Beginner",
//         onboardingComplete: user.onboardingComplete || false,
//       },
//     });
//   } catch (error) {
//     res.status(500).json({ message: "Login failed", error: error.message });
//   }
// };

// // ========== FORGOT PASSWORD ==========
// export const forgotPassword = async (req, res) => {
//   try {
//     const { email } = req.body;

//     if (!email || !email.includes("@")) {
//       return res.status(400).json({ message: "Please provide a valid email" });
//     }

//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(200).json({
//         success: true,
//         message: "If an account exists, a reset link has been sent",
//       });
//     }

//     const resetToken = crypto.randomBytes(32).toString("hex");

//     user.resetPasswordToken = crypto
//       .createHash("sha256")
//       .update(resetToken)
//       .digest("hex");
//     user.resetPasswordExpires = Date.now() + 30 * 60 * 1000;

//     await user.save({ validateBeforeSave: false });

//     const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

//     const message = `
//       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//         <h2 style="color: #8b5cf6;">Password Reset Request</h2>
//         <p>Hello,</p>
//         <p>You requested a password reset for your Zyft account.</p>
//         <p>Click the button below to reset your password (expires in 30 minutes):</p>
//         <a href="${resetUrl}" 
//            style="display: inline-block; background: linear-gradient(to right, #8b5cf6, #6366f1); 
//                   color: white; padding: 14px 28px; text-decoration: none; border-radius: 12px; 
//                   margin: 20px 0; font-weight: 600;">
//           Reset Password
//         </a>
//         <p>Or copy this link:</p>
//         <p style="word-break: break-all; color: #666;">${resetUrl}</p>
//         <p style="color: #999; font-size: 12px; margin-top: 30px;">
//           If you didn't request this, ignore this email. Your password is safe.
//         </p>
//       </div>
//     `;

//     try {
//       await sendEmail({
//         to: user.email,
//         subject: "Zyft - Password Reset Request",
//         html: message,
//       });

//       res.status(200).json({
//         success: true,
//         message: "Reset link sent to your email",
//       });
//     } catch (emailError) {
//       user.resetPasswordToken = undefined;
//       user.resetPasswordExpires = undefined;
//       await user.save({ validateBeforeSave: false });

//       return res.status(500).json({
//         message: "Failed to send email. Please try again later.",
//       });
//     }
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// // ========== RESET PASSWORD ==========
// export const resetPassword = async (req, res) => {
//   try {
//     const { token, newPassword } = req.body;

//     if (!token || !newPassword) {
//       return res.status(400).json({ message: "Token and new password are required" });
//     }

//     if (newPassword.length < 6) {
//       return res.status(400).json({ message: "Password must be at least 6 characters" });
//     }

//     const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

//     const user = await User.findOne({
//       resetPasswordToken: hashedToken,
//       resetPasswordExpires: { $gt: Date.now() },
//     });

//     if (!user) {
//       return res.status(400).json({ message: "Invalid or expired reset token" });
//     }

//     user.password = newPassword;
//     user.resetPasswordToken = undefined;
//     user.resetPasswordExpires = undefined;

//     await user.save();

//     const jwtToken = generateToken(user._id);

//     res.status(200).json({
//       success: true,
//       message: "Password reset successful",
//       token: jwtToken,
//       user: {
//         _id: user._id,
//         id: user._id,
//         email: user.email,
//         name: user.name,
//         handle: user.handle,
//         avatar: user.avatar || "",
//         bio: user.bio || "",
//         focus: user.focus || "Strength",
//         level: user.level || "Beginner",
//         onboardingComplete: user.onboardingComplete || false,
//       },
//     });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { sendEmail } from "../utils/sendEmails.js";

// Generate JWT
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// Shape a Mongo user doc into the public-facing auth response shape.
// Kept in one place so register/login/resetPassword can't drift out of sync.
const toAuthUser = (user) => ({
  _id: user._id,
  id: user._id,
  email: user.email,
  name: user.name,
  handle: user.handle,
  avatar: user.avatar || "",
  bio: user.bio || "",
  focus: user.focus || "Strength",
  level: user.level || "Beginner",
  onboardingComplete: user.onboardingComplete || false,
});

// ========== REGISTER ==========
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please provide all fields" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Auto-generate handle from name (lowercase, no spaces, unique)
    let handle = name.toLowerCase().replace(/\s+/g, "");

    // Check if handle already exists, append random number if so
    let handleExists = await User.findOne({ handle });
    while (handleExists) {
      handle = `${handle}${Math.floor(Math.random() * 1000)}`;
      handleExists = await User.findOne({ handle });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      handle,
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: toAuthUser(user),
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Registration failed" });
  }
};

// ========== LOGIN ==========
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: toAuthUser(user),
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
};

// ========== FORGOT PASSWORD ==========
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.includes("@")) {
      return res.status(400).json({ message: "Please provide a valid email" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If an account exists, a reset link has been sent",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.resetPasswordExpires = Date.now() + 30 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const message = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8b5cf6;">Password Reset Request</h2>
        <p>Hello,</p>
        <p>You requested a password reset for your Zyft account.</p>
        <p>Click the button below to reset your password (expires in 30 minutes):</p>
        <a href="${resetUrl}" 
           style="display: inline-block; background: linear-gradient(to right, #8b5cf6, #6366f1); 
                  color: white; padding: 14px 28px; text-decoration: none; border-radius: 12px; 
                  margin: 20px 0; font-weight: 600;">
          Reset Password
        </a>
        <p>Or copy this link:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          If you didn't request this, ignore this email. Your password is safe.
        </p>
      </div>
    `;

    try {
      await sendEmail({
        to: user.email,
        subject: "Zyft - Password Reset Request",
        html: message,
      });

      res.status(200).json({
        success: true,
        message: "Reset link sent to your email",
      });
    } catch (emailError) {
      console.error("Reset email send failed:", emailError);

      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        message: "Failed to send email. Please try again later.",
      });
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ========== RESET PASSWORD ==========
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    const jwtToken = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: "Password reset successful",
      token: jwtToken,
      user: toAuthUser(user),
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};