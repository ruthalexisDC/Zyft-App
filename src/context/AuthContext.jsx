// import {
//   createContext,
//   useContext,
//   useState,
//   useEffect,
//   useCallback,
// } from "react";
// import api from "../api/axios.js";

// const AuthContext = createContext(null);

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

//   // ── OAuth token cleanup ──
//   useEffect(() => {
//     const params = new URLSearchParams(window.location.search);
//     const urlToken = params.get("token");

//     if (urlToken) {
//       localStorage.setItem("token", urlToken);

//       params.delete("token");
//       const cleanSearch = params.toString();
//       const newUrl =
//         window.location.pathname +
//         (cleanSearch ? `?${cleanSearch}` : "") +
//         window.location.hash;
//       window.history.replaceState({}, "", newUrl);
//     }
//   }, []);

//   // ── Load user from localStorage on mount (optimistic) ──
//   useEffect(() => {
//     const storedUser = localStorage.getItem("user");

//     if (storedUser) {
//       try {
//         const parsed = JSON.parse(storedUser);
//         setUser(parsed);
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

//         setUser(userData);
//         localStorage.setItem("user", JSON.stringify(userData));
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
//       const { token, user: userData } = res.data;

//       localStorage.setItem("token", token);
//       localStorage.setItem("user", JSON.stringify(userData));
//       setUser(userData);

//       return { success: true };
//     } catch (err) {
//       console.error("Login error:", err);
//       return {
//         success: false,
//         error: err.response?.data?.message || "Login failed",
//       };
//     }
//   };

//   // ── REGISTER ──
//   const register = async (userData) => {
//     try {
//       const res = await api.post("/auth/register/email", userData);
//       const { user: newUser } = res.data;

//       // Store token so user can access verify-email endpoint
//       localStorage.setItem("token", newUser.token);

//       return {
//         success: true,
//         user: newUser,
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
//   const updateUser = (updates) => {
//     setUser((prev) => {
//       const updated = { ...prev, ...updates };
//       localStorage.setItem("user", JSON.stringify(updated));
//       return updated;
//     });
//   };

//   return (
//     <AuthContext.Provider
//       value={{
//         user,
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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  // ── DEFINE logout FIRST with useCallback ──
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/login";
  }, []);

  // ── OAuth token exchange ──
  // The redirect from Google/Facebook now carries a short-lived, single-use
  // `code` (not the JWT itself — see authSuccess in authRoutes.js for why).
  // Swap it for the real token via a POST request, which never ends up in
  // a URL, browser history, or a Referer header the way the old `?token=`
  // param did.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthCode = params.get("code");
    if (!oauthCode) return;

    // Strip the code from the URL immediately, before the network call —
    // no reason to leave it sitting in the address bar/history any longer
    // than necessary even though it's single-use.
    params.delete("code");
    const cleanSearch = params.toString();
    const newUrl =
      window.location.pathname +
      (cleanSearch ? `?${cleanSearch}` : "") +
      window.location.hash;
    window.history.replaceState({}, "", newUrl);

    api
      .post("/auth/exchange", { code: oauthCode })
      .then(({ data }) => {
        if (data?.token) {
          localStorage.setItem("token", data.token);
          api.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
          // Bump resetKey so anything depending on auth state re-reads it.
          setResetKey((k) => k + 1);
        }
      })
      .catch((err) => {
        console.error("OAuth code exchange failed:", err);
      });
  }, []);

  // ── Load user from localStorage on mount (optimistic) ──
  useEffect(() => {
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
        const res = await api.get("/users/me");
        const userData = res.data.user;

        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
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
      const { token, user: userData } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));
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

  // ── REGISTER ──
  const register = async (userData) => {
    try {
      const res = await api.post("/auth/register/email", userData);
      const { user: newUser } = res.data;

      // Store token so user can access verify-email endpoint
      localStorage.setItem("token", newUser.token);

      return {
        success: true,
        user: newUser,
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
  const updateUser = (updates) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  };

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
