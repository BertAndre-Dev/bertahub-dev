"use client";

import { Input } from "@/components/ui/input";
import type { MaintenanceRecurringFields as RecurringState } from "@/lib/asset-maintenance-recurring";

type Props = {
  idPrefix?: string;
  value: RecurringState;
  onChange: (value: RecurringState) => void;
};

export default function MaintenanceRecurringFields({
  idPrefix = "maint",
  value,
  onChange,
}: Readonly<Props>) {
  const monthsId = `${idPrefix}-recurring-months`;
  const yearsId = `${idPrefix}-recurring-years`;

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
      <label
        htmlFor={`${idPrefix}-recurring`}
        className="flex cursor-pointer items-start gap-2.5"
      >
        <input
          id={`${idPrefix}-recurring`}
          type="checkbox"
          checked={value.recurring}
          onChange={(e) =>
            onChange({ ...value, recurring: e.target.checked })
          }
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-gray-300 text-[#0150AC] focus:ring-[#0150AC]"
        />
        <span>
          <span className="block text-sm font-medium">Recurring schedule</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            Set how long this maintenance plan should repeat.
          </span>
        </span>
      </label>

      {value.recurring && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor={monthsId} className="text-sm font-medium">
              Span (months)
            </label>
            <Input
              id={monthsId}
              type="number"
              min={0}
              placeholder="Months"
              value={value.recurringSpanMonths > 0 ? value.recurringSpanMonths : ""}
              onChange={(e) => {
                const raw = e.target.value;
                onChange({
                  ...value,
                  recurringSpanMonths:
                    raw === "" ? 0 : Math.max(0, Number(raw) || 0),
                });
              }}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor={yearsId} className="text-sm font-medium">
              Span (years)
            </label>
            <Input
              id={yearsId}
              type="number"
              min={0}
              placeholder="Years"
              value={value.recurringSpanYears > 0 ? value.recurringSpanYears : ""}
              onChange={(e) => {
                const raw = e.target.value;
                onChange({
                  ...value,
                  recurringSpanYears:
                    raw === "" ? 0 : Math.max(0, Number(raw) || 0),
                });
              }}
            />
          </div>
        </div>
      )}

      {value.recurring &&
        value.recurringSpanMonths <= 0 &&
        value.recurringSpanYears <= 0 && (
          <p className="text-xs text-destructive">
            Enter at least one month or year for the recurring span.
          </p>
        )}
    </div>
  );
}
