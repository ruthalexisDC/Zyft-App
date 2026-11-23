import axios from "axios";
import { API_ORIGIN } from "../config";

const api = axios.create({
  baseURL: `${API_ORIGIN}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// ── Attach access token ────────────────────────────────────────────────
// Endpoints that never need (or can't use) an access token. A 401 from one of
// these is a real answer ("wrong password", "bad code"), NOT an expired
// session, so it must never trigger the refresh-and-redirect flow below.
const PUBLIC_ENDPOINTS = [
  "/auth/login",
  "/auth/register/email",
  "/auth/forgot-password",
  "/auth/verify-email/confirm",
  "/auth/reset-password",
  "/auth/exchange",
  "/auth/refresh",
];

const isPublicUrl = (url) =>
  PUBLIC_ENDPOINTS.some((endpoint) => url?.includes(endpoint));

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  const isPublic = isPublicUrl(config.url);

  if (token && !isPublic) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ── Auto-refresh on 401 ────────────────────────────────────────────────
let isRefreshing = false;
let queue = [];

const processQueue = (error, token = null) => {
  queue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token)
  );

  queue = [];
};

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    // Don't refresh for:
    // - non-401 errors
    // - requests that were already retried
    // - public auth endpoints (login, register, refresh, ...). Previously only
    //   /auth/refresh was excluded, so a wrong-password 401 from /auth/login
    //   fired a pointless refresh, replaced the real error message with
    //   "Refresh token is required", and hard-reloaded the page.
    if (
      !error.response ||
      error.response.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isPublicUrl(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    // ── Wait if another request is already refreshing ────────────────
    if (isRefreshing) {
      // Mark as retried so a second 401 can't start yet another refresh cycle.
      originalRequest._retry = true;

      return new Promise((resolve, reject) => {
        queue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${token}`;

        return api(originalRequest);
      });
    }

    // ── Start refresh ────────────────────────────────────────────────
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Refresh token is sent automatically as the httpOnly cookie.
      const { data } = await api.post("/auth/refresh");

      // Matches:
      // {
      //   success: true,
      //   data: {
      //     token: "..."
      //   }
      // }
      const newToken = data.data.token;

      localStorage.setItem("token", newToken);

      // Release queued requests with the new access token.
      processQueue(null, newToken);

      // Retry the original request.
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${newToken}`;

      return api(originalRequest);
    } catch (refreshErr) {
      // Refresh failed → reject all queued requests.
      processQueue(refreshErr, null);

      // Clear local authentication state.
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Send user back to login (skip if already there — assigning the same
      // URL would just reload the page and wipe the form/error state).
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }

      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;