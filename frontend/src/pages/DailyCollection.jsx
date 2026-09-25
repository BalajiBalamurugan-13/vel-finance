import { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { getDailySheet, addPayment, deletePayment } from "../services/transactionService";
import { getCustomerDetails } from "../services/customerService";
import CustomerProfileDrawer from "../components/Customer/CustomerProfileDrawer";
import { useLanguage } from "../context/LanguageContext";
import { toast } from "react-toastify";
import {
  FiCheck,
  FiCalendar,
  FiPrinter,
  FiSearch,
  FiArrowRight,
  FiArrowLeft,
  FiCheckCircle,
  FiAlertCircle,
  FiUser,
  FiRotateCcw,
} from "react-icons/fi";

function toInputDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function DailyCollection() {
  const { t } = useLanguage();
  const [selectedDate, setSelectedDate] = useState(() => toInputDate(new Date()));
  const [loading, setLoading] = useState(true);
  const [sheetData, setSheetData] = useState({
    places: [],
    customers: [],
    summary: { total_customers: 0, collected_count: 0, total_collected: 0, total_expected_daily: 0 },
  });
  const [selectedPlaceId, setSelectedPlaceId] = useState("all");
  const [selectedSession, setSelectedSession] = useState("all"); // "all" | "morning" | "evening"
  const [search, setSearch] = useState("");
  const [inputAmounts, setInputAmounts] = useState({});
  const [submittingCid, setSubmittingCid] = useState(null);

  // Customer Drawer State
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDetails, setCustomerDetails] = useState(null);

  const inputRefs = useRef({});

  // Fetch sheet data on date change
  async function loadSheet(dateToFetch) {
    setLoading(true);
    try {
      const data = await getDailySheet(dateToFetch || selectedDate);
      if (data && !data.error) {
        setSheetData(data);
        // Pre-fill input amounts with daily_installment for unpaid customers
        const initial = {};
        (data.customers || []).forEach((c) => {
          if (!c.today_paid && c.daily_installment > 0) {
            initial[c.customer_id] = String(c.daily_installment);
          }
        });
        setInputAmounts((prev) => ({ ...initial, ...prev }));
      }
    } catch (err) {
      console.error("Failed to load daily sheet:", err);
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSheet(selectedDate);
  }, [selectedDate]);

  // Open Customer Drawer
  async function openCustomer(customerId, showLoading = true) {
    setSelectedCustomer(customerId);
    if (showLoading) setCustomerDetails(null);
    try {
      const data = await getCustomerDetails(customerId);
      setCustomerDetails(data);
    } catch (err) {
      console.error(err);
    }
  }

  // Handle single collection payment
  async function handleCollect(customer, customAmount = null) {
    const rawAmt = customAmount !== null ? customAmount : inputAmounts[customer.customer_id];
    const amt = Number(rawAmt);

    if (!amt || amt <= 0) {
      toast.warning(t("daily_collection.enter_amount") || "Enter valid amount");
      return;
    }

    setSubmittingCid(customer.customer_id);
    try {
      const res = await addPayment({
        customer_id: customer.customer_id,
        amount_paid: amt,
        payment_date: selectedDate,
      });

      toast.success(`₹${amt} ${t("daily_collection.paid_badge")}`);

      // Optimistically update local sheet data
      setSheetData((prev) => {
        const updatedCusts = prev.customers.map((c) => {
          if (c.customer_id === customer.customer_id) {
            return {
              ...c,
              today_paid: (c.today_paid || 0) + amt,
              today_tx_id: res?.id || c.today_tx_id || Date.now(),
              balance: Math.max(0, c.balance - amt),
            };
          }
          return c;
        });

        const newCollectedCount = updatedCusts.filter((c) => (c.today_paid || 0) > 0).length;
        const newTotalCollected = updatedCusts.reduce((sum, c) => sum + (c.today_paid || 0), 0);

        return {
          ...prev,
          customers: updatedCusts,
          summary: {
            ...prev.summary,
            collected_count: newCollectedCount,
            total_collected: newTotalCollected,
          },
        };
      });

      // Auto-focus next unpaid customer input
      setTimeout(() => {
        focusNextUnpaidCustomer(customer.customer_id);
      }, 50);
    } catch (err) {
      console.error("Failed to add payment:", err);
      toast.error("Failed to collect payment");
    } finally {
      setSubmittingCid(null);
    }
  }

  // Focus next unpaid customer
  function focusNextUnpaidCustomer(currentCid) {
    const custs = displayedCustomers;
    const currentIndex = custs.findIndex((c) => c.customer_id === currentCid);
    if (currentIndex >= 0) {
      for (let i = currentIndex + 1; i < custs.length; i++) {
        if (!custs[i].today_paid && inputRefs.current[custs[i].customer_id]) {
          inputRefs.current[custs[i].customer_id]?.focus();
          inputRefs.current[custs[i].customer_id]?.select();
          break;
        }
      }
    }
  }

  // Undo / Delete payment
  async function handleUndo(customer) {
    if (!customer.today_tx_id) {
      // Reload sheet if tx id missing
      loadSheet(selectedDate);
      return;
    }

    if (!window.confirm(`${customer.name} - ₹${customer.today_paid} ${t("daily_collection.undo")}?`)) {
      return;
    }

    setSubmittingCid(customer.customer_id);
    try {
      await deletePayment(customer.today_tx_id);
      toast.info(t("daily_collection.undo") + " " + t("common.success"));

      // Refresh sheet to ensure balances and cashbook are perfectly sync'd
      await loadSheet(selectedDate);
    } catch (err) {
      console.error("Failed to undo payment:", err);
      toast.error(t("common.error"));
    } finally {
      setSubmittingCid(null);
    }
  }

  // Handle Session Change
  function handleSelectSession(session) {
    setSelectedSession(session);
    setSelectedPlaceId("all");
  }

  // Compute session stats for morning and evening collections
  const sessionStats = useMemo(() => {
    let morningTotal = 0, morningCollected = 0, morningAmt = 0;
    let eveningTotal = 0, eveningCollected = 0, eveningAmt = 0;

    (sheetData.customers || []).forEach((c) => {
      const sess = c.place_session || "morning";
      const isPaid = (c.today_paid || 0) > 0;
      const amt = c.today_paid || 0;

      if (sess === "morning") {
        morningTotal += 1;
        if (isPaid) morningCollected += 1;
        morningAmt += amt;
      } else {
        eveningTotal += 1;
        if (isPaid) eveningCollected += 1;
        eveningAmt += amt;
      }
    });

    return {
      morning: { total: morningTotal, collected: morningCollected, amt: morningAmt },
      evening: { total: eveningTotal, collected: eveningCollected, amt: eveningAmt },
    };
  }, [sheetData.customers]);

  // Filter customers by selected session, place and search query
  const displayedCustomers = useMemo(() => {
    let list = sheetData.customers || [];

    if (selectedSession !== "all") {
      list = list.filter((c) => (c.place_session || "morning") === selectedSession);
    }

    if (selectedPlaceId !== "all") {
      if (selectedPlaceId === "unassigned") {
        list = list.filter((c) => !c.place_id);
      } else {
        list = list.filter((c) => c.place_id === Number(selectedPlaceId));
      }
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.customer_id.toString().includes(q) ||
          (c.address && c.address.toLowerCase().includes(q)) ||
          (c.phone && c.phone.includes(q)) ||
          (c.place_name && c.place_name.toLowerCase().includes(q))
      );
    }

    return list;
  }, [sheetData.customers, selectedSession, selectedPlaceId, search]);

  // Compute place stats for place tabs
  const placeStats = useMemo(() => {
    const stats = {};
    (sheetData.customers || []).forEach((c) => {
      const pid = c.place_id != null ? c.place_id : "unassigned";
      if (!stats[pid]) {
        stats[pid] = { total: 0, collected: 0 };
      }
      stats[pid].total += 1;
      if (c.today_paid > 0) {
        stats[pid].collected += 1;
      }
    });
    return stats;
  }, [sheetData.customers]);

  // Places with customers in priority order, filtered by session if selected
  const activePlaces = useMemo(() => {
    return (sheetData.places || [])
      .filter((p) => placeStats[p.id]?.total > 0)
      .filter((p) => (selectedSession === "all" ? true : (p.session || "morning") === selectedSession));
  }, [sheetData.places, placeStats, selectedSession]);

  // Previous and Next place navigation
  const currentPlaceIndex = activePlaces.findIndex((p) => p.id === Number(selectedPlaceId));
  const prevPlace = currentPlaceIndex > 0 ? activePlaces[currentPlaceIndex - 1] : null;
  const nextPlace = currentPlaceIndex >= 0 && currentPlaceIndex < activePlaces.length - 1 ? activePlaces[currentPlaceIndex + 1] : null;

  // Quick date jump
  function setDateOffset(offset) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    setSelectedDate(toInputDate(d));
  }

  const progressPercent = sheetData.summary.total_customers > 0
    ? Math.round((sheetData.summary.collected_count / sheetData.summary.total_customers) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header and Quick Links */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title={t("daily_collection.title")}
          subtitle={t("daily_collection.subtitle")}
        />

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Link
            to="/collection-sheet"
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <FiPrinter size={15} />
            <span>{t("daily_collection.print_sheet_link")}</span>
          </Link>
        </div>
      </div>

      {/* Date Bar & Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Date Selector Box */}
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
            <FiCalendar size={14} className="text-emerald-400" />
            <span>{t("daily_collection.select_date")}</span>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full bg-[#0b101b] border border-slate-700/80 rounded-xl px-3 py-2 text-white font-semibold text-sm color-scheme-dark focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={() => setDateOffset(-1)}
              className="flex-1 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
            >
              நேற்று
            </button>
            <button
              type="button"
              onClick={() => setDateOffset(0)}
              className="flex-1 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition"
            >
              இன்று
            </button>
          </div>
        </div>

        {/* Total Collected Metric */}
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 flex flex-col justify-center">
          <span className="text-xs font-medium text-slate-400">
            {t("daily_collection.total_collected_today")}
          </span>
          <span className="text-2xl lg:text-3xl font-bold text-emerald-400 mt-1">
            ₹{(sheetData.summary.total_collected || 0).toLocaleString("en-IN")}
          </span>
          <span className="text-[11px] text-slate-400 mt-1">
            {t("daily_collection.expected_daily")}: ₹{(sheetData.summary.total_expected_daily || 0).toLocaleString("en-IN")}
          </span>
        </div>

        {/* Route Progress Metric */}
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 flex flex-col justify-center md:col-span-2">
          <div className="flex justify-between items-center text-xs font-medium mb-2">
            <span className="text-slate-400">{t("daily_collection.route_progress")}</span>
            <span className="text-white font-bold">
              {sheetData.summary.collected_count} / {sheetData.summary.total_customers} ({progressPercent}%)
            </span>
          </div>
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-[11px] text-slate-400 mt-2">
            {activePlaces.filter((p) => placeStats[p.id]?.collected === placeStats[p.id]?.total).length} / {activePlaces.length} ஊர்களில் வசூல் முடிந்தது
          </span>
        </div>
      </div>

      {/* Session Filter Bar, Place Filter Bar & Search */}
      <div className="space-y-3">
        {/* Morning / Evening / All Session Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleSelectSession("all")}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
              selectedSession === "all"
                ? "bg-slate-700 text-white border-slate-600 shadow-md font-bold ring-1 ring-white/20"
                : "bg-[#111827] text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white"
            }`}
          >
            <span>📋</span>
            <span>{t("daily_collection.all_sessions")}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/30 text-slate-300 font-bold">
              {sheetData.summary.collected_count}/{sheetData.summary.total_customers}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectSession("morning")}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
              selectedSession === "morning"
                ? "bg-gradient-to-r from-sky-600 to-blue-600 text-white border-sky-400 shadow-md shadow-sky-900/30 font-bold ring-1 ring-sky-300/40"
                : "bg-[#111827] text-sky-400 border-sky-950/60 hover:border-sky-800 hover:bg-sky-950/30"
            }`}
          >
            <span>🌅</span>
            <span>{t("daily_collection.morning")}</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                selectedSession === "morning" ? "bg-black/30 text-white" : "bg-sky-950 text-sky-300"
              }`}
            >
              {sessionStats.morning.collected}/{sessionStats.morning.total}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectSession("evening")}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
              selectedSession === "evening"
                ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white border-amber-400 shadow-md shadow-amber-900/30 font-bold ring-1 ring-amber-300/40"
                : "bg-[#111827] text-amber-400 border-amber-950/60 hover:border-amber-800 hover:bg-amber-950/30"
            }`}
          >
            <span>🌇</span>
            <span>{t("daily_collection.evening")}</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                selectedSession === "evening" ? "bg-black/30 text-white" : "bg-amber-950 text-amber-300"
              }`}
            >
              {sessionStats.evening.collected}/{sessionStats.evening.total}
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
          <input
            type="text"
            placeholder={t("daily_collection.search_placeholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111827] border border-slate-700/80 rounded-xl pl-11 pr-4 py-3 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Place Selection Chips (Horizontal Scroll) */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedPlaceId("all")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
              selectedPlaceId === "all"
                ? "bg-emerald-600 text-white border-emerald-500 shadow-md font-bold"
                : "bg-[#111827] text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white"
            }`}
          >
            <span>
              {selectedSession === "morning"
                ? `🌅 ${t("daily_collection.morning")}`
                : selectedSession === "evening"
                ? `🌇 ${t("daily_collection.evening")}`
                : t("daily_collection.all_places")}
            </span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/30 font-bold">
              {selectedSession === "morning"
                ? `${sessionStats.morning.collected}/${sessionStats.morning.total}`
                : selectedSession === "evening"
                ? `${sessionStats.evening.collected}/${sessionStats.evening.total}`
                : `${sheetData.summary.collected_count}/${sheetData.summary.total_customers}`}
            </span>
          </button>

          {activePlaces.map((place) => {
            const stats = placeStats[place.id] || { total: 0, collected: 0 };
            const isDone = stats.total > 0 && stats.collected === stats.total;
            const isSelected = selectedPlaceId === String(place.id);

            return (
              <button
                key={place.id}
                onClick={() => setSelectedPlaceId(String(place.id))}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  isSelected
                    ? "bg-emerald-600 text-white border-emerald-500 shadow-md font-bold"
                    : isDone
                    ? "bg-[#111827] text-emerald-400 border-emerald-900/60 hover:border-emerald-600"
                    : "bg-[#111827] text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white"
                }`}
              >
                <span>{place.name}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isSelected
                      ? "bg-black/30 text-white"
                      : isDone
                      ? "bg-emerald-950/80 text-emerald-300"
                      : "bg-slate-800 text-slate-300"
                  }`}
                >
                  {isDone ? `✓ ${stats.total}` : `${stats.collected}/${stats.total}`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Place Stepper (When a single place is selected) */}
      {selectedPlaceId !== "all" && (
        <div className="flex items-center justify-between bg-[#111827] border border-slate-800 rounded-xl px-4 py-2.5 text-xs">
          {prevPlace ? (
            <button
              onClick={() => setSelectedPlaceId(String(prevPlace.id))}
              className="flex items-center gap-1.5 text-slate-400 hover:text-white transition font-medium"
            >
              <FiArrowLeft size={14} />
              <span>{prevPlace.name}</span>
            </button>
          ) : <div />}

          <span className="font-semibold text-emerald-400 text-sm">
            {activePlaces.find((p) => p.id === Number(selectedPlaceId))?.name}
          </span>

          {nextPlace ? (
            <button
              onClick={() => setSelectedPlaceId(String(nextPlace.id))}
              className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition font-semibold"
            >
              <span>{nextPlace.name}</span>
              <FiArrowRight size={14} />
            </button>
          ) : <div />}
        </div>
      )}

      {/* Customer List / Table */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm font-medium">{t("common.loading")}</p>
        </div>
      ) : displayedCustomers.length === 0 ? (
        <div className="py-20 text-center bg-[#111827] border border-slate-800 rounded-2xl">
          <FiUser size={36} className="mx-auto text-slate-600 mb-3" />
          <p className="text-slate-400 text-sm font-medium">
            {search ? t("customers.no_customers") : t("daily_collection.empty_place")}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedCustomers.map((c) => {
            const isPaid = (c.today_paid || 0) > 0;
            const currentInputAmt = inputAmounts[c.customer_id] ?? (c.daily_installment || "");
            const isSubmitting = submittingCid === c.customer_id;

            return (
              <div
                key={c.customer_id}
                className={`rounded-2xl p-4 lg:p-4.5 border transition-all ${
                  isPaid
                    ? "bg-[#0b1b17] border-emerald-900/60 shadow-sm"
                    : "bg-[#111827] border-slate-800/90 hover:border-slate-700"
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
                  {/* Left Column: ID, Name, Place, Balance, Yesterday info */}
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Customer ID Badge */}
                    <div
                      className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm border ${
                        isPaid
                          ? "bg-emerald-950 text-emerald-300 border-emerald-700/60"
                          : "bg-slate-800 text-slate-200 border-slate-700"
                      }`}
                    >
                      {c.customer_id}
                    </div>

                    <div className="min-w-0 flex-1">
                      {/* Name & Place */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => openCustomer(c.customer_id)}
                          className="font-bold text-white text-base hover:text-emerald-400 transition text-left truncate"
                          title={t("daily_collection.view_profile")}
                        >
                          {c.name}
                        </button>
                        {c.place_name && (
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-medium">
                            {c.place_name}
                          </span>
                        )}
                        {c.place_session && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${
                              c.place_session === "evening"
                                ? "bg-amber-950/60 text-amber-300 border-amber-800/40"
                                : "bg-sky-950/60 text-sky-300 border-sky-800/40"
                            }`}
                          >
                            {c.place_session === "evening" ? "🌇 " + t("daily_collection.evening") : "🌅 " + t("daily_collection.morning")}
                          </span>
                        )}
                        {c.type === "Furniture" && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 font-semibold border border-amber-800/40">
                            பர்னிச்சர்
                          </span>
                        )}
                        {c.is_closed && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 font-semibold border border-rose-800/50">
                            🔒 {t("customers.closed")}
                          </span>
                        )}
                      </div>

                      {/* Financial info: Balance, Daily Due, Yesterday */}
                      <div className="flex items-center gap-3 lg:gap-5 mt-1.5 text-xs flex-wrap">
                        {/* Current Outstanding Balance */}
                        <span className="text-slate-300">
                          {t("daily_collection.balance")}:{" "}
                          <strong className="text-white font-semibold">
                            ₹{(c.balance || 0).toLocaleString("en-IN")}
                          </strong>
                        </span>

                        {/* Daily Installment */}
                        {c.daily_installment > 0 && (
                          <span className="text-slate-400">
                            {t("daily_collection.daily_due")}:{" "}
                            <strong className="text-slate-200 font-medium">
                              ₹{c.daily_installment}
                            </strong>
                          </span>
                        )}

                        {/* Yesterday Payment Status */}
                        {c.yesterday_paid > 0 ? (
                          <span className="text-emerald-400 flex items-center gap-1 font-medium">
                            <FiCheck size={13} />
                            <span>நேற்று: ₹{c.yesterday_paid}</span>
                          </span>
                        ) : c.last_payment_date ? (
                          <span className="text-slate-400">
                            கடைசி: {c.last_payment_date} (₹{c.last_payment_amount})
                          </span>
                        ) : (
                          <span className="text-amber-400/90 text-[11px]">
                            ⚠️ {t("daily_collection.yesterday_not_paid")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Actions (Enter Amount, 1-Click Collect, Undo) */}
                  <div className="shrink-0 flex items-center gap-2 self-end lg:self-auto">
                    {isPaid ? (
                      /* Already Collected State */
                      <div className="flex items-center gap-2 bg-emerald-950/80 border border-emerald-700/60 rounded-xl px-3.5 py-2">
                        <FiCheckCircle className="text-emerald-400 shrink-0" size={17} />
                        <div className="text-left">
                          <span className="text-xs font-bold text-emerald-300 block">
                            ₹{c.today_paid} {t("daily_collection.paid_badge")}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleUndo(c)}
                          disabled={isSubmitting}
                          className="ml-2 text-slate-400 hover:text-red-400 text-xs flex items-center gap-1 transition p-1 hover:bg-red-950/40 rounded"
                          title={t("daily_collection.undo")}
                        >
                          <FiRotateCcw size={13} />
                          <span className="text-[11px]">{t("daily_collection.undo")}</span>
                        </button>
                      </div>
                    ) : (
                      /* Collection Entry State */
                      <div className="flex items-center gap-2">
                        {/* Amount Input */}
                        <div className="relative w-24 sm:w-28">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-semibold">
                            ₹
                          </span>
                          <input
                            ref={(el) => (inputRefs.current[c.customer_id] = el)}
                            type="number"
                            value={currentInputAmt}
                            onChange={(e) =>
                              setInputAmounts((prev) => ({
                                ...prev,
                                [c.customer_id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleCollect(c);
                              }
                            }}
                            placeholder="0"
                            className="w-full bg-[#0b101b] border border-slate-700 rounded-xl pl-6 pr-2 py-2 text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                          />
                        </div>

                        {/* Primary 1-Click Collect Button */}
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => handleCollect(c)}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs shadow-md shadow-emerald-950/40 transition flex items-center gap-1.5"
                        >
                          <FiCheck size={14} />
                          <span>{t("daily_collection.collect_btn")}</span>
                        </button>

                        {/* Quick increment buttons (+50, +100) */}
                        {c.daily_installment > 0 && (
                          <div className="hidden sm:flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                const newAmt = (Number(currentInputAmt) || 0) + 100;
                                setInputAmounts((prev) => ({ ...prev, [c.customer_id]: String(newAmt) }));
                              }}
                              className="px-2 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                              title="+ ₹100"
                            >
                              +100
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Customer Profile Drawer */}
      <CustomerProfileDrawer
        open={selectedCustomer !== null}
        onClose={() => {
          setSelectedCustomer(null);
          setCustomerDetails(null);
        }}
        customer={customerDetails}
        refreshCustomer={openCustomer}
        refreshCustomers={() => loadSheet(selectedDate)}
      />
    </div>
  );
}
