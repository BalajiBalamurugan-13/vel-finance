function MetricCard({ title, value, icon, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-slate-900 border border-slate-800 rounded-xl min-h-[100px] p-4 lg:p-5 cursor-pointer hover:border-green-500 transition duration-300"
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