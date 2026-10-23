"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { AlertBanner } from "@/components/ui/alert-banner";
import type { AppDispatch, RootState } from "@/redux/store";
import { selectUserRole } from "@/redux/slice/auth-mgt/auth-mgt-slice";
import { getWallet as getEstateWallet } from "@/redux/slice/estate-admin/wallet-mgt/wallet-mgt";
import { getWallet as getStaffWallet } from "@/redux/slice/staff/wallet-mgt/wallet-mgt";
import { getCompanyWallet } from "@/redux/slice/company/wallet-mgt/company-wallet-mgt";
import { parseCompanyFromUser } from "@/app/(platform)/dashboard/company/lib/company";
import { extractEstateIdFromUser } from "@/lib/user-id";
import { isNavModuleEnabled } from "@/lib/nav-module-filter";
import { getUserAssignedModules } from "@/lib/overview-chart-modules";
import {
  getWalletRouteForRole,
  hasWithdrawalBankAccount,
  normalizeUserRole,
  shouldShowWithdrawalAccountAlert,
} from "@/utils/wallet-route";

export function WalletRequiredAlert() {
  const pathname = usePathname();
  const dispatch = useDispatch<AppDispatch>();
  const userRole = useSelector(selectUserRole);
  const user = useSelector((state: RootState) => state.auth.user) as
    | Record<string, unknown>
    | null;

  const estateWallet = useSelector(
    (state: RootState) => state.estateAdminWallet.wallet,
  );
  const estateWalletState = useSelector(
    (state: RootState) => state.estateAdminWallet.getWalletState,
  );
  const staffWallet = useSelector(
    (state: RootState) => state.staffWallet?.wallet ?? null,
  );
  const staffWalletState = useSelector(
    (state: RootState) => state.staffWallet?.getWalletState ?? "idle",
  );
  const companyWallet = useSelector(
    (state: RootState) => state.companyWallet.wallet,
  );
  const companyWalletState = useSelector(
    (state: RootState) => state.companyWallet.getWalletState,
  );

  const role = userRole || (user?.role as string | undefined);
  const normalizedRole = normalizeUserRole(role);
  const estateId = extractEstateIdFromUser(user);
  const companyId = user ? (parseCompanyFromUser(user)?.id ?? null) : null;

  const isEstateAdmin =
    normalizedRole === "estate admin" || normalizedRole === "estate-admin";
  const isStaff = normalizedRole === "staff";
  const isCompany = normalizedRole === "company";
  const staffHasWalletPage = isNavModuleEnabled(
    "wallet",
    getUserAssignedModules(user) ?? [],
  );
  const isEligibleRole =
    isEstateAdmin || isCompany || (isStaff && staffHasWalletPage);

  useEffect(() => {
    if (!isEligibleRole) return;

    if (isEstateAdmin && estateId && estateWalletState === "idle") {
      dispatch(getEstateWallet(estateId));
      return;
    }
    if (
      isStaff &&
      staffHasWalletPage &&
      estateId &&
      staffWalletState === "idle"
    ) {
      dispatch(getStaffWallet(estateId));
      return;
    }
    if (isCompany && companyId && companyWalletState === "idle") {
      dispatch(getCompanyWallet(companyId));
    }
  }, [
    dispatch,
    isEligibleRole,
    isEstateAdmin,
    isStaff,
    staffHasWalletPage,
    isCompany,
    estateId,
    companyId,
    estateWalletState,
    staffWalletState,
    companyWalletState,
  ]);

  const activeWallet = isEstateAdmin
    ? estateWallet
    : isStaff
      ? staffWallet
      : isCompany
        ? companyWallet
        : null;

  const walletFetchState = isEstateAdmin
    ? estateWalletState
    : isStaff
      ? staffWalletState
      : isCompany
        ? companyWalletState
        : "idle";

  const hasBank = hasWithdrawalBankAccount(activeWallet?.accountNumber);
  const walletSettled =
    walletFetchState === "succeeded" || walletFetchState === "failed";

  if (!isEligibleRole || !walletSettled) return null;

  if (!shouldShowWithdrawalAccountAlert(role, null, hasBank, pathname)) {
    return null;
  }

  const walletRoute = getWalletRouteForRole(role);
  if (!walletRoute) return null;

  return (
    <AlertBanner
      title="Withdrawal account required"
      message="Set a bank account so you can withdraw funds from your wallet."
      actionLabel="Set withdrawal account"
      actionHref={walletRoute}
      variant="warning"
    />
  );
}
