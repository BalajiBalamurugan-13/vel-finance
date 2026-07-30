function CustomerCard({ customer, onClick }) {
    return (
        <button
            onClick={onClick}
            className="
            w-full
            bg-[#182238]
            border
            border-slate-800
            rounded-xl
            px-4
            py-3.5
            hover:border-emerald-500/50
            hover:bg-[#1f2c49]
            active:scale-[0.99]
            transition-all
            duration-200
            text-left
            shadow-sm
            "
        >
            <div
                className="grid items-center gap-2 text-sm"
                style={{ gridTemplateColumns: "40px minmax(90px, 1fr) 1fr 55px" }}
            >

                <div className="text-slate-300 font-medium truncate">
                    {customer.customer_id}
                </div>

                <div
                    className="font-semibold text-white truncate"
                    title={customer.name}
                >
                    {customer.name}
                </div>

                <div
                    className="text-xs text-slate-400 truncate"
                    title={customer.address}
                >
                    {customer.address}
                </div>

                <div
                    className={`text-xs font-semibold text-right ${
                        customer.loan_given
                            ? "text-emerald-400"
                            : "text-amber-400"
                    }`}
                >
                    {customer.loan_given ? "Active" : "Pending"}
                </div>

            </div>
        </button>
    );
}

export default CustomerCard;