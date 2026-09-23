import { useLanguage } from "../../context/LanguageContext";

function CashDrawer({ open, onClose, cash, summary, onAddInvestment }) {
    const { t } = useLanguage();

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex justify-end z-50">

            <div className="w-full max-w-md bg-slate-900 h-full p-6 overflow-y-auto">

                <div className="flex justify-between items-center mb-6">

                    <div>
                        <h2 className="text-2xl font-bold text-white">
                            💵 {t("dashboard.available_cash")}
                        </h2>
                        <p className="text-slate-400 text-xs mt-1">
                            {t("dashboard.cash_flow")} • {new Date().toLocaleDateString("en-IN")}
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white text-lg p-2"
                    >
                        ✕
                    </button>

                </div>

                <div className="bg-slate-800 rounded-xl p-4 mb-4">

                    <p className="text-slate-400 text-xs">
                        {t("dashboard.available_cash")}
                    </p>

                    <h1 className="text-2xl lg:text-3xl font-bold text-green-400 mt-2">
                        ₹{(cash?.cash_balance || 0).toLocaleString("en-IN")}
                    </h1>

                </div>

                {/* Add Investment button */}
                {onAddInvestment && (
                    <button
                        onClick={onAddInvestment}
                        className="w-full mb-6 px-4 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all duration-200 active:scale-[0.98] shadow-md flex items-center justify-center gap-2"
                    >
                        💰 {t("dashboard.add_investment")}
                    </button>
                )}

                {summary && (

                <div className="space-y-4">

                    <div className="bg-slate-800 rounded-xl p-4 flex justify-between">
                        <span className="text-slate-300">{t("dashboard.opening_cash")}</span>
                        <span className="font-bold text-white">
                            ₹{(summary.opening_cash || 0).toLocaleString("en-IN")}
                        </span>
                    </div>

                    <div className="bg-slate-800 rounded-xl p-4 flex justify-between">
                        <span className="text-green-400">+ {t("dashboard.investment")}</span>
                        <span className="font-bold text-green-400">
                            ₹{(summary.investments || 0).toLocaleString("en-IN")}
                        </span>
                    </div>
                    <div className="bg-slate-800 rounded-xl p-4 flex justify-between">
                        <span className="text-green-400">+ {t("dashboard.collections")}</span>
                        <span className="font-bold text-green-400">
                            ₹{(summary.collections || 0).toLocaleString("en-IN")}
                        </span>
                    </div>

                    <div className="bg-slate-800 rounded-xl p-4 flex justify-between">
                        <span className="text-green-400">+ {t("dashboard.furniture_advance")}</span>
                        <span className="font-bold text-green-400">
                            ₹{(summary.advances || 0).toLocaleString("en-IN")}
                        </span>
                    </div>

                    <div className="bg-slate-800 rounded-xl p-4 flex justify-between">
                        <span className="text-red-400">- {t("dashboard.furniture_purchase")}</span>
                        <span className="font-bold text-red-400">
                            ₹{(summary.purchases || 0).toLocaleString("en-IN")}
                        </span>
                    </div>

                    <div className="bg-slate-800 rounded-xl p-4 flex justify-between">
                        <span className="text-red-400">- {t("dashboard.loans_given")}</span>
                        <span className="font-bold text-red-400">
                            ₹{(summary.loans || 0).toLocaleString("en-IN")}
                        </span>
                    </div>

                    <div className="bg-slate-800 rounded-xl p-4 flex justify-between">
                        <span className="text-red-400">- {t("dashboard.expenses")}</span>
                        <span className="font-bold text-red-400">
                            ₹{(summary.expenses || 0).toLocaleString("en-IN")}
                        </span>
                    </div>
                    <div className="border-t border-slate-700 my-4"></div>

                        <div className="bg-green-900/30 border border-green-500 rounded-xl p-5 flex justify-between">

                            <span className="text-lg font-semibold text-green-300">
                                {t("dashboard.closing_cash")}
                            </span>

                            <span className="text-2xl font-bold text-green-400">
                                ₹{(summary.closing_cash || 0).toLocaleString("en-IN")}
                            </span>

                        </div>

                </div>

            )}

            </div>

        </div>
    );
}

export default CashDrawer;