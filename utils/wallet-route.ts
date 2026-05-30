const WALLET_ROUTES: Record<string, string> = {
  company: "/dashboard/company/wallet",
  resident: "/dashboard/resident/transaction",
  "estate admin": "/dashboard/estate-admin/wallet",
  "estate-admin": "/dashboard/estate-admin/wallet",
};

const WALLET_REQUIRED_ROLES = new Set([
  "company",
  "resident",
  "estate admin",
  "estate-admin",
]);

export function normalizeUserRole(role: string | null | undefined): string {
  return (role ?? "").toString().toLowerCase().trim();
}

export function getWalletRouteForRole(
  role: string | null | undefined,
): string | null {
  return WALLET_ROUTES[normalizeUserRole(role)] ?? null;
}

export function shouldShowWalletRequiredAlert(
  role: string | null | undefined,
  walletId: string | null | undefined,
  pathname: string,
): boolean {
  const normalizedRole = normalizeUserRole(role);
  if (!WALLET_REQUIRED_ROLES.has(normalizedRole)) return false;
  if (walletId) return false;

  const walletRoute = getWalletRouteForRole(normalizedRole);
  if (!walletRoute) return false;

  return pathname !== walletRoute && !pathname.startsWith(`${walletRoute}/`);
}
