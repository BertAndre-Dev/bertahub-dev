import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storageSession from "redux-persist/lib/storage/session";
import { injectStore } from "@/utils/store-accessor";
import authSliceReducer from "@/redux/slice/auth-mgt/auth-mgt-slice";
import estateSliceReducer from "@/redux/slice/super-admin/super-admin-est-mgt/super-admin-est-mgt-slice";
import superAdminUserSliceReducer from "@/redux/slice/super-admin/super-admin-user/super-admin-user-slice";
import fieldSliceReducer from "@/redux/slice/admin/address-mgt/fields/fields-slice";
import entrySliceReducer from "@/redux/slice/admin/address-mgt/entry/entry-slice";
import adminUserSliceReducer from "@/redux/slice/admin/user-mgt/user-slice";
import billSliceReducer from "@/redux/slice/admin/bills-mgt/bills-slice";
import residentBillSliceReducer from "@/redux/slice/resident/bill-mgt/bills-mgt-slice";
import walletSliceReducer from "@/redux/slice/resident/wallet-mgt/wallet-mgt-slice";
import estateAdminWalletSliceReducer from "@/redux/slice/estate-admin/wallet-mgt/wallet-mgt-slice";
import transactionSliceReducer from "@/redux/slice/resident/transaction/transaction-slice";
import estateAdminTransactionSliceReducer from "@/redux/slice/estate-admin/transaction/transaction-slice";
import residentBillPinSliceReducer from "@/redux/slice/resident/set-pin/set-pin-slice";
import fundWalletSliceReducer from "@/redux/slice/estate-admin/fund-wallet/fund-wallet-slice";
import adminMeterSliceReducer from "@/redux/slice/admin/meter-mgt/meter-mgt-slice";
import residentMeterSliceReducer from "@/redux/slice/resident/meter-mgt/meter-mgt-slice";
import residentMeterRealtimeBalanceSliceReducer from "@/redux/slice/resident/meter-realtime-balance/resident-meter-realtime-balance-slice";
import superAdminMeterSliceReducer from "@/redux/slice/super-admin/super-admin-meter-mgt/super-admin-meter-slice";
import superAdminTransactionSliceReducer from "@/redux/slice/super-admin/super-admin-transactions-mgt/super-admin-transactions-slice";
import superAdminEstateTransactionsSliceReducer from "@/redux/slice/super-admin/super-admin-estate-transactions/super-admin-estate-transactions-slice";
import visitorSliceReducer from "@/redux/slice/admin/visitor/visitor.slice";
import residentVisitorSliceReducer from "@/redux/slice/resident/visitor/visitor-slice";
import securityVisitorSliceReducer from "@/redux/slice/security/visitor/visitor-slice";
import paymentSliceReducer from "@/redux/slice/estate-admin/payment/paymentSlice";
import userProfileSliceReducer from "@/redux/slice/resident/user-profile/user-profile-slice";
import estateProfileSliceReducer from "@/redux/slice/estate-profile/estate-profile-slice";
import complaintsSliceReducer from "@/redux/slice/admin/maintenance/complaints-slice";
import residentComplaintsSliceReducer from "@/redux/slice/resident/maintenance/resident-complaints-slice";
import transactionAnalyticsSliceReducer from "@/redux/slice/estate-admin/transaction-analytics/transaction-analytics-slice";
import estateAdminTransactionSummarySliceReducer from "@/redux/slice/estate-admin/transaction-summary/estate-admin-transaction-summary-slice";
import estateAdminEnergyConsumptionSliceReducer from "@/redux/slice/estate-admin/energy-consumption/estate-admin-energy-consumption-slice";
import estateAdminEstateEnergyUsageSliceReducer from "@/redux/slice/estate-admin/estate-energy-usage/estate-admin-estate-energy-usage-slice";
import estateAdminUserAnalyticsSliceReducer from "@/redux/slice/estate-admin/user-analytics/user-analytics-slice";
import estateAdminComplaintsDashboardSliceReducer from "@/redux/slice/estate-admin/complaints-dashboard/complaints-dashboard-slice";
import estateAdminMeterSummarySliceReducer from "@/redux/slice/estate-admin/meter-summary/meter-summary-slice";
import billsAnalyticsSliceReducer from "@/redux/slice/estate-admin/bills-analytics/bills-analytics-slice";
import meterAnalyticsSliceReducer from "@/redux/slice/estate-admin/meter-analytics/meter-analytics-slice";
import superAdminBillsAnalyticsSliceReducer from "@/redux/slice/super-admin/super-admin-bills-analytics/super-admin-bills-analytics-slice";
import adminDashboardAnalyticsSliceReducer from "@/redux/slice/admin/dashboard-analytics/admin-dashboard-analytics-slice";
import adminEnergyConsumptionSliceReducer from "@/redux/slice/admin/energy-consumption/admin-energy-consumption-slice";
import adminEstateEnergyUsageSliceReducer from "@/redux/slice/admin/estate-energy-usage/admin-estate-energy-usage-slice";
import adminEstateRealtimeReadingsSliceReducer from "@/redux/slice/admin/estate-realtime-readings/admin-estate-realtime-readings-slice";
import adminTransactionSummarySliceReducer from "@/redux/slice/admin/transaction-summary/admin-transaction-summary-slice";
import adminUserAnalyticsSliceReducer from "@/redux/slice/admin/user-analytics/user-analytics-slice";
import adminMeterSummarySliceReducer from "@/redux/slice/admin/meter-summary/meter-summary-slice";
import adminBillsSummarySliceReducer from "@/redux/slice/admin/bills-summary/bills-summary-slice";
import adminComplaintsSummarySliceReducer from "@/redux/slice/admin/complaints-summary/complaints-summary-slice";
import adminComplaintsDashboardSliceReducer from "@/redux/slice/admin/complaints-dashboard/complaints-dashboard-slice";
import residentDashboardAnalyticsSliceReducer from "@/redux/slice/resident/dashboard-analytics/resident-dashboard-analytics-slice";
import residentInviteTenantSliceReducer from "@/redux/slice/resident/invite-tenant/invite-tenant-slice";
import residentAddressOptionsSliceReducer from "@/redux/slice/resident/address-options/resident-address-options-slice";
import residentPaymentMgtSliceReducer from "@/redux/slice/resident/payment-mgt/payment-mgt-slice";
import residentFlutterwaveVaSliceReducer from "@/redux/slice/resident/virtual-accounts/flutterwave-va-slice";
import residentRentMgtSliceReducer from "@/redux/slice/resident/rent-mgt/rent-mgt-slice";
import residentInvitedTenantsSliceReducer from "@/redux/slice/resident/invited-tenants/invited-tenants-slice";
import adminAnnouncementsSliceReducer from "@/redux/slice/admin/announcements/announcements-slice";
import adminRequestSliceReducer from "@/redux/slice/admin/request/admin-request-slice";
import superAdminMarketplaceSliceReducer from "@/redux/slice/super-admin/marketplace/marketplace-slice";
import residentMarketplaceSliceReducer from "@/redux/slice/resident/marketplace/marketplace-slice";
import residentAnnouncementsSliceReducer from "@/redux/slice/resident/announcements/announcements-slice";
import adminExpenseHeadSliceReducer from "@/redux/slice/admin/expense-head/expense-head-slice";
import adminExpenseEntrySliceReducer from "@/redux/slice/admin/expense-entry/expense-entry-slice";
import adminRevenueHeadSliceReducer from "@/redux/slice/admin/revenue-head/revenue-head-slice";
import adminRevenueEntrySliceReducer from "@/redux/slice/admin/revenue-entry/revenue-entry-slice";
import estateAdminFinancialReportSliceReducer from "@/redux/slice/estate-admin/financial-report/financial-report-slice";
import estateAdminRevenueChartSliceReducer from "@/redux/slice/estate-admin/revenue-chart/revenue-chart-slice";
import estateAdminExpenseChartSliceReducer from "@/redux/slice/estate-admin/expense-chart/expense-chart-slice";
import superAdminCompanySliceReducer from "@/redux/slice/super-admin/company-mgt/company-slice";
import companyMarketplaceSliceReducer from "@/redux/slice/company/marketplace/company-marketplace-slice";
import companyAssetSliceReducer from "@/redux/slice/company/asset-mgt/company-asset-slice";
import companyEstateSliceReducer from "@/redux/slice/company/estate-mgt/company-estate-slice";
import companyUserSliceReducer from "@/redux/slice/company/user-mgt/company-user-slice";
import residentAssetSliceReducer from "@/redux/slice/resident/asset-mgt/resident-asset-slice";
import adminAssetSliceReducer from "@/redux/slice/admin/asset-mgt/admin-asset-slice";
import companyAssetMaintenanceSliceReducer from "@/redux/slice/company/asset-maintenance/company-asset-maintenance-slice";
import adminAssetMaintenanceSliceReducer from "@/redux/slice/admin/asset-maintenance/admin-asset-maintenance-slice";
import adminOperationsReportingSliceReducer from "@/redux/slice/admin/operations-reporting/admin-operations-reporting-slice";
import companyOperationsReportingSliceReducer from "@/redux/slice/company/operations-reporting/company-operations-reporting-slice";
import companyFinancialReportSliceReducer from "@/redux/slice/company/financial-report/company-financial-report-slice";
import companyRevenueChartSliceReducer from "@/redux/slice/company/revenue-chart/company-revenue-chart-slice";
import companyExpenseChartSliceReducer from "@/redux/slice/company/expense-chart/company-expense-chart-slice";
import companyExpenseHeadSliceReducer from "@/redux/slice/company/expense-head/company-expense-head-slice";
import companyExpenseEntrySliceReducer from "@/redux/slice/company/expense-entry/company-expense-entry-slice";
import companyRevenueHeadSliceReducer from "@/redux/slice/company/revenue-head/company-revenue-head-slice";
import companyRevenueEntrySliceReducer from "@/redux/slice/company/revenue-entry/company-revenue-entry-slice";
import companyTransactionSliceReducer from "@/redux/slice/company/transaction/company-transaction-slice";
import companyTransactionSummarySliceReducer from "@/redux/slice/company/transaction-summary/company-transaction-summary-slice";
import companyEnergyConsumptionSliceReducer from "@/redux/slice/company/energy-consumption/company-energy-consumption-slice";
import companyOverviewAnalyticsSliceReducer from "@/redux/slice/company/overview-analytics/company-overview-analytics-slice";
import companyEstateEnergyUsageSliceReducer from "@/redux/slice/company/estate-energy-usage/company-estate-energy-usage-slice";
import companyMeterSliceReducer from "@/redux/slice/company/meter-mgt/company-meter-slice";
import reassignMeterSliceReducer from "@/redux/slice/meter/reassign-meter/reassign-meter-slice";
import companyWalletSliceReducer from "@/redux/slice/company/wallet-mgt/company-wallet-mgt-slice";
import chatSliceReducer from "@/redux/slice/chat/chat-slice";
import communityGroupSliceReducer from "@/redux/slice/community-group/community-group-slice";
import estateAdminCommunityGroupSliceReducer from "@/redux/slice/estate-admin/community-group/community-group-slice";
import mapsSliceReducer from "@/redux/slice/maps/maps-slice";
import { mapsApi } from "@/redux/api/mapsApi";
import residentBillsPaymentSliceReducer from "@/redux/slice/resident/bills-payment/bills-payment-slice";
import staffUserProfileSliceReducer from "@/redux/slice/staff/user-profile/staff-user-profile-slice";
import staffSupportSliceReducer from "@/redux/slice/staff/support/staff-support-slice";
import staffMaintenanceSliceReducer from "@/redux/slice/staff/maintenance/staff-maintenance-slice";
import staffCommunitySliceReducer from "@/redux/slice/staff/community/staff-community-slice";
import staffAnnouncementsSliceReducer from "@/redux/slice/staff/announcements/staff-announcements-slice";
import staffRequestSliceReducer from "@/redux/slice/staff/request/staff-request-slice";
import staffRequestWorkflowSliceReducer from "@/redux/slice/staff/request/staff-request-workflow-slice";
import staffFieldSliceReducer from "@/redux/slice/staff/address-mgt/fields/fields-slice";
import staffEntrySliceReducer from "@/redux/slice/staff/address-mgt/entry/entry-slice";
import staffBillSliceReducer from "@/redux/slice/staff/bills-mgt/bills-slice";
import staffMeterSliceReducer from "@/redux/slice/staff/meter-mgt/meter-mgt-slice";
import staffEnergyConsumptionSliceReducer from "@/redux/slice/staff/energy-consumption/staff-energy-consumption-slice";
import staffEstateEnergyUsageSliceReducer from "@/redux/slice/staff/estate-energy-usage/staff-estate-energy-usage-slice";
import staffEstateRealtimeReadingsSliceReducer from "@/redux/slice/staff/estate-realtime-readings/staff-estate-realtime-readings-slice";
import staffUserAnalyticsSliceReducer from "@/redux/slice/staff/user-analytics/user-analytics-slice";
import staffMeterSummarySliceReducer from "@/redux/slice/staff/meter-summary/meter-summary-slice";
import staffBillsSummarySliceReducer from "@/redux/slice/staff/bills-summary/bills-summary-slice";
import staffComplaintsSummarySliceReducer from "@/redux/slice/staff/complaints-summary/complaints-summary-slice";
import staffComplaintsDashboardSliceReducer from "@/redux/slice/staff/complaints-dashboard/complaints-dashboard-slice";
import staffVisitorSliceReducer from "@/redux/slice/staff/visitor/visitor.slice";
import staffExpenseHeadSliceReducer from "@/redux/slice/staff/expense-head/expense-head-slice";
import staffExpenseEntrySliceReducer from "@/redux/slice/staff/expense-entry/expense-entry-slice";
import staffRevenueHeadSliceReducer from "@/redux/slice/staff/revenue-head/revenue-head-slice";
import staffRevenueEntrySliceReducer from "@/redux/slice/staff/revenue-entry/revenue-entry-slice";
import staffAssetSliceReducer from "@/redux/slice/staff/asset-mgt/staff-asset-slice";
import staffAssetMaintenanceSliceReducer from "@/redux/slice/staff/asset-maintenance/staff-asset-maintenance-slice";
import staffOperationsReportingSliceReducer from "@/redux/slice/staff/operations-reporting/staff-operations-reporting-slice";
import staffWalletSliceReducer from "@/redux/slice/staff/wallet-mgt/wallet-mgt-slice";
import staffTransactionSliceReducer from "@/redux/slice/staff/transaction/transaction-slice";
import staffFundWalletSliceReducer from "@/redux/slice/staff/fund-wallet/fund-wallet-slice";
import staffRevenueWithdrawalAccountSliceReducer from "@/redux/slice/staff/wallet-mgt/revenue-withdrawal-account-slice";
import companyRequestSliceReducer from "@/redux/slice/company/request/company-request-slice";
import companyAnnouncementsSliceReducer from "@/redux/slice/company/announcements/company-announcements-slice";
import estateAdminRequestSliceReducer from "@/redux/slice/estate-admin/request/estate-admin-request-slice";
import requestCommentsSliceReducer from "@/redux/slice/request/request-comments-slice";
import designationsSliceReducer from "@/redux/slice/designations/designations-slice";
import estateAdminAnnouncementsSliceReducer from "@/redux/slice/estate-admin/announcements/estate-admin-announcements-slice";
import superAdminEnergyProviderConfigSliceReducer from "@/redux/slice/super-admin/energy-provider-config/energy-provider-config-slice";
import superAdminEnergyConsumptionSliceReducer from "@/redux/slice/super-admin/energy-consumption/super-admin-energy-consumption-slice";
import superAdminEstateEnergyUsageSliceReducer from "@/redux/slice/super-admin/estate-energy-usage/super-admin-estate-energy-usage-slice";
import energyProviderVendsSliceReducer from "@/redux/slice/energy-provider/vends/energy-provider-vends-slice";
import companyEnergyProviderConfigSliceReducer from "@/redux/slice/company/energy-provider-config/company-energy-provider-config-slice";
import companyEnergyProviderVendsSliceReducer from "@/redux/slice/company/energy-provider-vends/company-energy-provider-vends-slice";
import energyProviderTransactionSliceReducer from "@/redux/slice/energy-provider/transaction/energy-provider-transaction-slice";
import energyProviderWalletSliceReducer from "@/redux/slice/energy-provider/wallet-mgt/energy-provider-wallet-mgt-slice";
import energyProviderFieldSliceReducer from "@/redux/slice/energy-provider/address-mgt/fields/energy-provider-fields-slice";
import energyProviderEntrySliceReducer from "@/redux/slice/energy-provider/address-mgt/entry/energy-provider-entry-slice";
import energyProviderEstateSliceReducer from "@/redux/slice/energy-provider/estate-mgt/energy-provider-estate-slice";
import energyProviderUserSliceReducer from "@/redux/slice/energy-provider/user-mgt/energy-provider-user-slice";
import superAdminRatesSliceReducer from "@/redux/slice/super-admin/rates/rates-slice";
import notificationsSliceReducer from "@/redux/slice/notifications/notifications-slice";
import withdrawalAccountSliceReducer from "@/redux/slice/wallet-mgt/withdrawal-account-slice";
import companyRevenueWithdrawalAccountSliceReducer from "@/redux/slice/company/wallet-mgt/revenue-withdrawal-account-slice";
import estateAdminRevenueWithdrawalAccountSliceReducer from "@/redux/slice/estate-admin/wallet-mgt/revenue-withdrawal-account-slice";
import energyProviderRevenueWithdrawalAccountSliceReducer from "@/redux/slice/energy-provider/wallet-mgt/revenue-withdrawal-account-slice";
import superAdminRevenueTrendSliceReducer from "@/redux/slice/super-admin/revenue-trend/revenue-trend-slice";
import superAdminAveragePurchaseSliceReducer from "@/redux/slice/super-admin/average-purchase/average-purchase-slice";
import superAdminTopEstatesEnergySliceReducer from "@/redux/slice/super-admin/top-estates-energy/top-estates-energy-slice";
import superAdminFaultsSummarySliceReducer from "@/redux/slice/super-admin/faults-summary/faults-summary-slice";
import superAdminMeterCommunicationStatusSliceReducer from "@/redux/slice/super-admin/meter-communication-status/meter-communication-status-slice";
import superAdminPowerAvailabilitySliceReducer from "@/redux/slice/super-admin/power-availability/power-availability-slice";
import superAdminPaymentChannelsSliceReducer from "@/redux/slice/super-admin/payment-channels/payment-channels-slice";
import superAdminCollectionEfficiencySliceReducer from "@/redux/slice/super-admin/collection-efficiency/collection-efficiency-slice";
import superAdminCustomerGrowthSliceReducer from "@/redux/slice/super-admin/customer-growth/customer-growth-slice";
import superAdminRechargeBehaviorSliceReducer from "@/redux/slice/super-admin/recharge-behavior/recharge-behavior-slice";
import superAdminConsumptionSnapshotSliceReducer from "@/redux/slice/super-admin/consumption-snapshot/consumption-snapshot-slice";
import superAdminCustomerMeterSummarySliceReducer from "@/redux/slice/super-admin/customer-meter-summary/customer-meter-summary-slice";
import superAdminCustomerActivationsSliceReducer from "@/redux/slice/super-admin/customer-activations/customer-activations-slice";
import superAdminPlatformFeesSliceReducer from "@/redux/slice/super-admin/platform-fees/platform-fees-slice";
import superAdminVendingFrequencySliceReducer from "@/redux/slice/super-admin/vending-frequency/vending-frequency-slice";
import superAdminRevenueBySegmentSliceReducer from "@/redux/slice/super-admin/revenue-by-segment/revenue-by-segment-slice";
import superAdminRevenueSummarySliceReducer from "@/redux/slice/super-admin/revenue-summary/revenue-summary-slice";

