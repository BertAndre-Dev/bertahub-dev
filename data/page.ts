import { FiHome, FiSettings, FiLogOut } from "react-icons/fi";
import { BsBuildings } from "react-icons/bs";
import { IoSpeedometerOutline } from "react-icons/io5";
import { LiaMoneyBillSolid } from "react-icons/lia";
import { GrTransaction } from "react-icons/gr";
import { FiUsers } from "react-icons/fi";
import { LuReceipt } from "react-icons/lu";

export const superAdminNav = [
  {
    label: "Dashboard",
    icon: FiHome,
    path: "/dashboard/super-admin/dashboard",
  },
  {
    label: "Estate Management",
    icon: BsBuildings,
    path: "/dashboard/super-admin/estate",
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
  {
    label: "Bills Management",
    icon: LuReceipt,
    path: "/dashboard/super-admin/bills",
  },
  {
    label: "Meter Management",
    icon: IoSpeedometerOutline,
    path: "/dashboard/super-admin/meter",
  },
//   {
//     label: "Transactions",
//     icon: GrTransaction,
//     path: "/dashboard/super-admin/transactions",
//   },
//   {
//     label: "Visitors Management",
//     icon: FiUsers,
//     path: "/dashboard/super-admin/visitors",
//   },
  {
    label: "Settings",
    icon: FiSettings,
    path: "/dashboard/super-admin/settings",
  },
];

export const adminNav = [
  { label: "Dashboard", icon: FiHome, path: "/dashboard/admin/dashboard" },
  {
    label: "Address Management",
    icon: FiUsers,
    path: "/dashboard/admin/address",
  },
  { label: "User Management", icon: FiUsers, path: "/dashboard/admin/user" },
  {
    label: "Bills Management",
    icon: LuReceipt,
    path: "/dashboard/admin/bills",
  },
  {
    label: "Meter Management",
    icon: IoSpeedometerOutline,
    path: "/dashboard/admin/meter",
  },
  {
    label: "Visitors Management",
    icon: FiUsers,
    path: "/dashboard/admin/visitor",
  },
  { label: "Settings", icon: FiSettings, path: "/dashboard/admin/settings" },
];

export const securityNav = [
  { label: "Dashboard", icon: FiHome, path: "/dashboard/security/dashboard" },
  {
    label: "View Visitor",
    icon: FiUsers,
    path: "/dashboard/security/view-visitor",
  },
  {
    label: "Verify Visitor",
    icon: FiSettings,
    path: "/dashboard/security/verify-visitor",
  },
];

export const residentNav = [
  // { label: "Dashboard", icon: FiHome, path: '/dashboard/resident/dashboard' },
  {
    label: "Bills Management",
    icon: FiUsers,
    path: "/dashboard/resident/bills",
  },
  {
    label: "Meter Management",
    icon: FiUsers,
    path: "/dashboard/resident/meter",
  },
  {
    label: "Transactions",
    icon: FiUsers,
    path: "/dashboard/resident/transaction",
  },
  {
    label: "Visitor Management",
    icon: FiUsers,
    path: "/dashboard/resident/visitor",
  },
  // { label: "Settings", icon: FiSettings, path: '/dashboard/resident/settings'  },
];

export const estateAdminNav = [
  {
    label: "Dashboard",
    icon: FiHome,
    path: "/dashboard/estate-admin/dashboard",
  },
  {
    label: "Transactions",
    icon: FiUsers,
    path: "/dashboard/estate-admin/transactions",
  },
];
