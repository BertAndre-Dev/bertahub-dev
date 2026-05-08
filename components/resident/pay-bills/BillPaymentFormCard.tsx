"use client";

import React, { useMemo, useState } from "react";

import type {
  BillsCategory,
  BillsBiller,
  BillsItem,
} from "@/redux/slice/resident/bills-payment/bills-payment";
import type { ResidentBillsPaymentState } from "@/redux/slice/resident/bills-payment/bills-payment-slice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PinInputRow } from "@/components/resident/pay-bills/SetUpPinCard";

// ─── resolver helpers ────────────────────────────────────────────────────────

function resolveCategoryCode(c: BillsCategory) {
  return (
    (c.category_code as string) ||
    (c.code as string) ||
    (c.product as string) ||
    ""
  );
}
function resolveCategoryName(c: BillsCategory) {
  return (
    (c.name as string) || (c.label as string) || resolveCategoryCode(c) || "—"
  );
}
function resolveBillerCode(b: BillsBiller) {
  return (b.biller_code as string) || (b.code as string) || "";
}
function resolveBillerName(b: BillsBiller) {
  return (
    (b.name as string) ||
    (b.label as string) ||
    (b.short_name as string) ||
    resolveBillerCode(b) ||
    "—"
  );
}
function resolveItemCode(i: BillsItem) {
  return (
    (i.item_code as string) ||
    (i.code as string) ||
    (i.service_type as string) ||
    ""
  );
}
function resolveItemName(i: BillsItem) {
  return (i.name as string) || (i.label as string) || resolveItemCode(i) || "—";
}

/** Keep first row per non-empty code so `<option value>` stays unique in native selects. */
function dedupeByResolvedCode<T>(items: T[], codeFn: (row: T) => string): T[] {
  const seen = new Set<string>();
  let keptEmptyCode = false;
  const out: T[] = [];
  for (const row of items) {
    const code = codeFn(row).trim();
    if (!code) {
      if (!keptEmptyCode) {
        keptEmptyCode = true;
        out.push(row);
      }
      continue;
    }
    if (seen.has(code)) continue;
    seen.add(code);
    out.push(row);
  }
  return out;
}

// ─── types ───────────────────────────────────────────────────────────────────

export type BillPaymentFormCardProps = Readonly<{
  billsPayment: ResidentBillsPaymentState;
  country: string;
  onCountryChange: (value: string) => void;
  categoryCode: string;
  onCategoryChange: (value: string) => void;
  billerCode: string;
  onBillerChange: (value: string) => void;
  itemCode: string;
  onItemChange: (value: string) => void;
  customerId: string;
  onCustomerIdChange: (value: string) => void;
  billRef: string;
  onBillRefChange: (value: string) => void;
  amount: string;
  onAmountChange: (value: string) => void;
  pin: string;
  onPinChange: (value: string) => void;
  onPay: () => void;
}>;

// ─── step config ─────────────────────────────────────────────────────────────

const STEPS = [
  {
    id: 1,
    label: "Service",
    description: "Choose a bill category and provider",
  },
  {
    id: 2,
    label: "Details",
    description: "Enter your account details and amount",
  },
  { id: 3, label: "Confirm", description: "Review and authorise payment" },
];

// ─── sub-components ──────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((step, idx) => {
        const done = current > step.id;
        const active = current === step.id;
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div
                className={[
                  "w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300",
                  done
                    ? "bg-emerald-500 text-white"
                    : active
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : "bg-muted text-muted-foreground",
                ].join(" ")}
              >
                {done ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M3 8l3.5 3.5L13 4.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  step.id
                )}
              </div>
              <span
                className={[
                  "text-xs font-medium whitespace-nowrap",
                  active ? "text-foreground" : "text-muted-foreground",
                ].join(" ")}
              >
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={[
                  "h-px flex-1 mx-2 mb-5 transition-colors duration-500",
                  done ? "bg-emerald-400" : "bg-border",
                ].join(" ")}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-sm font-medium text-foreground block mb-1.5"
    >
      {children}
    </label>
  );
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-muted-foreground mt-1">{children}</p>;
}

function SummaryRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={[
          "text-sm font-medium",
          highlight ? "text-primary text-base" : "text-foreground",
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  );
}

// ─── main component ──────────────────────────────────────────────────────────

