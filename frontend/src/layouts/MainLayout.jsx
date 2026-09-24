import { useState } from "react";
import Sidebar from "../components/Sidebar";
import LanguageToggle from "../components/LanguageToggle";
import logoImg from "../assets/Vel finance logo white.png";

function MainLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-950 text-white relative">

      {/* App-Wide Centered Background Watermark with Golden Glow */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        {/* Soft Golden Aura */}
        <div className="absolute w-[280px] sm:w-[420px] h-[280px] sm:h-[420px] rounded-full bg-amber-500/[0.08] blur-[70px] pointer-events-none" />

        <img
          src={logoImg}
          alt=""
          className="w-80 sm:w-[480px] lg:w-[560px] max-w-[85vw] max-h-[75vh] object-contain opacity-[0.20] select-none pointer-events-none transform -translate-x-[2%] translate-y-[2%] filter drop-shadow-[0_0_35px_rgba(245,158,11,0.5)] drop-shadow-[0_0_70px_rgba(217,119,6,0.3)]"
        />
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <main className="flex-1 min-h-screen min-w-0 relative z-10 flex flex-col">

        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-slate-800 bg-[#111827]/90 backdrop-blur-md sticky top-0 z-30">

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-2xl p-1 text-slate-300 hover:text-white"
              aria-label="Open menu"
            >
              ☰
            </button>

            <div className="flex items-center gap-2.5">
              <img
                src={logoImg}
                alt="VEL Finance"
                className="w-8 h-8 object-contain shrink-0 filter drop-shadow-[0_0_8px_rgba(245,158,11,0.85)] drop-shadow-[0_0_16px_rgba(234,179,8,0.5)]"
              />
              <h1 className="text-base font-bold text-white tracking-tight">
                VEL <span className="text-emerald-400">Finance</span>
              </h1>
            </div>
          </div>

          <LanguageToggle />

        </div>

        <div className="p-4 lg:p-8 flex-1">
          {children}
        </div>

      </main>

    </div>
  );
}

export default MainLayout;