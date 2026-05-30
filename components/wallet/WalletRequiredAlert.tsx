"use client";

import { usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { AlertBanner } from "@/components/ui/alert-banner";
import { RootState } from "@/redux/store";
import { selectUserRole } from "@/redux/slice/auth-mgt/auth-mgt-slice";
import {
  getWalletRouteForRole,
  shouldShowWalletRequiredAlert,
} from "@/utils/wallet-route";

export function WalletRequiredAlert() {
  const pathname = usePathname();
  const userRole = useSelector(selectUserRole);
  const user = useSelector((state: RootState) => state.auth.user);

  const walletId = user?.walletId ?? null;
  const role = userRole || user?.role;

  if (!shouldShowWalletRequiredAlert(role, walletId, pathname)) {
    return null;
  }

  const walletRoute = getWalletRouteForRole(role);
  if (!walletRoute) return null;

  return (
    <AlertBanner
      title="Wallet required"
      message="You need to create a wallet before you can make payments or receive funds on this account."
      actionLabel="Create wallet"
      actionHref={walletRoute}
      variant="warning"
    />
  );
}
