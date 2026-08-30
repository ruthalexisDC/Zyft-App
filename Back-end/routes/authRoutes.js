import express from 'express';
import passport from 'passport';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import User from '../models/User.js';
import { sendEmail } from '../utils/sendEmails.js';
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/generateToken.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import auth from '../middleware/authMiddleware.js';

const router = express.Router();

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const REFRESH_COOKIE_NAME = "refreshToken";

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: "/api/v1/auth",
};

// Generates a NEW refresh token, hashes+stores it on the user (replacing
// any previous one — old refresh tokens die the moment a new pair is
// issued), and sets it as an httpOnly cookie. Returns the access token
// so the caller can put it in the JSON response body.
const setRefreshTokenCookie = async (res, user) => {
  const refreshToken = generateRefreshToken(user._id);
  user.refreshToken = hashToken(refreshToken);
  await user.save({ validateBeforeSave: false });
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions);
};

// clearCookie must be called with matching options (minus maxAge) or the
// browser won't recognize it as the same cookie — path in particular is
// easy to get wrong and silently fail to clear anything.
const clearRefreshTokenCookie = (res) => {
  const { maxAge, ...clearOptions } = refreshCookieOptions;
  res.clearCookie(REFRESH_COOKIE_NAME, clearOptions);
};

const getRefreshTokenFromCookie = (req) => req.cookies?.[REFRESH_COOKIE_NAME];

// ── Reusable rate limit error handler ─────────────────────
const rateLimitHandler = (message) => {
  return (req, res) => {
    return sendError(res, { statusCode: 429, message });
  };
};

// Login: a handful of attempts, keyed by IP. Deliberately strict — a real
// user mistyping their password a few times will never hit this; a
// credential-stuffing script will.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler(
    'Too many login attempts. Please try again in 15 minutes.'
  ),
});
 // Verification: prevents brute-forcing the 6-digit code.
const verifySendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler(
    'Too many verification attempts. Try again later.'
  ),
});

const verifyConfirmLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler(
    'Too many verification attempts. Try again later.'
  ),
});

// Registration: prevents automated mass account creation.
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler(
    'Too many accounts created from this IP. Please try again later.'
  ),
});

// Forgot-password: this endpoint always returns a generic 200 to avoid
// leaking whether an email is registered, but without a rate limit it can
// still be hammered to spam a victim's inbox with reset emails, or timed
// to enumerate accounts. Kept tight.
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler(
    'Too many password reset requests. Please try again in 15 minutes.'
  ),
});

// Reset-password: token is already single-use and expiring, but still worth
// throttling to slow down brute-forcing the token itself.
const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler(
    'Too many attempts. Please try again in 15 minutes.'
  ),
});
// Helper: Auth success — redirect to frontend with token

const oauthExchangeCodes = new Map(); // code -> { token, expires }
const OAUTH_CODE_TTL_MS = 60 * 1000; // 60 seconds is plenty for the redirect round-trip

const createExchangeCode = (token) => {
  const code = crypto.randomBytes(32).toString('hex');
  oauthExchangeCodes.set(code, { token, expires: Date.now() + OAUTH_CODE_TTL_MS });
  return code;
};

// Periodic sweep so abandoned codes (browser closed mid-redirect, etc.)
// don't sit in memory forever.
setInterval(() => {
  const now = Date.now();
  for (const [code, entry] of oauthExchangeCodes) {
    if (entry.expires < now) oauthExchangeCodes.delete(code);
  }
}, 5 * 60 * 1000).unref();

const authSuccess = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.redirect(
        `${CLIENT_URL}/login?error=authentication_failed`
      );
    }

    // Create short-lived access token
    const accessToken = generateAccessToken(user._id);

    // Generate, hash/store, and send refresh token as HTTP-only cookie
    await setRefreshTokenCookie(res, user);

    // Create one-time exchange code containing the access token
    const code = createExchangeCode(accessToken);

    // IMPORTANT: This path must match your React route exactly
    return res.redirect(
      `${CLIENT_URL}/oauth/callback?code=${code}`
    );
  } catch (error) {
    console.error("OAuth authentication error:", error);

    return res.redirect(
      `${CLIENT_URL}/login?error=authentication_failed`
    );
  }
};

