import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { requestPasswordReset } from "../api/auth"; // adjust path to your API file

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

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "" });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "" }), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await requestPasswordReset({ email });
      setIsSent(true);
      showToast("Reset link sent! Check your inbox.", "success");
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Failed to send reset link";
      showToast(msg, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Success state after email is sent
  if (isSent) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-6 relative overflow-hidden">
        <div className="absolute top-[-120px] right-[-80px] w-72 h-72 bg-purple-600/30 blur-3xl rounded-full" />
        <div className="absolute bottom-[-140px] left-[-100px] w-80 h-80 bg-indigo-500/20 blur-3xl rounded-full" />

        <div className="relative z-10 w-full max-w-md bg-zinc-950/90 border border-purple-500/20 rounded-3xl shadow-2xl shadow-purple-500/10 p-8 backdrop-blur-xl text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
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
          </div>

          <h2 className="text-2xl font-bold mb-3">Check Your Email</h2>
          <p className="text-zinc-400 text-sm leading-relaxed mb-8">
            We sent a password reset link to
            <br />
            <span className="text-white font-medium">{email}</span>
          </p>

          <button
            onClick={() => navigate("/login")}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-500 hover:opacity-90 transition-all font-semibold shadow-lg shadow-purple-500/20"
          >
            Back to Login
          </button>

          <button
            onClick={() => {
              setIsSent(false);
              setEmail("");
            }}
            className="mt-4 text-sm text-zinc-500 hover:text-purple-400 transition-colors"
          >
            Didn't receive it? Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6 relative overflow-hidden">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "" })}
      />

      {/* Background Glow */}
      <div className="absolute top-[-120px] right-[-80px] w-72 h-72 bg-purple-600/30 blur-3xl rounded-full" />
      <div className="absolute bottom-[-140px] left-[-100px] w-80 h-80 bg-indigo-500/20 blur-3xl rounded-full" />

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-md bg-zinc-950/90 border border-purple-500/20 rounded-3xl shadow-2xl shadow-purple-500/10 p-8 backdrop-blur-xl">
        {/* Logo / Branding */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-extrabold tracking-wide">ZYFT</h1>
          <p className="text-zinc-400 mt-3 text-sm leading-relaxed">
            Forgot your password? No worries.
            <br />
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm text-zinc-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="w-full h-14 rounded-2xl bg-zinc-900 border border-zinc-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 outline-none px-4 text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Reset Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-500 hover:opacity-90 transition-all font-semibold shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Sending...
              </>
            ) : (
              "Send Reset Link"
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-8">
          <div className="flex-1 h-px bg-zinc-800" />
          <span className="text-zinc-500 text-xs uppercase tracking-widest">
            OR
          </span>
          <div className="flex-1 h-px bg-zinc-800" />
        </div>

        {/* Back to Login */}
        <Link
          to="/login"
          className="w-full h-12 rounded-2xl border border-zinc-800 hover:border-purple-500/40 hover:bg-purple-500/5 transition-all text-sm text-zinc-300 flex items-center justify-center"
        >
          Back to Login
        </Link>

        {/* Footer */}
        <p className="text-center text-xs text-zinc-600 mt-8 leading-relaxed">
          Stay consistent. Stay strong.
          <br />
          Zyft helps you build habits without pressure.
        </p>
      </div>
    </div>
  );
}
