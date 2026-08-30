// import {
//   createContext,
//   useContext,
//   useState,
//   useEffect,
//   useCallback,
// } from "react";
// import api from "../api/axios.js";

// const AuthContext = createContext(null);

// // ── Normalize user shape: backend sends "id", most of the app expects "_id" ──
// const normalizeUser = (u) => (u ? { ...u, _id: u._id || u.id } : u);

// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(null);
//   const [authReady, setAuthReady] = useState(false);
//   const [resetKey, setResetKey] = useState(0);

//   // ── DEFINE logout FIRST with useCallback ──
//   const logout = useCallback(() => {
//     localStorage.removeItem("token");
//     localStorage.removeItem("user");
//     setUser(null);
//     window.location.href = "/login";
//   }, []);

//   // ── Load user from localStorage on mount (optimistic) ──
//   useEffect(() => {
//     const storedUser = localStorage.getItem("user");

//     if (storedUser) {
//       try {
//         const parsed = JSON.parse(storedUser);
//         setUser(normalizeUser(parsed));
//       } catch (e) {
//         console.error("Failed to parse stored user:", e);
//         localStorage.removeItem("user");
//       }
//     }
//     // NOTE: authReady is NOT set here — we wait for verification
//   }, []);

//   // ── Verify token and fetch fresh user data ──
//   useEffect(() => {
//     const token = localStorage.getItem("token");

//     if (!token) {
//       setAuthReady(true);
//       return;
//     }

//     const verifyAuth = async () => {
//       try {
//         const res = await api.get("/users/me");
//         const userData = res.data.user;

//         // Preserve show_active_status from the stored user if /users/me
//         // doesn't return it — prevents the field being silently wiped on
//         // every token verification, which would break the reciprocity check
//         // in FeedPostCard (viewer?.show_active_status).
//         if (userData.show_active_status === undefined) {
//           const storedUser = localStorage.getItem("user");
//           if (storedUser) {
//             try {
//               const parsed = JSON.parse(storedUser);
//               if (parsed.show_active_status !== undefined) {
//                 userData.show_active_status = parsed.show_active_status;
//               }
//             } catch (_) {}
//           }
//         }

//         const normalized = normalizeUser(userData);
//         setUser(normalized);
//         localStorage.setItem("user", JSON.stringify(normalized));
//       } catch (err) {
//         console.error("Auth verification failed:", err);
//         // Token invalid — clear everything
//         localStorage.removeItem("token");
//         localStorage.removeItem("user");
//         setUser(null);
//       } finally {
//         setAuthReady(true);
//       }
//     };

//     verifyAuth();
//   }, [resetKey, logout]);

//   // ── LOGIN ──
//   const login = async (email, password) => {
//     try {
//       const res = await api.post("/auth/login", { email, password });
//       const { user: userData } = res.data.data;
//       const { token } = userData;

//       const normalized = normalizeUser(userData);

//       localStorage.setItem("token", token);
//       localStorage.setItem("user", JSON.stringify(normalized));
//       setUser(normalized);

//       return { success: true };
//     } catch (err) {
//       console.error("Login error:", err);
//       return {
//         success: false,
//         error: err.response?.data?.message || "Login failed",
//       };
//     }
//   };

//   const register = async (userData) => {
//     try {
//       const res = await api.post("/auth/register/email", userData);
//       const { user: newUser } = res.data.data;

//       // Store token so user can access verify-email endpoint
//       localStorage.setItem("token", newUser.token);

//       return {
//         success: true,
//         user: normalizeUser(newUser),
//       };
//     } catch (err) {
//       console.error("Register error:", err);
//       return {
//         success: false,
//         error: err.response?.data?.message || "Registration failed",
//       };
//     }
//   };

//   // ── UPDATE USER ──
//   // NOTE: shallow merge — `{ ...prev, ...updates }` copies top-level keys only.
//   // If `user` ever gains nested objects (e.g. notificationPreferences), a
//   // partial update like updateUser({ notificationPreferences: { respect: false } })
//   // would silently replace the whole nested object and wipe its sibling keys.
//   // If the profile grows nested fields, switch this to a deep merge.
//   const updateUser = (updates) => {
//     setUser((prev) => {
//       const updated = normalizeUser({ ...prev, ...updates });
//       localStorage.setItem("user", JSON.stringify(updated));
//       return updated;
//     });
//   };

