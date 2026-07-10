import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function TermsOfService() {
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
        <h1 className="text-lg font-bold">Terms of Service</h1>
      </div>

      <div className="bg-[#13131f] rounded-2xl p-5 border border-white/5 space-y-4">
        <section>
          <h2 className="text-sm font-semibold mb-2">1. Acceptance</h2>
          <p className="text-xs text-gray-400 leading-relaxed">
            By using Zyft, you agree to these terms.
          </p>
        </section>
        <div className="h-px bg-white/5" />
        <section>
          <h2 className="text-sm font-semibold mb-2">2. Health Disclaimer</h2>
          <p className="text-xs text-gray-400 leading-relaxed">
            Zyft is not medical advice. Consult a doctor before starting any
            exercise program.
          </p>
        </section>
        <div className="h-px bg-white/5" />
        <section>
          <h2 className="text-sm font-semibold mb-2">3. Termination</h2>
          <p className="text-xs text-gray-400 leading-relaxed">
            We can suspend your account for violations. You can delete your
            account anytime.
          </p>
        </section>
      </div>
      <p className="text-[10px] text-gray-600 mt-6 text-center">
        Last updated: May 2026
      </p>
    </div>
  );
}
