"use client";

import { useId } from "react";
import { Calendar } from "lucide-react";
import {
  IsoLinkedRangeEnd,
  IsoLinkedRangeStart,
} from "@/components/ui/iso-date-picker";
import { getDateRangePlaceholders } from "@/lib/date-range-placeholders";

const inputClassName =
  "w-full min-w-0 px-3 py-2 border rounded-lg text-sm cursor-pointer";

const fieldClassName =
  "flex min-w-0 w-full flex-col gap-1 @min-[24rem]/date-range:w-auto @min-[24rem]/date-range:min-w-36 @min-[24rem]/date-range:max-w-48 @min-[24rem]/date-range:flex-1 md:w-40 md:max-w-none md:flex-none";

const labelClassName = "text-xs font-medium text-muted-foreground";

type DateRangeFilterProps = {
  startDate: string;
  endDate: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  startPlaceholder?: string;
  endPlaceholder?: string;
  startId?: string;
  endId?: string;
};

/** Same From / to / To control used on super-admin transactions. */
export function DateRangeFilter({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  startPlaceholder,
  endPlaceholder,
  startId,
  endId,
}: Readonly<DateRangeFilterProps>) {
  const examples = getDateRangePlaceholders();
  const uid = useId();
  const startFieldId = startId ?? `${uid}-start`;
  const endFieldId = endId ?? `${uid}-end`;

  return (
    <div className="w-full min-w-0 md:w-fit">
      <div className="@container/date-range w-full md:contents">
        <div className="flex w-full min-w-0 flex-col gap-2 @min-[24rem]/date-range:flex-row @min-[24rem]/date-range:items-end md:w-auto md:flex-row md:items-end">
          <div className={fieldClassName}>
            <label htmlFor={startFieldId} className={labelClassName}>
              Start date
            </label>
            <IsoLinkedRangeStart
              id={startFieldId}
              startDate={startDate}
              endDate={endDate}
              onStartChange={onStartChange}
              onEndChange={onEndChange}
              className={inputClassName}
              ariaLabel="Start date"
              placeholder={startPlaceholder ?? examples.start}
            />
          </div>
          <span className="text-sm text-muted-foreground @min-[24rem]/date-range:mb-2.5 md:mb-2.5">
            to
          </span>
          <div className={fieldClassName}>
            <label htmlFor={endFieldId} className={labelClassName}>
              End date
            </label>
            <IsoLinkedRangeEnd
              id={endFieldId}
              startDate={startDate}
              endDate={endDate}
              onEndChange={onEndChange}
              className={inputClassName}
              ariaLabel="End date"
              placeholder={endPlaceholder ?? examples.end}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
