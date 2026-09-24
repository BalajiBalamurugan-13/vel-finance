import { useMemo, useState } from "react";
import DetailDrawer from "../DetailDrawer";
import { useLanguage } from "../../context/LanguageContext";
import { FiSearch, FiUser, FiArrowRight, FiCalendar } from "react-icons/fi";

function LoanGivenDrawer({
    open,
    onClose,
    loans = [],
    date,
    onSelectCustomer
}) {
    const { t } = useLanguage();
    const [search, setSearch] = useState("");

    const totalLoanAmount = (loans || []).reduce(
        (sum, item) => sum + (Number(item.loan_amount) || 0),
        0
    );

    const totalCashDeducted = (loans || []).reduce(
        (sum, item) => sum + (Number(item.cash_deducted ?? item.net_given) || 0),
        0
    );

    const filteredLoans = useMemo(() => {
        const query = search.toLowerCase().trim();
        if (!query) return loans || [];

        return (loans || []).filter((item) => {
            const name = (item.name || "").toLowerCase();
            const cid = String(item.customer_id || "");
            const place = (item.place_name || "").toLowerCase();
            const phone = String(item.phone || "");
            return (
                name.includes(query) ||
                cid.includes(query) ||
                place.includes(query) ||
                phone.includes(query)
            );
        });
    }, [loans, search]);

    return (
        <DetailDrawer
            open={open}
            onClose={onClose}
            title={`🤝 ${t("dashboard.loans_given_details")}`}
            subtitle={`${(loans || []).length} கடன்கள் • 💸 ${t("dashboard.net_cash_handed")}: ₹${totalCashDeducted.toLocaleString("en-IN")} (மொத்த கடன் ₹${totalLoanAmount.toLocaleString("en-IN")})`}
            headers={[]}
        >
            <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                    <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input
                        type="text"
                        placeholder={t("customers.search_placeholder")}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="
                            w-full
                            bg-slate-900
                            border
                            border-slate-700
                            rounded-xl
                            pl-10
                            pr-4
                            py-2.5
                            text-sm
                            text-white
                            placeholder:text-slate-500
                            focus:outline-none
                            focus:border-emerald-500
                            transition-all
                        "
                    />
                    {search && (
                        <button
                            onClick={() => setSearch("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Summary Row */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3 text-center">
                        <span className="text-[11px] text-slate-400 font-medium block">
                            {t("dashboard.loan_amount_label")}
                        </span>
                        <strong className="text-base text-white font-bold block mt-0.5">
                            ₹{totalLoanAmount.toLocaleString("en-IN")}
                        </strong>
                    </div>

                    <div className="bg-rose-950/40 border border-rose-800/50 rounded-xl p-3 text-center">
                        <span className="text-[11px] text-rose-300 font-medium block">
                            {t("dashboard.net_cash_handed")} (பட்டுவாடா)
                        </span>
                        <strong className="text-base text-rose-400 font-bold block mt-0.5">
                            ₹{totalCashDeducted.toLocaleString("en-IN")}
                        </strong>
                    </div>
                </div>

                {/* Date indicator if provided */}
                {date && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 px-1">
                        <FiCalendar size={13} className="text-emerald-400" />
                        <span>தேதி: <strong className="text-slate-200">{date}</strong></span>
                    </div>
                )}

                {/* Loans List */}
                {filteredLoans.length === 0 ? (
                    <div className="text-center py-12 bg-slate-900/50 border border-slate-800 rounded-2xl">
                        <FiUser size={36} className="mx-auto text-slate-600 mb-2.5" />
                        <p className="text-slate-400 text-sm font-medium">
                            {search ? t("customers.no_customers") : t("dashboard.no_loans_today")}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredLoans.map((item) => {
                            const cashHanded = Number(item.cash_deducted ?? item.net_given) || 0;
                            const loanAmt = Number(item.loan_amount) || 0;
                            const deduction = loanAmt - cashHanded;

                            return (
                                <div
                                    key={item.customer_id}
                                    className="bg-slate-800/70 hover:bg-slate-800 border border-slate-700/70 hover:border-slate-600 rounded-xl p-4 transition-all shadow-sm"
                                >
                                    {/* Top Line: ID, Name, Place, Type */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <span className="shrink-0 w-8 h-8 rounded-lg bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center border border-slate-600">
                                                {item.customer_id}
                                            </span>

                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {onSelectCustomer ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => onSelectCustomer(item.customer_id)}
                                                            className="font-bold text-white text-sm hover:text-emerald-400 transition text-left truncate flex items-center gap-1 group"
                                                        >
                                                            <span>{item.name}</span>
                                                            <FiArrowRight size={13} className="opacity-0 group-hover:opacity-100 transition text-emerald-400" />
                                                        </button>
                                                    ) : (
                                                        <span className="font-bold text-white text-sm truncate">
                                                            {item.name}
                                                        </span>
                                                    )}

                                                    {item.place_name && item.place_name !== "-" && (
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 font-medium">
                                                            {item.place_name}
                                                        </span>
                                                    )}

                                                    {item.type === "Furniture" ? (
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 font-semibold border border-amber-800/40">
                                                            பர்னிச்சர்
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-semibold border border-emerald-800/40">
                                                            DL
                                                        </span>
                                                    )}
                                                </div>

                                                {item.phone && (
                                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                                        📞 {item.phone}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Financial Breakdown Grid */}
                                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-700/60 text-xs">
                                        <div className="text-left">
                                            <span className="text-[10px] text-slate-400 block">{t("dashboard.loan_amount_label")}</span>
                                            <strong className="text-white font-semibold">₹{loanAmt.toLocaleString("en-IN")}</strong>
                                        </div>

                                        <div className="text-center">
                                            <span className="text-[10px] text-slate-400 block">{t("dashboard.deduction")}</span>
                                            <strong className="text-amber-400 font-semibold">-₹{deduction.toLocaleString("en-IN")}</strong>
                                        </div>

                                        <div className="text-right">
                                            <span className="text-[10px] text-rose-300 block">{t("dashboard.net_cash_handed")}</span>
                                            <strong className="text-rose-400 font-bold text-sm">₹{cashHanded.toLocaleString("en-IN")}</strong>
                                        </div>
                                    </div>

                                    {/* Daily installment note */}
                                    {item.daily_installment > 0 && (
                                        <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between bg-slate-900/60 px-2.5 py-1 rounded-lg">
                                            <span>தினசரி தவணை: <strong className="text-blue-400">₹{item.daily_installment}/நாள்</strong></span>
                                            {item.due_date && <span>கடன் முடிவு: {item.due_date}</span>}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </DetailDrawer>
    );
}

export default LoanGivenDrawer;
