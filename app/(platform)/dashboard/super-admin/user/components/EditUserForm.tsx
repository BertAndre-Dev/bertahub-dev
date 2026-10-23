"use client";

import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/redux/store";
import {
  getUser,
  updateUser,
} from "@/redux/slice/super-admin/super-admin-user/super-admin-user";
import EditUserForm, {
  type EditUserFormProps,
} from "@/components/user-mgt/edit-user-form";

type SuperAdminEditUserFormProps = Omit<
  EditUserFormProps,
  "fetchUser" | "saveUser"
>;

export default function SuperAdminEditUserForm({
  userId,
  close,
  onUpdated,
}: SuperAdminEditUserFormProps) {
  const dispatch = useDispatch<AppDispatch>();

  return (
    <EditUserForm
      userId={userId}
      close={close}
      onUpdated={onUpdated}
      fetchUser={(id) => dispatch(getUser(id)).unwrap()}
      saveUser={(id, data) => dispatch(updateUser({ id, data })).unwrap()}
    />
  );
}
