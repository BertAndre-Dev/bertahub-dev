import { redirect } from "next/navigation";

export default function AdminDesignationsPage() {
  redirect("/dashboard/admin/user?role=staff");
}