// Exchange a one-time OAuth code for the real JWT. Called immediately by
// the frontend after redirect — the code is deleted on first read whether
// or not it was expired, so it can never be replayed.
router.post('/exchange', (req, res) => {
  const { code } = req.body;

  if (!code) {
    return sendError(res, {
      statusCode: 400,
      message: 'Code is required',
    });
  }

  const entry = oauthExchangeCodes.get(code);

  // Single-use: delete immediately
  oauthExchangeCodes.delete(code);

  if (!entry || entry.expires < Date.now()) {
    return sendError(res, {
      statusCode: 400,
      message: 'Invalid or expired code',
    });
  }

  return sendSuccess(res, {
    statusCode: 200,
    message: 'OAuth authentication successful',
    data: {
      token: entry.token,
    },
  });
});

// ========== GOOGLE OAUTH ==========
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'],
  prompt: 'select_account',
  session: true
}));

router.get('/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: `${CLIENT_URL}/login?error=google_failed`,
    session: true
  }),
  authSuccess
);

// ========== FACEBOOK OAUTH ==========
router.get('/facebook', passport.authenticate('facebook', { 
  scope: ['public_profile', 'email']
}));

router.get('/facebook/callback', 
  passport.authenticate('facebook', { 
    failureRedirect: `${CLIENT_URL}/login?error=facebook_failed`,
    session: true
  }),
  authSuccess
);

// ========== EMAIL REGISTRATION ==========
router.post(
  '/register/email',
  registerLimiter,
  async (req, res, next) => {
    try {
      const { name, email, password } = req.body;

      const normalizedName = name?.trim();
      const normalizedEmail = email?.trim().toLowerCase();

      // ── Validate required fields ──
      if (!normalizedName || !normalizedEmail || !password) {
        return sendError(res, {
          statusCode: 400,
          message: 'Name, email, and password are required',
        });
      }

      // ── Validate password ──
      if (password.length < 8) {
        return sendError(res, {
          statusCode: 400,
          message: 'Password must be at least 8 characters',
        });
      }

      // ── Check existing email ──
      const existingUser = await User.findOne({
        email: normalizedEmail,
      });

      if (existingUser) {
        return sendError(res, {
          statusCode: 409,
          message: 'Email already registered',
        });
      }

      // ── Generate base handle ──
   const baseHandle = normalizedName
  .toLowerCase()
  .replace(/\s+/g, '')
  .replace(/[^a-z0-9_]/g, '');

if (!baseHandle) {
  return sendError(res, {
    statusCode: 400,
    message: 'Please provide a valid name',
  });
}

   let handle = baseHandle;
let handleExists = await User.findOne({ handle });

let attempts = 0;
const maxAttempts = 10;

while (handleExists && attempts < maxAttempts) {
  const randomNumber = Math.floor(Math.random() * 9000) + 1000;

  handle = `${baseHandle}${randomNumber}`;

  handleExists = await User.findOne({ handle });

  attempts++;
}

if (handleExists) {
  return sendError(res, {
    statusCode: 500,
    message: 'Unable to generate a unique handle. Please try again.',
  });
}

      // ── Create user ──
      const user = await User.create({
        name: normalizedName,
        email: normalizedEmail,
        password,
        handle,
        authProvider: 'local',
        isVerified: false,
        onboardingComplete: false,
      });

    const accessToken = generateAccessToken(user._id);

await setRefreshTokenCookie(res, user);

return sendSuccess(res, {
  statusCode: 201,
  message: "Account created successfully",
  data: {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      handle: user.handle,
      avatar: user.avatar,
      isVerified: user.isVerified,
      onboardingComplete: user.onboardingComplete,
      token: accessToken,
    },
  },
});

    } catch (err) {
      // MongoDB duplicate key error
      if (err.code === 11000) {
        const field = Object.keys(err.keyPattern || {})[0];

        return sendError(res, {
          statusCode: 409,
          message:
            field === 'email'
              ? 'Email already registered'
              : 'Handle already exists. Please try again.',
        });
      }

      return next(err);
    }
  }
);


