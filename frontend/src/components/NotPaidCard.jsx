function NotPaidCard({ customer }) {
  return (
    <div className="bg-[#182238] border border-slate-800 rounded-xl px-4 py-3.5 mb-2 hover:border-emerald-500/50 hover:bg-[#1f2c49] transition-all duration-200 shadow-sm">

      <div
        className="grid gap-2 items-center text-sm"
        style={{ gridTemplateColumns: "60px 110px 1fr" }}
      >

          <div className="text-slate-300 font-medium truncate">
              {customer.customer_id}
          </div>

          <div className="font-semibold text-white truncate">
              {customer.name}
          </div>

          <div className="text-xs text-slate-400 truncate">
              {customer.address}
          </div>

      </div>

    </div>
  );
}

export default NotPaidCard;