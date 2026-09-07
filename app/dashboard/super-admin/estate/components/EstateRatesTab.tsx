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
  getEffectiveRate,
  getRates,
  type EffectiveRateData,
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
  data,
}: Readonly<{ data: EffectiveRateData | null }>) {
  if (!data?.resolved) {
    return (
      <div className="rounded-md border border-dashed p-4">
        <p className="text-sm font-medium mb-1">Effective rate</p>
        <p className="text-sm text-muted-foreground">No rate found.</p>
      </div>
    );
  }

  const { estate, feeType, resolved } = data;
  const splitsLabel = formatSplits(resolved.splits) ?? "—";

  return (
    <div className="rounded-md border p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Effective rate</p>
          <p className="text-lg font-semibold mt-0.5">{splitsLabel}</p>
        </div>
        <ActiveBadge isActive={resolved.isActive ?? estate?.isActive} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <DetailRow
          label="Fee type"
          value={formatFeeType(feeType ?? resolved.feeType)}
        />
        <DetailRow label="Resolved scope" value={formatScope(resolved.scope)} />
        <DetailRow
          label="Source"
          value={formatScope(resolved.source) || "—"}
        />
        <DetailRow label="Config ID" value={resolved.configId || "—"} />
        {estate?.name ? (
          <DetailRow label="Estate" value={estate.name} />
        ) : null}
        {resolved.notes ? (
          <DetailRow label="Notes" value={resolved.notes} />
        ) : null}
      </div>
    </div>
  );
}

function RateCard({
  title,
  rate,
  onDeactivate,
  deactivating,
}: Readonly<{
  title: string;
  rate: PlatformRate | null;
  onDeactivate?: (id: string) => void;
  deactivating?: boolean;
}>) {
  if (!rate) {
    return (
      <div className="rounded-md border border-dashed p-4">
        <p className="text-sm font-medium mb-1">{title}</p>
        <p className="text-sm text-muted-foreground">No rate found.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-lg font-semibold mt-0.5">
            {formatRateValue(rate)}
          </p>
        </div>
        <ActiveBadge isActive={rate.isActive} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <DetailRow label="Fee type" value={formatFeeType(rate.feeType)} />
        <DetailRow label="Scope" value={formatScope(rate.scope)} />
        <DetailRow
          label="Calculation"
          value={rate.calculationType?.toString() || "—"}
        />
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
            className="cursor-pointer text-red-600"
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

export function EstateRatesTab({ estateId }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const [feeType, setFeeType] = useState<RateFeeType>("VENDING");
  const [setRateOpen, setSetRateOpen] = useState(false);

  const {
    rates,
    getRatesStatus,
    effectiveRate,
    getEffectiveRateStatus,
    deactivateRateStatus,
    error,
  } = useSelector((state: RootState) => state.superAdminRates);

  const loading =
    getRatesStatus === "isLoading" || getEffectiveRateStatus === "isLoading";
  const deactivating = deactivateRateStatus === "isLoading";

  const refreshRates = async (nextFeeType: RateFeeType = feeType) => {
    await Promise.all([
      dispatch(
        getRates({ scope: "ESTATE", estateId, feeType: nextFeeType }),
      ).unwrap(),
      dispatch(
        getEffectiveRate({ estateId, feeType: nextFeeType }),
      ).unwrap(),
    ]);
  };

  useEffect(() => {
    if (!estateId) return;

    dispatch(clearRatesState());
    dispatch(getRates({ scope: "ESTATE", estateId, feeType })).catch(() => {});
    dispatch(getEffectiveRate({ estateId, feeType })).catch(() => {});
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
        <div className="space-y-4">
          <EffectiveRateCard data={effectiveRate} />

          <div>
            <p className="text-sm font-medium mb-2">
              Estate rate configs ({rates.length})
            </p>
            {rates.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No estate-scoped rates for this fee type.
              </p>
            ) : (
              <div className="space-y-3">
                {rates.map((rate, index) => (
                  <RateCard
                    key={rate.id ?? `${rate.feeType}-${index}`}
                    title={`Config ${index + 1}`}
                    rate={rate}
                    onDeactivate={handleDeactivate}
                    deactivating={deactivating}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
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
