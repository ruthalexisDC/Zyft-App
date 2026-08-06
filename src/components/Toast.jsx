import { useEffect } from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";

/**
 * Toast — lightweight, auto-dismissing popup notification.
 * Matches the app's dark theme with purple / green accents.
 *
 * Props:
 *  - message:  string to display
 *  - type:     "success" | "error" (default "success")
 *  - onClose:  callback fired when the toast is dismissed (auto or manual)
 *  - duration: ms before auto-dismiss (default 2200)
 */
export default function Toast({
  message,
  type = "success",
  onClose,
  duration = 2200,
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const isSuccess = type === "success";
  const Icon = isSuccess ? CheckCircle2 : XCircle;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-sm pointer-events-none">
      <div
        className={`pointer-events-auto flex items-center gap-3 rounded-xl border bg-[#13131f]/95 backdrop-blur-xl px-4 py-3 shadow-2xl shadow-black/50 animate-[toast-in_0.25s_ease-out] ${
          isSuccess ? "border-green-500/30" : "border-red-500/30"
        }`}
      >
        <Icon
          size={20}
          className={
            isSuccess ? "text-green-400 shrink-0" : "text-red-400 shrink-0"
          }
        />
        <p className="flex-1 text-sm text-white leading-snug">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-500 hover:text-gray-300 shrink-0 transition-colors"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>

      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
