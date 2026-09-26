// src/pages/Register.jsx

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/Zyft.png";
//import api from "../api/axios";
//import { registerEmail } from "../api/auth";
import { useAuth } from "../context/AuthContext.jsx";
import { API_ORIGIN } from "../config";

// OAuth redirects need the full backend URL
const API_URL = `${API_ORIGIN}/api/v1/auth`;

// ========================================
// TOAST COMPONENT
// ========================================

const Toast = ({ message, type, onClose }) => {
  if (!message) return null;

  const isSuccess = type === "success";

  return (
    <div
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border transition-all duration-300 ${
        isSuccess
          ? "bg-[#0f1f0f] border-green-500/30 text-green-400"
          : "bg-[#1f0f0f] border-red-500/30 text-red-400"
      }`}
    >
      {isSuccess ? (
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

      <button
        type="button"
        onClick={onClose}
        className="ml-2 opacity-60 hover:opacity-100"
        aria-label="Close notification"
      >
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

// ========================================
// PASSWORD STRENGTH
// ========================================

const getPasswordStrength = (password) => {
  if (!password) {
    return {
      score: 0,
      label: "",
      color: "",
    };
  }

  let score = 0;

  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) {
    return {
      score,
      label: "Weak",
      color: "bg-red-500",
    };
  }

  if (score <= 2) {
    return {
      score,
      label: "Fair",
      color: "bg-orange-400",
    };
  }

  if (score <= 3) {
    return {
      score,
      label: "Good",
      color: "bg-yellow-400",
    };
  }

  if (score <= 4) {
    return {
      score,
      label: "Strong",
      color: "bg-green-400",
    };
  }

  return {
    score,
    label: "Very Strong",
    color: "bg-green-500",
  };
};

// ========================================
// PASSWORD REQUIREMENT
// ========================================

const Requirement = ({ met, text }) => (
  <div
    className={`flex items-center gap-1.5 text-xs ${
      met ? "text-green-400" : "text-gray-500"
    }`}
  >
    <svg
      className="w-3.5 h-3.5 shrink-0"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      {met ? (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.5}
          d="M5 13l4 4L19 7"
        />
      ) : (
        <circle cx="12" cy="12" r="2" strokeWidth={2} />
      )}
    </svg>

    <span>{text}</span>
  </div>
);

// ========================================
// REGISTER PAGE
// ========================================

const Register = () => {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [toast, setToast] = useState({
    message: "",
    type: "",
  });

  const showToast = (message, type = "success") => {
    setToast({
      message,
      type,
    });

    setTimeout(() => {
      setToast({
        message: "",
        type: "",
      });
    }, 3000);
  };

  const handleGoogleRegister = () => {
    window.location.href = `${API_URL}/google?state=register`;
  };

  const handleFacebookRegister = () => {
    window.location.href = `${API_URL}/facebook?state=register`;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center px-6 py-6 relative">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() =>
          setToast({
            message: "",
            type: "",
          })
        }
      />

      {/* Back Button */}
      <button
        type="button"
        onClick={() => navigate("/")}
        className="absolute top-6 left-6 w-10 h-10 flex items-center justify-center rounded-full bg-[#1a1a24] border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-all"
        aria-label="Go back"
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

      {/* Logo */}
      <img
        src={logo}
        alt="Zyft"
        className="w-52 h-auto mb-4 object-contain mt-2"
      />

      <h1 className="text-2xl font-bold text-white mb-1">Sign Up</h1>

      <p className="text-gray-400 text-sm mb-8">
        Welcome! Please enter your details.
      </p>

      {/* Error Message */}
      {error && (
        <div className="w-full max-w-sm mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Email Registration Form */}
      <EmailRegisterForm
        isLoading={isLoading}
        setIsLoading={setIsLoading}
        setError={setError}
        navigate={navigate}
        showToast={showToast}
      />

      {/* Divider */}
      <div className="w-full max-w-sm flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-gray-700" />

        <span className="text-gray-500 text-xs">or continue with</span>

        <div className="flex-1 h-px bg-gray-700" />
      </div>

      {/* Social Registration */}
      <div className="flex items-center justify-center gap-4 mb-6">
        {/* Google */}
        <button
          type="button"
          onClick={handleGoogleRegister}
          disabled={isLoading}
          className="w-11 h-11 rounded-full bg-[#1a1a24] border border-gray-700 flex items-center justify-center hover:border-gray-500 transition-colors disabled:opacity-50"
          aria-label="Continue with Google"
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

        {/* Facebook */}
        <button
          type="button"
          onClick={handleFacebookRegister}
          disabled={isLoading}
          className="w-11 h-11 rounded-full bg-[#1a1a24] border border-gray-700 flex items-center justify-center hover:border-gray-500 transition-colors disabled:opacity-50"
          aria-label="Continue with Facebook"
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

      {/* Login Link */}
      <p className="text-gray-400 text-sm">
        Already have an account?{" "}
        <Link
          to="/login"
          className="text-[#a78bfa] hover:text-[#8b5cf6] font-medium transition-colors"
        >
          Sign In
        </Link>
      </p>
    </div>
  );
};

// ========================================
// EMAIL REGISTRATION FORM
// ========================================

const EmailRegisterForm = ({
  isLoading,
  setIsLoading,
  setError,
  navigate,
  showToast,
}) => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const strength = getPasswordStrength(formData.password);

  const requirements = [
    {
      met: formData.password.length >= 6,
      text: "At least 6 characters",
    },
    {
      met: /[A-Z]/.test(formData.password),
      text: "One uppercase letter",
    },
    {
      met: /[0-9]/.test(formData.password),
      text: "One number",
    },
    {
      met: /[^A-Za-z0-9]/.test(formData.password),
      text: "One special character",
    },
  ];

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      showToast("Passwords do not match", "error");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      showToast("Password must be at least 6 characters", "error");
      return;
    }

    setIsLoading(true);

    try {
      const result = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      if (!result.success) {
        throw new Error(result.error || "Registration failed");
      }

      showToast("Account created successfully! Please sign in.", "success");

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      const message = err.message || "Registration failed";

      setError(message);
      showToast(message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-3">
      {/* Name */}
      <div>
        <label className="block text-gray-400 text-xs mb-1.5">Name</label>

        <input
          type="text"
          placeholder="Enter your name"
          required
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          className="w-full px-4 py-3 bg-[#111118] border border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6] outline-none transition-all"
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-gray-400 text-xs mb-1.5">Email</label>

        <input
          type="email"
          placeholder="Enter your email"
          required
          value={formData.email}
          onChange={(e) => handleChange("email", e.target.value)}
          className="w-full px-4 py-3 bg-[#111118] border border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6] outline-none transition-all"
        />
      </div>

      {/* Password */}
      <div>
        <label className="block text-gray-400 text-xs mb-1.5">Password</label>

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            required
            minLength={6}
            value={formData.password}
            onChange={(e) => handleChange("password", e.target.value)}
            className="w-full px-4 py-3 bg-[#111118] border border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6] outline-none transition-all pr-10"
          />

          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        {/* Password Strength */}
        {formData.password && (
          <div className="mt-2 space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex gap-1 flex-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                      i <= strength.score ? strength.color : "bg-gray-700"
                    }`}
                  />
                ))}
              </div>

              <span className="text-xs font-medium shrink-0 text-gray-400">
                {strength.label}
              </span>
            </div>

            {/* Password Requirements */}
            <div className="grid grid-cols-2 gap-1 p-2.5 bg-[#111118] rounded-xl border border-gray-800">
              {requirements.map((requirement) => (
                <Requirement
                  key={requirement.text}
                  met={requirement.met}
                  text={requirement.text}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <label className="block text-gray-400 text-xs mb-1.5">
          Confirm Password
        </label>

        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm your password"
            required
            value={formData.confirmPassword}
            onChange={(e) => handleChange("confirmPassword", e.target.value)}
            className={`w-full px-4 py-3 bg-[#111118] border rounded-xl text-white text-sm placeholder-gray-500 focus:ring-1 outline-none transition-all pr-10 ${
              formData.confirmPassword &&
              formData.confirmPassword !== formData.password
                ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
                : formData.confirmPassword &&
                    formData.confirmPassword === formData.password
                  ? "border-green-500/50 focus:border-green-500 focus:ring-green-500/20"
                  : "border-gray-700 focus:border-[#8b5cf6] focus:ring-[#8b5cf6]"
            }`}
          />

          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
          >
            {showConfirmPassword ? "Hide" : "Show"}
          </button>
        </div>

        {/* Password Match Indicator */}
        {formData.confirmPassword && (
          <p
            className={`text-xs mt-1 ${
              formData.confirmPassword === formData.password
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            {formData.confirmPassword === formData.password
              ? "✓ Passwords match"
              : "✗ Passwords do not match"}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3.5 bg-gradient-to-r from-[#8b5cf6] to-[#a78bfa] rounded-full font-medium text-white text-sm shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:from-[#7c3aed] hover:to-[#8b5cf6] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 mt-2"
      >
        {isLoading ? "Creating account..." : "Sign Up"}
      </button>
    </form>
  );
};

export default Register;