router.post("/login", loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return sendError(res, {
        statusCode: 400,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+password");

    if (!user) {
      return sendError(res, {
        statusCode: 401,
        message: "Invalid email or password",
      });
    }

    const authProvider = user.authProvider || "local";

    if (authProvider !== "local") {
      return sendError(res, {
        statusCode: 400,
        message: `Please log in with ${authProvider}`,
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return sendError(res, {
        statusCode: 401,
        message: "Invalid email or password",
      });
    }

    // Generate short-lived access token
    const accessToken = generateAccessToken(user._id);

    // Generate refresh token and store it in HTTP-only cookie
    await setRefreshTokenCookie(res, user);

    return sendSuccess(res, {
      statusCode: 200,
      message: "Login successful",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          handle: user.handle,
          avatar: user.avatar,
          onboardingComplete: user.onboardingComplete,
          token: accessToken,
        },
      },
    });
  } catch (err) {
    return next(err);
  }
});


// ========== GET CURRENT USER ==========
router.get('/me', auth, async (req, res, next) => {
  try {
    const user = req.user;

    return sendSuccess(res, {
      statusCode: 200,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          handle: user.handle,
          avatar: user.avatar,
          bio: user.bio,

          authProvider: user.authProvider,
          isVerified: user.isVerified,
          onboardingComplete: user.onboardingComplete,

          isPrivate: user.isPrivate,

          isOnline: user.isOnline,
          lastSeen: user.lastSeen,
          showActiveStatus: user.show_active_status,

          notificationPreferences: user.notificationPreferences,

          streakCount: user.streakCount,
          lastWorkout: user.lastWorkout,
          focus: user.focus,
          level: user.level,

          workoutSplit: user.workoutSplit,

          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
    });
  } catch (err) {
    return next(err);
  }
});


