function MetricCard({ title, value, icon, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-xl min-h-[100px] p-4 lg:p-5 cursor-pointer hover:border-green-500 hover:bg-slate-800/80 transition duration-300 shadow-md"
    >
      <div className="text-slate-400 text-sm mb-2">
        {icon} {title}
      </div>

      <div className="text-2xl lg:text-3xl font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis">
        {value}
      </div>
    </div>
  );
}

export default MetricCard;