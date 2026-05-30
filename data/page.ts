import { FiSettings, FiMapPin, FiLogOut } from "react-icons/fi";
import { BsBuildings } from "react-icons/bs";
import { IoSpeedometerOutline } from "react-icons/io5";
import {
  ArrowLeftRight,
  Banknote,
  BarChart,
  Bell,
  CarFront,
  ClipboardList,
  CircleDollarSign,
  CreditCard,
  Armchair,
  Hammer,
  History,
  Home,
  Inbox,
  Building2,
  Map as MapIcon,
  MessageCircle,
  MessagesSquare,
  Package,
  Store,
  UserCheck,
  UserCog,
  UserPlus,
  UsersRound,
  Wallet,
  Wrench,
} from "lucide-react";

export const superAdminNav = [
  // {
  //   label: "Overview",
  //   icon: FiHome,
  //   path: "/dashboard/super-admin/dashboard",
  // },
  {
    label: "Transactions",
    icon: ArrowLeftRight,
    path: "/dashboard/super-admin/transactions",
  },
  {
    label: "User Management",
    icon: UserCog,
    path: "/dashboard/super-admin/user",
  },
  {
    label: "Estate Management",
    icon: BsBuildings,
    path: "/dashboard/super-admin/estate",
  },
  {
    label: "Company Management",
    icon: Building2,
    path: "/dashboard/super-admin/company",
  },
  //   {
  //     label: "Address Management",
  //     icon: BsBuildings,
  //     path: "/dashboard/super-admin/address",
  //   },
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
    label: "Market Place",
    icon: Store,
    path: "/dashboard/super-admin/marketplace",
  },
  {
    label: "Contact Support Inbox",
    icon: Inbox,
    path: "/dashboard/super-admin/chat",
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

export const staffNav = [
  {
    label: "Maintenance Requests",
    icon: Hammer,
    path: "/dashboard/staff/maintenance",
    moduleKey: "complaints",
  },
  {
    label: "Community Chat",
    icon: MessagesSquare,
    path: "/dashboard/staff/community",
  },
  {
    label: "Announcements",
    icon: Bell,
    path: "/dashboard/staff/announcements",
    moduleKey: "announcements",
  },
  {
    label: "Contact Support",
    icon: MessageCircle,
    path: "/dashboard/staff/support",
  },
  {
    label: "Settings",
    icon: FiSettings,
    path: "/dashboard/staff/settings",
  },
  {
    label: "Logout",
    icon: FiLogOut,
  },
];

export const companyNav = [
  {
    label: "User Management",
    icon: UserCog,
    path: "/dashboard/company/users",
  },
  {
    label: "Estate Management",
    icon: BsBuildings,
    path: "/dashboard/company/estate",
  },
  {
    label: "Asset Management",
    icon: Building2,
    path: "/dashboard/company/asset",
  },
  {
    label: "Asset Maintenance",
    icon: Wrench,
    path: "/dashboard/company/asset-mgt",
    moduleKey: "asset-maintenance",
  },
  {
    label: "Operations Reporting",
    icon: ClipboardList,
    path: "/dashboard/company/operations",
    moduleKey: "operations-reporting",
  },
  // {
  //   label: "Community Chat",
  //   icon: MessagesSquare,
  //   path: "/dashboard/company/community",
  // },
  {
    label: "Contact Support",
    icon: MessageCircle,
    path: "/dashboard/company/support",
  },
  // {
  //   label: "Marketplace",
  //   icon: Store,
  //   path: "/dashboard/company/marketplace",
  // },
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
    moduleKey: "address",
  },
  {
    label: "User Management",
    icon: UserCog,
    path: "/dashboard/admin/user",
    moduleKey: "users",
  },
  {
    label: "Bills Management",
    icon: Banknote,
    path: "/dashboard/admin/bills",
    module: "bills",
    moduleKey: "bills",
  },
  {
    label: "Meter Management",
    icon: IoSpeedometerOutline,
    path: "/dashboard/admin/meter",
    module: "meter",
    moduleKey: "meter",
  },
  {
    label: "Visitors Management",
    icon: UserPlus,
    path: "/dashboard/admin/visitor",
    module: "visitor",
    moduleKey: "visitor",
  },
  {
    label: "Expenses",
    icon: CircleDollarSign,
    path: "/dashboard/admin/expenses",
    moduleKey: "expense",
    module: "expense",
  },
  {
    label: "Maintenance Requests",
    icon: Hammer,
    path: "/dashboard/admin/maintenance",
    module: "complaints",
    moduleKey: "complaints",
  },
  {
    label: "Announcements",
    icon: Bell,
    path: "/dashboard/admin/announcements",
    module: "announcements",
    moduleKey: "announcements",
  },
  {
    label: "Asset Management",
    icon: Package,
    path: "/dashboard/admin/asset",
    moduleKey: "asset-maintenance",
  },
  {
    label: "Asset Maintenance",
    icon: Wrench,
    path: "/dashboard/admin/asset-maintenance",
    moduleKey: "asset-maintenance",
  },
  {
    label: "Operations Reporting",
    icon: ClipboardList,
    path: "/dashboard/admin/operations-reporting",
    moduleKey: "asset-maintenance",
  },
  {
    label: "Community Chat",
    icon: MessagesSquare,
    path: "/dashboard/admin/community",
  },
  {
    label: "Contact Support",
    icon: MessageCircle,
    path: "/dashboard/admin/support",
  },
  { label: "Settings", icon: FiSettings, path: "/dashboard/settings" },
  { label: "Logout", icon: FiLogOut },
];

