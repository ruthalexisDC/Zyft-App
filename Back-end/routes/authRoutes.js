
import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import User from '../models/User.js';
import { sendEmail } from '../utils/sendEmails.js';
import generateToken from '../utils/generateToken.js';
// import { sendEmail } from '../utils/sendEmail.js';

const router = express.Router();

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// ── Rate limiting ─────────────────────────────────────────────────────────
// These endpoints are the classic brute-force / credential-stuffing /
// account-enumeration targets, so they get their own (tighter) limiters
// instead of relying on the general API rate limiter used elsewhere.

// Login: a handful of attempts, keyed by IP. Deliberately strict — a real
// user mistyping their password a few times will never hit this; a
// credential-stuffing script will.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again in 15 minutes.' },
});
 // Verification: prevents brute-forcing the 6-digit code.
const verifySendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many verification attempts. Try again later.' },
});
const verifyConfirmLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many verification attempts. Try again later.' },
});


// Registration: prevents automated mass account creation.
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many accounts created from this IP. Please try again later.' },
});

// Forgot-password: this endpoint always returns a generic 200 to avoid
// leaking whether an email is registered, but without a rate limit it can
// still be hammered to spam a victim's inbox with reset emails, or timed
// to enumerate accounts. Kept tight.
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many password reset requests. Please try again in 15 minutes.' },
});

// Reset-password: token is already single-use and expiring, but still worth
// throttling to slow down brute-forcing the token itself.
const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again in 15 minutes.' },
});

// Helper: Auth success — redirect to frontend with token
// ── OAuth token exchange codes ──────────────────────────────────────────
// authSuccess used to redirect straight to `${CLIENT_URL}/home?token=<jwt>`.
// Putting the real JWT in a URL is riskier than it looks even after the
// frontend immediately strips it client-side: the token is still sent
// in cleartext as part of the redirect request line (visible to any
// logging proxy/CDN/hosting platform on that hop), briefly sits in the
// browser's address bar and session history before JS can clean it up,
// and can leak via the Referer header if anything on the landing page
// loads a third-party resource before that cleanup runs.
//
// Instead, the redirect now carries a short-lived, single-use, opaque
// code. The frontend immediately exchanges it server-side (POST body,
// not a URL) for the real JWT via /api/auth/exchange, and the code is
// deleted on first use — so even if it leaks through one of the channels
// above, it's already worthless.
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

const authSuccess = (req, res) => {
  const token = generateToken(req.user._id);
  // TODO: point back to '/onboarding' once that route/page exists in App.jsx
  const redirectPath = '/home';

  const code = createExchangeCode(token);
  res.redirect(`${CLIENT_URL}${redirectPath}?code=${code}`);
};

// Exchange a one-time OAuth code for the real JWT. Called immediately by
// the frontend after redirect — the code is deleted on first read whether
// or not it was expired, so it can never be replayed.
router.post('/exchange', (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ message: 'Code is required' });
  }

  const entry = oauthExchangeCodes.get(code);
  oauthExchangeCodes.delete(code);

  if (!entry || entry.expires < Date.now()) {
    return res.status(400).json({ message: 'Invalid or expired code' });
  }

  res.json({ token: entry.token });
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
)

