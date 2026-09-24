import logoImg from "../assets/Vel finance logo white.png";

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <img
        src={logoImg}
        alt="VEL Finance"
        className="w-10 h-10 object-contain shrink-0 filter drop-shadow-[0_0_10px_rgba(245,158,11,0.85)] drop-shadow-[0_0_20px_rgba(234,179,8,0.5)] transition-all duration-300 hover:drop-shadow-[0_0_15px_rgba(245,158,11,1)]"
      />
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white leading-tight">
          VEL <span className="text-emerald-400">Finance</span>
        </h1>
        <p className="text-[11px] text-slate-400 font-medium tracking-wide">
          Management System
        </p>
      </div>
    </div>
  );
}

export default Logo;