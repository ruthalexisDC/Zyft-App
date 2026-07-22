// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { useAuth } from "../context/AuthContext.jsx";
// import api from "../api/axios";

// const VerifyEmailBanner = () => {
//   const { user } = useAuth();
//   const navigate = useNavigate();
//   const [dismissed, setDismissed] = useState(false);
//   const [sending, setSending] = useState(false);
//   const [sent, setSent] = useState(false);
//   const [error, setError] = useState("");

//   if (!user || user.isVerified || dismissed) return null;

//   const handleResend = async () => {
//     setError("");
//     setSending(true);
//     try {
//       await api.post("/auth/verify-email");
//       setSent(true);
//       // Send navigates them to the code entry screen after a beat
//       setTimeout(() => navigate("/verify-email"), 800);
//     } catch (err) {
//       setError(err.response?.data?.message || "Failed to send code");
//     } finally {
//       setSending(false);
//     }
//   };

//   return (
//     <div className="w-full bg-[#1a1a24] border-b border-[#8b5cf6]/30 px-4 py-2.5 flex items-center justify-between text-sm">
//       <div className="flex items-center gap-2 text-gray-300">
//         <svg
//           className="w-4 h-4 text-[#a78bfa] flex-shrink-0"
//           fill="none"
//           stroke="currentColor"
//           viewBox="0 0 24 24"
//         >
//           <path
//             strokeLinecap="round"
//             strokeLinejoin="round"
//             strokeWidth={2}
//             d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
//           />
//         </svg>
//         <span>
//           {sent
//             ? "Code sent — check your inbox."
//             : error || "Verify your email to secure your account."}
//         </span>
//       </div>

//       <div className="flex items-center gap-3 flex-shrink-0">
//         {!sent && (
//           <button
//             onClick={handleResend}
//             disabled={sending}
//             className="text-[#a78bfa] hover:text-[#8b5cf6] font-medium disabled:opacity-50 transition-colors"
//           >
//             {sending ? "Sending..." : "Verify now"}
//           </button>
//         )}
//         <button
//           onClick={() => setDismissed(true)}
//           className="text-gray-500 hover:text-gray-300 transition-colors"
//           aria-label="Dismiss"
//         >
//           ✕
//         </button>
//       </div>
//     </div>
//   );
// };

// export default VerifyEmailBanner;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/axios";

const VerifyEmailBanner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  if (!user || user.isVerified || dismissed) return null;

  const handleResend = async () => {
    setError("");
    setSending(true);
    try {
      await api.post("/auth/verify-email");
      setSent(true);
      // Send them to the "check your inbox" screen after a beat
      setTimeout(() => navigate("/verify-email"), 800);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to send verification link",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="w-full bg-[#1a1a24] border-b border-[#8b5cf6]/30 px-4 py-2.5 flex items-center justify-between text-sm">
      <div className="flex items-center gap-2 text-gray-300">
        <svg
          className="w-4 h-4 text-[#a78bfa] flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>
          {sent
            ? "Link sent — check your inbox."
            : error || "Verify your email to secure your account."}
        </span>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        {!sent && (
          <button
            onClick={handleResend}
            disabled={sending}
            className="text-[#a78bfa] hover:text-[#8b5cf6] font-medium disabled:opacity-50 transition-colors"
          >
            {sending ? "Sending..." : "Verify now"}
          </button>
        )}
        <button
          onClick={() => setDismissed(true)}
          className="text-gray-500 hover:text-gray-300 transition-colors"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default VerifyEmailBanner;
