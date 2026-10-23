"use client";

import { EstateUsersPage } from "@/components/estate-users/EstateUsersPage";

export default function StaffUserPage() {
  return (
    <EstateUsersPage
      basePath="/dashboard/staff/user"
      staffPolicy="estate-always"
    />
  );
}
