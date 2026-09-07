"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Landmark,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import Modal from "@/components/modal/page";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/redux/store";
import {
  canonicalizeRevenueType,
  type RevenueWithdrawalRole,
} from "@/redux/slice/wallet-mgt/create-revenue-withdrawal-module";
import {
  getCompanyRevenueWithdrawalAccounts,
  getCompanyRevenueWithdrawalTypes,
  setCompanyAutoSettlement,
} from "@/redux/slice/company/wallet-mgt/revenue-withdrawal-account-slice";
import {
  getEstateAdminRevenueWithdrawalAccounts,
  getEstateAdminRevenueWithdrawalTypes,
  setEstateAdminAutoSettlement,
} from "@/redux/slice/estate-admin/wallet-mgt/revenue-withdrawal-account-slice";
import {
  getEnergyProviderRevenueWithdrawalAccounts,
  getEnergyProviderRevenueWithdrawalTypes,
  setEnergyProviderAutoSettlement,
} from "@/redux/slice/energy-provider/wallet-mgt/revenue-withdrawal-account-slice";
import {
  getStaffRevenueWithdrawalAccounts,
  getStaffRevenueWithdrawalTypes,
  setStaffAutoSettlement,
} from "@/redux/slice/staff/wallet-mgt/revenue-withdrawal-account-slice";
import SetRevenueWithdrawalAccountModal from "@/components/wallet/SetRevenueWithdrawalAccountModal";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";

const ROLE_API = {
  company: {
    getAccounts: getCompanyRevenueWithdrawalAccounts,
    getTypes: getCompanyRevenueWithdrawalTypes,
    setAutoSettlement: setCompanyAutoSettlement,
    selectSlice: (state: RootState) => state.companyRevenueWithdrawalAccount,
  },
  estateAdmin: {
    getAccounts: getEstateAdminRevenueWithdrawalAccounts,
    getTypes: getEstateAdminRevenueWithdrawalTypes,
    setAutoSettlement: setEstateAdminAutoSettlement,
    selectSlice: (state: RootState) =>
      state.estateAdminRevenueWithdrawalAccount,
  },
  energyProvider: {
    getAccounts: getEnergyProviderRevenueWithdrawalAccounts,
    getTypes: getEnergyProviderRevenueWithdrawalTypes,
    setAutoSettlement: setEnergyProviderAutoSettlement,
    selectSlice: (state: RootState) =>
      state.energyProviderRevenueWithdrawalAccount,
  },
  staff: {
    getAccounts: getStaffRevenueWithdrawalAccounts,
    getTypes: getStaffRevenueWithdrawalTypes,
    setAutoSettlement: setStaffAutoSettlement,
    selectSlice: (state: RootState) => state.staffRevenueWithdrawalAccount,
  },
} as const;

function isAutoSettlementOn(
  sliceValue: boolean | null | undefined,
  walletValue?: boolean | null,
): boolean {
  if (typeof sliceValue === "boolean") return sliceValue;
  return walletValue === true;
}

function AutoSettlementToggle({
  enabled,
  pending,
  onChange,
}: Readonly<{
  enabled: boolean;
  pending: boolean;
  onChange: (next: boolean) => void;
}>) {
  const reduceMotion = useReducedMotion();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-busy={pending}
      disabled={pending}
      onClick={() => onChange(!enabled)}
      className={cn(
        "relative inline-flex h-8 w-[52px] shrink-0 cursor-pointer items-center rounded-full p-0.5",
        "transition-[background-color,transform] duration-100 ease-out active:scale-[0.97]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-wait disabled:opacity-70",
        enabled ? "bg-emerald-600" : "bg-muted-foreground/25",
      )}
    >
      <motion.span
        layout
        className="block size-7 rounded-full bg-white shadow-sm"
        animate={{ x: enabled ? 20 : 0 }}
        transition={
          reduceMotion
            ? { duration: 0.15 }
            : { type: "spring", bounce: 0, duration: 0.35 }
        }
      />
      <span className="sr-only">
        {enabled ? "Disable auto-settlement" : "Enable auto-settlement"}
      </span>
    </button>
  );
}

