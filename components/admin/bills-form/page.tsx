"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import {
  billFrequencyOptions,
  coerceFrequencyForServiceCharge,
  getBill,
  normalizeBillFrequency,
  type BillFrequency,
} from "@/redux/slice/admin/bills-mgt/bills";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  formatAmountInput,
  parseFormattedNumber,
} from "@/lib/format-number";
import {
  AccrueInterestFields,
  toInterestStartDate,
} from "@/components/admin/bills-form/accrue-interest-fields";
import { cn } from "@/lib/utils";
import { canUseBillInterest } from "@/lib/user-modules";
import { selectEstateModules } from "@/redux/slice/auth-mgt/auth-mgt-slice";

/** Form state: yearlyAmount can be string (empty input) or number */
interface BillFormState {
  estateId: string;
  name: string;
  description: string;
  yearlyAmount: number | string;
  frequency: BillFrequency;
  isServiceCharge: boolean;
  compulsory: boolean;
  accrueInterest: boolean;
  interestRatePercent: string;
  interestStartsAt: string;
  id?: string;
}

/** Payload passed to onSubmit: yearlyAmount is always number */
export interface BillSubmitData {
  estateId: string;
  name: string;
  description: string;
  yearlyAmount: number;
  frequency: BillFrequency;
  isServiceCharge?: boolean;
  compulsory?: boolean;
  accrueInterest?: boolean;
  interestRatePercent?: number;
  interestStartsAt?: string;
  id?: string;
}

interface BillsFormProps {
  estateId: string;
  initialData?:
    | (Partial<Omit<BillSubmitData, "frequency">> & {
        frequency?: string;
        amount?: number;
      })
    | null;
  onSubmit: (data: BillSubmitData) => void | Promise<void>;
}

function amountFromBill(data?: {
  yearlyAmount?: number;
  amount?: number;
} | null) {
  if (data?.amount != null) return data.amount;
  if (data?.yearlyAmount != null) return data.yearlyAmount;
  return null;
}

