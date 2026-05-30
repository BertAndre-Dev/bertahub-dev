import type { VisitorDetailsData } from "@/app/dashboard/security/types";
import type { ScanVisitorParams } from "@/redux/slice/security/visitor/visitor";

export function buildScanPayload(
  barcode: string,
  visitorDetails?: VisitorDetailsData | null,
): ScanVisitorParams {
  const trimmed = barcode.trim();
  const visitingType = visitorDetails?.visitingType ?? "SHORT_VISIT";
  const payload: ScanVisitorParams = {
    barcode: trimmed,
    visitingType,
  };

  if (visitingType === "LONG_VISIT") {
    const end = visitorDetails?.visitEndDate ?? visitorDetails?.validUntil;
    if (end) payload.visitEndDate = end;
  }

  return payload;
}

export function mapScanResponseToVisitorDetails(
  payload: unknown,
): VisitorDetailsData | null {
  const data =
    (payload as { data?: VisitorDetailsData })?.data ??
    (payload as VisitorDetailsData | null);
  if (!data || typeof data !== "object" || !("visitorCode" in data)) return null;
  return data;
}
