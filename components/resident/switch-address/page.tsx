"use client";

import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { formatAddressLabel, type AddressOption } from "@/lib/address";

export interface SwitchAddressProps {
  /** List of addresses (e.g. from normalizeAddresses(me.data)) */
  readonly addresses: AddressOption[];
  /** Currently selected address ID */
  readonly value: string | null;
  /** Called when user selects a different address */
  readonly onChange: (addressId: string) => void;
  /** Label for the select. Default "Switch address" */
  readonly label?: string;
  /** Optional class for the card wrapper */
  readonly className?: string;
  /** Layout direction for label + select. Default "row" */
  readonly direction?: "row" | "col";
}

/**
 * Reusable address switcher for residents with multiple addresses (e.g. owner).
 * Renders nothing when addresses.length <= 1.
 */
export default function SwitchAddress({
  addresses,
  value,
  onChange,
  label = "Switch address",
  className,
  direction = "row",
}: SwitchAddressProps) {
  if (addresses.length <= 1) return null;

  const options = addresses.map((addr) => ({
    value: addr.id,
    label: formatAddressLabel(addr),
  }));

  return (
    <Card className={className ?? "p-4"}>
      <div
        className={
          direction === "col"
            ? "flex flex-col gap-2"
            : "flex flex-row items-center justify-between"
        }
      >
        {label ? (
          <Label
            htmlFor="switch-address-select"
            className="text-sm font-medium shrink-0"
          >
            {label}
          </Label>
        ) : null}
        <Select
          id="switch-address-select"
          value={value ?? ""}
          onChange={(e) => {
            const id = e.target.value;
            if (id) onChange(id);
          }}
          options={options}
          className={direction === "col" ? "w-full cursor-pointer" : "max-w-xs cursor-pointer"}
        />
      </div>
    </Card>
  );
}
