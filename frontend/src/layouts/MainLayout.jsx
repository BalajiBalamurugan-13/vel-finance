import { useState } from "react";
import Sidebar from "../components/Sidebar";

function MainLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">

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

      <main className="flex-1 bg-slate-950 min-h-screen">

        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-slate-800">

          <button
            onClick={() => setSidebarOpen(true)}
            className="text-3xl"
          >
            ☰
          </button>

          <h1 className="text-lg font-bold">
            VEL Finance
          </h1>

          <div></div>

        </div>

        <div className="p-4 lg:p-8">
          {children}
        </div>

      </main>

    </div>
  );
}

export default MainLayout;