import { NavLink } from "react-router-dom";
import navigation from "../constants/navigation";
import Logo from "./Logo";

function Sidebar({ sidebarOpen, setSidebarOpen })  {
  return (
    <aside
      className={`
        fixed lg:sticky
        top-0 left-0
        h-screen
        w-64
        bg-[#111827]
        border-r border-slate-800
        p-5
        z-50
        transform
        transition-transform
        duration-300
        overflow-y-auto

        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}

        lg:translate-x-0
      `}
    >
    <div className="flex justify-end lg:hidden mb-4">

      <button
        onClick={() => setSidebarOpen(false)}
        className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 text-slate-300 hover:text-white transition active:scale-95"
        aria-label="Close menu"
      >
        ✕
      </button>

    </div>
      <Logo />

      <nav className="space-y-2">

        {navigation.map((item) => {

          const Icon = item.icon;

          return (

            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl p-3.5 transition-all duration-200 font-medium
                ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-md"
                    : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                }`
              }
            >

              <Icon size={20} />

              <span>{item.name}</span>

            </NavLink>

          );
        })}

      </nav>

    </aside>
  );
}

export default Sidebar;