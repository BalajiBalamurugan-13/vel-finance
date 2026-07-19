import MetricCard from "../MetricCard";

function DashboardMetrics({
    summary,
    cash,
    onCashClick,
    onCollectedClick,
    onExpenseClick,
    onNetClick,
}) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
      <MetricCard
          title="Available Cash"
          value={`₹${Number(cash.cash_balance).toLocaleString("en-IN")}`}
          icon="💵"
          onClick={onCashClick}
      />
      <MetricCard
        title="Collected"
        value={`₹${Number(summary.total_collected).toLocaleString("en-IN")}`}
        icon="💰"
        onClick={onCollectedClick}
      />

      <MetricCard
        title="Expense"
        value={`₹${Number(summary.total_expense).toLocaleString("en-IN")}`}

        icon="💸"
        onClick={onExpenseClick}
      />

      <MetricCard
        title="Net"
        value={`₹${Number(summary.net_amount).toLocaleString("en-IN")}`}
        icon="📊"
        onClick={onNetClick}
      />
    </div>
  );
}

export default DashboardMetrics;