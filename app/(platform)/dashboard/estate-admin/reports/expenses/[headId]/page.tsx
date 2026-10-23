import { Suspense } from "react";
import { ReportHeadEntriesPage } from "@/components/dashboard/estate-admin/reports/ReportHeadEntriesPage";

export default function ExpenseHeadEntriesRoute() {
  return (
    <Suspense>
      <ReportHeadEntriesPage kind="expense" />
    </Suspense>
  );
}
