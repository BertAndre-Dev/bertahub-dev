import {
  FiHome,
  FiSettings,
  FiUsers,
  FiMapPin,
  FiLogOut,
} from "react-icons/fi";
import { BsBuildings } from "react-icons/bs";
import { IoSpeedometerOutline } from "react-icons/io5";
import { GrTransaction } from "react-icons/gr";
import { LuReceipt } from "react-icons/lu";
import { LayoutDashboard, Wrench, Bell, Store, BarChart } from "lucide-react";

export const superAdminNav = [
  // {
  //   label: "Overview",
  //   icon: FiHome,
  //   path: "/dashboard/super-admin/dashboard",
  // },
  {
    label: "Estate Management",
    icon: BsBuildings,
    path: "/dashboard/super-admin/estate",
  },
  {
    label: "Market Place",
    icon: Store,
    path: "/dashboard/super-admin/marketplace",
  },
  //   {
  //     label: "Address Management",
  //     icon: BsBuildings,
  //     path: "/dashboard/super-admin/address",
  //   },
  {
    label: "User Management",
    icon: FiUsers,
    path: "/dashboard/super-admin/user",
  },
  // {
  //   label: "Bills Management",
  //   icon: LuReceipt,
  //   path: "/dashboard/super-admin/bills",
  // },
  {
    label: "Meter Management",
    icon: IoSpeedometerOutline,
    path: "/dashboard/super-admin/meter",
  },
  {
    label: "Transactions",
    icon: GrTransaction,
    path: "/dashboard/super-admin/transactions",
  },
  //   {
  //     label: "Visitors Management",
  //     icon: FiUsers,
  //     path: "/dashboard/super-admin/visitors",
  //   },
  {
    label: "Settings",
    icon: FiSettings,
    path: "/dashboard/settings",
  },
  {
    label: "Logout",
    icon: FiLogOut,
    // path: "/auth/logout"
  },
];

export const adminNav = [
  // { label: "Overview", icon: FiHome, path: "/dashboard/admin/overview" },
  {
    label: "Address Management",
    icon: FiMapPin,
    path: "/dashboard/admin/address",
  },
  { label: "User Management", icon: FiUsers, path: "/dashboard/admin/user" },
  {
    label: "Bills Management",
    icon: LuReceipt,
    path: "/dashboard/admin/bills",
    module: "bills",
  },
  {
    label: "Meter Management",
    icon: IoSpeedometerOutline,
    path: "/dashboard/admin/meter",
    module: "meter",
  },
  {
    label: "Visitors Management",
    icon: FiUsers,
    path: "/dashboard/admin/visitor",
    module: "visitor",
  },
    {
    label: "Expenses",
    icon: LuReceipt,
    path: "/dashboard/admin/expenses",
    module: "expenses",
  },
  {
    label: "Maintenance Requests",
    icon: Wrench,
    path: "/dashboard/admin/maintenance",
    module: "complaints",
  },
  {
    label: "Announcements",
    icon: Bell,
    path: "/dashboard/admin/announcements",
    module: "announcements",
  },
  { label: "Settings", icon: FiSettings, path: "/dashboard/settings" },
  { label: "Logout", icon: FiLogOut },
];

export const securityNav = [
  {
    label: "Visitor Management",
    icon: LayoutDashboard,
    path: "/dashboard/security/visitor-management",
  },
  // {
  //   label: "View Visitor",
  //   icon: FiUsers,
  //   path: "/dashboard/security/view-visitor",
  // },
  {
    label: "Activity Log",
    icon: GrTransaction,
    path: "/dashboard/security/activity-log",
  },
  // {
  //   label: "Verify Visitor",
  //   icon: FiCheckCircle,
  //   path: "/dashboard/security/verify-visitor",
  // },
  { label: "Settings", icon: FiSettings, path: "/dashboard/settings" },
  { label: "Logout", icon: FiLogOut },
];

export const residentNav = [
  // { label: "Overview", icon: FiHome, path: "/dashboard/resident/dashboard" },
  {
    label: "Tenant Management", 
    icon: FiUsers,
    path: "/dashboard/resident/user",
  },
  {
    label: "Rent Management",
    icon: LuReceipt,
    path: "/dashboard/resident/rent",
  },
  {
    label: "Bills Management",
    icon: LuReceipt,
    path: "/dashboard/resident/bills",
  },
  {
    label: "Meter Management",
    icon: IoSpeedometerOutline,
    path: "/dashboard/resident/meter",
  },
  {
    label: "Wallet",
    icon: GrTransaction,
    path: "/dashboard/resident/transaction",
  },
  {
    label: "Visitor Management",
    icon: FiUsers,
    path: "/dashboard/resident/visitor",
  },
  {
    label: "Maintenance",
    icon: Wrench,
    path: "/dashboard/resident/maintenance",
  },
  {
    label: "Marketplace",
    icon: Store,
    path: "/dashboard/resident/marketplace",
  },
  {
    label: "Announcements",
    icon: Bell,
    path: "/dashboard/resident/announcements",
  },
  { label: "Settings", icon: FiSettings, path: "/dashboard/settings" },
  { label: "Logout", icon: FiLogOut },
];

export const estateAdminNav = [
  // {
  //   label: "Overview",
  //   icon: FiHome,
  //   path: "/dashboard/estate-admin/dashboard",
  // },
  {
    label: "Transactions",
    icon: GrTransaction,
    path: "/dashboard/estate-admin/transactions",
    module: "transactions",
  },
  {
    label: "Wallet",
    icon: LuReceipt,
    path: "/dashboard/estate-admin/wallet",
    module: "wallet",
  },
  {
    label: "Reports",
    icon: BarChart,
    path: "/dashboard/estate-admin/reports",
  },
  { label: "Settings", icon: FiSettings, path: "/dashboard/settings" },
  { label: "Logout", icon: FiLogOut },
];