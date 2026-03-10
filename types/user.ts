// types/user.ts
export interface EstateRef {
  id: string;
  name: string;
}

export interface SignedInUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "admin" | "owner" | "tenant";
  residentType: string | null;
  estateId: EstateRef;
  addressIds: string[];
  isActive: boolean;
  isVerified: boolean;
  isMobileUser: boolean;
  serviceCharge: boolean;
  walletId: string | null;
  invitationStatus: string;
  createdAt: string;
  updatedAt: string;
}