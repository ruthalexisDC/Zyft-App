// src/pages/Login.jsx
import { useState } from "react";
import { login } from "../api/auth";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import logo from "../assets/Zyft.png";

// ========== TOAST COMPONENT ==========
const Toast = ({ message, type, onClose }) => {
  if (!message) return null;
  return (
    <div
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border transition-all duration-300 ${
        type === "success"
          ? "bg-[#0f1f0f] border-green-500/30 text-green-400"
          : "bg-[#1f0f0f] border-red-500/30 text-red-400"
      }`}
    >
      {type === "success" ? (
        <svg
          className="w-5 h-5 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      ) : (
        <svg
          className="w-5 h-5 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      )}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
};

export default function Login() {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ message: "", type: "" });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "" }), 3000);
  };

  const handleSocialLogin = (provider) => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/${provider}?state=login`;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center px-6 py-6 relative">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "" })}
      />

      <button
        onClick={() => navigate("/")}
        className="absolute top-6 left-6 w-10 h-10 flex items-center justify-center rounded-full bg-[#1a1a24] border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-all"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      <img
        src={logo}
        alt="Zyft"
        className="w-52 h-auto mb-4 object-contain mt-2"
      />
      <h1 className="text-2xl font-bold text-white mb-1">Sign In</h1>
      <p className="text-gray-400 text-sm mb-8">
        Welcome back! Please enter your details.
      </p>

      {error && (
        <div className="w-full max-w-sm mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      <EmailLoginForm
        isLoading={isLoading}
        setIsLoading={setIsLoading}
        setError={setError}
        updateUser={updateUser}
        navigate={navigate}
        showToast={showToast}
      />

      <div className="w-full max-w-sm flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-gray-700"></div>
        <span className="text-gray-500 text-xs">or continue with</span>
        <div className="flex-1 h-px bg-gray-700"></div>
      </div>

      <div className="flex items-center justify-center gap-4 mb-6">
        <button
          type="button"
          onClick={() => handleSocialLogin("google")}
          disabled={isLoading}
          className="w-11 h-11 rounded-full bg-[#1a1a24] border border-gray-700 flex items-center justify-center hover:border-gray-500 transition-colors disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => handleSocialLogin("facebook")}
          disabled={isLoading}
          className="w-11 h-11 rounded-full bg-[#1a1a24] border border-gray-700 flex items-center justify-center hover:border-gray-500 transition-colors disabled:opacity-50"
        >
          <svg
            className="w-5 h-5 text-[#1877F2]"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        </button>
      </div>

      <p className="text-gray-400 text-sm">
        Don't have an account?{" "}
        <Link
          to="/register"
          className="text-[#a78bfa] hover:text-[#8b5cf6] font-medium transition-colors"
        >
          Sign Up
        </Link>
      </p>
    </div>
  );
}

const EmailLoginForm = ({
  isLoading,
  setIsLoading,
  setError,
  updateUser,
  navigate,
  showToast,
}) => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Clear old session before logging in
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    try {
      const response = await login({
        email: formData.email,
        password: formData.password,
      });

      console.log("LOGIN RESPONSE:", response);
      const data = response.data;

      if (!data?.user) throw new Error("Invalid response from server");

      const { user } = data;
      const token = user.token; // ← FIXED: token lives inside user object, not top-level

      if (!token) throw new Error("No token received from server");

      // ── Store token and user in localStorage ──
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // ── Set API auth header for future requests ──
      import("../api/axios.js").then(({ default: api }) => {
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      });

      // ── Set user in context with ALL fields from backend ──
      updateUser({
        _id: user._id ?? user.id,
        id: user._id ?? user.id,
        name: user.name,
        email: user.email,
        handle: user.handle || "",
        avatar: user.avatar || "",
        bio: user.bio || "",
        focus: user.focus || "Strength",
        level: user.level || "Beginner",
        onboardingComplete: user.onboardingComplete || false,
      });

      showToast("Welcome back! Signing you in...", "success");
      setTimeout(() => navigate("/home"), 1500);
    } catch (err) {
      console.error("Login error:", err);
      const msg = err.response?.data?.message || err.message || "Login failed";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-3">
      <div>
        <label className="block text-gray-400 text-xs mb-1.5">Email</label>
        <input
          type="email"
          placeholder="Enter your email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-4 py-3 bg-[#111118] border border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6] outline-none transition-all"
        />
      </div>

      <div>
        <label className="block text-gray-400 text-xs mb-1.5">Password</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            required
            minLength={6}
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            className="w-full px-4 py-3 bg-[#111118] border border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6] outline-none transition-all pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
          >
            {showPassword ? (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                />
              </svg>
            )}
          </button>
        </div>
        <div className="flex justify-end mt-1.5">
          <Link
            to="/forgot-password"
            className="text-xs text-[#a78bfa] hover:text-[#8b5cf6] font-medium transition-colors"
          >
            Forgot Password?
          </Link>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3.5 bg-gradient-to-r from-[#8b5cf6] to-[#a78bfa] rounded-full font-medium text-white text-sm shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:from-[#7c3aed] hover:to-[#8b5cf6] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 mt-2"
      >
        {isLoading ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
};
