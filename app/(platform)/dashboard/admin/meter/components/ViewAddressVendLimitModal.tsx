"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import Modal from "@/components/modal/page";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Loader from "@/components/ui/Loader";
import { Select } from "@/components/ui/select";
import { getApiErrorMessage } from "@/lib/api-error";
import type { AppDispatch } from "@/redux/store";
import {
  getAddressVendLimits,
  type AddressVendLimitsData,
} from "@/redux/slice/admin/meter-mgt/meter-mgt";
import { useEstateAddressOptions } from "./use-estate-address-options";

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

function formatUnitCap(value: number | null | undefined) {
  if (value == null) return "Not set";
  return `${Number(value).toLocaleString()} kWh / address / month`;
}

export function ViewAddressVendLimitModal({ open, estateId, onClose }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const { options, loading: loadingAddresses } = useEstateAddressOptions(
    estateId,
    open,
  );
  const [addressId, setAddressId] = useState("");
  const [loading, setLoading] = useState(false);
  const [limits, setLimits] = useState<AddressVendLimitsData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (open) return;
    setAddressId("");
    setLimits(null);
    setErrorMessage(null);
  }, [open]);

  useEffect(() => {
    if (!open || !addressId) {
      setLimits(null);
      setErrorMessage(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setLimits(null);
        setErrorMessage(null);
        const res = await dispatch(getAddressVendLimits({ addressId })).unwrap();
        if (!cancelled) setLimits(res?.data ?? null);
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
  }, [addressId, dispatch, open]);

  const selectedAddress =
    options.find((option) => option.value === addressId)?.label || "—";

  return (
    <Modal visible={open} onClose={onClose} contentClassName="max-w-lg">
      <div className="space-y-5 pr-6">
        <div>
          <h2 className="font-heading text-lg font-bold text-foreground">
            Vend limit for address
          </h2>
          <p className="text-sm text-muted-foreground">
            Select an address to view the vend limit for that address.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="view-address-vend-limit">Address</Label>
          {loadingAddresses ? (
            <div className="py-6">
              <Loader label="Loading addresses..." />
            </div>
          ) : (
            <>
              <Select
                id="view-address-vend-limit"
                options={[
                  { value: "", label: "Select an address" },
                  ...options,
                ]}
                value={addressId}
                onChange={(event) => setAddressId(event.target.value)}
                disabled={options.length === 0}
              />
              {options.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No addresses are configured for this estate.
                </p>
              ) : null}
            </>
          )}
        </div>

        {addressId && loading ? (
          <div className="py-10">
            <Loader label="Loading vend limits..." />
          </div>
        ) : null}

        {addressId && !loading && limits ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailRow label="Address" value={selectedAddress} />
            <DetailRow
              label="Status"
              value={
                limits.isConfigured
                  ? "Address limits configured"
                  : "Using estate or default limits"
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
              value={formatUnitCap(limits.monthlyVendUnitCap)}
            />
            {limits.isConfigured === false && limits.defaults ? (
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
                  value={formatUnitCap(limits.defaults.monthlyVendUnitCap)}
                />
              </>
            ) : null}
          </div>
        ) : null}

        {addressId && !loading && !limits ? (
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
