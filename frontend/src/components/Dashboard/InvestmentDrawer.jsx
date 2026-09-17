import { useState } from "react";
import { addInvestment } from "../../services/dashboardService";
import { toast } from "react-toastify";

function InvestmentDrawer({ open, onClose, onSuccess }) {
  const today = new Date().toISOString().split("T")[0];

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(today);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const inputStyles = `
    w-full rounded-xl border border-slate-700/80 bg-[#0f172a]
    px-4 py-3.5 text-white text-base placeholder:text-slate-500
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
  `;

  const labelStyles = "block text-sm font-medium text-slate-300 mb-2";

  async function handleSubmit() {
    if (!amount || Number(amount) <= 0) {
      toast.error("Enter a valid investment amount");
      return;
    }

    setLoading(true);
    try {
      await addInvestment({
        amount: Number(amount),
        note: note.trim(),
        date: date,
      });

      toast.success(
        `Investment of ₹${Number(amount).toLocaleString("en-IN")} recorded`
      );

      setAmount("");
      setNote("");
      setDate(today);

      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      const message =
        error.response?.data?.detail || "Failed to record investment";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-end z-50">
      <div className="w-full max-w-md bg-slate-900 h-full p-6 overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">
              💰 Add Investment
            </h2>
            <p className="text-slate-400 mt-1">
              Record business investment
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        {/* Info */}
        <div className="bg-emerald-900/20 border border-emerald-500/20 rounded-xl p-4 mb-6">
          <p className="text-sm text-slate-300 leading-relaxed">
            Investment records actual money being introduced into the business.
            This permanently increases your Available Cash.
          </p>
        </div>

        {/* Form */}
        <div className="space-y-5">
          <div>
            <label className={labelStyles}>
              Amount <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              inputMode="numeric"
              placeholder="Enter investment amount"
              value={amount}
              onWheel={(e) => e.target.blur()}
              onChange={(e) => setAmount(e.target.value)}
              className={inputStyles}
            />
          </div>

          <div>
            <label className={labelStyles}>Note (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Transition cash, Business capital"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={inputStyles}
            />
          </div>

          <div>
            <label className={labelStyles}>Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`${inputStyles} color-scheme-dark`}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`w-full rounded-xl py-4 text-white font-semibold tracking-wide transition-all duration-200 ${
              loading
                ? "bg-slate-600 cursor-wait"
                : "bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] shadow-lg"
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Recording...
              </span>
            ) : (
              "Add Investment"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default InvestmentDrawer;
