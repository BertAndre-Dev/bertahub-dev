import { redirect } from "next/navigation";

export default function EstateAdminDesignationsPage() {
  redirect("/dashboard/estate-admin/user?role=staff");
}