function useRevenueWithdrawal(
  role: RevenueWithdrawalRole,
  options?: { enabled?: boolean },
) {
  const enabled = options?.enabled ?? true;
  const dispatch = useDispatch<AppDispatch>();
  const api = ROLE_API[role];

  const slice = useSelector(api.selectSlice);
  const accounts = slice?.accounts ?? [];
  const types = slice?.types ?? [];
  const autoSettlementEnabled = slice?.autoSettlementEnabled ?? null;
  const setAutoSettlementState = slice?.setAutoSettlementState ?? "idle";
  const getAccountsState = slice?.getAccountsState ?? "idle";
  const walletAutoSettlementEnabled = useSelector((state: RootState) => {
    if (role === "estateAdmin") {
      return state.estateAdminWallet?.wallet?.autoSettlementEnabled;
    }
    if (role === "staff") {
      return state.staffWallet?.wallet?.autoSettlementEnabled;
    }
    return undefined;
  });

  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [selectedType, setSelectedType] = useState<{
    value: string;
    label: string;
  } | null>(null);

  const accountByType = useMemo(() => {
    const map = new Map<string, (typeof accounts)[number]>();
    for (const account of accounts) {
      map.set(canonicalizeRevenueType(account.revenueType), account);
    }
    return map;
  }, [accounts]);

  const rows = useMemo(() => {
    const typeList =
      types.length > 0
        ? types
        : [
            { value: "service_charge", label: "Service Charge" },
            { value: "vending", label: "Vending" },
            { value: "bills", label: "Bills" },
            { value: "other", label: "Other" },
            { value: "default", label: "Default" },
          ];

    return typeList.map((type) => {
      const value = canonicalizeRevenueType(type.value);
      return {
        value,
        label: type.label,
        account: accountByType.get(value) ?? null,
      };
    });
  }, [types, accountByType]);

  const configuredCount = rows.filter((row) => row.account).length;
  const autoEnabled = isAutoSettlementOn(
    autoSettlementEnabled,
    walletAutoSettlementEnabled,
  );
  const toggling = setAutoSettlementState === "isLoading";
  const showLoading = !initialLoadDone && getAccountsState === "isLoading";

  const loadData = async () => {
    await Promise.all([
      dispatch(api.getTypes()),
      dispatch(api.getAccounts()),
    ]);
  };

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setInitialLoadDone(false);
    (async () => {
      try {
        await loadData();
      } finally {
        if (!cancelled) setInitialLoadDone(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, role, enabled]);

  const handleToggleAutoSettlement = async (next: boolean) => {
    try {
      await dispatch(api.setAutoSettlement(next)).unwrap();
      toast.success(
        next
          ? "Auto-settlement enabled. Funds settle after T+1."
          : "Auto-settlement disabled.",
      );
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message ||
          "Failed to update auto-settlement.",
      );
    }
  };

  return {
    dispatch,
    api,
    rows,
    configuredCount,
    autoEnabled,
    toggling,
    showLoading,
    selectedType,
    setSelectedType,
    handleToggleAutoSettlement,
  };
}

function AutoSettlementPanel({
  autoEnabled,
  toggling,
  onToggle,
  variant,
}: Readonly<{
  autoEnabled: boolean;
  toggling: boolean;
  onToggle: (next: boolean) => void;
  variant: "card" | "overview";
}>) {
  if (variant === "overview") {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-lg border border-[#CCCCCC]",
          "bg-linear-to-b from-slate-50/90 to-white",
          "px-4 py-4 sm:px-5",
        )}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Sparkles
                className="size-3.5 shrink-0 text-emerald-700"
                aria-hidden
              />
              <p className="text-sm font-medium text-foreground">
                Auto-settlement (<span className="text-emerald-700">Toggle to enable/disable auto-settlement</span>)
              </p>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {autoEnabled
                ? "On — Auto-settlement enabled. Earnings are sent to your bank automatically."
                : "Off — revenue stays in your wallet until you withdraw."}
            </p>
          </div>
          <AutoSettlementToggle
            enabled={autoEnabled}
            pending={toggling}
            onChange={onToggle}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-black/5",
        "bg-linear-to-b from-slate-50/90 to-white",
        "px-4 py-4 sm:px-5",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]",
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Sparkles
              className="size-3.5 shrink-0 text-emerald-700"
              aria-hidden
            />
            <p className="text-[15px] font-semibold tracking-tight text-foreground">
              Auto-settlement
            </p>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {autoEnabled
              ? "On — configured revenue settles to the matching bank account after T+1."
              : "Off — revenue stays in your wallet until you withdraw."}
          </p>
        </div>
        <AutoSettlementToggle
          enabled={autoEnabled}
          pending={toggling}
          onChange={onToggle}
        />
      </div>
    </div>
  );
}

