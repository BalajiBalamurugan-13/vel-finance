import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { getCustomers } from "../services/customerService";
import PageHeader from "../components/PageHeader";
import { FiPrinter, FiRefreshCw, FiCalendar, FiUsers } from "react-icons/fi";

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

// ─── A4 Landscape print layout ──────────────────────────────────────────────
//
//  Physical paper:     297mm wide × 210mm tall (A4 landscape)
//  @page margins:      10mm uniform (all sides)
//
//  WHY 10mm MARGINS:
//    Mobile browsers (Safari, Chrome) enforce a minimum printable margin
//    of approximately 10–12mm. If we specify smaller margins (7mm, 8mm),
//    the browser silently enforces its own larger margin but our content
//    was sized for the smaller margin → content overflows the printable
//    area → user must manually scale to 92% on mobile.
//    Using 10mm aligns with the minimum enforced by all major browsers
//    so the content fits at 100% scale on both desktop and mobile.
//
//  Usable height:      210 - 20 = 190mm
//  Usable width:       297 - 20 = 277mm
//
//  Vertical space consumed by non-row elements:
//    Print header (title + subtitle + date + border + gap)  = 12mm
//    Table <thead> column labels                            =  5.5mm
//    Table outer border (top + bottom)                      =  0.5mm
//  ─────────────────────────────────────────────────────────────
//    Available for data rows = 190 - 12 - 5.5 - 0.5 = 172mm
//
//  Row design:
//    CSS td height  = 6.5mm  (between college-ruled 7.1mm and narrow-ruled 6.4mm)
//    Border pitch   = ~0.2mm per row (collapsed 0.5pt border)
//    Effective pitch = 6.7mm per row
//
//  Rows per half-table = floor(172 / 6.7) = 25
//  Safety buffer       = -1 row (portal rendering eliminates wrapper interference)
//  Final rows per half = 24
//  Customers per page  = 24 × 2 = 48
//
//  With 225 active customers: ceil(225 / 48) = 5 pages
//
//  PAGINATION RULE:
//    On every page, fill the LEFT table first (up to ROWS_PER_HALF).
//    Only after the left table is full do customers continue in the RIGHT table.
//    On the final page, if fewer than ROWS_PER_HALF customers remain,
//    they all appear sequentially in the LEFT table; the right table stays empty.
//
//  PORTAL RENDERING:
//    The .print-document is rendered via React Portal as a direct child of
//    <body>, completely outside the #root application tree.
//    In @media print, #root is hidden entirely.

const A4_H_MM          = 210;
const PAGE_MARGIN_MM   =  10;     // uniform 10mm — safe for desktop + mobile
const USABLE_H_MM      = A4_H_MM - PAGE_MARGIN_MM * 2;        // 190mm

const HEADER_H_MM      =  12;    // print header block (compact)
const THEAD_H_MM       = 5.5;    // table column header row
const TABLE_BORDER_MM  = 0.5;    // outer borders

const AVAILABLE_H_MM   = USABLE_H_MM - HEADER_H_MM - THEAD_H_MM - TABLE_BORDER_MM;  // 172mm

const ROW_CSS_H_MM     = 6.5;    // CSS height on <td> — comfortable for handwriting
const ROW_PITCH_MM     = 6.7;    // effective pitch including collapsed border
const SAFETY_ROWS      =   1;    // portal eliminates wrapper interference, 1 row buffer is sufficient

const ROWS_PER_HALF    = Math.floor(AVAILABLE_H_MM / ROW_PITCH_MM) - SAFETY_ROWS;  // 24
const CUSTOMERS_PER_PAGE = ROWS_PER_HALF * 2;                                       // 48

