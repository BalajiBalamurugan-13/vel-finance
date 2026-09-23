import { useMemo, useState } from "react";
import DetailDrawer from "../DetailDrawer";
import ExpenseCard from "../ExpenseCard";
import { useLanguage } from "../../context/LanguageContext";

function ExpenseDrawer({
    open,
    onClose,
    expenses
}) {
    const { t } = useLanguage();
    const today = new Date().toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
    });
    const [search, setSearch] = useState("");
    const totalExpense = (expenses || []).reduce(
        (sum, expense) => sum + (expense.amount || 0),
        0
    );
    const subtitle = `${today} • 🧾 ${(expenses || []).length} ${t("dashboard.expenses")} • 💸 ₹${totalExpense.toLocaleString("en-IN")}`;


    const filteredExpenses = useMemo(() => {
        const query = search.toLowerCase().trim();
        if (!query) return expenses || [];

        return (expenses || []).filter((expense) =>
            (expense.note || "").toLowerCase().includes(query)
        );

    }, [expenses, search]);

    return (
        <DetailDrawer
            open={open}
            onClose={onClose}
            title={t("expenses.today_expenses")}
            subtitle={subtitle}
            headers={[]}
        >

            <div className="mb-5">

                <input
                    type="text"
                    placeholder="🔍 Search by Note..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="
                        w-full
                        bg-slate-900
                        border
                        border-slate-700
                        rounded-lg
                        px-4
                        py-3
                        text-white
                        placeholder:text-slate-500
                        focus:outline-none
                        focus:border-red-500
                    "
                />

            </div>
            <div
                className="grid gap-2 px-2 mb-3 text-xs font-semibold text-slate-400 uppercase"
                style={{ gridTemplateColumns: "50px 1fr 85px 70px" }}
            >
                <div>ID</div>
                <div>{t("dashboard.note")}</div>
                <div>{t("dashboard.time")}</div>
                <div className="text-right">{t("dashboard.amount")}</div>
            </div>

            {filteredExpenses.length === 0 ? (

                <div className="text-center text-gray-400 py-10">
                    {t("dashboard.no_expenses_yet")}
                </div>

            ) : (

                filteredExpenses.map((expense) => (

                    <ExpenseCard
                        key={expense.id}
                        expense={expense}
                    />

                ))

            )}

        </DetailDrawer>
    );
}

export default ExpenseDrawer;