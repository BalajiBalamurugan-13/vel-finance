import React, { useEffect, useState, useMemo } from "react";
import { getOutstandingDetails } from "../../services/transactionService";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN").format(value || 0);
}

function OutstandingDrawer({ open, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("outstanding"); // "outstanding" | "count" | "name"

  useEffect(() => {
    if (!open) return;

    let isMounted = true;
    async function fetchDetails() {
      setLoading(true);
      setError(null);
      try {
        const res = await getOutstandingDetails();
        if (isMounted) {
          setData(res);
        }
      } catch (err) {
        console.error("Failed to load outstanding details:", err);
        if (isMounted) {
          setError("Failed to load breakdown details. Please try again.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchDetails();

    return () => {
      isMounted = false;
    };
  }, [open]);

  // Handle ESC key to close
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && open) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Filter and sort place data
  const filteredPlaces = useMemo(() => {
    if (!data?.by_place) return [];

    let list = data.by_place.filter((p) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        p.place_name.toLowerCase().includes(q) ||
        (p.place_id && p.place_id.toString().includes(q))
      );
    });

    list.sort((a, b) => {
      if (sortBy === "count") return b.count - a.count;
      if (sortBy === "name") return a.place_name.localeCompare(b.place_name);
      if (sortBy === "route") return (a.priority ?? 999) - (b.priority ?? 999);
      return b.outstanding - a.outstanding;
    });

    return list;
  }, [data, search, sortBy]);

  if (!open) return null;

  const total = data?.total || {};
  const byType = data?.by_type || [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full sm:max-w-xl md:max-w-2xl bg-[#0f172a] h-full shadow-2xl flex flex-col border-l border-slate-800 z-10 overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-800 bg-slate-900/90 backdrop-blur flex items-center justify-between flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">📈</span>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Outstanding Breakdown
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Live breakdown by Loan Type & Place
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition active:scale-95 border border-slate-700/60"
            aria-label="Close drawer"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-6">
          
          {loading && (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-400 text-sm">Calculating customer balances...</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-red-900/20 border border-red-500/40 text-red-300 text-sm">
              <p className="font-semibold">{error}</p>
              <button
                onClick={() => {
                  setData(null);
                  setLoading(true);
                }}
                className="mt-2 text-xs bg-red-800/60 hover:bg-red-700 px-3 py-1.5 rounded-lg text-white"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && data && (
            <>
              {/* Top Hero Card - Total Outstanding */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-orange-950/30 rounded-2xl p-5 border border-orange-500/30 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-full border border-orange-500/20">
                    Total Active Outstanding
                  </span>
                  <span className="text-xs text-slate-400">
                    {total.places_count} Places
                  </span>
                </div>

                <div className="mt-3">
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-orange-400 tracking-tight">
                    ₹{formatCurrency(total.outstanding)}
                  </h1>
                </div>

                {/* Sub metrics */}
                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-800 text-xs">
                  <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/40">
                    <span className="text-slate-400 block">Total Disbursed</span>
                    <span className="font-semibold text-slate-200 text-sm">
                      ₹{formatCurrency(total.loan_amount)}
                    </span>
                  </div>
                  <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/40">
                    <span className="text-slate-400 block">Total Collected</span>
                    <span className="font-semibold text-emerald-400 text-sm">
                      ₹{formatCurrency(total.paid_amount)}
                    </span>
                  </div>
                </div>

                {/* Overall Repayment Bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>Repaid Progress</span>
                    <span className="text-emerald-400 font-semibold">
                      {total.loan_amount > 0
                        ? Math.round((total.paid_amount / total.loan_amount) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          total.loan_amount > 0
                            ? Math.min((total.paid_amount / total.loan_amount) * 100, 100)
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 1: Breakdown by Loan Type */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <span>📑</span> Loan Type Summary
                  </h3>
                  <span className="text-xs text-slate-400">
                    {byType.length} Types
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {byType.map((t) => {
                    const isDL = t.type === "DL";
                    const isFurniture = t.type === "Furniture";
                    
                    const borderClass = isDL
                      ? "border-amber-500/30 bg-amber-950/10 hover:border-amber-500/50"
                      : isFurniture
                      ? "border-blue-500/30 bg-blue-950/10 hover:border-blue-500/50"
                      : "border-purple-500/30 bg-purple-950/10 hover:border-purple-500/50";

                    const badgeClass = isDL
                      ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
                      : isFurniture
                      ? "bg-blue-500/10 text-blue-300 border-blue-500/20"
                      : "bg-purple-500/10 text-purple-300 border-purple-500/20";

                    const textClass = isDL
                      ? "text-amber-400"
                      : isFurniture
                      ? "text-blue-400"
                      : "text-purple-400";

                    return (
                      <div
                        key={t.type}
                        className={`rounded-xl p-4 border ${borderClass} transition-all duration-150 flex flex-col justify-between`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-white text-sm sm:text-base flex items-center gap-1.5">
                              <span>{t.icon}</span> {t.name}
                            </span>
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${badgeClass}`}>
                              {t.count} {t.count === 1 ? "loan" : "loans"}
                            </span>
                          </div>

                          <div className="mt-2">
                            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
                              Outstanding Balance
                            </span>
                            <div className="flex items-baseline gap-2">
                              <span className={`text-xl sm:text-2xl font-bold tracking-tight ${textClass}`}>
                                ₹{formatCurrency(t.outstanding)}
                              </span>
                              <span className="text-xs text-slate-400">
                                ({t.percentage}%)
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Progress and mini stats */}
                        <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2">
                          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-emerald-400 h-full rounded-full"
                              style={{ width: `${Math.min(t.repaid_percentage || 0, 100)}%` }}
                            />
                          </div>

                          <div className="flex justify-between text-[11px] text-slate-400">
                            <span>Given: <strong className="text-slate-200">₹{formatCurrency(t.loan_amount)}</strong></span>
                            <span>Paid: <strong className="text-emerald-400">₹{formatCurrency(t.paid_amount)}</strong></span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 2: Place-wise Breakdown */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <span>📍</span> Place-wise Outstanding
                    <span className="text-xs font-normal text-slate-400">
                      ({filteredPlaces.length} of {data.by_place?.length})
                    </span>
                  </h3>

                  {/* Sort buttons */}
                  <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 self-start sm:self-auto text-xs overflow-x-auto max-w-full">
                    <button
                      onClick={() => setSortBy("outstanding")}
                      className={`px-2 py-1 rounded-md transition whitespace-nowrap ${
                        sortBy === "outstanding"
                          ? "bg-orange-500 text-white font-medium"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Highest ₹
                    </button>
                    <button
                      onClick={() => setSortBy("route")}
                      className={`px-2 py-1 rounded-md transition whitespace-nowrap ${
                        sortBy === "route"
                          ? "bg-orange-500 text-white font-medium"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Route Order
                    </button>
                    <button
                      onClick={() => setSortBy("count")}
                      className={`px-2 py-1 rounded-md transition whitespace-nowrap ${
                        sortBy === "count"
                          ? "bg-orange-500 text-white font-medium"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Loans Count
                    </button>
                    <button
                      onClick={() => setSortBy("name")}
                      className={`px-2 py-1 rounded-md transition whitespace-nowrap ${
                        sortBy === "name"
                          ? "bg-orange-500 text-white font-medium"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Name
                    </button>
                  </div>
                </div>

                {/* Search box */}
                <div>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="🔍 Search place name (e.g. திருனகிரி, நெப்பத்தூர்)..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition"
                  />
                </div>

                {/* Places list - Fully Mobile Optimized */}
                <div className="space-y-2.5 mt-2">
                  {filteredPlaces.length === 0 ? (
                    <div className="text-center py-10 bg-slate-900/50 rounded-xl border border-slate-800">
                      <p className="text-slate-400 text-sm">No places match "{search}"</p>
                    </div>
                  ) : (
                    filteredPlaces.map((p, idx) => (
                      <div
                        key={p.place_name || idx}
                        className={`rounded-xl p-3.5 border transition flex flex-col gap-2 ${
                          p.count === 0
                            ? "bg-slate-900/40 border-slate-800/40 opacity-75"
                            : "bg-slate-900/80 hover:bg-slate-900 border-slate-800/80 hover:border-slate-700"
                        }`}
                      >
                        {/* Top row: Rank, Place Name, Count badge */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-slate-400">
                              {idx + 1}
                            </span>
                            <span className="font-semibold text-white text-sm sm:text-base truncate">
                              {p.place_name}
                            </span>
                          </div>

                          <div className="flex-shrink-0">
                            {p.count === 0 ? (
                              <span className="text-[11px] bg-slate-800/80 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700/50">
                                0 loans
                              </span>
                            ) : (
                              <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700 font-medium">
                                {p.count} {p.count === 1 ? "loan" : "loans"}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Middle row: Outstanding amount (prominent and never truncated) */}
                        <div className="flex items-baseline justify-between pt-1">
                          <span className="text-xs text-slate-400">Outstanding</span>
                          <div className="flex items-baseline gap-1.5">
                            <span
                              className={`text-base sm:text-lg font-bold whitespace-nowrap ${
                                p.outstanding > 0 ? "text-orange-400" : "text-slate-400"
                              }`}
                            >
                              ₹{formatCurrency(p.outstanding)}
                            </span>
                            {p.percentage > 0 && (
                              <span className="text-[11px] text-slate-500">
                                ({p.percentage}%)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Progress Bar of share */}
                        {p.outstanding > 0 && (
                          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-orange-500/80 h-full rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(p.percentage || 0, 100)}%` }}
                            />
                          </div>
                        )}

                        {/* Bottom Row: Disbursed & Collected details */}
                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                          {p.count === 0 ? (
                            <span className="text-slate-500 italic">No active loans in this place</span>
                          ) : (
                            <>
                              <span className="truncate">
                                Disbursed: <strong className="text-slate-300 font-medium whitespace-nowrap">₹{formatCurrency(p.loan_amount)}</strong>
                              </span>
                              <span className="truncate text-right">
                                Paid: <strong className="text-emerald-400 font-medium whitespace-nowrap">₹{formatCurrency(p.paid_amount)}</strong>
                                <span className="text-slate-500 ml-1">({p.repaid_percentage}%)</span>
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-between items-center text-xs text-slate-400 flex-shrink-0">
          <span>{total.count || 0} active loans across {total.places_count || 0} places</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition font-medium text-xs"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}

export default OutstandingDrawer;
