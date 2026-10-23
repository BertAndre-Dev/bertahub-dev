"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import Loader from "@/components/ui/Loader";
import { formatDateTime } from "@/lib/format-date";
import type { AppDispatch, RootState } from "@/redux/store";
import {
  deactivateRate,
  getRates,
  type PlatformRate,
  type RateFeeType,
  type RateSplit,
} from "@/redux/slice/super-admin/rates/rates";
import { clearRatesState } from "@/redux/slice/super-admin/rates/rates-slice";
import { SetEstateRateModal } from "./SetEstateRateModal";
import { getApiErrorMessage } from "@/lib/api-error";

const FEE_TYPE_OPTIONS: { value: RateFeeType; label: string }[] = [
  { value: "VENDING", label: "Vending" },
  { value: "BILL_PAYMENT", label: "Bill payment" },
];

type Props = Readonly<{
  estateId: string;
  estateName?: string;
}>;

function DetailRow({
  label,
  value,
}: Readonly<{ label: string; value: ReactNode }>) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="text-sm mt-0.5 wrap-break-word">{value}</div>
    </div>
  );
}

function formatFeeType(feeType?: string | null) {
  if (feeType === "VENDING") return "Vending";
  if (feeType === "BILL_PAYMENT") return "Bill payment";
  return feeType?.trim() || "—";
}

function formatScope(scope?: string | null) {
  if (!scope) return "—";
  return scope.charAt(0) + scope.slice(1).toLowerCase();
}

function formatSplits(splits?: RateSplit[] | null) {
  if (!Array.isArray(splits) || splits.length === 0) return null;
  return splits
    .map((split) => {
      const label = split.label?.trim() || "Split";
      const percent =
        split.percent != null && !Number.isNaN(Number(split.percent))
          ? `${Number(split.percent)}%`
          : "—";
      const account = split.accountNumber?.trim() || "—";
      const bank = split.bankCode?.trim() ? ` · bank ${split.bankCode}` : "";
      return `${label}: ${percent} · ${account}${bank}`;
    })
    .join("; ");
}

function formatRateValue(rate: PlatformRate | null | undefined) {
  if (!rate) return "—";

  const splitsLabel = formatSplits(rate.splits);
  if (splitsLabel) return splitsLabel;

  const percent =
    rate.percentage ?? rate.feePercent ?? rate.percent ?? rate.rate;
  const fixed = rate.fixedAmount ?? rate.feeAmount ?? rate.amount;

  const parts: string[] = [];
  if (percent != null && !Number.isNaN(Number(percent))) {
    parts.push(`${Number(percent)}%`);
  }
  if (fixed != null && !Number.isNaN(Number(fixed))) {
    const currency = rate.currency ? `${rate.currency} ` : "";
    parts.push(`${currency}${Number(fixed).toLocaleString()}`);
  }

  if (parts.length === 0) return "—";
  return parts.join(" + ");
}

function ActiveBadge({ isActive }: Readonly<{ isActive?: boolean }>) {
  if (isActive === undefined) return null;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
        isActive === false
          ? "bg-red-100 text-red-700"
          : "bg-green-100 text-green-700"
      }`}
    >
      {isActive === false ? "Inactive" : "Active"}
    </span>
  );
}

function EffectiveRateCard({
  rate,
  estateName,
  onDeactivate,
  deactivating,
}: Readonly<{
  rate: PlatformRate | null;
  estateName?: string;
  onDeactivate?: (id: string) => void;
  deactivating?: boolean;
}>) {
  if (!rate) {
    return (
      <div className="rounded-md border border-dashed p-4">
        <p className="text-sm font-medium mb-1">Effective rate</p>
        {estateName ? (
          <p className="text-sm text-muted-foreground mb-1">{estateName}</p>
        ) : null}
        <p className="text-sm text-muted-foreground">No rate found.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Effective rate</p>
          <p className="text-lg font-semibold mt-0.5">
            {formatRateValue(rate)}
          </p>
        </div>
        <ActiveBadge isActive={rate.isActive} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {estateName ? <DetailRow label="Estate" value={estateName} /> : null}
        <DetailRow label="Fee type" value={formatFeeType(rate.feeType)} />
        <DetailRow label="Scope" value={formatScope(rate.scope)} />
        <DetailRow
          label="Updated at"
          value={formatDateTime(rate.updatedAt ?? rate.createdAt)}
        />
        {rate.notes ? <DetailRow label="Notes" value={rate.notes} /> : null}
      </div>

      {rate.id && onDeactivate && rate.isActive !== false ? (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="cursor-pointer text-red-600 hover:text-red-700"
            disabled={deactivating}
            onClick={() => onDeactivate(rate.id!)}
          >
            Deactivate
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function EstateRatesTab({ estateId, estateName }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const [feeType, setFeeType] = useState<RateFeeType>("VENDING");
  const [setRateOpen, setSetRateOpen] = useState(false);

  const { rates, getRatesStatus, deactivateRateStatus, error } = useSelector(
    (state: RootState) => state.superAdminRates,
  );

  const loading = getRatesStatus === "isLoading";
  const deactivating = deactivateRateStatus === "isLoading";
  const effectiveRate =
    rates.find((rate) => rate.isActive !== false) ?? rates[0] ?? null;

  const refreshRates = async (nextFeeType: RateFeeType = feeType) => {
    await dispatch(
      getRates({ scope: "ESTATE", estateId, feeType: nextFeeType }),
    ).unwrap();
  };

  useEffect(() => {
    if (!estateId) return;

    dispatch(clearRatesState());
    dispatch(getRates({ scope: "ESTATE", estateId, feeType })).catch(() => {});
  }, [dispatch, estateId, feeType]);

  useEffect(() => {
    return () => {
      dispatch(clearRatesState());
    };
  }, [dispatch]);

  const handleDeactivate = async (id: string) => {
    try {
      await dispatch(deactivateRate(id)).unwrap();
      toast.success("Rate deactivated.");
      await refreshRates();
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    }
  };

  return (
    <div className="space-y-4 relative min-h-[160px]">
      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="flex-1">
          <label
            htmlFor="estate-rate-fee-type"
            className="text-sm text-muted-foreground"
          >
            Fee type
          </label>
          <select
            id="estate-rate-fee-type"
            value={feeType}
            onChange={(e) => setFeeType(e.target.value as RateFeeType)}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          >
            {FEE_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <Button
          type="button"
          className="cursor-pointer shrink-0"
          onClick={() => setSetRateOpen(true)}
        >
          Set rate
        </Button>
      </div>

      {loading ? <Loader label="Loading rates..." /> : null}

      {!loading && error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : null}

      {!loading ? (
        <EffectiveRateCard
          rate={effectiveRate}
          estateName={estateName}
          onDeactivate={handleDeactivate}
          deactivating={deactivating}
        />
      ) : null}

      <SetEstateRateModal
        open={setRateOpen}
        estateId={estateId}
        initialFeeType={feeType}
        onClose={() => {
          setSetRateOpen(false);
          void refreshRates().catch(() => {});
        }}
        onSuccess={(savedFeeType) => {
          if (savedFeeType !== feeType) {
            setFeeType(savedFeeType);
            return;
          }
          void refreshRates(savedFeeType).catch(() => {});
        }}
      />
    </div>
  );
}
