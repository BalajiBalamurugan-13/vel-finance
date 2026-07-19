import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
    getHistoryByDate,
    getCashFlow
} from "../services/historyService";

function History() {
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
  const today = new Date().toISOString().split("T")[0];

  const [selectedDate, setSelectedDate] = useState(today);
  const [history, setHistory] = useState(null);
  const [cashFlow, setCashFlow] = useState(null);

  async function loadHistory(date) {
    try {
      const data = await getHistoryByDate(date);
      const flow = await getCashFlow(date);

      setHistory(data);
      setCashFlow(flow);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load summary");
    }
  }
  useEffect(() => {
    loadHistory(selectedDate);
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-5 py-6 pb-10 space-y-8">
      <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">
              Daily Summary
          </h1>

          <p className="text-slate-400 text-sm">
              Collections, expenses & cash flow
          </p>
      </div>

      <div className="max-w-sm">
          <label className={labelStyles}>
              Summary Date
          </label>

          <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                  const value = e.target.value;
                  setSelectedDate(value);
                  loadHistory(value);
              }}
              className={`${inputStyles} color-scheme-dark`}
          />
      </div>

      {history && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <div
  className="
    bg-slate-900
    rounded-2xl
    border
    border-green-500/20
    p-6
    shadow-md
  "
>
              <div className="flex items-center justify-between">
                <p className="text-slate-400 text-sm font-medium">Collection</p>
                <span className="text-3xl">💰</span>
              </div>

              <h2 className="text-4xl font-bold text-green-400 mt-4">
                ₹{history.collection}
              </h2>
            </div>

            <div
  className="
    bg-slate-900
    rounded-2xl
    border
    border-red-500/20
    p-6
    shadow-md
  "
>
              <div className="flex items-center justify-between">
                <p className="text-slate-400 font-medium text-sm">Expense</p>
                <span className="text-3xl">💸</span>
              </div>

              <h2 className="text-4xl font-bold text-red-400 mt-3">
                ₹{history.expense}
              </h2>
            </div>

            <div
  className="
    bg-slate-900
    rounded-2xl
    border
    border-blue-500/20
    p-6
    shadow-md
  "
>
              <div className="flex items-center justify-between">
                <p className="text-slate-400 font-medium text-sm">Net</p>
                <span className="text-3xl">📊</span>
              </div>

              <h2
                className={`text-4xl font-bold mt-3 ${
                  history.net >= 0
                    ? "text-blue-400"
                    : "text-red-400"
                }`}
              >
                ₹{history.net}
              </h2>
            </div>

          </div>

          {cashFlow && (

          <div
  className="
    bg-slate-900
    border
    border-slate-800
    rounded-2xl
    p-6
    shadow-md
  "
>

              <div className="flex items-center justify-between mb-6">

                  <h2 className="text-2xl font-bold text-white">
                      💵 Cash Flow
                  </h2>

              </div>

              <div className="space-y-4">

                  <div className="flex justify-between">
                      <span className="text-slate-300">
    Opening Balance
</span>
                      <span className="font-semibold text-white">
    ₹{cashFlow.opening_cash}
</span>
                  </div>

                  <div className="flex justify-between text-green-400">
                      <span className="font-medium">+ Collections</span>
                      <span>₹{cashFlow.collections}</span>
                  </div>

                  <div className="flex justify-between text-green-400">
                      <span className="font-medium">+ Advances</span>
                      <span>₹{cashFlow.advances}</span>
                  </div>

                  <div className="flex justify-between text-red-400">
                      <span className="font-medium">- Purchases</span>
                      <span>₹{cashFlow.purchases}</span>
                  </div>

                  <div className="flex justify-between text-red-400">
                      <span className="font-medium">- Loans</span>
                      <span>₹{cashFlow.loans}</span>
                  </div>

                  <div className="flex justify-between text-red-400">
                      <span className="font-medium">- Expenses</span>
                      <span>₹{cashFlow.expenses}</span>
                  </div>

                  <div className="border-t border-slate-700 my-2"></div>

                  <div className="flex items-center justify-between pt-2">

                      <span className="text-2xl font-bold text-emerald-400">
                          Closing Cash
                      </span>

                      <span className="text-3xl font-bold text-emerald-400">
                          ₹{cashFlow.closing_cash}
                      </span>

                  </div>

              </div>

          </div>

          )}

          <div>
            <h2 className="text-xl font-semibold mb-2">Transactions</h2>

            {history.transactions.length === 0 ? (
              <div className="bg-slate-900 rounded-xl p-6 text-center text-gray-400">
                📭 No transactions for this date
              </div>
            ) : (
              <div className="space-y-3">
                <div className="overflow-hidden rounded-xl border border-slate-700">

                  <div className="grid grid-cols-[60px_1fr_90px] bg-slate-800 p-4 text-slate-400 font-medium">

                      <div>ID</div>

                      <div>Name</div>

                      <div className="text-right">
                          Amount
                      </div>

                  </div>

                  {history.transactions.map((t) => (

                      <div
                          key={`${t.customer_id}-${t.created_at}`}
                          className="
grid
grid-cols-[60px_1fr_90px]
items-center
p-4
border-t
border-slate-700
"
                      >

                          <div className="font-medium text-white">
                              {t.customer_id}
                          </div>

                          <div className="font-semibold text-white truncate">
                              {t.customer_name}
                          </div>

                          <div className="text-right text-lg font-bold text-emerald-400">
                              ₹{t.amount}
                          </div>

                      </div>

                  ))}

              </div>
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Expenses</h2>

            {history.expenses.length === 0 ? (
              <div className="bg-slate-900 rounded-xl p-6 text-center text-gray-400">
                📭 No expenses for this date
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-700">

                  <div className="grid grid-cols-3 bg-slate-800 p-4 text-slate-400 font-medium">

                      <div>Note</div>
                      <div>Time</div>
                      <div className="text-right">Amount</div>

                  </div>

                  {history.expenses.map((e) => (

                      <div
                          key={e.id}
                          className="grid grid-cols-3 p-4 border-t border-slate-700 items-center"
                      >

                          <div>{e.note}</div>

                          <div className="text-slate-400">
                              {new Date(e.created_at).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit"
                              })}
                          </div>

                          <div className="text-right text-red-400 font-bold">
                              ₹{e.amount}
                          </div>

                      </div>

                  ))}

              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default History;