function RevenueTypeDropdown({
  rows,
  configuredCount,
  showLoading,
  selectedValue,
  onSelectedValueChange,
  onConfigure,
}: Readonly<{
  rows: Array<{
    value: string;
    label: string;
    account: {
      accountName?: string;
      accountNumber: string;
    } | null;
  }>;
  configuredCount: number;
  showLoading: boolean;
  selectedValue: string;
  onSelectedValueChange: (value: string) => void;
  onConfigure: (type: { value: string; label: string }) => void;
}>) {
  const formatAccountNumber = (value: string) =>
    value.replace(/\s/g, "").replace(/(\d{4})(?=\d)/g, "$1 ");

  const selectedRow =
    rows.find((row) => row.value === selectedValue) ?? rows[0] ?? null;
  const options = rows.map((row) => ({
    value: row.value,
    label: `${row.label}${row.account ? " · Set" : " · Not set"}`,
  }));

  if (showLoading) {
    return (
      <div className="space-y-3" aria-busy aria-label="Loading settlement types">
        <div className="h-9 animate-pulse rounded-md bg-muted/60" />
        <div className="h-20 animate-pulse rounded-xl bg-muted/50" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No revenue account types available.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor="revenue-type-select" className="text-sm font-medium">
          Revenue type
        </Label>
        <p className="text-[11px] text-muted-foreground">
          {configuredCount}/{rows.length} configured
        </p>
      </div>

      <Select
        id="revenue-type-select"
        aria-label="Select revenue type"
        value={selectedValue || selectedRow?.value || ""}
        onChange={(e) => onSelectedValueChange(e.target.value)}
        options={options}
      />

      {selectedRow ? (
        <div className="rounded-xl border border-black/5 bg-slate-50/80 px-4 py-3">
          {selectedRow.account ? (
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                {selectedRow.account.accountName || "Settlement account"}
              </p>
              <p className="text-xs tabular-nums tracking-wide text-muted-foreground">
                {formatAccountNumber(selectedRow.account.accountNumber)}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No bank account set for {selectedRow.label} yet.
            </p>
          )}
        </div>
      ) : null}

      {selectedRow ? (
        <Button
          type="button"
          className="w-full cursor-pointer transition-transform duration-100 ease-out active:scale-[0.97]"
          onClick={() =>
            onConfigure({
              value: selectedRow.value,
              label: selectedRow.label,
            })
          }
        >
          {selectedRow.account
            ? `Update ${selectedRow.label} account`
            : `Set ${selectedRow.label} account`}
        </Button>
      ) : null}
    </div>
  );
}

export type RevenueWithdrawalAccountsCardProps = {
  role: RevenueWithdrawalRole;
  /** Optional className for the trigger button. */
  className?: string;
};

/** Button that opens a modal to manage revenue settlement bank accounts. */
export default function RevenueWithdrawalAccountsCard({
  role,
  className,
}: Readonly<RevenueWithdrawalAccountsCardProps>) {
  const [open, setOpen] = useState(false);
  const [dropdownType, setDropdownType] = useState("");
  const state = useRevenueWithdrawal(role, { enabled: open });

  useEffect(() => {
    if (!open) return;
    if (!dropdownType && state.rows[0]?.value) {
      setDropdownType(state.rows[0].value);
    }
  }, [open, dropdownType, state.rows]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className={cn(
          "cursor-pointer transition-transform duration-100 ease-out active:scale-[0.97]",
          className,
        )}
      >
        <Landmark className="size-4" aria-hidden />
        Manage revenue accounts
      </Button>

      <Modal
        visible={open}
        onClose={() => setOpen(false)}
        contentClassName="md:w-[520px] lg:w-[560px] xl:w-[560px]"
      >
        <Card className="w-full border-0 shadow-none">
          <CardHeader className="space-y-0 px-0 pb-3 pt-0">
            <div className="flex items-center gap-2">
              <Landmark
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <CardTitle className="text-lg font-semibold tracking-tight">
                Revenue settlement
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 px-0 pb-0 pt-1">
            <RevenueTypeDropdown
              rows={state.rows}
              configuredCount={state.configuredCount}
              showLoading={state.showLoading}
              selectedValue={dropdownType}
              onSelectedValueChange={setDropdownType}
              onConfigure={state.setSelectedType}
            />
          </CardContent>
        </Card>
      </Modal>

      <SetRevenueWithdrawalAccountModal
        role={role}
        visible={Boolean(state.selectedType)}
        revenueType={state.selectedType?.value ?? ""}
        revenueTypeLabel={state.selectedType?.label ?? "Revenue"}
        onClose={() => state.setSelectedType(null)}
        onSuccess={() => {
          state.dispatch(state.api.getAccounts());
        }}
      />
    </>
  );
}

export type RevenueWithdrawalOverviewSections = {
  autoSettlement: React.ReactNode;
  /** True when auto-settlement is on — manual Withdraw Funds should be hidden. */
  autoSettlementEnabled: boolean;
};

/** Overview-card auto-settlement panel only (revenue accounts stay in the separate card). */
export function RevenueWithdrawalOverviewProvider({
  role,
  children,
}: Readonly<{
  role: RevenueWithdrawalRole;
  children: (sections: RevenueWithdrawalOverviewSections) => React.ReactNode;
}>) {
  const dispatch = useDispatch<AppDispatch>();
  const api = ROLE_API[role];
  const slice = useSelector(api.selectSlice);
  const walletAutoSettlementEnabled = useSelector((state: RootState) => {
    if (role === "estateAdmin") {
      return state.estateAdminWallet?.wallet?.autoSettlementEnabled;
    }
    if (role === "staff") {
      return state.staffWallet?.wallet?.autoSettlementEnabled;
    }
    return undefined;
  });
  const autoEnabled = isAutoSettlementOn(
    slice?.autoSettlementEnabled,
    walletAutoSettlementEnabled,
  );
  const toggling = slice?.setAutoSettlementState === "isLoading";

  useEffect(() => {
    dispatch(api.getAccounts());
  }, [dispatch, api]);

  const handleToggleAutoSettlement = async (next: boolean) => {
    try {
      await dispatch(api.setAutoSettlement(next)).unwrap();
      toast.success(
        next
          ? "Auto-settlement enabled. Funds settle after T+1."
          : "Auto-settlement disabled.",
      );
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message ||
          "Failed to update auto-settlement.",
      );
    }
  };

  return (
    <>
      {children({
        autoSettlementEnabled: autoEnabled,
        autoSettlement: (
          <AutoSettlementPanel
            autoEnabled={autoEnabled}
            toggling={toggling}
            onToggle={handleToggleAutoSettlement}
            variant="overview"
          />
        ),
      })}
    </>
  );
}
