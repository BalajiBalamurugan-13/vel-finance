import { useState } from "react";
import NotPaidCard from "../NotPaidCard";
import DetailDrawer from "../DetailDrawer";
import { useLanguage } from "../../context/LanguageContext";

function NotPaidSection({ customers }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const sortedCustomers = [...customers].sort(
    (a, b) => a.customer_id - b.customer_id
  );
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold">
            ⚠️ {t("dashboard.not_paid_today")}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t("dashboard.not_paid_desc")}
          </p>
        </div>

        <span className="bg-red-600 text-white text-sm px-3 py-1 rounded-full font-bold">
          {customers.length}
        </span>
      </div>

      <div
        className="grid gap-2 px-4 mb-2 text-xs font-semibold text-slate-400 uppercase items-center"
        style={{ gridTemplateColumns: "60px 110px 1fr" }}
      >
        <div className="truncate">{t("dashboard.customer_id")}</div>
        <div className="truncate">{t("dashboard.name")}</div>
        <div className="truncate">{t("customers.place")}</div>
      </div>

      {customers.length === 0 ? (
        <div className="bg-slate-900 rounded-xl p-6 text-center text-slate-400">
          {t("dashboard.all_paid")}
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
              text-emerald-400
          "
        >
          {t("business_summary.view_details")} ({customers.length}) →
        </button>
      )}
      <DetailDrawer
        open={open}
        onClose={() => setOpen(false)}
        title={t("dashboard.not_paid_today")}
        subtitle={`${customers.length} ${t("dashboard.not_paid_desc")}`}
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