import { Routes, Route } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";

import Dashboard from "./pages/Dashboard";
import ViewCustomer from "./pages/ViewCustomer";
import AddCustomer from "./pages/AddCustomer";
import AddExpense from "./pages/AddExpense";
import History from "./pages/History";
import BusinessSummary from "./pages/BusinessSummary";

function App() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/customers" element={<ViewCustomer />} />
        <Route path="/add-customer" element={<AddCustomer />} />
        <Route path="/expenses" element={<AddExpense />} />
        <Route path="/history" element={<History />} />
        <Route path="/business-summary" element={<BusinessSummary />} />
      </Routes>
    </MainLayout>
  );
}

export default App;