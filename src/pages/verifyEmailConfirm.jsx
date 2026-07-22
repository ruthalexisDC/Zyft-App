// src/pages/VerifyEmailConfirm.jsx
import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/axios";

const VerifyEmailConfirm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, updateUser } = useAuth();
  const [status, setStatus] = useState("verifying"); // verifying | success | error
  const [error, setError] = useState("");
  const hasRun = useRef(false); // guard against React StrictMode double-invoke

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setError("This verification link is missing its token.");
      return;
    }

    const confirm = async () => {
      try {
        await api.post("/auth/verify-email/confirm", { token });
        setStatus("success");

        // If this browser happens to be logged in as the user who just
        // verified, reflect it immediately so the banner disappears
        // without needing a refresh.
        if (user) {
          updateUser({ isVerified: true });
        }

        setTimeout(() => {
          navigate(user ? "/home" : "/login");
        }, 2000);
      } catch (err) {
        setStatus("error");
        setError(
          err.response?.data?.message ||
            "This verification link is invalid or has expired.",
        );
      }
    };

    confirm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#1a1a24] border border-gray-700 flex items-center justify-center">
          {status === "verifying" && (
            <svg
              className="w-8 h-8 text-[#8b5cf6] animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          )}
          {status === "success" && (
            <svg
              className="w-8 h-8 text-green-400"
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
          )}
          {status === "error" && (
            <svg
              className="w-8 h-8 text-red-400"
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
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">
          {status === "verifying" && "Verifying your email..."}
          {status === "success" && "Email verified!"}
          {status === "error" && "Verification failed"}
        </h1>

        <p className="text-gray-400 text-sm mb-8">
          {status === "verifying" && "Hang tight, this only takes a moment."}
          {status === "success" &&
            `Redirecting you to ${user ? "your home feed" : "login"}...`}
          {status === "error" && error}
        </p>

        {status === "error" && (
          <Link
            to={user ? "/verify-email" : "/login"}
            className="inline-block w-full py-3.5 bg-gradient-to-r from-[#8b5cf6] to-[#a78bfa] rounded-full font-medium text-white text-sm shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all"
          >
            {user ? "Send a new link" : "Back to login"}
          </Link>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailConfirm;
