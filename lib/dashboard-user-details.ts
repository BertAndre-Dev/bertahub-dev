export interface DashboardUserAddressRef {
  id: string;
  data: Record<string, string>;
}

export interface DashboardUserDetails {
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string;
  dateOfBirth: string;
  gender: string;
  phoneNumber: string;
  address: string;
  role: string;
  image?: string;
  isActive?: boolean;
  createdAt?: string;
  invitationStatus?: string;
  updatedAt?: string;
  id?: string;
  _id?: string;
  addressId?: string;
  addressIds?: DashboardUserAddressRef[];
  residentType?: string;
  serviceCharge?: boolean;
  estateId?: string | null;
  suspendedAt?: string | null;
  suspendedBy?: string | null;
  suspensionReason?: string | null;
}
