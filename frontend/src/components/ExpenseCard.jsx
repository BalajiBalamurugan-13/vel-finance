function ExpenseCard({ expense }) {
return (
    <div
        className="grid gap-2 items-center border-b border-slate-700 py-3"
        style={{ gridTemplateColumns: "50px 1fr 85px 70px" }}
    >

        <div className="text-slate-300">
            {expense.id}
        </div>

        <div
            className="font-semibold text-white truncate"
            title={expense.note}
        >
            {expense.note}
        </div>

        <div className="text-slate-400 text-sm">
            {new Date(expense.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            })}
        </div>

        <div className="text-right text-red-400 font-bold">
            ₹{expense.amount}
        </div>

    </div>
);
}

export default ExpenseCard;