// ────────────────────────────────────────────────────────────────────────────

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

      // Active customer filter — same logic as CustomerCard "Active" badge.
      // loan_given === true means the customer has an active loan.
      const active = data
        .filter((c) => c.loan_given)
        .sort((a, b) => a.customer_id - b.customer_id);

      // ── Data integrity audit (temporary, console only) ──────────────────
      const renderedIds = [];
      for (let i = 0; i < active.length; i += CUSTOMERS_PER_PAGE) {
        const chunk = active.slice(i, i + CUSTOMERS_PER_PAGE);
        // LEFT-FIRST: fill left table to capacity, remainder goes to right
        const mid = Math.min(chunk.length, ROWS_PER_HALF);
        chunk.slice(0, mid).forEach((c) => renderedIds.push(c.customer_id));
        chunk.slice(mid).forEach((c) => renderedIds.push(c.customer_id));
      }
      const activeIds = active.map((c) => c.customer_id);
      const missing = activeIds.filter((id) => !renderedIds.includes(id));
      const dupes = renderedIds.filter((id, i) => renderedIds.indexOf(id) !== i);

      console.log("[CollectionSheet] Data integrity audit", {
        totalFromAPI: data.length,
        totalActive: active.length,
        totalRendered: renderedIds.length,
        missingIds: missing,
        duplicateIds: dupes,
        customer309: data.find((c) => c.customer_id === 309) || "NOT IN API",
        customer309Active: active.some((c) => c.customer_id === 309) ? "YES" : "NO",
        rowsPerHalf: ROWS_PER_HALF,
        customersPerPage: CUSTOMERS_PER_PAGE,
        totalPages: Math.ceil(active.length / CUSTOMERS_PER_PAGE),
      });
      // ──────────────────────────────────────────────────────────────────────

      setCustomers(active);
    } catch (err) {
      console.error("[CollectionSheet] Error:", err);
      setError("Unable to load active customers.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadCustomers(); }, []);

  // ── Pagination ────────────────────────────────────────────────────────────
  // LEFT-FIRST rule: fill left table up to ROWS_PER_HALF, then right table.
  // On the final page with fewer customers, they all go in the left table.
  const pages = [];
  for (let i = 0; i < customers.length; i += CUSTOMERS_PER_PAGE) {
    const chunk = customers.slice(i, i + CUSTOMERS_PER_PAGE);
    const mid = Math.min(chunk.length, ROWS_PER_HALF);
    pages.push({
      left: chunk.slice(0, mid),
      right: chunk.slice(mid),
    });
  }

  const displayDate = toDisplayDate(selectedDate);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ═══ SCREEN UI ═══════════════════════════════════════════════════════ */}
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
            onClick={() => window.print()}
            disabled={loading || !!error || customers.length === 0}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed active:scale-[0.98] rounded-xl py-3.5 font-semibold text-white shadow-lg shadow-emerald-950/40 transition-all"
          >
            <FiPrinter size={18} />
            Print Collection Sheet
          </button>
        </div>
      </div>

      {/* ═══ PRINT DOCUMENT ══════════════════════════════════════════════════
          Rendered via createPortal as a DIRECT CHILD of <body>.
          Outside #root — mobile header, sidebar, padding cannot interfere.
      ═════════════════════════════════════════════════════════════════════ */}
      {createPortal(
        <div className="print-document">
          {pages.map((page, pageIdx) => (
            <div key={pageIdx} className="print-page">
              <div className="print-header">
                <div className="print-title">VEL FINANCE</div>
                <div className="print-subtitle">Daily Collection Sheet</div>
                <div className="print-date">Date: {displayDate}</div>
              </div>

              <div className="print-tables-row">
                <div className="print-table-wrap">
                  <table className="print-table">
                    <thead>
                      <tr>
                        <th className="col-id">ID</th>
                        <th className="col-name">Name</th>
                        <th className="col-amount">Amount</th>
                        <th className="col-balance">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {page.left.map((c) => (
                        <tr key={c.customer_id} className="print-row">
                          <td className="col-id">{c.customer_id}</td>
                          <td className="col-name">{c.name}</td>
                          <td className="col-amount"></td>
                          <td className="col-balance"></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="print-center-gap" aria-hidden="true" />

                <div className="print-table-wrap">
                  {page.right.length > 0 && (
                    <table className="print-table">
                      <thead>
                        <tr>
                          <th className="col-id">ID</th>
                          <th className="col-name">Name</th>
                          <th className="col-amount">Amount</th>
                          <th className="col-balance">Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {page.right.map((c) => (
                          <tr key={c.customer_id} className="print-row">
                            <td className="col-id">{c.customer_id}</td>
                            <td className="col-name">{c.name}</td>
                            <td className="col-amount"></td>
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
