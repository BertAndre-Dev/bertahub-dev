"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import Modal from "@/components/modal/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Loader from "@/components/ui/Loader";
import { Select } from "@/components/ui/select";
import { getApiErrorMessage } from "@/lib/api-error";
import type { AppDispatch } from "@/redux/store";
import {
  getAddressVendLimits,
  setAddressVendLimits,
} from "@/redux/slice/admin/meter-mgt/meter-mgt";
import { useEstateAddressOptions } from "./use-estate-address-options";

type Props = Readonly<{
  open: boolean;
  estateId: string;
  onClose: () => void;
  onSuccess?: () => void;
}>;

export function SetAddressVendLimitModal({
  open,
  estateId,
  onClose,
  onSuccess,
}: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const { options, loading: loadingAddresses } = useEstateAddressOptions(
    estateId,
    open,
  );
  const [addressId, setAddressId] = useState("");
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [minVendAmount, setMinVendAmount] = useState("");
  const [maxVendAmount, setMaxVendAmount] = useState("");
  const [monthlyVendUnitCap, setMonthlyVendUnitCap] = useState("");
  const [defaultMax, setDefaultMax] = useState<number | null>(null);

  useEffect(() => {
    if (open) return;
    setAddressId("");
    setMinVendAmount("");
    setMaxVendAmount("");
    setMonthlyVendUnitCap("");
    setDefaultMax(null);
  }, [open]);

  useEffect(() => {
    if (!open || !addressId) return;

    let cancelled = false;
    (async () => {
      try {
        setLoadingInitial(true);
        setDefaultMax(null);
        setMonthlyVendUnitCap("");
        const res = await dispatch(getAddressVendLimits({ addressId })).unwrap();
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
  }, [addressId, dispatch, open]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!addressId) {
      toast.error("Please select an address.");
      return;
    }

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
      toast.error(
        "Enter a valid monthly unit cap, or leave it blank to use the estate cap.",
      );
      return;
    }

    try {
      setSubmitting(true);
      const res = await dispatch(
        setAddressVendLimits({
          addressId,
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
            Set / update vend limit for address
          </h2>
          <p className="text-sm text-muted-foreground">
            Select an address to set or update the vend limit for that address.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="set-address-vend-limit">Address</Label>
          {loadingAddresses ? (
            <div className="py-6">
              <Loader label="Loading addresses..." />
            </div>
          ) : (
            <>
              <Select
                id="set-address-vend-limit"
                options={[
                  { value: "", label: "Select an address" },
                  ...options,
                ]}
                value={addressId}
                onChange={(event) => setAddressId(event.target.value)}
                disabled={submitting || options.length === 0}
              />
              {options.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No addresses are configured for this estate.
                </p>
              ) : null}
            </>
          )}
        </div>

        {addressId && loadingInitial ? (
          <div className="py-10">
            <Loader label="Loading current limits..." />
          </div>
        ) : null}

        {addressId && !loadingInitial ? (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="address-min-vend-amount">
                Minimum vend amount (₦)
              </Label>
              <Input
                id="address-min-vend-amount"
                type="number"
                min={1}
                step={1}
                value={minVendAmount}
                onChange={(event) => setMinVendAmount(event.target.value)}
                disabled={submitting}
                placeholder="e.g. 500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address-max-vend-amount">
                Maximum vend amount (₦)
              </Label>
              <Input
                id="address-max-vend-amount"
                type="number"
                min={1}
                max={defaultMax ?? undefined}
                step={1}
                value={maxVendAmount}
                onChange={(event) => setMaxVendAmount(event.target.value)}
                disabled={submitting}
                placeholder={
                  defaultMax != null
                    ? `e.g. ${defaultMax.toLocaleString()}`
                    : "e.g. 100000"
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
              <Label htmlFor="address-monthly-vend-unit-cap">
                Monthly unit cap (kWh)
              </Label>
              <Input
                id="address-monthly-vend-unit-cap"
                type="number"
                min={1}
                step="any"
                value={monthlyVendUnitCap}
                onChange={(event) => setMonthlyVendUnitCap(event.target.value)}
                disabled={submitting}
                placeholder="e.g. 500"
              />
              <p className="text-xs text-muted-foreground">
                Optional. kWh per address per calendar month, across its
                meters. Leave blank to clear the address cap.
              </p>
            </div>
          </>
        ) : null}

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
            disabled={
              loadingAddresses || loadingInitial || submitting || !addressId
            }
            className="cursor-pointer"
          >
            {submitting ? "Saving..." : "Save limits"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
