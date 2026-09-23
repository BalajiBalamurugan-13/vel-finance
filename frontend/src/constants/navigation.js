import {
  FiHome,
  FiCheckSquare,
  FiUsers,
  FiUserPlus,
  FiDollarSign,
  FiClock,
  FiBarChart2,
  FiClipboard,
  FiMapPin,
} from "react-icons/fi";

const navigation = [
  {
    key: "dashboard",
    name: "Dashboard",
    path: "/",
    icon: FiHome,
  },
  {
    key: "daily_collection",
    name: "Daily Collection",
    path: "/daily-collection",
    icon: FiCheckSquare,
  },
  {
    key: "customers",
    name: "View Customer",
    path: "/customers",
    icon: FiUsers,
  },
  {
    key: "add_customer",
    name: "Add Customer",
    path: "/add-customer",
    icon: FiUserPlus,
  },
  {
    key: "collection_sheet",
    name: "Collection Sheet",
    path: "/collection-sheet",
    icon: FiClipboard,
  },
  {
    key: "expenses",
    name: "Add Expense",
    path: "/expenses",
    icon: FiDollarSign,
  },
  {
    key: "history",
    name: "History",
    path: "/history",
    icon: FiClock,
  },
  {
    key: "business_summary",
    name: "Business Summary",
    path: "/business-summary",
    icon: FiBarChart2,
  },
  {
    key: "places",
    name: "Manage Places",
    path: "/places",
    icon: FiMapPin,
  },
];

export default navigation;
