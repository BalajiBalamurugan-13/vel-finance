import { useState } from "react";
import { toast } from "react-toastify";
import { addExpense } from "../services/expenseService";

function AddExpense() {
  const inputStyles = `
    w-full
    rounded-xl
    border
    border-slate-600
    bg-slate-800
    px-4
    py-4
    text-white
    text-base
    placeholder:text-slate-500
    transition-all
    duration-200
    focus:outline-none
    focus:ring-2
    focus:ring-emerald-500
    focus:border-transparent
    `;

    const labelStyles =
      "block text-sm font-medium text-slate-300 mb-2";
  const today = new Date().toLocaleDateString("en-CA");
  const [formData, setFormData] = useState({
      amount: "",
      note: "",
      date: today
  });

  function handleChange(e) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit() {
    if (Number(formData.amount) <= 0) {
    toast.error("Please enter a valid amount");
    return;
    }

    if (!formData.note.trim()) {
        toast.error("Please enter an expense note");
        return;
    }

    try {
      await addExpense({
        amount: Number(formData.amount),
        note: formData.note,
        date: formData.date,
      });

      toast.success(`Expense added ₹${formData.amount}`);

      setFormData({
        amount: "",
        note: "",
        date: today,
      });

    } catch (error) {
      console.error(error);
      toast.error("Failed to add expense");
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-6 pb-10">
      <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
              Add Expense
          </h1>

          <p className="text-slate-400 mt-2 text-sm">
              Record business expenses
          </p>
      </div>
      <div className="
                bg-slate-900
                border
                border-slate-800
                rounded-2xl
                p-6
                shadow-lg
                space-y-6">
          <label className={labelStyles}>
              Expense Date <span className="text-red-400">*</span>
          </label>

          <input
            type="date"
            value={formData.date}
            onChange={(e) =>
              setFormData({
                ...formData,
                date: e.target.value
              })
            }
            className={`${inputStyles} color-scheme-dark`}
          />
        
      <div className="space-y-6">

        <div>
            <label className={labelStyles}>
                Amount <span className="text-red-400">*</span>
            </label>

            <input
                type="number"
                inputMode="numeric"
                onWheel={(e) => e.target.blur()}
                name="amount"
                placeholder="Enter expense amount"
                value={formData.amount}
                onChange={handleChange}
                className={inputStyles}
            />
        </div>

        <div>
          <label className={labelStyles}>
              Expense Note <span className="text-red-400">*</span>
          </label>

          <textarea
              rows={3}
              name="note"
              placeholder="Enter expense description"
              value={formData.note}
              onChange={handleChange}
              className={`${inputStyles} resize-none`}
          />
      </div>

        <button
          onClick={handleSubmit}
          className="
              w-full
              bg-red-600
              hover:bg-red-500
              active:scale-[0.98]
              transition-all
              duration-200
              shadow-lg
              rounded-xl
              py-4
              text-white
              font-semibold
              tracking-wide
          "
      >
          Add Expense
      </button>
    </div>
      </div>
    </div>
  );
}

export default AddExpense;