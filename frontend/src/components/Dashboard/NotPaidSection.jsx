  import { useState } from "react";
  import NotPaidCard from "../NotPaidCard";
  import DetailDrawer from "../DetailDrawer";

  function NotPaidSection({ customers }) {
    const [open, setOpen] = useState(false);
    const sortedCustomers = [...customers].sort(
      (a, b) => a.customer_id - b.customer_id
    );
    return (
      <div>
        <div className="flex items-center justify-between mb-5">

          <div>
            <h2 className="text-2xl lg:text-3xl font-bold">
                ⚠️ Not Paid Today
            </h2>
        </div>

          <span className="bg-red-600 text-white text-sm px-3 py-1 rounded-full">
            {customers.length}
          </span>

        </div>

        <div
          className="grid gap-2 px-4 mb-2 text-xs font-semibold text-slate-400 uppercase items-center"
          style={{ gridTemplateColumns: "60px 110px 1fr" }}
        >
            <div className="truncate"><span className="hidden sm:inline">Customer </span>ID</div>
            <div className="truncate">Name</div>
            <div className="truncate">Place</div>
        </div>

        {customers.length === 0 ? (
          <div className="bg-slate-900 rounded-xl p-6 text-center text-slate-400">
            🎉 Everyone has paid today.
          </div>
        ) : (
          sortedCustomers
            .slice(0, 10)
            .map((customer) => (
              <NotPaidCard
                  key={customer.customer_id}
                  customer={customer}
              />
          ))
        )}
        {customers.length > 10 && (
          <button
            onClick={() => setOpen(true)}
            className="
                w-full
                mt-4
                py-3
                rounded-xl
                bg-slate-800
                hover:bg-slate-700
                transition
                font-semibold
                text-green-400
            "
        >
            View All {customers.length} Customers →
        </button>
      )}
          <DetailDrawer
          open={open}
          onClose={() => setOpen(false)}
          title="Pending Customers"
          subtitle={`${customers.length} customers haven't paid today`}
      >
          <div className="space-y-2">
              {sortedCustomers.map((customer) => (
                  <NotPaidCard
                      key={customer.customer_id}
                      customer={customer}
                  />
              ))}
          </div>
      </DetailDrawer>
      </div>
    );
  }

  export default NotPaidSection;