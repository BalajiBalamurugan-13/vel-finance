import { NavLink } from "react-router-dom";
import navigation from "../constants/navigation";
import Logo from "./Logo";
import LanguageToggle from "./LanguageToggle";
import { useLanguage } from "../context/LanguageContext";

function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const { t } = useLanguage();

  return (
    <aside
      className={`
        fixed lg:sticky
        top-0 left-0
        h-screen
        w-64
        bg-[#111827]
        border-r border-slate-800
        p-4 lg:p-5
        z-50
        flex flex-col
        transform
        transition-transform
        duration-300
        overflow-y-auto

        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}

        lg:translate-x-0
      `}
    >
      <div className="flex justify-between items-center lg:hidden mb-3">
        <LanguageToggle />
        <button
          onClick={() => setSidebarOpen(false)}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 text-slate-300 hover:text-white transition active:scale-95"
          aria-label="Close menu"
        >
          ✕
        </button>
      </div>

      <div className="flex items-center justify-between mb-4">
        <Logo />
        <div className="hidden lg:block">
          <LanguageToggle />
        </div>
      </div>

      <nav className="space-y-1.5 flex-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const label = t(`nav.${item.key}`, item.name);

          return (
            <NavLink
              key={item.key || item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3.5 py-3 transition-all duration-200 font-medium text-sm
                ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-md font-semibold"
                    : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                }`
              }
            >
              <Icon size={19} className="shrink-0" />
              <span className="truncate">{label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="pt-4 mt-auto border-t border-slate-800/80 text-[11px] text-slate-500 text-center">
        <span>VEL Finance v2.0</span>
      </div>
    </aside>
  );
}

export default Sidebar;