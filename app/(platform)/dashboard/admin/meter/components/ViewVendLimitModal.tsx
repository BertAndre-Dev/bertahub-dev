"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import Modal from "@/components/modal/page";
import { Button } from "@/components/ui/button";
import Loader from "@/components/ui/Loader";
import { getApiErrorMessage } from "@/lib/api-error";
import type { AppDispatch } from "@/redux/store";
import {
  getEstateVendLimits,
  type EstateVendLimitsData,
} from "@/redux/slice/admin/meter-mgt/meter-mgt";

type Props = Readonly<{
  open: boolean;
  estateId: string;
  onClose: () => void;
}>;

const formatNaira = (value: number) =>
  `₦${Number(value ?? 0).toLocaleString()}`;

function DetailRow({
  label,
  value,
}: Readonly<{ label: string; value: ReactNode }>) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-sm mt-0.5 font-medium">{value}</p>
    </div>
  );
}

export function ViewVendLimitModal({ open, estateId, onClose }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const [loading, setLoading] = useState(false);
  const [limits, setLimits] = useState<EstateVendLimitsData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !estateId) return;

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setLimits(null);
        setErrorMessage(null);
        const res = await dispatch(getEstateVendLimits({ estateId })).unwrap();
        if (!cancelled) {
          setLimits(res?.data ?? null);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const message = getApiErrorMessage(err) ?? null;
          setErrorMessage(message);
          if (message) toast.error(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, estateId, dispatch]);

  return (
    <Modal
      visible={open}
      onClose={onClose}
      contentClassName="max-w-lg"
    >
      <div className="space-y-5 pr-6">
        <div>
          <h2 className="font-heading text-lg font-bold text-foreground">
            Vend limits
          </h2>
        </div>

        {loading ? (
          <div className="py-10">
            <Loader label="Loading vend limits..." />
          </div>
        ) : null}

        {!loading && limits ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailRow label="Estate" value={limits.estateName || "—"} />
            <DetailRow
              label="Status"
              value={
                limits.isConfigured
                  ? "Custom limits configured"
                  : "Using system defaults"
              }
            />
            <DetailRow
              label="Minimum vend amount"
              value={formatNaira(limits.minVendAmount)}
            />
            <DetailRow
              label="Maximum vend amount"
              value={formatNaira(limits.maxVendAmount)}
            />
            <DetailRow
              label="Monthly unit cap"
              value={
                limits.monthlyVendUnitCap == null
                  ? "Disabled"
                  : `${Number(limits.monthlyVendUnitCap).toLocaleString()} kWh / meter / month`
              }
            />
            {!limits.isConfigured && limits.defaults ? (
              <>
                <DetailRow
                  label="Default minimum"
                  value={formatNaira(limits.defaults.minVendAmount)}
                />
                <DetailRow
                  label="Default maximum"
                  value={formatNaira(limits.defaults.maxVendAmount)}
                />
                <DetailRow
                  label="Default monthly unit cap"
                  value={
                    limits.defaults.monthlyVendUnitCap == null
                      ? "Disabled"
                      : `${Number(limits.defaults.monthlyVendUnitCap).toLocaleString()} kWh / meter / month`
                  }
                />
              </>
            ) : null}
          </div>
        ) : null}

        {!loading && !limits ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            {errorMessage}
          </p>
        ) : null}

        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="cursor-pointer"
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
