import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function HelpCenter() {
  const navigate = useNavigate();

  const faqs = [
    {
      q: "How do I start a workout?",
      a: "Tap the + button in the center of your bottom navigation.",
    },
    {
      q: "How is my streak calculated?",
      a: "A streak counts consecutive days with at least one logged workout.",
    },
    {
      q: "How do I log a personal record?",
      a: "During or after a workout, tap 'Log PR'.",
    },
    {
      q: "Can I export my data?",
      a: "Go to Settings → Account → Export Data.",
    },
  ];

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
        <h1 className="text-lg font-bold">Help Center</h1>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, i) => (
          <div
            key={i}
            className="bg-[#13131f] rounded-2xl p-4 border border-white/5"
          >
            <h3 className="text-sm font-semibold mb-2 text-[#8b5cf6]">
              {faq.q}
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">{faq.a}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500 mb-3">Still need help?</p>
        <button className="px-6 py-2.5 rounded-full bg-[#8b5cf6] text-sm font-medium">
          Contact Support
        </button>
      </div>
    </div>
  );
}
