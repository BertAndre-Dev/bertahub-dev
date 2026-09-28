"use client";

import Table from "@/components/tables/list/page";
import { getDateRangePlaceholders } from "@/lib/date-range-placeholders";
import type { EnergyProviderVendRow } from "@/lib/energy-provider-vends";
import {
  formatVendCurrency,
  formatVendDate,
  resolveProviderPayout,
  resolveVendCommission,
  vendResidentName,
} from "@/lib/energy-provider-vends";

type Props = {
  data: EnergyProviderVendRow[];
  startDate: string;
  endDate: string;
  onDateRangeChange: (range: { startDate: string; endDate: string }) => void;
  paginationInfo: { total: number; current: number; pageSize: number };
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onExportRequest?: () => Promise<EnergyProviderVendRow[]>;
};

const columns = [
  {
    key: "createdAt",
    header: "Date",
    render: (item: EnergyProviderVendRow) => formatVendDate(item.createdAt),
    exportValue: (item: EnergyProviderVendRow) => item.createdAt ?? "",
  },
  {
    key: "resident",
    header: "Resident",
    render: (item: EnergyProviderVendRow) => vendResidentName(item),
    exportValue: (item: EnergyProviderVendRow) => vendResidentName(item),
  },
  {
    key: "email",
    header: "Email",
    render: (item: EnergyProviderVendRow) => item.user?.email ?? "—",
    exportValue: (item: EnergyProviderVendRow) => item.user?.email ?? "",
  },
  {
    key: "meterNumber",
    header: "Meter",
    render: (item: EnergyProviderVendRow) => item.meterNumber ?? "—",
    exportValue: (item: EnergyProviderVendRow) => item.meterNumber ?? "",
  },
  {
    key: "amount",
    header: "Amount",
    render: (item: EnergyProviderVendRow) => formatVendCurrency(item.amount),
    exportValue: (item: EnergyProviderVendRow) =>
      item.amount != null ? String(item.amount) : "",
  },
  {
    key: "commission",
    header: "Commission",
    render: (item: EnergyProviderVendRow) =>
      formatVendCurrency(resolveVendCommission(item)),
    exportValue: (item: EnergyProviderVendRow) => {
      const value = resolveVendCommission(item);
      return value != null ? String(value) : "";
    },
  },
  {
    key: "providerPayout",
    header: "Provider payout",
    render: (item: EnergyProviderVendRow) =>
      formatVendCurrency(resolveProviderPayout(item)),
    exportValue: (item: EnergyProviderVendRow) => {
      const value = resolveProviderPayout(item);
      return value != null ? String(value) : "";
    },
  },
  {
    key: "energyValue",
    header: "Energy (kWh)",
    render: (item: EnergyProviderVendRow) => {
      const value = item.fullResponse?.energyList?.[0]?.value ?? null;
      if (value == null || value === "") return "—";
      return String(value);
    },
    exportValue: (item: EnergyProviderVendRow) => {
      const value = item.fullResponse?.energyList?.[0]?.value ?? "";
      return value == null ? "" : String(value);
    },
  },
];

const DATE_RANGE_PLACEHOLDERS = getDateRangePlaceholders();

export default function EnergyProviderVendsTab({
  data,
  startDate,
  endDate,
  onDateRangeChange,
  paginationInfo,
  onPageChange,
  onPageSizeChange,
  onExportRequest,
}: Readonly<Props>) {
  return (
    <Table
      columns={columns}
      data={data}
      emptyMessage="No vend history found for this estate"
      enableDateRangeFilter
      defaultDateRangeDays={0}
      startDatePlaceholder={DATE_RANGE_PLACEHOLDERS.start}
      endDatePlaceholder={DATE_RANGE_PLACEHOLDERS.end}
      startDate={startDate}
      endDate={endDate}
      onDateRangeChange={onDateRangeChange}
      showPagination
      paginationInfo={paginationInfo}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      enableExport
      exportFileName="energy-provider-vend-history"
      onExportRequest={onExportRequest}
    />
  );
}
