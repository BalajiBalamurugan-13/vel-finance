import MetricCard from "../MetricCard";
import { useLanguage } from "../../context/LanguageContext";

function DashboardMetrics({
    summary,
    cash,
    onCashClick,
    onCollectedClick,
    onExpenseClick,
    onNetClick,
}) {
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
      <MetricCard
          title={t("dashboard.available_cash")}
          value={`₹${Number(cash?.cash_balance || 0).toLocaleString("en-IN")}`}
          icon="💵"
          onClick={onCashClick}
      />
      <MetricCard
        title={t("dashboard.collected_today")}
        value={`₹${Number(summary?.total_collected || 0).toLocaleString("en-IN")}`}
        icon="💰"
        onClick={onCollectedClick}
      />

      <MetricCard
        title={t("dashboard.expense_today")}
        value={`₹${Number(summary?.total_expense || 0).toLocaleString("en-IN")}`}
        icon="💸"
        onClick={onExpenseClick}
      />

      <MetricCard
        title={t("dashboard.net_today")}
        value={`₹${Number(summary?.net_amount || 0).toLocaleString("en-IN")}`}
        icon="📊"
        onClick={onNetClick}
      />
    </div>
  );
}

export default DashboardMetrics;