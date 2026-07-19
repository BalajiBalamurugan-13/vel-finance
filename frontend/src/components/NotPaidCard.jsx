function NotPaidCard({ customer }) {
  return (
    <div className="bg-[#151d33] border border-slate-700 rounded-lg px-4 py-3 mb-2 hover:border-green-500 transition">

      <div
        className="grid gap-2 items-center"
        style={{ gridTemplateColumns: "60px 110px 1fr" }}
      >

          <div className="text-sm text-slate-300 font-medium">
              {customer.customer_id}
          </div>

          <div className="font-semibold text-white truncate">
              {customer.name}
          </div>

          <div className="text-sm text-slate-300 truncate">
              {customer.address}
          </div>

      </div>

    </div>
  );
}

export default NotPaidCard;