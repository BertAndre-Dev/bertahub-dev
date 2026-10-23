import { Suspense } from "react";
import { ReportHeadEntriesPage } from "@/components/dashboard/estate-admin/reports/ReportHeadEntriesPage";

export default function RevenueHeadEntriesRoute() {
  return (
    <Suspense>
      <ReportHeadEntriesPage kind="revenue" />
    </Suspense>
  );
}
