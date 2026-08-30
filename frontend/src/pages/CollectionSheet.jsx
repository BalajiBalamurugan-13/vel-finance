import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { getCustomers } from "../services/customerService";
import PageHeader from "../components/PageHeader";
import { FiPrinter, FiRefreshCw, FiCalendar, FiUsers } from "react-icons/fi";
import logoWatermark from "../assets/Vel finance logo white.png";

// Date Utilities
function toInputDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toDisplayDate(isoStr) {
  if (!isoStr) return "";
  const [y, m, d] = isoStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// DL Daily Collection Amount
// Source of truth: AddCustomer.jsx calculateLoanDetails()
//   dailyCollection = loan_amount / 100  (DL only)
// Furniture customers get a blank cell - collector writes manually.
function getDailyAmount(customer) {
  if (customer.type !== "DL") return "";
  const loanAmount = Number(customer.loan_amount) || 0;
  if (loanAmount <= 0) return "";
  return String(Math.round(loanAmount / 100));
}

// A4 Landscape Print Layout
//
// Physical paper:  297 mm wide x 210 mm tall  (A4 landscape)
// @page margin:    10 mm all sides
//   Printable width:  297 - 20 = 277 mm
//   Printable height: 210 - 20 = 190 mm
//
// 10 mm margins: aligns with mobile Safari minimum to prevent auto-scaling
//
// Vertical budget (190 mm):
//   Header block                       =  9.5 mm
//   Table thead row                    =  5.0 mm
//   Table outer border (top + bottom)  =  0.5 mm
//   Available for data rows            = 175.0 mm
//
// Row: 6.0 mm height + ~0.26 mm border = 6.26 mm effective pitch
// Rows per half = floor(175 / 6.26) = 27
// Customers per page = 27 x 2 = 54

const AVAIL_ROW_MM       = 175;   // 190 - 9.5 - 5.0 - 0.5
const ROW_PITCH_MM       = 6.26;
const ROWS_PER_HALF      = Math.floor(AVAIL_ROW_MM / ROW_PITCH_MM); // 27
const CUSTOMERS_PER_PAGE = ROWS_PER_HALF * 2;                        // 54

function CollectionSheet() {
  const today = toInputDate(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [customers, setCustomers]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);

  async function loadCustomers() {
    setLoading(true);
    setError(null);
    try {
      const data = await getCustomers();

      // Active filter: loan_given === true
      const active = data
        .filter((c) => c.loan_given)
        .sort((a, b) => a.customer_id - b.customer_id);

      // Data integrity audit (console only)
      const renderedIds = [];
      for (let i = 0; i < active.length; i += CUSTOMERS_PER_PAGE) {
        const chunk = active.slice(i, i + CUSTOMERS_PER_PAGE);
        const mid   = Math.min(chunk.length, ROWS_PER_HALF);
        chunk.slice(0, mid).forEach((c) => renderedIds.push(c.customer_id));
        chunk.slice(mid).forEach((c)   => renderedIds.push(c.customer_id));
      }
      const activeIds = active.map((c) => c.customer_id);
      const missing   = activeIds.filter((id) => !renderedIds.includes(id));
      const dupes     = renderedIds.filter((id, i) => renderedIds.indexOf(id) !== i);

      console.log("[CollectionSheet] Audit", {
        totalFromAPI:     data.length,
        totalActive:      active.length,
        totalRendered:    renderedIds.length,
        missingIds:       missing,
        duplicateIds:     dupes,
        rowsPerHalf:      ROWS_PER_HALF,
        customersPerPage: CUSTOMERS_PER_PAGE,
        totalPages:       Math.ceil(active.length / CUSTOMERS_PER_PAGE),
      });

      setCustomers(active);
    } catch (err) {
      console.error("[CollectionSheet] Error:", err);
      setError("Unable to load active customers.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadCustomers(); }, []);

  // Pagination - LEFT-FIRST rule
  const pages = [];
  for (let i = 0; i < customers.length; i += CUSTOMERS_PER_PAGE) {
    const chunk = customers.slice(i, i + CUSTOMERS_PER_PAGE);
    const mid   = Math.min(chunk.length, ROWS_PER_HALF);
    pages.push({
      left:  chunk.slice(0, mid),
      right: chunk.slice(mid),
    });
  }

  const displayDate = toDisplayDate(selectedDate);

  function handlePrint() {
    const originalTitle = document.title;
    const dateFormatted = toDisplayDate(selectedDate);
    document.title = dateFormatted
      ? `VEL Finance - Daily Collection - ${dateFormatted}`
      : "VEL Finance - Daily Collection";

    const restoreTitle = () => {
      document.title = originalTitle;
      window.removeEventListener("afterprint", restoreTitle);
    };

    window.addEventListener("afterprint", restoreTitle);

    try {
      window.print();
    } finally {
      // Restore after print dialog closes or asynchronously
      setTimeout(restoreTitle, 500);
    }
  }

  return (
    <>
      {/* SCREEN UI */}
      <div className="no-print max-w-2xl mx-auto px-5 py-6 pb-10">
        <PageHeader
          title="Collection Sheet"
          subtitle="Generate a printable daily collection worksheet for active customers."
        />

        <div className="bg-[#182238] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
              <FiCalendar size={15} />
              Collection Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-[#0f172a] border border-slate-700/80 rounded-xl px-4 py-3.5 text-white color-scheme-dark focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>

          {!loading && !error && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <FiUsers size={15} />
              <span>
                <span className="text-emerald-400 font-semibold">{customers.length}</span>{" "}
                active customers &middot; {pages.length} page{pages.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-3 text-slate-400 text-sm py-2">
              <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              Loading active customers...
            </div>
          )}

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex items-start justify-between gap-4">
              <p className="text-rose-400 text-sm">{error}</p>
              <button onClick={loadCustomers} className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-semibold shrink-0 transition">
                <FiRefreshCw size={13} /> Retry
              </button>
            </div>
          )}

          {!loading && !error && customers.length === 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
              <p className="text-amber-400 text-sm">No active customers available for this collection sheet.</p>
            </div>
          )}

          <button
            onClick={handlePrint}
            disabled={loading || !!error || customers.length === 0}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed active:scale-[0.98] rounded-xl py-3.5 font-semibold text-white shadow-lg shadow-emerald-950/40 transition-all"
          >
            <FiPrinter size={18} />
            Print Collection Sheet
          </button>
        </div>
      </div>

      {/* PRINT DOCUMENT - React Portal renders directly on <body>, outside #root */}
      {createPortal(
        <div className="print-document">
          {pages.map((page, pageIdx) => (
            <div key={pageIdx} className="print-page">
              {/* Centered background watermark */}
              <div className="print-watermark" aria-hidden="true">
                <img
                  src={logoWatermark}
                  alt=""
                  className="print-watermark-img"
                />
              </div>

              <div className="print-header">
                <div className="print-title">VEL FINANCE</div>
                <div className="print-subtitle">Daily Collection Sheet</div>
                <div className="print-date">Date: {displayDate}</div>
              </div>

              <div className="print-tables-row">
                {/* LEFT TABLE */}
                <div className="print-table-wrap">
                  <table className="print-table">
                    <thead>
                      <tr>
                        <th className="col-id">ID</th>
                        <th className="col-name">Name</th>
                        <th className="col-amount">Amount</th>
                        <th className="col-extra">Extra</th>
                        <th className="col-balance">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {page.left.map((c) => (
                        <tr key={c.customer_id} className="print-row">
                          <td className="col-id">{c.customer_id}</td>
                          <td className="col-name">{c.name}</td>
                          <td className="col-amount">{getDailyAmount(c)}</td>
                          <td className="col-extra"></td>
                          <td className="col-balance"></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="print-center-gap" aria-hidden="true" />

                {/* RIGHT TABLE */}
                <div className="print-table-wrap">
                  {page.right.length > 0 && (
                    <table className="print-table">
                      <thead>
                        <tr>
                          <th className="col-id">ID</th>
                          <th className="col-name">Name</th>
                          <th className="col-amount">Amount</th>
                          <th className="col-extra">Extra</th>
                          <th className="col-balance">Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {page.right.map((c) => (
                          <tr key={c.customer_id} className="print-row">
                            <td className="col-id">{c.customer_id}</td>
                            <td className="col-name">{c.name}</td>
                            <td className="col-amount">{getDailyAmount(c)}</td>
                            <td className="col-extra"></td>
                            <td className="col-balance"></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}

export default CollectionSheet;
