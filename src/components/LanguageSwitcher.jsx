// src/components/LanguageSwitcher.jsx
import { useTranslation } from "react-i18next";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ja", label: "日本語" },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem("lang", code);
  };

  return (
    <select
      value={i18n.language}
      onChange={(e) => changeLanguage(e.target.value)}
      className="bg-white/5 border border-white/10 rounded-lg text-xs px-2 py-1.5 text-gray-300 hover:text-white transition-colors focus:outline-none focus:ring-1 focus:ring-purple-500/50 cursor-pointer"
    >
      {LANGUAGES.map((l) => (
        <option key={l.code} value={l.code} className="bg-[#13131f]">
          {l.label}
        </option>
      ))}
    </select>
  );
}
