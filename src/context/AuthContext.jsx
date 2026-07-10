import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  // ── NEW: Pick up OAuth token from the URL (?token=...) if present ──
  // This runs first so the token is in localStorage before the
  // "load user" / "verify auth" effects below run.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");

    if (urlToken) {
      localStorage.setItem("token", urlToken);
      api.defaults.headers.common["Authorization"] = `Bearer ${urlToken}`;

      // Strip the token out of the URL so it isn't left in browser
      // history / visible in the address bar after we've stored it.
      params.delete("token");
      const cleanSearch = params.toString();
      const newUrl =
        window.location.pathname +
        (cleanSearch ? `?${cleanSearch}` : "") +
        window.location.hash;
      window.history.replaceState({}, "", newUrl);
    }
  }, []);

  // Load user from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
      } catch (e) {
        console.error("Failed to parse stored user:", e);
        localStorage.removeItem("user");
      }
    }
    setAuthReady(true);
  }, []);

  // Verify token and fetch fresh user data
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setAuthReady(true);
      return;
    }

    const verifyAuth = async () => {
      try {
        // Try to get current user data from /api/users/me or similar endpoint
        const res = await api.get("/users/me");
        const userData = res.data.user;

        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
      } catch (err) {
        console.error("Auth verification failed:", err);
        // If verification fails, try stored user
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (e) {
            logout();
          }
        }
      } finally {
        setAuthReady(true);
      }
    };

    verifyAuth();
  }, [resetKey]);

  const login = async (email, password) => {
    try {
      const res = await api.post("/auth/login", { email, password });
      const { token, user: userData } = res.data;

      console.log("🔑 Login response:", res.data);
      console.log("🔑 Login avatar:", userData?.avatar);

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));

      // Set default auth header
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      setUser(userData);
      return { success: true };
    } catch (err) {
      console.error("Login error:", err);
      return {
        success: false,
        error: err.response?.data?.message || "Login failed",
      };
    }
  };

  const register = async (userData) => {
    try {
      const res = await api.post("/auth/register", userData);
      const { token, user: newUser } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(newUser));

      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      setUser(newUser);
      return { success: true };
    } catch (err) {
      console.error("Register error:", err);
      return {
        success: false,
        error: err.response?.data?.message || "Registration failed",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
    window.location.href = "/login";
  };

  const updateUser = (updates) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  };

  // Set auth header on mount if token exists
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        authReady,
        resetKey,
        login,
        register,
        logout,
        updateUser,
        setResetKey,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
