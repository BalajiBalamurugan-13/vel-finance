import { useEffect, useState } from "react";
import { getBusinessSummary } from "../services/transactionService";
import OutstandingDrawer from "../components/BusinessSummary/OutstandingDrawer";
import { useLanguage } from "../context/LanguageContext";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN").format(value || 0);
}

function BusinessSummary() {
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showOutstandingDrawer, setShowOutstandingDrawer] = useState(false);

  useEffect(() => {
    loadSummary();
  }, []);

  async function loadSummary() {
    try {
      const res = await getBusinessSummary();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-400 text-lg">
          {t("common.loading")}
        </p>
      </div>
    );
  }

  const cards = [
    {
      title: t("business_summary.total_outstanding"),
      icon: "📈",
      value: `₹${formatCurrency(data?.outstanding)}`,
      border: "border-orange-500/30 hover:border-orange-500/60",
      valueColor: "text-orange-400",
      clickable: true,
      hint: `${t("business_summary.view_details")} ↗`,
      onClick: () => setShowOutstandingDrawer(true),
    },
    {
      title: t("business_summary.active_customers"),
      icon: "👥",
      value: data?.total_customers || 0,
      border: "border-blue-500/20",
      valueColor: "text-blue-400",
    },
    {
      title: t("business_summary.expected_profit"),
      icon: "💰",
      value: `₹${formatCurrency(data?.expected_profit)}`,
      border: "border-purple-500/20",
      valueColor: "text-purple-400",
    },
    {
      title: t("customers.active"),
      icon: "🏦",
      value: data?.active_loans || 0,
      border: "border-slate-500/20",
      valueColor: "text-slate-200",
    },
  ];

  return (
    <div className="p-5 space-y-6">

      <div>
        <h1 className="text-3xl font-bold text-white">
          {t("business_summary.title")}
        </h1>

        <p className="text-slate-400 mt-1">
          {t("business_summary.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

        {cards.map((card) => (
          <div
              key={card.title}
              onClick={card.onClick}
              className={`
                bg-slate-900
                rounded-2xl
                border
                ${card.border}
                p-6
                shadow-md
                transition-all
                duration-200
                ${
                  card.clickable
                    ? "cursor-pointer hover:-translate-y-1 hover:bg-slate-800/80 active:scale-[0.98] ring-1 ring-orange-500/20"
                    : "hover:-translate-y-0.5"
                }
                `}
          >
            <div className="flex items-center justify-between">

              <p className="text-sm text-slate-400 font-medium flex items-center gap-1.5">
                {card.title}
                {card.clickable && (
                  <span className="text-[10px] text-orange-400/80 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20 font-normal">
                    {t("business_summary.view_details")}
                  </span>
                )}
              </p>

              <span className="text-3xl">
                {card.icon}
              </span>

            </div>

            <h2 className={`text-4xl font-bold mt-5 ${card.valueColor}`}>
              {card.value}
            </h2>

            {card.hint && (
              <p className="text-xs text-orange-400/70 mt-2 font-medium">
                {card.hint}
              </p>
            )}
          </div>
        ))}

      </div>

      {/* Outstanding Breakdown Drawer */}
      <OutstandingDrawer
        open={showOutstandingDrawer}
        onClose={() => setShowOutstandingDrawer(false)}
      />

    </div>
  );
}

export default BusinessSummary;