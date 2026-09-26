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
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  const publicEndpoints = [
    "/auth/login",
    "/auth/register/email",
    "/auth/forgot-password",
    "/auth/verify-email/confirm",
    "/auth/reset-password",
    "/auth/exchange",
    "/auth/refresh",
  ];

  const isPublic = publicEndpoints.some((endpoint) =>
    config.url?.includes(endpoint)
  );

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
    // - the refresh endpoint itself
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes("/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    // ── Wait if another request is already refreshing ────────────────
    if (isRefreshing) {
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

      // Send user back to login.
      window.location.href = "/login";

      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;