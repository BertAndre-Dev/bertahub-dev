/** Shared type for visitor view-details API response (used by security visitor-management, verify-visitor, view-visitor). */
export type VisitingType = "SHORT_VISIT" | "LONG_VISIT";

export interface VisitorDetailsData {
  id: string;
  visitorCode: string;
  residentId?: { id: string; firstName: string; lastName: string } | null;
  estateId?: { id: string; name: string };
  addressId?: { id: string; data: Record<string, string> };
  firstName: string;
  lastName: string;
  phone?: string;
  purpose?: string;
  isVerified?: boolean;
  visitingType?: VisitingType;
  visitEndDate?: string | null;
  verificationCode?: string;
  createdAt?: string;
  updatedAt?: string;
  viewedBy?: { id: string; firstName: string; lastName: string; role?: string };
  verifiedBy?: { id: string; firstName: string; lastName: string; role?: string };
  validFrom?: string;
  validUntil?: string;
  /** When the visitor was checked in (if API returns it). */
  checkedInAt?: string;
  /** When the visitor was checked out (if API returns it). */
  checkedOutAt?: string;
}
