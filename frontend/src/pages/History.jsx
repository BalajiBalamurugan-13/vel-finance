import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
    getHistoryByDate,
    getCashFlow
} from "../services/historyService";
import { getLoansByDate } from "../services/dashboardService";
import { getCustomerDetails } from "../services/customerService";
import { useLanguage } from "../context/LanguageContext";
import LoanGivenDrawer from "../components/Dashboard/LoanGivenDrawer";
import CustomerProfileDrawer from "../components/Customer/CustomerProfileDrawer";

function History() {
  const { t } = useLanguage();
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

  const labelStyles = "block text-sm font-medium text-slate-300 mb-2";
  const today = new Date().toISOString().split("T")[0];

  const [selectedDate, setSelectedDate] = useState(today);
  const [history, setHistory] = useState(null);
  const [cashFlow, setCashFlow] = useState(null);
  const [showLoansDrawer, setShowLoansDrawer] = useState(false);
  const [loansData, setLoansData] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

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

  async function handleOpenLoans() {
    try {
      const res = await getLoansByDate(selectedDate);
      setLoansData(res?.loans || []);
      setShowLoansDrawer(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load loans given");
    }
  }

  useEffect(() => {
    loadHistory(selectedDate);
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-5 py-6 pb-10 space-y-8">
      <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">
              {t("history.title")}
          </h1>

          <p className="text-slate-400 text-sm">
              {t("history.subtitle")}
          </p>
      </div>

      <div className="max-w-sm">
          <label className={labelStyles}>
              {t("history.summary_date")}
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

            <div className="bg-slate-900 rounded-2xl border border-green-500/20 p-6 shadow-md">
              <div className="flex items-center justify-between">
                <p className="text-slate-400 text-sm font-medium">{t("history.collections")}</p>
                <span className="text-3xl">💰</span>
              </div>

              <h2 className="text-4xl font-bold text-green-400 mt-4">
                ₹{(history.collection || 0).toLocaleString("en-IN")}
              </h2>
            </div>

            <div className="bg-slate-900 rounded-2xl border border-red-500/20 p-6 shadow-md">
              <div className="flex items-center justify-between">
                <p className="text-slate-400 text-sm font-medium">{t("history.expenses")}</p>
                <span className="text-3xl">💸</span>
              </div>

              <h2 className="text-4xl font-bold text-red-400 mt-4">
                ₹{(history.expense || 0).toLocaleString("en-IN")}
              </h2>
            </div>

            <div className="bg-slate-900 rounded-2xl border border-slate-700 p-6 shadow-md">
              <div className="flex items-center justify-between">
                <p className="text-slate-400 text-sm font-medium">{t("history.net")}</p>
                <span className="text-3xl">📊</span>
              </div>

              <h2 className={`text-4xl font-bold mt-4 ${(history.net || 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                ₹{(history.net || 0).toLocaleString("en-IN")}
              </h2>
            </div>

          </div>

          {cashFlow && (

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">

              <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">
                      💵 {t("history.cash_flow")}
                  </h2>
              </div>

              <div className="space-y-4">

                  <div className="flex justify-between">
                      <span className="text-slate-300">
                          {t("history.opening_balance")}
                      </span>
                      <span className="font-semibold text-white">
                          ₹{(cashFlow.opening_cash || 0).toLocaleString("en-IN")}
                      </span>
                  </div>

                  <div className="flex justify-between text-green-400">
                      <span className="font-medium">+ {t("dashboard.investment")}</span>
                      <span>₹{(cashFlow.investments || 0).toLocaleString("en-IN")}</span>
                  </div>

                  <div className="flex justify-between text-green-400">
                      <span className="font-medium">+ {t("dashboard.collections")}</span>
                      <span>₹{(cashFlow.collections || 0).toLocaleString("en-IN")}</span>
                  </div>

                  <div className="flex justify-between text-green-400">
                      <span className="font-medium">+ {t("dashboard.furniture_advance")}</span>
                      <span>₹{(cashFlow.advances || 0).toLocaleString("en-IN")}</span>
                  </div>

                  <div className="flex justify-between text-red-400">
                      <span className="font-medium">- {t("dashboard.furniture_purchase")}</span>
                      <span>₹{(cashFlow.purchases || 0).toLocaleString("en-IN")}</span>
                  </div>

                  <div
                      onClick={handleOpenLoans}
                      className="flex justify-between items-center p-2.5 -mx-2.5 rounded-xl hover:bg-slate-800 cursor-pointer transition-all border border-transparent hover:border-red-500/30 group active:scale-[0.99]"
                      title={t("dashboard.loans_given_details")}
                  >
                      <div className="flex items-center gap-2">
                          <span className="font-medium text-red-400">- {t("dashboard.loans_given")}</span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-300 border border-red-500/20 group-hover:bg-red-500/20 transition-colors flex items-center gap-1 font-normal">
                              <span>{t("dashboard.view_loans_hint")}</span>
                              <span>➔</span>
                          </span>
                      </div>
                      <span className="font-bold text-red-400">₹{(cashFlow.loans || 0).toLocaleString("en-IN")}</span>
                  </div>

                  <div className="flex justify-between text-red-400">
                      <span className="font-medium">- {t("dashboard.expenses")}</span>
                      <span>₹{(cashFlow.expenses || 0).toLocaleString("en-IN")}</span>
                  </div>

                  <div className="border-t border-slate-700 my-2"></div>

                  <div className="flex items-center justify-between pt-2">
                      <span className="text-2xl font-bold text-emerald-400">
                          {t("history.closing_cash")}
                      </span>

                      <span className="text-3xl font-bold text-emerald-400">
                          ₹{(cashFlow.closing_cash || 0).toLocaleString("en-IN")}
                      </span>
                  </div>

              </div>

          </div>

          )}

          <div>
            <h2 className="text-xl font-semibold mb-2">{t("history.transactions")}</h2>

            {history.transactions.length === 0 ? (
              <div className="bg-slate-900 rounded-xl p-6 text-center text-gray-400">
                📭 {t("history.no_transactions")}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="overflow-hidden rounded-xl border border-slate-700">

                  <div className="grid grid-cols-[60px_1fr_90px] bg-slate-800 p-4 text-slate-400 font-medium text-xs">
                      <div>ID</div>
                      <div>{t("dashboard.name")}</div>
                      <div className="text-right">{t("dashboard.amount")}</div>
                  </div>

                  {history.transactions.map((tr) => (
                      <div
                          key={`${tr.customer_id}-${tr.created_at || tr.id}`}
                          className="grid grid-cols-[60px_1fr_90px] items-center p-4 border-t border-slate-700 text-sm"
                      >
                          <div className="font-medium text-white">
                              {tr.customer_id}
                          </div>

                          <div className="font-semibold text-white truncate">
                              {tr.customer_name}
                          </div>

                          <div className="text-right text-lg font-bold text-emerald-400">
                              ₹{tr.amount}
                          </div>
                      </div>
                  ))}

              </div>
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">{t("history.expenses")}</h2>

            {history.expenses.length === 0 ? (
              <div className="bg-slate-900 rounded-xl p-6 text-center text-gray-400">
                📭 {t("history.no_expenses")}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="overflow-hidden rounded-xl border border-slate-700">
                  <div className="grid grid-cols-[1fr_80px_90px] bg-slate-800 p-4 text-slate-400 font-medium text-xs">
                    <div>{t("dashboard.note")}</div>
                    <div>{t("dashboard.time")}</div>
                    <div className="text-right">{t("dashboard.amount")}</div>
                  </div>

                  {history.expenses.map((e) => (
                    <div
                      key={e.id}
                      className="grid grid-cols-[1fr_80px_90px] items-center p-4 border-t border-slate-700 text-sm"
                    >
                      <div className="font-semibold text-white truncate">
                        {e.note}
                      </div>

                      <div className="text-xs text-slate-400">
                        {e.created_at ? new Date(e.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-"}
                      </div>

                      <div className="text-right text-lg font-bold text-rose-400">
                        ₹{e.amount}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Loans Given Details Drawer for Selected History Date */}
      <LoanGivenDrawer
        open={showLoansDrawer}
        onClose={() => setShowLoansDrawer(false)}
        loans={loansData}
        date={selectedDate}
        onSelectCustomer={async (cid) => {
          try {
            const cust = await getCustomerDetails(cid);
            setSelectedCustomer(cust);
            setSelectedCustomerId(cid);
          } catch (e) {
            console.error("Failed to load customer", e);
          }
        }}
      />

      {/* Customer Profile Drawer Drilldown */}
      {selectedCustomer && (
        <CustomerProfileDrawer
          open={Boolean(selectedCustomer)}
          onClose={() => {
            setSelectedCustomer(null);
            setSelectedCustomerId(null);
          }}
          customer={selectedCustomer}
          refreshCustomer={async () => {
            if (selectedCustomerId) {
              const updated = await getCustomerDetails(selectedCustomerId);
              setSelectedCustomer(updated);
            }
          }}
          refreshCustomers={() => loadHistory(selectedDate)}
        />
      )}
    </div>
  );
}

export default History;