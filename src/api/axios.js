// import axios from "axios";
// import { API_ORIGIN } from "../config";

// const api = axios.create({
//   baseURL: `${API_ORIGIN}/api/v1`,
//   headers: {
//     "Content-Type": "application/json",
//   },
//   withCredentials: true,
// });

// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem("token");

//   const publicEndpoints = [
//     "/auth/login",
//     "/auth/register/email",
//     "/auth/forgot-password",
//     "/auth/verify-email/confirm",
//     "/auth/reset-password",
//     "/auth/exchange",
//   ];

//   const isPublic = publicEndpoints.some((endpoint) =>
//     config.url?.includes(endpoint)
//   );

//   if (token && !isPublic) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }

//   return config;
// });

// export default api;

import axios from "axios";
import { API_ORIGIN } from "../config";

const api = axios.create({
  baseURL: `${API_ORIGIN}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  const publicEndpoints = [
    "/auth/login",
    "/auth/register/email",
    "/auth/forgot-password",
    "/auth/verify-email/confirm",
    "/auth/reset-password",
    "/auth/exchange",
  ];

  const isPublic = publicEndpoints.some((endpoint) =>
    config.url?.includes(endpoint)
  );

  if (token && !isPublic) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ── Auto-refresh on 401 ─────────────────────────────────────────────────
// The access token is short-lived (15m). Without this, every request made
// after it expires fails outright and the user gets logged out constantly.
// This catches a 401, silently calls /auth/refresh (which reads the
// httpOnly cookie automatically via withCredentials — no token needed in
// the request body), then retries the original request with the new
// access token.
let isRefreshing = false;
let queue = [];

const processQueue = (error, token = null) => {
  queue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve(token)));
  queue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't try to refresh: non-401s, requests already retried once, or
    // the refresh call itself failing (avoids an infinite refresh loop).
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes("/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    // If a refresh is already in flight, queue this request instead of
    // firing a second concurrent refresh call (which would race against
    // the first under the backend's rotation scheme and invalidate it).
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // No body needed — refresh token travels as an httpOnly cookie.
      const { data } = await api.post("/auth/refresh");
      const newToken = data.data.token; // matches sendSuccess envelope

      localStorage.setItem("token", newToken);
      processQueue(null, newToken);

      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;