// ========== FORGOT PASSWORD ==========
router.post(
  '/forgot-password',
  forgotPasswordLimiter,
  async (req, res, next) => {
    try {
      const { email } = req.body;

      // Validate email
      if (!email?.trim() || !email.includes('@')) {
        return sendError(res, {
          statusCode: 400,
          message: 'Please provide a valid email',
        });
      }

      const normalizedEmail = email.trim().toLowerCase();

      // Find user
      const user = await User.findOne({
        email: normalizedEmail,
      });

      // Prevent email enumeration
      if (!user) {
        return sendSuccess(res, {
          statusCode: 200,
          message: 'If an account exists, a reset link has been sent',
        });
      }

      // Generate secure reset token
      const resetToken = crypto
        .randomBytes(32)
        .toString('hex');

      // Store only the hashed version in the database
      const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpires =
        Date.now() + 30 * 60 * 1000;

      await user.save({
        validateBeforeSave: false,
      });

      // Create reset URL
      const resetUrl =
        `${CLIENT_URL}/reset-password?token=${resetToken}`;

      // Email content
      const message = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #8b5cf6;">
            Password Reset Request
          </h2>

          <p>Hello,</p>

          <p>
            You requested a password reset for your Zyft account.
          </p>

          <p>
            Click the button below to reset your password.
            This link expires in 30 minutes.
          </p>

          <a
            href="${resetUrl}"
            style="
              display: inline-block;
              background: linear-gradient(to right, #8b5cf6, #6366f1);
              color: white;
              padding: 14px 28px;
              text-decoration: none;
              border-radius: 12px;
              margin: 20px 0;
              font-weight: 600;
            "
          >
            Reset Password
          </a>

          <p>Or copy this link:</p>

          <p style="word-break: break-all; color: #666;">
            ${resetUrl}
          </p>

          <p
            style="
              color: #999;
              font-size: 12px;
              margin-top: 30px;
            "
          >
            If you didn't request this, ignore this email.
            Your password is safe.
          </p>
        </div>
      `;

      // Send reset email
      try {
        await sendEmail({
          to: user.email,
          subject: 'Zyft - Password Reset Request',
          html: message,
        });

      } catch (emailError) {
        console.error(
          'Reset email send failed:',
          emailError
        );

        // Remove the reset token because the email failed
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save({
          validateBeforeSave: false,
        });

        return sendError(res, {
          statusCode: 500,
          message:
            'Failed to send email. Please try again later.',
        });
      }

      // Development-only reset information
      if (process.env.NODE_ENV !== 'production') {
        console.log('\n');
        console.log(
          '╔════════════════════════════════════════════════════════════╗'
        );
        console.log(
          '║          🔐 PASSWORD RESET LINK (DEV MODE)                 ║'
        );
        console.log(
          '╠════════════════════════════════════════════════════════════╣'
        );
        console.log(`  Email: ${normalizedEmail}`);
        console.log(`  URL:   ${resetUrl}`);
        console.log(
          '╚════════════════════════════════════════════════════════════╝'
        );
        console.log('\n');

        return sendSuccess(res, {
          statusCode: 200,
          message: 'Reset link sent to your email',
          data: {
            devToken: resetToken,
            devUrl: resetUrl,
          },
        });
      }

      // Production success response
      return sendSuccess(res, {
        statusCode: 200,
        message: 'Reset link sent to your email',
      });

    } catch (err) {
      return next(err);
    }
  }
);


// ========== RESET PASSWORD ==========
router.post(
  '/reset-password',
  resetPasswordLimiter,
  async (req, res, next) => {
    try {
      const { token: resetToken, newPassword } = req.body;

      // Validate required fields
      if (!resetToken || !newPassword) {
        return sendError(res, {
          statusCode: 400,
          message: 'Token and new password are required',
        });
      }

      // Validate password length
      if (newPassword.length < 8) {
        return sendError(res, {
          statusCode: 400,
          message: 'Password must be at least 8 characters',
        });
      }

      // Hash the token so it can be compared with the hashed
      // version stored in the database
      const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

      // Find a user with a valid, non-expired reset token
      const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: {
          $gt: Date.now(),
        },
      });

      if (!user) {
        return sendError(res, {
          statusCode: 400,
          message: 'Invalid or expired reset token',
        });
      }

      // Update password
      user.password = newPassword;

      // Remove reset token so it cannot be reused
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;

      await user.save();

const accessToken = generateAccessToken(user._id);

await setRefreshTokenCookie(res, user);

return sendSuccess(res, {
  statusCode: 200,
  message: "Password reset successful",
  data: {
    token: accessToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
    },
  },
});

    } catch (err) {
      return next(err);
    }
  }
);
// ========== EMAIL VERIFICATION ==========

// ========== SEND EMAIL VERIFICATION ==========
router.post(
  '/verify-email',
  verifySendLimiter,
  auth,
  async (req, res, next) => {
    try {
      const user = req.user;

      // User is already verified
      if (user.isVerified) {
        return sendError(res, {
          statusCode: 400,
          message: 'Email already verified',
        });
      }

      // Generate secure verification token
      const verifyToken = crypto
        .randomBytes(32)
        .toString('hex');

      // Store only the hashed token
      const hashedToken = crypto
        .createHash('sha256')
        .update(verifyToken)
        .digest('hex');

      user.emailVerifyToken = hashedToken;
      user.emailVerifyExpires =
        Date.now() + 30 * 60 * 1000;

      await user.save({
        validateBeforeSave: false,
      });

      // Create verification URL
      const verifyUrl =
        `${CLIENT_URL}/verify-email/confirm?token=${verifyToken}`;

      const message = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #8b5cf6;">
            Verify Your Email
          </h2>

          <p>Hello ${user.name},</p>

          <p>
            Click the button below to verify your Zyft account.
            This link expires in 30 minutes.
          </p>

          <a
            href="${verifyUrl}"
            style="
              display: inline-block;
              background: linear-gradient(to right, #8b5cf6, #6366f1);
              color: white;
              padding: 14px 28px;
              text-decoration: none;
              border-radius: 12px;
              margin: 20px 0;
              font-weight: 600;
            "
          >
            Verify Email
          </a>

          <p>Or copy this link:</p>

          <p style="word-break: break-all; color: #666;">
            ${verifyUrl}
          </p>

          <p
            style="
              color: #999;
              font-size: 12px;
              margin-top: 30px;
            "
          >
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      `;

      try {
        await sendEmail({
          to: user.email,
          subject: 'Zyft - Verify Your Email',
          html: message,
        });
      } catch (emailError) {
        console.error(
          'Verification email send failed:',
          emailError
        );

        // Remove token if email sending fails
        user.emailVerifyToken = undefined;
        user.emailVerifyExpires = undefined;

        await user.save({
          validateBeforeSave: false,
        });

        return sendError(res, {
          statusCode: 500,
          message:
            'Failed to send verification email. Please try again later.',
        });
      }

      return sendSuccess(res, {
        statusCode: 200,
        message: 'Verification link sent',
      });

    } catch (err) {
      return next(err);
    }
  }
);

// ========== CONFIRM EMAIL VERIFICATION ==========
router.post(
  '/verify-email/confirm',
  verifyConfirmLimiter,
  async (req, res, next) => {
    try {
      const { token: verifyToken } = req.body;

      if (!verifyToken) {
        return sendError(res, {
          statusCode: 400,
          message: 'Verification token is required',
        });
      }

      // Hash the received token
      const hashedToken = crypto
        .createHash('sha256')
        .update(verifyToken)
        .digest('hex');

      // Find user with a valid, non-expired verification token
      const user = await User.findOne({
        emailVerifyToken: hashedToken,
        emailVerifyExpires: {
          $gt: Date.now(),
        },
      });

      if (!user) {
        return sendError(res, {
          statusCode: 400,
          message: 'Invalid or expired verification link',
        });
      }

      // Verify the user
      user.isVerified = true;

      // Remove verification token so it cannot be reused
      user.emailVerifyToken = undefined;
      user.emailVerifyExpires = undefined;

      await user.save();

      return sendSuccess(res, {
        statusCode: 200,
        message: 'Email verified successfully',
      });

    } catch (err) {
      return next(err);
    }
  }
);

// ========== REFRESH ACCESS TOKEN ==========
router.post("/refresh", async (req, res, next) => {
  try {
    const refreshToken = getRefreshTokenFromCookie(req);

    if (!refreshToken) {
      return sendError(res, { statusCode: 401, message: "Refresh token is required" });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (error) {
      return sendError(res, { statusCode: 401, message: "Invalid or expired refresh token" });
    }

    // Confirm your User schema actually has `select: false` on this field —
    // if it doesn't, .select("+refreshToken") is harmless but unnecessary.
    const user = await User.findById(decoded.userId).select("+refreshToken");

    if (!user || !user.refreshToken) {
      return sendError(res, { statusCode: 401, message: "Invalid refresh token" });
    }

    const hashedToken = hashToken(refreshToken);

    if (hashedToken !== user.refreshToken) {
      // Mismatch = stale or stolen token. Kill the stored session rather
      // than silently rejecting and leaving it valid for next time.
      user.refreshToken = undefined;
      await user.save({ validateBeforeSave: false });
      clearRefreshTokenCookie(res);
      return sendError(res, { statusCode: 401, message: "Session invalidated, please log in again" });
    }

    // Rotate: setRefreshTokenCookie generates a NEW refresh token, hashes
    // it, stores it on `user`, and sets the cookie — this replaces the old
    // manual re-implementation that was passing a string where a user
    // document was expected and crashing on the second refresh call.
    const accessToken = generateAccessToken(user._id);
    await setRefreshTokenCookie(res, user);

    return sendSuccess(res, {
      statusCode: 200,
      message: "Access token refreshed",
      data: { token: accessToken },
    });
  } catch (error) {
    next(error);
  }
});

// ========== LOGOUT ==========
router.post("/logout", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const decoded = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
      await User.findByIdAndUpdate(decoded.userId, { $unset: { refreshToken: 1 } });
    }
  } catch (err) {
    // Expired/invalid access token shouldn't block logout — clear the
    // cookie regardless, the client is trying to end its session either way.
  }
  clearRefreshTokenCookie(res); // local version, defined near the top of this file
  return sendSuccess(res, { statusCode: 200, message: "Logged out" });
});

export default router;