import { useLanguage } from "../context/LanguageContext";

export default function LanguageToggle({ className = "" }) {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      className={`inline-flex items-center rounded-xl bg-slate-900 border border-slate-700/80 p-0.5 text-xs font-semibold ${className}`}
      role="group"
      aria-label="Language selection"
    >
      <button
        type="button"
        onClick={() => setLanguage("ta")}
        className={`px-2.5 py-1 rounded-lg transition-all ${
          language === "ta"
            ? "bg-emerald-600 text-white shadow-sm font-bold"
            : "text-slate-400 hover:text-slate-200"
        }`}
      >
        தமிழ்
      </button>
      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={`px-2.5 py-1 rounded-lg transition-all ${
          language === "en"
            ? "bg-emerald-600 text-white shadow-sm font-bold"
            : "text-slate-400 hover:text-slate-200"
        }`}
      >
        EN
      </button>
    </div>
  );
}
