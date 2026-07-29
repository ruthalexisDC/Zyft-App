import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";

// Date this document content was last revised. Update whenever the
// legal.json content changes, and pass through the "date" interpolation
// so the "Last updated" line stays accurate without hardcoding it in text.
const LAST_UPDATED = "2026-07-29";

// docKey is either "privacy" or "terms" — matching the top-level keys in
// locales/en/legal.json and locales/ja/legal.json.
export default function LegalPage({ docKey }) {
  const navigate = useNavigate();
  const { t } = useTranslation(["legal", "common"]);

  const doc = t(`legal:${docKey}`, { returnObjects: true });

  if (!doc || typeof doc === "string") {
    // Translation missing/misconfigured — fail visibly rather than
    // silently rendering nothing.
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white pt-4 pb-28 px-4 max-w-lg mx-auto">
        <p className="text-sm text-red-400">
          Missing legal content for "{docKey}".
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-4 pb-28 px-4 max-w-lg mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-all"
          aria-label={t("legal:nav.back")}
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-sm font-semibold">{doc.title}</h1>
        <div className="w-9 h-9 shrink-0" />
      </div>

      {/* ── Title + last updated ── */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-white mb-1">{doc.title}</h2>
        <p className="text-xs text-gray-500">
          {t(`legal:${docKey}.lastUpdated`, { date: LAST_UPDATED })}
        </p>
      </div>

      {/* ── Intro ── */}
      <div className="bg-[#13131f] rounded-2xl p-4 mb-6 border border-white/5">
        <p className="text-sm text-gray-300 leading-relaxed">{doc.intro}</p>
      </div>

      {/* ── Sections ── */}
      <div className="space-y-6">
        {doc.sections.map((section, idx) => (
          <div key={idx}>
            <h3 className="text-sm font-semibold text-white mb-2">
              {section.heading}
            </h3>

            {section.body?.map((para, pIdx) => (
              <p
                key={pIdx}
                className="text-xs text-gray-400 leading-relaxed mb-2"
              >
                {para}
              </p>
            ))}

            {section.bullets && (
              <ul className="space-y-1.5 my-2 ml-1">
                {section.bullets.map((bullet, bIdx) => (
                  <li
                    key={bIdx}
                    className="flex gap-2 text-xs text-gray-400 leading-relaxed"
                  >
                    <span className="text-purple-400 shrink-0">•</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            )}

            {section.footer && (
              <p className="text-xs text-gray-500 leading-relaxed mt-2 italic">
                {section.footer}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* ── Bottom spacer note ── */}
      <div className="mt-10 pt-4 border-t border-white/5">
        <p className="text-[10px] text-gray-600 text-center">
          {t("common:appName")} · {doc.title}
        </p>
      </div>
    </div>
  );
}
