import PageHeader from "../components/PageHeader";
import StatusBanner from "../components/StatusBanner";
import { useEffect, useState } from "react";
import { getDashboard, getTodayCashFlow, getMigrationStatus } from "../services/dashboardService";
import CollectionDrawer from "../components/Dashboard/CollectionDrawer";
import DashboardMetrics from "../components/Dashboard/DashboardMetrics";
import NotPaidSection from "../components/Dashboard/NotPaidSection";
import ExpenseDrawer from "../components/Dashboard/ExpenseDrawer";
import NetDrawer from "../components/Dashboard/NetDrawer";
import CashDrawer from "../components/Dashboard/CashDrawer";
import InvestmentDrawer from "../components/Dashboard/InvestmentDrawer";
import MigrationBanner from "../components/Dashboard/MigrationBanner";


function Dashboard() {
    const [dashboardData, setDashboardData] = useState(null);
    const [selectedCard, setSelectedCard] = useState(null);
    const [cashFlow, setCashFlow] = useState(null);
    const [migrationStatus, setMigrationStatus] = useState(null);

    useEffect(() => {
      loadDashboard();
      loadMigrationStatus();
    }, []);

    async function loadDashboard() {
      const data = await getDashboard();
      setDashboardData(data);
    }

    async function loadMigrationStatus() {
      try {
        const status = await getMigrationStatus();
        setMigrationStatus(status);
      } catch {
        setMigrationStatus({ completed: false });
      }
    }

    async function openCashDrawer() {
        const flow = await getTodayCashFlow();
        setCashFlow(flow);
        setSelectedCard("cash");
    }

    async function handleMigrationComplete() {
      await loadDashboard();
      await loadMigrationStatus();
    }

    async function handleInvestmentSuccess() {
      await loadDashboard();
    }

    if (!dashboardData) {
        return (
            <div className="flex items-center justify-center h-[70vh]">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>

                    <p className="mt-4 text-slate-400">
                        Loading Dashboard...
                    </p>
                </div>
            </div>
        );
    } 
  return (
    <div>
      <PageHeader
        title="Welcome to VEL Finance"
        subtitle="Finance Management Dashboard"
      />

      <StatusBanner status="online" />

      {/* Migration Banner — only before migration is completed */}
      {migrationStatus && !migrationStatus.completed && (
        <MigrationBanner
          onMigrationComplete={handleMigrationComplete}
          currentBalance={dashboardData?.cash?.cash_balance}
        />
      )}

      <DashboardMetrics
            summary={dashboardData.summary}
            cash={dashboardData.cash}
            onCashClick={openCashDrawer}
            onCollectedClick={() => setSelectedCard("collected")}
            onExpenseClick={() => setSelectedCard("expense")}
            onNetClick={() => setSelectedCard("net")}
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">  

            {/* LEFT SIDE */}

            <div className="lg:col-span-2">

                <NotPaidSection
                    customers={dashboardData.not_paid}
                />

            </div>

        </div>
            <CollectionDrawer
                open={selectedCard === "collected"}
                onClose={() => setSelectedCard(null)}
                collections={dashboardData.today_collections}
            />
            <ExpenseDrawer
                open={selectedCard === "expense"}
                onClose={() => setSelectedCard(null)}
                expenses={dashboardData.today_expenses}
            />
            <NetDrawer
                open={selectedCard === "net"}
                onClose={() => setSelectedCard(null)}
                summary={dashboardData.summary}
            />
            <CashDrawer
                open={selectedCard === "cash"}
                onClose={() => setSelectedCard(null)}
                cash={dashboardData.cash}
                summary={cashFlow}
                onAddInvestment={() => setSelectedCard("investment")}
            />
            <InvestmentDrawer
                open={selectedCard === "investment"}
                onClose={() => setSelectedCard(null)}
                onSuccess={handleInvestmentSuccess}
            />
        </div>
        
  );
}

export default Dashboard;