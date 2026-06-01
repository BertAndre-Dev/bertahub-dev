"use client";

import type { OperationsReportingType } from "@/redux/slice/admin/operations-reporting/admin-operations-reporting";
import OperationsReportingFillReportPanel from "./OperationsReportingFillReportPanel";

type Props = {
  estateId: string;
  fillReportTabNonce: number;
  onEditType: (type: OperationsReportingType) => void;
  onDeleteType: (type: OperationsReportingType) => void;
};

export default function OperationsReportingReportsTab({
  estateId,
  fillReportTabNonce,
  onEditType,
  onDeleteType,
}: Readonly<Props>) {
  return (
    <OperationsReportingFillReportPanel
      estateId={estateId}
      variant="admin"
      fillReportTabNonce={fillReportTabNonce}
      onEditType={onEditType}
      onDeleteType={onDeleteType}
    />
  );
}
