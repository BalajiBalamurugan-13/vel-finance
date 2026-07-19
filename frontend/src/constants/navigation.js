import {
  FiHome,
  FiUsers,
  FiUserPlus,
  FiDollarSign,
  FiClock,
  FiBarChart2,
} from "react-icons/fi";

const navigation = [
  {
    name: "Dashboard",
    path: "/",
    icon: FiHome,
  },
  {
    name: "View Customer",
    path: "/customers",
    icon: FiUsers,
  },
  {
    name: "Add Customer",
    path: "/add-customer",
    icon: FiUserPlus,
  },
  {
    name: "Add Expense",
    path: "/expenses",
    icon: FiDollarSign,
  },
  {
    name: "History",
    path: "/history",
    icon: FiClock,
  },
  {
    name: "Business Summary",
    path: "/business-summary",
    icon: FiBarChart2,
  },
];

export default navigation;