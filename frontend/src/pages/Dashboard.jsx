import PageHeader from "../components/PageHeader";
import StatusBanner from "../components/StatusBanner";
import { useEffect, useState } from "react";
import { getDashboard, getTodayCashFlow} from "../services/dashboardService";
import CollectionDrawer from "../components/Dashboard/CollectionDrawer";
import DashboardMetrics from "../components/Dashboard/DashboardMetrics";
import NotPaidSection from "../components/Dashboard/NotPaidSection";
import ExpenseDrawer from "../components/Dashboard/ExpenseDrawer";
import NetDrawer from "../components/Dashboard/NetDrawer";
import CashDrawer from "../components/Dashboard/CashDrawer";


function Dashboard() {
    const [dashboardData, setDashboardData] = useState(null);
    const [selectedCard, setSelectedCard] = useState(null);
    const [cashFlow, setCashFlow] = useState(null);
    useEffect(() => {
      async function loadDashboard() {
        const data = await getDashboard();
        setDashboardData(data);
      }

      loadDashboard();

      
    }, []);
    async function openCashDrawer() {

        const flow = await getTodayCashFlow();

        setCashFlow(flow);

        setSelectedCard("cash");

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
            />
        </div>
        
  );
}

export default Dashboard;