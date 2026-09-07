"use client";

import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Label } from "@/components/ui/label";
import type { AppDispatch, RootState } from "@/redux/store";
import { getPaymentGateways } from "@/redux/slice/resident/payment-mgt/payment-mgt";
import { isPending, isSettled } from "@/lib/async-status";

interface PaymentGatewaySelectProps {
  value: string;
  onChange: (gatewayType: string) => void;
  id?: string;
  required?: boolean;
  disabled?: boolean;
}

export default function PaymentGatewaySelect({
  value,
  onChange,
  id = "payment-gateway",
  required = true,
  disabled = false,
}: PaymentGatewaySelectProps) {
  const dispatch = useDispatch<AppDispatch>();
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const { gateways, defaultGateway, getPaymentGatewaysState } = useSelector(
    (state: RootState) => state.residentPaymentMgt,
  );

  const loading = isPending(getPaymentGatewaysState);
  const emptyGateways =
    isSettled(getPaymentGatewaysState) && gateways.length === 0;

  useEffect(() => {
    dispatch(getPaymentGateways());
  }, [dispatch]);

  useEffect(() => {
    if (gateways.length === 0) return;
    const preferred =
      (defaultGateway && gateways.find((g) => g.id === defaultGateway)?.id) ||
      gateways[0]?.id ||
      "";
    if (!preferred) return;
    if (!value || !gateways.some((g) => g.id === value)) {
      onChangeRef.current(preferred);
    }
  }, [gateways, defaultGateway, value]);

  return (
    <div>
      <Label htmlFor={id}>
        Payment Gateway {required && <span className="text-destructive">*</span>}
      </Label>
      <select
        id={id}
        title="Payment Gateway"
        className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || loading || emptyGateways}
        required={required}
      >
        <option value="">
          {loading
            ? "Loading gateways..."
            : emptyGateways
              ? "No gateways available"
              : "Select gateway"}
        </option>
        {gateways.map((gateway) => (
          <option key={gateway.id} value={gateway.id}>
            {gateway.name}
          </option>
        ))}
      </select>
    </div>
  );
}
