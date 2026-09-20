// utils/cookies.js
//
// Refresh token cookie config, centralized so login/register/refresh/logout
// all use identical settings. If these ever drift between routes (e.g. one
// route sets sameSite: 'lax' and another sets 'none'), clearCookie() in
// logout silently fails to match the cookie set at login, and the "cleared"
// cookie just sits there. One shared config prevents that class of bug.

const isProduction = process.env.NODE_ENV === 'production';

const REFRESH_COOKIE_NAME = 'refreshToken';

const refreshCookieOptions = {
  httpOnly: true, // JS can't read it — the whole point, blocks XSS token theft
  secure: isProduction, // HTTPS-only in prod, relaxed for local http dev
  // Frontend and backend are on different origins (see CLIENT_ORIGINS in
  // server.js), so cross-site delivery needs sameSite: 'none' — which in
  // turn requires secure: true, hence only enabled in production.
  // Mirrors the exact same tradeoff already made for the session cookie.
  sameSite: isProduction ? 'none' : 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days — matches generateRefreshToken's expiresIn
};

export const setRefreshTokenCookie = (res, refreshToken) => {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions);
};

export const clearRefreshTokenCookie = (res) => {
  // clearCookie must be called with the SAME options used to set it
  // (minus maxAge) or the browser won't recognize it as the same cookie.
  const { maxAge, ...clearOptions } = refreshCookieOptions;
  res.clearCookie(REFRESH_COOKIE_NAME, clearOptions);
};

export const getRefreshTokenFromCookie = (req) => req.cookies?.[REFRESH_COOKIE_NAME];