export const securityNav = [
  {
    label: "Visitor Management",
    icon: UserCheck,
    path: "/dashboard/security/visitor-management",
    moduleKey: "visitor",
  },
  // {
  //   label: "View Visitor",
  //   icon: FiUsers,
  //   path: "/dashboard/security/view-visitor",
  // },
  {
    label: "Activity Log",
    icon: History,
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
    label: "Bills Management",
    icon: ClipboardList,
    path: "/dashboard/resident/bills",
    moduleKey: "bills",
  },
  {
    label: "Meter Management",
    icon: IoSpeedometerOutline,
    path: "/dashboard/resident/meter",
    moduleKey: "meter",
  },
  {
    label: "Wallet",
    icon: Wallet,
    path: "/dashboard/resident/transaction",
    moduleKey: "wallet",
  },
  {
    label: "Tenant Management",
    icon: UsersRound,
    path: "/dashboard/resident/user",
    moduleKey: "users",
  },
  {
    label: "Rent Management",
    icon: Home,
    path: "/dashboard/resident/rent",
    moduleKey: "rent",
  },
  {
    label: "Visitor Management",
    icon: CarFront,
    path: "/dashboard/resident/visitor",
    moduleKey: "visitor",
  },
  {
    label: "Maintenance",
    icon: Wrench,
    path: "/dashboard/resident/maintenance",
    moduleKey: "complaints",
  },
  // {
  //   label: "Asset Management",
  //   icon: Armchair,
  //   path: "/dashboard/resident/asset",
  //   moduleKey: "asset",
  // },
  {
    label: "Marketplace",
    icon: Store,
    path: "/dashboard/resident/marketplace",
    moduleKey: "marketplace",
  },
  {
    label: "Nearby Places",
    icon: MapIcon,
    path: "/dashboard/resident/map",
  },
  {
    label: "Announcements",
    icon: Bell,
    path: "/dashboard/resident/announcements",
    moduleKey: "announcements",
  },
  {
    label: "Community Chat",
    icon: MessagesSquare,
    path: "/dashboard/resident/community",
  },
  {
    label: "Contact Support",
    icon: MessageCircle,
    path: "/dashboard/resident/support",
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
    icon: ArrowLeftRight,
    path: "/dashboard/estate-admin/transactions",
    module: "transactions",
    moduleKey: "transactions",
  },
  {
    label: "Wallet",
    icon: Wallet,
    path: "/dashboard/estate-admin/wallet",
    module: "wallet",
    moduleKey: "wallet",
  },
  {
    label: "Reports",
    icon: BarChart,
    path: "/dashboard/estate-admin/reports",
    moduleKey: "reporting",
  },
  {
    label: "Contact Support",
    icon: MessageCircle,
    path: "/dashboard/estate-admin/support",
  },
  { label: "Settings", icon: FiSettings, path: "/dashboard/settings" },
  { label: "Logout", icon: FiLogOut },
];
