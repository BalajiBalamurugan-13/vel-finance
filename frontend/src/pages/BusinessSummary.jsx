import { useEffect, useState } from "react";
import { getBusinessSummary } from "../services/transactionService";
function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN").format(value || 0);
}
function BusinessSummary() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

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
          Loading Business Summary...
        </p>
      </div>
    );
  }

  const cards = [
      {
        title: "Outstanding",
        icon: "📈",
        value: `₹${formatCurrency(data.outstanding)}`,
        border: "border-orange-500/20",
        valueColor: "text-orange-400",
      },
      {
        title: "Total Customers",
        icon: "👥",
        value: data.total_customers,
        border: "border-blue-500/20",
        valueColor: "text-blue-400",
      },
      {
        title: "Expected Profit",
        icon: "💰",
        value: `₹${formatCurrency(data.expected_profit)}`,
        border: "border-purple-500/20",
        valueColor: "text-purple-400",
      },
      {
        title: "Active Loans",
        icon: "🏦",
        value: data.active_loans,
        border: "border-slate-500/20",
        valueColor: "text-slate-200",
      },
    ];

  return (
    <div className="p-5 space-y-6">

      <div>
        <h1 className="text-3xl font-bold text-white">
          Business Center
        </h1>

        <p className="text-slate-400 mt-1">
          Financial overview of your business
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">

        {cards.map((card) => (
          <div
              key={card.title}
              className={`
                bg-slate-900
                rounded-2xl
                border
                ${card.border}
                p-6
                shadow-md
                transition-all
                duration-200
                hover:-translate-y-1
                `}
          >
            <div className="flex items-center justify-between">

              <p className="text-sm text-slate-400 font-medium">
                {card.title}
              </p>

              <span className="text-3xl">
                {card.icon}
              </span>

            </div>

            <h2 className={`text-4xl font-bold mt-5 ${card.valueColor}`}>
              {card.value}
            </h2>
          </div>
        ))}

      </div>

    </div>
  );
}

export default BusinessSummary;