// ========== EMAIL REGISTRATION ==========
router.post('/register/email', registerLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    // Auto-generate handle from name (lowercase, no spaces, unique)
    let handle = name.toLowerCase().replace(/\s+/g, "");
    let handleExists = await User.findOne({ handle });
    while (handleExists) {
      handle = `${handle}${Math.floor(Math.random() * 1000)}`;
      handleExists = await User.findOne({ handle });
    }

    const user = await User.create({
      name,
      email,
      password,
      handle,
      authProvider: 'local',
      isVerified: false,
      onboardingComplete: false,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        handle: user.handle,
        avatar: user.avatar,
        isVerified: user.isVerified,
        onboardingComplete: user.onboardingComplete,
        token,
      },
    });
  } catch (err) {
    console.error('Email registration error:', err);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// ========== EMAIL LOGIN ==========
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const authProvider = user.authProvider || 'local';
    
    if (authProvider !== 'local') {
      return res.status(400).json({ 
        message: `Please log in with ${authProvider}` 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        onboardingComplete: user.onboardingComplete,
        token,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Login failed' });
  }
});

// ========== GET CURRENT USER ==========
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

// ========== FORGOT PASSWORD ==========
router.post('/forgot-password', forgotPasswordLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ message: 'Please provide a valid email' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists, a reset link has been sent',
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 30 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${CLIENT_URL}/reset-password?token=${resetToken}`;

    // ── SECURITY FIX (2026-07-10) ──────────────────────────────────────────
    // Previously this endpoint returned `devToken` / `devUrl` containing the
    // raw reset token directly in the JSON response, with NO environment
    // check. That meant ANYONE who knew a user's email could call this
    // endpoint, read the token back from the response, and reset that
    // user's password without ever touching their inbox — a full account
    // takeover, and it was live in production, not just "dev mode" as the
    // console banner below implied.
    //
    // Fix: actually send the token by email via sendEmail() (same helper
    // already used correctly in controllers/authController.js — that file
    // is NOT wired into any route, so its safe version was never running).
    // The token is only logged/returned in the response when
    // NODE_ENV !== 'production', for local testing without SMTP creds.
    // ─────────────────────────────────────────────────────────────────────
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
        subject: 'Zyft - Password Reset Request',
        html: message,
      });
    } catch (emailError) {
      // Roll back the token so a failed send can't leave a dangling,
      // unusable-but-valid reset token sitting on the user document.
      console.error('Reset email send failed:', emailError);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({
        message: 'Failed to send email. Please try again later.',
      });
    }

    const response = {
      success: true,
      message: 'Reset link sent to your email',
    };

    // Only expose the token/URL outside production, and only in the
    // server console — never assume a client-facing devToken is safe.
    if (process.env.NODE_ENV !== 'production') {
      console.log('\n');
      console.log('╔════════════════════════════════════════════════════════════╗');
      console.log('║          🔐 PASSWORD RESET LINK (DEV MODE)                 ║');
      console.log('╠════════════════════════════════════════════════════════════╣');
      console.log(`  Email: ${email}`);
      console.log(`  URL:   ${resetUrl}`);
      console.log('╚════════════════════════════════════════════════════════════╝');
      console.log('\n');
      response.devToken = resetToken;
      response.devUrl = resetUrl;
    }

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ========== RESET PASSWORD ==========
router.post('/reset-password', resetPasswordLimiter, async (req, res) => {
  try {
    const { token: resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    const jwtToken = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Password reset successful',
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ========== EMAIL VERIFICATION ==========

// Send verification email
router.post('/verify-email', verifySendLimiter, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ message: 'Email already verified' });

    // Generate a secure random token, same approach as /forgot-password —
    // only the SHA-256 hash is stored, the raw token only ever lives in
    // the URL sent to the user's inbox.
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(verifyToken).digest('hex');

    user.emailVerifyToken = hashedToken;
    user.emailVerifyExpires = Date.now() + 30 * 60 * 1000; // 30 min
    await user.save({ validateBeforeSave: false });

    const verifyUrl = `${CLIENT_URL}/verify-email/confirm?token=${verifyToken}`;

    const message = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8b5cf6;">Verify Your Email</h2>
        <p>Hello ${user.name},</p>
        <p>Click the button below to verify your Zyft account (expires in 30 minutes):</p>
        <a href="${verifyUrl}"
           style="display: inline-block; background: linear-gradient(to right, #8b5cf6, #6366f1);
                  color: white; padding: 14px 28px; text-decoration: none; border-radius: 12px;
                  margin: 20px 0; font-weight: 600;">
          Verify Email
        </a>
        <p>Or copy this link:</p>
        <p style="word-break: break-all; color: #666;">${verifyUrl}</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `;

    await sendEmail({
      to: user.email,
      subject: 'Zyft - Verify Your Email',
      html: message,
    });

    res.json({ success: true, message: 'Verification link sent' });
  } catch (err) {
    console.error('Verify email error:', err);
    res.status(500).json({ message: 'Failed to send verification email' });
  }
});

// Confirm verification via the token from the emailed link.
// Deliberately NOT gated behind a Bearer token: the person may open the
// link on a different device/browser than the one they registered on
// (e.g. clicked from their phone's mail app). The random token itself,
// matched against the hashed value stored on the user, is the auth —
// this mirrors /reset-password below.
router.post('/verify-email/confirm', verifyConfirmLimiter, async (req, res) => {
  try {
    const { token: verifyToken } = req.body;

    if (!verifyToken) {
      return res.status(400).json({ message: 'Verification token is required' });
    }

    const hashedToken = crypto.createHash('sha256').update(verifyToken).digest('hex');

    const user = await User.findOne({
      emailVerifyToken: hashedToken,
      emailVerifyExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification link' });
    }

    user.isVerified = true;
    user.emailVerifyToken = undefined;
    user.emailVerifyExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Email verified successfully' });
  } catch (err) {
    console.error('Verify email confirm error:', err);
    res.status(500).json({ message: 'Verification failed' });
  }
});

export default router;