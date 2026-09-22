import PageHeader from "../components/PageHeader";
import { useEffect, useState } from "react";
import {
    getCustomers,
    getCustomerDetails
} from "../services/customerService";
import CustomerCard from "../components/Customer/CustomerCard";
import CustomerProfileDrawer from "../components/Customer/CustomerProfileDrawer";

function ViewCustomer() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDetails, setCustomerDetails] = useState(null);

  async function loadCustomers() {
    const data = await getCustomers();
    setCustomers(data);
  }

  useEffect(() => {
    loadCustomers();
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

  const filteredCustomers = customers.filter((customer) => {
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

    // 2. Search query filter
    const query = search.toLowerCase();
    return (
      customer.name.toLowerCase().includes(query) ||
      customer.customer_id.toString().includes(query) ||
      customer.address.toLowerCase().includes(query) ||
      (customer.phone || "").includes(query) ||
      (customer.place_name || "").toLowerCase().includes(query)
    );
  });

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="Search and manage customers"
      />

      <div className="mt-8 mb-4">
        <input
          type="text"
          placeholder="🔍 Search by Name, ID, Address or Place..."
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
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mb-6">
        {[
          { key: "all", label: "All", count: counts.all, color: "text-slate-300" },
          { key: "active", label: "Active", count: counts.active, color: "text-emerald-400" },
          { key: "completed", label: "Completed", count: counts.completed, color: "text-sky-400" },
          { key: "closed", label: "Closed", count: counts.closed, color: "text-slate-400" },
          { key: "pending", label: "Pending", count: counts.pending, color: "text-amber-400" },
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

      <div className="space-y-3">

                {filteredCustomers
                    .slice() // create a copy
                    .sort((a, b) => a.customer_id - b.customer_id)
                    .map((customer) => (

                        <CustomerCard
                            key={customer.customer_id}
                            customer={customer}
                            onClick={() => openCustomer(customer.customer_id)}
                        />

                ))}
                {filteredCustomers.length === 0 && (

                    <div className="text-center text-gray-400 py-16">

                        No customers found.

                    </div>

                )}

            </div>
            <CustomerProfileDrawer
                open={selectedCustomer !== null}
                onClose={() => {
                    setSelectedCustomer(null);
                    setCustomerDetails(null);
                }}
                customer={customerDetails}
                refreshCustomer={openCustomer}
                refreshCustomers={loadCustomers}
            />

        </div>
        

    );

}

export default ViewCustomer;