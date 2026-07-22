// src/pages/VerifyEmail.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);

  // Redirect if already verified
  useEffect(() => {
    if (user?.isVerified) navigate("/home");
  }, [user, navigate]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer((t) => t - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleSend = async () => {
    setError("");
    setIsLoading(true);
    try {
      await api.post("/auth/verify-email");
      setSent(true);
      setResendTimer(60);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to send verification email",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#1a1a24] border border-gray-700 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-[#8b5cf6]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">
          Verify your email
        </h1>
        <p className="text-gray-400 text-sm mb-8">
          {sent
            ? `We sent a verification link to ${user?.email}. Click the link in that email to verify your account.`
            : `Click below to send a verification link to ${user?.email}.`}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {sent && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm">
            Link sent — check your inbox (and spam folder).
          </div>
        )}

        {resendTimer > 0 && sent ? (
          <p className="text-gray-500 text-sm">Resend in {resendTimer}s</p>
        ) : (
          <button
            onClick={handleSend}
            disabled={isLoading}
            className="w-full py-3.5 bg-gradient-to-r from-[#8b5cf6] to-[#a78bfa] rounded-full font-medium text-white text-sm shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 disabled:opacity-50 transition-all"
          >
            {isLoading
              ? "Sending..."
              : sent
                ? "Resend link"
                : "Send verification link"}
          </button>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
