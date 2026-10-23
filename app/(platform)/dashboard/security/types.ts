/** Shared visitor shape from gate / legacy view-details responses. */
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
  isCheckedOut?: boolean;
  visitingType?: VisitingType;
  visitStartDate?: string | null;
  visitEndDate?: string | null;
  verificationCode?: string;
  createdAt?: string;
  updatedAt?: string;
  viewedBy?: { id: string; firstName: string; lastName: string; role?: string };
  verifiedBy?: { id: string; firstName: string; lastName: string; role?: string };
  checkedOutBy?: { id: string; firstName: string; lastName: string; role?: string };
  validFrom?: string;
  validUntil?: string;
  checkinTime?: string | null;
  checkoutTime?: string | null;
  verificationMode?: string;
  /** Echoed when present on gate responses */
  action?: string;
  nextAction?: string | null;
}
