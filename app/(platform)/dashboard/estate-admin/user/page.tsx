"use client";

import { EstateUsersPage } from "@/components/estate-users/EstateUsersPage";

export default function EstateAdminUserPage() {
  return (
    <EstateUsersPage
      basePath="/dashboard/estate-admin/user"
      staffPolicy="estate-always"
      allowAdminRole
      invitePolicy="staff"
      manageDesignations
      canEditStaff
    />
  );
}