const persistConfig = {
  key: "root",
  // Use sessionStorage so auth/user state is isolated per-tab.
  // This prevents multi-tab data mixing when users sign in as different accounts.
  storage: storageSession,
};

const persistedAuthReducer = persistReducer(persistConfig, authSliceReducer);
const persistedEstateReducer = persistReducer(
  persistConfig,
  estateSliceReducer,
);
const persistedSuperAdminUserReducer = persistReducer(
  persistConfig,
  superAdminUserSliceReducer,
);
const persistedFieldReducer = persistReducer(persistConfig, fieldSliceReducer);
const persistedEntryReducer = persistReducer(persistConfig, entrySliceReducer);
const persistedAdminUserReducer = persistReducer(
  persistConfig,
  adminUserSliceReducer,
);
const persistedBillReducer = persistReducer(persistConfig, billSliceReducer);
const persistedResidentBillReducer = persistReducer(
  persistConfig,
  residentBillSliceReducer,
);
const persistedWalletSliceReducer = persistReducer(
  persistConfig,
  walletSliceReducer,
);
const persistedEstateAdminWalletSliceReducer = persistReducer(
  persistConfig,
  estateAdminWalletSliceReducer,
);
const persistedTransactionSliceReducer = persistReducer(
  persistConfig,
  transactionSliceReducer,
);
const persistedEstateAdminTransactionSliceReducer = persistReducer(
  persistConfig,
  estateAdminTransactionSliceReducer,
);
const persistedFundWalletSliceReducer = persistReducer(
  persistConfig,
  fundWalletSliceReducer,
);
const persistedAdminMeterliceReducer = persistReducer(
  persistConfig,
  adminMeterSliceReducer,
);
const persistedResidentMeterliceReducer = persistReducer(
  persistConfig,
  residentMeterSliceReducer,
);
const persistedSuperAdmintMeterliceReducer = persistReducer(
  persistConfig,
  superAdminMeterSliceReducer,
);
const persistedSuperAdminTransactionSliceReducer = persistReducer(
  persistConfig,
  superAdminTransactionSliceReducer,
);
const persistedVisitorSliceReducer = persistReducer(
  persistConfig,
  visitorSliceReducer,
);
const persistedResidentVisitorSliceReducer = persistReducer(
  persistConfig,
  residentVisitorSliceReducer,
);
const persistedSecurityVisitorSliceReducer = persistReducer(
  persistConfig,
  securityVisitorSliceReducer,
);
const persistedPaymentSliceReducer = persistReducer(
  persistConfig,
  paymentSliceReducer,
);
const persistedUserProfileSliceReducer = persistReducer(
  persistConfig,
  userProfileSliceReducer,
);
const persistedEstateProfileSliceReducer = persistReducer(
  persistConfig,
  estateProfileSliceReducer,
);
const persistedComplaintsSliceReducer = persistReducer(
  persistConfig,
  complaintsSliceReducer,
);
const persistedResidentComplaintsSliceReducer = persistReducer(
  persistConfig,
  residentComplaintsSliceReducer,
);
const persistedAdminExpenseHeadSliceReducer = persistReducer(
  persistConfig,
  adminExpenseHeadSliceReducer,
);
const persistedAdminExpenseEntrySliceReducer = persistReducer(
  persistConfig,
  adminExpenseEntrySliceReducer,
);
const persistedAdminRevenueHeadSliceReducer = persistReducer(
  persistConfig,
  adminRevenueHeadSliceReducer,
);
const persistedAdminRevenueEntrySliceReducer = persistReducer(
  persistConfig,
  adminRevenueEntrySliceReducer,
);

