import api from "./axios";

// ── Login ─────────────────────────────
export const login = (credentials) =>
  api.post("/auth/login", credentials);


// ── Register ──────────────────────────
export const registerEmail = (userData) =>
  api.post("/auth/register/email", userData);


// ── Get current user ──────────────────
export const getMe = () =>
  api.get("/auth/me");


// ── Request password reset ────────────
export const requestPasswordReset = ({ email }) =>
  api.post("/auth/forgot-password", { email });


// ── Reset password ────────────────────
export const resetPassword = (token, newPassword) =>
  api.post("/auth/reset-password", {
    token,
    newPassword,
  });


// ── Send verification email ───────────
export const requestEmailVerification = () =>
  api.post("/auth/verify-email");


// ── Confirm email verification ────────
export const confirmEmailVerification = (token) =>
  api.post("/auth/verify-email/confirm", {
    token,
  });


// ── OAuth exchange ────────────────────
export const exchangeOAuthCode = (code) =>
  api.post("/auth/exchange", {
    code,
  });

// ── Logout ────────────────────────────
export const logout = () =>
  api.post("/auth/logout");  