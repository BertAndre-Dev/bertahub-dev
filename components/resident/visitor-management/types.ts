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
}