const persistedResidentBillsPaymentSliceReducer = persistReducer(
  persistConfig,
  residentBillsPaymentSliceReducer,
);

const persistedSuperAdminCompanySliceReducer = persistReducer(
  persistConfig,
  superAdminCompanySliceReducer,
);

const persistedCompanyMarketplaceSliceReducer = persistReducer(
  persistConfig,
  companyMarketplaceSliceReducer,
);

const persistedCompanyAssetSliceReducer = persistReducer(
  persistConfig,
  companyAssetSliceReducer,
);

const persistedCompanyEstateSliceReducer = persistReducer(
  persistConfig,
  companyEstateSliceReducer,
);

const persistedCompanyUserSliceReducer = persistReducer(
  persistConfig,
  companyUserSliceReducer,
);

const persistedStaffUserProfileSliceReducer = persistReducer(
  persistConfig,
  staffUserProfileSliceReducer,
);

const persistedStaffMaintenanceSliceReducer = persistReducer(
  persistConfig,
  staffMaintenanceSliceReducer,
);

const persistedStaffCommunitySliceReducer = persistReducer(
  persistConfig,
  staffCommunitySliceReducer,
);

const persistedStaffVisitorSliceReducer = persistReducer(
  persistConfig,
  staffVisitorSliceReducer,
);
const persistedStaffExpenseHeadSliceReducer = persistReducer(
  persistConfig,
  staffExpenseHeadSliceReducer,
);
const persistedStaffExpenseEntrySliceReducer = persistReducer(
  persistConfig,
  staffExpenseEntrySliceReducer,
);
const persistedStaffRevenueHeadSliceReducer = persistReducer(
  persistConfig,
  staffRevenueHeadSliceReducer,
);
const persistedStaffRevenueEntrySliceReducer = persistReducer(
  persistConfig,
  staffRevenueEntrySliceReducer,
);
const persistedStaffWalletSliceReducer = persistReducer(
  persistConfig,
  staffWalletSliceReducer,
);
const persistedStaffTransactionSliceReducer = persistReducer(
  persistConfig,
  staffTransactionSliceReducer,
);
const persistedStaffFundWalletSliceReducer = persistReducer(
  persistConfig,
  staffFundWalletSliceReducer,
);

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    estate: persistedEstateReducer,
    superAdminUser: persistedSuperAdminUserReducer,
    adminField: persistedFieldReducer,
    adminEntry: persistedEntryReducer,
    adminUser: persistedAdminUserReducer,
    adminBill: persistedBillReducer,
    residentBill: persistedResidentBillReducer,
    wallet: persistedWalletSliceReducer,
    residentBillPin: residentBillPinSliceReducer,
    residentBillsPayment: persistedResidentBillsPaymentSliceReducer,
    estateAdminWallet: persistedEstateAdminWalletSliceReducer,
    residentTransaction: persistedTransactionSliceReducer,
    estateAdminTransaction: persistedEstateAdminTransactionSliceReducer,
    estateAdminFundWallet: persistedFundWalletSliceReducer,
    adminMeter: persistedAdminMeterliceReducer,
    residentMeter: persistedResidentMeterliceReducer,
    residentMeterRealtimeBalance: residentMeterRealtimeBalanceSliceReducer,
    superAdminMeter: persistedSuperAdmintMeterliceReducer,
    superAdminTransaction: persistedSuperAdminTransactionSliceReducer,
    superAdminEstateTransactions: superAdminEstateTransactionsSliceReducer,
    visitor: persistedVisitorSliceReducer,
    residentVisitor: persistedResidentVisitorSliceReducer,
    securityVisitor: persistedSecurityVisitorSliceReducer,
    payment: persistedPaymentSliceReducer,
    userProfile: persistedUserProfileSliceReducer,
    estateProfile: persistedEstateProfileSliceReducer,
    complaints: persistedComplaintsSliceReducer,
    residentComplaints: persistedResidentComplaintsSliceReducer,
    estateAdminTransactionAnalytics: transactionAnalyticsSliceReducer,
    estateAdminTransactionSummary: estateAdminTransactionSummarySliceReducer,
    estateAdminEnergyConsumption: estateAdminEnergyConsumptionSliceReducer,
    estateAdminEstateEnergyUsage: estateAdminEstateEnergyUsageSliceReducer,
    estateAdminUserAnalytics: estateAdminUserAnalyticsSliceReducer,
    estateAdminComplaintsDashboard: estateAdminComplaintsDashboardSliceReducer,
    estateAdminMeterSummary: estateAdminMeterSummarySliceReducer,
    estateAdminBillsAnalytics: billsAnalyticsSliceReducer,
    estateAdminMeterAnalytics: meterAnalyticsSliceReducer,
    superAdminBillsAnalytics: superAdminBillsAnalyticsSliceReducer,
    superAdminEnergyConsumption: superAdminEnergyConsumptionSliceReducer,
    superAdminEstateEnergyUsage: superAdminEstateEnergyUsageSliceReducer,
    adminDashboardAnalytics: adminDashboardAnalyticsSliceReducer,
    adminEnergyConsumption: adminEnergyConsumptionSliceReducer,
    adminEstateEnergyUsage: adminEstateEnergyUsageSliceReducer,
    adminEstateRealtimeReadings: adminEstateRealtimeReadingsSliceReducer,
    adminTransactionSummary: adminTransactionSummarySliceReducer,
    adminUserAnalytics: adminUserAnalyticsSliceReducer,
    adminMeterSummary: adminMeterSummarySliceReducer,
    adminBillsSummary: adminBillsSummarySliceReducer,
    adminComplaintsSummary: adminComplaintsSummarySliceReducer,
    adminComplaintsDashboard: adminComplaintsDashboardSliceReducer,
    residentDashboardAnalytics: residentDashboardAnalyticsSliceReducer,
    residentInviteTenant: residentInviteTenantSliceReducer,
    residentAddressOptions: residentAddressOptionsSliceReducer,
    residentPaymentMgt: residentPaymentMgtSliceReducer,
    residentFlutterwaveVa: residentFlutterwaveVaSliceReducer,
    residentRentMgt: residentRentMgtSliceReducer,
    residentInvitedTenants: residentInvitedTenantsSliceReducer,
    adminAnnouncements: adminAnnouncementsSliceReducer,
    adminRequest: adminRequestSliceReducer,
    superAdminMarketplace: superAdminMarketplaceSliceReducer,
    superAdminCompany: persistedSuperAdminCompanySliceReducer,
    companyMarketplace: persistedCompanyMarketplaceSliceReducer,
    companyAsset: persistedCompanyAssetSliceReducer,
    companyEstate: persistedCompanyEstateSliceReducer,
    companyUser: persistedCompanyUserSliceReducer,
    residentAsset: residentAssetSliceReducer,
    adminAsset: adminAssetSliceReducer,
    companyAssetMaintenance: companyAssetMaintenanceSliceReducer,
    adminAssetMaintenance: adminAssetMaintenanceSliceReducer,
    adminOperationsReporting: adminOperationsReportingSliceReducer,
    companyOperationsReporting: companyOperationsReportingSliceReducer,
    companyFinancialReport: companyFinancialReportSliceReducer,
    companyRevenueChart: companyRevenueChartSliceReducer,
    companyExpenseChart: companyExpenseChartSliceReducer,
    companyExpenseHead: companyExpenseHeadSliceReducer,
    companyExpenseEntry: companyExpenseEntrySliceReducer,
    companyRevenueHead: companyRevenueHeadSliceReducer,
    companyRevenueEntry: companyRevenueEntrySliceReducer,
    companyTransaction: companyTransactionSliceReducer,
    companyTransactionSummary: companyTransactionSummarySliceReducer,
    companyEnergyConsumption: companyEnergyConsumptionSliceReducer,
    companyOverviewAnalytics: companyOverviewAnalyticsSliceReducer,
    companyEstateEnergyUsage: companyEstateEnergyUsageSliceReducer,
    companyMeter: companyMeterSliceReducer,
    reassignMeter: reassignMeterSliceReducer,
    companyWallet: companyWalletSliceReducer,
    residentMarketplace: residentMarketplaceSliceReducer,
    residentAnnouncements: residentAnnouncementsSliceReducer,
    adminExpenseHead: persistedAdminExpenseHeadSliceReducer,
    adminExpenseEntry: persistedAdminExpenseEntrySliceReducer,
    adminRevenueHead: persistedAdminRevenueHeadSliceReducer,
    adminRevenueEntry: persistedAdminRevenueEntrySliceReducer,
    estateAdminFinancialReport: estateAdminFinancialReportSliceReducer,
    estateAdminRevenueChart: estateAdminRevenueChartSliceReducer,
    estateAdminExpenseChart: estateAdminExpenseChartSliceReducer,
    chat: chatSliceReducer,
    communityGroup: communityGroupSliceReducer,
    estateAdminCommunityGroup: estateAdminCommunityGroupSliceReducer,
    estateAdminAnnouncements: estateAdminAnnouncementsSliceReducer,
    maps: mapsSliceReducer,
    staffUserProfile: persistedStaffUserProfileSliceReducer,
    staffSupport: staffSupportSliceReducer,
    staffMaintenance: persistedStaffMaintenanceSliceReducer,
    staffCommunity: persistedStaffCommunitySliceReducer,
    staffAnnouncements: staffAnnouncementsSliceReducer,
    staffRequest: staffRequestSliceReducer,
    staffRequestWorkflow: staffRequestWorkflowSliceReducer,
    staffField: staffFieldSliceReducer,
    staffEntry: staffEntrySliceReducer,
    staffBill: staffBillSliceReducer,
    staffMeter: staffMeterSliceReducer,
    staffEnergyConsumption: staffEnergyConsumptionSliceReducer,
    staffEstateEnergyUsage: staffEstateEnergyUsageSliceReducer,
    staffEstateRealtimeReadings: staffEstateRealtimeReadingsSliceReducer,
    staffUserAnalytics: staffUserAnalyticsSliceReducer,
    staffMeterSummary: staffMeterSummarySliceReducer,
    staffBillsSummary: staffBillsSummarySliceReducer,
    staffComplaintsSummary: staffComplaintsSummarySliceReducer,
    staffComplaintsDashboard: staffComplaintsDashboardSliceReducer,
    staffVisitor: persistedStaffVisitorSliceReducer,
    staffExpenseHead: persistedStaffExpenseHeadSliceReducer,
    staffExpenseEntry: persistedStaffExpenseEntrySliceReducer,
    staffRevenueHead: persistedStaffRevenueHeadSliceReducer,
    staffRevenueEntry: persistedStaffRevenueEntrySliceReducer,
    staffAsset: staffAssetSliceReducer,
    staffAssetMaintenance: staffAssetMaintenanceSliceReducer,
    staffOperationsReporting: staffOperationsReportingSliceReducer,
    staffWallet: persistedStaffWalletSliceReducer,
    staffTransaction: persistedStaffTransactionSliceReducer,
    staffFundWallet: persistedStaffFundWalletSliceReducer,
    staffRevenueWithdrawalAccount: staffRevenueWithdrawalAccountSliceReducer,
    companyRequest: companyRequestSliceReducer,
    companyAnnouncements: companyAnnouncementsSliceReducer,
    estateAdminRequest: estateAdminRequestSliceReducer,
    requestComments: requestCommentsSliceReducer,
    designations: designationsSliceReducer,
    superAdminEnergyProviderConfig: superAdminEnergyProviderConfigSliceReducer,
    energyProviderVends: energyProviderVendsSliceReducer,
    companyEnergyProviderConfig: companyEnergyProviderConfigSliceReducer,
    companyEnergyProviderVends: companyEnergyProviderVendsSliceReducer,
    energyProviderTransaction: energyProviderTransactionSliceReducer,
    energyProviderWallet: energyProviderWalletSliceReducer,
    energyProviderField: energyProviderFieldSliceReducer,
    energyProviderEntry: energyProviderEntrySliceReducer,
    energyProviderEstate: energyProviderEstateSliceReducer,
    energyProviderUser: energyProviderUserSliceReducer,
    superAdminRates: superAdminRatesSliceReducer,
    notifications: notificationsSliceReducer,
    withdrawalAccount: withdrawalAccountSliceReducer,
    companyRevenueWithdrawalAccount: companyRevenueWithdrawalAccountSliceReducer,
    estateAdminRevenueWithdrawalAccount:
      estateAdminRevenueWithdrawalAccountSliceReducer,
    energyProviderRevenueWithdrawalAccount:
      energyProviderRevenueWithdrawalAccountSliceReducer,
    superAdminRevenueTrend: superAdminRevenueTrendSliceReducer,
    superAdminAveragePurchase: superAdminAveragePurchaseSliceReducer,
    superAdminTopEstatesEnergy: superAdminTopEstatesEnergySliceReducer,
    superAdminFaultsSummary: superAdminFaultsSummarySliceReducer,
    superAdminMeterCommunicationStatus: superAdminMeterCommunicationStatusSliceReducer,
    superAdminPowerAvailability: superAdminPowerAvailabilitySliceReducer,
    superAdminPaymentChannels: superAdminPaymentChannelsSliceReducer,
    superAdminCollectionEfficiency: superAdminCollectionEfficiencySliceReducer,
    superAdminCustomerGrowth: superAdminCustomerGrowthSliceReducer,
    superAdminRechargeBehavior: superAdminRechargeBehaviorSliceReducer,
    superAdminConsumptionSnapshot: superAdminConsumptionSnapshotSliceReducer,
    superAdminCustomerMeterSummary: superAdminCustomerMeterSummarySliceReducer,
    superAdminCustomerActivations: superAdminCustomerActivationsSliceReducer,
    superAdminPlatformFees: superAdminPlatformFeesSliceReducer,
    superAdminVendingFrequency: superAdminVendingFrequencySliceReducer,
    superAdminRevenueBySegment: superAdminRevenueBySegmentSliceReducer,
    superAdminRevenueSummary: superAdminRevenueSummarySliceReducer,
    [mapsApi.reducerPath]: mapsApi.reducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }).concat(mapsApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const persistor = persistStore(store);

// Must be called AFTER store is created so the axios interceptors can
// access state and dispatch without a circular import.
injectStore(store);