export default function BillsForm({ estateId, initialData, onSubmit }: BillsFormProps) {
  const seededAmount = amountFromBill(initialData);
  const authUser = useSelector((state: RootState) => state.auth.user);
  const estateModules = useSelector(selectEstateModules);
  const canAccrueInterest = canUseBillInterest(authUser, estateModules);
  const [formData, setFormData] = useState<BillFormState>({
    estateId,
    id: initialData?.id,
    name: initialData?.name ?? "",
    description: initialData?.description ?? "",
    yearlyAmount:
      seededAmount != null ? formatAmountInput(String(seededAmount)) : "",
    frequency: coerceFrequencyForServiceCharge(
      normalizeBillFrequency(initialData?.frequency, "yearly"),
      Boolean(initialData?.isServiceCharge) ||
        initialData?.name?.trim().toLowerCase() === "service charge",
    ),
    isServiceCharge: Boolean(initialData?.isServiceCharge),
    compulsory: Boolean(initialData?.compulsory),
    accrueInterest: Boolean(initialData?.accrueInterest),
    interestRatePercent:
      initialData?.interestRatePercent != null
        ? String(initialData.interestRatePercent)
        : "",
    interestStartsAt: toInterestStartDate(initialData?.interestStartsAt),
  });
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch<AppDispatch>();

  // Fetch bill if editing
  useEffect(() => {
    const fetchExistingBill = async () => {
      if (!initialData?.id) return;

      try {
        setLoading(true);
        const res = await dispatch(getBill(initialData.id)).unwrap();
        const fetchData = res?.data;

        if (fetchData) {
          setFormData({
            estateId: estateId,
            id: fetchData.id,
            name: fetchData.name || "",
            description: fetchData.description || "",
            yearlyAmount:
              fetchData.amount != null || fetchData.yearlyAmount != null
                ? formatAmountInput(
                    String(fetchData.amount ?? fetchData.yearlyAmount),
                  )
                : "",
            frequency: coerceFrequencyForServiceCharge(
              normalizeBillFrequency(fetchData.frequency, "yearly"),
              Boolean(fetchData.isServiceCharge) ||
                String(fetchData.name ?? "").trim().toLowerCase() ===
                  "service charge",
            ),
            isServiceCharge: Boolean(fetchData.isServiceCharge),
            compulsory: Boolean(fetchData.compulsory),
            accrueInterest: Boolean(fetchData.accrueInterest),
            interestRatePercent:
              fetchData.interestRatePercent != null
                ? String(fetchData.interestRatePercent)
                : "",
            interestStartsAt: toInterestStartDate(fetchData.interestStartsAt),
          });
        }
      } catch (err: unknown) {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchExistingBill();
  }, [dispatch, estateId, initialData]);

  const handleChange = (
    field: keyof BillFormState,
    value: string | number | boolean,
  ) => {
    setFormData((prev) => {
      if (field === "isServiceCharge" || field === "name") {
        const nextName = field === "name" ? String(value) : prev.name;
        const nextFlag =
          field === "isServiceCharge" ? Boolean(value) : prev.isServiceCharge;
        return {
          ...prev,
          name: nextName,
          isServiceCharge: nextFlag,
          frequency: coerceFrequencyForServiceCharge(
            prev.frequency,
            nextFlag || nextName.trim().toLowerCase() === "service charge",
          ),
        };
      }
      return { ...prev, [field]: value };
    });
  };

  const isServiceChargeBill =
    formData.isServiceCharge ||
    formData.name.trim().toLowerCase() === "service charge";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const interestRate = formData.accrueInterest
      ? Number(formData.interestRatePercent)
      : 0;
    if (
      canAccrueInterest &&
      formData.accrueInterest &&
      (!Number.isFinite(interestRate) || interestRate < 0)
    ) {
      toast.error("Please enter a valid interest rate.");
      return;
    }
    if (
      canAccrueInterest &&
      formData.accrueInterest &&
      !isServiceChargeBill &&
      !formData.interestStartsAt
    ) {
      toast.error("Please select when interest should start.");
      return;
    }
    const payload: BillSubmitData = {
      estateId: formData.estateId,
      name: formData.name,
      description: formData.description,
      yearlyAmount: parseFormattedNumber(formData.yearlyAmount),
      frequency: coerceFrequencyForServiceCharge(
        formData.frequency,
        isServiceChargeBill,
      ),
      isServiceCharge: formData.isServiceCharge,
      compulsory: isServiceChargeBill ? false : formData.compulsory,
      ...(canAccrueInterest
        ? {
            accrueInterest: formData.accrueInterest,
            interestRatePercent: interestRate,
            interestStartsAt:
              formData.accrueInterest && !isServiceChargeBill
                ? formData.interestStartsAt
                : undefined,
          }
        : {}),
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardHeader className="px-0 md:px-0">
        <CardTitle className="text-lg pb-2 pt-2 font-semibold">
          {initialData?.id ? "Update Estate Bill" : "Create Estate Bill"}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 px-0 md:px-0">
        {loading ? (
          <p className="text-gray-500 italic">Loading...</p>
        ) : (
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />
            </div>

            <div>
              <Label>Description</Label>
              <Input
                type="text"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                required
              />
            </div>

            {canAccrueInterest ? (
              <AccrueInterestFields
                idPrefix="estate-bill"
                accrueInterest={formData.accrueInterest}
                interestRatePercent={formData.interestRatePercent}
                interestStartsAt={formData.interestStartsAt}
                hideInterestStartsAt={isServiceChargeBill}
                onAccrueInterestChange={(value) =>
                  handleChange("accrueInterest", value)
                }
                onInterestRateChange={(value) =>
                  handleChange("interestRatePercent", value)
                }
                onInterestStartsAtChange={(value) =>
                  handleChange("interestStartsAt", value)
                }
              />
            ) : null}

            <div>
              <Label htmlFor="estate-bill-amount">Amount (₦)</Label>
              <Input
                id="estate-bill-amount"
                type="text"
                inputMode="numeric"
                value={formData.yearlyAmount}
                onChange={(e) =>
                  handleChange("yearlyAmount", formatAmountInput(e.target.value))
                }
                placeholder="1,200,000"
                required
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="estate-bill-service-charge" className="font-medium">
                Service charge
              </Label>
              <button
                id="estate-bill-service-charge"
                type="button"
                role="switch"
                aria-checked={formData.isServiceCharge}
                aria-label="Service charge"
                onClick={() =>
                  handleChange("isServiceCharge", !formData.isServiceCharge)
                }
                className={cn(
                  "relative inline-flex h-7 w-[44px] shrink-0 cursor-pointer items-center rounded-full p-0.5",
                  "transition-colors duration-150 ease-out active:scale-[0.97]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0150AC]/40",
                  formData.isServiceCharge ? "bg-[#0150AC]" : "bg-black/15",
                )}
              >
                <span
                  className={cn(
                    "block size-6 rounded-full bg-white shadow-sm transition-transform duration-150",
                    formData.isServiceCharge ? "translate-x-4" : "translate-x-0",
                  )}
                />
              </button>
            </div>

            <div>
              <Label htmlFor="estate-bill-frequency">Frequency</Label>
              <Select
                id="estate-bill-frequency"
                aria-label="Select frequency"
                value={formData.frequency}
                onChange={(e) => handleChange("frequency", e.target.value)}
                options={billFrequencyOptions(isServiceChargeBill)}
                required
              />
            </div>

            {!isServiceChargeBill ? (
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="estate-bill-compulsory" className="font-medium">
                  Compulsory bill
                </Label>
                <button
                  id="estate-bill-compulsory"
                  type="button"
                  role="switch"
                  aria-checked={formData.compulsory}
                  aria-label="Compulsory bill"
                  onClick={() =>
                    handleChange("compulsory", !formData.compulsory)
                  }
                  className={cn(
                    "relative inline-flex h-7 w-[44px] shrink-0 cursor-pointer items-center rounded-full p-0.5",
                    "transition-colors duration-150 ease-out active:scale-[0.97]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0150AC]/40",
                    formData.compulsory ? "bg-[#0150AC]" : "bg-black/15",
                  )}
                >
                  <span
                    className={cn(
                      "block size-6 rounded-full bg-white shadow-sm transition-transform duration-150",
                      formData.compulsory ? "translate-x-4" : "translate-x-0",
                    )}
                  />
                </button>
              </div>
            ) : null}
          </div>
        )}

        <div className="pt-4">
          <Button type="submit" className="w-full" disabled={!formData.name.trim()}>
            {initialData?.id ? "Update Bill" : "Create Bill"}
          </Button>
        </div>
      </CardContent>
    </form>
  );
}