//   return (
//     <AuthContext.Provider
//       value={{
//         user,
//         setUser,
//         authReady,
//         resetKey,
//         login,
//         register,
//         logout,
//         updateUser,
//         setResetKey,
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export function useAuth() {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error("useAuth must be used within an AuthProvider");
//   }
//   return context;
// }

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import api from "../api/axios.js";

const AuthContext = createContext(null);

// ── Normalize user shape: backend sends "id", most of the app expects "_id" ──
const normalizeUser = (u) => (u ? { ...u, _id: u._id || u.id } : u);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  // ── DEFINE logout FIRST with useCallback ──
  const logout = useCallback(() => {
    // Best-effort: unsets refreshToken on the user doc and clears the
    // httpOnly cookie server-side. Fire-and-forget — even if this fails
    // (network issue, already-expired access token), we still clear
    // everything locally below so the user is logged out on this device
    // regardless.
    api.post("/auth/logout").catch(() => {});

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/login";
  }, []);

  // ── Load user from localStorage on mount (optimistic) ──
  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(normalizeUser(parsed));
      } catch (e) {
        console.error("Failed to parse stored user:", e);
        localStorage.removeItem("user");
      }
    }
    // NOTE: authReady is NOT set here — we wait for verification
  }, []);

  // ── Verify token and fetch fresh user data ──
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setAuthReady(true);
      return;
    }

    const verifyAuth = async () => {
      try {
        // Using /auth/me (not /users/me) — this is the sendSuccess-based
        // route, so the shape is res.data.data.user, consistent with
        // login/register below. /users/me still exists on the backend but
        // returns a different flat shape; standardizing on one avoids two
        // response shapes floating around this file.
        const res = await api.get("/auth/me");
        const userData = res.data.data.user;

        // Preserve show_active_status from the stored user if /auth/me
        // doesn't return it — prevents the field being silently wiped on
        // every token verification, which would break the reciprocity check
        // in FeedPostCard (viewer?.show_active_status).
        if (userData.show_active_status === undefined) {
          const storedUser = localStorage.getItem("user");
          if (storedUser) {
            try {
              const parsed = JSON.parse(storedUser);
              if (parsed.show_active_status !== undefined) {
                userData.show_active_status = parsed.show_active_status;
              }
            } catch (_) {}
          }
        }

        const normalized = normalizeUser(userData);
        setUser(normalized);
        localStorage.setItem("user", JSON.stringify(normalized));
      } catch (err) {
        console.error("Auth verification failed:", err);
        // Token invalid — clear everything
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
      } finally {
        setAuthReady(true);
      }
    };

    verifyAuth();
  }, [resetKey, logout]);

  // ── LOGIN ──
  const login = async (email, password) => {
    try {
      const res = await api.post("/auth/login", { email, password });
      const { user: userData } = res.data.data;
      const { token } = userData;

      const normalized = normalizeUser(userData);

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(normalized));
      setUser(normalized);

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
      const res = await api.post("/auth/register/email", userData);
      const { user: newUser } = res.data.data;

      // Store token so user can access verify-email endpoint
      localStorage.setItem("token", newUser.token);

      return {
        success: true,
        user: normalizeUser(newUser),
      };
    } catch (err) {
      console.error("Register error:", err);
      return {
        success: false,
        error: err.response?.data?.message || "Registration failed",
      };
    }
  };

  // ── UPDATE USER ──
  // NOTE: shallow merge — `{ ...prev, ...updates }` copies top-level keys only.
  // If `user` ever gains nested objects (e.g. notificationPreferences), a
  // partial update like updateUser({ notificationPreferences: { respect: false } })
  // would silently replace the whole nested object and wipe its sibling keys.
  // If the profile grows nested fields, switch this to a deep merge.
  const updateUser = (updates) => {
    setUser((prev) => {
      const updated = normalizeUser({ ...prev, ...updates });
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
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
