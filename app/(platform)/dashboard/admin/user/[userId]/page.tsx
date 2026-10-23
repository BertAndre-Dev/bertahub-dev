"use client";

import { useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import type { AppDispatch, RootState } from "@/redux/store";
import { getApiErrorMessage } from "@/lib/api-error";
import { isPending } from "@/lib/async-status";
import {
  activateUser,
  deleteUser,
  getUser,
  suspendUser,
  updateUser,
} from "@/redux/slice/admin/user-mgt/user";
import UserDetailView from "@/app/(platform)/dashboard/admin/user/components/AdminUserDetailView";

const ADMIN_USER_ACTIONS = {
  getUser,
  activateUser,
  suspendUser,
  deleteUser,
  updateUser,
};

export default function AdminUserDetailPage() {
  const dispatch = useDispatch<AppDispatch>();
  const params = useParams<{ userId: string }>();
  const userId = params?.userId ?? "";

  const { user, loading } = useSelector((state: RootState) => ({
    user: state.adminUser.user,
    loading: isPending(state.adminUser.getUserState),
  }));

  const fetchUser = useCallback(async () => {
    if (!userId) return;
    try {
      await dispatch(getUser(userId)).unwrap();
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
      listPath="/dashboard/admin/user"
      actions={ADMIN_USER_ACTIONS}
      showTransactions
    />
  );
}
