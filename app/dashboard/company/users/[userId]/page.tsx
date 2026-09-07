"use client";

import { useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import type { AppDispatch, RootState } from "@/redux/store";
import { getApiErrorMessage } from "@/lib/api-error";
import { isPending } from "@/lib/async-status";
import type { DashboardUserDetails } from "@/lib/dashboard-user-details";
import {
  activateCompanyUser,
  deleteCompanyUser,
  getCompanyUser,
  suspendCompanyUser,
  updateCompanyUser,
} from "@/redux/slice/company/user-mgt/company-user";
import {
  selectCompanyUserState,
} from "@/redux/slice/company/user-mgt/company-user-slice";
import UserDetailView from "@/app/dashboard/admin/user/components/AdminUserDetailView";

const COMPANY_USER_ACTIONS = {
  getUser: getCompanyUser,
  activateUser: activateCompanyUser,
  suspendUser: suspendCompanyUser,
  deleteUser: deleteCompanyUser,
  updateUser: updateCompanyUser,
};

export default function CompanyUserDetailPage() {
  const dispatch = useDispatch<AppDispatch>();
  const params = useParams<{ userId: string }>();
  const userId = params?.userId ?? "";

  const { user, loading } = useSelector((state: RootState) => {
    const companyUser = selectCompanyUserState(state);
    return {
      user: companyUser.user as DashboardUserDetails | null,
      loading: isPending(companyUser.getUserStatus),
    };
  });

  const fetchUser = useCallback(async () => {
    if (!userId) return;
    try {
      await dispatch(getCompanyUser(userId)).unwrap();
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    }
  }, [dispatch, userId]);

  useEffect(() => {
    fetchUser().catch(() => {});
  }, [fetchUser]);

  return (
    <UserDetailView
      userId={userId}
      user={user}
      userLoading={loading}
      listPath="/dashboard/company/users?role=resident"
      actions={COMPANY_USER_ACTIONS}
    />
  );
}
