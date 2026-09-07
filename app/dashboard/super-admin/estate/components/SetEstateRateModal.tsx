"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import Select from "react-select";
import { toast } from "react-toastify";
import { Plus, Trash2 } from "lucide-react";
import Modal from "@/components/modal/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Loader from "@/components/ui/Loader";
import type { AppDispatch, RootState } from "@/redux/store";
import {
  getBanks,
  type BankItem,
} from "@/redux/slice/estate-admin/fund-wallet/fund-wallet";
import {
  getEffectiveRate,
  getRates,
  pickEditableRate,
  upsertRate,
  type RateFeeType,
  type RateSplit,
} from "@/redux/slice/super-admin/rates/rates";
import { getApiErrorMessage } from "@/lib/api-error";

type BankOption = { value: string; label: string };

type SplitDraft = {
  id: string;
  percent: string;
  bankCode: string;
  accountNumber: string;
  label: string;
};

const FEE_TYPE_OPTIONS: { value: RateFeeType; label: string }[] = [
  { value: "VENDING", label: "Vending" },
  { value: "BILL_PAYMENT", label: "Bill payment" },
];

type Props = Readonly<{
  open: boolean;
  estateId: string;
  initialFeeType?: RateFeeType;
  onClose: () => void;
  onSuccess: (feeType: RateFeeType) => void;
}>;

function dedupeBanksByCode(banks: BankItem[]): BankItem[] {
  const seen = new Set<string>();
  return banks.filter((bank) => {
    const code = String(bank.code ?? "").trim();
    if (!code || seen.has(code)) return false;
    seen.add(code);
    return true;
  });
}

function createEmptySplit(): SplitDraft {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    percent: "",
    bankCode: "",
    accountNumber: "",
    label: "Platform fee",
  };
}

function splitsToDrafts(splits: RateSplit[]): SplitDraft[] {
  if (!splits.length) return [createEmptySplit()];
  return splits.map((split, index) => ({
    id: `rate-split-${index}-${split.bankCode}-${split.accountNumber}`,
    percent: split.percent != null ? String(split.percent) : "",
    bankCode: String(split.bankCode ?? ""),
    accountNumber: String(split.accountNumber ?? ""),
    label: String(split.label ?? "Platform fee"),
  }));
}