export function BillPaymentFormCard({
  billsPayment,
  country,
  onCountryChange,
  categoryCode,
  onCategoryChange,
  billerCode,
  onBillerChange,
  itemCode,
  onItemChange,
  customerId,
  onCustomerIdChange,
  billRef,
  onBillRefChange,
  amount,
  onAmountChange,
  pin,
  onPinChange,
  onPay,
}: BillPaymentFormCardProps) {
  const [step, setStep] = useState(1);

  const categoriesUnique = useMemo(
    () =>
      dedupeByResolvedCode(billsPayment.categories ?? [], resolveCategoryCode)
        // Hide Utility Bills from the dropdown (API may still return it)
        .filter((c) => resolveCategoryCode(c) !== "UTILITYBILLS"),
    [billsPayment.categories],
  );
  const billersUnique = useMemo(
    () => dedupeByResolvedCode(billsPayment.billers ?? [], resolveBillerCode),
    [billsPayment.billers],
  );
  const itemsUnique = useMemo(
    () => dedupeByResolvedCode(billsPayment.items ?? [], resolveItemCode),
    [billsPayment.items],
  );

  const selectedCategory = categoriesUnique.find(
    (c) => resolveCategoryCode(c) === categoryCode,
  );
  const selectedBiller = billersUnique.find(
    (b) => resolveBillerCode(b) === billerCode,
  );
  const selectedItem = itemsUnique.find((i) => resolveItemCode(i) === itemCode);

  const pinDigits = useMemo(
    () => Array.from({ length: 4 }, (_, i) => pin[i] ?? ""),
    [pin],
  );

  const step1Valid = Boolean(categoryCode && billerCode && itemCode);
  const step2Valid = Boolean(customerId.trim() && amount && Number(amount) > 0);

  // ── step 1: service selection ──
  const renderStep1 = () => (
    <div className="space-y-5">
      <div>
        <FieldLabel htmlFor="bills-country">Country</FieldLabel>
        <Select
          id="bills-country"
          value={country}
          onChange={(e) => onCountryChange(e.target.value)}
          options={[
            { label: "Nigeria (NG)", value: "NG" },
            { label: "Ghana (GH)", value: "GH" },
            { label: "Kenya (KE)", value: "KE" },
            { label: "Uganda (UG)", value: "UG" },
          ]}
        />
        <FieldHint>Select the country your biller operates in.</FieldHint>
      </div>

      <div>
        <FieldLabel htmlFor="bills-category">Bill Category</FieldLabel>
        <Select
          id="bills-category"
          value={categoryCode}
          onChange={(e) => onCategoryChange(e.target.value)}
          disabled={billsPayment.getCategoriesStatus === "isLoading"}
          options={[
            {
              label:
                billsPayment.getCategoriesStatus === "isLoading"
                  ? "Loading categories…"
                  : "Select a category",
              value: "",
            },
            ...categoriesUnique.map((c) => ({
              label: resolveCategoryName(c),
              value: resolveCategoryCode(c),
            })),
          ]}
        />
      </div>

      <div>
        <FieldLabel htmlFor="bills-biller">Provider / Biller</FieldLabel>
        <Select
          id="bills-biller"
          value={billerCode}
          onChange={(e) => onBillerChange(e.target.value)}
          disabled={
            !categoryCode || billsPayment.getBillersStatus === "isLoading"
          }
          options={[
            {
              label: !categoryCode
                ? "Select a category first"
                : billsPayment.getBillersStatus === "isLoading"
                  ? "Loading billers…"
                  : "Select a provider",
              value: "",
            },
            ...billersUnique.map((b) => ({
              label: resolveBillerName(b),
              value: resolveBillerCode(b),
            })),
          ]}
        />
      </div>

      <div>
        <FieldLabel htmlFor="bills-item">Package / Plan</FieldLabel>
        <Select
          id="bills-item"
          value={itemCode}
          onChange={(e) => {
            const code = e.target.value;
            onItemChange(code);
            const item = itemsUnique.find((i) => resolveItemCode(i) === code);
            if (item?.amount != null && Number.isFinite(Number(item.amount))) {
              onAmountChange(String(item.amount));
            }
          }}
          disabled={!billerCode || billsPayment.getItemsStatus === "isLoading"}
          options={[
            {
              label: !billerCode
                ? "Select a provider first"
                : billsPayment.getItemsStatus === "isLoading"
                  ? "Loading plans…"
                  : "Select a plan",
              value: "",
            },
            ...itemsUnique.map((i) => ({
              label:
                i?.amount == null
                  ? resolveItemName(i)
                  : `${resolveItemName(i)} — ${i.currency ?? "₦"}${Number(i.amount).toLocaleString()}`,
              value: resolveItemCode(i),
            })),
          ]}
        />
        {selectedItem?.fee != null && (
          <FieldHint>
            Service fee: {selectedItem.currency ?? "₦"}
            {Number(selectedItem.fee).toLocaleString()}
          </FieldHint>
        )}
      </div>

      <div className="pt-2">
        <Button
          type="button"
          className="w-full"
          disabled={!step1Valid}
          onClick={() => setStep(2)}
        >
          Continue
          <svg className="ml-2 w-4 h-4" viewBox="0 0 16 16" fill="none">
            <path
              d="M3 8h10M9 4l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Button>
      </div>
    </div>
  );

  // ── step 2: customer details ──
  const renderStep2 = () => (
    <div className="space-y-5">
      {/* selected service summary pill */}
      <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-muted/50 border border-border text-sm">
        <span className="font-medium">
          {resolveCategoryName(selectedCategory!)}{" "}
        </span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">
          {resolveBillerName(selectedBiller!)}
        </span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">
          {resolveItemName(selectedItem!)}
        </span>
        <button
          type="button"
          className="ml-auto text-xs text-primary underline-offset-2 hover:underline"
          onClick={() => setStep(1)}
        >
          Change
        </button>
      </div>

      <div>
        <FieldLabel htmlFor="bills-customer-id">Customer Identifier</FieldLabel>
        <Input
          id="bills-customer-id"
          value={customerId}
          onChange={(e) => onCustomerIdChange(e.target.value)}
          placeholder="Phone / Meter number / Decoder number"
        />
        <FieldHint>
          Enter the unique ID linked to your account with this provider.
        </FieldHint>
      </div>

      {/* <div>
        <FieldLabel htmlFor="bills-ref">
          Bill Reference{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </FieldLabel>
        <Input
          id="bills-ref"
          value={billRef}
          onChange={(e) => onBillRefChange(e.target.value)}
          placeholder="e.g. 0025401100"
        />
        <FieldHint>Used for validation — leave blank if unsure.</FieldHint>
      </div> */}

      <div>
        <FieldLabel htmlFor="bills-amount">Amount</FieldLabel>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm select-none">
            ₦
          </span>
          <Input
            id="bills-amount"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            inputMode="numeric"
            placeholder="0.00"
            className="pl-7"
          />
        </div>
        {selectedItem?.amount != null && (
          <FieldHint>
            Preset amount: ₦{Number(selectedItem.amount).toLocaleString()} — you
            can adjust if needed.
          </FieldHint>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => setStep(1)}
        >
          Back
        </Button>
        <Button
          type="button"
          className="flex-1"
          disabled={!step2Valid}
          onClick={() => setStep(3)}
        >
          Review Payment
        </Button>
      </div>
    </div>
  );

  // ── step 3: confirm + pin ──
  const renderStep3 = () => (
    <div className="space-y-5">
      {/* summary card */}
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Payment Summary
        </p>
        <SummaryRow
          label="Category"
          value={resolveCategoryName(selectedCategory!)}
        />
        <SummaryRow
          label="Provider"
          value={resolveBillerName(selectedBiller!)}
        />
        <SummaryRow label="Package" value={resolveItemName(selectedItem!)} />
        <SummaryRow label="Customer ID" value={customerId} />
        {billRef && <SummaryRow label="Bill Reference" value={billRef} />}
        {selectedItem?.fee != null && (
          <SummaryRow
            label="Service Fee"
            value={`${selectedItem.currency ?? "₦"}${Number(selectedItem.fee).toLocaleString()}`}
          />
        )}
        <SummaryRow
          label="Amount"
          value={`₦${Number(amount).toLocaleString()}`}
          highlight
        />
      </div>

      {/* PIN — one digit per box */}
      <div>
        <p className="text-sm font-medium text-foreground block mb-1.5">
          Enter your 4-digit PIN to authorise
        </p>
          <PinInputRow
            label="PIN"
            hideLabel
            digits={pinDigits}
            onChange={(next) => onPinChange(next.join(""))}
            autoFocusFirst
          />
        <FieldHint>This is the PIN you set up for bill payments.</FieldHint>
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => setStep(2)}
        >
          Back
        </Button>
        <Button
          type="button"
          className="flex-1"
          onClick={onPay}
          disabled={
            billsPayment.payStatus === "isLoading" || pin.trim().length !== 4
          }
        >
          {billsPayment.payStatus === "isLoading" ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Processing…
            </span>
          ) : (
            <>Pay ₦{Number(amount).toLocaleString()}</>
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <Card className="p-6">
      <CardHeader className="px-0 md:px-0 pb-2">
        <CardTitle className="text-xl">Pay a Bill</CardTitle>
        <p className="text-sm text-muted-foreground mt-0.5">
          {STEPS.find((s) => s.id === step)?.description}
        </p>
      </CardHeader>

      <CardContent className="px-0 md:px-0 pt-6">
        <StepIndicator current={step} />

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </CardContent>
    </Card>
  );
}
