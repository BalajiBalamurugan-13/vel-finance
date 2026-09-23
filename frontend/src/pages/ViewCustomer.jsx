import PageHeader from "../components/PageHeader";
import { useEffect, useState, useMemo } from "react";
import {
  getCustomers,
  getCustomerDetails,
} from "../services/customerService";
import { getPlaces } from "../services/placeService";
import CustomerCard from "../components/Customer/CustomerCard";
import CustomerProfileDrawer from "../components/Customer/CustomerProfileDrawer";
import { useLanguage } from "../context/LanguageContext";
import { FiMapPin } from "react-icons/fi";

function ViewCustomer() {
  const { t } = useLanguage();
  const [customers, setCustomers] = useState([]);
  const [places, setPlaces] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPlace, setSelectedPlace] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDetails, setCustomerDetails] = useState(null);

  async function loadCustomers() {
    const data = await getCustomers();
    setCustomers(data);
  }

  useEffect(() => {
    loadCustomers();
    getPlaces().then((data) => setPlaces(Array.isArray(data) ? data : [])).catch(() => setPlaces([]));
  }, []);

  async function openCustomer(customerId, showLoading = true) {
    setSelectedCustomer(customerId);

    if (showLoading) {
      setCustomerDetails(null);
    }

    const data = await getCustomerDetails(customerId);
    setCustomerDetails(data);
  }

  const counts = {
    all: customers.length,
    active: customers.filter(
      (c) => c.loan_given && !c.is_closed && Number(c.balance) > 0
    ).length,
    completed: customers.filter(
      (c) => c.loan_given && !c.is_closed && Number(c.balance) <= 0
    ).length,
    closed: customers.filter((c) => c.is_closed).length,
    pending: customers.filter((c) => !c.loan_given).length,
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      // 1. Status Filter
      if (statusFilter === "active") {
        if (!customer.loan_given || customer.is_closed || Number(customer.balance) <= 0) {
          return false;
        }
      } else if (statusFilter === "completed") {
        if (!customer.loan_given || customer.is_closed || Number(customer.balance) > 0) {
          return false;
        }
      } else if (statusFilter === "closed") {
        if (!customer.is_closed) return false;
      } else if (statusFilter === "pending") {
        if (customer.loan_given) return false;
      }

      // 2. Place Filter
      if (selectedPlace !== "all") {
        if (selectedPlace === "unassigned") {
          if (customer.place_id != null) return false;
        } else if (customer.place_id !== Number(selectedPlace)) {
          return false;
        }
      }

      // 3. Search query filter
      const query = search.toLowerCase().trim();
      if (!query) return true;

      return (
        customer.name.toLowerCase().includes(query) ||
        customer.customer_id.toString().includes(query) ||
        (customer.address && customer.address.toLowerCase().includes(query)) ||
        (customer.phone && customer.phone.includes(query)) ||
        (customer.place_name && customer.place_name.toLowerCase().includes(query))
      );
    });
  }, [customers, statusFilter, selectedPlace, search]);

  const sortedCustomers = useMemo(() => {
    return filteredCustomers.slice().sort((a, b) => a.customer_id - b.customer_id);
  }, [filteredCustomers]);

  // Drawer Next / Prev Navigation
  const currentIdx = sortedCustomers.findIndex((c) => c.customer_id === selectedCustomer);
  const prevCustomer = currentIdx > 0 ? sortedCustomers[currentIdx - 1] : null;
  const nextCustomer = currentIdx >= 0 && currentIdx < sortedCustomers.length - 1 ? sortedCustomers[currentIdx + 1] : null;

  return (
    <div>
      <PageHeader
        title={t("customers.title")}
        subtitle={t("customers.subtitle")}
      />

      {/* Search & Place Filter */}
      <div className="mt-8 mb-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder={t("customers.search_placeholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="
              w-full
              bg-[#0f172a]
              border
              border-slate-700/80
              rounded-xl
              px-5
              py-3.5
              text-white
              placeholder:text-slate-500
              focus:outline-none
              focus:ring-2
              focus:ring-emerald-500
              focus:border-transparent
              transition-all
            "
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

        {/* Place Dropdown Filter */}
        <div className="relative min-w-[180px]">
          <select
            value={selectedPlace}
            onChange={(e) => setSelectedPlace(e.target.value)}
            className="w-full bg-[#0f172a] border border-slate-700/80 rounded-xl px-4 py-3.5 text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
          >
            <option value="all">📍 {t("customers.all_places")}</option>
            {places.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
            <option value="unassigned">Unassigned</option>
          </select>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mb-6">
        {[
          { key: "all", label: t("customers.all"), count: counts.all, color: "text-slate-300" },
          { key: "active", label: t("customers.active"), count: counts.active, color: "text-emerald-400" },
          { key: "completed", label: t("customers.completed"), count: counts.completed, color: "text-sky-400" },
          { key: "closed", label: t("customers.closed"), count: counts.closed, color: "text-slate-400" },
          { key: "pending", label: t("customers.pending"), count: counts.pending, color: "text-amber-400" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`
              flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border
              ${
                statusFilter === tab.key
                  ? "bg-slate-800 text-white border-slate-600 shadow-sm"
                  : "bg-[#0f172a] text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200"
              }
            `}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                statusFilter === tab.key ? "bg-slate-700 text-white" : "bg-slate-900 " + tab.color
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Customer List */}
      <div className="space-y-3">
        {sortedCustomers.map((customer) => (
          <CustomerCard
            key={customer.customer_id}
            customer={customer}
            onClick={() => openCustomer(customer.customer_id)}
          />
        ))}
        {sortedCustomers.length === 0 && (
          <div className="text-center text-gray-400 py-16 bg-[#0f172a]/50 rounded-2xl border border-slate-800/80">
            {t("customers.no_customers")}
          </div>
        )}
      </div>

      {/* Customer Drawer with Prev/Next Navigation */}
      <CustomerProfileDrawer
        open={selectedCustomer !== null}
        onClose={() => {
          setSelectedCustomer(null);
          setCustomerDetails(null);
        }}
        customer={customerDetails}
        refreshCustomer={openCustomer}
        refreshCustomers={loadCustomers}
        hasPrevCustomer={!!prevCustomer}
        hasNextCustomer={!!nextCustomer}
        onPrevCustomer={() => prevCustomer && openCustomer(prevCustomer.customer_id)}
        onNextCustomer={() => nextCustomer && openCustomer(nextCustomer.customer_id)}
      />
    </div>
  );
}

export default ViewCustomer;