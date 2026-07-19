function CollectionCard({ payment }) {
return (
    <div
        className="grid gap-2 items-center border-b border-slate-700 py-3"
        style={{ gridTemplateColumns: "55px 80px 1fr 80px" }}
    >

        <div className="text-slate-300">
            {payment.customer_id}
        </div>

        <div
            className="font-semibold text-white truncate"
            title={payment.customer_name}
        >
            {payment.customer_name}
        </div>

        <div
            className="text-slate-300 truncate"
            title={payment.address}
        >
            {payment.address}
        </div>

        <div className="text-right text-green-400 font-bold">
            ₹{payment.amount}
        </div>

    </div>
);
}

export default CollectionCard;