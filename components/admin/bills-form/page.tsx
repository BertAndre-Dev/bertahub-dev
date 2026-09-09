"use client";

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import {
  BILL_FREQUENCY_OPTIONS,
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
  shouldHideInterestStartsAt,
  toInterestStartDate,
} from "@/components/admin/bills-form/accrue-interest-fields";
import { cn } from "@/lib/utils";

/** Form state: yearlyAmount can be string (empty input) or number */
interface BillFormState {
  estateId: string;
  name: string;
  description: string;
  yearlyAmount: number | string;
  frequency: BillFrequency;
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
  const [formData, setFormData] = useState<BillFormState>({
    estateId,
    id: initialData?.id,
    name: initialData?.name ?? "",
    description: initialData?.description ?? "",
    yearlyAmount:
      seededAmount != null ? formatAmountInput(String(seededAmount)) : "",
    frequency: normalizeBillFrequency(initialData?.frequency, "yearly"),
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
            frequency: normalizeBillFrequency(fetchData.frequency, "yearly"),
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
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const hideInterestStartsAt = shouldHideInterestStartsAt(formData.frequency);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const interestRate = formData.accrueInterest
      ? Number(formData.interestRatePercent)
      : 0;
    if (
      formData.accrueInterest &&
      (!Number.isFinite(interestRate) || interestRate < 0)
    ) {
      toast.error("Please enter a valid interest rate.");
      return;
    }
    if (
      formData.accrueInterest &&
      !hideInterestStartsAt &&
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
      frequency: formData.frequency,
      compulsory: formData.compulsory,
      accrueInterest: formData.accrueInterest,
      interestRatePercent: interestRate,
      interestStartsAt:
        formData.accrueInterest && !hideInterestStartsAt
          ? formData.interestStartsAt
          : undefined,
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

            <div>
              <Label htmlFor="estate-bill-frequency">Frequency</Label>
              <Select
                id="estate-bill-frequency"
                aria-label="Select frequency"
                value={formData.frequency}
                onChange={(e) => handleChange("frequency", e.target.value)}
                options={BILL_FREQUENCY_OPTIONS}
                required
              />
            </div>

            <AccrueInterestFields
              idPrefix="estate-bill"
              accrueInterest={formData.accrueInterest}
              interestRatePercent={formData.interestRatePercent}
              interestStartsAt={formData.interestStartsAt}
              hideInterestStartsAt={hideInterestStartsAt}
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
                onClick={() => handleChange("compulsory", !formData.compulsory)}
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
