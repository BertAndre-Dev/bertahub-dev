"use client";

import { EstateUsersPage } from "@/components/estate-users/EstateUsersPage";

export default function AdminUserPage() {
  return (
    <EstateUsersPage
      basePath="/dashboard/admin/user"
      staffPolicy="company-only"
      invitePolicy="residents"
    />
  );
}
