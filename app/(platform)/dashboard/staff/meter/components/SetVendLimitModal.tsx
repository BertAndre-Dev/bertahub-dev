"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import Modal from "@/components/modal/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Loader from "@/components/ui/Loader";
import { getApiErrorMessage } from "@/lib/api-error";
import type { AppDispatch } from "@/redux/store";
import {
  getEstateVendLimits,
  setEstateVendLimits,
} from "@/redux/slice/staff/meter-mgt/meter-mgt";

type Props = Readonly<{
  open: boolean;
  estateId: string;
  onClose: () => void;
  onSuccess?: () => void;
}>;

export function SetVendLimitModal({
  open,
  estateId,
  onClose,
  onSuccess,
}: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [minVendAmount, setMinVendAmount] = useState("");
  const [maxVendAmount, setMaxVendAmount] = useState("");
  const [monthlyVendUnitCap, setMonthlyVendUnitCap] = useState("");
  const [defaultMax, setDefaultMax] = useState<number | null>(null);

  useEffect(() => {
    if (!open || !estateId) return;

    let cancelled = false;
    (async () => {
      try {
        setLoadingInitial(true);
        setDefaultMax(null);
        setMonthlyVendUnitCap("");
        const res = await dispatch(getEstateVendLimits({ estateId })).unwrap();
        if (cancelled) return;
        const data = res?.data;
        if (data) {
          setMinVendAmount(String(data.minVendAmount ?? ""));
          setMaxVendAmount(String(data.maxVendAmount ?? ""));
          setMonthlyVendUnitCap(
            data.monthlyVendUnitCap == null
              ? ""
              : String(data.monthlyVendUnitCap),
          );
          const apiMax = data.defaults?.maxVendAmount;
          setDefaultMax(
            typeof apiMax === "number" && Number.isFinite(apiMax)
              ? apiMax
              : null,
          );
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const message = getApiErrorMessage(err);
          if (message) toast.error(message);
        }
      } finally {
        if (!cancelled) setLoadingInitial(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, estateId, dispatch]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const min = Number(minVendAmount);
    const max = Number(maxVendAmount);
    const capInput = monthlyVendUnitCap.trim();
    const cap = capInput === "" ? null : Number(capInput);

    if (!Number.isFinite(min) || min <= 0) {
      toast.error("Enter a valid minimum vend amount.");
      return;
    }
    if (!Number.isFinite(max) || max <= 0) {
      toast.error("Enter a valid maximum vend amount.");
      return;
    }
    if (max < min) {
      toast.error("Maximum vend amount cannot be less than the minimum.");
      return;
    }
    if (cap != null && (!Number.isFinite(cap) || cap <= 0)) {
      toast.error("Enter a valid monthly unit cap, or leave it blank to disable.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await dispatch(
        setEstateVendLimits({
          estateId,
          minVendAmount: min,
          maxVendAmount: max,
          monthlyVendUnitCap: cap,
        }),
      ).unwrap();
      if (res?.message) toast.success(res.message);
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={open} onClose={onClose} contentClassName="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-5 pr-6">
        <div>
          <h2 className="font-heading text-lg font-bold text-foreground">
            Set / update vend limits
          </h2>
        </div>

        {loadingInitial ? (
          <div className="py-10">
            <Loader label="Loading current limits..." />
          </div>
        ) : (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="min-vend-amount">Minimum vend amount (₦)</Label>
              <Input
                id="min-vend-amount"
                type="number"
                min={1}
                step={1}
                value={minVendAmount}
                onChange={(e) => setMinVendAmount(e.target.value)}
                disabled={submitting}
                placeholder="e.g. 500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="max-vend-amount">Maximum vend amount (₦)</Label>
              <Input
                id="max-vend-amount"
                type="number"
                min={1}
                max={defaultMax ?? undefined}
                step={1}
                value={maxVendAmount}
                onChange={(e) => setMaxVendAmount(e.target.value)}
                disabled={submitting}
                placeholder={
                  defaultMax != null
                    ? `e.g. ${defaultMax.toLocaleString()}`
                    : "Enter maximum amount"
                }
                required
              />
              {defaultMax != null ? (
                <p className="text-xs text-muted-foreground">
                  Maximum cannot exceed ₦{defaultMax.toLocaleString()}.
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="monthly-vend-unit-cap">
                Monthly unit cap (kWh)
              </Label>
              <Input
                id="monthly-vend-unit-cap"
                type="number"
                min={1}
                step="any"
                value={monthlyVendUnitCap}
                onChange={(e) => setMonthlyVendUnitCap(e.target.value)}
                disabled={submitting}
                placeholder="e.g. 500"
              />
              <p className="text-xs text-muted-foreground">
                Optional. kWh per meter per calendar month. Leave blank to
                disable the cap.
              </p>
            </div>
          </>
        )}

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={submitting}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loadingInitial || submitting}
            className="cursor-pointer"
          >
            {submitting ? "Saving..." : "Save limits"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
