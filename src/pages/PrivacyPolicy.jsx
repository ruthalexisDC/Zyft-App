import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-4 pb-24 px-4 max-w-lg mx-auto">
      {/* Header with back button */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-full hover:bg-white/10 transition"
        >
          <ArrowLeft className="w-5 h-5 text-gray-300" />
        </button>
        <h1 className="text-lg font-bold">Privacy Policy</h1>
      </div>

      <div className="bg-[#13131f] rounded-2xl p-5 border border-white/5 space-y-4">
        <section>
          <h2 className="text-sm font-semibold mb-2">Data We Collect</h2>
          <p className="text-xs text-gray-400 leading-relaxed">
            We collect your email, workout data, body metrics, and device
            information.
          </p>
        </section>
        <div className="h-px bg-white/5" />
        <section>
          <h2 className="text-sm font-semibold mb-2">How We Use It</h2>
          <p className="text-xs text-gray-400 leading-relaxed">
            Your data is used for progress insights and streak calculations. We
            do not sell your data.
          </p>
        </section>
        <div className="h-px bg-white/5" />
        <section>
          <h2 className="text-sm font-semibold mb-2">Your Rights</h2>
          <p className="text-xs text-gray-400 leading-relaxed">
            You can request data export or deletion anytime from Account
            Settings.
          </p>
        </section>
      </div>
      <p className="text-[10px] text-gray-600 mt-6 text-center">
        Last updated: May 2026
      </p>
    </div>
  );
}
