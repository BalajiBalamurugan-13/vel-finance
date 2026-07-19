function CustomerCard({ customer, onClick }) {
    return (
        <button
            onClick={onClick}
            className="
            w-full
            bg-slate-900
            border
            border-slate-800
            rounded-xl
            px-3
            py-3
            hover:border-green-500
            hover:bg-slate-800
            transition
            text-left
            "
        >
            <div
                className="grid items-center gap-2"
                style={{ gridTemplateColumns: "35px 80px 1fr 50px" }}
            >

                <div className="text-slate-300 font-medium">
                    {customer.customer_id}
                </div>

                <div
                    className="font-semibold text-white truncate"
                    title={customer.name}
                >
                    {customer.name}
                </div>

                <div
                    className="text-sm text-slate-400 truncate"
                    title={customer.address}
                >
                    {customer.address}
                </div>

                <div
                    className={`text-xs font-semibold text-right ${
                        customer.loan_given
                            ? "text-green-400"
                            : "text-yellow-400"
                    }`}
                >
                    {customer.loan_given ? "Active" : "Pending"}
                </div>

            </div>
        </button>
    );
}

export default CustomerCard;