export type VisitingType = "SHORT_VISIT" | "LONG_VISIT";

export interface ResidentVisitorData {
  id: string;
  visitorCode: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  purpose?: string;
  isVerified: boolean;
  checkoutTime?: string;
  isCheckedOut: boolean;
  createdAt: string;
  updatedAt?: string;
  addressId?: string | { id: string; data?: Record<string, unknown> } | null;
  estateId?: unknown;
  residentId?: unknown;
  visitingType?: VisitingType;
  visitStartDate?: string | null;
  visitEndDate?: string | null;
  validFrom?: string | null;
  validUntil?: string | null;
  qrCodeDataUrl?: string;
  qrCodeGenerated?: boolean;
  inviteLink?: string;
  inviteToken?: string;
  verificationCode?: string;
}

