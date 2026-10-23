import type { VisitorDetailsData } from "@/app/(platform)/dashboard/security/types";
import type {
  ScanVisitorParams,
  VerifyVisitorParams,
} from "@/redux/slice/security/visitor/visitor";

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

  const end = visitorDetails?.visitEndDate ?? visitorDetails?.validUntil;
  if (end) payload.visitEndDate = end;

  return payload;
}

export function buildVerifyPayload(
  visitorCode: string,
  visitorDetails?: VisitorDetailsData | null,
): VerifyVisitorParams {
  const trimmed = visitorCode.trim();
  const visitingType = visitorDetails?.visitingType ?? "SHORT_VISIT";
  const payload: VerifyVisitorParams = {
    visitorCode: trimmed,
    visitingType,
  };

  const end = visitorDetails?.visitEndDate ?? visitorDetails?.validUntil;
  if (end) payload.visitEndDate = end;

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
