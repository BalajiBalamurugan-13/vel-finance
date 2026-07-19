function CashDrawer({ open, onClose, cash, summary }) {

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex justify-end z-50">

            <div className="w-full max-w-md bg-slate-900 h-full p-6 overflow-y-auto">

                <div className="flex justify-between items-center mb-6">

                    <h2 className="text-2xl font-bold text-white">
                        💵 Available Cash
                    </h2>
                    <p className="text-slate-400 mt-1">
                        Today's Cash Flow • {new Date().toLocaleDateString()}
                    </p>

                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white"
                    >
                        ✕
                    </button>

                </div>

                <div className="bg-slate-800 rounded-xl p-4 mb-6">

                    <p className="text-slate-400">
                        Current Balance
                    </p>

                    <h1 className="text-2xl lg:text-3xl font-bold text-green-400 mt-2">
                        ₹{cash.cash_balance}
                    </h1>

                </div>

                <div className="space-y-4">

                    <div className="bg-slate-800 rounded-xl p-4 flex justify-between">
                        <span className="text-slate-300">Opening Cash</span>
                        <span className="font-bold text-white">
                            ₹{summary.opening_cash}
                        </span>
                    </div>

                    <div className="bg-slate-800 rounded-xl p-4 flex justify-between">
                        <span className="text-green-400">+ Investment</span>
                        <span className="font-bold text-green-400">
                            ₹{summary.investments}
                        </span>
                    </div>
                    <div className="bg-slate-800 rounded-xl p-4 flex justify-between">
                        <span className="text-green-400">+ Collections</span>
                        <span className="font-bold text-green-400">
                            ₹{summary.collections}
                        </span>
                    </div>

                    <div className="bg-slate-800 rounded-xl p-4 flex justify-between">
                        <span className="text-green-400">+ Furniture Advance</span>
                        <span className="font-bold text-green-400">
                            ₹{summary.advances}
                        </span>
                    </div>

                    <div className="bg-slate-800 rounded-xl p-4 flex justify-between">
                        <span className="text-red-400">- Furniture Purchase</span>
                        <span className="font-bold text-red-400">
                            ₹{summary.purchases}
                        </span>
                    </div>

                    <div className="bg-slate-800 rounded-xl p-4 flex justify-between">
                        <span className="text-red-400">- Loan Given</span>
                        <span className="font-bold text-red-400">
                            ₹{summary.loans}
                        </span>
                    </div>

                    <div className="bg-slate-800 rounded-xl p-4 flex justify-between">
                        <span className="text-red-400">- Expenses</span>
                        <span className="font-bold text-red-400">
                            ₹{summary.expenses}
                        </span>
                    </div>
                    <div className="border-t border-slate-700 my-4"></div>

                        <div className="bg-green-900/30 border border-green-500 rounded-xl p-5 flex justify-between">

                            <span className="text-lg font-semibold text-green-300">
                                Closing Cash
                            </span>

                            <span className="text-2xl font-bold text-green-400">
                                ₹{summary.closing_cash}
                            </span>

                        </div>

                </div>

            </div>

        </div>
    );

}

export default CashDrawer;