export function SetEstateRateModal({
  open,
  estateId,
  initialFeeType = "VENDING",
  onClose,
  onSuccess,
}: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const [feeType, setFeeType] = useState<RateFeeType>(initialFeeType);
  const [splits, setSplits] = useState<SplitDraft[]>([createEmptySplit()]);
  const [notes, setNotes] = useState("");
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { banks, banksLoading } = useSelector((state: RootState) => ({
    banks: state.estateAdminFundWallet?.banks ?? [],
    banksLoading:
      state.estateAdminFundWallet?.getBanksState === "isLoading",
  }));

  const bankOptions = useMemo<BankOption[]>(
    () =>
      dedupeBanksByCode(banks).map((bank) => ({
        value: String(bank.code),
        label: `${bank.name} (${bank.code})`,
      })),
    [banks],
  );

  useEffect(() => {
    if (!open) return;
    setFeeType(initialFeeType);
  }, [open, initialFeeType]);

  useEffect(() => {
    if (!open || !estateId) return;

    let cancelled = false;

    (async () => {
      setLoadingInitial(true);
      dispatch(getBanks({ country: "NG", gatewayType: "flutterwave" })).catch(
        () => {},
      );

      try {
        const [estateRatesRes, effectiveRes] = await Promise.all([
          dispatch(
            getRates({ scope: "ESTATE", estateId, feeType }),
          ).unwrap(),
          dispatch(getEffectiveRate({ estateId, feeType })).unwrap(),
        ]);

        if (cancelled) return;

        const editable = pickEditableRate({
          estateRates: estateRatesRes?.data ?? [],
          effective: effectiveRes?.data ?? null,
        });

        setSplits(splitsToDrafts(editable.splits));
        setNotes(editable.notes);
      } catch {
        if (!cancelled) {
          setSplits([createEmptySplit()]);
          setNotes("");
        }
      } finally {
        if (!cancelled) setLoadingInitial(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, estateId, feeType, dispatch]);

  const updateSplit = (id: string, patch: Partial<SplitDraft>) => {
    setSplits((prev) =>
      prev.map((split) => (split.id === id ? { ...split, ...patch } : split)),
    );
  };

  const removeSplit = (id: string) => {
    setSplits((prev) =>
      prev.length <= 1 ? prev : prev.filter((split) => split.id !== id),
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const parsedSplits: RateSplit[] = [];
    for (const split of splits) {
      const percent = Number(split.percent);
      if (!split.percent.trim() || Number.isNaN(percent) || percent <= 0) {
        toast.error("Each split needs a percent greater than 0.");
        return;
      }
      if (!split.bankCode) {
        toast.error("Select a bank for each split.");
        return;
      }
      if (!split.accountNumber.trim()) {
        toast.error("Enter an account number for each split.");
        return;
      }
      if (!split.label.trim()) {
        toast.error("Enter a label for each split.");
        return;
      }
      parsedSplits.push({
        percent,
        bankCode: split.bankCode,
        accountNumber: split.accountNumber.trim(),
        label: split.label.trim(),
      });
    }

    const totalPercent = parsedSplits.reduce(
      (sum, split) => sum + split.percent,
      0,
    );
    if (totalPercent > 100) {
      toast.error("Split percents cannot total more than 100%.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await dispatch(
        upsertRate({
          scope: "ESTATE",
          feeType,
          estateId,
          splits: parsedSplits,
          notes: notes.trim() || undefined,
        }),
      ).unwrap();
      toast.success(res?.message ?? "Rate saved successfully.");
      onSuccess(feeType);
      onClose();
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={open}
      onClose={onClose}
      contentClassName="md:w-[640px] max-w-[640px] max-h-[85vh]"
    >
      <form onSubmit={handleSubmit} className="space-y-5 pr-6">
        <div>
          <h2 className="font-heading text-lg font-bold text-foreground">
            Set rate
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Edit the existing fee split, then save to update.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="set-rate-fee-type">Fee type</Label>
          <select
            id="set-rate-fee-type"
            value={feeType}
            onChange={(e) => setFeeType(e.target.value as RateFeeType)}
            disabled={loadingInitial || submitting}
            className="w-full rounded-md border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer disabled:opacity-60"
          >
            {FEE_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {loadingInitial ? (
          <div className="py-10">
            <Loader label="Loading rate..." />
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <Label>Fee splits</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 cursor-pointer"
                  onClick={() =>
                    setSplits((prev) => [...prev, createEmptySplit()])
                  }
                >
                  <Plus className="h-4 w-4" />
                  Add split
                </Button>
              </div>

              {splits.map((split, index) => {
                const selectedBank =
                  bankOptions.find((o) => o.value === split.bankCode) ?? null;

                return (
                  <div
                    key={split.id}
                    className="rounded-lg border border-border p-3 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">Split {index + 1}</p>
                      {splits.length > 1 ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive cursor-pointer"
                          onClick={() => removeSplit(split.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor={`split-percent-${split.id}`}>
                          Percent
                        </Label>
                        <Input
                          id={`split-percent-${split.id}`}
                          type="number"
                          min={0}
                          step="0.01"
                          value={split.percent}
                          onChange={(e) =>
                            updateSplit(split.id, { percent: e.target.value })
                          }
                          placeholder="e.g. 1"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`split-label-${split.id}`}>Label</Label>
                        <Input
                          id={`split-label-${split.id}`}
                          value={split.label}
                          onChange={(e) =>
                            updateSplit(split.id, { label: e.target.value })
                          }
                          placeholder="Platform fee"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Bank</Label>
                      <Select
                        options={bankOptions}
                        value={selectedBank}
                        onChange={(option) =>
                          updateSplit(split.id, {
                            bankCode: option?.value ?? "",
                          })
                        }
                        isLoading={banksLoading}
                        isSearchable
                        placeholder="Select bank"
                        className="text-sm"
                        styles={{
                          control: (base) => ({ ...base, cursor: "pointer" }),
                          option: (base) => ({ ...base, cursor: "pointer" }),
                        }}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor={`split-account-${split.id}`}>
                        Account number
                      </Label>
                      <Input
                        id={`split-account-${split.id}`}
                        value={split.accountNumber}
                        onChange={(e) =>
                          updateSplit(split.id, {
                            accountNumber: e.target.value.replace(/\D/g, ""),
                          })
                        }
                        placeholder="10-digit account number"
                        inputMode="numeric"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rate-notes">Notes (optional)</Label>
              <Input
                id="rate-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional note"
              />
            </div>
          </>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="cursor-pointer"
            disabled={submitting || loadingInitial}
          >
            {submitting ? "Saving…" : "Save rate"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
